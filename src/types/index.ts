
export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  occupation?: string;
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  totalAmount?: number;
  payer: User;
  splitWith: User[];
  splits?: {
    userId: string;
    amount: number;
    paid: boolean;
    user: User;
  }[];
  icon: string;
  iconColor: string;
  iconBg: string;
  categoryColor: string;
  categoryBg: string;
  original_amount?: number;
  original_currency?: string;
  exchange_rate?: number;
  exchange_rate_source?: 'manual' | 'dolar_blue' | 'dolar_crypto';
  is_recurring?: boolean;
  installments?: string | null;
  raw_date?: string;
}

export interface PersonalTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string | null;
  type: 'income' | 'expense';
  date: string;
  payment_method: string | null;
  created_at: string;
  is_group?: boolean;
  raw_date?: string;
  original_amount?: number;
  original_currency?: string;
  exchange_rate?: number;
  exchange_rate_source?: 'manual' | 'dolar_blue' | 'dolar_crypto';
  is_recurring?: boolean;
  recurring_pattern?: string | null;
  payer?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  bg_color: string;
  is_system: boolean;
  created_at?: string;
}

export type RatePeriod = 'daily' | 'monthly' | 'annual';

export interface SavingsAccount {
  id: string;
  user_id: string;
  name: string;
  currency: Currency;
  current_balance: number;
  account_type: 'cash' | 'investment';
  created_at?: string;
}

export interface InvestmentAccount {
  id: string;
  user_id: string;
  name: string;
  currency: Currency;
  current_balance: number;
  return_rate_value?: number | null;
  return_rate_period?: RatePeriod | null;
  source_savings_account_id?: string | null;
  last_updated_at?: string | null;
  created_at?: string;
}

export interface SavingsTransfer {
  id: string;
  savings_account_id: string;
  investment_account_id: string;
  amount: number;
  transfer_type: 'transfer_invest' | 'transfer_back';
  transfer_date: string;
}

export interface InvestmentAsset {
  id: string;
  investment_account_id: string;
  asset_name: string;
  allocated_amount: number;
  expected_return_value?: number | null;
  expected_return_period?: RatePeriod | null;
  created_at?: string;
}

export interface InvestmentSnapshot {
  id: string;
  investment_account_id: string;
  snapshot_date: string;
  balance: number;
  note?: string | null;
  created_at?: string;
}


export interface Insight {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'saving' | 'alert' | 'info';
}

export interface Group {
  id: string;
  name: string;
  type: 'trip' | 'house' | 'couple' | 'other';
  customTypeLabel?: string | null;
  members: User[];
  userBalance: number; // Positive = user is owed, Negative = user owes
  currency: string;
  lastActivity: string;
  image?: string;
  inviteCode?: string;
  createdBy: string;
}

export enum AppRoute {
  ONBOARDING = '/bienvenida',
  LOGIN = '/ingresar',
  DASHBOARD_PERSONAL = '/',
  DASHBOARD_HEALTH = '/salud',
  DASHBOARD_GROUPS = '/grupos',
  GROUP_DETAILS = '/grupos/:groupId',
  IMPORT = '/importar',
  SETTINGS = '/configuracion',
  CATEGORIES = '/categorias',
  AI_HISTORY = '/historial-ia',
  SAVINGS = '/ahorros'
}

export type Theme = 'light' | 'dark' | 'system';

export type Currency = 'ARS' | 'USD' | 'EUR';

export interface DollarRate {
  compra: number;
  venta: number;
  casa: string;
  nombre: string;
  moneda: string;
  fechaActualizacion: string;
}
