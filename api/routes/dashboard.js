const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const Receivable = require('../models/Receivable');
const { auth, authorizeOwnerOrAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/overview', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startOfDay = new Date(today.toISOString().split('T')[0] + 'T00:00:00');
    const endOfDay = new Date(today.toISOString().split('T')[0] + 'T23:59:59');

    const [
      totalSales,
      monthlySales,
      todaySales,
      lowStockProducts,
      totalCustomers,
      pendingReceivables
    ] = await Promise.all([
      Sale.countDocuments({ company: req.company._id, status: 'completed' }),
      Sale.aggregate([
        { $match: { 
          company: req.company._id,
          status: 'completed',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }},
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { 
          company: req.company._id,
          status: 'completed',
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }},
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Product.countDocuments({ 
        company: req.company._id,
        isDeleted: false,
        $expr: { $lte: ['$quantity', '$minStock'] }
      }),
      Customer.countDocuments({ 
        company: req.company._id,
        isDeleted: false 
      }),
      Receivable.aggregate([
        { $match: { 
          company: req.company._id,
          status: { $in: ['pending', 'overdue'] }
        }},
        { $group: { _id: null, total: { $sum: '$currentAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      totalSales,
      monthlySales: monthlySales[0] || { total: 0, count: 0 },
      todaySales: todaySales[0] || { total: 0, count: 0 },
      lowStockProducts,
      totalCustomers,
      pendingReceivables: pendingReceivables[0] || { total: 0, count: 0 }
    });
  } catch (error) {
    console.error('Erro ao obter visão geral:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/sales/monthly', auth, async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const sales = await Sale.aggregate([
      { $match: { 
        company: req.company._id,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $group: {
        _id: { $month: '$createdAt' },
        total: { $sum: '$total' },
        count: { $sum: 1 }
      }},
      { $sort: { '_id': 1 } }
    ]);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i).toLocaleDateString('pt-BR', { month: 'long' }),
      total: 0,
      count: 0
    }));

    sales.forEach(sale => {
      monthlyData[sale._id - 1] = {
        ...monthlyData[sale._id - 1],
        total: sale.total,
        count: sale.count
      };
    });

    res.json({ year, data: monthlyData });
  } catch (error) {
    console.error('Erro ao obter vendas mensais:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/sales/top-products', auth, async (req, res) => {
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

    const topProducts = await Sale.aggregate([
      { $match: { 
        company: req.company._id,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $unwind: '$items' },
      { $group: {
        _id: '$items.description',
        totalQuantity: { $sum: '$items.quantity' },
        totalValue: { $sum: '$items.total' },
        count: { $sum: 1 }
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    res.json({ period, data: topProducts });
  } catch (error) {
    console.error('Erro ao obter produtos mais vendidos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/sales/top-customers', auth, async (req, res) => {
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

    const topCustomers = await Sale.aggregate([
      { $match: { 
        company: req.company._id,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate },
        customer: { $ne: 'CONSUMIDOR' }
      }},
      { $group: {
        _id: '$customerName',
        totalValue: { $sum: '$total' },
        count: { $sum: 1 }
      }},
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    res.json({ period, data: topCustomers });
  } catch (error) {
    console.error('Erro ao obter clientes que mais compram:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/inventory/low-stock', auth, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      company: req.company._id,
      isDeleted: false,
      $expr: { $lte: ['$quantity', '$minStock'] }
    })
    .select('description quantity minStock unit barcode')
    .sort({ quantity: 1 })
    .limit(20);

    res.json(lowStockProducts);
  } catch (error) {
    console.error('Erro ao obter produtos com estoque baixo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/inventory/movements', auth, async (req, res) => {
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

    const movements = await Product.aggregate([
      { $match: { company: req.company._id } },
      { $unwind: '$stockMovements' },
      { $match: { 'stockMovements.date': { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$stockMovements.type',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$stockMovements.quantity' }
      }}
    ]);

    res.json({ period, data: movements });
  } catch (error) {
    console.error('Erro ao obter movimentações de estoque:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/financial/receivables', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const receivables = await Receivable.aggregate([
      { $match: { company: req.company._id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$currentAmount' }
      }}
    ]);

    const overdueReceivables = await Receivable.find({
      company: req.company._id,
      status: 'pending',
      dueDate: { $lt: new Date() }
    }).select('customerName dueDate currentAmount');

    res.json({
      summary: receivables,
      overdue: overdueReceivables
    });
  } catch (error) {
    console.error('Erro ao obter contas a receber:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/reports/export', auth, async (req, res) => {
  try {
    const { type, startDate, endDate, format = 'json' } = req.query;
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Tipo, data inicial e final são obrigatórios' 
      });
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    let data;
    switch (type) {
      case 'sales':
        data = await Sale.find({
          company: req.company._id,
          createdAt: { $gte: start, $lte: end }
        })
        .populate('customer', 'name document')
        .populate('user', 'name')
        .sort({ createdAt: -1 });
        break;
      
      case 'products':
        data = await Product.find({
          company: req.company._id,
          isDeleted: false
        })
        .select('description quantity costPrice salePrice totalSold totalEntries')
        .sort({ description: 1 });
        break;
      
      case 'customers':
        data = await Customer.find({
          company: req.company._id,
          isDeleted: false
        })
        .select('name document email totalPurchases purchaseHistory')
        .sort({ name: 1 });
        break;
      
      case 'entries':
        data = await Entry.find({
          company: req.company._id,
          createdAt: { $gte: start, $lte: end }
        })
        .populate('user', 'name')
        .sort({ createdAt: -1 });
        break;
      
      default:
        return res.status(400).json({ message: 'Tipo de relatório inválido' });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_${startDate}_${endDate}.csv`);
      res.send(csv);
    } else {
      res.json({ type, period: { startDate, endDate }, data });
    }
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject());
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(item => {
    const values = headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object' && value.constructor === Object) {
        return JSON.stringify(value);
      }
      return `"${value}"`;
    });
    return values.join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;
