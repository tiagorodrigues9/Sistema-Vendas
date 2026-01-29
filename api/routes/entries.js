const express = require('express');
const { body, validationResult } = require('express-validator');
const Entry = require('../models/Entry');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');
const { generateEntryNumber } = require('../utils/helpers');

const router = express.Router();

// Get all entries
router.get('/', auth, authorize('canManageEntries'), async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    
    const query = { company: req.user.company };

    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (status) {
      query.status = status;
    }

    const entries = await Entry.find(query)
      .populate('user', 'name')
      .sort({ entryDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Entry.countDocuments(query);

    res.json({
      entries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Create entry
router.post('/', auth, authorize('canManageEntries'), [
  body('nfNumber').notEmpty().withMessage('Número da NF é obrigatório'),
  body('supplier.name').notEmpty().withMessage('Nome do fornecedor é obrigatório'),
  body('nfValue').isNumeric().withMessage('Valor da NF deve ser um número'),
  body('items').isArray({ min: 1 }).withMessage('Itens são obrigatórios')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nfNumber, supplier, nfValue, items, observations } = req.body;

    // Validate items and calculate total
    let totalCost = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `Produto ${item.product} não encontrado` });
      }

      if (product.company.toString() !== req.user.company.toString()) {
        return res.status(403).json({ message: `Produto não pertence à sua empresa` });
      }

      const itemTotal = item.unitCost * item.quantity;
      totalCost += itemTotal;

      validatedItems.push({
        product: product._id,
        description: product.description,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: itemTotal,
        justification: item.justification
      });

      // Update product stock
      product.quantity += item.quantity;
      product.totalEntries += item.quantity;
      await product.save();
    }

    const entry = new Entry({
      entryNumber: generateEntryNumber(),
      company: req.user.company,
      user: req.user._id,
      userName: req.user.name,
      nfNumber,
      supplier,
      nfValue,
      items: validatedItems,
      totalCost,
      observations
    });

    await entry.save();

    res.status(201).json({
      message: 'Entrada realizada com sucesso',
      entry
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update entry
router.put('/:id', auth, authorize('canManageEntries'), async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    if (entry.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para editar esta entrada' });
    }

    const { nfNumber, supplier, nfValue, observations, status } = req.body;

    if (nfNumber) entry.nfNumber = nfNumber;
    if (supplier) entry.supplier = { ...entry.supplier, ...supplier };
    if (nfValue) entry.nfValue = nfValue;
    if (observations) entry.observations = observations;
    if (status) entry.status = status;

    await entry.save();

    res.json({
      message: 'Entrada atualizada com sucesso',
      entry
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Delete entry
router.delete('/:id', auth, authorize('canManageEntries'), async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada' });
    }

    if (entry.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para excluir esta entrada' });
    }

    // Restore product stock
    for (const item of entry.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity -= item.quantity;
        product.totalEntries -= item.quantity;
        await product.save();
      }
    }

    await Entry.findByIdAndDelete(req.params.id);

    res.json({ message: 'Entrada excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
