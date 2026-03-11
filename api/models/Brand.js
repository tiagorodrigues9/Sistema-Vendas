const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da marca é obrigatório'],
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
brandSchema.index({ company: 1, name: 1 });
brandSchema.index({ company: 1, isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('Brand', brandSchema);
