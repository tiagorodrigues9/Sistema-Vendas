const express = require('express');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Receivable = require('../models/Receivable');
const CashRegister = require('../models/CashRegister');
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Itens da venda são obrigatórios' });
    }

    const company = req.company;

    // Verificar se o caixa está aberto: preferir o id enviado no payload, depois company.settings, depois buscar um CashRegister aberto no banco
    let currentCashRegister = null;
    let providedRegister = null;
    let openRegisterAny = null;

    if (req.body.cashRegister) {
      try {
        // Buscar documento pelo id fornecido (independentemente do status) para diagnóstico
        providedRegister = await CashRegister.findById(req.body.cashRegister);
        if (providedRegister && providedRegister.company.toString() === req.company._id.toString() && providedRegister.status === 'open') {
          currentCashRegister = providedRegister;
        }
      } catch (err) {
        console.error('Erro ao buscar cashRegister fornecido:', err);
      }
    }

    if (!currentCashRegister && company.settings.cashRegister && company.settings.cashRegister.isOpen) {
      // Se company.settings indica aberto, tentar resolver o CashRegister real no banco.
      try {
        const cfgId = company.settings.cashRegister._id;
        if (cfgId) {
          const cfgRegister = await CashRegister.findOne({ _id: cfgId, company: req.company._id, status: 'open' });
          if (cfgRegister) {
            currentCashRegister = cfgRegister;
          }
        }

        // REMOVIDO: Fallback por data para evitar mistura de caixas
        // Apenas usar CashRegisters específicos por ID
      } catch (err) {
        console.error('Erro ao localizar CashRegister real a partir de company.settings:', err);
      }
    }

    // REMOVIDO: Fallback por data para evitar mistura de caixas
    // Apenas usar caixas identificados especificamente por ID

    // Determinar flag isOpen de forma robusta (documentos CashRegister usam `status: 'open'`)
    const isOpenFlag = Boolean(
      currentCashRegister && (
        (currentCashRegister.status && currentCashRegister.status === 'open') ||
        currentCashRegister.isOpen === true
      )
    );

    if (!isOpenFlag || !currentCashRegister || !currentCashRegister._id) {
      console.error('Falha ao detectar caixa aberto ao criar venda', {
        providedId: req.body.cashRegister,
        providedRegister: providedRegister ? { id: providedRegister._id, status: providedRegister.status, date: providedRegister.date } : null,
        openRegisterAny: openRegisterAny ? { id: openRegisterAny._id, status: openRegisterAny.status, date: openRegisterAny.date } : null,
        companySettings: req.company.settings && req.company.settings.cashRegister ? req.company.settings.cashRegister : null,
        currentCashRegister: currentCashRegister
      });
      return res.status(400).json({ message: 'Caixa não está aberto ou não foi possível identificar o caixa atual' });
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

    // Validar produtos, preencher campos obrigatórios dos itens e calcular total por item
    for (const item of items) {
      const product = await Product.findOne({
        company: req.company._id,
        $or: [ { _id: item.product }, { barcode: item.product } ]
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
      // Garantir que o preço unitário venha do produto
      item.unitPrice = Number(product.salePrice) || 0;
      item.total = Number(item.unitPrice) * Number(item.quantity);
    }

    // Criar instância de Sale para usar métodos do schema
    const sale = new Sale({
      customer: customerData._id,
      customerName: customerData.name,
      items,
      discount,
      company: req.company._id,
      user: req.user._id,
      cashRegister: {
        isOpen: isOpenFlag,
        openingTime: currentCashRegister.openTime || currentCashRegister.openingTime || new Date(),
        registerId: currentCashRegister._id // Apenas permitir registerId válido
      },
      notes
    });

    console.log('DEBUG - Criando venda:', {
      saleNumber: sale.saleNumber,
      registerId: sale.cashRegister.registerId,
      currentCashRegisterId: currentCashRegister._id,
      isOpenFlag
    });

    // Calcular total e processar pagamentos usando os métodos do model
    sale.calculateTotal();
    sale.processPayment(payments);

    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    if (totalPaid < sale.total) {
      return res.status(400).json({ message: 'Valor pago é insuficiente' });
    }

    await sale.save();

    console.log('DEBUG - Venda salva com sucesso:', {
      id: sale._id,
      saleNumber: sale.saleNumber,
      registerId: sale.cashRegister.registerId,
      cashRegisterObject: sale.cashRegister,
      status: sale.status,
      createdAt: sale.createdAt,
      company: sale.company
    });

    // Se houver um CashRegister real, anexar a venda a ele e atualizar totais
    try {
      if (currentCashRegister && currentCashRegister._id) {
        console.log('Anexando venda ao CashRegister:', { registerId: currentCashRegister._id, saleId: sale._id, saleTotal: sale.total });
        const registerDoc = await CashRegister.findById(currentCashRegister._id);
        if (registerDoc) {
          registerDoc.sales = registerDoc.sales || [];
          registerDoc.sales.push(sale._id);
          registerDoc.totalSales = (registerDoc.totalSales || 0) + (sale.total || 0);
          registerDoc.salesCount = (registerDoc.salesCount || 0) + 1;
          await registerDoc.save();
          console.log('CashRegister atualizado:', { id: registerDoc._id, totalSales: registerDoc.totalSales, salesCount: registerDoc.salesCount, salesLength: registerDoc.sales.length });
        } else {
          console.warn('CashRegister não encontrado para anexar venda:', currentCashRegister._id);
        }
      } else {
        console.warn('Nenhum CashRegister identificado para anexar venda. currentCashRegister:', currentCashRegister);
      }
    } catch (updateErr) {
      console.error('Erro ao atualizar CashRegister com a venda:', updateErr);
    }

    for (const item of items) {
      try {
        const productDoc = await Product.findOne({
          company: req.company._id,
          $or: [ { _id: item.product }, { barcode: item.product } ]
        });
        if (!productDoc) {
          console.warn('Produto não encontrado ao tentar remover estoque:', item.product);
          continue;
        }
        console.log('Antes de remover estoque:', { productId: productDoc._id, quantityBefore: productDoc.quantity, remove: item.quantity });
        try {
          await productDoc.removeStock(item.quantity, `Venda: ${sale.saleNumber}`, req.user._id);
          const refreshed = await Product.findById(productDoc._id);
          console.log('Depois de remover estoque:', { productId: refreshed._id, quantityAfter: refreshed.quantity });
        } catch (remErr) {
          console.error('Erro ao remover estoque para produto:', { productId: item.product, err: remErr });
        }
      } catch (err) {
        console.error('Erro ao carregar produto para remover estoque:', { productId: item.product, err });
      }
    }

    if (customerData._id !== 'CONSUMIDOR') {
      try {
        await customerData.addPurchase(sale._id, sale.total);
      } catch (custErr) {
        console.error('Erro ao registrar compra no cliente:', custErr);
      }
    }
    const hasReceivable = payments.some(payment => 
      ['boleto', 'promissoria', 'parcelado'].includes(payment.method)
    );

    if (hasReceivable) {
      const receivablePayments = payments.filter(payment => 
        ['boleto', 'promissoria', 'parcelado'].includes(payment.method)
      );

      // Não criar contas a receber para cliente 'CONSUMIDOR' (sem cadastro)
      if (customerData._id === 'CONSUMIDOR') {
        console.error('Tentativa de criar Receivable para cliente CONSUMIDOR: rejeitado');
        return res.status(400).json({ message: 'Conta a receber requer cliente cadastrado' });
      }

      for (const payment of receivablePayments) {
        const due = payment.dueDate ? new Date(payment.dueDate) : new Date();
        const amount = Number(payment.amount) || 0;

        const receivable = new Receivable({
          sale: sale._id,
          saleNumber: sale.saleNumber,
          customer: customerData._id,
          customerName: customerData.name,
          paymentMethod: payment.method,
          originalAmount: amount,
          currentAmount: amount,
          dueDate: due,
          company: req.company._id
        });

        if (payment.method === 'parcelado' && payment.installments > 1) {
          const installmentAmount = amount / payment.installments;
          const installments = [];
          
          for (let i = 1; i <= payment.installments; i++) {
            const installmentDue = new Date();
            installmentDue.setMonth(installmentDue.getMonth() + i);
            
            installments.push({
              number: i,
              amount: installmentAmount,
              dueDate: installmentDue,
              status: 'pending'
            });
          }
          
          receivable.installments = installments;
        }

        await receivable.save();
      }
    }

    try {
      company.settings.cashRegister.currentAmount = (company.settings.cashRegister.currentAmount || 0) + (sale.total || 0);
      await company.save();
      console.log('Company cashRegister currentAmount atualizado:', { companyId: company._id, currentAmount: company.settings.cashRegister.currentAmount });
    } catch (companyErr) {
      console.error('Erro ao atualizar company.settings.cashRegister.currentAmount:', companyErr);
    }

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
    const CashRegister = require('../models/CashRegister');

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar caixa aberto do dia especificado
    const cashRegister = await CashRegister.findOne({
      company: req.company._id,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'open'
    });

    // Se não há caixa aberto, buscar vendas do último caixa fechado do dia
    let targetRegisterId = null;
    if (cashRegister) {
      targetRegisterId = cashRegister._id;
    } else {
      // Buscar último caixa fechado do dia
      const lastClosedRegister = await CashRegister.findOne({
        company: req.company._id,
        date: { $gte: startOfDay, $lt: endOfDay },
        status: 'closed'
      }).sort({ closeTime: -1 });
      
      if (lastClosedRegister) {
        targetRegisterId = lastClosedRegister._id;
      }
    }

    let sales = [];
    if (targetRegisterId) {
      // Buscar APENAS vendas do caixa específico
      sales = await Sale.find({
        company: req.company._id,
        'cashRegister.registerId': targetRegisterId,
        status: 'completed'
      }).populate('user', 'name');
      
      console.log('DEBUG - Relatório diário - Caixa:', targetRegisterId, 'Vendas:', sales.length);
    } else {
      console.log('DEBUG - Relatório diário - Nenhum caixa encontrado para a data:', date);
    }

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

// Relatório de vendas do caixa atual
router.get('/report/current-cash-register', auth, async (req, res) => {
  try {
    const CashRegister = require('../models/CashRegister');
    
    console.log('DEBUG - Buscando caixa aberto para empresa:', req.company._id);
    
    // Primeiro, tentar usar o caixa das configurações da empresa (mais específico)
    let currentCashRegister = null;
    
    if (req.company.settings && req.company.settings.cashRegister && req.company.settings.cashRegister._id) {
      console.log('DEBUG - Usando caixa das configurações da empresa:', req.company.settings.cashRegister._id);
      currentCashRegister = await CashRegister.findOne({
        _id: req.company.settings.cashRegister._id,
        company: req.company._id,
        status: 'open'
      });
    }
    
    // Se não encontrar, buscar o caixa aberto mais recente (fallback)
    if (!currentCashRegister) {
      console.log('DEBUG - Caixa das configurações não encontrado, buscando caixa aberto mais recente');
      currentCashRegister = await CashRegister.findOne({
        company: req.company._id,
        status: 'open'
      }).sort({ openTime: -1 });
    }
    
    console.log('DEBUG - Caixa encontrado:', currentCashRegister ? { id: currentCashRegister._id, status: currentCashRegister.status } : null);
    
    if (!currentCashRegister) {
      console.log('DEBUG - Nenhum caixa aberto encontrado');
      return res.json({
        cashRegisterId: null,
        sales: [],
        totalSales: 0,
        totalValue: 0
      });
    }
    
    // Buscar APENAS vendas vinculadas especificamente a este caixa pelo registerId
    // Sem fallbacks ou filtragem manual - isolamento total entre caixas
    const query = {
      company: req.company._id,
      'cashRegister.registerId': currentCashRegister._id,
      status: 'completed'
    };
    
    console.log('DEBUG - Query usada:', JSON.stringify(query, null, 2));
    
    const sales = await Sale.find(query)
      .populate('customer', 'name document')
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit')
      .sort({ createdAt: -1 });
    
    console.log('DEBUG - Vendas encontradas para este caixa:', sales.length);
    sales.forEach(sale => {
      console.log('DEBUG - Venda:', {
        id: sale._id,
        saleNumber: sale.saleNumber,
        createdAt: sale.createdAt,
        registerId: sale.cashRegister?.registerId,
        total: sale.total
      });
    });

    // Diagnóstico: verificar TODAS as vendas do dia para comparação
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const allTodaySales = await Sale.find({
      company: req.company._id,
      createdAt: { $gte: startOfToday, $lt: endOfToday },
      status: 'completed'
    });

    console.log('DEBUG - Todas as vendas do dia:', allTodaySales.length);
    allTodaySales.forEach(sale => {
      console.log('DEBUG - Venda do dia:', {
        id: sale._id,
        saleNumber: sale.saleNumber,
        createdAt: sale.createdAt,
        registerId: sale.cashRegister?.registerId,
        matchesQuery: sale.cashRegister?.registerId?.toString() === currentCashRegister._id.toString()
      });
    });
    
    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    res.json({
      cashRegisterId: currentCashRegister._id,
      cashRegisterOpenTime: currentCashRegister.openTime,
      sales,
      totalSales,
      totalValue
    });
  } catch (error) {
    console.error('Erro ao gerar relatório do caixa atual:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/report/period', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Data inicial e final são obrigatórias' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

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

// Endpoint para corrigir registerId de vendas antigas (uso administrativo)
router.post('/fix-register-ids', auth, async (req, res) => {
  try {
    console.log('🔧 Iniciando correção de registerIds...');
    console.log('📋 Empresa:', req.company._id);
    
    // Teste básico: contar vendas
    const totalSales = await Sale.countDocuments({ company: req.company._id });
    console.log(`📊 Total de vendas: ${totalSales}`);
    
    // Teste básico: buscar vendas sem registerId
    const salesWithoutRegisterId = await Sale.find({ 
      company: req.company._id,
      'cashRegister.registerId': { $exists: false }
    });
    
    console.log(`⚠️ Vendas sem registerId: ${salesWithoutRegisterId.length}`);
    
    // Teste básico: buscar vendas com registerId null
    const salesWithNullRegisterId = await Sale.find({ 
      company: req.company._id,
      'cashRegister.registerId': null
    });
    
    console.log(`⚠️ Vendas com registerId null: ${salesWithNullRegisterId.length}`);
    
    // Teste básico: buscar vendas com registerId vazio
    const salesWithEmptyRegisterId = await Sale.find({ 
      company: req.company._id,
      'cashRegister.registerId': ''
    });
    
    console.log(`⚠️ Vendas com registerId vazio: ${salesWithEmptyRegisterId.length}`);
    
    const totalProblematic = salesWithoutRegisterId.length + salesWithNullRegisterId.length + salesWithEmptyRegisterId.length;
    
    if (totalProblematic === 0) {
      console.log('✅ Nenhuma venda problemática encontrada');
      return res.json({
        message: 'Nenhuma venda precisava de correção.',
        totalSales: totalSales,
        totalProblematic: 0,
        fixed: 0
      });
    }
    
    // Se encontrou problemáticas, tentar corrigir
    let fixedCount = 0;
    
    // Processar vendas sem registerId
    for (const sale of salesWithoutRegisterId) {
      try {
        console.log(`🔄 Processando venda sem registerId: ${sale.saleNumber}`);
        
        // Atribuir um registerId fake temporário só para testar
        if (!sale.cashRegister) {
          sale.cashRegister = {};
        }
        sale.cashRegister.registerId = 'temp-' + sale._id.toString();
        await sale.save();
        fixedCount++;
        console.log(`✅ Venda ${sale.saleNumber} marcada como corrigida`);
      } catch (error) {
        console.error(`❌ Erro ao corrigir venda ${sale.saleNumber}:`, error.message);
      }
    }
    
    // Processar vendas com registerId null
    for (const sale of salesWithNullRegisterId) {
      try {
        console.log(`🔄 Processando venda com registerId null: ${sale.saleNumber}`);
        
        sale.cashRegister.registerId = 'temp-' + sale._id.toString();
        await sale.save();
        fixedCount++;
        console.log(`✅ Venda ${sale.saleNumber} marcada como corrigida`);
      } catch (error) {
        console.error(`❌ Erro ao corrigir venda ${sale.saleNumber}:`, error.message);
      }
    }
    
    // Processar vendas com registerId vazio
    for (const sale of salesWithEmptyRegisterId) {
      try {
        console.log(`🔄 Processando venda com registerId vazio: ${sale.saleNumber}`);
        
        sale.cashRegister.registerId = 'temp-' + sale._id.toString();
        await sale.save();
        fixedCount++;
        console.log(`✅ Venda ${sale.saleNumber} marcada como corrigida`);
      } catch (error) {
        console.error(`❌ Erro ao corrigir venda ${sale.saleNumber}:`, error.message);
      }
    }
    
    console.log(`🎉 Correção concluída: ${fixedCount} vendas corrigidas`);
    
    res.json({
      message: `Correção concluída. ${fixedCount} de ${totalProblematic} vendas processadas.`,
      totalSales: totalSales,
      totalProblematic: totalProblematic,
      fixed: fixedCount
    });
    
  } catch (error) {
    console.error('💥 Erro geral na correção:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Endpoint temporário para diagnóstico
router.get('/debug/cash-registers', auth, async (req, res) => {
  try {
    const CashRegister = require('../models/CashRegister');
    
    // Buscar todos os caixas da empresa
    const cashRegisters = await CashRegister.find({ company: req.company._id })
      .sort({ date: -1, openTime: -1 });
    
    // Buscar vendas por caixa
    const results = [];
    for (const cr of cashRegisters) {
      const sales = await Sale.find({
        company: req.company._id,
        'cashRegister.registerId': cr._id
      }).populate('user', 'name');
      
      results.push({
        cashRegister: {
          id: cr._id,
          date: cr.date,
          status: cr.status,
          openTime: cr.openTime,
          closeTime: cr.closeTime
        },
        salesCount: sales.length,
        sales: sales.map(s => ({
          id: s._id,
          saleNumber: s.saleNumber,
          createdAt: s.createdAt,
          user: s.user?.name,
          total: s.total
        }))
      });
    }
    
    // Buscar vendas sem registerId
    const orphanSales = await Sale.find({
      company: req.company._id,
      $or: [
        { 'cashRegister.registerId': { $exists: false } },
        { 'cashRegister.registerId': null }
      ]
    });
    
    res.json({
      company: req.company._id,
      cashRegisters: results,
      orphanSales: orphanSales.map(s => ({
        id: s._id,
        saleNumber: s.saleNumber,
        createdAt: s.createdAt,
        total: s.total
      }))
    });
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
