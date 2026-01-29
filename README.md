# Sistema PDV Completo

Sistema completo de Ponto de Venda (PDV) desenvolvido com Node.js, Express, React.js e MongoDB.

## 🚀 Funcionalidades

### 📋 Gestão de Vendas
- Sistema de caixa completo
- Múltiplas formas de pagamento
- Controle de troco
- Emissão de comprovantes
- Registro de vendas por data e período

### 👥 Gestão de Clientes
- Cadastro de clientes (CPF/CNPJ)
- Endereço completo
- Histórico de compras
- Soft delete com recuperação

### 📦 Gestão de Produtos
- Cadastro com código de barras
- Controle de estoque
- Alertas de estoque baixo
- Grupos e subgrupos
- Preço de custo e venda

### 📥 Entrada de Produtos
- Nota fiscal
- Fornecedor
- Justificativa de entrada
- Atualização automática de estoque

### 📊 Dashboard e Relatórios
- Vendas do mês/período
- Produtos mais vendidos
- Melhores clientes
- Formas de pagamento
- Exportação (Excel/PDF)

### 💳 Contas a Receber
- Controle de pagamentos pendentes
- Vencidos
- Status de pagamento

### ⚙️ Painel Administrativo
- Aprovação de empresas
- Gestão de usuários
- Estatísticas do sistema
- Relatórios de uso

## 🔐 Sistema de Permissões

### **Administrador**
- Acesso a todas as telas
- Painel administrativo
- Gestão de empresas e usuários

### **Dono**
- Todas as funcionalidades exceto painel admin
- Dashboard completo
- Contas a receber

### **Funcionário**
- Realizar vendas
- Cadastrar clientes
- Acesso limitado ao sistema

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

### Frontend
- **React.js** - Biblioteca UI
- **React Router** - Navegação
- **Axios** - Cliente HTTP
- **React Hook Form** - Formulários
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações

### PWA
- Service Worker
- Manifest.json
- Suporte offline
- Instalação em dispositivos

## 📁 Estrutura do Projeto

```
sistemaPDV/
├── api/                    # Backend Node.js
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares
│   ├── utils/             # Utilitários
│   ├── server.js          # Servidor Express
│   └── package.json
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── contexts/      # Contextos
│   │   ├── services/      # Serviços API
│   │   └── utils/         # Utilitários
│   ├── public/            # Arquivos estáticos
│   └── package.json
└── README.md
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 16+
- MongoDB
- Git

### 1. Clonar o repositório
```bash
git clone <repository-url>
cd sistemaPDV
```

### 2. Instalar dependências
```bash
npm run install-all
```

### 3. Configurar variáveis de ambiente

#### Backend (api/.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sistema-pdv
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

#### Frontend (frontend/.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Iniciar o MongoDB
```bash
mongod
```

### 5. Executar em modo desenvolvimento
```bash
npm run dev
```

Isso iniciará:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## 🚀 Deploy

### Backend no Vercel
```bash
cd api
npm i -g vercel
vercel --prod
```

Configure as variáveis de ambiente no painel Vercel:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`

### Frontend no Render
1. Conecte o repositório ao Render
2. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `serve -s build -l 3000`
   - **Publish Directory**: `build`

### Frontend na Vercel (Alternativa)
```bash
cd frontend
vercel --prod
```

## 📱 PWA - Progressive Web App

O sistema é uma PWA completa:
- ✅ Funciona offline
- ✅ Instalável em dispositivos móveis
- ✅ Notificações push
- ✅ Performance otimizada

## 🔧 Desenvolvimento

### Scripts Úteis
```bash
# Instalar todas as dependências
npm run install-all

# Iniciar apenas o backend
npm run server

# Iniciar apenas o frontend
npm run client

# Build de produção
cd frontend && npm run build
```

### Criar Usuário Admin
```javascript
// No MongoDB
use sistema-pdv
db.users.insertOne({
  name: "Admin",
  email: "admin@admin.com",
  password: "$2a$10$...", // Hash da senha "admin123"
  role: "admin",
  company: null,
  permissions: {
    canViewDashboard: true,
    canManageCustomers: true,
    canManageProducts: true,
    canMakeSales: true,
    canManageEntries: true,
    canViewReports: true,
    canManageReceivables: true,
    canAccessAdmin: true
  },
  isActive: true
})
```

## 📄 Licença

MIT License

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, envie um email para [seu-email@dominio.com] ou abra uma issue no GitHub.
