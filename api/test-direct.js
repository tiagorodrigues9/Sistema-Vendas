const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const CashRegister = require('./models/CashRegister');
require('dotenv').config();

async function testDirect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-pdv');
    console.log('✅ Conectado ao MongoDB');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('\n=== TESTE DIRETO DAS QUERIES ===');
    console.log('Data:', today.toISOString().split('T')[0]);
    
    // 1. Buscar empresa para testar
    const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }
    
    const companyId = companies[0]._id.toString();
    console.log('Empresa ID:', companyId);
    
    // 2. Testar query do getCurrentCashRegisterReport
    const currentCashRegister = await CashRegister.findOne({
      company: companyId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'open'
    });
    
    console.log('\n📊 Caixa aberto encontrado:', currentCashRegister ? currentCashRegister._id : 'Nenhum');
    
    if (currentCashRegister) {
      const sales = await Sale.find({
        company: companyId,
        'cashRegister.registerId': currentCashRegister._id,
        status: 'completed'
      });
      
      console.log('📈 Vendas do caixa atual (query corrigida):', sales.length);
      sales.forEach(s => console.log('  -', s.saleNumber, 'R$' + s.total.toFixed(2)));
    }
    
    // 3. Testar query antiga (TODAS as vendas do dia)
    const allSales = await Sale.find({
      company: companyId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      status: 'completed'
    });
    
    console.log('\n📊 TODAS as vendas do dia (query antiga):', allSales.length);
    allSales.forEach(s => console.log('  -', s.saleNumber, 'R$' + s.total.toFixed(2), 'Caixa:', s.cashRegister?.registerId || 'SEM'));
    
    // 4. Verificar se há diferença
    if (currentCashRegister && allSales.length > 0) {
      const salesInCurrentRegister = allSales.filter(s => 
        s.cashRegister?.registerId?.toString() === currentCashRegister._id.toString()
      );
      
      const salesNotInCurrentRegister = allSales.filter(s => 
        s.cashRegister?.registerId?.toString() !== currentCashRegister._id.toString()
      );
      
      console.log('\n🔍 Análise:');
      console.log('  Vendas no caixa atual:', salesInCurrentRegister.length);
      console.log('  Vendas em outros caixas:', salesNotInCurrentRegister.length);
      
      if (salesNotInCurrentRegister.length > 0) {
        console.log('❌ PROBLEMA: Há vendas do dia em outros caixas!');
        salesNotInCurrentRegister.forEach(s => {
          console.log('    -', s.saleNumber, 'R$' + s.total.toFixed(2), 'Caixa:', s.cashRegister?.registerId);
        });
      } else {
        console.log('✅ OK: Todas as vendas do dia estão no caixa atual');
      }
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testDirect();
