import { Transaction, User, Insight, Group } from './types';
import { ShoppingBag, ShoppingCart, Coffee, PlayCircle, Fuel, Utensils, Zap, Car } from 'lucide-react';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Vos',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJqFSWDVY7eTkFwnirMAdLNkkL4SHPHwpiuSWPGwDnmTTTDILZpnGh4TUtv2YlPap-qscv3-4eVLvO9zs1M55mhPvFI7I6FsN1815r8qxcmIWVamBiiGqIrdAt4yvYZklfVNTQN3gcnxSdyHCh39nDZbeet5QayV9fcz77VjiMMzjQjwtUqjEnEDeLYi_2thACu_pK3VsgdUymPjcZwGD6ykX2N9FBQdtFXpNIFMOHhqdz30boIK1h6T2SX4moBvnByD-hiYtWyD6E'
};

export const GROUP_MEMBERS: User[] = [
  { id: 'u2', name: 'Sofia', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAujlwGOIcwEewhnnt6m7MSCI7911iDB_IYOCnIiLZifiuMTbntwa7vl68WZ5Zy8y7lWRMgODRILloQ8bk6fzmawpCrSBFJqoGv8oHjiALEUAa0nPOePVq23q560DY00pBZz5q0ddDpAWBAc2cSR89XlJ-oQBG47IXuiP3D4QrC4QNCvRCoNFwLI8zFrZiThl_5NTbZi5hPtkaj2nvITW1kxzAdLWTCuqsYTFXkoE8e_ezVFUIDKnaZU5YF7AI1B252mMXuXO4-AOel' },
  { id: 'u3', name: 'Matias', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCjegtaDLSKWLKzDFmcFHw2HRscnmB51sBZZWJRo-lIU8lbbfcDiKJT-T_-KQ31S-UOVAj9E0DZQjbio6GQvSlL3IxP4kvG3vXQnm9prZ-bNAkMebAsKPtm4WxGP9rDgqG8r2Q-sbpl675BwAyQWQkgpzU6DQNUY5ze1Y-c-2l-l86wFGcslotcj2-ac01ghKdqnChEDNCz0wUlJ-VMfRvUKuRpzgo1OrareBAHmriEZ6GaQv7XW11yFu-hqKQgXu2KroruvnJnnwx' },
  { id: 'u4', name: 'Lucas', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuIpJDUTEMU1EcHoMjm1-iygofjWW3Ykaw-R5QI0EnE6BwW4yVitNbjb7WAMI7fgsHnJY3lCk4syyfxxem6HLOMLDCzeto1EYfxB9Cx0dQSsoYtdLMdpjOPsqXNvH9i1lOQYG5J0HZP_FfEaHagEfez5258_T7jbDGjsakgh8XJ8rzf993WVogZX3uuUMe_Y8vcIj-4taGOMllCPSy57PwSCbfp6i6E05qSxsM9RkxlrbaPjnIdJxSs30xiQ-csbr3btERHNw49sYo' },
  { id: 'u5', name: 'Elena', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ4RLty3vRv0wlSPW8KA_gB9cBppn3b9aXhajJRQUz9UZ2tW5z0Vh6zLg3Dd34dSmZ4I9oInW7KfHCujAByR2jbw5PmNey3BGobQAKLI7Eb3wjbiryhHxfGQnEaHe4ilum6boHbt0DYz3RbfwdeE4jlafD1GmUkJ7qrP2zc0BNXwHbi9QWcr1Nju-jOlAPa-5TITsfmgRiXuotGRIU9Vl3ypGMocEHJAJXmg6o21XBsnybHqJHv_4S4mB6mjWyEbGD66FarKNpcbft' }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: '12 Abr 2024',
    merchant: 'Mercado Libre',
    category: 'Compras',
    amount: 45400.00,
    payer: CURRENT_USER,
    splitWith: [GROUP_MEMBERS[0], GROUP_MEMBERS[1], GROUP_MEMBERS[2], GROUP_MEMBERS[3]],
    icon: 'ShoppingBag',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
    categoryColor: 'text-indigo-300',
    categoryBg: 'bg-indigo-500/10',
  },
  {
    id: 't2',
    date: '11 Abr 2024',
    merchant: 'Carrefour Express',
    category: 'Supermercado',
    amount: 12250.50,
    payer: GROUP_MEMBERS[1],
    splitWith: [CURRENT_USER, GROUP_MEMBERS[0], GROUP_MEMBERS[2]],
    icon: 'ShoppingCart',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    categoryColor: 'text-blue-300',
    categoryBg: 'bg-blue-500/10',
  },
  {
    id: 't3',
    date: '10 Abr 2024',
    merchant: 'Café de Especialidad',
    category: 'Gastronomía',
    amount: 4800.00,
    payer: CURRENT_USER,
    splitWith: [GROUP_MEMBERS[0], GROUP_MEMBERS[1]],
    icon: 'Coffee',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    categoryColor: 'text-emerald-300',
    categoryBg: 'bg-emerald-500/10',
  },
  {
    id: 't4',
    date: '09 Abr 2024',
    merchant: 'Netflix',
    category: 'Servicios',
    amount: 9599.00,
    payer: GROUP_MEMBERS[3],
    splitWith: [CURRENT_USER, GROUP_MEMBERS[1], GROUP_MEMBERS[0], GROUP_MEMBERS[2], GROUP_MEMBERS[3]],
    icon: 'PlayCircle',
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/10',
    categoryColor: 'text-red-300',
    categoryBg: 'bg-red-500/10',
  },
  {
    id: 't5',
    date: '08 Abr 2024',
    merchant: 'YPF',
    category: 'Transporte',
    amount: 35000.00,
    payer: CURRENT_USER,
    splitWith: [GROUP_MEMBERS[1], GROUP_MEMBERS[0]],
    icon: 'Fuel',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/10',
    categoryColor: 'text-teal-300',
    categoryBg: 'bg-teal-500/10',
  },
];

export const INSIGHTS: Insight[] = [
  {
    id: 'i1',
    title: 'Reducir Suscripciones',
    description: 'Detectamos 2 servicios de streaming que no usaste en 30 días. Podrías ahorrar $5.400/mes.',
    icon: 'Lightbulb',
    type: 'info'
  },
  {
    id: 'i2',
    title: 'Optimización de Ahorro',
    description: "Tu capacidad de ahorro subió. ¿Querés ajustar tu meta de 'Fondo de Emergencia'?",
    icon: 'PiggyBank',
    type: 'saving'
  },
  {
    id: 'i3',
    title: "Gasto en 'Cafés' fuera de rango",
    description: 'Llevas gastado un 15% más que el promedio mensual en esta categoría.',
    icon: 'AlertTriangle',
    type: 'alert'
  }
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Viaje a la Costa',
    type: 'trip',
    members: [CURRENT_USER, GROUP_MEMBERS[0], GROUP_MEMBERS[1], GROUP_MEMBERS[2]],
    userBalance: 24500, // Te deben
    currency: 'ARS',
    lastActivity: 'Hace 2 horas',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop'
  },
  {
    id: 'g2',
    name: 'Casa Palermo',
    type: 'house',
    members: [CURRENT_USER, GROUP_MEMBERS[3]],
    userBalance: -12800, // Debes
    currency: 'ARS',
    lastActivity: 'Ayer',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'g3',
    name: 'Salidas Fin de Semana',
    type: 'other',
    members: [CURRENT_USER, GROUP_MEMBERS[0], GROUP_MEMBERS[1], GROUP_MEMBERS[2], GROUP_MEMBERS[3]],
    userBalance: 0,
    currency: 'ARS',
    lastActivity: 'Hace 5 días',
    image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d03?q=80&w=2070&auto=format&fit=crop'
  }
];