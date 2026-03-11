const mongoose = require('mongoose');
const Sale = require('./api/models/Sale');
const CashRegister = require('./api/models/CashRegister');
const Company = require('./api/models/Company');

// Conexão com MongoDB
mongoose.connect('mongodb://localhost:27017/sistema-pdv', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function diagnoseSalesIssues() {
  try {
    console.log('=== DIAGNÓSTICO DE VENDAS E CAIXAS ===\n');

    // 1. Buscar todas as vendas e analisar registerIds
    const allSales = await Sale.find({})
      .populate('company', 'companyName')
      .sort({ createdAt: -1 });

    console.log('Total de vendas no sistema:', allSales.length);
    
    // Analisar registerIds das vendas
    const registerAnalysis = {
      valid: 0,
      null: 0,
      invalid: 0,
      timestamp: 0
    };

    allSales.forEach(sale => {
      const registerId = sale.cashRegister?.registerId;
      
      if (!registerId) {
        registerAnalysis.null++;
      } else if (typeof registerId === 'string' && registerId.length === 13 && /^\d{13}$/.test(registerId)) {
        registerAnalysis.timestamp++;
      } else if (mongoose.Types.ObjectId.isValid(registerId)) {
        registerAnalysis.valid++;
      } else {
        registerAnalysis.invalid++;
      }
    });

    console.log('\n--- Análise de RegisterIds ---');
    console.log('Válidos (ObjectId):', registerAnalysis.valid);
    console.log('Nulos:', registerAnalysis.null);
    console.log('Timestamp (fake):', registerAnalysis.timestamp);
    console.log('Inválidos:', registerAnalysis.invalid);

    // 2. Mostrar vendas com problemas
    console.log('\n--- Vendas com RegisterId Problemático ---');
    allSales.forEach(sale => {
      const registerId = sale.cashRegister?.registerId;
      if (!registerId || (typeof registerId === 'string' && registerId.length === 13)) {
        console.log(`Venda: ${sale.saleNumber} | RegisterId: ${registerId} | Empresa: ${sale.company?.companyName} | Data: ${sale.createdAt}`);
      }
    });

    // 3. Buscar caixas atuais
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const openCashRegisters = await CashRegister.find({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'open'
    }).populate('company', 'companyName');

    console.log('\n--- Caixas Abertos Hoje ---');
    openCashRegisters.forEach(register => {
      console.log(`Caixa ID: ${register._id}`);
      console.log(`Empresa: ${register.company?.companyName}`);
      console.log(`Data: ${register.date}`);
      console.log(`Abertura: ${register.openTime}`);
      console.log(`Vendas vinculadas: ${register.sales?.length || 0}`);
      
      // Verificar se as vendas vinculadas têm registerId correto
      if (register.sales && register.sales.length > 0) {
        const linkedSales = await Sale.find({ _id: { $in: register.sales } });
        const problematicLinked = linkedSales.filter(s => 
          !s.cashRegister?.registerId || s.cashRegister.registerId.toString() !== register._id.toString()
        );
        
        if (problematicLinked.length > 0) {
          console.log(`⚠️  ${problematicLinked.length} vendas vinculadas com registerId incorreto!`);
          problematicLinked.forEach(sale => {
            console.log(`    - ${sale.saleNumber} | RegisterId na venda: ${sale.cashRegister?.registerId}`);
          });
        }
      }
      console.log('---');
    });

    // 4. Simular query atual para cada caixa aberto
    console.log('\n--- Simulação das Queries Atuais ---');
    for (const register of openCashRegisters) {
      console.log(`\n=== Caixa: ${register._id} (${register.company?.companyName}) ===`);
      
      // Query atual do relatório
      const query = {
        company: register.company._id,
        'cashRegister.registerId': register._id,
        status: 'completed'
      };
      
      console.log('Query:', JSON.stringify(query, null, 2));
      
      const sales = await Sale.find(query)
        .populate('customer', 'name document')
        .populate('user', 'name')
        .sort({ createdAt: -1 });

      console.log(`Vendas encontradas: ${sales.length}`);
      sales.forEach(sale => {
        console.log(`  - ${sale.saleNumber} | R$${sale.total.toFixed(2)} | ${sale.createdAt} | RegisterId: ${sale.cashRegister?.registerId}`);
      });

      // Verificar se há vendas do dia que não foram encontradas
      const allTodaySales = await Sale.find({
        company: register.company._id,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: 'completed'
      });

      const missingSales = allTodaySales.filter(sale => 
        !sales.find(s => s._id.toString() === sale._id.toString())
      );

      if (missingSales.length > 0) {
        console.log(`⚠️  ${missingSales.length} vendas de hoje não encontradas na query!`);
        missingSales.forEach(sale => {
          console.log(`    - ${sale.saleNumber} | RegisterId: ${sale.cashRegister?.registerId} | ${sale.createdAt}`);
        });
      }
    }

  } catch (error) {
    console.error('Erro no diagnóstico:', error);
  } finally {
    mongoose.connection.close();
  }
}

diagnoseSalesIssues();
