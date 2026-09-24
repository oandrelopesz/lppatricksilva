/**
 * Confere o dist/index.html depois do prerender.
 * Cada tarefa acrescenta checagens em EXIGIDOS e PROIBIDOS: [nome, RegExp | (html) => boolean].
 */
import fs from "node:fs";

const html = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

const EXIGIDOS = [
  ["HTML pré-renderizado dentro do #root", /<div id="root"><[a-z]/],
  ["CSS embutido no head", /<style>/],
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

if (falhas) {
  console.error(`verificar-build: ${falhas} falha(s)`);
  process.exit(1);
}
console.log(`verificar-build: ${EXIGIDOS.length + PROIBIDOS.length + 1} checagens OK`);
