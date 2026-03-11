const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const CashRegister = require('./models/CashRegister');
const Company = require('./models/Company');

async function diagnoseCashRegisterIssue() {
  try {
    // Conectar ao banco
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pdv-system');
    console.log('🔍 Conectado ao MongoDB');

    // Buscar todas as empresas
    const companies = await Company.find({});
    console.log(`\n📋 Encontradas ${companies.length} empresas`);

    for (const company of companies) {
      console.log(`\n🏢 Analisando empresa: ${company.companyName || company._id}`);
      
      // Buscar todos os caixas da empresa
      const cashRegisters = await CashRegister.find({ company: company._id })
        .sort({ date: -1, openTime: -1 });
      
      console.log(`💰 Encontrados ${cashRegisters.length} caixas`);
      
      for (const cr of cashRegisters) {
        console.log(`\n  📊 Caixa ${cr._id} (${cr.status}) - Data: ${cr.date?.toISOString().split('T')[0]}`);
        console.log(`     Aberto: ${cr.openTime?.toISOString()}`);
        console.log(`     Vendas: ${cr.sales?.length || 0}`);
        
        // Buscar vendas associadas a este caixa
        const sales = await Sale.find({ 
          company: company._id,
          'cashRegister.registerId': cr._id 
        }).populate('user', 'name');
        
        console.log(`     📈 Vendas encontradas no banco: ${sales.length}`);
        
        sales.forEach(sale => {
          console.log(`       • Venda ${sale.saleNumber} - ${sale.createdAt?.toISOString()} - ${sale.user?.name}`);
        });
      }
      
      // Buscar vendas sem registerId ou com registerId null
      const orphanSales = await Sale.find({
        company: company._id,
        $or: [
          { 'cashRegister.registerId': { $exists: false } },
          { 'cashRegister.registerId': null },
          { 'cashRegister.registerId': '' }
        ]
      });
      
      if (orphanSales.length > 0) {
        console.log(`\n  ⚠️  Vendas órfãs (sem registerId): ${orphanSales.length}`);
        orphanSales.forEach(sale => {
          console.log(`       • Venda ${sale.saleNumber} - ${sale.createdAt?.toISOString()}`);
        });
      }
      
      // Verificar vendas do dia atual
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todaySales = await Sale.find({
        company: company._id,
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });
      
      console.log(`\n  📅 Vendas de hoje (${today.toISOString().split('T')[0]}): ${todaySales.length}`);
      
      // Agrupar vendas de hoje por registerId
      const salesByRegister = {};
      todaySales.forEach(sale => {
        const registerId = sale.cashRegister?.registerId?.toString() || 'SEM_ID';
        if (!salesByRegister[registerId]) {
          salesByRegister[registerId] = [];
        }
        salesByRegister[registerId].push(sale);
      });
      
      Object.entries(salesByRegister).forEach(([registerId, sales]) => {
        console.log(`     📍 Caixa ${registerId}: ${sales.length} vendas`);
        sales.slice(0, 3).forEach(sale => {
          console.log(`       • ${sale.saleNumber} - ${sale.createdAt?.toISOString().split('T')[1]?.substring(0, 5)}`);
        });
        if (sales.length > 3) {
          console.log(`       ... e mais ${sales.length - 3} vendas`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Desconectado do MongoDB');
  }
}

if (require.main === module) {
  diagnoseCashRegisterIssue();
}

module.exports = diagnoseCashRegisterIssue;
