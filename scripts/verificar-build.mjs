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
];

const PROIBIDOS = [
  ["folha de estilo bloqueante", /<link rel="stylesheet"/],
  ["iframe no HTML inicial", /<iframe/],
  ["placeholder visível", /\[PREENCHER\]/],
  ["travessão", /—/],
  ["referência ao preview", /__preview/],
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
