const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');
const { getDocumentType } = require('../utils/helpers');

const router = express.Router();

// Get all customers
router.get('/', auth, authorize('canManageCustomers'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, deleted = false } = req.query;
    
    const query = { 
      company: req.user.company,
      isDeleted: deleted === 'true'
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { document: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get customer by ID
router.get('/:id', auth, authorize('canManageCustomers'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Check if customer belongs to user's company
    if (customer.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para visualizar este cliente' });
    }

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Create customer
router.post('/', auth, authorize('canManageCustomers'), [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('document').notEmpty().withMessage('Documento é obrigatório'),
  body('address.street').notEmpty().withMessage('Rua é obrigatória'),
  body('address.neighborhood').notEmpty().withMessage('Bairro é obrigatório'),
  body('address.city').notEmpty().withMessage('Cidade é obrigatória'),
  body('address.state').notEmpty().withMessage('Estado é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, document, phone, email, address } = req.body;

    // Validate document
    const documentType = getDocumentType(document);
    if (!documentType) {
      return res.status(400).json({ message: 'Documento inválido' });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      document: document.replace(/[^\d]/g, ''),
      company: req.user.company
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Cliente já cadastrado com este documento' });
    }

    const customer = new Customer({
      name,
      document: document.replace(/[^\d]/g, ''),
      documentType,
      phone,
      email,
      address,
      company: req.user.company
    });

    await customer.save();

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update customer
router.put('/:id', auth, authorize('canManageCustomers'), [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('document').optional().notEmpty().withMessage('Documento não pode ser vazio'),
  body('address.street').optional().notEmpty().withMessage('Rua não pode ser vazia'),
  body('address.neighborhood').optional().notEmpty().withMessage('Bairro não pode ser vazio'),
  body('address.city').optional().notEmpty().withMessage('Cidade não pode ser vazia'),
  body('address.state').optional().notEmpty().withMessage('Estado não pode ser vazio')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, document, phone, email, address } = req.body;

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Check if customer belongs to user's company
    if (customer.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para editar este cliente' });
    }

    if (name) customer.name = name;
    if (document) {
      const documentType = getDocumentType(document);
      if (!documentType) {
        return res.status(400).json({ message: 'Documento inválido' });
      }
      customer.document = document.replace(/[^\d]/g, '');
      customer.documentType = documentType;
    }
    if (phone) customer.phone = phone;
    if (email) customer.email = email;
    if (address) customer.address = { ...customer.address, ...address };

    await customer.save();

    res.json({
      message: 'Cliente atualizado com sucesso',
      customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Soft delete customer
router.delete('/:id', auth, authorize('canManageCustomers'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Check if customer belongs to user's company
    if (customer.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para excluir este cliente' });
    }

    customer.isDeleted = true;
    customer.deletedAt = new Date();
    await customer.save();

    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Restore customer
router.put('/:id/restore', auth, authorize('canManageCustomers'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Check if customer belongs to user's company
    if (customer.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para restaurar este cliente' });
    }

    customer.isDeleted = false;
    customer.deletedAt = null;
    await customer.save();

    res.json({
      message: 'Cliente restaurado com sucesso',
      customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get deleted customers
router.get('/deleted/list', auth, authorize('canManageCustomers'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = { 
      company: req.user.company,
      isDeleted: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { document: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ deletedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
