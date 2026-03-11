const express = require('express');
const Supplier = require('../models/Supplier');
const { auth, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { validateSupplier } = require('../middleware/validation');
const router = express.Router();

// Listar fornecedores
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = { 
      company: req.company._id,
      isDeleted: false 
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cnpj: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Supplier.countDocuments(query);

    res.json({
      suppliers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar fornecedor por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar fornecedor
router.post('/', auth, authorizeOwnerOrAdmin, validateSupplier, async (req, res) => {
  try {
    const supplierData = {
      ...req.body,
      company: req.company._id
    };

    const supplier = new Supplier(supplierData);
    await supplier.save();

    res.status(201).json({
      message: 'Fornecedor criado com sucesso',
      supplier
    });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'CNPJ já cadastrado' });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar fornecedor
router.put('/:id', auth, authorizeOwnerOrAdmin, validateSupplier, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    const supplierData = {
      ...req.body,
      company: req.company._id
    };

    // Remove campos que não devem ser alterados
    delete supplierData._id;
    delete supplierData.createdAt;
    delete supplierData.updatedAt;

    Object.assign(supplier, supplierData);
    await supplier.save();

    res.json({
      message: 'Fornecedor atualizado com sucesso',
      supplier
    });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'CNPJ já cadastrado' });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir fornecedor (soft delete)
router.delete('/:id', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    await supplier.softDelete();

    res.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Restaurar fornecedor
router.put('/:id/restore', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: true
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Fornecedor não encontrado na lixeira' });
    }

    await supplier.restore();

    res.json({ message: 'Fornecedor restaurado com sucesso' });
  } catch (error) {
    console.error('Erro ao restaurar fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
