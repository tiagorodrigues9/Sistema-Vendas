const express = require('express');
const Brand = require('../models/Brand');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Listar marcas
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = { 
      company: req.company._id,
      isDeleted: false 
    };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const brands = await Brand.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Brand.countDocuments(query);

    res.json({
      brands,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar marcas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar marca por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const brand = await Brand.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!brand) {
      return res.status(404).json({ message: 'Marca não encontrada' });
    }

    res.json(brand);
  } catch (error) {
    console.error('Erro ao obter marca:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar marca
router.post('/', auth, async (req, res) => {
  try {
    const brandData = {
      ...req.body,
      company: req.company._id
    };

    // Verificar se já existe marca com mesmo nome
    const existingBrand = await Brand.findOne({ 
      name: req.body.name,
      company: req.company._id,
      isDeleted: false 
    });
    
    if (existingBrand) {
      return res.status(400).json({ message: 'Marca já cadastrada' });
    }

    const brand = new Brand(brandData);
    await brand.save();

    res.status(201).json(brand);
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Marca já cadastrada' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar marca
router.put('/:id', auth, async (req, res) => {
  try {
    const brand = await Brand.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!brand) {
      return res.status(404).json({ message: 'Marca não encontrada' });
    }

    // Verificar se já existe outra marca com mesmo nome
    if (req.body.name && req.body.name !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        name: req.body.name,
        company: req.company._id,
        _id: { $ne: req.params.id },
        isDeleted: false 
      });
      
      if (existingBrand) {
        return res.status(400).json({ message: 'Marca já cadastrada' });
      }
    }

    Object.assign(brand, req.body);
    await brand.save();

    res.json(brand);
  } catch (error) {
    console.error('Erro ao atualizar marca:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Marca já cadastrada' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir marca (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const brand = await Brand.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!brand) {
      return res.status(404).json({ message: 'Marca não encontrada' });
    }

    brand.isDeleted = true;
    brand.deletedAt = new Date();
    brand.isActive = false;
    await brand.save();

    res.json({ message: 'Marca excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir marca:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
