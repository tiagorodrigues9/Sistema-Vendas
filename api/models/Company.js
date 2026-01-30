const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  cnpj: {
    type: String,
    required: [true, 'CNPJ é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\d{14}$/, 'CNPJ deve ter 14 dígitos']
  },
  companyName: {
    type: String,
    required: [true, 'Nome da empresa é obrigatório'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Nome do dono é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'E-mail inválido']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    number: { type: String, trim: true },
    neighborhood: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  settings: {
    cashRegister: {
      isOpen: { type: Boolean, default: false },
      openingTime: { type: Date },
      closingTime: { type: Date },
      initialAmount: { type: Number, default: 0 },
      currentAmount: { type: Number, default: 0 }
    },
    fiscal: {
      printerType: { 
        type: String, 
        enum: ['thermal', 'a4'], 
        default: 'thermal' 
      },
      autoPrint: { type: Boolean, default: false }
    }
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

module.exports = mongoose.model('Company', companySchema);
