const mongoose = require('mongoose');

const cashRegisterSchema = new mongoose.Schema({
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
  openingDate: {
    type: Date,
    default: Date.now
  },
  closingDate: {
    type: Date
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  closingBalance: {
    type: Number
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalCash: {
    type: Number,
    default: 0
  },
  totalCard: {
    type: Number,
    default: 0
  },
  totalOther: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
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

cashRegisterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CashRegister', cashRegisterSchema);
