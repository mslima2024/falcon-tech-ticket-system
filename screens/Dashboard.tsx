
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Product, Sale } from '../types';
import { APP_PURPLE_GRADIENT } from '../constants';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales }) => {
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.price) * Number(s.quantity)), 0);
    const totalSales = sales.reduce((acc, s) => acc + Number(s.quantity), 0);
    
    // Agrupamento por ID para manter integridade após edições de nome
    const salesById: Record<string, { count: number, revenue: number, lastName: string }> = {};
    
    sales.forEach(s => {
      if (!salesById[s.productId]) {
        salesById[s.productId] = { count: 0, revenue: 0, lastName: s.productName };
      }
      salesById[s.productId].count += Number(s.quantity);
      salesById[s.productId].revenue += (Number(s.price) * Number(s.quantity));
    });

    // Mapeia para os nomes atuais dos produtos
    const productSalesData = Object.entries(salesById).map(([id, data]) => {
      const currentProduct = products.find(p => p.id === id);
      return {
        name: currentProduct ? currentProduct.name : data.lastName,
        count: data.count,
        revenue: data.revenue
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    const topProduct = productSalesData[0]?.name || 'Nenhum';

    // Horários de Pico
    const hourlyData = Array.from({ length: 12 }, (_, i) => {
      const hour = (new Date().getHours() - (11 - i) + 24) % 24;
      const count = sales.filter(s => {
        const saleDate = new Date(s.timestamp);
        return saleDate.getHours() === hour;
      }).reduce((acc, s) => acc + Number(s.quantity), 0);
      return { hour: `${hour}:00`, count };
    });

    return { totalRevenue, totalSales, topProduct, hourlyData, productSalesData };
  }, [sales, products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral do seu evento e vendas em tempo real.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Faturamento Total" 
          value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="text-emerald-500" />}
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard 
          title="Fichas Vendidas" 
          value={stats.totalSales.toString()}
          icon={<ShoppingBag className="text-purple-500" />}
          trend="+5.2%"
          trendUp={true}
        />
        <StatCard 
          title="Produto Popular" 
          value={stats.topProduct}
          icon={<TrendingUp className="text-orange-500" />}
          trend="Estável"
          trendUp={null}
        />
        <StatCard 
          title="Ticket Médio" 
          value={`R$ ${(stats.totalRevenue / (stats.totalSales || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Clock className="text-blue-500" />}
          trend="-2.4%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Horários de Pico (Últimas 12h)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#8B5CF6', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Mais Vendidos</h3>
          <div className="space-y-4">
            {stats.productSalesData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-transform group-hover:scale-110 ${APP_PURPLE_GRADIENT}`}>
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold">{item.count}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Unidades</span>
                </div>
              </div>
            ))}
            {stats.productSalesData.length === 0 && (
              <p className="text-center text-slate-400 py-12">Nenhuma venda registrada ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean | null }> = ({ title, value, icon, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between transition-transform hover:scale-[1.02]">
    <div className="flex justify-between items-start">
      <div className="p-3 bg-slate-50 rounded-2xl">
        {icon}
      </div>
      {trendUp !== null && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold mt-1">{value}</h4>
    </div>
  </div>
);

export default Dashboard;
