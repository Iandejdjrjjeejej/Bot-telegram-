# Telegram Ebook Bot — Node 24 Edition

Bot Telegram + painel administrativo + banco de dados em JSON. Esta versão foi feita para evitar o problema do `better-sqlite3`/`node-gyp` que ocorreu no Node 24.

## Requisitos
- Node.js 20 ou superior (Node 24 é suportado)
- Um bot criado no @BotFather

## Instalação no Windows
1. Extraia o ZIP.
2. Abra o CMD/PowerShell dentro da pasta.
3. Se existir uma instalação anterior, apague a pasta `node_modules` antes de instalar.
4. Copie `.env.example` para `.env`.
5. Coloque o token do BotFather em `BOT_TOKEN`.
6. Rode:

```bash
npm install
npm start
```

Painel: `http://localhost:3000`

## Configuração do Telegram
- Adicione o bot ao grupo.
- Se quiser que ele leia comandos normalmente em grupos, desative o Group Privacy no @BotFather.
- Dê permissão para enviar mensagens e documentos.

## Comandos
- `/start`
- `/ajuda`
- `/buscar marketing`
- `/recentes`
- `/ofertas`

## Banco de dados
Os registros ficam em `data/db.json`. Não usa SQLite, `better-sqlite3`, `node-gyp` ou compilação nativa. Os arquivos ficam em `storage/ebooks/`.

## Biblioteca
Use apenas ebooks que você tenha criado, licenciado ou autorização para redistribuir, incluindo materiais em domínio público ou com licença que permita distribuição.

## Ofertas
O painel permite guardar links públicos e campos de análise (hook, promessa, CTA e observações). Não foi criado para baixar ou redistribuir criativos protegidos.

## Segurança
Nunca compartilhe o `BOT_TOKEN`. Troque `ADMIN_PASSWORD` e `SESSION_SECRET` no `.env` antes de colocar o painel na internet.
