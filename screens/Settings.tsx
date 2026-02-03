
import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Printer, 
  Trash2, 
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Copy,
  Terminal,
  ShieldAlert,
  Play,
  Upload,
  Image as ImageIcon,
  Eye,
  Ticket,
  Share2,
  Smartphone
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { AppSettings, Product, Sale } from '../types.ts';
import { APP_PURPLE_GRADIENT, FALCON_LOGO_SVG } from '../constants.tsx';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  onReconnect: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, onReconnect }) => {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('ms_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('ms_supabase_key') || '');

  const handleSave = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    setSuccessMsg('Ajustes salvos!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande. Use uma imagem de até 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSave({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlParam = encodeURIComponent(supabaseUrl);
    const keyParam = encodeURIComponent(supabaseKey);
    const fullUrl = `${baseUrl}?u=${urlParam}&k=${keyParam}${window.location.hash}`;
    
    navigator.clipboard.writeText(fullUrl);
    setSuccessMsg('Link de configuração copiado! Envie para seu celular.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleConnectSupabase = async () => {
    const url = supabaseUrl.trim();
    const key = supabaseKey.trim();

    if (!url || !key) {
      setErrorMsg('Preencha as chaves do Supabase.');
      return;
    }

    setIsTesting(true);
    setErrorMsg('');
    try {
      const client = createClient(url, key);
      const { error: tableError } = await client.from('products').select('id').limit(1);
      
      if (tableError) {
        throw new Error("Banco conectado, mas tabelas não encontradas. Verifique o SQL Setup.");
      }

      localStorage.setItem('ms_supabase_url', url);
      localStorage.setItem('ms_supabase_key', key);
      onReconnect();
      setSuccessMsg('Banco de Dados conectado e salvo!');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao conectar.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Configurações</h1>
          <p className="text-slate-500">Personalize sua experiência e gerencie a nuvem.</p>
        </div>
        <button 
          onClick={generateShareLink}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all border border-blue-200"
        >
          <Smartphone size={18} /> Copiar Link para Celular
        </button>
      </header>

      {(successMsg || errorMsg) && (
        <div className={`p-5 rounded-3xl flex items-center gap-3 border shadow-sm animate-in fade-in ${errorMsg ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {errorMsg ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
          <span className="font-bold">{errorMsg || successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-blue-600">
            <ImageIcon size={24} /> Identidade do Evento
          </h3>
          <div className="flex flex-col items-center gap-6 p-6 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <div className="w-32 h-32 rounded-3xl bg-white shadow-inner flex items-center justify-center overflow-hidden">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : FALCON_LOGO_SVG(64)}
            </div>
            <div className="flex flex-col items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 rounded-2xl bg-white text-blue-600 font-bold text-sm shadow-sm border border-blue-100 flex items-center gap-2">
                <Upload size={18} /> Carregar Nova Logo
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome do Evento (Salvo na Nuvem)</label>
              <input
                type="text"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none font-bold"
                value={settings.eventName}
                onChange={(e) => handleSave({ eventName: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-purple-600">
            <Printer size={24} /> Impressão
          </h3>
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Largura do Papel</label>
            <div className="grid grid-cols-2 gap-4">
              {['58mm', '80mm'].map(w => (
                <button
                  key={w}
                  onClick={() => handleSave({ printerWidth: w as any })}
                  className={`py-4 rounded-2xl font-bold border-2 transition-all ${settings.printerWidth === w ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-transparent bg-slate-50 text-slate-400'}`}
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Mostrar Logo no Ticket</span>
              <button 
                onClick={() => handleSave({ showLogoOnTicket: !settings.showLogoOnTicket })}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.showLogoOnTicket ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showLogoOnTicket ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-blue-600">
            <Database size={24} /> Conexão Supabase
          </h3>
          <p className="text-xs text-slate-400">Estes dados vinculam o app ao seu banco de dados privado.</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Supabase URL"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none text-sm font-mono"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
            <input
              type="password"
              placeholder="API Key (Anon)"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none text-sm font-mono"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
            <button
              onClick={handleConnectSupabase}
              disabled={isTesting}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              {isTesting ? <RefreshCcw className="animate-spin" size={18} /> : <Play size={18} />} Validar e Salvar
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
