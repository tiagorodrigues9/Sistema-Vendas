const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Receivable = require('../models/Receivable');
const { auth } = require('../middleware/auth');
const { validateSale } = require('../middleware/validation');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      startDate = '', 
      endDate = '', 
      status = '' 
    } = req.query;
    
    const query = { company: req.company._id };
    
    if (search) {
      query.$or = [
        { saleNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59');
      }
    }
    
    if (status) {
      query.status = status;
    }

    const sales = await Sale.find(query)
      .populate('customer', 'name document')
      .populate('user', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    })
      .populate('customer', 'name document email phone')
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit');

    if (!sale) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Erro ao obter venda:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/', auth, validateSale, async (req, res) => {
  try {
    const { customer, items, payments, discount = 0, notes } = req.body;

    const company = req.company;
    if (!company.settings.cashRegister.isOpen) {
      return res.status(400).json({ message: 'Caixa não está aberto' });
    }

    let customerData;
    if (customer === 'CONSUMIDOR') {
      customerData = {
        _id: 'CONSUMIDOR',
        name: 'CONSUMIDOR',
        document: '00000000000'
      };
    } else {
      customerData = await Customer.findOne({ 
        _id: customer,
        company: req.company._id 
      });
      
      if (!customerData) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
    }

    for (const item of items) {
      const product = await Product.findOne({ 
        _id: item.product,
        company: req.company._id 
      });
      
      if (!product) {
        return res.status(404).json({ message: `Produto não encontrado: ${item.product}` });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Estoque insuficiente para o produto: ${product.description}` 
        });
      }
      
      item.barcode = product.barcode || '';
      item.description = product.description;
      item.unitPrice = product.salePrice;
      item.total = item.unitPrice * item.quantity;
    }

    const saleData = {
      customer: customerData._id,
      customerName: customerData.name,
      items,
      discount,
      company: req.company._id,
      user: req.user._id,
      cashRegister: {
        isOpen: company.settings.cashRegister.isOpen,
        openingTime: company.settings.cashRegister.openingTime
      },
      notes
    };

    saleData.calculateTotal();
    saleData.processPayment(payments);

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (totalPaid < saleData.total) {
      return res.status(400).json({ message: 'Valor pago é insuficiente' });
    }

    const sale = new Sale(saleData);
    await sale.save();

    for (const item of items) {
      await Product.findById(item.product).then(product => {
        return product.removeStock(item.quantity, `Venda: ${sale.saleNumber}`, req.user._id);
      });
    }

    if (customerData._id !== 'CONSUMIDOR') {
      await customerData.addPurchase(sale._id, sale.total);
    }

    const hasReceivable = payments.some(payment => 
      ['boleto', 'promissoria', 'parcelado'].includes(payment.method)
    );

    if (hasReceivable) {
      const receivablePayments = payments.filter(payment => 
        ['boleto', 'promissoria', 'parcelado'].includes(payment.method)
      );

      for (const payment of receivablePayments) {
        const receivable = new Receivable({
          sale: sale._id,
          saleNumber: sale.saleNumber,
          customer: customerData._id,
          customerName: customerData.name,
          paymentMethod: payment.method,
          originalAmount: payment.amount,
          currentAmount: payment.amount,
          dueDate: payment.dueDate,
          company: req.company._id
        });

        if (payment.method === 'parcelado' && payment.installments > 1) {
          const installmentAmount = payment.amount / payment.installments;
          const installments = [];
          
          for (let i = 1; i <= payment.installments; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            
            installments.push({
              number: i,
              amount: installmentAmount,
              dueDate,
              status: 'pending'
            });
          }
          
          receivable.installments = installments;
        }

        await receivable.save();
      }
    }

    company.settings.cashRegister.currentAmount += sale.total;
    await company.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name document')
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit');

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const sale = await Sale.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!sale) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({ message: 'Venda já está cancelada' });
    }

    await sale.cancel(req.user._id, reason);

    for (const item of sale.items) {
      await Product.findById(item.product).then(product => {
        return product.addStock(item.quantity, `Cancelamento venda: ${sale.saleNumber}`, req.user._id);
      });
    }

    const company = req.company;
    company.settings.cashRegister.currentAmount -= sale.total;
    await company.save();

    await Receivable.updateMany(
      { sale: sale._id },
      { status: 'cancelled', notes: reason }
    );

    res.json({ message: 'Venda cancelada com sucesso', sale });
  } catch (error) {
    console.error('Erro ao cancelar venda:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/report/daily', auth, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const startOfDay = new Date(date + 'T00:00:00');
    const endOfDay = new Date(date + 'T23:59:59');

    const sales = await Sale.find({
      company: req.company._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    }).populate('user', 'name');

    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);

    const paymentMethods = {};
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        if (!paymentMethods[payment.method]) {
          paymentMethods[payment.method] = 0;
        }
        paymentMethods[payment.method] += payment.amount;
      });
    });

    res.json({
      date,
      totalSales,
      totalValue,
      totalDiscount,
      paymentMethods,
      sales
    });
  } catch (error) {
    console.error('Erro ao gerar relatório diário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/report/period', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Data inicial e final são obrigatórias' });
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    const sales = await Sale.find({
      company: req.company._id,
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    }).populate('user', 'name').populate('customer', 'name');

    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);

    const dailySales = {};
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { count: 0, total: 0 };
      }
      dailySales[date].count++;
      dailySales[date].total += sale.total;
    });

    const topProducts = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!topProducts[item.description]) {
          topProducts[item.description] = { quantity: 0, total: 0 };
        }
        topProducts[item.description].quantity += item.quantity;
        topProducts[item.description].total += item.total;
      });
    });

    const topCustomers = {};
    sales.forEach(sale => {
      if (!topCustomers[sale.customerName]) {
        topCustomers[sale.customerName] = { count: 0, total: 0 };
      }
      topCustomers[sale.customerName].count++;
      topCustomers[sale.customerName].total += sale.total;
    });

    res.json({
      period: { startDate, endDate },
      totalSales,
      totalValue,
      totalDiscount,
      dailySales,
      topProducts,
      topCustomers,
      sales
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de período:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
