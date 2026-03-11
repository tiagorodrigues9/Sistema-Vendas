const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const CashRegister = require('./models/CashRegister');
require('dotenv').config();

async function fixCashRegisterIsolation() {
  try {
    console.log('🔧 Iniciando correção de isolamento de caixas...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-pdv');
    console.log('✅ Conectado ao MongoDB');

    // 1. Encontrar todos os caixas
    const allCashRegisters = await CashRegister.find({});
    console.log(`📊 Total de caixas encontrados: ${allCashRegisters.length}`);

    // 2. Para cada caixa, verificar suas vendas
    for (const cashRegister of allCashRegisters) {
      console.log(`\n🔍 Analisando caixa ${cashRegister._id} (${cashRegister.status}) - Data: ${cashRegister.date.toISOString().split('T')[0]}`);
      
      // Buscar vendas associadas a este caixa
      const associatedSales = await Sale.find({
        'cashRegister.registerId': cashRegister._id
      });
      
      console.log(`  📈 Vendas associadas: ${associatedSales.length}`);
      
      // Verificar se as vendas estão no período correto
      const cashRegisterDate = new Date(cashRegister.date);
      const startOfDay = new Date(cashRegisterDate.getFullYear(), cashRegisterDate.getMonth(), cashRegisterDate.getDate());
      const endOfDay = new Date(cashRegisterDate.getFullYear(), cashRegisterDate.getMonth(), cashRegisterDate.getDate() + 1);
      
      const salesInCorrectPeriod = associatedSales.filter(sale => {
        return sale.createdAt >= startOfDay && sale.createdAt < endOfDay;
      });
      
      const salesInWrongPeriod = associatedSales.filter(sale => {
        return sale.createdAt < startOfDay || sale.createdAt >= endOfDay;
      });
      
      console.log(`  ✅ Vendas no período correto: ${salesInCorrectPeriod.length}`);
      console.log(`  ❌ Vendas em período errado: ${salesInWrongPeriod.length}`);
      
      if (salesInWrongPeriod.length > 0) {
        console.log('  🧹 Limpando associações incorretas...');
        for (const sale of salesInWrongPeriod) {
          console.log(`    🗑️  Removendo venda ${sale.saleNumber} do caixa ${cashRegister._id}`);
          sale.cashRegister.registerId = null;
          await sale.save();
        }
      }
      
      // Atualizar o array de vendas do caixa para refletir apenas as vendas corretas
      cashRegister.sales = salesInCorrectPeriod.map(sale => sale._id);
      cashRegister.totalSales = salesInCorrectPeriod.reduce((sum, sale) => sum + sale.total, 0);
      cashRegister.salesCount = salesInCorrectPeriod.length;
      
      await cashRegister.save();
      console.log(`  💾 Caixa atualizado: ${cashRegister.salesCount} vendas, total R$ ${cashRegister.totalSales.toFixed(2)}`);
    }

    // 3. Verificar vendas sem registerId que poderiam ser associadas
    console.log('\n🔍 Procurando vendas sem registerId...');
    
    // Usar uma query mais segura para evitar erro com valores vazios
    const salesWithoutRegisterId = await Sale.find({
      $or: [
        { 'cashRegister.registerId': null },
        { 'cashRegister.registerId': undefined },
        { 'cashRegister': { $exists: false } },
        { 'cashRegister.registerId': { $exists: false } }
      ]
    });
    
    console.log(`📊 Vendas sem registerId: ${salesWithoutRegisterId.length}`);
    
    // Tentar associar vendas sem registerId aos caixas corretos
    for (const sale of salesWithoutRegisterId) {
      const saleDate = new Date(sale.createdAt);
      const startOfDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
      const endOfDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate() + 1);
      
      // Buscar caixa aberto no dia da venda
      const correctCashRegister = await CashRegister.findOne({
        company: sale.company,
        date: { $gte: startOfDay, $lt: endOfDay },
        status: 'open'
      });
      
      if (correctCashRegister) {
        console.log(`  🔗 Associando venda ${sale.saleNumber} ao caixa ${correctCashRegister._id}`);
        sale.cashRegister.registerId = correctCashRegister._id;
        await sale.save();
        
        // Atualizar o caixa
        correctCashRegister.sales.push(sale._id);
        correctCashRegister.totalSales += sale.total;
        correctCashRegister.salesCount += 1;
        await correctCashRegister.save();
      } else {
        console.log(`  ⚠️  Venda ${sale.saleNumber} não encontrou caixa aberto no dia ${saleDate.toISOString().split('T')[0]}`);
      }
    }

    console.log('\n✅ Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

if (require.main === module) {
  fixCashRegisterIsolation();
}

module.exports = fixCashRegisterIsolation;
