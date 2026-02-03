
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, CheckCircle2 } from 'lucide-react';
import { Product } from '../types.ts';
import { APP_PURPLE_GRADIENT } from '../constants.tsx';

// Helper local para ID
const generateId = () => Math.random().toString(36).substring(2, 15);

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onProductSync: (product: Product) => Promise<void>;
  onProductDelete: (id: string) => Promise<void>;
}

const Products: React.FC<ProductsProps> = ({ products, setProducts, onProductSync, onProductDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '100', category: 'Bebida' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const CATEGORIES = ['Bebida', 'Comida', 'Sobremesa', 'Lanche', 'Outros'];

  const handleSave = async () => {
    if (!formData.name || !formData.price) return;
    
    const product: Product = {
      id: editingProduct?.id || generateId(),
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category
    };

    // Atualiza local primeiro para ser instantâneo
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } else {
      setProducts(prev => [product, ...prev]);
    }

    try {
      await onProductSync(product);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (!editingProduct) setIsModalOpen(false);
      }, 1000);
    } catch (error) {
      console.error("Erro ao sincronizar produto:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente EXCLUIR o produto "${name}"? Esta ação removerá o item da lista imediatamente.`)) {
      setIsDeleting(id);
      
      // Remove localmente primeiro
      setProducts(prev => prev.filter(p => p.id !== id));
      
      try {
        await onProductDelete(id);
      } catch (error) {
        console.error("Erro ao deletar remotamente, mas o item foi removido localmente.", error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const openNewModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '100', category: 'Bebida' });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      price: p.price.toString(),
      stock: p.stock.toString(),
      category: p.category
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-slate-500">Gerencie o catálogo de itens do evento.</p>
        </div>
        <button 
          onClick={openNewModal} 
          className={`px-6 py-4 rounded-2xl text-white font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all ${APP_PURPLE_GRADIENT}`}
        >
          <Plus size={20}/> Novo Produto
        </button>
      </header>
      
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">
              <tr>
                <th className="px-8 py-5">Produto</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5">Preço</th>
                <th className="px-8 py-5">Estoque</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => (
                <tr key={p.id} className={`group hover:bg-slate-50/50 transition-colors ${isDeleting === p.id ? 'opacity-30 bg-rose-50' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold ${APP_PURPLE_GRADIENT}`}>
                        {p.name[0]}
                      </div>
                      <span className="font-bold text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] uppercase">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-purple-600">R$ {Number(p.price).toFixed(2)}</td>
                  <td className="px-8 py-5 text-slate-500">{p.stock}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button 
                      onClick={() => openEditModal(p)} 
                      disabled={isDeleting === p.id}
                      className="p-2.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all disabled:opacity-30"
                    >
                      <Edit2 size={18}/>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id, p.name);
                      }} 
                      disabled={isDeleting === p.id}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">Nenhum produto cadastrado no momento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[50px] p-10 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">
                {editingProduct ? 'Editar Produto' : 'Novo Registro'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={20} />
                <span className="text-sm font-bold uppercase">Sincronizado!</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nome</label>
                <input 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500/20 font-bold" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Preço (R$)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500/20 font-bold" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Estoque</label>
                  <input 
                    type="number"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500/20 font-bold" 
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Categoria</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500/20 font-bold"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              className={`w-full py-5 rounded-3xl text-white font-bold text-lg shadow-xl active:scale-95 transition-all ${APP_PURPLE_GRADIENT}`}
            >
              Confirmar e Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
