const mongoose = require('mongoose');
const Sale = require('./api/models/Sale');
const CashRegister = require('./api/models/CashRegister');
const Company = require('./api/models/Company');

// Conexão com MongoDB
mongoose.connect('mongodb://localhost:27017/sistema-pdv', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCashRegisterIsolation() {
  try {
    console.log('=== Teste de Isolamento de Caixas ===\n');

    // 1. Buscar todas as vendas e seus registerIds
    const allSales = await Sale.find({})
      .populate('company', 'companyName')
      .sort({ createdAt: -1 });

    console.log('Total de vendas no sistema:', allSales.length);
    
    // Agrupar vendas por registerId
    const salesByRegister = {};
    allSales.forEach(sale => {
      const registerId = sale.cashRegister?.registerId || 'SEM_REGISTER_ID';
      if (!salesByRegister[registerId]) {
        salesByRegister[registerId] = [];
      }
      salesByRegister[registerId].push({
        id: sale._id,
        saleNumber: sale.saleNumber,
        total: sale.total,
        createdAt: sale.createdAt,
        company: sale.company?.companyName
      });
    });

    console.log('\n--- Vendas agrupadas por RegisterId ---');
    Object.keys(salesByRegister).forEach(registerId => {
      console.log(`\nRegisterId: ${registerId}`);
      console.log(`Quantidade: ${salesByRegister[registerId].length}`);
      salesByRegister[registerId].forEach(sale => {
        console.log(`  - ${sale.saleNumber} | R$${sale.total.toFixed(2)} | ${sale.company} | ${sale.createdAt}`);
      });
    });

    // 2. Buscar todos os caixas
    const allCashRegisters = await CashRegister.find({})
      .populate('company', 'companyName')
      .sort({ date: -1 });

    console.log('\n\n--- Todos os Caixas ---');
    allCashRegisters.forEach(register => {
      console.log(`\nCaixa ID: ${register._id}`);
      console.log(`Empresa: ${register.company?.companyName}`);
      console.log(`Data: ${register.date}`);
      console.log(`Status: ${register.status}`);
      console.log(`Abertura: ${register.openTime}`);
      console.log(`Fechamento: ${register.closeTime || 'Aberto'}`);
      console.log(`Vendas vinculadas: ${register.sales?.length || 0}`);
    });

    // 3. Simular query do getCurrentCashRegisterReport para cada empresa
    console.log('\n\n--- Simulação das Queries do Sistema ---');
    const companies = await Company.find({});
    
    for (const company of companies) {
      console.log(`\n=== Empresa: ${company.companyName} ===`);
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const currentCashRegister = await CashRegister.findOne({
        company: company._id,
        date: { $gte: startOfDay, $lt: endOfDay },
        status: 'open'
      });

      if (currentCashRegister) {
        console.log(`Caixa aberto encontrado: ${currentCashRegister._id}`);
        
        // Query corrigida (usando apenas registerId)
        const sales = await Sale.find({
          company: company._id,
          'cashRegister.registerId': currentCashRegister._id,
          status: 'completed'
        }).sort({ createdAt: -1 });

        console.log(`Vendas encontradas para este caixa: ${sales.length}`);
        sales.forEach(sale => {
          console.log(`  - ${sale.saleNumber} | R$${sale.total.toFixed(2)} | ${sale.createdAt}`);
        });

        // Verificar se há vendas com registerId nulo/inválido
        const invalidSales = await Sale.find({
          company: company._id,
          $or: [
            { 'cashRegister.registerId': { $exists: false } },
            { 'cashRegister.registerId': null },
            { 'cashRegister.registerId': '' }
          ],
          status: 'completed'
        });

        if (invalidSales.length > 0) {
          console.log(`\n⚠️  ATENÇÃO: Encontradas ${invalidSales.length} vendas com registerId inválido!`);
          invalidSales.forEach(sale => {
            console.log(`  - ${sale.saleNumber} | RegisterId: ${sale.cashRegister?.registerId}`);
          });
        }
      } else {
        console.log('Nenhum caixa aberto hoje');
      }
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCashRegisterIsolation();
