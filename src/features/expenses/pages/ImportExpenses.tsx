import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Upload, Check, ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Coffee, PlayCircle, Fuel, Utensils, Zap, FileText, X, Loader2, Image as ImageIcon, Sparkles, BrainCircuit, Plus, AlertCircle, History, Receipt, CreditCard, BarChart3 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Transaction, AppRoute } from '@/types/index';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { getGeminiClient, extractExpensesFromImages } from '@/services/ai';
import StardustOverlay from '@/components/ai/StardustOverlay';
import { useAIHistory } from '@/features/expenses/hooks/useAIHistory';
import { useCategories } from '@/features/analytics/hooks/useCategories';
import { getOffTopicJoke } from '@/lib/ai-prompts';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { Wallet, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

// Define the stages of the import process
type ImportStep = 'upload' | 'processing' | 'review' | 'saving';

const ImportExpenses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { groups, loading: loadingGroups } = useGroups();
  const { uploadReceipt, saveSession, getSessionById, incrementReimportCount } = useAIHistory();

  // Default to the first group if available, or user must select
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // We need the `addTransaction` from the hook. 
  const { addTransaction } = useTransactions(selectedGroupId === 'personal' ? null : selectedGroupId);
  const { addTransaction: addPersonalTransaction } = usePersonalTransactions();
  const { profile } = useProfile();
  const { categories, addCategory } = useCategories();

  // --- Instrumentation State ---
  const [debugInfo, setDebugInfo] = useState<{
    sessionId: string;
    steps: Array<{ name: string; duration: number; timestamp: number }>;
    counts: { detected: number; selected: number; inserted: number };
    errors: Array<{ step: string; message: string; raw: any }>;
  }>({
    sessionId: '',
    steps: [],
    counts: { detected: 0, selected: 0, inserted: 0 },
    errors: []
  });

  const addDebugStep = (name: string, prevTimestamp?: number) => {
    const now = Date.now();
    setDebugInfo(prev => ({
      ...prev,
      steps: [...prev.steps, { name, timestamp: now, duration: prevTimestamp ? now - prevTimestamp : 0 }]
    }));
    return now;
  };

  const addDebugError = (step: string, message: string, raw: any) => {
    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors, { step, message, raw }]
    }));
  };

  const [step, setStep] = useState<ImportStep>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [scannedTransactions, setScannedTransactions] = useState<Transaction[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [offTopicJoke, setOffTopicJoke] = useState<string | null>(null);
  const [reimportSessionId, setReimportSessionId] = useState<string | null>(null);
  const [isReimporting, setIsReimporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLoadedSessionId = useRef<string | null>(null);

  const isSupportedFile = (file: File) => {
    const type = file.type || '';
    const name = file.name.toLowerCase();
    const isImage = type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name);
    const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
    const isSpreadsheet = /\.(xlsx|xls)$/i.test(name)
      || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      || type === 'application/vnd.ms-excel';
    const isDocx = name.endsWith('.docx')
      || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return isImage || isPdf || isSpreadsheet || isDocx;
  };

  const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const fileToTextPart = async (file: File): Promise<string> => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buffer = await fileToArrayBuffer(file);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheets = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
        return `Hoja: ${sheetName}\n${csv}`;
      }).join('\n\n');
      return `Contenido de planilla (CSV):\n${sheets}`.trim();
    }

    if (name.endsWith('.docx')) {
      const buffer = await fileToArrayBuffer(file);
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return `Contenido de documento:\n${result.value || ''}`.trim();
    }

    return '';
  };

  // --- Handlers ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files!);
      const supported = incoming.filter(isSupportedFile);
      const rejected = incoming.filter(file => !isSupportedFile(file));
      if (rejected.length > 0) {
        setError('Solo se aceptan imágenes, PDFs, XLS/XLSX o DOCX.');
      }
      if (supported.length > 0) {
        setFiles(prev => [...prev, ...supported]);
      }
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
      const incoming = Array.from(e.dataTransfer.files);
      const supported = incoming.filter(isSupportedFile);
      const rejected = incoming.filter(file => !isSupportedFile(file));
      if (rejected.length > 0) {
        setError('Solo se aceptan imágenes, PDFs, XLS/XLSX o DOCX.');
      }
      if (supported.length > 0) {
        setFiles(prev => [...prev, ...supported]);
      }
    }
  };


  // --- Gemini API Integration ---

  const processFilesWithGemini = async () => {
    if (files.length === 0) return;

    setError(null);
    setSuccess(null);
    setStep('processing');

    const sessionId = `Session-${Date.now()}`;
    const startTs = addDebugStep('Gemini Request Start');
    setDebugInfo(prev => ({ ...prev, sessionId, errors: [], steps: [{ name: 'Init', duration: 0, timestamp: startTs }] }));

    try {
      if (!profile) {
        throw new Error("PROFILE_LOADING");
      }

      // 1. Upload files to Storage for history
      const imageUrls = await Promise.all(files.map(file => uploadReceipt(file)));
      const validUrls = imageUrls.filter((url): url is string => url !== null);

      // 2. Prepare for Gemini
      const fileParts = await Promise.all(files.map(async file => {
        const lowerName = file.name.toLowerCase();
        const isSpreadsheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
        const isDocx = lowerName.endsWith('.docx');
        if (isSpreadsheet || isDocx) {
          const text = await fileToTextPart(file);
          return { text };
        }
        const base64Data = await fileToGenerativePart(file);
        const mimeType = file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        return { data: base64Data, mimeType };
      }));

      // 3. Extract data
      const extractStart = addDebugStep('Extrahciendo datos con Gemini');
      const extractedData = await extractExpensesFromImages(profile.gemini_api_key!, fileParts);
      const extractEnd = addDebugStep('Respuesta Gemini Recibida', extractStart);

      // 4. Save session to DB
      await saveSession(validUrls, extractedData);

      setDebugInfo(prev => ({ ...prev, counts: { ...prev.counts, detected: extractedData.length } }));

      if (extractedData.length === 0) {
        setOffTopicJoke(getOffTopicJoke());
        setStep('review');
        setScannedTransactions([]);
        return;
      }

      setOffTopicJoke(null);
      const mappedTransactions: Transaction[] = mapRawDataToTransactions(extractedData);

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
        addDebugError('AI Processing', error.message, error);
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

  const getCategoryIcon = useCallback((category: string): string => {
    const map: Record<string, string> = {
      'Supermercado': 'ShoppingCart',
      'Gastronomía': 'Utensils',
      'Servicios': 'Zap',
      'Transporte': 'Fuel',
      'Compras': 'ShoppingBag',
    };
    return map[category] || 'Receipt';
  }, []);

  const mapRawDataToTransactions = useCallback((rawData: any[]): Transaction[] => {
    return rawData.map((item: any, index: number) => ({
      id: `scan-${Date.now()}-${index}`,
      date: new Date(item.date).toLocaleDateString('es-AR'),
      raw_date: item.date,
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
  }, [getCategoryIcon, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('sessionId');
    if (!sessionId || !user) return;
    if (lastLoadedSessionId.current === sessionId) return;

    const loadSession = async () => {
      setIsReimporting(true);
      setError(null);
      const session = await getSessionById(sessionId);

      if (!session) {
        setError('No se encontró la sesión para reimportar.');
        setStep('upload');
        setIsReimporting(false);
        return;
      }

      lastLoadedSessionId.current = sessionId;
      setReimportSessionId(sessionId);

      if (!session.raw_data || session.raw_data.length === 0) {
        setOffTopicJoke(getOffTopicJoke());
        setScannedTransactions([]);
        setStep('review');
        setIsReimporting(false);
        navigate(AppRoute.IMPORT, { replace: true });
        return;
      }

      const mappedTransactions = mapRawDataToTransactions(session.raw_data);
      setOffTopicJoke(null);
      setScannedTransactions(mappedTransactions);
      setStep('review');
      setIsReimporting(false);
      navigate(AppRoute.IMPORT, { replace: true });
    };

    loadSession();
  }, [location.search, user, getSessionById, mapRawDataToTransactions, navigate]);

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

    const saveStartTs = addDebugStep('Importación Iniciada');
    setStep('saving');
    let successCount = 0;
    const errors: string[] = [];

    setDebugInfo(prev => ({ ...prev, counts: { ...prev.counts, selected: selectedIds.length, inserted: 0 } }));

    // Helper to format dates for Postgres (YYYY-MM-DD)
    const normalizeDate = (dateStr: string | undefined): string => {
      if (!dateStr) return new Date().toISOString().split('T')[0];

      // If it's already YYYY-MM-DD, keep it
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.split('T')[0];

      // Try to parse other formats (e.g., DD/MM/YYYY)
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

        // Manual fallback for common Spanish format DD/MM/YYYY
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } catch (e) {
        console.warn('[AI Import] Failed to parse date:', dateStr);
      }
      return new Date().toISOString().split('T')[0];
    };

    // Helper for slight delay between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Helper to ensure category exists
      const ensureCategory = async (catName: string) => {
        const normalized = catName.trim();
        // Check local categories first
        const exists = categories.find(c => c.name.toLowerCase() === normalized.toLowerCase());

        if (!exists) {
          try {
            console.log('[AI Import] Creating new category:', normalized);
            const newCat = await addCategory({
              name: normalized,
              icon: 'LayoutGrid',
              color: 'text-indigo-500',
              bg_color: 'bg-indigo-500/10'
            });
            console.log('[AI Import] Category created:', newCat?.name);
            return newCat?.name || normalized;
          } catch (e) {
            console.warn("[AI Import] Could not auto-create category:", normalized, e);
            return normalized;
          }
        }
        return exists.name;
      };

      const selectedTransactions = selectedIds.map(id => ({
        tx: scannedTransactions.find(t => t.id === id)!,
        settings: txSettings[id]
      }));

      if (selectedGroupId === 'personal') {
        console.log('[AI Import] Global import to PERSONAL account');

        for (let i = 0; i < selectedTransactions.length; i++) {
          const { tx, settings: s } = selectedTransactions[i];
          const isLast = i === selectedTransactions.length - 1;

          const categoryName = await ensureCategory(tx.category);
          const normalizedDate = normalizeDate(tx.raw_date);

          const payload = {
            title: tx.merchant,
            amount: s.originalAmount * (s.currency === 'USD' ? s.exchangeRate : 1),
            category: categoryName,
            type: 'expense' as const,
            date: normalizedDate,
            original_amount: s.originalAmount,
            original_currency: s.currency,
            exchange_rate: s.currency === 'USD' ? s.exchangeRate : undefined,
            is_recurring: s.isRecurring,
            installments: s.installments
          };

          const { error } = await addPersonalTransaction(payload, { skipRefresh: !isLast });

          if (error) {
            console.error(`[AI Import] ERROR saving ${tx.merchant}:`, error);
            errors.push(`${tx.merchant}: ${error}`);
          } else {
            successCount++;
            setDebugInfo(prev => ({ ...prev, counts: { ...prev.counts, inserted: successCount } }));
          }

          if (!isLast) await delay(100);
        }
      } else {
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        if (!selectedGroup) throw new Error("Grupo no encontrado");

        console.log('[AI Import] Global import to GROUP:', selectedGroup.name);

        for (let i = 0; i < selectedTransactions.length; i++) {
          const { tx, settings: s } = selectedTransactions[i];
          const isLast = i === selectedTransactions.length - 1;

          const categoryName = await ensureCategory(tx.category);
          const normalizedDate = normalizeDate(tx.raw_date);

          const payload = {
            amount: s.originalAmount * (s.currency === 'USD' ? s.exchangeRate : 1),
            category: categoryName,
            title: tx.merchant,
            date: normalizedDate,
            splitBetween: selectedGroup.members.map(m => m.id),
            original_amount: s.originalAmount,
            original_currency: s.currency,
            exchange_rate: s.currency === 'USD' ? s.exchangeRate : undefined,
            is_recurring: s.isRecurring,
            installments: s.installments
          };

          const { error } = await addTransaction(payload, { skipRefresh: !isLast });

          if (error) {
            console.error(`[AI Import] ERROR saving ${tx.merchant}:`, error);
            errors.push(`${tx.merchant}: ${error}`);
          } else {
            successCount++;
            setDebugInfo(prev => ({ ...prev, counts: { ...prev.counts, inserted: successCount } }));
          }

          if (!isLast) await delay(100);
        }
      }

      console.log('[AI Import] Process complete. Success:', successCount);
      addDebugStep('Importación Finalizada', saveStartTs);

      if (errors.length > 0) {
        setError(`Se importaron ${successCount} de ${selectedIds.length} gastos. Algunos fallaron: ${errors.slice(0, 2).join(', ')}`);
        setStep('review');
      } else {
        if (reimportSessionId) {
          await incrementReimportCount(reimportSessionId);
        }
        setSuccess(`¡Excelente! Se importaron ${successCount} gastos correctamente.`);
        setTimeout(() => {
          if (selectedGroupId === 'personal') navigate(AppRoute.DASHBOARD_PERSONAL);
          else navigate(`/grupos/${selectedGroupId}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error('[AI Import] FATAL:', err);
      setError("Error fatal en importación: " + err.message);
      setStep('review');
    }
  };

  // --- Render Helpers ---
  const renderCurrentStep = () => {
    if (isReimporting) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reimportando desde historial...</h2>
          <p className="text-slate-500">Estamos preparando tus gastos para revisar.</p>
        </div>
      );
    }

    if (step === 'upload') {
      return (
        <div className="max-w-4xl mx-auto">
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
              onClick={() => navigate(AppRoute.SETTINGS)}
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
            <div className="absolute inset-0 z-0 pointer-events-none">
              {[
                { icon: Receipt, color: 'text-blue-400', bg: 'bg-blue-500/10', left: '12%', top: '12%', size: 12, drift: 36, duration: 10, delay: 0 },
                { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', left: '78%', top: '8%', size: 10, drift: 28, duration: 12, delay: 0.4 },
                { icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10', left: '18%', top: '62%', size: 11, drift: 30, duration: 9, delay: 0.2 },
                { icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10', left: '72%', top: '68%', size: 11, drift: 34, duration: 11, delay: 0.6 },
                { icon: Sparkles, color: 'text-blue-300', bg: 'bg-blue-500/10', left: '45%', top: '20%', size: 8, drift: 24, duration: 8, delay: 0.1 },
                { icon: Sparkles, color: 'text-indigo-300', bg: 'bg-indigo-500/10', left: '35%', top: '78%', size: 8, drift: 26, duration: 13, delay: 0.5 }
              ].map((particle, index) => (
                <motion.div
                  key={`dropzone-particle-${index}`}
                  className={`absolute ${particle.bg} ${particle.color} rounded-2xl flex items-center justify-center`}
                  style={{
                    left: particle.left,
                    top: particle.top,
                    width: `${particle.size * 4}px`,
                    height: `${particle.size * 4}px`
                  }}
                  animate={{
                    y: [0, particle.drift],
                    opacity: [0.2, 0.6, 0.2],
                    rotate: [0, 4, 0]
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: particle.delay
                  }}
                >
                  <particle.icon className="w-5 h-5" />
                </motion.div>
              ))}

              {[...Array(14)].map((_, i) => (
                <motion.span
                  key={`dropzone-dot-${i}`}
                  className="absolute size-1.5 rounded-full bg-blue-400/30"
                  style={{
                    left: `${8 + (i * 6) % 84}%`,
                    top: `${12 + (i * 9) % 76}%`
                  }}
                  animate={{
                    y: [0, 18],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{
                    duration: 6 + (i % 5),
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
            <div className="z-10 flex flex-col items-center text-center p-8">
              <div className="size-20 mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Arrastrá archivos acá</h3>
              <p className="text-slate-500">o hacé click para explorar</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*,application/pdf,.xls,.xlsx,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileSelect}
            />
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
              <div className="bg-surface rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-border animate-in zoom-in-95 duration-200">
                <div className="size-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Falta configurar Gemini</h3>
                <p className="text-slate-500 mb-6">Para usar la inteligencia artificial necesitás configurar tu propia Google Gemini API Key.</p>
                <div className="space-y-3">
                  <button
                    onClick={() => { setShowConfig(false); navigate(AppRoute.SETTINGS); }}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Ir a Configuración
                  </button>
                  <button
                    onClick={() => setShowConfig(false)}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
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
          {!success ? (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Guardando gastos...</h2>
              <p className="text-slate-500">Estamos sincronizando con Supabase.</p>
            </>
          ) : (
            <div className="animate-in zoom-in-95 duration-500">
              <div className="size-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">¡Todo listo!</h2>
              <p className="text-slate-500 mb-2">{success}</p>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest animate-pulse">Redirigiendo...</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto">
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
            <button onClick={() => setStep('upload')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
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

  return (
    <div className="px-6 py-8 pb-32 min-h-screen">
      {renderCurrentStep()}
      {import.meta.env.DEV && localStorage.getItem('show_debug_panel') === 'true' && (
        <div className="mt-20 p-6 bg-slate-900 rounded-3xl text-xs font-mono text-emerald-400 overflow-hidden border border-emerald-500/20 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Icons.Code className="w-4 h-4" /> DEBUG PANEL (SOLO DEV)
            </h3>
            <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">{debugInfo.sessionId || 'Sin sesión'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-slate-400 border-b border-slate-800 pb-1 uppercase tracking-tighter">Pasos y Duración</p>
              {debugInfo.steps.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-black/30 p-1.5 rounded">
                  <span>{s.name}</span>
                  <span className="text-white bg-slate-800 px-1 rounded">{s.duration}ms</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-slate-400 border-b border-slate-800 pb-1 uppercase tracking-tighter">Contadores</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 p-2 rounded text-center">
                  <span className="block text-slate-500 text-[9px]">DETECTADOS</span>
                  <span className="text-lg text-white font-bold">{debugInfo.counts.detected}</span>
                </div>
                <div className="bg-black/30 p-2 rounded text-center">
                  <span className="block text-slate-500 text-[9px]">INSERTADOS</span>
                  <span className="text-lg text-emerald-500 font-bold">{debugInfo.counts.inserted} / {debugInfo.counts.selected}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-slate-400 border-b border-slate-800 pb-1 uppercase tracking-tighter">Errores Crudos (Last 5)</p>
              {debugInfo.errors.length === 0 ? (
                <p className="text-emerald-500/40 italic">Ningún error capturado</p>
              ) : (
                debugInfo.errors.slice(-5).map((e, i) => (
                  <div key={i} className="bg-red-500/10 border border-red-500/20 p-2 rounded text-[10px]">
                    <p className="text-red-400 font-bold mb-1">[{e.step}]</p>
                    <p className="text-slate-300 mb-1">{e.message}</p>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-slate-500 hover:text-white">Ver JSON</summary>
                      <pre className="mt-1 p-1 bg-black rounded overflow-x-auto text-[9px] text-red-300">
                        {JSON.stringify(e.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExpenses;
