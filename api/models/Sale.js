const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  barcode: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'pix', 'bank_slip', 'promissory_note', 'installment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  installments: {
    type: Number,
    min: 1
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'paid'
  },
  dueDate: {
    type: Date
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
  customerName: {
    type: String,
    required: true
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
  userName: {
    type: String,
    required: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  payments: [paymentSchema],
  change: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  observations: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

saleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster searches
saleSchema.index({ company: 1, saleDate: -1 });
saleSchema.index({ company: 1, customer: 1 });
saleSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('Sale', saleSchema);
