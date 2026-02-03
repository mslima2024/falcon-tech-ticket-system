
import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, X, Printer, Trash2, Plus, Minus, ArrowRight, Ticket, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Product, Sale, AppSettings } from '../types.ts';
import { APP_PURPLE_GRADIENT, FALCON_LOGO_SVG } from '../constants.tsx';

interface SalesProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  settings: AppSettings;
  onSaleSync: (sale: Sale) => Promise<void>;
}

const Sales: React.FC<SalesProps> = ({ products, setProducts, sales, setSales, settings, onSaleSync }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ productId: string, quantity: number }[]>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastSalesBatch, setLastSalesBatch] = useState<Sale[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setSyncError(false);
    const newSales: Sale[] = [];
    const timestamp = new Date().toISOString();

    try {
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          for (let i = 0; i < item.quantity; i++) {
            const sale: Sale = {
              id: crypto.randomUUID(),
              productId: product.id,
              productName: product.name,
              price: product.price,
              timestamp,
              quantity: 1
            };
            newSales.push(sale);
            await onSaleSync(sale).catch(e => {
               console.error("Falha ao sincronizar item:", e);
               setSyncError(true);
            });
          }
        }
      }

      setSales(prev => [...newSales, ...prev]);
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(ci => ci.productId === p.id);
        return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
      }));

      setLastSalesBatch(newSales);
      setShowPrintPreview(true);
      setCart([]);
    } catch (err) {
      alert("Erro ao processar venda.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerNativePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert("Por favor, habilite Pop-ups no seu navegador para realizar a impressão das fichas.");
      return;
    }

    const logoHtml = settings.showLogoOnTicket && settings.logoUrl 
      ? `<img src="${settings.logoUrl}" style="height: 12mm; width: auto; margin-bottom: 2mm; display: block; margin-left: auto; margin-right: auto;">`
      : '';

    const ticketsHtml = lastSalesBatch.map((sale) => `
      <div class="ticket">
        ${logoHtml}
        <h2 class="event-name">${settings.eventName.toUpperCase()}</h2>
        <div class="divider"></div>
        <p class="label">VALE UM(A)</p>
        <h1 class="product-name">${sale.productName.toUpperCase()}</h1>
        <div class="divider"></div>
        <p class="date">${new Date(sale.timestamp).toLocaleString('pt-BR')}</p>
        <p class="auth">AUT: ${sale.id.split('-')[0].toUpperCase()}</p>
        <p class="footer">FALCON TECH TICKETS</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão - Falcon Tech</title>
          <style>
            @page { 
              margin: 0; 
              size: auto;
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: sans-serif; 
              background-color: white; 
              color: black;
            }
            .ticket {
              width: ${settings.printerWidth};
              padding: 2mm 4mm; /* Reduzido de 10mm para economizar papel */
              text-align: center;
              box-sizing: border-box;
              page-break-after: always;
              overflow: hidden;
            }
            .event-name { 
              margin: 0; 
              font-size: 11pt; /* Levemente menor para caber melhor */
              font-weight: bold; 
              line-height: 1.1;
            }
            .divider { 
              border-top: 1px dashed black; 
              margin: 2mm 0; /* Reduzido de 5mm */
            }
            .label { 
              font-size: 9pt; 
              margin: 0; 
              font-weight: bold; 
            }
            .product-name { 
              font-size: 20pt; /* Ajustado para equilíbrio visual e economia */
              margin: 2mm 0; 
              font-weight: 900; 
              line-height: 1;
              word-wrap: break-word;
              text-transform: uppercase;
            }
            .date { 
              font-size: 7pt; 
              margin: 0; 
            }
            .auth { 
              font-size: 8pt; 
              margin: 1mm 0 0 0; 
              font-weight: bold; 
            }
            .footer { 
              font-size: 6pt; 
              margin: 3mm 0 0 0; /* Reduzido para aproximar do fim do texto */
              font-weight: bold; 
              opacity: 0.5;
            }
          </style>
        </head>
        <body>
          ${ticketsHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setShowPrintPreview(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full animate-in fade-in duration-500">
      <div className="flex-1 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar produto pelo nome..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredProducts.map(p => {
            const cartItem = cart.find(item => item.productId === p.id);
            const quantityInCart = cartItem ? cartItem.quantity : 0;
            
            return (
              <button 
                key={p.id} 
                onClick={() => addToCart(p.id)} 
                disabled={p.stock <= 0} 
                className={`p-5 bg-white rounded-[32px] shadow-sm text-left hover:scale-[1.03] transition-all border-2 border-transparent active:border-blue-200 group relative ${p.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
              >
                {quantityInCart > 0 && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg animate-in zoom-in duration-300 border-2 border-white z-10">
                    {quantityInCart}
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center text-white font-bold text-xl group-hover:rotate-6 transition-transform ${APP_PURPLE_GRADIENT}`}>
                  {p.name[0]}
                </div>
                <h3 className="font-bold text-slate-800 truncate leading-tight">{p.name}</h3>
                <p className="text-blue-600 font-black mt-1">R$ {p.price.toFixed(2)}</p>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Stock</span>
                  <span className={p.stock < 10 ? 'text-rose-500' : ''}>{p.stock} un</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="w-full lg:w-96 bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 h-[calc(100vh-120px)] sticky top-4">
        <div className={`p-8 text-white ${APP_PURPLE_GRADIENT} flex items-center justify-between`}>
          <h2 className="text-xl font-bold flex items-center gap-3"><ShoppingCart size={24} /> Pedido</h2>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{cart.reduce((a,b)=>a+b.quantity,0)} un</div>
        </div>
        
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
              <ShoppingCart size={64} strokeWidth={1} />
              <p className="font-bold uppercase tracking-widest text-[10px]">Carrinho Vazio</p>
            </div>
          )}
          {cart.map(item => {
            const p = products.find(x => x.id === item.productId)!;
            return (
              <div key={item.productId} className="flex items-center justify-between group">
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400 font-bold">R$ {(p.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl group-hover:bg-slate-100 transition-colors">
                  <button onClick={() => setCart(prev => prev.map(x => x.productId === p.id ? {...x, quantity: Math.max(1, x.quantity-1)} : x))} className="p-1 hover:text-blue-600"><Minus size={16}/></button>
                  <span className="font-black text-slate-700 min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => setCart(prev => prev.map(x => x.productId === p.id ? {...x, quantity: x.quantity+1} : x))} className="p-1 hover:text-blue-600"><Plus size={16}/></button>
                  <button onClick={() => setCart(prev => prev.filter(x => x.productId !== p.id))} className="ml-2 text-rose-300 hover:text-rose-500"><X size={16}/></button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-slate-50 space-y-4 border-t border-slate-100">
          <div className="justify-between items-end flex">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Geral</span>
            <span className="text-3xl font-black text-slate-900">R$ {cart.reduce((acc, item) => acc + (products.find(p => p.id === item.productId)?.price || 0) * item.quantity, 0).toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-5 rounded-3xl text-white font-bold text-lg shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 transition-all active:scale-95 ${cart.length === 0 || isProcessing ? 'bg-slate-300 cursor-not-allowed' : APP_PURPLE_GRADIENT}`}
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <ArrowRight size={24} />}
            {isProcessing ? 'Processando...' : 'Confirmar Venda'}
          </button>
        </div>
      </aside>

      {showPrintPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 overflow-hidden">
          <div className="bg-slate-100 rounded-[60px] max-w-4xl w-full h-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            
            <div className="p-8 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Pronto para Imprimir</h2>
                  <p className="text-slate-400 text-sm font-medium">As {lastSalesBatch.length} fichas Falcon Tech foram geradas.</p>
                </div>
              </div>
              <button onClick={() => setShowPrintPreview(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-200/50 flex flex-col items-center gap-12 custom-scrollbar">
              {lastSalesBatch.map((sale, i) => (
                <div 
                  key={i} 
                  className="bg-white shadow-xl relative transition-transform hover:scale-[1.02] duration-300"
                  style={{ width: settings.printerWidth === '80mm' ? '320px' : '240px' }}
                >
                  <div className="p-6 text-center border-b-[3px] border-dashed border-slate-200 relative">
                    {settings.showLogoOnTicket && (
                      <div className="mb-4 flex justify-center">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain" />
                        ) : (
                          FALCON_LOGO_SVG(40)
                        )}
                      </div>
                    )}
                    <h3 className="text-sm font-black text-blue-700 mb-4 uppercase tracking-wider">{settings.eventName}</h3>
                    <div className="w-full h-[1px] border-t border-dashed border-slate-300 mb-4"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vale Um(a)</p>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight uppercase">{sale.productName}</h1>
                    <div className="w-full h-[1px] border-t border-dashed border-slate-300 mb-4"></div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-slate-400">{new Date(sale.timestamp).toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-800">AUT: {sale.id.split('-')[0].toUpperCase()}</p>
                      <p className="text-[7px] font-bold text-slate-300 mt-2">FALCON TECH TICKETS</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-10 bg-white border-t border-slate-200 flex flex-col md:flex-row gap-4">
              <button 
                onClick={triggerNativePrint} 
                className={`flex-1 py-6 rounded-3xl text-white font-bold text-xl shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all ${APP_PURPLE_GRADIENT}`}
              >
                <Printer size={28} /> Imprimir {lastSalesBatch.length} Fichas
              </button>
              <button 
                onClick={() => setShowPrintPreview(false)} 
                className="px-10 py-6 text-slate-400 font-bold text-lg hover:text-slate-600 hover:bg-slate-50 rounded-3xl transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
