require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { startBot } = require('./bot');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const uploadDir = path.join(__dirname, '..', 'storage', 'ebooks');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|epub|zip)$/i.test(file.originalname);
    cb(allowed ? null : new Error('Formato permitido: PDF, EPUB ou ZIP.'), allowed);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));
app.use('/assets', express.static(path.join(__dirname, '..', 'public')));

function auth(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect('/login');
}
function esc(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function layout(title, body) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="/assets/app.css"></head><body><main class="wrap">${body}</main></body></html>`;
}

app.get('/login', (req,res) => res.send(layout('Login', `<section class="card narrow"><h1>Telegram Ebook Bot</h1><p class="muted">Painel administrativo</p><form method="post" action="/login"><input name="user" placeholder="Usuário" required><input name="password" type="password" placeholder="Senha" required><button>Entrar</button></form></section>`)));
app.post('/login', (req,res) => {
  if (req.body.user === process.env.ADMIN_USER && req.body.password === process.env.ADMIN_PASSWORD) { req.session.authenticated = true; return res.redirect('/'); }
  res.status(401).send(layout('Erro', '<section class="card narrow"><h2>Login inválido</h2><a href="/login">Voltar</a></section>'));
});
app.post('/logout', auth, (req,res) => req.session.destroy(() => res.redirect('/login')));

app.get('/', auth, (req,res) => {
  const ebooks = db.listEbooks(); const offers = db.listOffers();
  const ebookRows = ebooks.map(e => `<tr><td>${esc(e.title)}</td><td>${esc(e.category)}</td><td>${esc(e.originalName)}</td><td><form method="post" action="/ebooks/${e.id}/delete"><button class="danger">Excluir</button></form></td></tr>`).join('') || '<tr><td colspan="4">Nenhum ebook.</td></tr>';
  const offerRows = offers.map(o => `<tr><td>${esc(o.title)}</td><td>${esc(o.niche)}</td><td><a href="${esc(o.url)}" target="_blank" rel="noopener">Abrir</a></td><td><form method="post" action="/offers/${o.id}/delete"><button class="danger">Excluir</button></form></td></tr>`).join('') || '<tr><td colspan="4">Nenhuma oferta.</td></tr>';
  res.send(layout('Painel', `<header class="top"><div><h1>Bot Control</h1><p class="muted">${ebooks.length} ebooks · ${offers.length} ofertas</p></div><form method="post" action="/logout"><button class="ghost">Sair</button></form></header>
  <section class="grid"><div class="card"><h2>Adicionar ebook</h2><form method="post" action="/ebooks" enctype="multipart/form-data"><input name="title" placeholder="Título" required><input name="category" placeholder="Categoria"><textarea name="description" placeholder="Descrição"></textarea><input type="file" name="ebook" accept=".pdf,.epub,.zip" required><button>Adicionar à biblioteca</button></form></div>
  <div class="card"><h2>Adicionar oferta pública</h2><form method="post" action="/offers"><input name="title" placeholder="Nome da oferta" required><input name="niche" placeholder="Nicho"><input name="url" type="url" placeholder="URL pública do anúncio/oferta" required><input name="hook" placeholder="Hook"><input name="promise" placeholder="Promessa"><input name="cta" placeholder="CTA"><textarea name="notes" placeholder="Observações de análise"></textarea><button>Salvar oferta</button></form></div></section>
  <section class="card"><h2>Biblioteca</h2><table><thead><tr><th>Título</th><th>Categoria</th><th>Arquivo</th><th></th></tr></thead><tbody>${ebookRows}</tbody></table></section>
  <section class="card"><h2>Ofertas</h2><table><thead><tr><th>Título</th><th>Nicho</th><th>Link</th><th></th></tr></thead><tbody>${offerRows}</tbody></table></section>`));
});

app.post('/ebooks', auth, upload.single('ebook'), (req,res) => {
  if (!req.file) return res.status(400).send('Arquivo obrigatório.');
  db.addEbook({ title: req.body.title, category: req.body.category, description: req.body.description, originalName: req.file.originalname, filePath: req.file.path });
  res.redirect('/');
});
app.post('/ebooks/:id/delete', auth, (req,res) => { const e=db.deleteEbook(req.params.id); if(e && fs.existsSync(e.filePath)) fs.unlinkSync(e.filePath); res.redirect('/'); });
app.post('/offers', auth, (req,res) => { db.addOffer({ title:req.body.title, niche:req.body.niche, url:req.body.url, hook:req.body.hook, promise:req.body.promise, cta:req.body.cta, notes:req.body.notes }); res.redirect('/'); });
app.post('/offers/:id/delete', auth, (req,res) => { db.deleteOffer(req.params.id); res.redirect('/'); });
app.get('/health', (req,res) => res.json({ ok:true, service:'telegram-ebook-bot', node:process.version }));

app.use((err,req,res,next) => { console.error(err); res.status(400).send(layout('Erro', `<section class="card"><h2>Erro</h2><p>${esc(err.message || 'Erro inesperado')}</p><a href="/">Voltar</a></section>`)); });

app.listen(PORT, () => console.log(`🖥️ Painel: http://localhost:${PORT}`));
startBot();
