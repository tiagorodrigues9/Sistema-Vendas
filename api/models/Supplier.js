const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do fornecedor é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do fornecedor não pode ter mais de 100 caracteres']
  },
  cnpj: {
    type: String,
    required: [true, 'CNPJ é obrigatório'],
    trim: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Remove caracteres não numéricos
        const cleanCnpj = v.replace(/[^\d]/g, '');
        return cleanCnpj.length === 14;
      },
      message: 'CNPJ deve ter 14 dígitos'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true,
    required: [true, 'Telefone é obrigatório']
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    number: {
      type: String,
      trim: true
    },
    complement: {
      type: String,
      trim: true
    },
    neighborhood: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(v) {
          return v.length === 2;
        },
        message: 'Estado deve ter 2 caracteres'
      }
    },
    zipCode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          const cleanZip = v.replace(/[^\d]/g, '');
          return cleanZip.length === 8;
        },
        message: 'CEP deve ter 8 dígitos'
      }
    }
  },
  contact: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    phone: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
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

// Índices
supplierSchema.index({ company: 1, isDeleted: 1 });
supplierSchema.index({ company: 1, cnpj: 1 }, { unique: true, sparse: true });
supplierSchema.index({ company: 1, name: 1 });

// Middleware para soft delete
supplierSchema.pre(/^find/, function() {
  this.where({ isDeleted: { $ne: true } });
});

// Método para soft delete
supplierSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Método para restaurar
supplierSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  return this.save();
};

module.exports = mongoose.model('Supplier', supplierSchema);
