# Sistema PDV - Backend

## Instalação

1. Instale as dependências:
```bash
cd api
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sistema-pdv
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

3. Inicie o servidor:
```bash
npm run dev
```

## Deploy no Vercel

1. Crie um arquivo `vercel.json` na pasta `api`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

2. Instale o Vercel CLI:
```bash
npm i -g vercel
```

3. Faça o deploy:
```bash
vercel --prod
```

## Variáveis de Ambiente no Vercel

Configure as seguintes variáveis de ambiente no painel do Vercel:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
