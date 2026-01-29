const express = require('express');
const Sale = require('../models/Sale');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get receivables
router.get('/', auth, authorize('canManageReceivables'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer } = req.query;
    
    const match = {
      company: req.user.company,
      'payments.method': { $in: ['bank_slip', 'promissory_note', 'installment'] }
    };

    if (status) {
      match['payments.status'] = status;
    }

    if (customer) {
      match.customer = customer;
    }

    const sales = await Sale.find(match)
      .populate('customer', 'name document')
      .populate('user', 'name')
      .sort({ saleDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter payments
    const receivables = [];
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        if (['bank_slip', 'promissory_note', 'installment'].includes(payment.method)) {
          if (!status || payment.status === status) {
            receivables.push({
              _id: sale._id,
              saleNumber: sale.saleNumber,
              saleDate: sale.saleDate,
              customer: sale.customer,
              customerName: sale.customerName,
              payment: payment,
              total: sale.total
            });
          }
        }
      });
    });

    const total = receivables.length;

    res.json({
      receivables: receivables.slice((page - 1) * limit, page * limit),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update payment status
router.put('/:saleId/payment/:paymentId', auth, authorize('canManageReceivables'), async (req, res) => {
  try {
    const { status } = req.body;

    const sale = await Sale.findById(req.params.saleId);
    
    if (!sale) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    if (sale.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para editar esta venda' });
    }

    const payment = sale.payments.id(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado' });
    }

    if (!['bank_slip', 'promissory_note', 'installment'].includes(payment.method)) {
      return res.status(400).json({ message: 'Este método de pagamento não pode ser atualizado' });
    }

    payment.status = status;
    await sale.save();

    res.json({
      message: 'Status do pagamento atualizado com sucesso',
      sale
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get overdue receivables
router.get('/overdue', auth, authorize('canManageReceivables'), async (req, res) => {
  try {
    const today = new Date();
    
    const sales = await Sale.find({
      company: req.user.company,
      'payments.method': { $in: ['bank_slip', 'promissory_note', 'installment'] },
      'payments.status': 'pending',
      'payments.dueDate': { $lt: today }
    })
    .populate('customer', 'name document')
    .sort({ 'payments.dueDate': 1 });

    const overdue = [];
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        if (['bank_slip', 'promissory_note', 'installment'].includes(payment.method) &&
            payment.status === 'pending' &&
            payment.dueDate < today) {
          overdue.push({
            _id: sale._id,
            saleNumber: sale.saleNumber,
            saleDate: sale.saleDate,
            customer: sale.customer,
            customerName: sale.customerName,
            payment: payment,
            total: sale.total
          });
        }
      });
    });

    res.json(overdue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
