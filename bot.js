const path = require('path');
const { Telegraf } = require('telegraf');
const db = require('./db');

function startBot() {
  const token = process.env.BOT_TOKEN;
  if (!token || token.includes('COLE_SEU')) {
    console.warn('BOT_TOKEN não configurado. O painel continuará funcionando, mas o bot Telegram não será iniciado.');
    return null;
  }

  const bot = new Telegraf(token);

  bot.start(ctx => ctx.reply(
    '👋 Bem-vindo!\n\n' +
    'Use /buscar <termo> para pesquisar na biblioteca.\n' +
    'Use /recentes para ver os últimos ebooks.\n' +
    'Use /ofertas para ver ofertas cadastradas para análise.\n\n' +
    'A biblioteca deve conter somente arquivos autorizados para distribuição.'
  ));

  bot.help(ctx => ctx.reply('/buscar <termo>\n/recentes\n/ofertas'));

  bot.command('buscar', async ctx => {
    const text = ctx.message.text.replace(/^\/buscar(?:@\S+)?/i, '').trim();
    if (!text) return ctx.reply('Use assim: /buscar marketing');
    const results = db.searchEbooks(text).slice(0, 10);
    if (!results.length) return ctx.reply(`🔎 Nenhum ebook encontrado para “${text}”.`);

    await ctx.reply(`📚 Encontrei ${results.length} resultado(s) para “${text}”:`);
    for (const ebook of results) {
      const caption = `📘 ${ebook.title}\n` +
        `🏷️ ${ebook.category || 'Sem categoria'}\n` +
        `${ebook.description ? `📝 ${ebook.description}\n` : ''}` +
        `📅 ${new Date(ebook.createdAt).toLocaleDateString('pt-BR')}`;
      try {
        await ctx.replyWithDocument({ source: path.resolve(ebook.filePath) }, { caption });
      } catch (err) {
        await ctx.reply(`⚠️ Não consegui enviar “${ebook.title}”. Verifique se o arquivo ainda existe no servidor.`);
      }
    }
  });

  bot.command('recentes', async ctx => {
    const results = db.listEbooks().slice(0, 5);
    if (!results.length) return ctx.reply('📚 A biblioteca ainda está vazia.');
    await ctx.reply('📚 Últimos ebooks:');
    for (const ebook of results) {
      try { await ctx.replyWithDocument({ source: path.resolve(ebook.filePath) }, { caption: `📘 ${ebook.title}\n🏷️ ${ebook.category || 'Sem categoria'}` }); }
      catch { await ctx.reply(`⚠️ Arquivo indisponível: ${ebook.title}`); }
    }
  });

  bot.command('ofertas', ctx => {
    const offers = db.listOffers().slice(0, 8);
    if (!offers.length) return ctx.reply('🔥 Nenhuma oferta cadastrada ainda.');
    const lines = offers.map((o, i) => `${i + 1}. ${o.title}\n   Nicho: ${o.niche || '-'}\n   ${o.url || ''}`);
    ctx.reply('🔥 Ofertas públicas para análise:\n\n' + lines.join('\n\n'));
  });

  bot.catch(err => console.error('Erro do Telegram:', err));
  bot.launch().then(() => console.log('🤖 Bot Telegram conectado.')).catch(err => console.error('Falha ao iniciar bot:', err));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  return bot;
}

module.exports = { startBot };
