const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all companies (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Get company by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Check if user has permission to view this company
    if (req.user.role !== 'admin' && company._id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para visualizar esta empresa' });
    }

    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Approve company (admin only)
router.put('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    company.status = 'approved';
    await company.save();

    res.json({
      message: 'Empresa aprovada com sucesso',
      company
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Reject company (admin only)
router.put('/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    company.status = 'rejected';
    await company.save();

    res.json({
      message: 'Empresa rejeitada com sucesso',
      company
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Update company
router.put('/:id', auth, [
  body('companyName').optional().notEmpty().withMessage('Nome da empresa não pode ser vazio'),
  body('ownerName').optional().notEmpty().withMessage('Nome do proprietário não pode ser vazio'),
  body('email').optional().isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyName, ownerName, email, phone, address, subscriptionPlan } = req.body;

    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Check if user has permission to edit this company
    if (req.user.role !== 'admin' && company._id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Sem permissão para editar esta empresa' });
    }

    if (companyName) company.companyName = companyName;
    if (ownerName) company.ownerName = ownerName;
    if (email) company.email = email;
    if (phone) company.phone = phone;
    if (address) company.address = { ...company.address, ...address };
    if (subscriptionPlan) company.subscriptionPlan = subscriptionPlan;

    await company.save();

    res.json({
      message: 'Empresa atualizada com sucesso',
      company
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Deactivate company (admin only)
router.put('/:id/deactivate', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    company.status = 'inactive';
    await company.save();

    res.json({
      message: 'Empresa desativada com sucesso',
      company
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Delete company (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({ message: 'Empresa excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
