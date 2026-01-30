const express = require('express');
const Customer = require('../models/Customer');
const { auth, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { validateCustomer } = require('../middleware/validation');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      documentType = '' 
    } = req.query;
    
    const query = { 
      company: req.company._id,
      isDeleted: false 
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { document: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (documentType) {
      query.documentType = documentType;
    }

    const customers = await Customer.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/trash', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const customers = await Customer.find({ 
      company: req.company._id,
      isDeleted: true 
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const total = await Customer.countDocuments({ 
      company: req.company._id,
      isDeleted: true 
    });

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao listar clientes na lixeira:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/', auth, validateCustomer, async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      company: req.company._id
    };

    const existingCustomer = await Customer.findOne({ 
      document: req.body.document,
      company: req.company._id,
      isDeleted: false 
    });
    
    if (existingCustomer) {
      return res.status(400).json({ message: 'CPF/CNPJ já cadastrado' });
    }

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json(customer);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'CPF/CNPJ já cadastrado' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id', auth, validateCustomer, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id,
      company: req.company._id 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    if (req.body.document && req.body.document !== customer.document) {
      const existingCustomer = await Customer.findOne({ 
        document: req.body.document,
        company: req.company._id,
        _id: { $ne: req.params.id },
        isDeleted: false 
      });
      
      if (existingCustomer) {
        return res.status(400).json({ message: 'CPF/CNPJ já cadastrado' });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'CPF/CNPJ já cadastrado' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/:id/restore', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { 
        _id: req.params.id,
        company: req.company._id,
        isDeleted: true 
      },
      { isDeleted: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado na lixeira' });
    }

    res.json({ message: 'Cliente restaurado com sucesso', customer });
  } catch (error) {
    console.error('Erro ao restaurar cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/:id', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { 
        _id: req.params.id,
        company: req.company._id 
      },
      { isDeleted: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.json({ message: 'Cliente movido para a lixeira' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/:id/permanent', auth, authorize('administrador'), async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ 
      _id: req.params.id,
      company: req.company._id,
      isDeleted: true 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado na lixeira' });
    }

    res.json({ message: 'Cliente excluído permanentemente' });
  } catch (error) {
    console.error('Erro ao excluir cliente permanentemente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/document/:document', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      document: req.params.document,
      company: req.company._id,
      isDeleted: false 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Erro ao buscar cliente por documento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
