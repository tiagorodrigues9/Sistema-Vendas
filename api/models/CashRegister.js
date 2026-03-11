const mongoose = require('mongoose');

const cashRegisterSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  openTime: {
    type: Date,
    required: true
  },
  closeTime: {
    type: Date
  },
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  initialAmount: {
    type: Number,
    required: true,
    default: 0
  },
  finalAmount: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  sales: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  }],
  adjustments: [{
    amount: { type: Number, required: true },
    operation: { type: String, enum: ['add', 'remove'], required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true
});

// Índices para melhor performance
cashRegisterSchema.index({ company: 1, date: -1 });
cashRegisterSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('CashRegister', cashRegisterSchema);
