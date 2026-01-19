import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Camera, Save, ArrowRightLeft, TrendingUp, AlertCircle, Loader2, Check } from 'lucide-react';
import { DollarRate } from '@/types/index';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface SettingsProps {
   currentExchangeRate: number;
   onExchangeRateChange: (rate: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentExchangeRate, onExchangeRateChange }) => {
   // Real profile data from Supabase
   const { profile, loading: profileLoading, saving, updateProfile } = useProfile();
   const { user } = useAuth();

   // Local form state (initialized from profile once loaded)
   const [formData, setFormData] = useState({
      name: '',
      email: '',
      avatar: ''
   });
   const [saveSuccess, setSaveSuccess] = useState(false);

   // Sync form data when profile loads
   useEffect(() => {
      if (profile) {
         setFormData({
            name: profile.full_name || '',
            email: profile.email || user?.email || '',
            avatar: profile.avatar_url || ''
         });
      }
   }, [profile, user]);

   // Dollar API State
   const [dollarRates, setDollarRates] = useState<DollarRate[]>([]);
   const [isLoadingRates, setIsLoadingRates] = useState(false);
   const [selectedRateType, setSelectedRateType] = useState<string>('manual');
   const [lastUpdated, setLastUpdated] = useState<string>('');

   useEffect(() => {
      fetchDollarRates();
   }, []);

   const fetchDollarRates = async () => {
      setIsLoadingRates(true);
      try {
         const response = await fetch('https://dolarapi.com/v1/dolares');
         const data = await response.json();
         setDollarRates(data);
         setLastUpdated(new Date().toLocaleString());
      } catch (error) {
         console.error("Error fetching dollar rates", error);
      } finally {
         setIsLoadingRates(false);
      }
   };

   const handleRateSelection = (type: string) => {
      setSelectedRateType(type);
      if (type !== 'manual') {
         const rate = dollarRates.find(d => d.casa === type);
         if (rate) {
            onExchangeRateChange(rate.venta);
         }
      }
   };

   const handleSaveProfile = async () => {
      setSaveSuccess(false);
      const { error } = await updateProfile({
         full_name: formData.name,
         email: formData.email,
         avatar_url: formData.avatar
      });
      if (!error) {
         setSaveSuccess(true);
         setTimeout(() => setSaveSuccess(false), 3000);
      }
   };

   const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

   if (profileLoading) {
      return (
         <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      );
   }

   return (
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32 space-y-10">

         {/* Page Header */}
         <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Configuración</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Administrá tu perfil y preferencias de moneda.</p>
         </div>

         {/* User Profile Section */}
         <section className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-border pb-2">Perfil de Usuario</h3>

            <div className="flex flex-col md:flex-row gap-8 items-start">
               {/* Avatar */}
               <div className="relative group">
                  <div className="size-32 rounded-full border-4 border-surface shadow-xl bg-cover bg-center" style={{ backgroundImage: `url(${formData.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.name || 'User')})` }}></div>
                  <button className="absolute bottom-1 right-1 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors">
                     <Camera className="w-4 h-4" />
                  </button>
               </div>

               {/* Form */}
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                           type="text"
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                           type="email"
                           value={formData.email}
                           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                           className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        />
                     </div>
                  </div>
               </div>
            </div>
            <div className="flex justify-end items-center gap-4">
               {saveSuccess && (
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in fade-in">
                     <Check className="w-4 h-4" />
                     Cambios guardados
                  </span>
               )}
               <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none"
               >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
               </button>
            </div>
         </section>

         {/* Currency Section */}
         <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-border pb-2">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversión de Moneda</h3>
               {lastUpdated && <span className="text-xs text-slate-500">Actualizado: {lastUpdated}</span>}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
               <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                     <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                     Tipo de Cambio Activo
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                     Este valor se usará para convertir tus gastos cuando cambies la moneda en el header.
                  </p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-slate-900 dark:text-white">1 USD =</span>
                     <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                           type="number"
                           value={currentExchangeRate}
                           onChange={(e) => {
                              setSelectedRateType('manual');
                              onExchangeRateChange(parseFloat(e.target.value));
                           }}
                           className="w-full bg-white dark:bg-black/20 border border-border rounded-lg pl-6 pr-2 py-2 font-bold text-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                     </div>
                     <span className="text-xl font-bold text-slate-500">ARS</span>
                  </div>
               </div>

               <div className="w-full md:w-1/2 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar cotización (DolarAPI)</p>

                  {isLoadingRates ? (
                     <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {dollarRates.map((rate) => (
                           <button
                              key={rate.casa}
                              onClick={() => handleRateSelection(rate.casa)}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${selectedRateType === rate.casa
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-surface border-border hover:border-blue-300 dark:hover:border-slate-600'
                                 }`}
                           >
                              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedRateType === rate.casa ? 'text-blue-100' : 'text-slate-500'}`}>
                                 Dolar {rate.nombre}
                              </p>
                              <p className={`text-lg font-bold ${selectedRateType === rate.casa ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                 $ {rate.venta}
                              </p>
                              {selectedRateType === rate.casa && (
                                 <div className="absolute top-0 right-0 p-1.5 bg-white/20 rounded-bl-xl">
                                    <TrendingUp className="w-3 h-3 text-white" />
                                 </div>
                              )}
                           </button>
                        ))}

                        <button
                           onClick={() => setSelectedRateType('manual')}
                           className={`p-3 rounded-xl border text-left transition-all ${selectedRateType === 'manual'
                                 ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                                 : 'bg-surface border-border hover:border-slate-400'
                              }`}
                        >
                           <p className={`text-xs font-bold uppercase tracking-wider mb-1 opacity-70`}>Manual</p>
                           <p className="text-lg font-bold">Personalizado</p>
                        </button>
                     </div>
                  )}
               </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
               <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
               <p className="text-sm text-orange-800 dark:text-orange-200">
                  Nota: La conversión es solo visual. Los gastos se guardan internamente en su moneda original. Al cambiar la cotización, los reportes se actualizarán automáticamente.
               </p>
            </div>

         </section>

      </div>
   );
};

export default Settings;