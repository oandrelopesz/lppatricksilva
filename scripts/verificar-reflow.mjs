/** Teste real de reflow: jsdom não calcula largura nem quebra de linha. Rode após npm run build. */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve, sep } from "node:path";

const raiz = resolve(import.meta.dirname, "../dist");
const chrome = [
  process.env.CHROME_PATH,
  process.platform === "win32" && join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  process.platform === "win32" && join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Microsoft/Edge/Application/msedge.exe"),
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find((arquivo) => arquivo && existsSync(arquivo));
if (!chrome) throw new Error("Chrome ou Edge não encontrado; defina CHROME_PATH para executar o teste de reflow.");
if (!existsSync(join(raiz, "index.html"))) throw new Error("Rode npm run build antes do teste de reflow.");

const teste = `<pre id="resultado" hidden></pre><script>
function medir() {
  const leituras = [];
  for (const escala of [125, 150, 200]) {
    document.documentElement.style.fontSize = escala + '%';
    const controles = document.querySelectorAll('#cta-hero, .aviso-medicao-hero a, .autoavaliacao-opcao, #como-funciona select, #como-funciona button, .faq-pergunta, #rodape a');
    const cortados = [...controles].filter((controle) => {
      const retangulo = controle.getBoundingClientRect();
      return retangulo.width && (retangulo.left < -1 || retangulo.right > innerWidth + 1 || controle.scrollWidth > controle.clientWidth + 1);
    }).map((controle) => controle.tagName + (controle.id ? '#' + controle.id : '.' + controle.className.split(' ')[0]));
    const pontos = [...document.querySelectorAll('.mapa-ma__ponto')].map((ponto) => ponto.getBoundingClientRect());
    let sobrepostos = 0;
    for (let i = 0; i < pontos.length; i++) for (let j = i + 1; j < pontos.length; j++) {
      if (pontos[i].left < pontos[j].right && pontos[i].right > pontos[j].left && pontos[i].top < pontos[j].bottom && pontos[i].bottom > pontos[j].top) sobrepostos++;
    }
    leituras.push({ escala, largura: innerWidth, scroll: document.documentElement.scrollWidth, cortados, sobrepostos, fontes: document.fonts.status });
  }
  parent.document.getElementById('resultado').textContent = btoa(JSON.stringify(leituras));
}
medir();
document.fonts.ready.then(medir);
</script>`;
const frameTeste = readFileSync(join(raiz, "index.html"), "utf8").replace("</body>", `${teste}</body>`);
const paginaTeste = '<!doctype html><html><meta charset="utf-8"><pre id="resultado"></pre><iframe src="/__frame" style="width:320px;height:568px;border:0"></iframe></html>';
const tipos = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".avif": "image/avif", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json" };
const servidor = createServer((pedido, resposta) => {
  const caminho = decodeURIComponent(new URL(pedido.url ?? "/", "http://localhost").pathname);
  if (caminho === "/__reflow") { resposta.setHeader("Content-Type", "text/html; charset=utf-8"); resposta.end(paginaTeste); return; }
  if (caminho === "/__frame") { resposta.setHeader("Content-Type", "text/html; charset=utf-8"); resposta.end(frameTeste); return; }
  const arquivo = resolve(raiz, `.${caminho === "/" ? "/index.html" : caminho}`);
  if (!arquivo.startsWith(raiz + sep) || !existsSync(arquivo)) { resposta.writeHead(404); resposta.end(); return; }
  resposta.setHeader("Content-Type", tipos[extname(arquivo)] ?? "application/octet-stream");
  resposta.end(readFileSync(arquivo));
});

await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
const porta = servidor.address().port;
const perfil = mkdtempSync(join(tmpdir(), "lp-reflow-"));
try {
  const saida = await new Promise((ok, falha) => {
    const processo = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox", `--user-data-dir=${perfil}`, "--window-size=800,700", "--virtual-time-budget=6000", "--dump-dom", `http://127.0.0.1:${porta}/__reflow`], { windowsHide: true });
    let texto = "";
    processo.stdout.on("data", (parte) => { texto += parte; });
    processo.on("error", falha);
    processo.on("close", (codigo) => codigo === 0 ? ok(texto) : falha(new Error(`Chrome terminou com código ${codigo}`)));
  });
  const codificado = saida.match(/<pre id="resultado">([^<]+)<\/pre>/)?.[1];
  if (!codificado) throw new Error(`Chrome não devolveu as medidas de reflow: ${saida.slice(-500)}`);
  const leituras = JSON.parse(Buffer.from(codificado, "base64").toString("utf8"));
  for (const { escala, largura, scroll, cortados, sobrepostos, fontes } of leituras) {
    console.log(`reflow ${escala}%: scrollWidth ${scroll} / viewport ${largura}; controles cortados ${cortados.length}; pontos sobrepostos ${sobrepostos}`);
    if (cortados.length) console.error(`Controles cortados: ${cortados.join(", ")}`);
    if (largura !== 320 || scroll > largura || cortados.length || sobrepostos || fontes !== "loaded") process.exitCode = 1;
  }
} finally {
  servidor.close();
  if (!resolve(perfil).startsWith(resolve(tmpdir()) + sep) || !basename(perfil).startsWith("lp-reflow-")) throw new Error("Diretório temporário inesperado; perfil do Chrome preservado.");
  rmSync(perfil, { recursive: true, force: true });
}
