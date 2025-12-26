# 🔍 Gerador de Busca OPERA² - Versão Web

Versão HTML/JS pura para deploy no Firebase Hosting.

## Arquivos

- `index.html` - Página principal
- `style.css` - Estilos Apple-like
- `app.js` - Lógica e API Gemini

## Deploy no Firebase

### 1. Instale Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Faça login
```bash
firebase login
```

### 3. Inicialize o projeto
```bash
cd gerador_busca_web
firebase init hosting
```
- Selecione "Use an existing project" ou crie um novo
- Para "public directory": digite `.` (ponto)
- Para "single-page app": digite `y`
- Para "overwrite index.html": digite `n`

### 4. Crie o arquivo `firebase.json` com:
```json
{
  "hosting": {
    "public": ".",
    "ignore": ["README.md"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  }
}
```

### 5. Deploy
```bash
firebase deploy
```

Você receberá uma URL como: `https://seu-projeto.web.app`

## Configuração da API Key

O usuário deve:
1. Acessar o site
2. Colar a API Key Gemini no campo que aparece
3. Clicar "Salvar"

A chave fica salva no localStorage do navegador.

## Obter API Key Gemini

1. Acesse https://aistudio.google.com/
2. Crie um projeto
3. Gere uma API Key
