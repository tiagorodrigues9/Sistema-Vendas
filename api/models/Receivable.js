const mongoose = require('mongoose');

const receivableSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  saleNumber: { type: String, required: true },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ['boleto', 'promissoria', 'parcelado'],
    required: true
  },
  originalAmount: { type: Number, required: true },
  currentAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  installments: [{
    number: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paidAt: { type: Date },
    paidAmount: { type: Number }
  }],
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, required: true },
    notes: { type: String, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  notes: { type: String, trim: true },
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

receivableSchema.methods.addPayment = function(amount, method, userId, notes) {
  this.payments.push({
    amount,
    method,
    notes,
    user: userId
  });
  
  this.currentAmount -= amount;
  
  if (this.currentAmount <= 0) {
    this.status = 'paid';
    this.currentAmount = 0;
  }
  
  return this.save();
};

receivableSchema.methods.checkOverdue = function() {
  if (this.status === 'pending' && new Date() > this.dueDate) {
    this.status = 'overdue';
    return this.save();
  }
};

receivableSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.notes = reason;
  return this.save();
};

module.exports = mongoose.model('Receivable', receivableSchema);
