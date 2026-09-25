/**
 * Confere o dist/index.html depois do prerender.
 * Cada tarefa acrescenta checagens em EXIGIDOS e PROIBIDOS: [nome, RegExp | (html) => boolean].
 */
import fs from "node:fs";

const html = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
/** Slugs das URLs por seção (mesma lista de src/lib/secoes.ts). */
const SECOES = JSON.parse(fs.readFileSync(new URL("../src/data/secoes.json", import.meta.url), "utf8"));

const EXIGIDOS = [
  ["HTML pré-renderizado dentro do #root", /<div id="root"><[a-z]/],
  ["CSS embutido no head", /<style>/],
  ["um canonical para a raiz do site", (h) => (h.match(/<link rel="canonical" href="https:\/\/[^"/]+\/">/g) || []).length === 1],
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
];

const passa = (teste) => (typeof teste === "function" ? teste(html) : teste.test(html));

let falhas = 0;
for (const [nome, teste] of EXIGIDOS) if (!passa(teste)) { console.error(`FALTA: ${nome}`); falhas++; }
for (const [nome, teste] of PROIBIDOS) if (passa(teste)) { console.error(`PROIBIDO: ${nome}`); falhas++; }
if (fs.existsSync(new URL("../dist/__preview.html", import.meta.url))) { console.error("PROIBIDO: dist/__preview.html"); falhas++; }

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
console.log(`verificar-build: ${EXIGIDOS.length + PROIBIDOS.length + 1 + 2 * SECOES.length} checagens OK`);
