
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, 
  Settings as SettingsIcon, LogOut, Menu, X, ClipboardList, Cloud, CloudOff,
  Maximize, Minimize, User, Share2
} from 'lucide-react';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { Product, Sale, AppSettings } from './types.ts';
import { DEFAULT_PRODUCTS, FALCON_LOGO_SVG, APP_PURPLE_GRADIENT } from './constants.tsx';
import Dashboard from './screens/Dashboard.tsx';
import Sales from './screens/Sales.tsx';
import Products from './screens/Products.tsx';
import Stock from './screens/Stock.tsx';
import Reports from './screens/Reports.tsx';
import Settings from './screens/Settings.tsx';
import Login from './screens/Login.tsx';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    eventName: "Evento Falcon Tech",
    printerWidth: '80mm',
    darkMode: false,
    pin: '1234',
    logoUrl: '',
    showLogoOnTicket: true
  });

  const checkUrlConfig = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get('u');
    const k = params.get('k');
    if (u && k) {
      localStorage.setItem('ms_supabase_url', decodeURIComponent(u));
      localStorage.setItem('ms_supabase_key', decodeURIComponent(k));
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      return true;
    }
    return false;
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const initSupabase = useCallback(() => {
    checkUrlConfig();
    const url = localStorage.getItem('ms_supabase_url')?.trim();
    const key = localStorage.getItem('ms_supabase_key')?.trim();
    
    if (url && key && url.startsWith('https://')) {
      try {
        const client = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          }
        });
        setSupabase(client);
        
        client.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });

        return () => subscription.unsubscribe();
      } catch (e) { 
        console.error("Erro Supabase:", e); 
      }
    }
  }, [checkUrlConfig]);

  const fetchUserData = useCallback(async () => {
    if (!supabase || !session) return;
    
    try {
      const [settingsReq, productsReq, salesReq] = await Promise.all([
        supabase.from('user_settings').select('*').single(),
        supabase.from('products').select('*').order('name'),
        supabase.from('sales').select('*').order('timestamp', { ascending: false })
      ]);
      
      if (settingsReq.data) {
        setSettings({
          eventName: settingsReq.data.event_name,
          printerWidth: settingsReq.data.printer_width as any,
          darkMode: settingsReq.data.dark_mode,
          pin: '1234',
          logoUrl: settingsReq.data.logo_url,
          showLogoOnTicket: settingsReq.data.show_logo_on_ticket
        });
      }

      if (productsReq.data) {
        setProducts(productsReq.data.map(p => ({
          id: p.id, name: p.name, price: p.price, stock: p.stock, category: p.category
        })));
      }

      if (salesReq.data) {
        setSales(salesReq.data.map(s => ({
          id: s.id, productId: s.productid, productName: s.productname,
          price: s.price, timestamp: s.timestamp, quantity: s.quantity
        })));
      }
    } catch (e) {
      console.error("Erro na sincronização entre dispositivos:", e);
    }
  }, [supabase, session]);

  useEffect(() => {
    initSupabase();
    setIsLoaded(true);
    
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [initSupabase]);

  useEffect(() => {
    if (session) {
      fetchUserData();
    }
  }, [session, fetchUserData]);

  const syncProductRemote = useCallback(async (product: Product) => {
    if (!supabase || !session) return;
    await supabase.from('products').upsert({
      id: product.id, name: product.name, price: product.price,
      stock: product.stock, category: product.category, user_id: session.user.id
    });
  }, [supabase, session]);

  const syncSaleRemote = useCallback(async (sale: Sale) => {
    if (!supabase || !session) return;
    await supabase.from('sales').insert({
      id: sale.id, productid: sale.productId, productname: sale.productName,
      price: sale.price, timestamp: sale.timestamp, quantity: sale.quantity,
      user_id: session.user.id
    });
    
    const product = products.find(p => p.id === sale.productId);
    if (product) {
      await supabase.from('products').update({ stock: product.stock - 1 }).eq('id', product.id);
    }
  }, [supabase, session, products]);

  const syncSettingsRemote = useCallback(async (newSettings: AppSettings) => {
    if (!supabase || !session) return;
    await supabase.from('user_settings').upsert({
      user_id: session.user.id,
      event_name: newSettings.eventName,
      printer_width: newSettings.printerWidth,
      dark_mode: newSettings.darkMode,
      logo_url: newSettings.logoUrl,
      show_logo_on_ticket: newSettings.showLogoOnTicket,
      updated_at: new Date().toISOString()
    });
  }, [supabase, session]);

  const clearSalesRemote = useCallback(async () => {
    if (!supabase || !session) return;
    await supabase.from('sales').delete().eq('user_id', session.user.id);
  }, [supabase, session]);

  const deleteProductRemote = useCallback(async (id: string) => {
    if (!supabase || !session) return;
    await supabase.from('products').delete().eq('id', id).eq('user_id', session.user.id);
  }, [supabase, session]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProducts([]);
    setSales([]);
  };

  if (!session) {
    return <Login supabase={supabase} settings={settings} onReconnect={initSupabase} />;
  }

  return (
    <Router>
      <div className={`min-h-screen ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar 
            session={session}
            onLogout={handleLogout} 
            hasSupabase={!!supabase} 
            settings={settings} 
            isFullscreen={isFullscreen} 
            onToggleFullscreen={toggleFullscreen} 
          />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard products={products} sales={sales} />} />
              <Route path="/sales" element={
                <Sales 
                  products={products} setProducts={setProducts} 
                  sales={sales} setSales={setSales} 
                  settings={settings} 
                  onSaleSync={syncSaleRemote} 
                />
              } />
              <Route path="/products" element={
                <Products 
                  products={products} setProducts={setProducts} 
                  onProductSync={syncProductRemote}
                  onProductDelete={deleteProductRemote}
                />
              } />
              <Route path="/stock" element={
                <Stock products={products} setProducts={setProducts} onProductSync={syncProductRemote} />
              } />
              <Route path="/reports" element={
                <Reports 
                  sales={sales} 
                  products={products} 
                  setSales={setSales} 
                  onClearRemoteSales={clearSalesRemote}
                  onRefreshData={fetchUserData}
                  hasSupabase={!!supabase}
                />
              } />
              <Route path="/settings" element={
                <Settings 
                  settings={settings} setSettings={(newS) => {
                    const updated = typeof newS === 'function' ? newS(settings) : newS;
                    setSettings(updated);
                    syncSettingsRemote(updated);
                  }} 
                  onReconnect={initSupabase}
                />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

const Sidebar: React.FC<{ 
  session: Session,
  onLogout: () => void, 
  hasSupabase: boolean, 
  settings: AppSettings,
  isFullscreen: boolean,
  onToggleFullscreen: () => void
}> = ({ session, onLogout, hasSupabase, settings, isFullscreen, onToggleFullscreen }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const menuItems = [
    { path: '/', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { path: '/sales', label: 'Vendas', icon: <ShoppingCart size={20} /> },
    { path: '/products', label: 'Produtos', icon: <Package size={20} /> },
    { path: '/stock', label: 'Estoque', icon: <ClipboardList size={20} /> },
    { path: '/reports', label: 'Relatórios', icon: <BarChart3 size={20} /> },
    { path: '/settings', label: 'Configurações', icon: <SettingsIcon size={20} /> },
  ];

  const LogoDisplay = ({ size }: { size: number }) => (
    settings.logoUrl ? (
      <img src={settings.logoUrl} alt="Logo" className="object-contain" style={{ width: size, height: size }} />
    ) : FALCON_LOGO_SVG(size)
  );

  return (
    <>
      <div className={`md:hidden p-4 flex items-center justify-between ${APP_PURPLE_GRADIENT} text-white sticky top-0 z-[60] shadow-md`}>
        <div className="flex items-center gap-2">
          <LogoDisplay size={28} /> 
          <span className="font-bold uppercase text-sm">Falcon Tech</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-[55] w-72 ${APP_PURPLE_GRADIENT} text-white shadow-2xl transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center gap-3">
          <LogoDisplay size={45} />
          <div className="flex flex-col">
            <span className="font-bold text-xl uppercase leading-tight">Falcon Tech</span>
            <span className="text-[8px] uppercase opacity-70 tracking-[0.1em]">Event Management</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-white/20 text-white shadow-lg border border-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              {item.icon} <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 space-y-3">
          {/* Botão de Tela Cheia Reativado */}
          <button 
            onClick={onToggleFullscreen} 
            className="flex items-center gap-3 px-5 py-3.5 w-full text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            <span className="font-semibold text-sm">{isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}</span>
          </button>

          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
              {session.user.user_metadata.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : <User size={20} />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-xs truncate">{session.user.user_metadata.full_name || 'Usuário'}</span>
              <span className="text-[10px] opacity-50 truncate">{session.user.email}</span>
            </div>
          </div>
          
          <button onClick={onLogout} className="flex items-center gap-3 px-5 py-3.5 w-full text-white/50 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl transition-all">
            <LogOut size={20} /> <span className="font-semibold text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default App;
