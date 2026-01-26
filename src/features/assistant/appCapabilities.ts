export type FeatureCapability = {
    key: string;
    enabled: boolean;
    title: string;
    description: string;
    whereToFind?: { navPath: string[]; route?: string };
    howTo?: string[];
    inputs?: string[];
    limitations?: string[];
    related?: string[];
};

export type AppCapabilities = {
    version: string;
    features: Record<string, FeatureCapability>;
};

export const appCapabilities: AppCapabilities = {
    version: '2026-01-25',
    features: {
        aiImport: {
            key: 'aiImport',
            enabled: true,
            title: 'Importar con IA',
            description: 'Importá gastos desde una imagen o PDF usando IA para extraer los datos.',
            whereToFind: { navPath: ['Principal', 'Importar con IA'], route: '/importar' },
            inputs: ['imagen', 'pdf'],
            howTo: [
                'Entrá a Importar con IA desde el menú principal.',
                'Subí una imagen o PDF con tus gastos.',
                'Revisá los datos sugeridos y confirmá los movimientos.'
            ],
            limitations: ['La calidad del archivo puede afectar la extracción.']
        },
        currency: {
            key: 'currency',
            enabled: true,
            title: 'Selector de moneda',
            description: 'Podés ver la app en ARS, USD o EUR y elegir el tipo de cambio blue o cripto.',
            whereToFind: { navPath: ['Header', 'Selector de moneda'] },
            howTo: [
                'Usá el selector en la barra superior.',
                'Elegí ARS, USD o EUR.',
                'Seleccioná blue o cripto para el tipo de cambio.'
            ]
        },
        personalFinance: {
            key: 'personalFinance',
            enabled: true,
            title: 'Finanzas personales',
            description: 'Panel con balance, ingresos y gastos personales.',
            whereToFind: { navPath: ['Principal', 'Finanzas'], route: '/' },
            howTo: [
                'Entrá a Finanzas desde el menú principal.',
                'Usá los filtros para ver períodos y categorías.'
            ]
        },
        savings: {
            key: 'savings',
            enabled: true,
            title: 'Ahorros',
            description: 'Gestioná tus cuentas de ahorro y reservas.',
            whereToFind: { navPath: ['Principal', 'Ahorros'], route: '/ahorros' },
            howTo: [
                'Entrá a Ahorros desde el menú principal.',
                'Creá una cuenta de ahorro y cargá el saldo.'
            ]
        },
        investments: {
            key: 'investments',
            enabled: true,
            title: 'Inversiones',
            description: 'Administrá cuentas de inversión, activos y proyecciones.',
            whereToFind: { navPath: ['Principal', 'Ahorros', 'Cuentas de inversión'], route: '/ahorros' },
            howTo: [
                'Entrá a Ahorros y creá una cuenta de inversión.',
                'Asigná activos y revisá la evolución.'
            ]
        },
        groups: {
            key: 'groups',
            enabled: true,
            title: 'Mis grupos',
            description: 'Gestioná gastos compartidos y balances por grupo.',
            whereToFind: { navPath: ['Principal', 'Mis Grupos'], route: '/grupos' },
            howTo: [
                'Entrá a Mis Grupos.',
                'Creá un grupo o entrá a uno existente para cargar gastos.'
            ]
        },
        categories: {
            key: 'categories',
            enabled: true,
            title: 'Categorías',
            description: 'Analizá y editá categorías de gasto para mejores reportes.',
            whereToFind: { navPath: ['Principal', 'Categorías'], route: '/categorias' },
            howTo: [
                'Entrá a Categorías desde el menú principal.',
                'Editá o creá nuevas categorías según tus necesidades.'
            ]
        }
    }
};
