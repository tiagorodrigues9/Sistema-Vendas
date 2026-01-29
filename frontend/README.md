# Sistema PDV - Frontend

## Instalação

1. Instale as dependências:
```bash
cd frontend
npm install
```

2. Configure a URL da API no arquivo `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

3. Inicie o servidor de desenvolvimento:
```bash
npm start
```

## Build para Produção

1. Crie o build:
```bash
npm run build
```

2. Configure a variável de ambiente para produção:
```
REACT_APP_API_URL=https://sua-api-vercel.vercel.app/api
```

## Deploy no Render

1. Crie uma conta no [Render](https://render.com)

2. Conecte seu repositório GitHub

3. Crie um novo "Web Service" com as seguintes configurações:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `serve -s build -l 3000`
- **Publish Directory**: `build`

4. Adicione as variáveis de ambiente:
- `REACT_APP_API_URL`: URL da sua API no Vercel

## Deploy na Vercel (Alternativa)

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça o deploy:
```bash
vercel --prod
```

## Configuração do PWA

O aplicativo já está configurado como PWA com:
- Service Worker para funcionamento offline
- Manifest.json para instalação
- Ícones e metadados adequados
