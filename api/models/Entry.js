const mongoose = require('mongoose');

const entryItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unitCost: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  justification: {
    type: String,
    required: true,
    trim: true
  }
});

const entrySchema = new mongoose.Schema({
  entryNumber: {
    type: String,
    required: true,
    unique: true
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
  nfNumber: {
    type: String,
    required: true,
    trim: true
  },
  supplier: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    cnpj: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  nfValue: {
    type: Number,
    required: true,
    min: 0
  },
  items: [entryItemSchema],
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  entryDate: {
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

entrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster searches
entrySchema.index({ company: 1, entryDate: -1 });
entrySchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('Entry', entrySchema);
