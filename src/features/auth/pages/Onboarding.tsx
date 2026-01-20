import React, { useState } from 'react';
import { ChevronRight, X, Heart, User, Users, Check, ArrowRight, Link as LinkIcon, Copy, Facebook, Mail, Lock, Smartphone, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { GROUP_MEMBERS } from '@/lib/constants';

interface OnboardingProps {
   onComplete: () => void;
   onLogin: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onLogin }) => {
   const [step, setStep] = useState(1);
   const [formData, setFormData] = useState({
      usageType: 'couple',
      groupName: '',
      groupMembers: [] as string[],
      settings: {
         detectRecurring: true,
         splitDefault: true,
         notifyNew: false
      }
   });
   const totalSteps = 6;

   const handleNext = (data?: Partial<typeof formData>) => {
      if (data) {
         setFormData(prev => ({ ...prev, ...data }));
      }

      if (step < totalSteps) {
         setStep(step + 1);
      } else {
         onComplete();
      }
   };

   const handleBack = () => {
      if (step > 1) {
         setStep(step - 1);
      }
   };

   const getProgress = () => (step / totalSteps) * 100;

   return (
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-slate-900 dark:text-white transition-colors">
         {/* Ambient Background */}
         <div className="fixed top-[-5%] left-[-5%] pointer-events-none opacity-10 dark:opacity-20 z-0">
            <div className="w-[500px] h-[500px] bg-blue-900 rounded-full blur-[120px]" />
         </div>
         <div className="fixed bottom-[-10%] right-[-10%] pointer-events-none opacity-20 dark:opacity-30 z-0">
            <div className="w-[600px] h-[600px] bg-blue-600 rounded-full blur-[140px]" />
         </div>

         {/* Header */}
         <header className="flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4 lg:px-40 sticky top-0 z-50">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
               <div className="size-6 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                     <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
                  </svg>
               </div>
               <h2 className="text-xl font-extrabold leading-tight tracking-tight">Splita</h2>
            </div>
            <div className="flex items-center gap-4">
               {step > 1 && <span className="text-slate-500 text-sm font-medium hidden sm:inline">Paso {step} de {totalSteps}</span>}
               <button className="flex items-center justify-center rounded-xl h-10 px-3 gap-2 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm">
                  <span className="hidden sm:inline">Cerrar</span>
                  <X className="w-4 h-4" />
               </button>
            </div>
         </header>

         <main className="flex flex-1 flex-col items-center justify-center py-8 px-6 z-10">
            {step === 1 && <StepWelcome onNext={handleNext} progress={getProgress()} onLogin={onLogin} />}
            {step === 2 && <StepUsageType onNext={handleNext} onBack={handleBack} progress={getProgress()} initialValue={formData.usageType} />}
            {step === 3 && <StepCreateGroup onNext={handleNext} onBack={handleBack} progress={getProgress()} initialValue={formData.groupName} />}
            {step === 4 && <StepAddPeople onNext={handleNext} onBack={handleBack} progress={getProgress()} initialValue={formData.groupMembers} />}
            {step === 5 && <StepSettings onNext={handleNext} onBack={handleBack} progress={getProgress()} initialValue={formData.settings} />}
            {step === 6 && <StepCreateAccount onNext={handleNext} onBack={handleBack} progress={getProgress()} onLogin={onLogin} onboardingData={formData} />}
         </main>
      </div>
   );
};

const ProgressBar = ({ percent }: { percent: number }) => (
   <div className="flex flex-col gap-3 w-full mb-8">
      <div className="flex gap-6 justify-between items-end">
         <p className="text-slate-500 text-sm font-semibold leading-none uppercase tracking-wider">Tu progreso</p>
         <p className="text-blue-500 text-sm font-bold leading-none transition-all duration-700">{Math.round(percent)}%</p>
      </div>
      <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
         <div
            className="absolute top-0 left-0 h-full bg-blue-gradient transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
            style={{ width: `${percent}%` }}
         >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px] rounded-full shadow-[0_0_10px_white]"></div>
         </div>
      </div>
   </div>
);

const ButtonGroup = ({ onNext, onBack, nextLabel = "Continuar" }: { onNext: () => void, onBack?: () => void, nextLabel?: string }) => (
   <div className="flex gap-4 w-full pt-4">
      {onBack && (
         <button
            onClick={onBack}
            className="flex-1 h-14 md:h-16 rounded-2xl font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
         >
            Atrás
         </button>
      )}
      <button
         onClick={onNext}
         className="flex-[2] flex items-center justify-center gap-3 rounded-2xl bg-blue-gradient h-14 md:h-16 text-white font-bold text-lg shadow-[0_10px_30px_rgba(0,122,255,0.3)] hover:brightness-110 hover:scale-[1.01] transition-all active:scale-95 group"
      >
         {nextLabel}
         <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
   </div>
);

const StepWelcome = ({ onNext, progress, onLogin }: { onNext: () => void, progress: number, onLogin: () => void }) => (
   <div className="flex flex-col w-full max-w-[480px] gap-8 items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="w-full">
         <ProgressBar percent={progress} />
      </div>
      <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center my-2">
         <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[60px]" />
         <svg className="w-full h-full relative z-10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" className="fill-slate-100 dark:fill-[#001A33]" r="80"></circle>
            <rect fill="#007AFF" height="40" rx="4" width="30" x="65" y="100"></rect>
            <circle cx="80" cy="85" fill="#007AFF" r="12"></circle>
            <rect className="fill-blue-800 dark:fill-[#003366]" height="40" rx="4" width="30" x="105" y="100"></rect>
            <circle cx="120" cy="85" className="fill-blue-800 dark:fill-[#003366]" r="12"></circle>
            <rect fill="#0055CC" height="40" rx="4" width="30" x="85" y="110"></rect>
            <circle cx="100" cy="95" fill="#0055CC" r="12"></circle>
         </svg>
      </div>
      <div className="space-y-3">
         <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl md:text-4xl font-extrabold leading-tight">
            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">Splita</span>
         </h1>
         <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-normal leading-relaxed max-w-[340px] mx-auto">
            La forma más fácil de organizar gastos compartidos.
         </p>
      </div>
      <div className="w-full space-y-4">
         <button onClick={onNext} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-gradient h-14 md:h-16 text-white font-bold text-lg md:text-xl shadow-[0_0_20px_rgba(0,122,255,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95 group">
            Empezar
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
         </button>
         <p className="text-slate-500 text-sm">
            Ya tenés cuenta? <button onClick={onLogin} className="text-blue-500 font-semibold hover:underline">Iniciá sesión</button>
         </p>
      </div>
   </div>
);

const StepUsageType = ({ onNext, onBack, progress, initialValue }: { onNext: (data: any) => void, onBack: () => void, progress: number, initialValue: string }) => {
   const [selected, setSelected] = useState<string>(initialValue);

   const options = [
      { id: 'solo', title: 'Solo (Personal)', desc: 'Lleva el control total de tus gastos individuales.', icon: User },
      { id: 'couple', title: 'En Pareja', desc: 'Sincroniza finanzas y gastos compartidos.', icon: Heart },
      { id: 'friends', title: 'Con Amigos', desc: 'Divide cuentas de viajes y salidas.', icon: Users },
   ];

   return (
      <div className="w-full max-w-4xl flex flex-col items-center gap-8 md:gap-10 animate-in fade-in slide-in-from-right-8 duration-500">
         <div className="w-full max-w-[480px]">
            <ProgressBar percent={progress} />
         </div>
         <div className="text-center space-y-3 max-w-2xl">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl lg:text-5xl font-extrabold leading-tight">¿Cómo vas a usar Splita?</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">Personalizá tu experiencia. Podrás cambiar esto más adelante.</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
            {options.map((opt) => (
               <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`relative flex flex-col items-start p-6 md:p-8 rounded-3xl transition-all duration-300 hover:scale-[1.02] text-left border ${selected === opt.id ? 'bg-primary/10 border-primary backdrop-blur-xl ring-1 ring-primary' : 'glass-panel border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
               >
                  {selected === opt.id && (
                     <div className="absolute top-4 right-4 bg-primary text-white rounded-full size-6 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                     </div>
                  )}
                  <div className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${selected === opt.id ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-slate-300'}`}>
                     <opt.icon className="w-6 h-6" fill={selected === opt.id && opt.id === 'couple' ? 'currentColor' : 'none'} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-900 dark:text-white">{opt.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">{opt.desc}</p>
               </button>
            ))}
         </div>
         <div className="w-full max-w-sm">
            <ButtonGroup onNext={() => onNext({ usageType: selected })} onBack={onBack} />
         </div>
      </div>
   );
};

const StepCreateGroup = ({ onNext, onBack, progress, initialValue }: { onNext: (data: any) => void, onBack: () => void, progress: number, initialValue: string }) => {
   const [name, setName] = useState(initialValue);

   return (
      <div className="flex flex-col w-full max-w-[480px] gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
         <div>
            <ProgressBar percent={progress} />
            <p className="text-slate-500 text-sm mt-3 font-medium">Información básica</p>
         </div>
         <div className="text-center space-y-2">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl md:text-[32px] font-extrabold leading-tight">Creemos tu primer grupo</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base px-4">Podés invitar a tus amigos después.</p>
         </div>
         <div className="flex flex-col gap-6">
            <div className="relative group">
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1" htmlFor="group-name">Nombre del grupo</label>
               <input
                  className="w-full h-16 bg-white dark:bg-[#0A121E] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                  id="group-name"
                  placeholder="Ej: Viaje a Bariloche"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
               />
            </div>
            <ButtonGroup onNext={() => onNext({ groupName: name })} onBack={onBack} />
         </div>
      </div>
   );
};

const StepAddPeople = ({ onNext, onBack, progress, initialValue }: { onNext: (data: any) => void, onBack: () => void, progress: number, initialValue: string[] }) => {
   const [members, setMembers] = useState<string[]>(initialValue);
   const [newEmail, setNewEmail] = useState('');

   const handleAdd = () => {
      if (newEmail && !members.includes(newEmail)) {
         setMembers([...members, newEmail]);
         setNewEmail('');
      }
   };

   const handleRemove = (email: string) => {
      setMembers(members.filter(m => m !== email));
   };

   const shareText = "¡Unite a mi grupo en Splita! Acá tenés el link: splita.app/join/vj12984k1";

   const handleWhatsappShare = () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
   };

   return (
      <div className="flex flex-col w-full max-w-[480px] gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
         <div>
            <ProgressBar percent={progress} />
            <p className="text-slate-500 text-sm mt-3 font-medium">Sumá a los integrantes</p>
         </div>
         <div className="text-center">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl md:text-[32px] font-extrabold leading-tight pb-2">Sumá a tu gente</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal px-4">Invitá a tus amigos para empezar a organizar los gastos del grupo.</p>
         </div>
         <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Integrantes actuales</p>
            <div className="flex gap-2 flex-wrap min-h-[44px]">
               <div className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-blue-600/20 border border-blue-500/30 pl-3 pr-4 shadow-sm">
                  <User className="w-5 h-5 text-blue-500" />
                  <p className="text-slate-900 dark:text-white text-sm font-semibold">Vos</p>
               </div>
               {members.map(email => (
                  <div key={email} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 pl-3 pr-2 shadow-sm">
                     <User className="w-5 h-5 text-slate-400" />
                     <p className="text-slate-700 dark:text-white text-sm font-medium">{email.split('@')[0]}</p>
                     <button onClick={() => handleRemove(email)} className="ml-1 text-slate-400 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                     </button>
                  </div>
               ))}
            </div>
         </div>
         <div className="flex gap-2">
            <input
               type="email"
               placeholder="amigo@email.com"
               className="flex-1 h-16 bg-white dark:bg-[#0A121E] border border-slate-200 dark:border-slate-800 rounded-2xl px-6"
               value={newEmail}
               onChange={(e) => setNewEmail(e.target.value)}
            />
            <button
               onClick={handleAdd}
               className="px-6 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 font-bold"
            >
               Sumar
            </button>
         </div>

         <div className="bg-white dark:bg-[#0A121E] rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[40px] -mr-16 -mt-16"></div>
            <div className="flex items-center gap-3 relative z-10">
               <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Smartphone className="w-5 h-5" />
               </div>
               <h3 className="text-slate-900 dark:text-white font-bold text-lg">Compartir invitación</h3>
            </div>

            <button
               onClick={handleWhatsappShare}
               className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#25D366] text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-green-500/20 relative z-10"
            >
               <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
               Enviar por WhatsApp
            </button>

            <div className="flex gap-2 relative z-10">
               <div className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400 truncate font-mono">
                  splita.app/join/vj12984k1
               </div>
               <button className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white w-12 rounded-xl flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                  <Copy className="w-5 h-5" />
               </button>
            </div>
         </div>
         <ButtonGroup onNext={() => onNext({ groupMembers: members })} onBack={onBack} nextLabel="Siguiente paso" />
      </div>
   );
};

const SettingToggle = ({ title, desc, checked, onChange }: { title: string, desc: string, checked: boolean, onChange: (val: boolean) => void }) => {
   return (
      <div
         className="flex items-center justify-between p-5 bg-white dark:bg-[#0A121E] border border-slate-200 dark:border-slate-800/60 rounded-2xl hover:border-blue-500 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-sm"
         onClick={() => onChange(!checked)}
      >
         <div className="flex flex-col gap-0.5">
            <span className="text-slate-900 dark:text-white font-semibold">{title}</span>
            <span className="text-slate-500 text-xs">{desc}</span>
         </div>
         <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-blue-600/30 border border-blue-500/50' : 'bg-slate-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-6 bg-blue-gradient' : 'translate-x-0 bg-slate-500'}`} />
         </div>
      </div>
   );
};

const StepSettings = ({ onNext, onBack, progress, initialValue }: { onNext: (data: any) => void, onBack: () => void, progress: number, initialValue: any }) => {
   const [settings, setSettings] = useState(initialValue);

   const updateSetting = (key: string, val: boolean) => {
      setSettings({ ...settings, [key]: val });
   };

   return (
      <div className="flex flex-col w-full max-w-[480px] gap-8 md:gap-10 animate-in fade-in slide-in-from-right-8 duration-500">
         <div>
            <ProgressBar percent={progress} />
         </div>
         <div className="text-center">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl sm:text-[36px] font-extrabold leading-tight pb-3">Configurá tu entorno</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed px-4">Personalizá cómo funciona Splita para este grupo.</p>
         </div>
         <div className="flex flex-col gap-3">
            <SettingToggle title="Detectar gastos repetitivos" desc="Sugerencias automáticas para abonos mensuales" checked={settings.detectRecurring} onChange={(val) => updateSetting('detectRecurring', val)} />
            <SettingToggle title="Dividir 50/50 por defecto" desc="Ahorrá tiempo en la carga de gastos" checked={settings.splitDefault} onChange={(val) => updateSetting('splitDefault', val)} />
            <SettingToggle title="Notificar nuevos gastos" desc="Avisar a todos cuando alguien suma un ticket" checked={settings.notifyNew} onChange={(val) => updateSetting('notifyNew', val)} />
         </div>
         <div className="flex flex-col gap-4 mt-4">
            <ButtonGroup onNext={() => onNext({ settings })} onBack={onBack} />
         </div>
      </div>
   );
};

const StepCreateAccount = ({ onNext, onBack, progress, onLogin, onboardingData }: { onNext: () => void, onBack: () => void, progress: number, onLogin: () => void, onboardingData: any }) => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const { signUp, signInWithOAuth } = useAuth(); // Using real signUp

   const handleSignUp = async () => {
      setError(null);
      setLoading(true);
      if (!email || !password) {
         setError("Por favor, completá todos los campos.");
         setLoading(false);
         return;
      }
      try {
         const { data: authData, error: authError } = await signUp({
            email,
            password,
            options: {
               data: {
                  full_name: email.split('@')[0],
                  // Note: avatar_url is now generated by Supabase trigger
                  // which handles both OAuth (picture) and email signup properly
                  usage_type: onboardingData.usageType,
                  settings: onboardingData.settings
               }
            }
         });

         if (authError) throw authError;

         const supabaseModule = await import('@/lib/supabase');
         const supabase = supabaseModule.supabase;

         // Save user settings from onboarding Step 5
         if (authData.user) {
            const { error: settingsError } = await supabase
               .from('user_settings')
               .upsert({
                  user_id: authData.user.id,
                  usage_type: onboardingData.usageType,
                  detect_recurring: onboardingData.settings.detectRecurring,
                  split_default: onboardingData.settings.splitDefault,
                  notify_new: onboardingData.settings.notifyNew
               });

            if (settingsError) {
               console.error("Error saving user settings:", settingsError);
            }
         }

         // If we have a group name, create it
         if (onboardingData.groupName && authData.user) {
            const { data: group, error: groupError } = await supabase
               .from('groups')
               .insert({
                  name: onboardingData.groupName,
                  type: onboardingData.usageType === 'solo' ? 'other' : onboardingData.usageType,
                  created_by: authData.user.id
               })
               .select()
               .single();

            if (groupError) {
               console.error("Error creating group:", groupError);
            } else if (group) {
               // Add creator as admin member
               const { error: memberError } = await supabase
                  .from('group_members')
                  .insert({
                     group_id: group.id,
                     user_id: authData.user.id,
                     role: 'admin'
                  });

               if (memberError) {
                  console.error("Error adding creator as member:", memberError);
               }

               // Note: Invited members (emails) would need a group_invites table
               // For now we log them for future implementation
               if (onboardingData.groupMembers.length > 0) {
                  console.log("Pending invites:", onboardingData.groupMembers);
               }
            }
         }

         onNext();
      } catch (err: any) {
         setError(err.message || 'Error al crear cuenta');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex flex-col w-full max-w-[480px] gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
         <div>
            <ProgressBar percent={progress} />
            <p className="text-slate-500 text-sm mt-3 font-medium">Último paso</p>
         </div>
         <div className="text-center">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl md:text-[32px] font-extrabold leading-tight pb-2">Creá tu cuenta</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal px-4">Guardá tu progreso y accedé a todos tus grupos desde cualquier dispositivo.</p>
         </div>

         <div className="space-y-4">
            {error && (
               <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
                  {error}
               </div>
            )}

            <div className="grid grid-cols-2 gap-3">
               <button
                  onClick={() => {
                     localStorage.setItem('pending_onboarding', JSON.stringify(onboardingData));
                     signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
                  }}
                  className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white text-slate-700 font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
               >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
               </button>
               <button
                  onClick={() => {
                     localStorage.setItem('pending_onboarding', JSON.stringify(onboardingData));
                     signInWithOAuth({ provider: 'facebook', options: { redirectTo: window.location.origin } });
                  }}
                  className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-[#1877F2] text-white font-bold hover:bg-[#166fe5] transition-colors shadow-sm"
               >
                  <Facebook className="w-5 h-5 fill-current" />
                  Facebook
               </button>
            </div>

            <div className="relative py-2">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-slate-500">O registrate con email</span>
               </div>
            </div>

            <div className="space-y-3">
               <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                     type="email"
                     placeholder="Correo electrónico"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full h-14 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
               </div>
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                     type="password"
                     placeholder="Contraseña"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full h-14 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
               </div>
            </div>

            <div className="flex gap-4 w-full pt-4">
               <button
                  onClick={onBack}
                  disabled={loading}
                  className="flex-1 h-14 md:h-16 rounded-2xl font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50"
               >
                  Atrás
               </button>
               <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-3 rounded-2xl bg-blue-gradient h-14 md:h-16 text-white font-bold text-lg shadow-[0_10px_30px_rgba(0,122,255,0.3)] hover:brightness-110 hover:scale-[1.01] transition-all active:scale-95 group disabled:opacity-70 disabled:pointer-events-none"
               >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear cuenta"}
               </button>
            </div>

            <p className="text-center text-xs text-slate-400">
               Ya tenés cuenta? <button onClick={onLogin} className="text-blue-500 font-semibold hover:underline">Iniciá sesión</button>
            </p>
         </div>
      </div>
   );
};

export default Onboarding;