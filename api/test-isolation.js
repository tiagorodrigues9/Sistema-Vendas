const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const CashRegister = require('./models/CashRegister');
require('dotenv').config();

async function testIsolation() {
  try {
    console.log('🧪 Testando isolamento de caixas...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-pdv');
    console.log('✅ Conectado ao MongoDB');

    // 1. Buscar caixa aberto hoje
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const currentCashRegister = await CashRegister.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'open'
    });

    if (!currentCashRegister) {
      console.log('❌ Nenhum caixa aberto hoje encontrado');
      return;
    }

    console.log(`📊 Caixa aberto hoje: ${currentCashRegister._id}`);

    // 2. Buscar vendas do caixa atual (usando a query do endpoint)
    const salesFromCurrentRegister = await Sale.find({
      company: currentCashRegister.company,
      'cashRegister.registerId': currentCashRegister._id,
      status: 'completed'
    });

    console.log(`📈 Vendas do caixa atual: ${salesFromCurrentRegister.length}`);
    salesFromCurrentRegister.forEach(sale => {
      console.log(`  - Venda ${sale.saleNumber}: R$ ${sale.total.toFixed(2)} em ${sale.createdAt.toLocaleString()}`);
    });

    // 3. Buscar TODAS as vendas do dia (para comparar)
    const allTodaySales = await Sale.find({
      company: currentCashRegister.company,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      status: 'completed'
    });

    console.log(`📊 TODAS as vendas do dia: ${allTodaySales.length}`);
    allTodaySales.forEach(sale => {
      const isFromCurrentRegister = sale.cashRegister?.registerId?.toString() === currentCashRegister._id.toString();
      console.log(`  - Venda ${sale.saleNumber}: R$ ${sale.total.toFixed(2)} - Caixa: ${sale.cashRegister?.registerId || 'SEM CAIXA'} ${isFromCurrentRegister ? '✅' : '❌'}`);
    });

    // 4. Verificar se há vendas do dia que não estão no caixa atual
    const salesNotInCurrentRegister = allTodaySales.filter(sale => 
      sale.cashRegister?.registerId?.toString() !== currentCashRegister._id.toString()
    );

    if (salesNotInCurrentRegister.length > 0) {
      console.log(`⚠️ Vendas do dia que NÃO estão no caixa atual: ${salesNotInCurrentRegister.length}`);
      salesNotInCurrentRegister.forEach(sale => {
        console.log(`  - Venda ${sale.saleNumber}: R$ ${sale.total.toFixed(2)} - Caixa: ${sale.cashRegister?.registerId || 'SEM CAIXA'}`);
      });
    } else {
      console.log('✅ Todas as vendas do dia estão corretamente no caixa atual!');
    }

    // 5. Verificar outros caixas
    const otherRegisters = await CashRegister.find({
      company: currentCashRegister.company,
      _id: { $ne: currentCashRegister._id },
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    console.log(`📋 Outros caixas do dia: ${otherRegisters.length}`);
    for (const register of otherRegisters) {
      const registerSales = await Sale.find({
        company: register.company,
        'cashRegister.registerId': register._id,
        status: 'completed'
      });
      console.log(`  - Caixa ${register._id} (${register.status}): ${registerSales.length} vendas`);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

if (require.main === module) {
  testIsolation();
}

module.exports = testIsolation;
