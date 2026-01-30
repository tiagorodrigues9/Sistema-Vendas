const mongoose = require('mongoose');

const entryItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productDescription: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true },
  total: { type: Number, required: true }
});

const entrySchema = new mongoose.Schema({
  entryNumber: {
    type: String,
    required: true,
    unique: true
  },
  fiscalDocument: {
    type: String,
    required: [true, 'Documento fiscal é obrigatório'],
    trim: true
  },
  supplier: {
    name: { type: String, required: true, trim: true },
    cnpj: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  invoiceValue: {
    type: Number,
    required: [true, 'Valor da nota é obrigatório'],
    min: [0, 'Valor da nota não pode ser negativo']
  },
  items: [entryItemSchema],
  totalItems: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
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
  notes: { type: String, trim: true },
  completedAt: { type: Date },
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

entrySchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastEntry = await this.constructor.findOne({ company: this.company })
      .sort({ createdAt: -1 });
    
    const lastNumber = lastEntry ? parseInt(lastEntry.entryNumber.split('-')[1]) : 0;
    this.entryNumber = `ENT-${String(lastNumber + 1).padStart(6, '0')}`;
  }
  next();
});

entrySchema.methods.calculateTotal = function() {
  this.totalItems = this.items.reduce((sum, item) => sum + item.total, 0);
  return this.totalItems;
};

entrySchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  for (const item of this.items) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(item.product);
    if (product) {
      await product.addStock(item.quantity, `Entrada NF: ${this.fiscalDocument}`, this.user);
    }
  }
  
  return this.save();
};

entrySchema.methods.cancel = function(userId, reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  return this.save();
};

module.exports = mongoose.model('Entry', entrySchema);
