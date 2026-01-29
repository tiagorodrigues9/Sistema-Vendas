const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get dashboard data
router.get('/', auth, authorize('canViewDashboard'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Date range
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.$gte = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      dateFilter.$lte = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date();
    }

    // Sales data
    const salesMatch = {
      company: req.user.company,
      status: 'completed'
    };
    
    if (Object.keys(dateFilter).length > 0) {
      salesMatch.saleDate = dateFilter;
    }

    const salesData = await Sale.aggregate([
      { $match: salesMatch },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgTicket: { $avg: '$total' }
        }
      }
    ]);

    // Payment methods
    const paymentMethods = await Sale.aggregate([
      { $match: salesMatch },
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.method',
          total: { $sum: '$payments.amount' }
        }
      }
    ]);

    // Top products
    const topProducts = await Sale.aggregate([
      { $match: salesMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    // Top customers
    const topCustomers = await Sale.aggregate([
      { $match: salesMatch },
      {
        $group: {
          _id: '$customer',
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' }
    ]);

    // Low stock products
    const lowStock = await Product.find({
      company: req.user.company,
      isDeleted: false,
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    }).limit(10);

    // Monthly sales trend
    const monthlySales = await Sale.aggregate([
      { $match: salesMatch },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' }
          },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      salesData: salesData[0] || { totalSales: 0, totalRevenue: 0, avgTicket: 0 },
      paymentMethods,
      topProducts,
      topCustomers,
      lowStock,
      monthlySales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get sales report
router.get('/sales', auth, authorize('canViewReports'), async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    
    const match = {
      company: req.user.company,
      status: 'completed'
    };

    if (startDate || endDate) {
      match.saleDate = {};
      if (startDate) match.saleDate.$gte = new Date(startDate);
      if (endDate) match.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const sales = await Sale.find(match)
      .populate('customer', 'name document')
      .populate('user', 'name')
      .sort({ saleDate: -1 });

    if (format === 'csv') {
      // CSV format
      const csv = [
        ['Data', 'Número', 'Cliente', 'Vendedor', 'Total', 'Forma Pagamento'].join(','),
        ...sales.map(sale => [
          sale.saleDate.toLocaleDateString('pt-BR'),
          sale.saleNumber,
          sale.customerName,
          sale.userName,
          sale.total.toFixed(2),
          sale.payments.map(p => p.method).join(';')
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vendas.csv');
      return res.send(csv);
    }

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get products report
router.get('/products', auth, authorize('canViewReports'), async (req, res) => {
  try {
    const products = await Product.find({
      company: req.user.company,
      isDeleted: false
    }).sort({ description: 1 });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get entries report
router.get('/entries', auth, authorize('canViewReports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const match = { company: req.user.company };

    if (startDate || endDate) {
      match.entryDate = {};
      if (startDate) match.entryDate.$gte = new Date(startDate);
      if (endDate) match.entryDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const entries = await Entry.find(match)
      .populate('user', 'name')
      .sort({ entryDate: -1 });

    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
