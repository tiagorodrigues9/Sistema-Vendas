const express = require('express');
const Company = require('../models/Company');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, authorize('administrador'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isApproved = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { cnpj: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (isApproved !== '') {
      query.isApproved = isApproved === 'true';
    }

    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/pending', auth, authorize('administrador'), async (req, res) => {
  try {
    const companies = await Company.find({ isApproved: false })
      .sort({ createdAt: -1 });

    res.json(companies);
  } catch (error) {
    console.error('Erro ao listar empresas pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (req.user.role !== 'administrador' && company._id.toString() !== req.company._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(company);
  } catch (error) {
    console.error('Erro ao obter empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { companyName, ownerName, phone, address, settings } = req.body;
    
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (req.user.role !== 'administrador' && company._id.toString() !== req.company._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const updateData = { companyName, ownerName, phone, address };
    if (settings) {
      updateData.settings = { ...company.settings, ...settings };
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedCompany);
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/approve', auth, authorize('administrador'), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    await User.updateMany(
      { company: company._id },
      { isApproved: true }
    );

    res.json({ message: 'Empresa aprovada com sucesso', company });
  } catch (error) {
    console.error('Erro ao aprovar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/deactivate', auth, authorize('administrador'), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    await User.updateMany(
      { company: company._id },
      { isActive: false }
    );

    res.json({ message: 'Empresa desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/:id', auth, authorize('administrador'), async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    await User.deleteMany({ company: req.params.id });

    res.json({ message: 'Empresa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/cash-register/open', auth, async (req, res) => {
  try {
    const { initialAmount } = req.body;
    
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (company.settings.cashRegister.isOpen) {
      return res.status(400).json({ message: 'Caixa já está aberto' });
    }

    company.settings.cashRegister = {
      isOpen: true,
      openingTime: new Date(),
      initialAmount: initialAmount || 0,
      currentAmount: initialAmount || 0
    };

    await company.save();

    res.json({ message: 'Caixa aberto com sucesso', cashRegister: company.settings.cashRegister });
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/cash-register/close', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (!company.settings.cashRegister.isOpen) {
      return res.status(400).json({ message: 'Caixa já está fechado' });
    }

    company.settings.cashRegister = {
      isOpen: false,
      closingTime: new Date(),
      initialAmount: 0,
      currentAmount: 0
    };

    await company.save();

    res.json({ message: 'Caixa fechado com sucesso', cashRegister: company.settings.cashRegister });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/cash-register/adjust', auth, async (req, res) => {
  try {
    const { amount, operation } = req.body;
    
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (!company.settings.cashRegister.isOpen) {
      return res.status(400).json({ message: 'Caixa está fechado' });
    }

    if (operation === 'add') {
      company.settings.cashRegister.currentAmount += amount;
    } else if (operation === 'remove') {
      if (company.settings.cashRegister.currentAmount >= amount) {
        company.settings.cashRegister.currentAmount -= amount;
      } else {
        return res.status(400).json({ message: 'Saldo insuficiente' });
      }
    }

    await company.save();

    res.json({ 
      message: `Saldo do caixa ${operation === 'add' ? 'adicionado' : 'removido'} com sucesso`,
      cashRegister: company.settings.cashRegister 
    });
  } catch (error) {
    console.error('Erro ao ajustar caixa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
