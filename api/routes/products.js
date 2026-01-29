const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, deleted = false, group } = req.query;
    
    const query = { 
      company: req.user.company,
      isDeleted: deleted === 'true'
    };

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (group) {
      query.group = group;
    }

    const products = await Product.find(query)
      .sort({ description: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if product belongs to user's company
    if (product.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para visualizar este produto' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Create product
router.post('/', auth, authorize('canManageProducts'), [
  body('description').notEmpty().withMessage('Descrição é obrigatória'),
  body('quantity').isNumeric().withMessage('Quantidade deve ser um número'),
  body('unit').isIn(['UND', 'KG', 'PCT']).withMessage('Unidade inválida'),
  body('costPrice').isNumeric().withMessage('Preço de custo deve ser um número'),
  body('salePrice').isNumeric().withMessage('Preço de venda deve ser um número'),
  body('group').notEmpty().withMessage('Grupo é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      barcode,
      description,
      brand,
      group,
      subgroup,
      quantity,
      unit,
      costPrice,
      salePrice,
      minQuantity,
      maxQuantity
    } = req.body;

    // Check if barcode already exists
    if (barcode) {
      const existingProduct = await Product.findOne({
        barcode,
        company: req.user.company,
        isDeleted: false
      });

      if (existingProduct) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }
    }

    const product = new Product({
      barcode,
      description,
      brand,
      group,
      subgroup,
      quantity,
      unit,
      costPrice,
      salePrice,
      minQuantity,
      maxQuantity,
      company: req.user.company
    });

    await product.save();

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update product
router.put('/:id', auth, authorize('canManageProducts'), [
  body('description').optional().notEmpty().withMessage('Descrição não pode ser vazia'),
  body('quantity').optional().isNumeric().withMessage('Quantidade deve ser um número'),
  body('unit').optional().isIn(['UND', 'KG', 'PCT']).withMessage('Unidade inválida'),
  body('costPrice').optional().isNumeric().withMessage('Preço de custo deve ser um número'),
  body('salePrice').optional().isNumeric().withMessage('Preço de venda deve ser um número'),
  body('group').optional().notEmpty().withMessage('Grupo não pode ser vazio')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      barcode,
      description,
      brand,
      group,
      subgroup,
      quantity,
      unit,
      costPrice,
      salePrice,
      minQuantity,
      maxQuantity
    } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if product belongs to user's company
    if (product.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para editar este produto' });
    }

    // Check if barcode already exists (if changing)
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await Product.findOne({
        barcode,
        company: req.user.company,
        isDeleted: false,
        _id: { $ne: req.params.id }
      });

      if (existingProduct) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }
    }

    if (barcode !== undefined) product.barcode = barcode;
    if (description) product.description = description;
    if (brand !== undefined) product.brand = brand;
    if (group) product.group = group;
    if (subgroup !== undefined) product.subgroup = subgroup;
    if (quantity !== undefined) product.quantity = quantity;
    if (unit) product.unit = unit;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (salePrice !== undefined) product.salePrice = salePrice;
    if (minQuantity !== undefined) product.minQuantity = minQuantity;
    if (maxQuantity !== undefined) product.maxQuantity = maxQuantity;

    await product.save();

    res.json({
      message: 'Produto atualizado com sucesso',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Add stock to product
router.put('/:id/add-stock', auth, authorize('canManageProducts'), [
  body('quantity').isNumeric().withMessage('Quantidade deve ser um número'),
  body('justification').notEmpty().withMessage('Justificativa é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity, justification } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if product belongs to user's company
    if (product.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para adicionar estoque a este produto' });
    }

    product.quantity += quantity;
    product.totalEntries += quantity;
    await product.save();

    res.json({
      message: 'Estoque adicionado com sucesso',
      product,
      addedQuantity: quantity,
      justification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Remove stock from product
router.put('/:id/remove-stock', auth, authorize('canManageProducts'), [
  body('quantity').isNumeric().withMessage('Quantidade deve ser um número'),
  body('justification').notEmpty().withMessage('Justificativa é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity, justification } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if product belongs to user's company
    if (product.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para remover estoque deste produto' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Estoque insuficiente' });
    }

    product.quantity -= quantity;
    await product.save();

    res.json({
      message: 'Estoque removido com sucesso',
      product,
      removedQuantity: quantity,
      justification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Soft delete product
router.delete('/:id', auth, authorize('canManageProducts'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if product belongs to user's company
    if (product.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para excluir este produto' });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Restore product
router.put('/:id/restore', auth, authorize('canManageProducts'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if product belongs to user's company
    if (product.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para restaurar este produto' });
    }

    product.isDeleted = false;
    product.deletedAt = null;
    await product.save();

    res.json({
      message: 'Produto restaurado com sucesso',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get deleted products
router.get('/deleted/list', auth, authorize('canManageProducts'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = { 
      company: req.user.company,
      isDeleted: true
    };

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ deletedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get product groups
router.get('/groups/list', auth, async (req, res) => {
  try {
    const groups = await Product.distinct('group', {
      company: req.user.company,
      isDeleted: false
    });

    res.json(groups.sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
