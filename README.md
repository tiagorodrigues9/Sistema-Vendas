# Sistema PDV - Ponto de Venda

Sistema completo de Ponto de Venda desenvolvido com Node.js/Express (backend) e React (frontend), com banco de dados MongoDB.

## 🚀 Tecnologias

### Backend
- Node.js
- Express.js
- MongoDB com Mongoose
- JWT para autenticação
- bcryptjs para criptografia
- Express Validator
- Helmet, CORS, Rate Limiting

### Frontend
- React 18
- React Router DOM
- React Hook Form
- React Query
- Tailwind CSS
- Lucide React (ícones)
- React Hot Toast (notificações)
- PWA capabilities

## 📋 Funcionalidades

### 🏢 Gestão de Empresas
- Cadastro de empresas com CNPJ
- Aprovação administrativa
- Configurações de caixa

### 👥 Gestão de Usuários
- Três níveis de permissão:
  - **Administrador**: Acesso total ao sistema e painel de controle
  - **Dono**: Acesso a todas as funcionalidades exceto administração
  - **Funcionário**: Acesso limitado a vendas e cadastro de clientes
- Autenticação JWT
- Perfis de usuário

### 💰 Vendas (PDV)
- Abertura/fechamento de caixa
- Gestão de troco
- Venda por código de barras ou pesquisa
- Múltiplas formas de pagamento
- Impressão de comprovante (térmica/A4)
- Cancelamento de vendas

### 👥 Clientes
- Cadastro com CPF/CNPJ automático
- Endereço completo
- Histórico de compras
- Lixeira para recuperação

### 📦 Produtos
- Cadastro com código de barras
- Controle de estoque
- Preço de custo e venda
- Grupos e subgrupos
- Movimentação de estoque
- Lixeira para recuperação

### 📥 Entrada de Produtos
- Nota fiscal
- Fornecedor
- Múltiplos itens por entrada
- Ajuste automático de estoque

### 📊 Dashboard
- Vendas do mês
- Produtos mais vendidos
- Clientes que mais compram
- Relatórios exportáveis (Excel/PDF)

### 💳 Contas a Receber
- Gestão de boletos, promissórias e parcelas
- Controle de vencimentos
- Baixa de pagamentos

### ⚙️ Administração
- Aprovação de empresas e usuários
- Relatórios de uso
- Gestão do sistema

## 🛠️ Instalação

### Pré-requisitos
- Node.js 16+
- MongoDB
- Git

### Backend

1. Clone o repositório:
```bash
git clone <repository-url>
cd sistemaPDV
```

2. Instale as dependências do backend:
```bash
cd api
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
MONGODB_URI=mongodb://localhost:27017/sistema-pdv
PORT=5000
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

4. Inicie o backend:
```bash
npm run dev
```

### Frontend

1. Instale as dependências do frontend:
```bash
cd ../frontend
npm install
```

2. Configure as variáveis de ambiente:
```bash
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

3. Inicie o frontend:
```bash
npm start
```

## 🌐 Deploy

### Backend (Vercel)
1. Configure as variáveis de ambiente no Vercel
2. Faça o deploy da pasta `api`

### Frontend (Render)
1. Configure as variáveis de ambiente no Render
2. Faça o deploy da pasta `frontend`

## 📱 PWA

O sistema é uma Progressive Web App (PWA):
- Instalável em dispositivos móveis
- Funciona offline (cache básico)
- Notificações push (configurável)

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Tokens JWT com expiração
- Rate limiting
- Helmet para segurança de headers
- Validação de entrada
- CORS configurado

## 📁 Estrutura do Projeto

```
sistemaPDV/
├── api/                    # Backend Node.js
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares
│   ├── controllers/       # Controladores
│   ├── utils/            # Utilitários
│   └── server.js         # Servidor principal
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── contexts/     # Contextos React
│   │   ├── services/     # Serviços API
│   │   ├── utils/        # Utilitários
│   │   └── styles/       # Estilos
│   └── public/           # Arquivos estáticos
└── README.md
```

## 🎯 Fluxo de Uso

1. **Cadastro**: Empresa faz cadastro e aguarda aprovação
2. **Aprovação**: Administrador aprova empresa e usuários
3. **Configuração**: Dono cadastra produtos e clientes
4. **Operação**: Funcionários realizam vendas
5. **Gestão**: Dono acessa relatórios e administração
6. **Controle**: Administrador gerencia todo o sistema

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT.

## 🆘 Suporte

Para suporte, envie um e-mail para [seu-email@dominio.com] ou abra uma issue no GitHub.

---

## 🚀 Próximos Passos

Para continuar o desenvolvimento:

1. **Implementar telas restantes**: Clientes, Produtos, Entradas, Dashboard, Contas a Receber, Admin
2. **Configurar PWA**: Service worker, manifest.json
3. **Testes**: Unitários e de integração
4. **Documentação**: API docs com Swagger
5. **Melhorias**: Performance, UI/UX, novas funcionalidades

O sistema está estruturado e pronto para desenvolvimento das telas restantes!
