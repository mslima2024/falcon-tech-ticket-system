
import React, { useMemo, useState } from 'react';
import { 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Package,
  Trash2,
  CheckCircle2,
  Cloud,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Product, Sale } from '../types';
import { APP_PURPLE_GRADIENT } from '../constants';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  onClearRemoteSales: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  hasSupabase: boolean;
}

const Reports: React.FC<ReportsProps> = ({ sales, products, setSales, onClearRemoteSales, onRefreshData, hasSupabase }) => {
  const [successMsg, setSuccessMsg] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chartData = useMemo(() => {
    const salesById: Record<string, { revenue: number, count: number, lastName: string }> = {};
    
    sales.forEach(s => {
      if (!salesById[s.productId]) {
        salesById[s.productId] = { revenue: 0, count: 0, lastName: s.productName };
      }
      salesById[s.productId].revenue += (Number(s.price) * Number(s.quantity));
      salesById[s.productId].count += Number(s.quantity);
    });

    return Object.entries(salesById).map(([id, data]) => {
      const currentProduct = products.find(p => p.id === id);
      return {
        id,
        name: currentProduct ? currentProduct.name : data.lastName,
        revenue: data.revenue,
        count: data.count
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [sales, products]);

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'];

  const handleClearSales = async () => {
    if (window.confirm('Atenção: Você está prestes a apagar TODO o histórico de vendas (Local e Nuvem). Deseja continuar?')) {
      setIsClearing(true);
      
      // Limpa local primeiro
      setSales([]);
      
      try {
        await onClearRemoteSales();
        setSuccessMsg('Histórico de vendas limpo com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (e) {
        console.error("Erro ao limpar dados na nuvem, mas os dados locais foram removidos.", e);
        alert("Erro ao limpar dados na nuvem. Verifique sua conexão Supabase.");
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
      setSuccessMsg('Dados sincronizados com a nuvem!');
    } catch (e) {
      alert("Erro ao sincronizar.");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setSuccessMsg('');
      }, 2000);
    }
  };

  const exportToCSV = () => {
    if (sales.length === 0) {
      alert('Não há vendas para exportar.');
      return;
    }
    const headers = ['Data/Hora', 'Produto', 'Preço Unitário', 'Quantidade', 'Total'];
    const rows = sales.map(s => [
      new Date(s.timestamp).toLocaleString('pt-BR'),
      s.productName,
      Number(s.price).toFixed(2),
      s.quantity,
      (Number(s.price) * Number(s.quantity)).toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.price) * Number(s.quantity)), 0);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
             {hasSupabase && (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                 <Cloud size={10} /> Cloud Sync Active
               </div>
             )}
          </div>
          <p className="text-slate-500">Dados detalhados do desempenho comercial.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold bg-white text-emerald-600 shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
          <button
            onClick={handleClearSales}
            disabled={isClearing}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold bg-white text-rose-500 shadow-sm border border-rose-100 hover:bg-rose-50 transition-all disabled:opacity-50"
          >
            <Trash2 size={18} /> Zerar Histórico
          </button>
          <button
            onClick={exportToCSV}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all ${APP_PURPLE_GRADIENT}`}
          >
            <Download size={20} /> Exportar CSV
          </button>
        </div>
      </header>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={24} />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden relative">
          <div className="z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Receita Total</p>
            <h2 className="text-4xl font-black text-slate-800 mt-2">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 w-fit px-3 py-1 rounded-full">
              <ArrowUpRight size={16} /> Meta alcançada
            </div>
          </div>
          <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-slate-50 opacity-[0.05]" />
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <FileText size={20} className="text-purple-500" /> Distribuição
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.revenue > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="revenue"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-purple-500" /> Atividade
          </h3>
          <div className="space-y-4">
            {sales.slice(0, 4).map(sale => (
              <div key={sale.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{sale.productName}</span>
                  <span className="text-[10px] text-slate-400">{new Date(sale.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
                <span className="font-bold text-emerald-600">+ R$ {(Number(sale.price) * Number(sale.quantity)).toFixed(2)}</span>
              </div>
            ))}
            {sales.length === 0 && <p className="text-center text-slate-400 py-6">Sem vendas hoje.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center gap-2">
          <Package className="text-purple-600" size={24} />
          <h3 className="text-xl font-bold">Vendas por Produto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-8 py-4">Produto</th>
                <th className="px-8 py-4">Quantidade</th>
                <th className="px-8 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {chartData.map((item, index) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                        {item.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="font-medium text-slate-600">{item.count} un.</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="font-black text-purple-700">R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                </tr>
              ))}
              {chartData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-400">Nenhum dado disponível.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50/80">
              <tr className="font-bold text-slate-900">
                <td className="px-8 py-4">TOTAL GERAL</td>
                <td className="px-8 py-4">{chartData.reduce((acc, item) => acc + item.count, 0)} un.</td>
                <td className="px-8 py-4 text-right text-lg">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
