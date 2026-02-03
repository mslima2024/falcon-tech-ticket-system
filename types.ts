
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  price: number;
  timestamp: string;
  quantity: number;
}

export interface AppSettings {
  eventName: string;
  printerWidth: '58mm' | '80mm';
  darkMode: boolean;
  pin: string;
  logoUrl?: string; // URL ou Base64 da logo oficial
  showLogoOnTicket: boolean;
}

export interface Statistics {
  totalRevenue: number;
  totalSales: number;
  topProduct: string;
  hourlyData: { hour: string; count: number }[];
}
