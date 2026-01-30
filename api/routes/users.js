const express = require('express');
const User = require('../models/User');
const { auth, authorize, authorizeSelfOrAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/', auth, authorize('administrador'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .populate('company', 'companyName cnpj')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/company', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      company: req.company._id,
      isActive: true 
    }).select('name email role isApproved createdAt');

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários da empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', auth, authorizeSelfOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('company', 'companyName cnpj');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id', auth, authorizeSelfOrAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const updateData = { name, email };
    if (req.user.role === 'administrador' && role) {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('company', 'companyName cnpj');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/password', auth, authorizeSelfOrAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (req.user._id.toString() === req.params.id) {
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/approve', auth, authorize('administrador'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).populate('company');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário aprovado com sucesso', user });
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/deactivate', auth, authorize('administrador'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/:id', auth, authorize('administrador'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
