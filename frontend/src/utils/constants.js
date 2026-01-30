export const USER_ROLES = {
  ADMINISTRADOR: 'administrador',
  DONO: 'dono',
  FUNCIONARIO: 'funcionario'
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMINISTRADOR]: 'Administrador',
  [USER_ROLES.DONO]: 'Dono',
  [USER_ROLES.FUNCIONARIO]: 'Funcionário'
};

export const PAYMENT_METHODS = {
  DINHEIRO: 'dinheiro',
  CARTAO_CREDITO: 'cartao_credito',
  CARTAO_DEBITO: 'cartao_debito',
  PIX: 'pix',
  BOLETO: 'boleto',
  PROMISSORIA: 'promissoria',
  PARCELADO: 'parcelado'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.DINHEIRO]: 'Dinheiro',
  [PAYMENT_METHODS.CARTAO_CREDITO]: 'Cartão de Crédito',
  [PAYMENT_METHODS.CARTAO_DEBITO]: 'Cartão de Débito',
  [PAYMENT_METHODS.PIX]: 'PIX',
  [PAYMENT_METHODS.BOLETO]: 'Boleto',
  [PAYMENT_METHODS.PROMISSORIA]: 'Promissória',
  [PAYMENT_METHODS.PARCELADO]: 'Parcelado'
};

export const PRODUCT_UNITS = {
  UND: 'UND',
  KG: 'KG',
  PCT: 'PCT'
};

export const PRODUCT_UNIT_LABELS = {
  [PRODUCT_UNITS.UND]: 'Unidade',
  [PRODUCT_UNITS.KG]: 'Quilograma',
  [PRODUCT_UNITS.PCT]: 'Pacote'
};

export const SALE_STATUS = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PENDING: 'pending'
};

export const SALE_STATUS_LABELS = {
  [SALE_STATUS.COMPLETED]: 'Concluída',
  [SALE_STATUS.CANCELLED]: 'Cancelada',
  [SALE_STATUS.PENDING]: 'Pendente'
};

export const ENTRY_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ENTRY_STATUS_LABELS = {
  [ENTRY_STATUS.PENDING]: 'Pendente',
  [ENTRY_STATUS.COMPLETED]: 'Concluída',
  [ENTRY_STATUS.CANCELLED]: 'Cancelada'
};

export const RECEIVABLE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export const RECEIVABLE_STATUS_LABELS = {
  [RECEIVABLE_STATUS.PENDING]: 'Pendente',
  [RECEIVABLE_STATUS.PAID]: 'Pago',
  [RECEIVABLE_STATUS.OVERDUE]: 'Vencido',
  [RECEIVABLE_STATUS.CANCELLED]: 'Cancelado'
};

export const INSTALLMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

export const INSTALLMENT_STATUS_LABELS = {
  [INSTALLMENT_STATUS.PENDING]: 'Pendente',
  [INSTALLMENT_STATUS.PAID]: 'Pago',
  [INSTALLMENT_STATUS.OVERDUE]: 'Vencida'
};

export const DOCUMENT_TYPES = {
  CPF: 'cpf',
  CNPJ: 'cnpj'
};

export const PRINTER_TYPES = {
  THERMAL: 'thermal',
  A4: 'a4'
};

export const PRINTER_TYPE_LABELS = {
  [PRINTER_TYPES.THERMAL]: 'Térmica',
  [PRINTER_TYPES.A4]: 'A4'
};

export const MENU_ITEMS = [
  {
    key: 'vendas',
    label: 'Vendas',
    icon: 'ShoppingCart',
    path: '/vendas',
    roles: [USER_ROLES.ADMINISTRADOR, USER_ROLES.DONO, USER_ROLES.FUNCIONARIO]
  },
  {
    key: 'clientes',
    label: 'Clientes',
    icon: 'Users',
    path: '/clientes',
    roles: [USER_ROLES.ADMINISTRADOR, USER_ROLES.DONO, USER_ROLES.FUNCIONARIO]
  },
  {
    key: 'produtos',
    label: 'Produtos',
    icon: 'Package',
    path: '/produtos',
    roles: [USER_ROLES.ADMINISTRADOR, USER_ROLES.DONO]
  },
  {
    key: 'entradas',
    label: 'Entrada de Produtos',
    icon: 'Truck',
    path: '/entradas',
    roles: [USER_ROLES.ADMINISTRADOR, USER_ROLES.DONO]
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'BarChart3',
    path: '/dashboard',
    roles: [USER_ROLES.ADMINISTRADOR, USER_ROLES.DONO]
  },
  {
    key: 'contas-receber',
    label: 'Contas a Receber',
    icon: 'DollarSign',
    path: '/contas-receber',
    roles: [USER_ROLES.ADMINISTRADOR, USER_ROLES.DONO]
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: 'Settings',
    path: '/admin',
    roles: [USER_ROLES.ADMINISTRADOR]
  }
];

export const DATE_FORMATS = {
  DATE: 'dd/MM/yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm'
};

export const CURRENCY_FORMAT = {
  style: 'currency',
  currency: 'BRL'
};

export const REGEX_PATTERNS = {
  CPF: /^\d{11}$/,
  CNPJ: /^\d{14}$/,
  PHONE: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CEP: /^\d{5}-\d{3}$/
};

export const API_LIMITS = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024 // 2MB
};

export const TOAST_CONFIG = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#363636',
    color: '#fff'
  }
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: '@PDV:token',
  USER: '@PDV:user',
  COMPANY: '@PDV:company',
  THEME: '@PDV:theme',
  LANGUAGE: '@PDV:language',
  SETTINGS: '@PDV:settings'
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SALES: '/vendas',
  CUSTOMERS: '/clientes',
  PRODUCTS: '/produtos',
  ENTRIES: '/entradas',
  RECEIVABLES: '/contas-receber',
  ADMIN: '/admin',
  PROFILE: '/perfil',
  NOT_FOUND: '*'
};

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
};

export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out'
  }
};
