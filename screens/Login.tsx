
import React, { useState } from 'react';
import { LogIn, Database, AlertCircle, RefreshCcw, ShieldCheck, HelpCircle, Mail, Lock, UserPlus } from 'lucide-react';
import { FALCON_LOGO_SVG, APP_PURPLE_GRADIENT } from '../constants';
import { AppSettings } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';

interface LoginProps {
  supabase: SupabaseClient | null;
  settings: AppSettings;
  onReconnect: () => void;
}

const Login: React.FC<LoginProps> = ({ supabase, settings, onReconnect }) => {
  const [showConfig, setShowConfig] = useState(!supabase);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [url, setUrl] = useState(localStorage.getItem('ms_supabase_url') || '');
  const [key, setKey] = useState(localStorage.getItem('ms_supabase_key') || '');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSaveConfig = () => {
    setError('');
    if (!url.startsWith('https://') || !key) {
      setError('Credenciais Supabase inválidas.');
      return;
    }
    localStorage.setItem('ms_supabase_url', url.trim());
    localStorage.setItem('ms_supabase_key', key.trim());
    onReconnect();
    setShowConfig(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;
      
      if (isSignUp && result.data.user && !result.data.session) {
        setError('Conta criada! Verifique seu e-mail para confirmar (ou desative "Confirm Email" no painel do Supabase -> Authentication -> Auth Settings).');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${APP_PURPLE_GRADIENT}`}>
      <div className="w-full max-w-md bg-white rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
        <div className="p-10 flex flex-col items-center text-center">
          <div className="mb-6 flex justify-center">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
            ) : FALCON_LOGO_SVG(70)}
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Falcon Tech</h1>
          <p className="text-blue-600 font-black uppercase tracking-[0.2em] text-[9px] mt-2 mb-8">Ticket Management System</p>

          {error && (
            <div className="w-full mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl flex flex-col gap-1 text-left animate-in shake border border-rose-100">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                <AlertCircle size={14} /> Mensagem
              </div>
              <p className="text-[11px] font-medium">{error}</p>
            </div>
          )}

          {showConfig ? (
            <div className="w-full space-y-4">
              <div className="text-left space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Supabase URL</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="text-left space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Anon Key</label>
                <input 
                  type="password" 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="eyJ..."
                />
              </div>
              <button 
                onClick={handleSaveConfig}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
              >
                <Database size={20} /> Salvar e Continuar
              </button>
            </div>
          ) : (
            <div className="w-full">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="relative group text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="exemplo@email.com"
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="relative group text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 mt-4"
                >
                  {isLoading ? <RefreshCcw className="animate-spin" size={20} /> : (isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />)}
                  {isSignUp ? 'Criar Conta e Entrar' : 'Acessar Sistema'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                >
                  {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se aqui'}
                </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-50 space-y-3">
                <button 
                  onClick={() => setShowConfig(true)}
                  className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500"
                >
                  Reconfigurar Banco de Dados
                </button>
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center justify-center gap-1 w-full text-[9px] font-black text-blue-300 uppercase hover:text-blue-500"
                >
                  <HelpCircle size={12} /> Precisa de ajuda?
                </button>

                {showHelp && (
                  <div className="p-4 bg-blue-50 rounded-2xl text-[10px] text-blue-700 text-left space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p>• Use o mesmo e-mail no PC e no Celular para sincronizar seus dados.</p>
                    <p>• Se não conseguir entrar após o cadastro, verifique se confirmou o e-mail ou desative a confirmação no painel Supabase.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-blue-600" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Cloud Access</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Mario Sergio de Lima</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
