const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  document: {
    type: String,
    required: [true, 'CPF/CNPJ é obrigatório'],
    unique: true,
    trim: true
  },
  documentType: {
    type: String,
    enum: ['cpf', 'cnpj'],
    required: true
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
    street: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    number: { type: String, trim: true }
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

customerSchema.pre('save', function(next) {
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

module.exports = mongoose.model('Customer', customerSchema);
