// Gera os SVGs do README (tema claro e escuro) em ../assets.
// Edite os textos em CONTEUDO e rode: npm install && npm run build
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ot = await import("opentype.js");
const parseFont = ot.parse ?? ot.default.parse;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "assets");

const CONTEUDO = {
  header: {
    eyebrow: "Desenvolvedor Full Stack",
    titulo: "Olá, eu sou o Gabriel",
    lead: "Apaixonado por criar produtos digitais úteis, bonitos e bem construídos, do front-end ao banco de dados.",
    stamp: "TypeScript · React · Laravel · PostgreSQL",
    monograma: "GF",
  },
  sobre: {
    eyebrow: "Sobre mim",
    titulo: "Do front-end ao banco de dados.",
    lead: "Sou desenvolvedor focado em construir aplicações web completas. Gosto de transformar ideias em produtos reais, com interfaces cuidadosas, código organizado e boa experiência para quem usa.",
    cards: [
      { tag: "Agora", titulo: "Projetos em andamento", texto: "Trabalhando em projetos web, apps e automações.", destaque: true },
      { tag: "Aprendendo", titulo: "IA no desenvolvimento", texto: "Sempre aprendendo algo novo, especialmente sobre IA aplicada ao desenvolvimento." },
      { tag: "Converse comigo", titulo: "React, TypeScript e Laravel", texto: "Pode falar comigo sobre React, TypeScript, Laravel e arquitetura de aplicações." },
      { tag: "Curiosidade", titulo: "Jogos e experimentos", texto: "Também crio jogos e experimentos visuais nas horas vagas." },
    ],
  },
  stack: {
    eyebrow: "Stack principal",
    titulo: "Com o que eu construo.",
    principal: [
      { nome: "TypeScript", tag: "Linguagem", icone: ["typescript"] },
      { nome: "React", tag: "Front-end", icone: ["react"] },
      { nome: "JavaScript", tag: "Linguagem", icone: ["javascript"] },
      { nome: "HTML", tag: "Front-end", icone: ["html5"] },
      { nome: "CSS", tag: "Front-end", icone: ["css", "css3"] },
      { nome: "Laravel", tag: "Back-end", icone: ["laravel"] },
      { nome: "PostgreSQL", tag: "Banco de dados", icone: ["postgresql"] },
    ],
    outrasTitulo: "Também trabalho com",
    outras: [
      { nome: "PHP", icone: ["php"] },
      { nome: "Python", icone: ["python"] },
      { nome: "Dart", icone: ["dart"] },
      { nome: "Kotlin", icone: ["kotlin"] },
      { nome: "Java", icone: ["openjdk"] },
      { nome: "GDScript", icone: ["godotengine"] },
      { nome: "Git", icone: ["git"] },
    ],
  },
  stats: {
    eyebrow: "No GitHub",
    titulo: "Atividade e linguagens.",
  },
  footer: {
    nota: "Obrigado pela visita! Fique à vontade para explorar meus repositórios.",
    stamp: "Gabriel Farias · Desenvolvedor Full Stack",
  },
  botoes: {
    linkedin: "LinkedIn",
    portfolio: "Portfólio · Dashi Insights",
  },
};

const TEMAS = {
  light: {
    bg0: "#EEF2FF", bg1: "#F4F4F4", bg2: "#F7F8FB",
    grad1: "#2563EB2E", grad2: "#FF5A001A", grid: "#002B8F14",
    surface: "#FFFFFFB8", line: "#002B8F1F", priority: "#FF5A0066",
    heading: "#002B8F", royal: "#0D47C9", text: "#1E1E1E", muted: "#1E1E1E9E",
    orange: "#FF5A00", shadow: "#002B8F", shadowOpacity: 0.08,
  },
  dark: {
    bg0: "#0E1118", bg1: "#12141A", bg2: "#161A24",
    grad1: "#2563EB38", grad2: "#FF5A001F", grid: "#7BA3FF14",
    surface: "#1A1D26D1", line: "#7BA3FF2E", priority: "#FF5A0066",
    heading: "#E8EEFF", royal: "#5B8CFF", text: "#F4F4F4", muted: "#F4F4F49E",
    orange: "#FF7A1A", shadow: "#000000", shadowOpacity: 0.35,
  },
};

const W = 840;
const P = 44;
const FAMILIAS = { chakra: "Chakra Petch", outfit: "Outfit" };
const FONTES_URL =
  "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Outfit:wght@400;600;700";

// ---------- fontes ----------

async function baixarFaces(texto) {
  const url = texto ? `${FONTES_URL}&text=${encodeURIComponent(texto)}` : FONTES_URL;
  const css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
  const faces = {};
  for (const [, bloco] of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const familia = /font-family:\s*'([^']+)'/.exec(bloco)[1];
    const peso = /font-weight:\s*(\d+)/.exec(bloco)[1];
    const src = /url\(([^)]+)\)/.exec(bloco)[1];
    const formato = /format\('([^']+)'\)/.exec(bloco)?.[1] ?? "truetype";
    const range = /unicode-range:\s*([^;]+)/.exec(bloco)?.[1] ?? "";
    const chave = `${familia}-${peso}`;
    if (faces[chave] && range && !range.includes("U+0000-00FF")) continue;
    faces[chave] = { familia, peso, src, formato };
  }
  for (const face of Object.values(faces)) {
    face.buffer = Buffer.from(await (await fetch(face.src)).arrayBuffer());
  }
  return faces;
}

const facesCompletas = await baixarFaces();
const metricas = {};
for (const [chave, face] of Object.entries(facesCompletas)) {
  const b = face.buffer;
  metricas[chave] = parseFont(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

const usados = new Set();

function fonteDe(familia, peso) {
  const f = metricas[`${FAMILIAS[familia]}-${peso}`];
  if (!f) throw new Error(`Fonte não carregada: ${familia} ${peso}`);
  return f;
}

function medir(str, { familia = "outfit", peso = 400, tamanho, ls = 0 }) {
  return fonteDe(familia, peso).getAdvanceWidth(str, tamanho, { kerning: true }) + ls * str.length;
}

function quebrar(str, opts, largura) {
  const linhas = [];
  let atual = "";
  for (const palavra of str.split(/\s+/)) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (atual && medir(teste, opts) > largura) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// ---------- primitivas SVG ----------

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function texto(x, y, str, { familia = "outfit", peso = 400, tamanho, cor, ls = 0, anchor, upper = false }) {
  const conteudo = upper ? str.toLocaleUpperCase("pt-BR") : str;
  for (const ch of conteudo) usados.add(ch);
  const attrs = [
    `x="${x.toFixed(1)}"`, `y="${y.toFixed(1)}"`,
    `font-family="'${FAMILIAS[familia]}', sans-serif"`, `font-weight="${peso}"`,
    `font-size="${tamanho}"`, `fill="${cor}"`,
  ];
  if (ls) attrs.push(`letter-spacing="${ls}"`);
  if (anchor) attrs.push(`text-anchor="${anchor}"`);
  return `<text ${attrs.join(" ")}>${esc(conteudo)}</text>`;
}

// Retângulo com chanfro no canto inferior direito.
const chanfro = (x, y, w, h, c) =>
  `M${x} ${y}H${x + w}V${y + h - c}L${x + w - c} ${y + h}H${x}Z`;

function defsBase(t, w, h) {
  return `
  <linearGradient id="base" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="${t.bg0}"/><stop offset="0.45" stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/>
  </linearGradient>
  <radialGradient id="g1" cx="0" cy="0" r="0.75"><stop offset="0" stop-color="${t.grad1}"/><stop offset="1" stop-color="${t.grad1.slice(0, 7)}00"/></radialGradient>
  <radialGradient id="g2" cx="1" cy="1" r="0.6"><stop offset="0" stop-color="${t.grad2}"/><stop offset="1" stop-color="${t.grad2.slice(0, 7)}00"/></radialGradient>
  <pattern id="grade" width="48" height="48" patternUnits="userSpaceOnUse">
    <path d="M48 0H0V48" fill="none" stroke="${t.grid}" stroke-width="1"/>
  </pattern>
  <radialGradient id="mascaraG" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
  <mask id="mascara"><rect width="${w}" height="${h}" fill="url(#mascaraG)"/></mask>
  <filter id="sombra" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="${t.shadow}" flood-opacity="${t.shadowOpacity}"/>
  </filter>`;
}

function painel(t, w, h, c = 22) {
  const d = chanfro(0.5, 0.5, w - 1, h - 1, c);
  return `
  <path d="${d}" fill="url(#base)"/>
  <path d="${d}" fill="url(#g1)"/>
  <path d="${d}" fill="url(#g2)"/>
  <path d="${d}" fill="url(#grade)" mask="url(#mascara)"/>
  <path d="${d}" fill="none" stroke="${t.line}"/>`;
}

function card(t, x, y, w, h, { destaque = false, c = 12 } = {}) {
  return `<path d="${chanfro(x, y, w, h, c)}" fill="${t.surface}" stroke="${destaque ? t.priority : t.line}" filter="url(#sombra)"/>`;
}

function eyebrow(t, x, y, str) {
  return `<rect x="${x}" y="${y - 5}" width="26" height="2" fill="${t.orange}"/>` +
    texto(x + 36, y, str, { peso: 600, tamanho: 12.5, cor: t.royal, ls: 1.75, upper: true });
}

function svg(w, h, corpo, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
<defs><style>/*FONTES*/</style>${defs}</defs>${corpo}
</svg>`;
}

// ---------- ícones (simple-icons) ----------

const cacheIcones = {};
async function icone(slugs) {
  const chave = slugs.join("|");
  if (chave in cacheIcones) return cacheIcones[chave];
  for (const slug of slugs) {
    const r = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`);
    if (!r.ok) continue;
    const d = /<path d="([^"]+)"/.exec(await r.text())?.[1];
    if (d) return (cacheIcones[chave] = d);
  }
  console.warn(`Ícone não encontrado: ${chave}`);
  return (cacheIcones[chave] = null);
}

function desenharIcone(d, x, y, tamanho, cor) {
  if (!d) return "";
  const s = tamanho / 24;
  return `<path transform="translate(${x} ${y}) scale(${s})" d="${d}" fill="${cor}"/>`;
}

// ---------- blocos ----------

function header(t) {
  const c = CONTEUDO.header;
  const tile = 150;
  const larguraTexto = W - 2 * P - tile - 40;
  const lead = quebrar(c.lead, { tamanho: 18 }, larguraTexto);
  const yEyebrow = P + 24;
  const yTitulo = yEyebrow + 58;
  const yLead = yTitulo + 42;
  const yStamp = yLead + (lead.length - 1) * 27 + 38;
  const h = Math.max(yStamp + P, tile + 2 * P);
  const tx = W - P - tile;
  const ty = (h - tile) / 2;

  const corpo = painel(t, W, h) +
    eyebrow(t, P, yEyebrow, c.eyebrow) +
    texto(P, yTitulo, c.titulo, { familia: "chakra", peso: 700, tamanho: 46, cor: t.heading, ls: -0.92 }) +
    lead.map((l, i) => texto(P, yLead + i * 27, l, { tamanho: 18, cor: t.muted })).join("") +
    texto(P, yStamp, c.stamp, { peso: 600, tamanho: 13, cor: t.muted, ls: 0.5 }) +
    `<path d="${chanfro(tx, ty, tile, tile, 18)}" fill="url(#tile)" filter="url(#sombra)"/>` +
    texto(tx + tile / 2, ty + tile / 2 + 18, c.monograma, { familia: "chakra", peso: 700, tamanho: 54, cor: "#FFFFFF", anchor: "middle", ls: -1 }) +
    `<rect x="${tx + tile / 2 - 13}" y="${ty + tile / 2 + 36}" width="26" height="3" fill="#FF5A00"/>`;

  const defs = defsBase(t, W, h) +
    `<linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#002B8F"/></linearGradient>`;
  return svg(W, h, corpo, defs);
}

function sobre(t) {
  const c = CONTEUDO.sobre;
  const largura = W - 2 * P;
  const lead = quebrar(c.lead, { tamanho: 17 }, largura);
  const yEyebrow = P + 24;
  const yTitulo = yEyebrow + 46;
  const yLead = yTitulo + 36;
  const yCards = yLead + (lead.length - 1) * 26 + 32;

  const gap = 14;
  const cw = (largura - gap) / 2;
  const pad = 20;
  const blocos = c.cards.map((k) => ({ ...k, linhas: quebrar(k.texto, { tamanho: 14.5 }, cw - 2 * pad) }));
  const alturaCard = (k) => pad + 12 + 26 + 24 + (k.linhas.length - 1) * 21 + pad;
  const linhasGrid = [];
  for (let i = 0; i < blocos.length; i += 2) linhasGrid.push(Math.max(...blocos.slice(i, i + 2).map(alturaCard)));

  let corpoCards = "";
  let y = yCards;
  linhasGrid.forEach((ch, row) => {
    blocos.slice(row * 2, row * 2 + 2).forEach((k, col) => {
      const x = P + col * (cw + gap);
      corpoCards += card(t, x, y, cw, ch, { destaque: k.destaque }) +
        texto(x + pad, y + pad + 12, k.tag, { peso: 700, tamanho: 11.5, cor: t.orange, ls: 1.15, upper: true }) +
        texto(x + pad, y + pad + 12 + 26, k.titulo, { familia: "chakra", peso: 700, tamanho: 18, cor: t.heading }) +
        k.linhas.map((l, i) => texto(x + pad, y + pad + 12 + 26 + 24 + i * 21, l, { tamanho: 14.5, cor: t.muted })).join("");
    });
    y += ch + gap;
  });
  const h = y - gap + P;

  const corpo = painel(t, W, h) +
    eyebrow(t, P, yEyebrow, c.eyebrow) +
    texto(P, yTitulo, c.titulo, { familia: "chakra", peso: 700, tamanho: 32, cor: t.heading, ls: -0.64 }) +
    lead.map((l, i) => texto(P, yLead + i * 26, l, { tamanho: 17, cor: t.muted })).join("") +
    corpoCards;
  return svg(W, h, corpo, defsBase(t, W, h));
}

async function stack(t) {
  const c = CONTEUDO.stack;
  const largura = W - 2 * P;
  const yEyebrow = P + 24;
  const yTitulo = yEyebrow + 46;
  const yGrid = yTitulo + 30;

  const cols = 4;
  const gap = 12;
  const cw = (largura - gap * (cols - 1)) / cols;
  const ch = 92;
  let corpoGrid = "";
  for (const [i, item] of c.principal.entries()) {
    const x = P + (i % cols) * (cw + gap);
    const y = yGrid + Math.floor(i / cols) * (ch + gap);
    corpoGrid += card(t, x, y, cw, ch) +
      texto(x + 18, y + 30, item.tag, { peso: 700, tamanho: 11, cor: t.orange, ls: 1.1, upper: true }) +
      desenharIcone(await icone(item.icone), x + 18, y + 46, 24, t.royal) +
      texto(x + 18 + 24 + 12, y + 65, item.nome, { familia: "chakra", peso: 700, tamanho: 18, cor: t.heading });
  }
  const linhasGrid = Math.ceil(c.principal.length / cols);
  const yOutras = yGrid + linhasGrid * (ch + gap) - gap + 46;

  const chipH = 38;
  const chipPad = 14;
  let x = P;
  let y = yOutras + 20;
  let corpoChips = "";
  for (const item of c.outras) {
    const wTexto = medir(item.nome, { peso: 600, tamanho: 14 });
    const cw2 = chipPad + 16 + 9 + wTexto + chipPad + 4;
    if (x + cw2 > W - P) { x = P; y += chipH + 10; }
    corpoChips += card(t, x, y, cw2, chipH, { c: 8 }) +
      desenharIcone(await icone(item.icone), x + chipPad, y + 11, 16, t.royal) +
      texto(x + chipPad + 16 + 9, y + 24, item.nome, { peso: 600, tamanho: 14, cor: t.text });
    x += cw2 + 10;
  }
  const h = y + chipH + P;

  const corpo = painel(t, W, h) +
    eyebrow(t, P, yEyebrow, c.eyebrow) +
    texto(P, yTitulo, c.titulo, { familia: "chakra", peso: 700, tamanho: 32, cor: t.heading, ls: -0.64 }) +
    corpoGrid +
    eyebrow(t, P, yOutras, c.outrasTitulo) +
    corpoChips;
  return svg(W, h, corpo, defsBase(t, W, h));
}

function statsHeader(t) {
  const c = CONTEUDO.stats;
  const h = 96;
  const corpo =
    eyebrow(t, P, 40, c.eyebrow) +
    texto(P, 82, c.titulo, { familia: "chakra", peso: 700, tamanho: 32, cor: t.heading, ls: -0.64 });
  return svg(W, h, corpo);
}

function footer(t) {
  const c = CONTEUDO.footer;
  const linhas = quebrar(c.nota, { peso: 600, tamanho: 17 }, W - 2 * P);
  const yNota = 44;
  const yStamp = yNota + (linhas.length - 1) * 25 + 28;
  const h = yStamp + 20;
  const corpo =
    `<rect x="${P}" y="12" width="${W - 2 * P}" height="2" fill="${t.orange}"/>` +
    linhas.map((l, i) => texto(P, yNota + i * 25, l, { peso: 600, tamanho: 17, cor: t.text })).join("") +
    texto(P, yStamp, c.stamp, { tamanho: 13, cor: t.muted });
  return svg(W, h, corpo);
}

function seta(x, y, cor) {
  return `<path d="M${x} ${y + 10}L${x + 10} ${y}M${x + 3} ${y}H${x + 10}V${y + 7}" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="square"/>`;
}

function botao(rotulo, { gradiente, marca }) {
  const h = 48;
  const pad = 18;
  const wMarca = marca ? 24 + 12 : 0;
  const wTexto = medir(rotulo, { peso: 600, tamanho: 15, ls: 0.3 });
  const w = Math.ceil(pad + wMarca + wTexto + 14 + 10 + pad);
  let corpo = `<path d="${chanfro(0, 0, w, h, 10)}" fill="url(#bg)"/>`;
  let x = pad;
  if (marca) {
    corpo += `<rect x="${x}" y="12" width="24" height="24" fill="#FFFFFF"/>` +
      texto(x + 12, 29, marca, { familia: "chakra", peso: 700, tamanho: 14, cor: "#002B8F", anchor: "middle" });
    x += wMarca;
  }
  corpo += texto(x, 29.5, rotulo, { peso: 600, tamanho: 15, cor: "#FFFFFF", ls: 0.3 }) +
    seta(x + wTexto + 14, 19, "#FFFFFF");
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${gradiente[0]}"/><stop offset="1" stop-color="${gradiente[1]}"/></linearGradient>`;
  return svg(w, h, corpo, defs);
}

// ---------- build ----------

const arquivos = {};
for (const [nome, t] of Object.entries(TEMAS)) {
  arquivos[`header-${nome}.svg`] = header(t);
  arquivos[`sobre-${nome}.svg`] = sobre(t);
  arquivos[`stack-${nome}.svg`] = await stack(t);
  arquivos[`stats-${nome}.svg`] = statsHeader(t);
  arquivos[`footer-${nome}.svg`] = footer(t);
}
arquivos["btn-linkedin.svg"] = botao(CONTEUDO.botoes.linkedin, { gradiente: ["#2563EB", "#002B8F"], marca: "in" });
arquivos["btn-portfolio.svg"] = botao(CONTEUDO.botoes.portfolio, { gradiente: ["#FF5A00", "#FF7A1A"] });

const subset = await baixarFaces([...usados].join(""));
const fontCss = Object.values(subset).map((f) => {
  const mime = f.formato === "woff2" ? "font/woff2" : f.formato === "woff" ? "font/woff" : "font/ttf";
  return `@font-face{font-family:'${f.familia}';font-weight:${f.peso};src:url(data:${mime};base64,${f.buffer.toString("base64")}) format('${f.formato}');}`;
}).join("");

await fs.mkdir(OUT, { recursive: true });
for (const [nome, conteudo] of Object.entries(arquivos)) {
  await fs.writeFile(path.join(OUT, nome), conteudo.replace("/*FONTES*/", fontCss));
  console.log(`assets/${nome}`);
}
