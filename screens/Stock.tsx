
import React, { useState } from 'react';
import { Package, Search } from 'lucide-react';
import { Product } from '../types.ts';

interface StockProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onProductSync: (product: Product) => Promise<void>;
}

const Stock: React.FC<StockProps> = ({ products, setProducts, onProductSync }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const updateStock = async (id: string, newQuantity: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const finalStock = Math.max(0, newQuantity);
    const updated = { ...product, stock: finalStock };

    // Atualiza local primeiro
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    
    setIsUpdating(id);
    try {
      await onProductSync(updated);
    } catch (error) {
      console.error("Erro ao sincronizar estoque remoto:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-slate-500">Controle rápido de entradas e saídas.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Filtrar produto..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-purple-500/20 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(p => (
          <div key={p.id} className={`p-6 bg-white rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-6 transition-all ${isUpdating === p.id ? 'ring-2 ring-purple-200 opacity-80' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produto</span>
                <span className="font-bold text-lg text-slate-800 truncate max-w-[150px]">{p.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atual</span>
                <h2 className={`text-3xl font-black leading-none ${p.stock < 20 ? 'text-rose-500' : 'text-slate-900'}`}>{p.stock}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateStock(p.id, p.stock + 10)} 
                className="py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-colors uppercase"
              >
                +10 Un.
              </button>
              <button 
                onClick={() => updateStock(p.id, p.stock + 50)} 
                className="py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 transition-colors uppercase shadow-md shadow-emerald-200"
              >
                +50 Un.
              </button>
              <button 
                onClick={() => updateStock(p.id, p.stock - 10)} 
                className="py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs hover:bg-rose-100 transition-colors uppercase"
              >
                -10 Un.
              </button>
              <button 
                onClick={() => {
                  if(window.confirm(`Zerar estoque de ${p.name}?`)) updateStock(p.id, 0);
                }} 
                className="py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-200 transition-colors uppercase"
              >
                Zerar
              </button>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Package size={48} strokeWidth={1} />
            <p className="font-bold uppercase tracking-widest text-xs">Nenhum item encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stock;
