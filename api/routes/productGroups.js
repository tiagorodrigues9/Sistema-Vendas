const express = require('express');
const ProductGroup = require('../models/ProductGroup');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Listar grupos
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

    const groups = await ProductGroup.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await ProductGroup.countDocuments(query);

    res.json({
      groups,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar grupo por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await ProductGroup.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!group) {
      return res.status(404).json({ message: 'Grupo não encontrado' });
    }

    res.json(group);
  } catch (error) {
    console.error('Erro ao obter grupo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar grupo
router.post('/', auth, async (req, res) => {
  try {
    const groupData = {
      ...req.body,
      company: req.company._id
    };

    // Verificar se já existe grupo com mesmo nome
    const existingGroup = await ProductGroup.findOne({ 
      name: req.body.name,
      company: req.company._id,
      isDeleted: false 
    });
    
    if (existingGroup) {
      return res.status(400).json({ message: 'Grupo já cadastrado' });
    }

    const group = new ProductGroup(groupData);
    await group.save();

    res.status(201).json(group);
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Grupo já cadastrado' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar grupo
router.put('/:id', auth, async (req, res) => {
  try {
    const group = await ProductGroup.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!group) {
      return res.status(404).json({ message: 'Grupo não encontrado' });
    }

    // Verificar se já existe outro grupo com mesmo nome
    if (req.body.name && req.body.name !== group.name) {
      const existingGroup = await ProductGroup.findOne({ 
        name: req.body.name,
        company: req.company._id,
        _id: { $ne: req.params.id },
        isDeleted: false 
      });
      
      if (existingGroup) {
        return res.status(400).json({ message: 'Grupo já cadastrado' });
      }
    }

    Object.assign(group, req.body);
    await group.save();

    res.json(group);
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Grupo já cadastrado' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir grupo (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await ProductGroup.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!group) {
      return res.status(404).json({ message: 'Grupo não encontrado' });
    }

    group.isDeleted = true;
    group.deletedAt = new Date();
    group.isActive = false;
    await group.save();

    res.json({ message: 'Grupo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir grupo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
