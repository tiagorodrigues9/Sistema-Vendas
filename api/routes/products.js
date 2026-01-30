const express = require('express');
const Product = require('../models/Product');
const { auth, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      group = '', 
      lowStock = false 
    } = req.query;
    
    const query = { 
      company: req.company._id,
      isDeleted: false 
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
    
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$minStock'] };
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ description: 1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/barcode/:barcode', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      barcode: req.params.barcode,
      company: req.company._id,
      isDeleted: false 
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto por código de barras:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/groups', auth, async (req, res) => {
  try {
    const groups = await Product.distinct('group', { 
      company: req.company._id,
      isDeleted: false 
    });

    res.json(groups);
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/trash', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const products = await Product.find({ 
      company: req.company._id,
      isDeleted: true 
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const total = await Product.countDocuments({ 
      company: req.company._id,
      isDeleted: true 
    });

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar produtos na lixeira:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/', auth, authorizeOwnerOrAdmin, validateProduct, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      company: req.company._id
    };

    if (req.body.barcode) {
      const existingProduct = await Product.findOne({ 
        barcode: req.body.barcode,
        company: req.company._id 
      });
      
      if (existingProduct) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Código de barras já cadastrado' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id', auth, authorizeOwnerOrAdmin, validateProduct, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    if (req.body.barcode && req.body.barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ 
        barcode: req.body.barcode,
        company: req.company._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingProduct) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Código de barras já cadastrado' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/stock', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    
    const product = await Product.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    await product.addStock(quantity, reason, req.user._id);

    res.json({ message: 'Estoque adicionado com sucesso', product });
  } catch (error) {
    console.error('Erro ao adicionar estoque:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/adjust-stock', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { newQuantity, reason } = req.body;
    
    const product = await Product.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    await product.adjustStock(newQuantity, reason, req.user._id);

    res.json({ message: 'Estoque ajustado com sucesso', product });
  } catch (error) {
    console.error('Erro ao ajustar estoque:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/restore', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { 
        _id: req.params.id,
        company: req.company._id,
        isDeleted: true 
      },
      { isDeleted: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado na lixeira' });
    }

    res.json({ message: 'Produto restaurado com sucesso', product });
  } catch (error) {
    console.error('Erro ao restaurar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/:id', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { 
        _id: req.params.id,
        company: req.company._id 
      },
      { isDeleted: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto movido para a lixeira' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/:id/permanent', auth, authorize('administrador'), async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: true 
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado na lixeira' });
    }

    res.json({ message: 'Produto excluído permanentemente' });
  } catch (error) {
    console.error('Erro ao excluir produto permanentemente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
