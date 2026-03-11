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
    required: [true, 'Descrição é obrigatória'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Marca é obrigatória'],
    trim: true
  },
  group: {
    type: String,
    required: [true, 'Grupo é obrigatório'],
    trim: true
  },
  subgroup: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantidade é obrigatória'],
    min: [0, 'Quantidade não pode ser negativa']
  },
  unit: {
    type: String,
    enum: ['UND', 'KG', 'PCT'],
    required: [true, 'Unidade é obrigatória'],
    default: 'UND'
  },
  costPrice: {
    type: Number,
    required: [true, 'Preço de custo é obrigatório'],
    min: [0, 'Preço de custo não pode ser negativo']
  },
  salePrice: {
    type: Number,
    required: [true, 'Preço de venda é obrigatório'],
    min: [0, 'Preço de venda não pode ser negativo']
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, 'Estoque mínimo não pode ser negativo']
  },
  maxStock: {
    type: Number,
    default: 0,
    min: [0, 'Estoque máximo não pode ser negativo']
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
  stockMovements: [{
    type: {
      type: String,
      enum: ['entry', 'exit', 'adjustment'],
      required: true
    },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
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
}, {
  timestamps: true
});

productSchema.methods.addStock = function(quantity, reason, userId) {
  const Product = this.constructor;
  return Product.findOneAndUpdate(
    { _id: this._id },
    {
      $inc: { quantity: quantity, totalEntries: quantity },
      $push: { stockMovements: { type: 'entry', quantity, reason, user: userId } }
    },
    { new: true }
  );
};

productSchema.methods.removeStock = function(quantity, reason, userId) {
  const Product = this.constructor;
  return Product.findOneAndUpdate(
    { _id: this._id, quantity: { $gte: quantity } },
    {
      $inc: { quantity: -quantity, totalSold: quantity },
      $push: { stockMovements: { type: 'exit', quantity, reason, user: userId } }
    },
    { new: true }
  ).then(updated => {
    if (!updated) throw new Error('Estoque insuficiente');
    return updated;
  });
};

productSchema.methods.adjustStock = function(newQuantity, reason, userId) {
  const adjustment = newQuantity - this.quantity;
  const Product = this.constructor;
  return Product.findOneAndUpdate(
    { _id: this._id },
    {
      $set: { quantity: newQuantity },
      $push: { stockMovements: { type: 'adjustment', quantity: adjustment, reason, user: userId } }
    },
    { new: true }
  );
};

module.exports = mongoose.model('Product', productSchema);
