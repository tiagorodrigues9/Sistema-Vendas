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
    const { fiscalDocument, supplier, invoiceValue, items, notes } = req.body;

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

    const entryData = {
      fiscalDocument,
      supplier,
      invoiceValue,
      items,
      company: req.company._id,
      user: req.user._id,
      notes
    };

    entryData.calculateTotal();

    const entry = new Entry(entryData);
    await entry.save();

    const populatedEntry = await Entry.findById(entry._id)
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit');

    res.status(201).json(populatedEntry);
  } catch (error) {
    console.error('Erro ao criar entrada:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/complete', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const entry = await Entry.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ message: 'Entrada já foi processada' });
    }

    await entry.complete();

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

module.exports = router;
