const express = require('express');
const Company = require('../models/Company');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { exec } = require('child_process');
const router = express.Router();

// Buscar empresa por CNPJ (pública para registro)
router.get('/cnpj/:cnpj', async (req, res) => {
  try {
    const { cnpj } = req.params;
    const cleanedCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanedCnpj.length !== 14) {
      return res.status(400).json({ message: 'CNPJ inválido' });
    }
    
    const company = await Company.findOne({ cnpj: cleanedCnpj });
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    
    res.json({
      _id: company._id,
      companyName: company.companyName,
      cnpj: company.cnpj,
      email: company.email,
      ownerName: company.ownerName
    });
  } catch (error) {
    console.error('Erro ao buscar empresa por CNPJ:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

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

// Buscar impressoras disponíveis no Windows
router.get('/printers', auth, async (req, res) => {
  try {
    console.log('Buscando impressoras disponíveis...');
    
    // Método 1: Usar WMIC (Windows Management Instrumentation)
    const getPrintersViaWMIC = () => {
      return new Promise((resolve, reject) => {
        exec('wmic printer get name /format:list', (error, stdout, stderr) => {
          if (error) {
            // WMIC pode não estar disponível, isso é normal
            console.log('WMIC não disponível, tentando próximo método...');
            reject(new Error('WMIC não disponível'));
            return;
          }
          
          if (stderr) {
            console.log('WMIC stderr:', stderr);
          }
          
          // Processar a saída do WMIC
          const lines = stdout.split('\n');
          const printers = [];
          
          lines.forEach(line => {
            if (line.startsWith('Name=')) {
              const printerName = line.substring(5).trim();
              if (printerName && !printerName.includes('Microsoft Print to PDF')) {
                printers.push({
                  name: printerName,
                  id: printerName.replace(/[^a-zA-Z0-9]/g, '_'),
                  isDefault: false
                });
              }
            }
          });
          
          resolve(printers);
        });
      });
    };
    
    // Método 2: Usar PowerShell
    const getPrintersViaPowerShell = () => {
      return new Promise((resolve, reject) => {
        const psCommand = 'Get-Printer | Select-Object Name, DriverName, Type | ConvertTo-Json';
        exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
          if (error) {
            console.log('PowerShell não disponível, tentando próximo método...');
            reject(new Error('PowerShell não disponível'));
            return;
          }
          
          try {
            const printersData = JSON.parse(stdout);
            const printers = printersData.map(printer => ({
              name: printer.Name,
              id: printer.Name.replace(/[^a-zA-Z0-9]/g, '_'),
              driver: printer.DriverName,
              type: printer.Type,
              isDefault: printer.Type === 'Local'
            }));
            resolve(printers);
          } catch (parseError) {
            console.log('Erro ao parsear PowerShell, tentando próximo método...');
            reject(parseError);
          }
        });
      });
    };
    
    // Método 3: Usar comando 'printer' do Windows
    const getPrintersViaCmd = () => {
      return new Promise((resolve, reject) => {
        exec('wmic path win32_printer get name, default /format:csv', (error, stdout, stderr) => {
          if (error) {
            console.log('CMD não disponível, usando fallback...');
            reject(new Error('CMD não disponível'));
            return;
          }
          
          // Processar saída CSV
          const lines = stdout.split('\n');
          const printers = [];
          
          lines.forEach((line, index) => {
            if (index > 0 && line.trim()) { // Pular header
              const parts = line.split(',');
              if (parts.length >= 2) {
                const name = parts[0].trim().replace(/"/g, '');
                const isDefault = parts[1].trim().toLowerCase() === 'true';
                
                if (name) {
                  printers.push({
                    name: name,
                    id: name.replace(/[^a-zA-Z0-9]/g, '_'),
                    isDefault: isDefault
                  });
                }
              }
            }
          });
          
          resolve(printers);
        });
      });
    };
    
    let printers = [];
    
    // Tentar métodos em ordem de preferência
    try {
      printers = await getPrintersViaWMIC();
      console.log('WMIC encontrou', printers.length, 'impressoras');
    } catch (e) {
      try {
        printers = await getPrintersViaPowerShell();
        console.log('✅ PowerShell encontrou', printers.length, 'impressoras');
      } catch (e2) {
        try {
          printers = await getPrintersViaCmd();
          console.log('CMD encontrou', printers.length, 'impressoras');
        } catch (e3) {
          console.log('Todos os métodos falharam, usando lista padrão');
        }
      }
    }
    
    // Se não encontrou impressoras, adicionar fallback
    if (printers.length === 0) {
      printers = [
        { name: 'Microsoft Print to PDF', id: 'Microsoft_Print_to_PDF', isDefault: false },
        { name: 'Microsoft XPS Document Writer', id: 'Microsoft_XPS_Document_Writer', isDefault: false }
      ];
    }
    
    // Adicionar impressora padrão do Windows se não estiver na lista
    try {
      const defaultPrinter = await new Promise((resolve, reject) => {
        exec('reg query "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows" /v Device', (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          
          const match = stdout.match(/Device\s+REG_SZ\s+(.+)/);
          if (match) {
            const printerName = match[1].split(',')[0].trim();
            resolve(printerName);
          } else {
            reject(new Error('Não encontrou impressora padrão'));
          }
        });
      });
      
      // Verificar se a impressora padrão já está na lista
      const existingPrinter = printers.find(p => p.name === defaultPrinter);
      if (!existingPrinter) {
        printers.unshift({
          name: defaultPrinter,
          id: defaultPrinter.replace(/[^a-zA-Z0-9]/g, '_'),
          isDefault: true
        });
      } else {
        existingPrinter.isDefault = true;
      }
    } catch (e) {
      console.log('Não foi possível detectar impressora padrão:', e);
    }
    
    console.log('Total de impressoras encontradas:', printers.length);
    
    res.json({
      success: true,
      printers: printers,
      count: printers.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar impressoras:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar impressoras: ' + error.message 
    });
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
    
    console.log('DEBUG - Abertura - req.body:', req.body);
    
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (company.settings.cashRegister.isOpen) {
      return res.status(400).json({ message: 'Caixa já está aberto' });
    }

    console.log('DEBUG - Abertura - company.settings.cashRegister:', JSON.stringify(company.settings.cashRegister, null, 2));
    console.log('DEBUG - Abertura - nextDayOpeningAmount encontrado:', company.settings.cashRegister.nextDayOpeningAmount);

    // Garantir que nextDayOpeningAmount exista (para documentos antigos)
    const nextDayAmount = company.settings.cashRegister.nextDayOpeningAmount || 0;
    
    // Usar nextDayOpeningAmount se não informado initialAmount
    const openingAmount = initialAmount !== undefined ? initialAmount : nextDayAmount;
    
    console.log('DEBUG - Abertura - initialAmount recebido:', initialAmount);
    console.log('DEBUG - Abertura - openingAmount calculado:', openingAmount);

    // Criar CashRegister real no banco
    const CashRegister = require('../models/CashRegister');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const newCashRegister = new CashRegister({
      company: req.company._id,
      date: startOfDay,
      openTime: new Date(),
      openedBy: req.user._id,
      initialAmount: openingAmount,
      status: 'open'
    });
    
    await newCashRegister.save();
    console.log('DEBUG - CashRegister real criado:', newCashRegister._id);

    // Preservar outros campos do cashRegister nas configurações da empresa
    const currentCashRegister = company.settings.cashRegister || {};
    company.settings.cashRegister = {
      ...currentCashRegister,
      _id: newCashRegister._id, // Adicionar referência ao CashRegister real
      isOpen: true,
      openingTime: new Date(),
      initialAmount: openingAmount,
      currentAmount: openingAmount,
      // Garantir que nextDayOpeningAmount seja mantido
      nextDayOpeningAmount: nextDayAmount
    };

    console.log('DEBUG - Abertura - cashRegister antes de salvar:', JSON.stringify(company.settings.cashRegister, null, 2));

    await company.save();

    console.log('DEBUG - Abertura - cashRegister após salvar:', JSON.stringify(company.settings.cashRegister, null, 2));

    res.json({ message: 'Caixa aberto com sucesso', cashRegister: company.settings.cashRegister });
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/cash-register/close', auth, async (req, res) => {
  try {
    const { finalAmount, nextDayOpeningAmount } = req.body;
    
    console.log('DEBUG - Fechamento - finalAmount:', finalAmount);
    console.log('DEBUG - Fechamento - nextDayOpeningAmount:', nextDayOpeningAmount);
    
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (!company.settings.cashRegister.isOpen) {
      return res.status(400).json({ message: 'Caixa já está fechado' });
    }

    console.log('DEBUG - Fechamento - company.settings.cashRegister ANTES:', JSON.stringify(company.settings.cashRegister, null, 2));

    // Atualizar CashRegister real no banco
    const CashRegister = require('../models/CashRegister');
    if (company.settings.cashRegister._id) {
      try {
        const cashRegisterDoc = await CashRegister.findById(company.settings.cashRegister._id);
        if (cashRegisterDoc) {
          cashRegisterDoc.status = 'closed';
          cashRegisterDoc.closeTime = new Date();
          cashRegisterDoc.closedBy = req.user._id;
          cashRegisterDoc.finalAmount = finalAmount;
          await cashRegisterDoc.save();
          console.log('DEBUG - CashRegister real fechado:', cashRegisterDoc._id);
        }
      } catch (err) {
        console.error('Erro ao fechar CashRegister real:', err);
      }
    }

    // Preservar campos existentes e apenas atualizar os necessários
    const currentCashRegister = company.settings.cashRegister || {};
    
    company.settings.cashRegister = {
      ...currentCashRegister,
      isOpen: false,
      closeTime: new Date(),
      finalAmount: finalAmount,
      closedBy: req.user._id,
      // Manter nextDayOpeningAmount configurado
      nextDayOpeningAmount: nextDayOpeningAmount || 0,
      // LIMPAR AJUSTES ao fechar caixa para evitar acúmulo em novos caixas
      adjustments: []
    };

    console.log('DEBUG - Fechamento - cashRegister DEPOIS:', JSON.stringify(company.settings.cashRegister, null, 2));

    await company.save();

    console.log('DEBUG - Após save(), company.settings.cashRegister:', JSON.stringify(company.settings.cashRegister, null, 2));

    res.json({ 
      message: 'Caixa fechado com sucesso',
      cashRegister: company.settings.cashRegister 
    });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/cash-register/adjust', auth, async (req, res) => {
  try {
    const { amount, operation, reason } = req.body;
    
    const Company = require('../models/Company');
    const CashRegister = require('../models/CashRegister');
    
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    if (!company.settings.cashRegister.isOpen) {
      return res.status(400).json({ message: 'Caixa está fechado' });
    }

    // Buscar o CashRegister atual usando ID específico
    let currentCashRegister = null;
    
    // Primeiro, tentar usar o caixa das configurações da empresa
    if (company.settings.cashRegister && company.settings.cashRegister._id) {
      currentCashRegister = await CashRegister.findOne({
        _id: company.settings.cashRegister._id,
        company: req.company._id,
        status: 'open'
      });
    }
    
    // Se não encontrar, buscar o caixa aberto mais recente (fallback)
    if (!currentCashRegister) {
      currentCashRegister = await CashRegister.findOne({
        company: req.company._id,
        status: 'open'
      }).sort({ openTime: -1 });
    }

    if (!currentCashRegister) {
      return res.status(400).json({ message: 'Caixa aberto não encontrado' });
    }

    // Atualizar valores no company.settings (compatibilidade)
    if (operation === 'add') {
      company.settings.cashRegister.currentAmount += amount;
    } else if (operation === 'remove') {
      if (company.settings.cashRegister.currentAmount >= amount) {
        company.settings.cashRegister.currentAmount -= amount;
      } else {
        return res.status(400).json({ message: 'Saldo insuficiente' });
      }
    }

    // Adicionar ajuste no CashRegister específico
    const newAdjustment = {
      amount,
      operation,
      reason: reason || 'Ajuste sem justificativa',
      timestamp: new Date(),
      user: req.user._id
    };
    
    if (!currentCashRegister.adjustments) {
      currentCashRegister.adjustments = [];
    }
    
    currentCashRegister.adjustments.push(newAdjustment);
    await currentCashRegister.save();

    // Manter compatibilidade com frontend - também salvar no company
    if (!company.settings.cashRegister.adjustments) {
      company.settings.cashRegister.adjustments = [];
    }
    company.settings.cashRegister.adjustments.push(newAdjustment);
    await company.save();

    res.json({ 
      message: `Saldo do caixa ${operation === 'add' ? 'adicionado' : 'removido'} com sucesso`,
      cashRegister: company.settings.cashRegister,
      adjustments: currentCashRegister.adjustments
    });
  } catch (error) {
    console.error('Erro ao ajustar caixa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/cash-register/current-adjustments', auth, async (req, res) => {
  try {
    const CashRegister = require('../models/CashRegister');
    const Company = require('../models/Company');
    
    // Buscar empresa para obter o ID do caixa atual
    const company = await Company.findById(req.company._id);
    
    // Buscar o CashRegister atual usando ID específico
    let currentCashRegister = null;
    
    // Primeiro, tentar usar o caixa das configurações da empresa
    if (company.settings.cashRegister && company.settings.cashRegister._id) {
      currentCashRegister = await CashRegister.findOne({
        _id: company.settings.cashRegister._id,
        company: req.company._id,
        status: 'open'
      }).populate('adjustments.user', 'name');
    }
    
    // Se não encontrar, buscar o caixa aberto mais recente (fallback)
    if (!currentCashRegister) {
      currentCashRegister = await CashRegister.findOne({
        company: req.company._id,
        status: 'open'
      }).populate('adjustments.user', 'name').sort({ openTime: -1 });
    }

    if (!currentCashRegister) {
      return res.json({
        adjustments: [],
        cashRegisterId: null
      });
    }

    res.json({
      adjustments: currentCashRegister.adjustments || [],
      cashRegisterId: currentCashRegister._id
    });
  } catch (error) {
    console.error('Erro ao buscar ajustes do caixa atual:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
