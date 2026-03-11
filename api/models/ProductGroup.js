const mongoose = require('mongoose');

const productGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do grupo é obrigatório'],
    trim: true,
    unique: true
  },
  description: {
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
  }
}, {
  timestamps: true
});

// Índices para melhor performance
productGroupSchema.index({ company: 1, name: 1 });
productGroupSchema.index({ company: 1, isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('ProductGroup', productGroupSchema);
