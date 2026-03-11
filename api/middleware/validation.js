const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  console.log('Corpo da requisição na validação:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erros de validação encontrados:', errors.array());
    return res.status(400).json({
      message: 'Erros de validação',
      errors: errors.array()
    });
  }
  next();
};

const validateRegister = [
  body('cnpj')
    .isLength({ min: 14, max: 14 })
    .withMessage('CNPJ deve ter 14 dígitos')
    .isNumeric()
    .withMessage('CNPJ deve conter apenas números'),
  
  body('companyName')
    .notEmpty()
    .withMessage('Nome da empresa é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome da empresa deve ter entre 3 e 100 caracteres'),
  
  body('ownerName')
    .notEmpty()
    .withMessage('Nome do dono é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome do dono deve ter entre 3 e 100 caracteres'),
  
  body('email')
    .isEmail()
    .withMessage('E-mail inválido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('E-mail inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  handleValidationErrors
];

const validateCustomer = [
  body('fullName')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres'),
  
  body('document')
    .optional()
    .custom((value) => {
      if (value) {
        // Remover caracteres não numéricos
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length !== 11 && cleanValue.length !== 14) {
          throw new Error('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
        }
      }
      return true;
    }),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('E-mail inválido')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .custom((value) => {
      if (value) {
        // Remover caracteres não numéricos
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length < 10 || cleanValue.length > 15) {
          throw new Error('Telefone deve ter entre 10 e 15 dígitos');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateProduct = [
  body('description')
    .notEmpty()
    .withMessage('Descrição é obrigatória')
    .isLength({ min: 3, max: 200 })
    .withMessage('Descrição deve ter entre 3 e 200 caracteres'),
  
  body('brand')
    .notEmpty()
    .withMessage('Marca é obrigatória'),
  
  body('group')
    .notEmpty()
    .withMessage('Grupo é obrigatório'),
  
  body('quantity')
    .isNumeric()
    .withMessage('Quantidade deve ser um número')
    .isFloat({ min: 0 })
    .withMessage('Quantidade não pode ser negativa'),
  
  body('unit')
    .isIn(['UND', 'KG', 'PCT'])
    .withMessage('Unidade deve ser UND, KG ou PCT'),
  
  body('costPrice')
    .isNumeric()
    .withMessage('Preço de custo deve ser um número')
    .isFloat({ min: 0 })
    .withMessage('Preço de custo não pode ser negativo'),
  
  body('salePrice')
    .isNumeric()
    .withMessage('Preço de venda deve ser um número')
    .isFloat({ min: 0 })
    .withMessage('Preço de venda não pode ser negativo'),
  
  handleValidationErrors
];

const validateSale = [
  body('customer')
    .custom((value) => {
      // Permite o cliente especial 'CONSUMIDOR' ou um id não vazio
      if (value === 'CONSUMIDOR') return true;
      if (!value) throw new Error('Cliente é obrigatório');
      return true;
    }),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Venda deve ter pelo menos um item'),
  
  body('items.*.product')
    .notEmpty()
    .withMessage('ID do produto é obrigatório'),
  
  body('items.*.quantity')
    .isNumeric()
    .withMessage('Quantidade deve ser um número')
    .isFloat({ min: 1 })
    .withMessage('Quantidade deve ser maior que zero'),
  
  body('items.*.unitPrice')
    .isNumeric()
    .withMessage('Preço unitário deve ser um número')
    .isFloat({ min: 0 })
    .withMessage('Preço unitário não pode ser negativo'),
  
  body('payments')
    .isArray({ min: 1 })
    .withMessage('Venda deve ter pelo menos uma forma de pagamento'),
  
  body('payments.*.method')
    .isIn(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'boleto', 'promissoria', 'parcelado'])
    .withMessage('Método de pagamento inválido'),
  
  body('payments.*.amount')
    .isNumeric()
    .withMessage('Valor do pagamento deve ser um número')
    .isFloat({ min: 0 })
    .withMessage('Valor do pagamento não pode ser negativo'),
  
  handleValidationErrors
];

const validateEntry = [
  body('fiscalDocument')
    .notEmpty()
    .withMessage('Documento fiscal é obrigatório'),
  
  body('supplier.name')
    .notEmpty()
    .withMessage('Nome do fornecedor é obrigatório'),
  
  body('invoiceValue')
    .isNumeric()
    .withMessage('Valor da nota deve ser um número')
    .isFloat({ min: 0 })
    .withMessage('Valor da nota não pode ser negativo'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Entrada deve ter pelo menos um item'),
  
  body('items.*.product')
    .notEmpty()
    .withMessage('ID do produto é obrigatório'),
  
  body('items.*.quantity')
    .isNumeric()
    .withMessage('Quantidade deve ser um número')
    .isFloat({ min: 1 })
    .withMessage('Quantidade deve ser maior que zero'),
  
  body('items.*.unitCost')
    .isNumeric()
    .withMessage('Custo unitário deve ser um número')
    .isFloat({ min: 0 })
    .withMessage('Custo unitário não pode ser negativo'),
  
  handleValidationErrors
];

const validateSupplier = [
  body('name')
    .notEmpty()
    .withMessage('Nome do fornecedor é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('cnpj')
    .optional()
    .custom((value) => {
      if (value) {
        const cleanCnpj = value.replace(/[^\d]/g, '');
        if (cleanCnpj.length !== 14) {
          throw new Error('CNPJ deve ter 14 dígitos');
        }
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .custom((value) => {
      if (value) {
        const cleanPhone = value.replace(/[^\d]/g, '');
        if (cleanPhone.length < 10) {
          throw new Error('Telefone deve ter pelo menos 10 dígitos');
        }
      }
      return true;
    }),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido'),
  
  body('address.zipCode')
    .optional()
    .custom((value) => {
      if (value) {
        const cleanZip = value.replace(/[^\d]/g, '');
        if (cleanZip.length !== 8) {
          throw new Error('CEP deve ter 8 dígitos');
        }
      }
      return true;
    }),
  
  body('address.state')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter 2 caracteres'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Email do contato inválido'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCustomer,
  validateProduct,
  validateSale,
  validateEntry,
  validateSupplier,
  handleValidationErrors
};
