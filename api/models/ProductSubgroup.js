const mongoose = require('mongoose');

const productSubgroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do subgrupo é obrigatório'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductGroup',
    required: [true, 'Grupo é obrigatório']
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
productSubgroupSchema.index({ company: 1, name: 1 });
productSubgroupSchema.index({ company: 1, group: 1 });
productSubgroupSchema.index({ company: 1, isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('ProductSubgroup', productSubgroupSchema);
