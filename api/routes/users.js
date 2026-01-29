const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .populate('company', 'companyName cnpj email status')
      .select('-password');
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get users by company (owner and admin)
router.get('/company/:companyId', auth, authorize('canAccessAdmin'), async (req, res) => {
  try {
    const users = await User.find({ company: req.params.companyId })
      .select('-password');
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update user
router.put('/:id', auth, authorize('canAccessAdmin'), [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('role').optional().isIn(['admin', 'owner', 'employee']).withMessage('Função inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role, isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Check if user has permission to edit this user
    if (req.user.role !== 'admin' && user.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para editar este usuário' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Reset user password (admin only)
router.put('/:id/reset-password', auth, authorize('canAccessAdmin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Check if user has permission to reset this user's password
    if (req.user.role !== 'admin' && user.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para resetar senha deste usuário' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Create new user (owner and admin)
router.post('/', auth, authorize('canAccessAdmin'), [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('role').isIn(['admin', 'owner', 'employee']).withMessage('Função inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Only admin can create admin users
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem criar usuários admin' });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      company: req.user.company
    });

    await user.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
