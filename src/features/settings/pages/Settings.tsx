import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Camera, Save, ArrowRightLeft, TrendingUp, AlertCircle, Loader2, Check } from 'lucide-react';
import { DollarRate } from '@/types/index';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { compressToWebP } from '@/lib/image-utils';
import { supabase } from '@/lib/supabase';
import { AISettings } from '../components/AISettings';
import AIChatPreferences from '../components/AIChatPreferences';
import AIChatConsent from '../components/AIChatConsent';

import { useCurrency } from '@/context/CurrencyContext';

const Settings: React.FC = () => {
   const { exchangeRate, rateSource, setRateSource, rates, loading: ratesLoading } = useCurrency();
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
   const [uploading, setUploading] = useState(false);

   // Ref for hidden file input
   const fileInputRef = React.useRef<HTMLInputElement>(null);

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

   const handleRateSelection = (type: string) => {
      if (type === 'manual') return; // For now
      setRateSource(type as any);
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

   const handleAvatarClick = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setUploading(true);
      try {
         // 1. Compress to WebP
         const webpBlob = await compressToWebP(file);

         // 2. Upload to Supabase Storage
         const fileName = `${user.id}/${Date.now()}.webp`;
         const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, webpBlob, {
               contentType: 'image/webp',
               upsert: true
            });

         if (uploadError) throw uploadError;

         // 3. Get Public URL
         const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

         // 4. Update local state
         setFormData(prev => ({ ...prev, avatar: publicUrl }));

         // 5. Update profile in database immediately
         await updateProfile({ avatar_url: publicUrl });

         setSaveSuccess(true);
         setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error: any) {
         console.error("Error uploading avatar:", error);
         alert("Error al subir la imagen: " + error.message);
      } finally {
         setUploading(false);
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
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

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
                  <div
                     className="size-32 rounded-full border-4 border-surface shadow-xl bg-cover bg-center transition-all group-hover:brightness-75 cursor-pointer"
                     style={{ backgroundImage: `url(${formData.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.name || 'User')})` }}
                     onClick={handleAvatarClick}
                  >
                     {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                           <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                     )}
                  </div>
                  <button
                     onClick={handleAvatarClick}
                     disabled={uploading}
                     className="absolute bottom-1 right-1 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                     <Camera className="w-4 h-4" />
                  </button>
                  <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileChange}
                     accept="image/*"
                     className="hidden"
                  />
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

         {/* AI Settings Section */}
         <section className="space-y-6">
            <AISettings
               apiKey={profile?.gemini_api_key || ''}
               onSave={(key) => updateProfile({ gemini_api_key: key })}
               saving={saving}
            />
         </section>

         {/* AI Chat Consent */}
         <section className="space-y-6">
            <AIChatConsent />
         </section>

         {/* AI Chat Preferences */}
         <section className="space-y-6">
            <AIChatPreferences />
         </section>

         {/* Currency Section */}
         <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-border pb-2">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversión de Moneda</h3>
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
                           value={exchangeRate}
                           readOnly
                           disabled
                           className="w-full bg-slate-100 dark:bg-black/40 border border-border rounded-lg pl-6 pr-2 py-2 font-bold text-lg cursor-not-allowed opacity-70"
                        />
                     </div>
                     <span className="text-xl font-bold text-slate-500">ARS</span>
                  </div>
               </div>

               <div className="w-full md:w-1/2 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar cotización (DolarAPI)</p>

                  {ratesLoading ? (
                     <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(rates).map(([casa, value]) => (
                           <button
                              key={casa}
                              onClick={() => handleRateSelection(casa)}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${rateSource === casa
                                 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                 : 'bg-surface border-border hover:border-blue-300 dark:hover:border-slate-600'
                                 }`}
                           >
                              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${rateSource === casa ? 'text-blue-100' : 'text-slate-500'}`}>
                                 Dolar {casa}
                              </p>
                              <p className={`text-lg font-bold ${rateSource === casa ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                 $ {value}
                              </p>
                              {rateSource === casa && (
                                 <div className="absolute top-0 right-0 p-1.5 bg-white/20 rounded-bl-xl">
                                    <TrendingUp className="w-3 h-3 text-white" />
                                 </div>
                              )}
                           </button>
                        ))}
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
