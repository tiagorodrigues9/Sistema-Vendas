const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken, generateResetToken } = require('../utils/jwt');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');
const router = express.Router();

router.post('/register', validateRegister, async (req, res) => {
  try {
    const { cnpj, companyName, ownerName, email, password } = req.body;

    const existingCompany = await Company.findOne({ 
      $or: [{ cnpj }, { email }] 
    });
    
    if (existingCompany) {
      return res.status(400).json({ 
        message: 'CNPJ ou e-mail já cadastrado' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'E-mail já cadastrado' 
      });
    }

    const company = new Company({
      cnpj,
      companyName,
      ownerName,
      email
    });

    await company.save();

    const user = new User({
      name: ownerName,
      email,
      password,
      role: 'dono',
      company: company._id
    });

    await user.save();

    res.status(201).json({
      message: 'Cadastro realizado com sucesso. Aguarde aprovação do administrador.',
      company: {
        id: company._id,
        cnpj: company.cnpj,
        companyName: company.companyName,
        isApproved: company.isApproved
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('company');
    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    if (!user.isApproved && user.role !== 'administrador') {
      return res.status(401).json({ 
        message: 'Usuário aguardando aprovação do administrador' 
      });
    }

    const company = await Company.findById(user.company._id);
    if (!company.isActive) {
      return res.status(401).json({ message: 'Empresa inativa' });
    }

    if (!company.isApproved && user.role !== 'administrador') {
      return res.status(401).json({ 
        message: 'Empresa aguardando aprovação do administrador' 
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      },
      company: {
        _id: company._id,
        id: company._id, // Manter para compatibilidade
        cnpj: company.cnpj,
        companyName: company.companyName,
        isApproved: company.isApproved,
        settings: company.settings
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Registrar usuário em empresa existente
router.post('/register-user', async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;

    // Verificar se a empresa existe
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

    // Criar usuário vinculado à empresa
    const user = new User({
      name,
      email,
      password,
      company: companyId,
      role: 'funcionario', // Funcionário por padrão
      isApproved: false // Sempre precisa de aprovação manual
    });

    await user.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      },
      company: {
        id: company._id,
        cnpj: company.cnpj,
        companyName: company.companyName,
        isApproved: company.isApproved
      }
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isApproved: req.user.isApproved,
        lastLogin: req.user.lastLogin
      },
      company: {
        _id: req.company._id,
        id: req.company._id, // Manter para compatibilidade
        cnpj: req.company.cnpj,
        companyName: req.company.companyName,
        isApproved: req.company.isApproved,
        settings: req.company.settings
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Esqueci a senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).populate('company');
    if (!user) {
      return res.status(404).json({ message: 'E-mail não encontrado' });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Em um ambiente real, aqui você enviaria um e-mail
    // Por ora, vamos retornar o token para desenvolvimento
    console.log('Token de reset de senha:', resetToken);
    console.log('Link de reset:', `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

    res.json({
      message: 'E-mail de recuperação enviado com sucesso',
      // Em desenvolvimento, retorne o token. Em produção, remova isso.
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Resetar senha
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    // Atualizar senha
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso' });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar token de reset
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    res.json({ message: 'Token válido' });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
