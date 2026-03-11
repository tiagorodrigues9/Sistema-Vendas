const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const CashRegister = require('./models/CashRegister');
require('dotenv').config();

async function testEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-pdv');
    console.log('✅ Conectado ao MongoDB');
    
    // Simular a query exata do endpoint getCurrentCashRegisterReport
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('\n=== SIMULAÇÃO DO ENDPOINT getCurrentCashRegisterReport ===');
    console.log('Data:', today.toISOString().split('T')[0]);
    
    // 1. Buscar empresa
    const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }
    
    const companyId = companies[0]._id.toString();
    console.log('Empresa ID:', companyId);
    
    // 2. Buscar caixa aberto HOJE (query do endpoint)
    const currentCashRegister = await CashRegister.findOne({
      company: companyId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'open'
    }).sort({ openTime: -1 });
    
    console.log('\n📊 Caixa aberto encontrado:', currentCashRegister ? {
      id: currentCashRegister._id,
      date: currentCashRegister.date,
      status: currentCashRegister.status,
      openTime: currentCashRegister.openTime
    } : null);
    
    if (!currentCashRegister) {
      console.log('❌ Nenhum caixa aberto encontrado');
      return;
    }
    
    // 3. Query EXATA do endpoint para vendas
    const query = {
      company: companyId,
      'cashRegister.registerId': currentCashRegister._id,
      status: 'completed'
    };
    
    console.log('\n🔍 Query usada:', JSON.stringify(query, null, 2));
    
    const sales = await Sale.find(query)
      .populate('customer', 'name document')
      .populate('user', 'name')
      .populate('items.product', 'description barcode unit')
      .sort({ createdAt: -1 });
    
    console.log('\n📈 Vendas encontradas:', sales.length);
    
    if (sales.length > 0) {
      console.log('\n📋 Detalhes das vendas:');
      sales.forEach((sale, index) => {
        console.log(`${index + 1}. Venda ${sale.saleNumber}:`);
        console.log(`   - ID: ${sale._id}`);
        console.log(`   - Total: R$ ${sale.total.toFixed(2)}`);
        console.log(`   - Data: ${sale.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   - Cliente: ${sale.customerName}`);
        console.log(`   - Caixa ID: ${sale.cashRegister?.registerId}`);
        console.log(`   - Status: ${sale.status}`);
        console.log(`   - Pagamentos: ${sale.payments?.length || 0}`);
        sale.payments?.forEach(payment => {
          console.log(`     * ${payment.method}: R$ ${payment.amount.toFixed(2)}`);
        });
        console.log('');
      });
      
      // 4. Calcular resumo de pagamentos (como o frontend faz)
      const paymentSummary = {};
      sales.forEach(sale => {
        sale.payments?.forEach(payment => {
          const method = payment.method;
          if (!paymentSummary[method]) {
            paymentSummary[method] = { count: 0, amount: 0 };
          }
          paymentSummary[method].count += 1;
          paymentSummary[method].amount += payment.amount || 0;
        });
      });
      
      console.log('💳 Resumo de Pagamentos:');
      Object.entries(paymentSummary).forEach(([method, data]) => {
        console.log(`   - ${method}: ${data.count} vendas, R$ ${data.amount.toFixed(2)}`);
      });
      
      console.log(`\n💰 Total Geral: R$ ${sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}`);
      
    } else {
      console.log('❌ Nenhuma venda encontrada para este caixa');
      
      // 5. Verificar se há vendas no dia que não estão associadas a este caixa
      const allTodaySales = await Sale.find({
        company: companyId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: 'completed'
      });
      
      console.log(`\n⚠️ Verificação: Existem ${allTodaySales.length} vendas no dia total`);
      
      if (allTodaySales.length > 0) {
        console.log('Vendas do dia que não estão no caixa atual:');
        allTodaySales.forEach(sale => {
          const isInCurrentRegister = sale.cashRegister?.registerId?.toString() === currentCashRegister._id.toString();
          console.log(`   - ${sale.saleNumber}: R$ ${sale.total.toFixed(2)} - Caixa: ${sale.cashRegister?.registerId || 'SEM'} ${isInCurrentRegister ? '✅' : '❌'}`);
        });
      }
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testEndpoint();
