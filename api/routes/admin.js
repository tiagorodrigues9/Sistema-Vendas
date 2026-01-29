const express = require('express');
const Company = require('../models/Company');
const User = require('../models/User');
const Sale = require('../models/Sale');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get pending companies
router.get('/companies/pending', auth, adminOnly, async (req, res) => {
  try {
    const companies = await Company.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get system statistics
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const pendingCompanies = await Company.countDocuments({ status: 'pending' });
    const approvedCompanies = await Company.countDocuments({ status: 'approved' });
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const totalSales = await Sale.countDocuments();
    const totalRevenue = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      totalUsers,
      activeUsers,
      totalSales,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get user activity
router.get('/users/activity', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .populate('company', 'companyName status')
      .select('-password')
      .sort({ lastLogin: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get company usage
router.get('/companies/usage', auth, adminOnly, async (req, res) => {
  try {
    const companies = await Company.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'company',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'company',
          as: 'sales'
        }
      },
      {
        $project: {
          companyName: 1,
          cnpj: 1,
          email: 1,
          status: 1,
          createdAt: 1,
          userCount: { $size: '$users' },
          saleCount: { $size: '$sales' },
          totalRevenue: { $sum: '$sales.total' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
