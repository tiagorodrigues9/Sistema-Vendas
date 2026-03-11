const express = require('express');
const ProductSubgroup = require('../models/ProductSubgroup');
const ProductGroup = require('../models/ProductGroup');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Listar subgrupos
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', group: groupId } = req.query;
    
    const query = { 
      company: req.company._id,
      isDeleted: false 
    };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (groupId) {
      query.group = groupId;
    }

    const subgroups = await ProductSubgroup.find(query)
      .populate('group', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await ProductSubgroup.countDocuments(query);

    res.json({
      subgroups,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar subgrupos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar subgrupos por grupo
router.get('/by-group/:groupId', auth, async (req, res) => {
  try {
    const subgroups = await ProductSubgroup.find({ 
      group: req.params.groupId,
      company: req.company._id,
      isDeleted: false 
    }).sort({ name: 1 });

    res.json(subgroups);
  } catch (error) {
    console.error('Erro ao listar subgrupos por grupo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar subgrupo por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const subgroup = await ProductSubgroup.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    }).populate('group', 'name');

    if (!subgroup) {
      return res.status(404).json({ message: 'Subgrupo não encontrado' });
    }

    res.json(subgroup);
  } catch (error) {
    console.error('Erro ao obter subgrupo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar subgrupo
router.post('/', auth, async (req, res) => {
  try {
    const subgroupData = {
      ...req.body,
      company: req.company._id
    };

    // Verificar se o grupo existe
    const group = await ProductGroup.findOne({ 
      _id: req.body.group,
      company: req.company._id,
      isDeleted: false 
    });
    
    if (!group) {
      return res.status(400).json({ message: 'Grupo não encontrado' });
    }

    // Verificar se já existe subgrupo com mesmo nome no mesmo grupo
    const existingSubgroup = await ProductSubgroup.findOne({ 
      name: req.body.name,
      group: req.body.group,
      company: req.company._id,
      isDeleted: false 
    });
    
    if (existingSubgroup) {
      return res.status(400).json({ message: 'Subgrupo já cadastrado neste grupo' });
    }

    const subgroup = new ProductSubgroup(subgroupData);
    await subgroup.save();

    const savedSubgroup = await ProductSubgroup.findById(subgroup._id).populate('group', 'name');
    res.status(201).json(savedSubgroup);
  } catch (error) {
    console.error('Erro ao criar subgrupo:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subgrupo já cadastrado neste grupo' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar subgrupo
router.put('/:id', auth, async (req, res) => {
  try {
    const subgroup = await ProductSubgroup.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!subgroup) {
      return res.status(404).json({ message: 'Subgrupo não encontrado' });
    }

    // Verificar se o grupo existe (se foi alterado)
    if (req.body.group) {
      const group = await ProductGroup.findOne({ 
        _id: req.body.group,
        company: req.company._id,
        isDeleted: false 
      });
      
      if (!group) {
        return res.status(400).json({ message: 'Grupo não encontrado' });
      }
    }

    // Verificar se já existe outro subgrupo com mesmo nome no mesmo grupo
    if (req.body.name && req.body.name !== subgroup.name) {
      const existingSubgroup = await ProductSubgroup.findOne({ 
        name: req.body.name,
        group: req.body.group || subgroup.group,
        company: req.company._id,
        _id: { $ne: req.params.id },
        isDeleted: false 
      });
      
      if (existingSubgroup) {
        return res.status(400).json({ message: 'Subgrupo já cadastrado neste grupo' });
      }
    }

    Object.assign(subgroup, req.body);
    await subgroup.save();

    const updatedSubgroup = await ProductSubgroup.findById(subgroup._id).populate('group', 'name');
    res.json(updatedSubgroup);
  } catch (error) {
    console.error('Erro ao atualizar subgrupo:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subgrupo já cadastrado neste grupo' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir subgrupo (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const subgroup = await ProductSubgroup.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: false 
    });

    if (!subgroup) {
      return res.status(404).json({ message: 'Subgrupo não encontrado' });
    }

    subgroup.isDeleted = true;
    subgroup.deletedAt = new Date();
    subgroup.isActive = false;
    await subgroup.save();

    res.json({ message: 'Subgrupo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir subgrupo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
