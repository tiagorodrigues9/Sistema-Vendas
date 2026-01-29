const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  group: {
    type: String,
    required: true,
    trim: true
  },
  subgroup: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    enum: ['UND', 'KG', 'PCT'],
    required: true,
    default: 'UND'
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0
  },
  minQuantity: {
    type: Number,
    default: 0
  },
  maxQuantity: {
    type: Number
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
  totalSold: {
    type: Number,
    default: 0
  },
  totalEntries: {
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
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster searches
productSchema.index({ company: 1, barcode: 1 });
productSchema.index({ company: 1, description: 1 });
productSchema.index({ company: 1, group: 1 });

module.exports = mongoose.model('Product', productSchema);
