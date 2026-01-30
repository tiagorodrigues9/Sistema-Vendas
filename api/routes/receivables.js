const express = require('express');
const Receivable = require('../models/Receivable');
const Sale = require('../models/Sale');
const { auth, authorizeOwnerOrAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      startDate = '', 
      endDate = '' 
    } = req.query;
    
    const query = { company: req.company._id };
    
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { saleNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) {
        query.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dueDate.$lte = new Date(endDate + 'T23:59:59');
      }
    }

    const receivables = await Receivable.find(query)
      .populate('sale', 'saleNumber createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dueDate: 1 });

    const total = await Receivable.countDocuments(query);

    res.json({
      receivables,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar contas a receber:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/overdue', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const overdueReceivables = await Receivable.find({
      company: req.company._id,
      status: 'pending',
      dueDate: { $lt: new Date() }
    })
    .populate('sale', 'saleNumber createdAt')
    .sort({ dueDate: 1 });

    res.json(overdueReceivables);
  } catch (error) {
    console.error('Erro ao listar contas vencidas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/summary', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const summary = await Receivable.aggregate([
      { $match: { company: req.company._id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$currentAmount' }
      }}
    ]);

    const overdueTotal = await Receivable.aggregate([
      { $match: { 
        company: req.company._id,
        status: 'pending',
        dueDate: { $lt: new Date() }
      }},
      { $group: {
        _id: null,
        count: { $sum: 1 },
        total: { $sum: '$currentAmount' }
      }}
    ]);

    const next30Days = await Receivable.aggregate([
      { $match: { 
        company: req.company._id,
        status: 'pending',
        dueDate: { 
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }},
      { $group: {
        _id: null,
        count: { $sum: 1 },
        total: { $sum: '$currentAmount' }
      }}
    ]);

    res.json({
      summary,
      overdue: overdueTotal[0] || { count: 0, total: 0 },
      next30Days: next30Days[0] || { count: 0, total: 0 }
    });
  } catch (error) {
    console.error('Erro ao obter resumo de contas a receber:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const receivable = await Receivable.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    })
      .populate('sale')
      .populate('payments.user', 'name');

    if (!receivable) {
      return res.status(404).json({ message: 'Conta a receber não encontrada' });
    }

    res.json(receivable);
  } catch (error) {
    console.error('Erro ao obter conta a receber:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/:id/payment', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { amount, method, notes } = req.body;
    
    const receivable = await Receivable.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!receivable) {
      return res.status(404).json({ message: 'Conta a receber não encontrada' });
    }

    if (receivable.status === 'paid') {
      return res.status(400).json({ message: 'Conta já está paga' });
    }

    if (amount > receivable.currentAmount) {
      return res.status(400).json({ message: 'Valor do pagamento é maior que o valor devido' });
    }

    await receivable.addPayment(amount, method, req.user._id, notes);

    res.json({ message: 'Pagamento registrado com sucesso', receivable });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/cancel', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const receivable = await Receivable.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!receivable) {
      return res.status(404).json({ message: 'Conta a receber não encontrada' });
    }

    if (receivable.status === 'cancelled') {
      return res.status(400).json({ message: 'Conta já está cancelada' });
    }

    await receivable.cancel(reason);

    res.json({ message: 'Conta cancelada com sucesso', receivable });
  } catch (error) {
    console.error('Erro ao cancelar conta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/customer/:customerId', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const receivables = await Receivable.find({
      company: req.company._id,
      customer: req.params.customerId
    })
    .populate('sale', 'saleNumber createdAt')
    .sort({ dueDate: 1 });

    res.json(receivables);
  } catch (error) {
    console.error('Erro ao listar contas do cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/installments/overdue', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const overdueInstallments = await Receivable.aggregate([
      { $match: { company: req.company._id } },
      { $unwind: '$installments' },
      { $match: { 
        'installments.status': 'pending',
        'installments.dueDate': { $lt: new Date() }
      }},
      {
        $project: {
          customerName: 1,
          saleNumber: 1,
          installment: '$installments'
        }
      },
      { $sort: { 'installment.dueDate': 1 } }
    ]);

    res.json(overdueInstallments);
  } catch (error) {
    console.error('Erro ao listar parcelas vencidas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/installments/:receivableId/:installmentNumber/payment', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { amount, method, notes } = req.body;
    
    const receivable = await Receivable.findOne({ 
      _id: req.params.receivableId,
      company: req.company._id 
    });

    if (!receivable) {
      return res.status(404).json({ message: 'Conta a receber não encontrada' });
    }

    const installment = receivable.installments.id(req.params.installmentNumber);
    if (!installment) {
      return res.status(404).json({ message: 'Parcela não encontrada' });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({ message: 'Parcela já está paga' });
    }

    if (amount > installment.amount) {
      return res.status(400).json({ message: 'Valor do pagamento é maior que o valor da parcela' });
    }

    installment.status = 'paid';
    installment.paidAt = new Date();
    installment.paidAmount = amount;

    receivable.payments.push({
      amount,
      method,
      notes,
      user: req.user._id
    });

    receivable.currentAmount -= amount;

    const allPaid = receivable.installments.every(inst => inst.status === 'paid');
    if (allPaid) {
      receivable.status = 'paid';
      receivable.currentAmount = 0;
    }

    await receivable.save();

    res.json({ message: 'Pagamento de parcela registrado com sucesso', receivable });
  } catch (error) {
    console.error('Erro ao registrar pagamento de parcela:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
