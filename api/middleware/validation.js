const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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
  body('name')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres'),
  
  body('document')
    .notEmpty()
    .withMessage('CPF/CNPJ é obrigatório')
    .custom((value) => {
      if (value.length !== 11 && value.length !== 14) {
        throw new Error('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
      }
      if (!/^\d+$/.test(value)) {
        throw new Error('CPF/CNPJ deve conter apenas números');
      }
      return true;
    }),
  
  body('address.street')
    .notEmpty()
    .withMessage('Rua é obrigatória'),
  
  body('address.neighborhood')
    .notEmpty()
    .withMessage('Bairro é obrigatório'),
  
  body('address.city')
    .notEmpty()
    .withMessage('Cidade é obrigatória'),
  
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
    .notEmpty()
    .withMessage('Cliente é obrigatório'),
  
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

module.exports = {
  validateRegister,
  validateLogin,
  validateCustomer,
  validateProduct,
  validateSale,
  validateEntry,
  handleValidationErrors
};
