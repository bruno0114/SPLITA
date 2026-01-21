import React, { useState, useRef } from 'react';
import { Settings, Upload, Check, ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Coffee, PlayCircle, Fuel, Utensils, Zap, FileText, X, Loader2, Image as ImageIcon, Sparkles, BrainCircuit, Plus, AlertCircle, History } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Transaction, AppRoute } from '@/types/index';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { getGeminiClient, extractExpensesFromImages } from '@/services/ai';
import StardustOverlay from '@/components/ai/StardustOverlay';
import { useAIHistory } from '@/features/expenses/hooks/useAIHistory';
import { useCategories } from '@/features/analytics/hooks/useCategories';
import { getOffTopicJoke } from '@/lib/ai-prompts';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { Wallet, Users } from 'lucide-react';

// Define the stages of the import process
type ImportStep = 'upload' | 'processing' | 'review' | 'saving';

const ImportExpenses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groups, loading: loadingGroups } = useGroups();
  const { uploadReceipt, saveSession } = useAIHistory();

  // Default to the first group if available, or user must select
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // We need the `addTransaction` from the hook. 
  const { addTransaction } = useTransactions(selectedGroupId === 'personal' ? null : selectedGroupId);
  const { addTransaction: addPersonalTransaction } = usePersonalTransactions();
  const { profile } = useProfile();
  const { categories, addCategory } = useCategories();

  const [step, setStep] = useState<ImportStep>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [scannedTransactions, setScannedTransactions] = useState<Transaction[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [offTopicJoke, setOffTopicJoke] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  // --- Gemini API Integration ---

  const processFilesWithGemini = async () => {
    if (files.length === 0) return;

    setError(null);
    setSuccess(null);
    setStep('processing');

    try {
      if (!profile) {
        throw new Error("PROFILE_LOADING");
      }

      // 1. Upload files to Storage for history
      const imageUrls = await Promise.all(files.map(file => uploadReceipt(file)));
      const validUrls = imageUrls.filter((url): url is string => url !== null);

      // 2. Prepare for Gemini
      const fileParts = await Promise.all(files.map(async file => {
        const base64Data = await fileToGenerativePart(file);
        const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        return { data: base64Data, mimeType };
      }));

      // 3. Extract data
      const extractedData = await extractExpensesFromImages(profile.gemini_api_key!, fileParts);

      // 4. Save session to DB
      await saveSession(validUrls, extractedData);

      if (extractedData.length === 0) {
        setOffTopicJoke(getOffTopicJoke());
        setStep('review');
        setScannedTransactions([]);
        return;
      }

      setOffTopicJoke(null);
      const mappedTransactions: Transaction[] = extractedData.map((item: any, index: number) => ({
        id: `scan-${Date.now()}-${index}`,
        date: new Date(item.date).toLocaleDateString('es-AR'), // Display format
        raw_date: item.date, // ISO YYYY-MM-DD from Gemini
        merchant: item.merchant,
        category: item.category,
        amount: item.amount,
        payer: user ? {
          id: user.id,
          name: user.user_metadata.full_name || user.user_metadata.name || 'Vos',
          avatar: user.user_metadata.avatar_url || ''
        } : { id: 'u1', name: 'Vos', avatar: '' },
        splitWith: [],
        icon: getCategoryIcon(item.category),
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        categoryColor: 'text-slate-600',
        categoryBg: 'bg-slate-100',
        original_amount: item.amount,
        original_currency: item.currency,
        is_recurring: item.is_recurring,
        installments: item.installments,
      }));

      setScannedTransactions(mappedTransactions);
      setStep('review');

    } catch (error: any) {
      console.error("Error scanning files with Gemini:", error);

      if (error.message === 'API_KEY_MISSING') {
        setShowConfig(true);
        setStep('upload');
      } else if (error.message === 'PROFILE_LOADING') {
        setError("Todavía estamos cargando tu perfil. Intentá de nuevo en un momento.");
        setStep('upload');
      } else {
        setError(error.message || "Error al procesar los comprobantes. Verificá tu API Key o intentá más tarde.");
        setStep('upload');
      }
    }
  };

  const fileToGenerativePart = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Handle both data:image/jpeg;base64,... and raw
        const base64String = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getCategoryIcon = (category: string): string => {
    const map: Record<string, string> = {
      'Supermercado': 'ShoppingCart',
      'Gastronomía': 'Utensils',
      'Servicios': 'Zap',
      'Transporte': 'Fuel',
      'Compras': 'ShoppingBag',
    };
    return map[category] || 'Receipt';
  };

  // --- REVIEW VIEW ---
  const [txSettings, setTxSettings] = useState<Record<string, {
    selected: boolean,
    exchangeRate: number,
    isRecurring: boolean,
    originalAmount: number,
    currency: string,
    installments: string | null
  }>>({});

  // Initialize settings when scannedTransactions changes
  React.useEffect(() => {
    if (scannedTransactions.length > 0) {
      const initialSettings: Record<string, any> = {};
      scannedTransactions.forEach(tx => {
        initialSettings[tx.id] = {
          selected: true,
          exchangeRate: tx.original_currency === 'USD' ? 1000 : 1, // Default approx rate
          isRecurring: tx.is_recurring || false,
          originalAmount: tx.amount,
          currency: tx.original_currency || 'ARS',
          installments: tx.installments || null
        };
      });
      setTxSettings(initialSettings);
    }
  }, [scannedTransactions]);

  const toggleSelection = (id: string) => {
    setTxSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected }
    }));
  };

  const fetchDolarRates = async () => {
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/blue');
      const data = await res.json();
      if (data && data.venta) {
        const rate = data.venta;
        setTxSettings(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(id => {
            if (next[id].currency === 'USD') {
              next[id].exchangeRate = rate;
            }
          });
          return next;
        });
      }
    } catch (e) {
      console.error("Error fetching rates", e);
    }
  };

  const updateRate = (id: string, rate: string) => {
    const num = parseFloat(rate) || 0;
    setTxSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], exchangeRate: num }
    }));
  };

  const toggleRecurring = (id: string) => {
    setTxSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], isRecurring: !prev[id].isRecurring }
    }));
  };

  const calculateConvertedAmount = (id: string) => {
    const s = txSettings[id];
    if (!s) return 0;
    return s.originalAmount * (s.currency === 'USD' ? s.exchangeRate : 1);
  };

  const totalConverted = Object.keys(txSettings)
    .filter(id => txSettings[id].selected)
    .reduce((acc, id) => acc + calculateConvertedAmount(id), 0);

  const handleConfirmImport = async () => {
    setError(null);
    console.log('[AI Import] Starting import process...');
    console.log('[AI Import] Selected group ID:', selectedGroupId);

    if (!selectedGroupId) {
      setError("Por favor seleccioná un destino (Personal o Grupo) para estos gastos.");
      return;
    }

    const selectedIds = Object.keys(txSettings).filter(id => txSettings[id].selected);
    console.log('[AI Import] Selected transaction IDs:', selectedIds);

    if (selectedIds.length === 0) {
      setError("No seleccionaste ningún gasto para importar.");
      return;
    }

    setStep('saving');
    let successCount = 0;
    const errors: string[] = [];

    try {
      // Helper to ensure category exists
      const ensureCategory = async (catName: string) => {
        const normalized = catName.trim();
        console.log('[AI Import] Checking category:', normalized);
        const exists = categories.find(c => c.name.toLowerCase() === normalized.toLowerCase());
        if (!exists) {
          try {
            console.log('[AI Import] Creating new category:', normalized);
            await addCategory({
              name: normalized,
              icon: 'LayoutGrid',
              color: 'text-indigo-500',
              bg_color: 'bg-indigo-500/10'
            });
            console.log('[AI Import] Category created successfully');
          } catch (e) {
            console.warn("[AI Import] Could not auto-create category:", normalized, e);
          }
        } else {
          console.log('[AI Import] Category already exists:', normalized);
        }
        return normalized;
      };

      if (selectedGroupId === 'personal') {
        console.log('[AI Import] Importing to PERSONAL account');
        for (const id of selectedIds) {
          const tx = scannedTransactions.find(t => t.id === id);
          const s = txSettings[id];
          if (!tx || !s) {
            console.warn('[AI Import] Skipping - transaction or settings not found:', id);
            continue;
          }

          console.log(`[AI Import] Processing transaction ${id}:`, {
            merchant: tx.merchant,
            amount: s.originalAmount,
            currency: s.currency,
            exchangeRate: s.exchangeRate,
            category: tx.category,
            date: tx.raw_date
          });

          const categoryName = await ensureCategory(tx.category);

          const payload = {
            title: tx.merchant,
            amount: s.originalAmount * (s.currency === 'USD' ? s.exchangeRate : 1),
            category: categoryName,
            type: 'expense' as const,
            date: tx.raw_date || new Date().toISOString(),
            original_amount: s.originalAmount,
            original_currency: s.currency,
            exchange_rate: s.currency === 'USD' ? s.exchangeRate : undefined,
            is_recurring: s.isRecurring,
            installments: s.installments
          };

          console.log('[AI Import] Calling addPersonalTransaction with payload:', payload);
          const { error } = await addPersonalTransaction(payload);

          if (error) {
            console.error(`[AI Import] ERROR saving transaction ${id}:`, error);
            errors.push(`${tx.merchant}: ${error}`);
          } else {
            console.log(`[AI Import] ✓ Transaction ${id} saved successfully`);
            successCount++;
          }
        }
      } else {
        console.log('[AI Import] Importing to GROUP:', selectedGroupId);
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        if (!selectedGroup) throw new Error("Grupo no encontrado");

        console.log('[AI Import] Group details:', {
          id: selectedGroup.id,
          name: selectedGroup.name,
          memberCount: selectedGroup.members.length
        });

        for (const id of selectedIds) {
          const tx = scannedTransactions.find(t => t.id === id);
          const s = txSettings[id];
          if (!tx || !s) {
            console.warn('[AI Import] Skipping - transaction or settings not found:', id);
            continue;
          }

          console.log(`[AI Import] Processing group transaction ${id}:`, {
            merchant: tx.merchant,
            amount: s.originalAmount,
            currency: s.currency,
            category: tx.category
          });

          const categoryName = await ensureCategory(tx.category);

          const payload = {
            amount: s.originalAmount * (s.currency === 'USD' ? s.exchangeRate : 1),
            category: categoryName,
            title: tx.merchant,
            date: tx.raw_date || new Date().toISOString(),
            splitBetween: selectedGroup.members.map(m => m.id),
            original_amount: s.originalAmount,
            original_currency: s.currency,
            exchange_rate: s.currency === 'USD' ? s.exchangeRate : undefined,
            is_recurring: s.isRecurring,
            installments: s.installments
          };

          console.log('[AI Import] Calling addTransaction with payload:', payload);
          const { error } = await addTransaction(payload);

          if (error) {
            console.error(`[AI Import] ERROR saving group transaction ${id}:`, error);
            errors.push(`${tx.merchant}: ${error}`);
          } else {
            console.log(`[AI Import] ✓ Group transaction ${id} saved successfully`);
            successCount++;
          }
        }
      }

      console.log('[AI Import] Import complete. Success count:', successCount, 'Errors:', errors.length);

      if (errors.length > 0) {
        setError(`Se importaron ${successCount} de ${selectedIds.length} gastos. Errores: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
        setStep('review');
      } else if (successCount === 0) {
        setError('No se pudo importar ningún gasto. Revisá la consola para más detalles.');
        setStep('review');
      } else {
        setSuccess(`¡Éxito! Se importaron ${successCount} gastos correctamente.`);
        setTimeout(() => {
          if (selectedGroupId === 'personal') {
            navigate(AppRoute.DASHBOARD_PERSONAL);
          } else {
            navigate(`/grupos/${selectedGroupId}`);
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error('[AI Import] FATAL ERROR:', err);
      setError("Error al importar: " + err.message);
      setStep('review');
    }
  };



  // --- Views ---

  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {/* Alerts Area */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="space-y-2">
            <h2 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              Importar con AI
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl">
              Subí tickets o facturas. Gemini extraerá los datos.
            </p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className={`px-4 py-2 rounded-lg bg-surface border border-border text-sm font-semibold flex items-center gap-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${profile?.gemini_api_key ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 'text-slate-500'}`}
          >
            {profile?.gemini_api_key ? (
              <>
                <Check className="w-4 h-4" />
                Key validada
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                Configurar key
              </>
            )}
          </button>
        </div>

        {/* Dropzone */}
        <div
          className="relative overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center bg-surface/50 hover:bg-surface hover:border-blue-500/50 transition-all cursor-pointer group"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="z-10 flex flex-col items-center text-center p-8">
            <div className="size-20 mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Arrastrá archivos acá</h3>
            <p className="text-slate-500">o hacé click para explorar</p>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileSelect} />
        </div>

        {/* File List & Action */}
        {files.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file, idx) => (
                <div key={idx} className="glass-panel p-3 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }} className="text-red-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={processFilesWithGemini}
                className="bg-blue-gradient px-8 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 hover:brightness-110 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Procesar
              </button>
            </div>
          </div>
        )}

        {/* Config Modal */}
        {showConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0F1623] rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-border">
              <div className="size-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">API Key de Gemini</h3>
              <p className="text-slate-500 mb-8">
                Para usar el escaneo inteligente, necesitás configurar tu propia API Key de Google Gemini en los ajustes de tu perfil.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/settings"
                  className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-center hover:scale-[1.02] transition-transform"
                >
                  Ir a Ajustes
                </Link>
                <button
                  onClick={() => setShowConfig(false)}
                  className="w-full py-3.5 rounded-xl border border-border text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'processing') {
    return <StardustOverlay />;
  }

  if (step === 'saving') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 text-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Guardando gastos...</h2>
        <p className="text-slate-500">Estamos sincronizando con Supabase.</p>
      </div>
    );
  }

  // --- REVIEW VIEW ---
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-32">
      {/* Alerts Area */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">{success}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => { setStep('upload'); setError(null); }} className="text-xs font-bold text-slate-500 hover:text-blue-500 mb-2 flex items-center gap-1 uppercase tracking-wider">
            <ChevronLeft className="w-3 h-3" /> Cancelar
          </button>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Validar importación</h2>
          <p className="text-slate-500">Confirmá los datos detectados.</p>
        </div>
      </div>

      {offTopicJoke ? (
        <div className="bg-surface border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center max-w-2xl mx-auto">
          <div className="size-24 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <BrainCircuit className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 italic">"{offTopicJoke}"</h3>
          <p className="text-slate-500 mb-8">
            Parece que la IA no encontró nada que parezca un recibo.
            Probá subiendo un ticket, factura o comprobante de transferencia.
          </p>
          <button
            onClick={() => setStep('upload')}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Volver a intentar
          </button>
        </div>
      ) : (
        <>
          {/* Destination Selection - z-20 to stay above transaction table */}
          <div className="mb-8 p-6 bg-surface/50 backdrop-blur-xl border border-blue-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative z-20">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Icons.LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Destino de los gastos</h4>
                <p className="text-xs text-slate-500">¿A dónde querés enviar estos registros?</p>
              </div>
            </div>
            <PremiumDropdown
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              groups={[
                {
                  title: 'Cuenta Personal',
                  options: [{ id: 'personal', label: 'Mis Finanzas Personales', icon: Wallet, color: 'text-blue-500', bgColor: 'bg-blue-500/10' }]
                },
                ...(groups.length > 0 ? [{
                  title: 'Mis Grupos',
                  options: groups.map(g => ({ id: g.id, label: g.name, icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-500/10' }))
                }] : [])
              ]}
              className="w-full md:w-64"
              placeholder="Seleccionar destino..."
            />
          </div>

          <div className="bg-surface/80 backdrop-blur-md rounded-2xl border border-border shadow-2xl mb-24 relative z-10">
            {/* Desktop Table Header - Hidden on mobile */}
            <div className="hidden lg:grid grid-cols-12 gap-4 border-b border-border bg-slate-50/50 dark:bg-slate-800/20 px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="col-span-1"></div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-3">Comercio</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-1 text-center">Recur.</div>
              <div className="col-span-3 text-right">Monto / Cambio</div>
            </div>

            <div className="divide-y divide-border/50">
              {scannedTransactions.map(tx => {
                const s = txSettings[tx.id];
                if (!s) return null;

                return (
                  <div key={tx.id}>
                    {/* Mobile Card View */}
                    <div className={`lg:hidden p-4 transition-colors ${s.selected ? 'hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-40'}`}>
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleSelection(tx.id)}
                          className={`size-6 shrink-0 mt-0.5 rounded-lg border-2 flex items-center justify-center transition-all ${s.selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}
                        >
                          {s.selected && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{tx.merchant}</p>
                            <div className="font-bold text-slate-900 dark:text-white shrink-0">
                              <AnimatedPrice amount={calculateConvertedAmount(tx.id)} showCode />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-500">{tx.date}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {tx.category}
                            </span>
                            {s.installments && <span className="text-[10px] font-bold text-blue-500 uppercase">Cuota {s.installments}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => toggleRecurring(tx.id)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${s.isRecurring ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                            >
                              <History className="w-3.5 h-3.5" />
                              {s.isRecurring ? 'Recurrente' : 'Único'}
                            </button>
                            {s.currency === 'USD' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400">T.C.</span>
                                <input
                                  type="number"
                                  value={s.exchangeRate}
                                  onChange={(e) => updateRate(tx.id, e.target.value)}
                                  className="w-16 bg-white dark:bg-slate-800 border border-border rounded px-1.5 py-0.5 text-right text-xs font-bold focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Table Row */}
                    <div className={`hidden lg:grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${s.selected ? 'hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-40 grayscale-sm'}`}>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => toggleSelection(tx.id)}
                          className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${s.selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}
                        >
                          {s.selected && <Check className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="col-span-2 text-sm font-medium">{tx.date}</div>
                      <div className="col-span-3">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{tx.merchant}</p>
                        {s.installments && <p className="text-[10px] font-bold text-blue-500 uppercase">Cuota {s.installments}</p>}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tx.category}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => toggleRecurring(tx.id)}
                          className={`p-2 rounded-lg transition-colors ${s.isRecurring ? 'bg-orange-500/20 text-orange-500' : 'text-slate-300'}`}
                          title="Marcar como recurrente"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="col-span-3 text-right space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          <AnimatedPrice amount={calculateConvertedAmount(tx.id)} showCode />
                        </div>
                        {s.currency === 'USD' && (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-slate-400 capitalize">T.C.</span>
                            <input
                              type="number"
                              value={s.exchangeRate}
                              onChange={(e) => updateRate(tx.id, e.target.value)}
                              className="w-16 bg-white dark:bg-slate-800 border border-border rounded px-1.5 py-0.5 text-right text-xs font-bold focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-0 lg:left-64 right-0 glass-panel border-t border-border p-6 z-30 bg-surface/90 backdrop-blur-xl md:bottom-0">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="text-sm font-medium text-slate-500">
                  Total a importar: <strong className="text-slate-900 dark:text-white text-lg ml-2">$ {totalConverted.toLocaleString('es-AR')}</strong>
                </div>
                {scannedTransactions.some(tx => txSettings[tx.id]?.currency === 'USD') && (
                  <button
                    onClick={fetchDolarRates}
                    className="text-[10px] font-black text-blue-600 uppercase border-b border-blue-600/30 hover:border-blue-600"
                  >
                    Sincronizar T.C. Blue
                  </button>
                )}
              </div>
              <button
                onClick={handleConfirmImport}
                disabled={!selectedGroupId || scannedTransactions.length === 0}
                className="bg-blue-gradient px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                Confirmar importación
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportExpenses;