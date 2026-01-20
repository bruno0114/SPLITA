import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_TRANSACTIONS } from '@/lib/constants';
import { Settings, Upload, Check, ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Coffee, PlayCircle, Fuel, Utensils, Zap, FileText, X, Loader2, Image as ImageIcon, Sparkles, BrainCircuit, Plus, AlertCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Transaction } from '@/types/index';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { getGeminiClient } from '@/services/ai';

// Define the stages of the import process
type ImportStep = 'upload' | 'processing' | 'review' | 'saving';

const ImportExpenses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groups, loading: loadingGroups } = useGroups();

  // Default to the first group if available, or user must select
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // We need the `addTransaction` from the hook. 
  // Optimization: We could fetch it on demand inside the save function, 
  // but hooks rules require top level. We can pass `selectedGroupId` to useTransactions 
  // but it might change. Let's just instantiate it with the selected one when meaningful.
  const { addTransaction } = useTransactions(selectedGroupId || null);
  const { profile } = useProfile();

  const [step, setStep] = useState<ImportStep>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [scannedTransactions, setScannedTransactions] = useState<Transaction[]>([]);
  const [showConfig, setShowConfig] = useState(false);
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

    setStep('processing');

    try {
      const ai = getGeminiClient(profile?.gemini_api_key);
      const model = 'gemini-2.0-flash-exp';

      const parts = [];

      for (const file of files) {
        const base64Data = await fileToGenerativePart(file);
        // Simple heuristic for mime type
        const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      parts.push({
        text: `Contexto: Sos un asistente financiero argentino. Analizá estos comprobantes.
          Extraé las transacciones. 
          Respondé ÚNICAMENTE con un JSON array.
          
          Mapeo de Categorías (usar EXACTAMENTE estas strings):
          - 'Supermercado' (comida, bebidas, limpieza)
          - 'Gastronomía' (restaurantes, bares, delivery)
          - 'Servicios' (luz, gas, internet, suscripciones)
          - 'Transporte' (nafta, uber, sube)
          - 'Compras' (ropa, electrónica, regalos)
          - 'Varios' (otros)
  
          Campos requeridos por objeto:
          1. date (Formato YYYY-MM-DD ISO)
          2. merchant (Nombre del comercio)
          3. category (Una de las categorias de arriba)
          4. amount (Numero, parsear con cuidado, en argentina se usa coma para decimales a veces, convertilo a standard float)`
      });

      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            amount: { type: Type.NUMBER },
          },
          required: ["date", "merchant", "category", "amount"]
        }
      };

      const result = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      console.log("Gemini Raw Response", result.text);

      const extractedData = JSON.parse(result.text || "[]");

      const mappedTransactions: Transaction[] = extractedData.map((item: any, index: number) => ({
        id: `scan-${Date.now()}-${index}`,
        date: new Date(item.date).toLocaleDateString('es-AR'), // Display format
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
      }));

      setScannedTransactions(mappedTransactions);
      setStep('review');

    } catch (error) {
      console.error("Error scanning files with Gemini:", error);
      alert("Error al procesar. Verificá la consola o intentá de nuevo.");
      setStep('upload');
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

  const handleConfirmImport = async () => {
    if (!selectedGroupId) {
      alert("Por favor seleccioná un grupo para asignar estos gastos.");
      return;
    }

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    if (!selectedGroup) return;

    setStep('saving');

    // Save each transaction
    // NOTE: In a real app we'd do this in batch or use Promise.all 
    // We'll iterate simply here.
    let successCount = 0;

    for (const tx of scannedTransactions) {
      const { error } = await addTransaction({
        amount: tx.amount,
        category: tx.category,
        title: tx.merchant,
        date: new Date().toISOString(), // Or parse tx.date if available
        splitBetween: selectedGroup.members.map(m => m.id) // Default split with everyone
      });
      if (!error) successCount++;
    }

    alert(`Se importaron ${successCount} gastos exitosamente.`);
    navigate(`/groups/${selectedGroupId}`);
  };


  // --- Views ---

  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
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
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 rounded-lg bg-surface border border-border text-slate-500 text-sm font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <BrainCircuit className="w-4 h-4" />
            Configurar key
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

  if (step === 'processing' || step === 'saving') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 text-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{step === 'processing' ? 'Analizando...' : 'Guardando gastos...'}</h2>
        <p className="text-slate-500">Estamos {step === 'processing' ? 'leyendo tus comprobantes' : 'sincronizando con Supabase'}.</p>
      </div>
    );
  }

  // --- REVIEW VIEW ---
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => setStep('upload')} className="text-xs font-bold text-slate-500 hover:text-blue-500 mb-2 flex items-center gap-1 uppercase tracking-wider">
            <ChevronLeft className="w-3 h-3" /> Cancelar
          </button>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Validar importación</h2>
          <p className="text-slate-500">Confirmá los datos detectados.</p>
        </div>
      </div>

      {/* Group Selection */}
      <div className="mb-8 p-6 bg-surface border border-blue-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <Icons.Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Asignar a Grupo</h4>
            <p className="text-xs text-slate-500">Todos los gastos se crearán en este grupo.</p>
          </div>
        </div>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full md:w-64 bg-background border border-border rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="" disabled>Seleccionar grupo...</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface/80 backdrop-blur-md rounded-2xl border border-border shadow-2xl overflow-hidden mb-24">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 border-b border-border bg-slate-50/50 dark:bg-slate-800/20 px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="col-span-2">Fecha</div>
          <div className="col-span-4">Comercio</div>
          <div className="col-span-3">Categoría</div>
          <div className="col-span-3 text-right">Monto</div>
        </div>

        <div className="divide-y divide-border/50">
          {scannedTransactions.map(tx => (
            <div key={tx.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <div className="col-span-2 text-sm font-medium">{tx.date}</div>
              <div className="col-span-4 font-bold text-slate-900 dark:text-white">{tx.merchant}</div>
              <div className="col-span-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tx.category}
                </span>
              </div>
              <div className="col-span-3 text-right font-bold text-slate-900 dark:text-white">
                $ {tx.amount.toLocaleString('es-AR')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-64 right-0 glass-panel border-t border-border p-6 z-30 bg-surface/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-sm font-medium text-slate-500">
            Total: <strong className="text-slate-900 dark:text-white text-lg ml-2">$ {scannedTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString('es-AR')}</strong>
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
    </div>
  );
};

export default ImportExpenses;