import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_FORMAT, DATE_FORMATS } from './constants';

// Format currency
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', CURRENCY_FORMAT).format(value);
};

// Format date
export const formatDate = (date, dateFormat = DATE_FORMATS.DATE) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, dateFormat, { locale: ptBR });
};

// Format CPF/CNPJ
export const formatDocument = (document) => {
  if (!document) return '-';
  
  // Remove non-digits
  const cleanDoc = document.replace(/\D/g, '');
  
  if (cleanDoc.length === 11) {
    // CPF: 000.000.000-00
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanDoc.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return document;
};

// Validate CPF
export const validateCPF = (cpf) => {
  if (!cpf) return false;
  
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  // Validate first digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

// Validate CNPJ
export const validateCNPJ = (cnpj) => {
  if (!cnpj) return false;
  
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // CNPJ validation algorithm
  const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  // Calculate first digit
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights[i];
  }
  
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second digit
  weights.unshift(6);
  sum = 0;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights[i];
  }
  
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return (
    parseInt(cleanCNPJ[12]) === firstDigit &&
    parseInt(cleanCNPJ[13]) === secondDigit
  );
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '-';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    // (00) 0000-0000
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    // (00) 00000-0000
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

// Format CEP
export const formatCEP = (cep) => {
  if (!cep) return '-';
  
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length === 8) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

// Get status badge color
export const getStatusBadgeColor = (status) => {
  const colors = {
    completed: 'success',
    cancelled: 'error',
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
    active: 'success',
    inactive: 'error'
  };
  
  return colors[status] || 'secondary';
};

// Get payment method label
export const getPaymentMethodLabel = (method) => {
  const labels = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    boleto: 'Boleto',
    promissoria: 'Promissória',
    parcelado: 'Parcelado'
  };
  
  return labels[method] || method;
};

// Get user role label
export const getUserRoleLabel = (role) => {
  const labels = {
    administrador: 'Administrador',
    dono: 'Dono',
    funcionario: 'Funcionário'
  };
  
  return labels[role] || role;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Sanitize string for search
export const sanitizeSearch = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Calculate age from birth date
export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Generate barcode number
export const generateBarcode = () => {
  return Math.floor(Math.random() * 9000000000000) + 1000000000000;
};

// Check if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Download file
export const downloadFile = (data, filename, type = 'application/octet-stream') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Print element
export const printElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .no-print { display: none; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Validate required fields
export const validateRequired = (obj, requiredFields) => {
  const errors = {};
  
  requiredFields.forEach(field => {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      errors[field] = 'Campo obrigatório';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sort array by property
export const sortByProperty = (array, property, order = 'asc') => {
  return array.sort((a, b) => {
    const valueA = a[property];
    const valueB = b[property];
    
    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Filter array by search term
export const filterBySearch = (array, searchTerm, properties) => {
  if (!searchTerm) return array;
  
  const sanitizedSearch = sanitizeSearch(searchTerm);
  
  return array.filter(item => {
    return properties.some(property => {
      const value = item[property];
      if (typeof value === 'string') {
        return sanitizeSearch(value).includes(sanitizedSearch);
      }
      return false;
    });
  });
};
