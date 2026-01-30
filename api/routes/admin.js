const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(auth);
router.use(authorize('administrador'));

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalCompanies,
      pendingCompanies,
      totalUsers,
      pendingUsers,
      activeCompanies,
      totalSales,
      totalProducts
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isApproved: false }),
      User.countDocuments(),
      User.countDocuments({ isApproved: false }),
      Company.countDocuments({ isActive: true, isApproved: true }),
      Sale.countDocuments({ status: 'completed' }),
      Product.countDocuments({ isDeleted: false })
    ]);

    const recentCompanies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('companyName cnpj email isApproved createdAt');

    const recentUsers = await User.find()
      .populate('company', 'companyName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role isApproved createdAt');

    res.json({
      overview: {
        totalCompanies,
        pendingCompanies,
        totalUsers,
        pendingUsers,
        activeCompanies,
        totalSales,
        totalProducts
      },
      recent: {
        companies: recentCompanies,
        users: recentUsers
      }
    });
  } catch (error) {
    console.error('Erro ao obter dashboard admin:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/companies/pending', async (req, res) => {
  try {
    const companies = await Company.find({ isApproved: false })
      .sort({ createdAt: -1 });

    res.json(companies);
  } catch (error) {
    console.error('Erro ao listar empresas pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/users/pending', async (req, res) => {
  try {
    const users = await User.find({ isApproved: false })
      .populate('company', 'companyName cnpj')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/companies/:id/approve', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    res.json({ message: 'Empresa aprovada com sucesso', company });
  } catch (error) {
    console.error('Erro ao aprovar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/users/:id/approve', async (req, res) => {
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

router.get('/companies', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      isApproved = '', 
      isActive = '' 
    } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { cnpj: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (isApproved !== '') {
      query.isApproved = isApproved === 'true';
    }
    if (isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      isApproved = '', 
      isActive = '' 
    } = req.query;
    
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
    if (isApproved !== '') {
      query.isApproved = isApproved === 'true';
    }
    if (isActive !== '') {
      query.isActive = isActive === 'true';
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

router.get('/usage', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const [
      activeUsers,
      totalSales,
      totalProducts,
      companyUsage
    ] = await Promise.all([
      User.aggregate([
        { $match: { 
          lastLogin: { $gte: startDate, $lte: endDate },
          isActive: true 
        }},
        { $group: {
          _id: null,
          count: { $sum: 1 }
        }}
      ]),
      Sale.aggregate([
        { $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }},
        { $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }}
      ]),
      Product.aggregate([
        { $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          isDeleted: false 
        }},
        { $group: {
          _id: null,
          count: { $sum: 1 }
        }}
      ]),
      Sale.aggregate([
        { $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }},
        { $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'companyInfo'
        }},
        { $unwind: '$companyInfo' },
        { $group: {
          _id: '$company',
          companyName: { $first: '$companyInfo.companyName' },
          sales: { $sum: 1 },
          total: { $sum: '$total' }
        }},
        { $sort: { total: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      period,
      activeUsers: activeUsers[0] || { count: 0 },
      totalSales: totalSales[0] || { count: 0, total: 0 },
      totalProducts: totalProducts[0] || { count: 0 },
      companyUsage
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de uso:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      startDate = '', 
      endDate = '',
      action = '',
      userId = ''
    } = req.query;
    
    const query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59');
      }
    }
    
    if (action) {
      query.action = action;
    }
    
    if (userId) {
      query.user = userId;
    }

    res.json({
      message: 'Sistema de logs não implementado ainda',
      query
    });
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/system/info', async (req, res) => {
  try {
    const systemInfo = {
      version: '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        connected: true,
        collections: {
          companies: await Company.countDocuments(),
          users: await User.countDocuments(),
          products: await Product.countDocuments(),
          sales: await Sale.countDocuments()
        }
      }
    };

    res.json(systemInfo);
  } catch (error) {
    console.error('Erro ao obter informações do sistema:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
