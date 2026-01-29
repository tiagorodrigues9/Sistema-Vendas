const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'owner', 'employee'],
    default: 'employee'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  permissions: {
    canViewDashboard: { type: Boolean, default: false },
    canManageCustomers: { type: Boolean, default: true },
    canManageProducts: { type: Boolean, default: false },
    canMakeSales: { type: Boolean, default: true },
    canManageEntries: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageReceivables: { type: Boolean, default: false },
    canAccessAdmin: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = {
          canViewDashboard: true,
          canManageCustomers: true,
          canManageProducts: true,
          canMakeSales: true,
          canManageEntries: true,
          canViewReports: true,
          canManageReceivables: true,
          canAccessAdmin: true
        };
        break;
      case 'owner':
        this.permissions = {
          canViewDashboard: true,
          canManageCustomers: true,
          canManageProducts: true,
          canMakeSales: true,
          canManageEntries: true,
          canViewReports: true,
          canManageReceivables: true,
          canAccessAdmin: false
        };
        break;
      case 'employee':
        this.permissions = {
          canViewDashboard: false,
          canManageCustomers: true,
          canManageProducts: false,
          canMakeSales: true,
          canManageEntries: false,
          canViewReports: false,
          canManageReceivables: false,
          canAccessAdmin: false
        };
        break;
    }
  }
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
