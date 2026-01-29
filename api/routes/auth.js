const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth } = require('../middleware/auth');
const { validateCPF, validateCNPJ, getDocumentType } = require('../utils/helpers');

const router = express.Router();

// Register company and user
router.post('/register', [
  body('cnpj').custom(value => {
    if (!validateCNPJ(value)) {
      throw new Error('CNPJ inválido');
    }
    return true;
  }),
  body('companyName').notEmpty().withMessage('Nome da empresa é obrigatório'),
  body('ownerName').notEmpty().withMessage('Nome do proprietário é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cnpj, companyName, ownerName, email, password } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ cnpj });
    if (existingCompany) {
      return res.status(400).json({ message: 'CNPJ já cadastrado' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Create company
    const company = new Company({
      cnpj,
      companyName,
      ownerName,
      email
    });

    await company.save();

    // Create user (owner)
    const user = new User({
      name: ownerName,
      email,
      password,
      role: 'owner',
      company: company._id
    });

    await user.save();

    res.status(201).json({
      message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.',
      company: {
        id: company._id,
        cnpj: company.cnpj,
        companyName: company.companyName,
        status: company.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user and populate company
    const user = await User.findOne({ email }).populate('company');
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Check if company is approved
    if (user.company.status !== 'approved') {
      return res.status(401).json({ message: 'Empresa não aprovada' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        company: {
          id: user.company._id,
          name: user.company.companyName,
          cnpj: user.company.cnpj
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      company: {
        id: user.company._id,
        name: user.company.companyName,
        cnpj: user.company.cnpj
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update password
router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
