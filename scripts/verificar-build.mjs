/**
 * Confere o dist/index.html depois do prerender.
 * Cada tarefa acrescenta checagens em EXIGIDOS e PROIBIDOS: [nome, RegExp | (html) => boolean].
 */
import fs from "node:fs";

const html = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
/** Slugs das URLs por seção (mesma lista de src/lib/secoes.ts). */
const SECOES = JSON.parse(fs.readFileSync(new URL("../src/data/secoes.json", import.meta.url), "utf8"));

const EXIGIDOS = [
  ["link para os termos de uso", (h) => h.includes('href="/termos-de-uso.html"')],
  ["HTML pré-renderizado dentro do #root", /<div id="root"><[a-z]/],
  ["CSS embutido no head", /<style>/],
  ["segurador de clique antes do bundle", (h) => {
    const i = h.indexOf('<script id="segurador-clique">');
    const j = h.indexOf('<link rel="modulepreload"');
    return i >= 0 && j > i;
  }],
  ["segurador de clique com menos de 1 KB", (h) => {
    const m = h.match(/<script id="segurador-clique">([\s\S]*?)<\/script>/);
    return !!m && Buffer.byteLength(m[1]) < 1024;
  }],
  ["CTA com data-local-cta no HTML", /data-local-cta="hero"/],
  ["um canonical para a raiz do domínio principal", (h) => (h.match(/<link rel="canonical" href="[^"]*">/g) || []).join() === '<link rel="canonical" href="https://drpatricksantos.com.br/">'],
  ["nenhuma URL do endereço antigo (vercel.app)", (h) => !h.includes("lp-dr-santos.vercel.app")],
  ["JSON-LD no HTML inicial", /<script type="application\/ld\+json">/],
  ["14 locais ligados ao médico no JSON-LD", (h) => (h.match(/#local-/g) || []).length === 28],
  ["aviso de particular", /particular/i],
  ["assinatura com MÉDICO", /MÉDICO/],
  ["CRM-MA 16520", /CRM-MA 16520/],
  ["RQE 7389", /RQE 7389/],
  ["CTA do WhatsApp", /href="https:\/\/wa\.me\/5513996822680\?text=/],
  ["link para #onde-atende", /href="#onde-atende"/],
  ["foto do hero prioritária", /fetchpriority="high"/],
  ["âncoras de todas as seções", (h) => ["para-quem", "como-funciona", "sobre", "onde-atende", "duvidas", "rodape"].every((id) => h.includes(`id="${id}"`))],
  ["FAQ com respostas no HTML", (h) => (h.match(/role="region"/g) || []).length >= 11],
  ["link da política de privacidade", /href="\/politica-de-privacidade\.html"/],
];

const PROIBIDOS = [
  ["folha de estilo bloqueante", /<link rel="stylesheet"/],
  ["iframe no HTML inicial", /<iframe/],
  ["placeholder visível", /\[PREENCHER\]/],
  ["travessão", /—/],
  ["referência ao preview", /__preview/],
  ["BMA na página", /\bBMA\b/],
  ["Instituto na página", /Instituto Patrick Santos/],
  ["aviso de medição no HTML principal (foi para o rodapé)", /O Google mede esta visita/],
];

const passa = (teste) => (typeof teste === "function" ? teste(html) : teste.test(html));

let falhas = 0;
for (const [nome, teste] of EXIGIDOS) if (!passa(teste)) { console.error(`FALTA: ${nome}`); falhas++; }
for (const [nome, teste] of PROIBIDOS) if (passa(teste)) { console.error(`PROIBIDO: ${nome}`); falhas++; }
if (fs.existsSync(new URL("../dist/__preview.html", import.meta.url))) { console.error("PROIBIDO: dist/__preview.html"); falhas++; }

// robots.txt válido no dist (sem ele, o fallback de SPA devolve HTML e o Lighthouse marca robots-txt).
const robots = new URL("../dist/robots.txt", import.meta.url);
if (!fs.existsSync(robots) || !/^User-agent: \*\r?$/m.test(fs.readFileSync(robots, "utf8"))) { console.error("FALTA: dist/robots.txt com User-agent: *"); falhas++; }

// Termos de uso: a página existe, com a data no topo e o link para a política.
const termos = new URL("../dist/termos-de-uso.html", import.meta.url);
const htmlTermos = fs.existsSync(termos) ? fs.readFileSync(termos, "utf8") : null;
if (!htmlTermos) { console.error("FALTA: dist/termos-de-uso.html"); falhas++; }
if (htmlTermos !== null && !htmlTermos.includes("Última atualização: 25 de setembro de 2026.")) { console.error("FALTA: data nos termos de uso"); falhas++; }
if (htmlTermos !== null && !htmlTermos.includes('href="/politica-de-privacidade.html"')) { console.error("FALTA: link da política nos termos de uso"); falhas++; }

// URLs por seção: cada /<slug>/index.html é cópia exata do HTML da raiz (mesmo canonical), e a
// seção com id igual ao slug existe no HTML (senão o sitelink abre no topo sem aviso).
for (const slug of SECOES) {
  if (!html.includes(`id="${slug}"`)) { console.error(`FALTA: seção com id="${slug}"`); falhas++; }
  const copia = new URL(`../dist/${slug}/index.html`, import.meta.url);
  if (!fs.existsSync(copia)) { console.error(`FALTA: dist/${slug}/index.html`); falhas++; continue; }
  if (fs.readFileSync(copia, "utf8") !== html) { console.error(`DIFERENTE: dist/${slug}/index.html`); falhas++; }
}

if (falhas) {
  console.error(`verificar-build: ${falhas} falha(s)`);
  process.exit(1);
}
console.log(`verificar-build: ${EXIGIDOS.length + PROIBIDOS.length + 2 + 3 + 2 * SECOES.length} checagens OK`);
