const express = require('express');
const CashRegister = require('../models/CashRegister');
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Abrir caixa
router.post('/open', auth, async (req, res) => {
  try {
    const { initialAmount } = req.body;
    
    // Verificar se já existe caixa aberto hoje
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const existingCashRegister = await CashRegister.findOne({
      company: req.company._id,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: 'open'
    });
    
    if (existingCashRegister) {
      console.log('⚠️ Tentativa de abrir segundo caixa no mesmo dia:', {
        companyId: req.company._id,
        existingId: existingCashRegister._id,
        date: today.toISOString().split('T')[0]
      });
      return res.status(400).json({ 
        message: 'Já existe um caixa aberto hoje. Feche o caixa atual antes de abrir um novo.' 
      });
    }
    
    const cashRegister = new CashRegister({
      company: req.company._id,
      date: startOfDay,
      openTime: new Date(),
      openedBy: req.user._id,
      initialAmount,
      status: 'open'
    });
    
    await cashRegister.save();
    await cashRegister.populate('openedBy', 'name');

    // Sincronizar o estado do caixa na configuração da company
    try {
      req.company.settings.cashRegister.isOpen = true;
      req.company.settings.cashRegister.openingTime = cashRegister.openTime;
      req.company.settings.cashRegister.initialAmount = cashRegister.initialAmount || 0;
      req.company.settings.cashRegister.currentAmount = cashRegister.initialAmount || 0;
      req.company.settings.cashRegister._id = cashRegister._id;
      await req.company.save();
    } catch (syncErr) {
      console.error('Erro ao sincronizar company.settings ao abrir caixa:', syncErr);
    }
    
    res.status(201).json(cashRegister);
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    res.status(500).json({ message: 'Erro ao abrir caixa' });
  }
});

// Fechar caixa
router.post('/close/:id', auth, async (req, res) => {
  try {
    const { finalAmount } = req.body;
    
    const cashRegister = await CashRegister.findOne({
      _id: req.params.id,
      company: req.company._id,
      status: 'open'
    });
    
    if (!cashRegister) {
      return res.status(404).json({ message: 'Caixa não encontrado ou já fechado' });
    }
    
    // Determinar momento de fechamento e buscar vendas do caixa:
    const closeMoment = new Date();

    // Buscar APENAS vendas associadas especificamente a este caixa pelo registerId
    // Sem fallback - isolamento total entre caixas é crítico
    const sales = await Sale.find({
      company: req.company._id,
      'cashRegister.registerId': cashRegister._id,
      status: 'completed'
    });

    console.log('DEBUG - Fechando caixa:', {
      cashRegisterId: cashRegister._id,
      salesFound: sales.length,
      salesIds: sales.map(s => ({ id: s._id, number: s.saleNumber, registerId: s.cashRegister?.registerId }))
    });

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

    cashRegister.closeTime = closeMoment;
    cashRegister.closedBy = req.user._id;
    // Se finalAmount não foi fornecido, calcular a partir do company.settings.currentAmount ou initialAmount + totalSales
    const computedFinal = (typeof finalAmount === 'number' && !isNaN(finalAmount))
      ? finalAmount
      : (req.company.settings?.cashRegister?.currentAmount || (cashRegister.initialAmount || 0) + totalSales);
    cashRegister.finalAmount = computedFinal;
    cashRegister.totalSales = totalSales;
    cashRegister.salesCount = sales.length;
    cashRegister.sales = sales.map(sale => sale._id);
    cashRegister.status = 'closed';
    
    await cashRegister.save();
    await cashRegister.populate([
      { path: 'openedBy', select: 'name' },
      { path: 'closedBy', select: 'name' }
    ]);
    await cashRegister.populate({ path: 'sales', select: 'saleNumber total createdAt' });

    // Atualizar estado do caixa na company
    try {
      req.company.settings.cashRegister.isOpen = false;
      req.company.settings.cashRegister.closingTime = cashRegister.closeTime;
      req.company.settings.cashRegister.currentAmount = cashRegister.finalAmount || req.company.settings.cashRegister.currentAmount || 0;
      req.company.settings.cashRegister._id = null;
      await req.company.save();
    } catch (syncErr) {
      console.error('Erro ao sincronizar company.settings ao fechar caixa:', syncErr);
    }
    
    res.json(cashRegister);
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    res.status(500).json({ message: 'Erro ao fechar caixa' });
  }
});

// Listar histórico de caixas
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, status } = req.query;
    
    const query = { company: req.company._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate + 'T23:59:59');
      }
    }
    
    if (status) {
      query.status = status;
    }
    
    const cashRegisters = await CashRegister.find(query)
      .populate('openedBy', 'name')
      .populate('closedBy', 'name')
      .sort({ date: -1, openTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CashRegister.countDocuments(query);
    
    res.json({
      cashRegisters,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao listar caixas:', error);
    res.status(500).json({ message: 'Erro ao listar caixas' });
  }
});

// Buscar caixa por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cashRegister = await CashRegister.findOne({
      _id: req.params.id,
      company: req.company._id
    })
      .populate('openedBy', 'name')
      .populate('closedBy', 'name')
      .populate('sales');
    
    if (!cashRegister) {
      return res.status(404).json({ message: 'Caixa não encontrado' });
    }
    
    res.json(cashRegister);
  } catch (error) {
    console.error('Erro ao buscar caixa:', error);
    res.status(500).json({ message: 'Erro ao buscar caixa' });
  }
});

// Reabrir caixa (apenas do dia atual)
router.post('/reopen/:id', auth, async (req, res) => {
  try {
    const cashRegister = await CashRegister.findOne({
      _id: req.params.id,
      company: req.company._id,
      status: 'closed'
    });
    
    if (!cashRegister) {
      return res.status(404).json({ message: 'Caixa não encontrado' });
    }
    
    // Verificar se é do dia atual
    const today = new Date();
    const cashRegisterDate = new Date(cashRegister.date);
    const isToday = cashRegisterDate.toDateString() === today.toDateString();
    
    if (!isToday) {
      return res.status(400).json({ message: 'Não é possível reabrir caixas de dias anteriores' });
    }
    
    cashRegister.status = 'open';
    cashRegister.closeTime = null;
    cashRegister.closedBy = null;
    
    await cashRegister.save();
    await cashRegister.populate('openedBy', 'name');

    // Sincronizar estado do caixa na company ao reabrir
    try {
      req.company.settings.cashRegister.isOpen = true;
      req.company.settings.cashRegister.openingTime = cashRegister.openTime;
      req.company.settings.cashRegister.currentAmount = req.company.settings.cashRegister.currentAmount || 0;
      req.company.settings.cashRegister._id = cashRegister._id;
      await req.company.save();
    } catch (syncErr) {
      console.error('Erro ao sincronizar company.settings ao reabrir caixa:', syncErr);
    }
    
    res.json(cashRegister);
  } catch (error) {
    console.error('Erro ao reabrir caixa:', error);
    res.status(500).json({ message: 'Erro ao reabrir caixa' });
  }
});

module.exports = router;
