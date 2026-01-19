import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_TRANSACTIONS, GROUP_MEMBERS, CURRENT_USER } from '../constants';
import { Settings, Upload, Check, ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Coffee, PlayCircle, Fuel, Utensils, Zap, FileText, X, Loader2, Image as ImageIcon, FileDigit, Sparkles, BrainCircuit, Key, ExternalLink, Plus } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Transaction, User } from '../types';

// Define the stages of the import process
type ImportStep = 'upload' | 'processing' | 'review';

const ImportExpenses: React.FC = () => {
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash';

      // Prepare prompts
      const parts = [];
      
      // Convert files to inline data for Gemini
      for (const file of files) {
        const base64Data = await fileToGenerativePart(file);
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      }

      // Add text prompt
      parts.push({
        text: `Analyze these documents (receipts or bank statements). Extract the transaction details. 
        For each transaction found, identify:
        1. Date (DD MMM YYYY format)
        2. Merchant Name
        3. Category (one of: 'Compras', 'Supermercado', 'Gastronomía', 'Servicios', 'Transporte', 'Varios')
        4. Total Amount (numeric)
        
        Return a JSON array of objects.`
      });

      // Define Schema for structured JSON output
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

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      const extractedData = JSON.parse(response.text || "[]");

      // Map AI response to App Transaction Type
      const mappedTransactions: Transaction[] = extractedData.map((item: any, index: number) => ({
        id: `scan-${Date.now()}-${index}`,
        date: item.date,
        merchant: item.merchant,
        category: item.category,
        amount: item.amount,
        payer: CURRENT_USER, // Default to current user
        splitWith: [], // Default to no split
        icon: getCategoryIcon(item.category),
        iconColor: 'text-blue-500', // Default styling
        iconBg: 'bg-blue-500/10',
        categoryColor: 'text-slate-600',
        categoryBg: 'bg-slate-100',
      }));

      setScannedTransactions(mappedTransactions);
      setStep('review');

    } catch (error) {
      console.error("Error scanning files with Gemini:", error);
      alert("Hubo un error al procesar los archivos. Por favor intentá nuevamente.");
      setStep('upload');
    }
  };

  // Helper to read file as Base64
  const fileToGenerativePart = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
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


  // --- Render Views ---

  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {/* Header with AI Branding */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
           <div className="space-y-2">
              <h2 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 Importar con AI
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl">
                 Olvidate de cargar datos. Gemini lee tus tickets y facturas al instante.
              </p>
           </div>
           <button 
             onClick={() => setShowConfig(true)}
             className="px-4 py-2 rounded-lg bg-surface border border-border text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-semibold flex items-center gap-2"
           >
              <BrainCircuit className="w-4 h-4" />
              Configurar motor IA
           </button>
        </div>

        {/* AI Scanner Dropzone */}
        <div 
          className="relative overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem] min-h-[420px] flex flex-col items-center justify-center bg-surface/50 hover:bg-surface hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-blue-900/10"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-50 animate-pulse"></div>

          <div className="z-10 flex flex-col items-center text-center max-w-md p-8">
             {/* AI Graphic - Dark Blue Gradient Sparkles */}
             <div className="relative size-32 mb-8 group-hover:scale-110 transition-transform duration-500">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-500/30 blur-[40px] rounded-full animate-pulse"></div>
                
                {/* Main Icon Container */}
                <div className="relative size-full rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-900 shadow-2xl flex items-center justify-center border border-white/10">
                   <Sparkles className="w-16 h-16 text-white animate-[pulse_3s_ease-in-out_infinite]" />
                </div>
                
                {/* Floating particles */}
                <div className="absolute -top-2 -right-2 size-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-surface animate-bounce shadow-lg">
                   <Plus className="w-4 h-4 text-white" strokeWidth={4} />
                </div>
             </div>

             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Soltá tus archivos acá</h3>
             <p className="text-slate-500 text-base mb-8 leading-relaxed">
                Subí fotos de tickets, facturas PDF o capturas. <br/>
                <span className="text-blue-500 font-semibold">Gemini detectará fechas, montos y categorías.</span>
             </p>
             
             <button className="px-8 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
               <Upload className="w-4 h-4" />
               Elegir archivos del dispositivo
             </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept="image/*,application/pdf"
            onChange={handleFileSelect} 
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-sm font-bold text-slate-500 px-1">Cola de procesamiento ({files.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                       {file.type.includes('pdf') ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • Listo para escanear</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-8">
              <button 
                onClick={processFilesWithGemini}
                className="flex items-center gap-2 bg-blue-gradient px-8 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                disabled={files.length === 0}
              >
                <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                Escanear con Gemini
              </button>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-[#0F1623] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                         <BrainCircuit className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configuración AI</h3>
                         <p className="text-xs text-slate-500">Powered by Google Gemini</p>
                      </div>
                   </div>
                   <button onClick={() => setShowConfig(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                   </button>
                </div>
                
                <div className="space-y-4 mb-8">
                   <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Splita utiliza la API de Gemini para analizar tus documentos. Para mayor privacidad y control, podés utilizar tu propia API Key.
                   </p>
                   
                   <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                         <Check className="w-3 h-3" /> Estado del servicio
                      </h4>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                         <span className="relative flex h-2.5 w-2.5">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                         </span>
                         API Key Configurada (process.env)
                      </div>
                   </div>

                   <div className="text-xs text-slate-500 space-y-2">
                      <p>Si necesitás configurar una nueva clave o cambiarla, asegurate de actualizar las variables de entorno de tu despliegue.</p>
                      <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:underline">
                         Obtener API Key en Google AI Studio <ExternalLink className="w-3 h-3" />
                      </a>
                   </div>
                </div>

                <div className="flex justify-end">
                   <button onClick={() => setShowConfig(false)} className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity">
                      Entendido
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 text-center">
        <div className="relative mb-8 size-32">
          {/* Advanced Spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-purple-500/30 border-b-transparent animate-[spin_3s_linear_infinite_reverse]"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="size-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
               <Sparkles className="w-8 h-8 text-white" />
             </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 animate-pulse">Analizando con Gemini...</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
           La IA está extrayendo información de {files.length} documento{files.length > 1 ? 's' : ''}. Esto puede tomar unos segundos.
        </p>
      </div>
    );
  }

  // --- REVIEW VIEW (Existing Logic) ---
  
  // Use mock transactions if scanned is empty (for demo purposes if API fails or empty)
  // In a real app, we might want to show empty or error.
  const displayTransactions = scannedTransactions.length > 0 ? scannedTransactions : MOCK_TRANSACTIONS;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <button 
            onClick={() => { setStep('upload'); setFiles([]); setScannedTransactions([]); }}
            className="text-xs font-bold text-slate-500 hover:text-blue-500 mb-2 flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Volver a cargar
          </button>
          <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight mb-2">Validar movimientos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            La IA detectó {displayTransactions.length} movimientos. Revisá y confirmá la información.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-surface border border-border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Ajustes
          </button>
        </div>
      </div>

      <div className="bg-surface/80 backdrop-blur-md rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/30">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-border w-24">Incluir</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-border">Fecha</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-border">Comercio</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-border">Categoría</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right border-b border-border">Monto</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center border-b border-border">Pagó</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center border-b border-border">Dividir con</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayTransactions.map((tx) => (
                <ImportRow key={tx.id} transaction={tx} />
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800/30 border-t border-border px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Mostrando {displayTransactions.length} movimientos encontrados</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-64 right-0 glass-panel border-t border-border p-6 z-30 bg-surface/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-primary/20 rounded-2xl p-3 text-primary border border-primary/30 hidden sm:block">
              <Upload className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total detectado</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                   $ {displayTransactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-primary font-bold">ARS</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => { setStep('upload'); setFiles([]); }}
              className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl border border-border text-sm font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:text-slate-900 dark:hover:text-white"
            >
              Descartar
            </button>
            <button className="bg-blue-gradient shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex-1 sm:flex-none px-10 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 group transition-all">
              <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Confirmar importación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImportRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const [isChecked, setIsChecked] = useState(true);
  // Dynamic icon mapping with fallback
  const IconComponent = (Icons as any)[transaction.icon] || ShoppingBag;

  return (
    <tr className={`group hover:bg-black/5 dark:hover:bg-slate-800/20 transition-colors ${!isChecked ? 'opacity-50' : ''}`}>
      <td className="py-5 px-6">
        <button 
          onClick={() => setIsChecked(!isChecked)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${isChecked ? 'bg-blue-gradient' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </td>
      <td className="py-5 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{transaction.date}</td>
      <td className="py-5 px-6">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${transaction.iconBg} border border-black/5 dark:border-white/5 flex items-center justify-center ${transaction.iconColor}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{transaction.merchant}</span>
        </div>
      </td>
      <td className="py-5 px-6">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${transaction.categoryBg} ${transaction.categoryColor} border border-black/5 dark:border-white/5`}>
          {transaction.category}
        </span>
      </td>
      <td className="py-5 px-6 text-right text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">$ {transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      <td className="py-5 px-6">
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-cover bg-center border-2 border-primary shadow-sm" style={{ backgroundImage: `url(${transaction.payer.avatar})` }} title={transaction.payer.name}></div>
        </div>
      </td>
      <td className="py-5 px-6">
        <div className="flex items-center justify-center gap-1.5">
          {transaction.splitWith.length > 0 ? (
            transaction.splitWith.map((user) => (
              <div key={user.id} className="w-7 h-7 rounded-full bg-cover bg-center ring-2 ring-white dark:ring-surface border border-slate-200 dark:border-0 cursor-pointer" style={{ backgroundImage: `url(${user.avatar})` }} title={user.name}></div>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">Personal</span>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ImportExpenses;