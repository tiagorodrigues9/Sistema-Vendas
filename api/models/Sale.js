const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  barcode: { type: String, required: true },
  description: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'boleto', 'promissoria', 'parcelado'],
    required: true
  },
  amount: { type: Number, required: true },
  installments: { type: Number, default: 1 },
  dueDate: { type: Date },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'paid'
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: { type: String, required: true },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  payments: [paymentSchema],
  changeAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'pending'],
    default: 'completed'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cashRegister: {
    isOpen: { type: Boolean, required: true },
    openingTime: { type: Date, required: true }
  },
  notes: { type: String, trim: true },
  printed: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: { type: String },
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

saleSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastSale = await this.constructor.findOne({ company: this.company })
      .sort({ createdAt: -1 });
    
    const lastNumber = lastSale ? parseInt(lastSale.saleNumber.split('-')[1]) : 0;
    this.saleNumber = `VND-${String(lastNumber + 1).padStart(6, '0')}`;
  }
  next();
});

saleSchema.methods.calculateTotal = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.total = this.subtotal - this.discount;
  return this.total;
};

saleSchema.methods.processPayment = function(payments) {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.payments = payments;
  
  if (totalPaid > this.total) {
    this.changeAmount = totalPaid - this.total;
  }
  
  return this;
};

saleSchema.methods.cancel = function(userId, reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  return this.save();
};

module.exports = mongoose.model('Sale', saleSchema);
