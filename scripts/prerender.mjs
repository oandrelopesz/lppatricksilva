/**
 * Pré-renderização estática.
 * Roda depois de `vite build` (cliente) e `vite build --ssr` (servidor): injeta o HTML da página em
 * dist/index.html, embute o CSS no <head> e adia o bundle para depois do primeiro frame.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const raiz = path.resolve(import.meta.dirname, "..");
const dist = path.join(raiz, "dist");
const distSsr = path.join(raiz, "dist-ssr");

const entrada = fs.readdirSync(distSsr).find((f) => f.startsWith("entry-server") && f.endsWith(".js"));
if (!entrada) throw new Error("entry-server não encontrado em dist-ssr");

const { render } = await import(pathToFileURL(path.join(distSsr, entrada)).href);
const html = render();

const indexPath = path.join(dist, "index.html");
let index = fs.readFileSync(indexPath, "utf8");

// 1. CSS inline (remove a requisição bloqueante da folha de estilo)
const linkCss = index.match(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/);
if (linkCss) {
  const cssPath = path.join(dist, linkCss[1].replace(/^\//, ""));
  const css = fs.readFileSync(cssPath, "utf8");
  index = index.replace(linkCss[0], `<style>${css}</style>`);
}

// 2. Entrada JS só depois do primeiro frame
const marcaInicio = '<script type="module" crossorigin src="';
const i0 = index.indexOf(marcaInicio);
if (i0 >= 0) {
  const i1 = index.indexOf('"', i0 + marcaInicio.length);
  const src = index.slice(i0 + marcaInicio.length, i1);
  const fim = "</" + "script>";
  const i2 = index.indexOf(fim, i1) + fim.length;
  const tagOriginal = index.slice(i0, i2);
  const substituto =
    `<link rel="modulepreload" crossorigin href="${src}">\n    ` +
    `<script type="module">let d=()=>{d=()=>{};import("${src}")};requestAnimationFrame(()=>setTimeout(()=>d(),0));setTimeout(()=>d(),1500)` +
    fim;
  index = index.replace(tagOriginal, substituto);
}

// 3. HTML pré-renderizado
if (!index.includes('<div id="root"></div>')) throw new Error("#root não encontrado no index.html");
index = index.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

fs.writeFileSync(indexPath, index);
fs.rmSync(distSsr, { recursive: true, force: true });
console.log(`prerender: ${Math.round(html.length / 1024)} KB de HTML injetados em dist/index.html`);
