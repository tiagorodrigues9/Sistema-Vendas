const express = require('express');
const Entry = require('../models/Entry');
const Product = require('../models/Product');
const { auth, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { validateEntry } = require('../middleware/validation');
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
        { entryNumber: { $regex: search, $options: 'i' } },
        { fiscalDocument: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } }
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

    const entries = await Entry.find(query)
      .populate('user', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Entry.countDocuments(query);

    res.json({
      entries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar entradas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    })
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit');

    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Erro ao obter entrada:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/', auth, authorizeOwnerOrAdmin, validateEntry, async (req, res) => {
  try {
    console.log('Dados recebidos no backend:', req.body);
    console.log('Usuário:', req.user);
    console.log('Empresa:', req.company);
    
    const { fiscalDocument, supplier, invoiceValue, items, notes, entryNumber } = req.body;

    console.log('Validando itens...');
    for (const item of items) {
      console.log('Processando item:', item);
      const product = await Product.findOne({ 
        _id: item.product,
        company: req.company._id 
      });
      
      if (!product) {
        console.log('Produto não encontrado:', item.product);
        return res.status(404).json({ message: `Produto não encontrado: ${item.product}` });
      }
      
      item.productDescription = product.description;
      item.total = item.unitCost * item.quantity;
      console.log('Item processado:', item);
    }

    const entryData = {
      entryNumber, // Adicionando entryNumber
      fiscalDocument,
      supplier,
      invoiceValue,
      items,
      company: req.company._id,
      user: req.user._id,
      notes
    };

    console.log('Dados da entrada:', entryData);

    const entry = new Entry(entryData);
    console.log('Instância criada:', entry);
    console.log('Itens da entrada:', entry.items);
    console.log('Valores dos itens:', entry.items.map(item => ({
      description: item.productDescription,
      quantity: item.quantity,
      unitCost: item.unitCost,
      total: item.total,
      totalValue: item.totalValue
    })));
    
    entry.calculateTotal(); // Chamar o método na instância
    console.log('Total calculado:', entry.totalItems);
    
    await entry.save();
    console.log('Entrada salva com sucesso');

    const populatedEntry = await Entry.findById(entry._id)
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit');

    res.status(201).json(populatedEntry);
  } catch (error) {
    console.error('Erro ao criar entrada:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

router.put('/:id/complete', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    console.log('Recebida requisição para concluir entrada:', req.params.id);
    
    const entry = await Entry.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!entry) {
      console.log('Entrada não encontrada');
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    if (entry.status !== 'pending') {
      console.log('Entrada já foi processada, status atual:', entry.status);
      return res.status(400).json({ message: 'Entrada já foi processada' });
    }

    console.log('Status antes:', entry.status);
    await entry.complete();
    console.log('Status depois:', entry.status);

    res.json({ message: 'Entrada concluída com sucesso', entry });
  } catch (error) {
    console.error('Erro ao concluir entrada:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/cancel', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const entry = await Entry.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    if (entry.status === 'cancelled') {
      return res.status(400).json({ message: 'Entrada já está cancelada' });
    }

    if (entry.status === 'completed') {
      return res.status(400).json({ 
        message: 'Não é possível cancelar uma entrada já concluída' 
      });
    }

    await entry.cancel(req.user._id, reason);

    res.json({ message: 'Entrada cancelada com sucesso', entry });
  } catch (error) {
    console.error('Erro ao cancelar entrada:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { fiscalDocument, supplier, invoiceValue, items, notes } = req.body;
    
    const entry = await Entry.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Apenas entradas pendentes podem ser alteradas' 
      });
    }

    for (const item of items) {
      const product = await Product.findOne({ 
        _id: item.product,
        company: req.company._id 
      });
      
      if (!product) {
        return res.status(404).json({ message: `Produto não encontrado: ${item.product}` });
      }
      
      item.productDescription = product.description;
      item.total = item.unitCost * item.quantity;
    }

    const updateData = {
      fiscalDocument,
      supplier,
      invoiceValue,
      items,
      notes
    };

    updateData.calculateTotal();

    const updatedEntry = await Entry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit');

    res.json(updatedEntry);
  } catch (error) {
    console.error('Erro ao atualizar entrada:', error);
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

    const entries = await Entry.find({
      company: req.company._id,
      createdAt: { $gte: start, $lte: end }
    }).populate('user', 'name');

    const totalEntries = entries.length;
    const totalValue = entries.reduce((sum, entry) => sum + entry.totalItems, 0);

    const supplierStats = {};
    entries.forEach(entry => {
      if (!supplierStats[entry.supplier.name]) {
        supplierStats[entry.supplier.name] = { count: 0, total: 0 };
      }
      supplierStats[entry.supplier.name].count++;
      supplierStats[entry.supplier.name].total += entry.invoiceValue;
    });

    const topProducts = {};
    entries.forEach(entry => {
      entry.items.forEach(item => {
        if (!topProducts[item.productDescription]) {
          topProducts[item.productDescription] = { quantity: 0, total: 0 };
        }
        topProducts[item.productDescription].quantity += item.quantity;
        topProducts[item.productDescription].total += item.total;
      });
    });

    res.json({
      period: { startDate, endDate },
      totalEntries,
      totalValue,
      supplierStats,
      topProducts,
      entries
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de entradas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/:id', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const entry = await Entry.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ message: 'Apenas entradas pendentes podem ser excluídas' });
    }

    await Entry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Entrada excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir entrada:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
