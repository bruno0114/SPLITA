
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
  payer: User;
  splitWith: User[];
  icon: string;
  iconColor: string;
  iconBg: string;
  categoryColor: string;
  categoryBg: string;
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
  members: User[];
  userBalance: number; // Positive = user is owed, Negative = user owes
  currency: string;
  lastActivity: string;
  image?: string;
  inviteCode?: string;
  createdBy: string;
}

export enum AppRoute {
  ONBOARDING = 'onboarding',
  LOGIN = 'login',
  DASHBOARD_PERSONAL = 'dashboard_personal',
  DASHBOARD_HEALTH = 'dashboard_health',
  DASHBOARD_GROUPS = 'dashboard_groups',
  GROUP_DETAILS = 'group_details',
  IMPORT = 'import',
  SETTINGS = 'settings',
  CATEGORIES = 'categories'
}

export type Theme = 'light' | 'dark' | 'system';

export type Currency = 'ARS' | 'USD';

export interface DollarRate {
  compra: number;
  venta: number;
  casa: string;
  nombre: string;
  moneda: string;
  fechaActualizacion: string;
}
