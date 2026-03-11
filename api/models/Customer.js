const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  // Campo legado para compatibilidade
  name: {
    type: String,
    trim: true
  },
  document: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    enum: ['cpf', 'cnpj']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'E-mail inválido']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  neighborhood: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  purchaseHistory: [{
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    },
    date: { type: Date, default: Date.now },
    total: { type: Number, required: true }
  }],
  totalPurchases: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Middleware para compatibilidade e automação
customerSchema.pre('save', function(next) {
  // Mapear fullName para name para compatibilidade
  if (this.fullName && !this.name) {
    this.name = this.fullName;
  }
  
  // Definir documentType automaticamente
  if (this.document) {
    this.documentType = this.document.length === 14 ? 'cnpj' : 'cpf';
  }
  
  next();
});

customerSchema.methods.addPurchase = function(saleId, total) {
  this.purchaseHistory.push({ sale: saleId, total });
  this.totalPurchases += total;
  return this.save();
};

// Virtual para compatibilidade
customerSchema.virtual('displayName').get(function() {
  return this.fullName || this.name;
});

module.exports = mongoose.model('Customer', customerSchema);
