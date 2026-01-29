const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const CashRegister = require('../models/CashRegister');
const { auth, authorize } = require('../middleware/auth');
const { generateSaleNumber } = require('../utils/helpers');

const router = express.Router();

// Get all sales
router.get('/', auth, authorize('canMakeSales'), async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, customer, status } = req.query;
    
    const query = { company: req.user.company };

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (customer) {
      query.customer = customer;
    }

    if (status) {
      query.status = status;
    }

    const sales = await Sale.find(query)
      .populate('customer', 'name document')
      .populate('user', 'name')
      .sort({ saleDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get sale by ID
router.get('/:id', auth, authorize('canMakeSales'), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name document phone address')
      .populate('user', 'name');
    
    if (!sale) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    // Check if sale belongs to user's company
    if (sale.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para visualizar esta venda' });
    }

    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Create sale
router.post('/', auth, authorize('canMakeSales'), [
  body('customer').notEmpty().withMessage('Cliente é obrigatório'),
  body('items').isArray({ min: 1 }).withMessage('Itens são obrigatórios'),
  body('items.*.product').notEmpty().withMessage('Produto é obrigatório'),
  body('items.*.quantity').isNumeric().withMessage('Quantidade deve ser um número'),
  body('items.*.unitPrice').isNumeric().withMessage('Preço unitário deve ser um número'),
  body('payments').isArray({ min: 1 }).withMessage('Pagamentos são obrigatórios'),
  body('payments.*.method').isIn(['cash', 'credit_card', 'debit_card', 'pix', 'bank_slip', 'promissory_note', 'installment']).withMessage('Método de pagamento inválido'),
  body('payments.*.amount').isNumeric().withMessage('Valor do pagamento deve ser um número')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, items, payments, observations } = req.body;

    // Get customer
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Check if customer belongs to user's company
    if (customerDoc.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Cliente não pertence à sua empresa' });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `Produto ${item.product} não encontrado` });
      }

      if (product.company.toString() !== req.user.company.toString()) {
        return res.status(403).json({ message: `Produto ${product.description} não pertence à sua empresa` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Estoque insuficiente para o produto ${product.description}` });
      }

      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        barcode: product.barcode || '',
        description: product.description,
        unit: product.unit,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal
      });

      // Update product stock
      product.quantity -= item.quantity;
      product.totalSold += item.quantity;
      await product.save();
    }

    // Validate payments
    let totalPaid = 0;
    const validatedPayments = [];

    for (const payment of payments) {
      totalPaid += payment.amount;
      
      const paymentData = {
        method: payment.method,
        amount: payment.amount,
        status: 'paid'
      };

      if (payment.method === 'installment') {
        paymentData.installments = payment.installments || 1;
        paymentData.status = 'pending';
        // Set due dates for installments
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1);
        paymentData.dueDate = dueDate;
      }

      validatedPayments.push(paymentData);
    }

    if (totalPaid < subtotal) {
      return res.status(400).json({ message: 'Valor pago é insuficiente' });
    }

    const change = totalPaid - subtotal;

    // Create sale
    const sale = new Sale({
      saleNumber: generateSaleNumber(),
      customer: customerDoc._id,
      customerName: customerDoc.name,
      company: req.user.company,
      user: req.user._id,
      userName: req.user.name,
      items: validatedItems,
      subtotal,
      discount: 0,
      total: subtotal,
      payments: validatedPayments,
      change,
      observations
    });

    await sale.save();

    // Update customer stats
    customerDoc.totalPurchases += 1;
    customerDoc.totalSpent += subtotal;
    await customerDoc.save();

    res.status(201).json({
      message: 'Venda realizada com sucesso',
      sale
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Cancel sale
router.put('/:id/cancel', auth, authorize('canMakeSales'), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    // Check if sale belongs to user's company
    if (sale.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para cancelar esta venda' });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({ message: 'Venda já cancelada' });
    }

    // Restore product stock
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        product.totalSold -= item.quantity;
        await product.save();
      }
    }

    // Update customer stats
    const customer = await Customer.findById(sale.customer);
    if (customer) {
      customer.totalPurchases -= 1;
      customer.totalSpent -= sale.total;
      await customer.save();
    }

    sale.status = 'cancelled';
    await sale.save();

    res.json({
      message: 'Venda cancelada com sucesso',
      sale
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get today's sales
router.get('/today/summary', auth, authorize('canMakeSales'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const sales = await Sale.find({
      company: req.user.company,
      saleDate: { $gte: startOfDay, $lt: endOfDay },
      status: 'completed'
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCash = sales.reduce((sum, sale) => {
      const cashPayments = sale.payments.filter(p => p.method === 'cash');
      return sum + cashPayments.reduce((s, p) => s + p.amount, 0);
    }, 0);
    const totalCard = sales.reduce((sum, sale) => {
      const cardPayments = sale.payments.filter(p => ['credit_card', 'debit_card'].includes(p.method));
      return sum + cardPayments.reduce((s, p) => s + p.amount, 0);
    }, 0);

    res.json({
      totalSales,
      totalRevenue,
      totalCash,
      totalCard,
      totalOther: totalRevenue - totalCash - totalCard
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Open cash register
router.post('/cash-register/open', auth, authorize('canMakeSales'), [
  body('openingBalance').isNumeric().withMessage('Saldo inicial deve ser um número')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { openingBalance } = req.body;

    // Check if there's an open cash register
    const openRegister = await CashRegister.findOne({
      company: req.user.company,
      user: req.user._id,
      status: 'open'
    });

    if (openRegister) {
      return res.status(400).json({ message: 'Caixa já aberto' });
    }

    const cashRegister = new CashRegister({
      company: req.user.company,
      user: req.user._id,
      userName: req.user.name,
      openingBalance,
      status: 'open'
    });

    await cashRegister.save();

    res.status(201).json({
      message: 'Caixa aberto com sucesso',
      cashRegister
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Close cash register
router.put('/cash-register/close', auth, authorize('canMakeSales'), async (req, res) => {
  try {
    const cashRegister = await CashRegister.findOne({
      company: req.user.company,
      user: req.user._id,
      status: 'open'
    });

    if (!cashRegister) {
      return res.status(404).json({ message: 'Caixa não encontrado ou já fechado' });
    }

    // Calculate totals
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const sales = await Sale.find({
      company: req.user.company,
      user: req.user._id,
      saleDate: { $gte: startOfDay, $lt: endOfDay },
      status: 'completed'
    });

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCash = sales.reduce((sum, sale) => {
      const cashPayments = sale.payments.filter(p => p.method === 'cash');
      return sum + cashPayments.reduce((s, p) => s + p.amount, 0);
    }, 0);
    const totalCard = sales.reduce((sum, sale) => {
      const cardPayments = sale.payments.filter(p => ['credit_card', 'debit_card'].includes(p.method));
      return sum + cardPayments.reduce((s, p) => s + p.amount, 0);
    }, 0);

    cashRegister.closingDate = new Date();
    cashRegister.closingBalance = cashRegister.openingBalance + totalCash;
    cashRegister.totalSales = totalSales;
    cashRegister.totalCash = totalCash;
    cashRegister.totalCard = totalCard;
    cashRegister.totalOther = totalSales - totalCash - totalCard;
    cashRegister.status = 'closed';

    await cashRegister.save();

    res.json({
      message: 'Caixa fechado com sucesso',
      cashRegister
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get current cash register
router.get('/cash-register/current', auth, authorize('canMakeSales'), async (req, res) => {
  try {
    const cashRegister = await CashRegister.findOne({
      company: req.user.company,
      user: req.user._id,
      status: 'open'
    });

    if (!cashRegister) {
      return res.status(404).json({ message: 'Nenhum caixa aberto' });
    }

    res.json(cashRegister);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
