const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('company');
    
    if (!user) {
      return res.status(401).json({ message: 'Token inválido. Usuário não encontrado.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Usuário inativo.' });
    }

    if (!user.isApproved && user.role !== 'administrador') {
      return res.status(401).json({ message: 'Usuário não aprovado.' });
    }

    const company = await Company.findById(user.company._id);
    if (!company.isActive) {
      return res.status(401).json({ message: 'Empresa inativa.' });
    }

    if (!company.isApproved && user.role !== 'administrador') {
      return res.status(401).json({ message: 'Empresa não aprovada.' });
    }

    req.user = user;
    req.company = company;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(401).json({ message: 'Token inválido.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Acesso negado. Permissão insuficiente.' 
      });
    }
    next();
  };
};

const authorizeOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === 'administrador' || req.user.role === 'dono') {
    return next();
  }
  return res.status(403).json({ 
    message: 'Acesso negado. Permissão insuficiente.' 
  });
};

const authorizeSelfOrAdmin = (req, res, next) => {
  const targetUserId = req.params.id || req.params.userId;
  
  if (req.user.role === 'administrador' || req.user._id.toString() === targetUserId) {
    return next();
  }
  
  return res.status(403).json({ 
    message: 'Acesso negado. Você só pode acessar seus próprios dados.' 
  });
};

module.exports = {
  auth,
  authorize,
  authorizeOwnerOrAdmin,
  authorizeSelfOrAdmin
};
