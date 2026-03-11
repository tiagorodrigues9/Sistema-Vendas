## Teste de Isolamento de Caixas

### Problema Identificado
Vendas de caixas anteriores estavam aparecendo em caixas novos devido a:

1. **Fallbacks na query**: O endpoint `getCurrentCashRegisterReport` tinha filtros por data que permitiam incluir vendas de outros caixas
2. **RegisterId fake**: Quando não encontrava caixa válido, o sistema gerava um `registerId` usando timestamp
3. **Filtragem manual**: Indicava que já havia problemas com isolamento

### Correções Implementadas

#### 1. Endpoint `getCurrentCashRegisterReport` (/api/routes/sales.js)
- **Removida filtragem por data** - Agora usa apenas `registerId` para isolamento total
- **Removida filtragem manual** - Não precisa mais de filtros adicionais se a query estiver correta
- **Query simplificada**: Busca apenas por `company`, `registerId` e `status`

#### 2. Criação de Vendas (/api/routes/sales.js)
- **Removido registerId fake** - Não gera mais timestamps como registerId
- **Validação reforçada** - Exige `currentCashRegister._id` válido
- **Fallbacks removidos** - Só aceita caixas reais do banco

#### 3. Lógica de Busca de Caixa
- **Data restrita ao dia atual** - Evita pegar caixas de dias anteriores
- **Sem criação de objetos falsos** - Não cria mais caixas virtuais

### Como Testar

1. **Abra um caixa** hoje
2. **Faça algumas vendas** (elas devem aparecer no relatório)
3. **Feche o caixa**
4. **Abra um novo caixa** no mesmo dia
5. **Verifique o relatório** - deve mostrar apenas as vendas do novo caixa

### Arquivos Modificados
- `api/routes/sales.js` - Correções nas queries e validações
- `api/test-cash-register-isolation.js` - Script de teste (requer MongoDB)

### Expected Behavior
✅ Vendas aparecem apenas no caixa onde foram realizadas
✅ Fechar e abrir novo caixa isola completamente as vendas
✅ Não há mais "vazamento" de vendas entre caixas
✅ Sistema exige caixa válido para criar vendas
