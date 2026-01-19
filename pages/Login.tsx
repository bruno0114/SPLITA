import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Facebook } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would implement real auth logic
    onLogin();
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background text-slate-900 dark:text-white transition-colors p-6">
      {/* Ambient Background */}
      <div className="fixed top-[-10%] right-[-5%] pointer-events-none opacity-10 dark:opacity-20 z-0">
        <div className="w-[600px] h-[600px] bg-blue-600 rounded-full blur-[140px]" />
      </div>
      <div className="fixed bottom-[-10%] left-[-5%] pointer-events-none opacity-5 dark:opacity-10 z-0">
        <div className="w-[500px] h-[500px] bg-purple-900 rounded-full blur-[120px]" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-surface/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl rounded-3xl p-8 md:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-6">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
               <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">¡Hola de nuevo!</h1>
          <p className="text-slate-500 dark:text-slate-400">Ingresá tus datos para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-4">
              <div className="relative group">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                 <input 
                    type="email" 
                    placeholder="Correo electrónico" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium" 
                 />
              </div>
              <div className="relative group">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                 <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium" 
                 />
              </div>
           </div>
           
           <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                 ¿Olvidaste tu contraseña?
              </button>
           </div>

           <button 
              type="submit" 
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-gradient h-14 text-white font-bold text-lg shadow-[0_10px_30px_rgba(0,122,255,0.3)] hover:brightness-110 hover:scale-[1.01] transition-all active:scale-95"
           >
              Iniciar sesión
              <ArrowRight className="w-5 h-5" />
           </button>
        </form>

        <div className="relative py-6">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
           </div>
           <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
             <span className="bg-surface px-4 text-slate-500">O continuá con</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <button className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-slate-700 font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
           </button>
           <button className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1877F2] text-white font-bold hover:bg-[#166fe5] transition-colors shadow-sm text-sm">
              <Facebook className="w-5 h-5 fill-current" />
              Facebook
           </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
           ¿No tenés cuenta?{' '}
           <button onClick={onRegister} className="text-blue-500 font-bold hover:underline">
              Crear cuenta
           </button>
        </p>
      </div>
    </div>
  );
};

export default Login;