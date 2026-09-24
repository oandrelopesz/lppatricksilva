# LP Atendimento Particular MA: Plano de Implementação

> **Para agentes:** execução pelos agentes do canvas Maestri, coordenados pelo Maestro (instrução do André: execução no canvas, não em subagentes internos). Cada tarefa segue TDD (superpowers:test-driven-development) e termina com verificação (superpowers:verification-before-completion). Passos usam checkbox (`- [ ]`).

**Goal:** Construir e publicar na Vercel a landing page de captação do Dr. Patrick Santos (atendimento particular em 14 locais de 11 cidades do Maranhão), com conversão por clique no WhatsApp, medição via GTM e PageSpeed mobile acima de 90.

**Architecture:** Vite + React 18 + TypeScript + Tailwind v4, com HTML pré-renderizado no build (`renderToString` + `scripts/prerender.mjs`) e hidratação depois do primeiro frame. Todas as seções ficam no HTML inicial; só mapas (ao abrir a aba), GTM (após o primeiro frame, com Consent Mode v2) e animação pesada carregam depois. Deploy estático na Vercel.

**Tech Stack:** Node 24, npm 11, Vite, React 18, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vitest + jsdom + Testing Library, ffmpeg (libaom-av1, libwebp), Vercel CLI 60.

**Spec:** `docs/superpowers/specs/2026-09-24-lp-atendimento-particular-ma-design.md` (versão 2). Leia a spec inteira antes da sua primeira tarefa.

## Global Constraints

- WhatsApp único: `5513996822680`; exibição `(13) 99682-2680`.
- Assinatura do médico onde o nome aparecer com destaque: `Dr. Patrick Santos · MÉDICO · CRM-MA 16520 · Ortopedia e Traumatologia · RQE 7389`.
- "Instituto Patrick Santos" e "BMA" não aparecem na página. PRP só nos termos da Resolução CFM 2.464/2026 (spec §13).
- Nenhum dado de saúde (região do corpo, limitação, tratamento) vai para storage, dataLayer, GA4 ou Ads.
- Nenhuma cidade é presumida: sem escolha do usuário ou `?cidade=` válido, a mensagem do WhatsApp é a base.
- Origem: só `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `gclid`, sanitizados; `utm_term` nunca é lido. `page_location` do GA4 = `pagina_limpa`.
- Mapa só no painel aberto e só depois de ação real do usuário; iframe com `referrerPolicy="no-referrer"`.
- Deploy: preview até o marco de produção (Tarefas 8 a 10, C1 e C2 aprovadas, QA sem falha crítica, fatos da política confirmados pelo André); produção depois.
- O marcador `(ref XXXXXX)` é anexado só por `montarMensagem` em `src/lib/whatsapp.ts`; os textos de `src/content/whatsapp.ts` nunca trazem o marcador.
- Nenhum `[PREENCHER]` visível. Dado ausente = `null` em `src/config.ts` e texto que orienta a perguntar no WhatsApp.
- Texto visível só da nota `copy-lp` (aprovada pelo Revisor). Sem travessão (—) em nenhum texto visível.
- Componentes renderizam no servidor: nada de `window`, `document` ou storage durante o render.
- Orçamento: JS inicial ≤ 90 KB gzip; CSS ≤ 25 KB; ≤ 2 fontes pré-carregadas (≤ 60 KB); hero AVIF 720 ≤ 70 KB; nenhum iframe antes de ação do usuário.
- Alvos de toque ≥ 48 px; contraste WCAG AA; corpo ≥ 18 px no mobile; `prefers-reduced-motion` respeitado.
- Commits em conventional commits com descrição em português. Nunca force push na `main`. Nunca copiar credencial para código, commit, log, nota ou spec.

---

## Protocolo de execução (vale para toda tarefa)

1. O Maestro manda a tarefa ao agente com o número da tarefa, o Floor e a branch.
2. O agente trabalha **só no worktree do seu Floor**, na branch indicada criada a partir da `main` atual: `git switch -c <branch> main` (se a branch do Floor já existir e estiver sem commits, use `git switch <branch>` e `git merge --ff-only main`). Rode `npm install` no Floor na primeira tarefa.
3. TDD: teste falhando, implementação mínima, teste passando, commit. Antes de reportar: `npm test` e `npm run build` verdes (a partir da Tarefa 1).
4. O agente reporta com `maestri ask "Maestro" "Tarefa N pronta: branch <b>, commits <hashes>, saída de npm test e npm run build (resumo)"`.
5. O Maestro pede ao Revisor: `git diff main...<branch>` + checklist da spec §13 + critérios da tarefa. Resposta começa com APROVADO ou MUDANÇAS NECESSÁRIAS.
6. Com APROVADO, o Git Manager, no ground: `git merge --no-ff <branch> -m "merge: <branch>"`, `npm test`, `git push origin main`. Conflito: resolve mantendo a intenção de ambos os lados; se houver dúvida, pergunta ao Maestro.
7. A partir da Tarefa 11, o Dev publica depois de cada merge: **preview** da Vercel até o marco de produção (Tarefas 8, 9 e 10 na `main`, copy C1 e C2 aprovadas e QA da Tarefa 12 sem falha crítica); **produção** a partir desse marco.
8. O Maestro atualiza o status na nota `spec-lp-dr-patrick`.

Floors (worktrees do Maestri; caminhos em `maestri floor list`): **Floor Dev** (Dev), **Floor Front** (Designer), **Floor Braçal** (Braçal), **Floor Tracking** (Tracking). O ground (`C:\Users\Andre\LPs\Effect\Dr Patrick Silva`) fica na `main` e roda o servidor de desenvolvimento.

## Mapa de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/vite-env.d.ts`, `src/test/setup.ts` | Projeto, build, testes | 1 |
| `src/main.tsx`, `src/entry-server.tsx`, `src/App.tsx` | Hidratação, SSR, ordem das seções | 1 (App evolui em 4 a 10) |
| `scripts/prerender.mjs`, `scripts/verificar-build.mjs` | Pré-render e checagens do HTML final | 1 (checagens crescem nas tarefas seguintes) |
| `public/__preview.html` | Três telas lado a lado (fora do git) | 1 |
| `src/config.ts` | Médico, WhatsApp, SITE_URL, GTM_ID, pendências | 1 |
| `src/data/locais.ts` | 14 locais, 11 cidades, 2 regiões | 2 |
| `scripts/imagens.mjs`, `public/img/*` | Fotos em AVIF e WebP | 3 |
| `src/data/jsonld.ts`, `src/components/JsonLd.tsx` | Dados estruturados | 4 |
| `src/lib/origem.ts`, `src/lib/whatsapp.ts`, `src/lib/analytics.ts` (mínimo), `src/content/whatsapp.ts`, `src/context/CidadeContext.tsx`, `src/components/CtaWhatsApp.tsx` | Link de agendamento e cidade escolhida | 5 |
| `src/components/AbasCidades.tsx`, `src/components/CartaoLocal.tsx`, `src/sections/S6OndeAtende.tsx`, `src/content/ondeAtende.ts` | Onde atende | 6 |
| `src/styles/*`, `public/fonts/*`, `public/favicon.svg`, `src/components/{Secao,Foto,Topbar,BotaoFlutuante}.tsx`, `src/sections/{S1Topbar,S2Hero}.tsx`, `src/content/*` | Base visual, topbar, hero | 7 |
| `src/sections/S3Identificacao.tsx`, `src/interativos/Autoavaliacao.tsx`, `src/content/{identificacao,autoavaliacao}.ts` | Identificação e interativo A | 8 |
| `src/sections/{S4ComoFunciona,S5Sobre,S7Faq,S8Rodape}.tsx`, `src/components/{SeletorCidade,Accordion}.tsx`, `public/politica-de-privacidade.html` | Demais seções | 9 |
| `src/lib/consentimento.ts`, `src/lib/analytics.ts` (completo), `src/components/AvisoCookies.tsx`, `index.html` (consent default) | Consentimento e tracking | 10 |
| `vercel.json` | Deploy | 11 |

---

### Tarefa 0 (Maestro): Floors e agentes

- [ ] Criar os floors restantes: `maestri floor create "Floor Front" --branch feat/base-visual`, `maestri floor create "Floor Braçal" --branch feat/dados-locais`, `maestri floor create "Floor Tracking" --branch feat/tracking`. O "Floor Dev" já existe (branch `feat/scaffold`).
- [ ] Reiniciar Designer (Codex) com `--add-dir "<worktree do Floor Front>"` e Dev e Tracking (Claude Code) com `--add-dir "<worktree do seu Floor>"`, mantendo papel, modelo, esforço e aprovação automática. O Braçal (Hermes) recebe o caminho do Floor na tarefa.
- [ ] Mandar a Tarefa 1 ao Dev.

### Tarefa 1 (Dev · Floor Dev · `feat/scaffold`): Projeto, pré-render, testes e preview

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/vite-env.d.ts`, `src/test/setup.ts`, `src/main.tsx`, `src/entry-server.tsx`, `src/App.tsx`, `src/config.ts`, `src/styles/global.css`, `scripts/prerender.mjs`, `scripts/verificar-build.mjs`, `public/__preview.html`
- Test: `src/App.test.tsx`, `src/entry-server.test.tsx`

**Interfaces:**
- Produces: `npm test`, `npm run build`, `npm run dev` (porta 8080); `src/config.ts` exporta `MEDICO`, `ASSINATURA`, `WHATSAPP_NUMERO`, `WHATSAPP_EXIBICAO`, `SITE_URL`, `GTM_ID`, `PENDENCIAS`; alias `@/` para `src/`; `scripts/verificar-build.mjs` com as listas `EXIGIDOS` e `PROIBIDOS` que as próximas tarefas estendem.

- [ ] **Step 1: Instalar dependências**

```bash
npm init -y
npm install react@18 react-dom@18
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite typescript @types/react@18 @types/react-dom@18 @types/node vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Se o vitest recusar a versão do vite instalada, instale a versão mais nova do vitest que declara suporte a ela (`npm view vitest peerDependencies`).

- [ ] **Step 2: `package.json` (campos a ajustar)**

```json
{
  "name": "lp-dr-santos",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs && node scripts/verificar-build.mjs",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "imagens": "node scripts/imagens.mjs"
  }
}
```

- [ ] **Step 3: `vite.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "remover-preview-do-build",
      apply: "build",
      closeBundle() {
        const arquivo = path.resolve(import.meta.dirname, "dist/__preview.html");
        if (fs.existsSync(arquivo)) fs.rmSync(arquivo);
      },
    },
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: { port: 8080, strictPort: true, host: true },
  preview: { port: 4173 },
  build: { target: "es2020", cssCodeSplit: false, sourcemap: false },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 4: `tsconfig.json` e `src/vite-env.d.ts`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "node"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "vite.config.ts"]
}
```

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GTM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 5: `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

- [ ] **Step 6: Escrever os testes que falham**

`src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renderiza o nome do médico no título principal", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dr. Patrick Santos");
  });
});
```

`src/entry-server.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "./entry-server";

describe("entry-server", () => {
  it("gera o HTML estático do App", () => {
    expect(render()).toContain("Dr. Patrick Santos");
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL (`./App` e `./entry-server` não existem).

- [ ] **Step 8: Implementação mínima**

`index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dr. Patrick Santos, ortopedista no Maranhão | Atendimento particular</title>
    <meta name="description" content="Dr. Patrick Santos, médico ortopedista (CRM-MA 16520, RQE 7389). Atendimento particular em 14 clínicas e hospitais parceiros de 11 cidades do Maranhão." />
    <meta name="theme-color" content="#15171B" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/styles/global.css`:

```css
@import "tailwindcss";
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Em produção o index.html já vem pré-renderizado: hidrata. Em dev, renderiza do zero.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
```

`src/entry-server.tsx`:

```tsx
import { renderToString } from "react-dom/server";
import App from "./App";

/** Usado só no build: gera o HTML estático da página para o index.html. */
export function render() {
  return renderToString(<App />);
}
```

`src/App.tsx`:

```tsx
export default function App() {
  return (
    <main id="conteudo">
      <h1>Dr. Patrick Santos</h1>
    </main>
  );
}
```

`src/config.ts`:

```ts
/** Dados do médico e da página. Só fatos das fontes da spec (§2). */
export const MEDICO = {
  nome: "Dr. Patrick Santos",
  profissao: "MÉDICO",
  especialidade: "Ortopedia e Traumatologia",
  crmUf: "MA",
  crmNumero: "16520",
  rqeNumero: "7389",
} as const;

export const ASSINATURA = `${MEDICO.nome} · ${MEDICO.profissao} · CRM-${MEDICO.crmUf} ${MEDICO.crmNumero} · ${MEDICO.especialidade} · RQE ${MEDICO.rqeNumero}`;

export const WHATSAPP_NUMERO = "5513996822680";
export const WHATSAPP_EXIBICAO = "(13) 99682-2680";

/** Muda quando o domínio definitivo chegar. */
export const SITE_URL = "https://lp-dr-santos.vercel.app";

export const GTM_ID: string = import.meta.env.VITE_GTM_ID ?? "";

/**
 * Pendências da spec §17. null = a página não mostra o dado e orienta a perguntar no WhatsApp.
 * Nunca exibir placeholder ao público.
 */
export const PENDENCIAS: {
  valorConsulta: string | null;
  formasPagamento: string | null;
  duracaoConsulta: string | null;
  regraRetorno: string | null;
  graduacao: string | null;
  residencia: string | null;
  anosExperiencia: string | null;
} = {
  valorConsulta: null,
  formasPagamento: null,
  duracaoConsulta: null,
  regraRetorno: null,
  graduacao: null,
  residencia: null,
  anosExperiencia: null,
};
```

`scripts/prerender.mjs` (copiar do projeto do Dr. Henrique, sem mudanças de lógica):

```js
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
```

`scripts/verificar-build.mjs`:

```js
/**
 * Confere o dist/index.html depois do prerender.
 * Cada tarefa acrescenta checagens em EXIGIDOS e PROIBIDOS: [nome, RegExp | (html) => boolean].
 */
import fs from "node:fs";

const html = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

const EXIGIDOS = [
  ["HTML pré-renderizado dentro do #root", /<div id="root"><[a-z]/],
  ["CSS embutido no head", /<style>/],
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
```

`public/__preview.html` (fora do git pelo `.gitignore`; removido do build pelo plugin):

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Preview: 3 telas</title>
    <style>
      html, body { margin: 0; height: 100%; background: #1d1f23; color: #e8e8e8; font: 13px system-ui, sans-serif; }
      body { display: flex; gap: 16px; padding: 12px; box-sizing: border-box; align-items: flex-start; }
      .tela { display: flex; flex-direction: column; gap: 6px; }
      .moldura { overflow: hidden; border: 1px solid #444; border-radius: 8px; background: #fff; }
      iframe { border: 0; transform-origin: 0 0; display: block; }
    </style>
  </head>
  <body>
    <script>
      const TELAS = [["Mobile", 390, 844], ["Tablet", 820, 1180], ["Desktop", 1440, 900]];
      function montar() {
        document.body.replaceChildren();
        const larguraTotal = TELAS.reduce((soma, [, w]) => soma + w, 0);
        const alturaMax = Math.max(...TELAS.map(([, , h]) => h));
        const escala = Math.min((innerWidth - 24 - 16 * (TELAS.length - 1)) / larguraTotal, (innerHeight - 48) / alturaMax);
        for (const [nome, w, h] of TELAS) {
          const tela = document.createElement("div");
          tela.className = "tela";
          const rotulo = document.createElement("div");
          rotulo.textContent = `${nome} ${w}x${h}`;
          const moldura = document.createElement("div");
          moldura.className = "moldura";
          moldura.style.width = `${w * escala}px`;
          moldura.style.height = `${h * escala}px`;
          const iframe = document.createElement("iframe");
          iframe.src = "/";
          iframe.width = w;
          iframe.height = h;
          iframe.title = `Preview ${nome}`;
          iframe.style.transform = `scale(${escala})`;
          moldura.append(iframe);
          tela.append(rotulo, moldura);
          document.body.append(tela);
        }
      }
      montar();
      let espera;
      addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(montar, 200); });
    </script>
  </body>
</html>
```

- [ ] **Step 9: Rodar testes e build**

Run: `npm test` → Expected: 2 testes PASS.
Run: `npm run build` → Expected: `prerender: ... KB` e `verificar-build: 8 checagens OK` (2 exigidos + 5 proibidos + arquivo de preview).

- [ ] **Step 10: Conferir o servidor de desenvolvimento**

Run: `npm run dev` em segundo plano e depois `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` e `.../__preview.html`
Expected: `200` e `200`. Encerrar o servidor do Floor depois.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json index.html src scripts
git commit -m "feat: cria projeto com pre-render, testes e preview de tres telas"
```

Reportar ao Maestro conforme o protocolo. Anexar o conteúdo de `public/__preview.html` não é necessário: ele está neste plano.

### Tarefa 1b (Maestro, depois do merge da Tarefa 1): servidor e portais no canvas

- [ ] No ground: `npm install`.
- [ ] Criar `public/__preview.html` no ground com o conteúdo do Step 8 da Tarefa 1 (arquivo ignorado pelo git, por isso não vem no merge).
- [ ] Recrutar o terminal "Servidor LP" (preset Shell) no ground rodando `npm run dev`.
- [ ] Criar dois portais no canvas (skill maestri-portal): "LP ao vivo" em `http://localhost:8080/` e "LP 3 telas" em `http://localhost:8080/__preview.html`.

### Tarefa 2 (Braçal · Floor Braçal · `feat/dados-locais`): Dados dos 14 locais

**Files:**
- Create: `src/data/locais.ts`
- Test: `src/data/locais.test.ts`

**Interfaces:**
- Produces: tipos `RegiaoId`, `Regiao`, `Local`, `Cidade`; constantes `REGIOES`, `CIDADES`; funções `todosOsLocais(): Array<{ cidade: Cidade; local: Local }>`, `buscarCidade(id: string | null | undefined): Cidade | undefined`, `cidadesDaRegiao(regiaoId: RegiaoId): Cidade[]`, `urlEmbedMapa(local: Local): string`.

- [ ] **Step 1: Escrever o teste que falha** (`src/data/locais.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { CIDADES, REGIOES, buscarCidade, cidadesDaRegiao, todosOsLocais, urlEmbedMapa } from "./locais";

describe("locais", () => {
  it("tem 14 locais em 11 cidades e 2 regiões", () => {
    expect(CIDADES).toHaveLength(11);
    expect(todosOsLocais()).toHaveLength(14);
    expect(REGIOES.map((r) => r.id)).toEqual(["sul-maranhense", "centro-maranhense"]);
  });

  it("Balsas tem 3 locais e Barra do Corda tem 2", () => {
    expect(buscarCidade("balsas")?.locais).toHaveLength(3);
    expect(buscarCidade("barra-do-corda")?.locais).toHaveLength(2);
  });

  it("cada região lista as cidades do brief na ordem", () => {
    expect(cidadesDaRegiao("sul-maranhense").map((c) => c.nome)).toEqual([
      "Balsas",
      "São Domingos do Azeitão",
      "São Raimundo das Mangabeiras",
      "Loreto",
    ]);
    expect(cidadesDaRegiao("centro-maranhense").map((c) => c.nome)).toEqual([
      "Presidente Dutra",
      "Fortuna",
      "Gonçalves Dias",
      "São Domingos do Maranhão",
      "Tuntum",
      "Graça Aranha",
      "Barra do Corda",
    ]);
  });

  it("todo local tem nome, endereço com a cidade, logradouro no início e link do brief", () => {
    for (const { cidade, local } of todosOsLocais()) {
      expect(local.nome).not.toBe("");
      expect(local.endereco).toContain(`${cidade.nome}-MA`);
      expect(local.endereco.startsWith(local.logradouro)).toBe(true);
      expect(local.linkComoChegar).toMatch(
        /^https:\/\/(maps\.google\.com\/\?cid=\d+|www\.google\.com\/maps\/search\/\?api=1&query=)/,
      );
    }
  });

  it("ids de cidade e de local são únicos", () => {
    const ids = todosOsLocais().map(({ local }) => local.id);
    expect(new Set(ids).size).toBe(14);
    expect(new Set(CIDADES.map((c) => c.id)).size).toBe(11);
  });

  it("marca os dois hospitais", () => {
    const hospitais = todosOsLocais().filter(({ local }) => local.tipo === "hospital").map(({ local }) => local.nome);
    expect(hospitais).toEqual(["Hospital São José", "Hospital Florêncio Brandes"]);
  });

  it("não inventa dias de atendimento", () => {
    expect(todosOsLocais().every(({ local }) => local.diasAtendimento === undefined)).toBe(true);
  });

  it("buscarCidade ignora id inválido ou vazio", () => {
    expect(buscarCidade("sao-paulo")).toBeUndefined();
    expect(buscarCidade(null)).toBeUndefined();
    expect(buscarCidade(undefined)).toBeUndefined();
  });

  it("monta a URL de embed com nome e endereço", () => {
    const local = buscarCidade("fortuna")!.locais[0];
    const url = new URL(urlEmbedMapa(local));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps");
    expect(url.searchParams.get("output")).toBe("embed");
    expect(url.searchParams.get("q")).toBe("Clínica Risalva Carvalho R. Quinze de Novembro, 741, Fortuna-MA, 65695-000");
  });

  it("usa o nome da ficha do Maps no embed quando ele difere", () => {
    const local = buscarCidade("tuntum")!.locais[0];
    expect(new URL(urlEmbedMapa(local)).searchParams.get("q")).toContain("CMT Centro Médico de Tuntum e Laboratório");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/data/locais.test.ts`
Expected: FAIL (módulo `./locais` não existe).

- [ ] **Step 3: Implementar `src/data/locais.ts`** (endereços e links copiados do brief; não altere nenhum caractere)

```ts
export type RegiaoId = "sul-maranhense" | "centro-maranhense";

export interface Regiao {
  id: RegiaoId;
  nome: string;
}

export interface Local {
  id: string;
  nome: string;
  tipo: "clinica" | "hospital";
  /** Endereço por escrito, exatamente como no brief. É o texto exibido. */
  endereco: string;
  /** Parte do endereço antes da cidade (streetAddress do JSON-LD). */
  logradouro: string;
  cep?: string;
  /** Link "Como chegar", exatamente como no brief. */
  linkComoChegar: string;
  /** Nome da ficha no Google Maps, quando difere do nome exibido. Usado só no embed. */
  nomeNoMaps?: string;
  /** Divergência a reportar ao André. Não é exibida. */
  observacao?: string;
  /** Dias de atendimento. O dossiê não traz; fica ausente. */
  diasAtendimento?: string;
}

export interface Cidade {
  id: string;
  nome: string;
  regiaoId: RegiaoId;
  locais: Local[];
}

export const REGIOES: Regiao[] = [
  { id: "sul-maranhense", nome: "Sul Maranhense" },
  { id: "centro-maranhense", nome: "Centro Maranhense" },
];

export const CIDADES: Cidade[] = [
  {
    id: "balsas",
    nome: "Balsas",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "mais-centro-medico",
        nome: "Mais Centro Médico",
        tipo: "clinica",
        endereco: "R. Antônio Jacobina, 820, Centro, Balsas-MA, 65800-000",
        logradouro: "R. Antônio Jacobina, 820, Centro",
        cep: "65800-000",
        linkComoChegar: "https://maps.google.com/?cid=7437967680173908744",
      },
      {
        id: "hospital-sao-jose",
        nome: "Hospital São José",
        tipo: "hospital",
        endereco: "Praça Dr. Roosevelt Kury, 80, Centro, Balsas-MA, 65800-000",
        logradouro: "Praça Dr. Roosevelt Kury, 80, Centro",
        cep: "65800-000",
        linkComoChegar: "https://maps.google.com/?cid=11424565659597188283",
      },
      {
        id: "clinica-mais-saude",
        nome: "Clínica Mais Saúde",
        tipo: "clinica",
        endereco: "Av. Seis, nº 10, QD 03, Cohab I, próximo à UPA, Balsas-MA, 65800-000",
        logradouro: "Av. Seis, nº 10, QD 03, Cohab I, próximo à UPA",
        cep: "65800-000",
        linkComoChegar: "https://maps.google.com/?cid=6068533600021052492",
      },
    ],
  },
  {
    id: "sao-domingos-do-azeitao",
    nome: "São Domingos do Azeitão",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "clinica-santa-maria",
        nome: "Clínica Santa Maria",
        tipo: "clinica",
        endereco: "Av. Mário Bezerra, nº 02, Ed. Carjás, Centro, São Domingos do Azeitão-MA, 65888-000",
        logradouro: "Av. Mário Bezerra, nº 02, Ed. Carjás, Centro",
        cep: "65888-000",
        linkComoChegar: "https://maps.google.com/?cid=15321157887920026297",
      },
    ],
  },
  {
    id: "sao-raimundo-das-mangabeiras",
    nome: "São Raimundo das Mangabeiras",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "mendesclin",
        nome: "Mendesclin",
        tipo: "clinica",
        endereco: "Praça do Mercado Central, nº 14, São Raimundo das Mangabeiras-MA, 65840-000",
        logradouro: "Praça do Mercado Central, nº 14",
        cep: "65840-000",
        linkComoChegar: "https://maps.google.com/?cid=9740273424993758535",
        observacao: "A ficha do Google Maps mostra R. Gonçalves Dias; a página exibe o endereço escrito no brief.",
      },
    ],
  },
  {
    id: "loreto",
    nome: "Loreto",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "clinimed",
        nome: "Clinimed",
        tipo: "clinica",
        endereco: "Rua 28 de Julho, Centro, Loreto-MA, 65895-000",
        logradouro: "Rua 28 de Julho, Centro",
        cep: "65895-000",
        linkComoChegar: "https://www.google.com/maps/search/?api=1&query=Clinimed+Rua+28+de+Julho+Centro+Loreto+MA",
        observacao: "Sem número no endereço e sem ficha no Google Maps.",
      },
    ],
  },
  {
    id: "presidente-dutra",
    nome: "Presidente Dutra",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "clinica-levive",
        nome: "Clínica Levive",
        tipo: "clinica",
        endereco: "R. 28 de Junho Sul, 583B, Centro, Presidente Dutra-MA, 65760-000",
        logradouro: "R. 28 de Junho Sul, 583B, Centro",
        cep: "65760-000",
        linkComoChegar: "https://maps.google.com/?cid=17164339941155462225",
        observacao: "O dossiê mostra peças da Clínica Pró Saúde em Presidente Dutra; confirmar o local atual.",
      },
    ],
  },
  {
    id: "fortuna",
    nome: "Fortuna",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "clinica-risalva-carvalho",
        nome: "Clínica Risalva Carvalho",
        tipo: "clinica",
        endereco: "R. Quinze de Novembro, 741, Fortuna-MA, 65695-000",
        logradouro: "R. Quinze de Novembro, 741",
        cep: "65695-000",
        linkComoChegar: "https://maps.google.com/?cid=11359199694068869673",
      },
    ],
  },
  {
    id: "goncalves-dias",
    nome: "Gonçalves Dias",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "begmed",
        nome: "BegMed Centro de Especialidades",
        tipo: "clinica",
        endereco: "R. Almir Assis, 44, Centro, Gonçalves Dias-MA, 65775-000",
        logradouro: "R. Almir Assis, 44, Centro",
        cep: "65775-000",
        linkComoChegar: "https://maps.google.com/?cid=12044711327520027163",
      },
    ],
  },
  {
    id: "sao-domingos-do-maranhao",
    nome: "São Domingos do Maranhão",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "sd-med",
        nome: "SD MED",
        tipo: "clinica",
        endereco: "R. Quinze de Novembro, 49B, Centro, São Domingos do Maranhão-MA, 65790-000",
        logradouro: "R. Quinze de Novembro, 49B, Centro",
        cep: "65790-000",
        linkComoChegar: "https://maps.google.com/?cid=8715891456907011906",
      },
    ],
  },
  {
    id: "tuntum",
    nome: "Tuntum",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "cm-lab-tuntum",
        nome: "CM LAB (matriz)",
        tipo: "clinica",
        endereco: "R. dos Andrades, 58, Centro, Tuntum-MA, 65763-000",
        logradouro: "R. dos Andrades, 58, Centro",
        cep: "65763-000",
        linkComoChegar: "https://maps.google.com/?cid=8849807200489165564",
        nomeNoMaps: "CMT Centro Médico de Tuntum e Laboratório",
      },
    ],
  },
  {
    id: "graca-aranha",
    nome: "Graça Aranha",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "cm-lab-graca-aranha",
        nome: "CM LAB (filial)",
        tipo: "clinica",
        endereco: "Rua São Francisco, s/n, Centro, Graça Aranha-MA",
        logradouro: "Rua São Francisco, s/n, Centro",
        linkComoChegar: "https://www.google.com/maps/search/?api=1&query=CM+LAB+Rua+Sao+Francisco+Centro+Graca+Aranha+MA",
        observacao: "Sem número no endereço e sem ficha no Google Maps.",
      },
    ],
  },
  {
    id: "barra-do-corda",
    nome: "Barra do Corda",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "clinica-mais-familia",
        nome: "Clínica Mais Família",
        tipo: "clinica",
        endereco: "R. Gerôncio Falcão, 263-A, Centro, Barra do Corda-MA, 65950-000",
        logradouro: "R. Gerôncio Falcão, 263-A, Centro",
        cep: "65950-000",
        linkComoChegar: "https://maps.google.com/?cid=492768669301912196",
        observacao: "Sem ficha própria no Google Maps; o link aponta para o endereço.",
      },
      {
        id: "hospital-florencio-brandes",
        nome: "Hospital Florêncio Brandes",
        tipo: "hospital",
        endereco: "R. Gonçalves Dias, 500, Barra do Corda-MA, 65950-000",
        logradouro: "R. Gonçalves Dias, 500",
        cep: "65950-000",
        linkComoChegar: "https://maps.google.com/?cid=16982940995158165296",
      },
    ],
  },
];

export function todosOsLocais(): Array<{ cidade: Cidade; local: Local }> {
  return CIDADES.flatMap((cidade) => cidade.locais.map((local) => ({ cidade, local })));
}

export function buscarCidade(id: string | null | undefined): Cidade | undefined {
  if (!id) return undefined;
  return CIDADES.find((cidade) => cidade.id === id);
}

export function cidadesDaRegiao(regiaoId: RegiaoId): Cidade[] {
  return CIDADES.filter((cidade) => cidade.regiaoId === regiaoId);
}

export function urlEmbedMapa(local: Local): string {
  const params = new URLSearchParams({ q: `${local.nomeNoMaps ?? local.nome} ${local.endereco}`, output: "embed" });
  return `https://www.google.com/maps?${params.toString()}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/data/locais.test.ts` → Expected: 10 testes PASS. Depois `npm test` e `npm run build` verdes.

- [ ] **Step 5: Commit**

```bash
git add src/data/locais.ts src/data/locais.test.ts
git commit -m "feat: adiciona dados dos 14 locais de atendimento"
```

### Tarefa 3 (Braçal · Floor Braçal · `feat/imagens`): Fotos em AVIF e WebP

**Files:**
- Create: `scripts/imagens.mjs`, `public/img/{hero,sobre,consulta,cta-final}-{480,720,960,1280}.{avif,webp}` (32 arquivos)
- Test: `src/test/imagens.test.ts`

**Interfaces:**
- Produces: imagens em `/img/<nome>-<largura>.<avif|webp>`, recorte 4:5 (largura x 1,25 de altura). Nomes: `hero`, `sobre`, `consulta`, `cta-final`.

- [ ] **Step 1: Escrever o teste que falha** (`src/test/imagens.test.ts`)

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pasta = path.resolve(process.cwd(), "public/img");
const NOMES = ["hero", "sobre", "consulta", "cta-final"];
const LARGURAS = [480, 720, 960, 1280];
const FORMATOS = ["avif", "webp"];

describe("imagens geradas", () => {
  for (const nome of NOMES)
    for (const largura of LARGURAS)
      for (const formato of FORMATOS)
        it(`existe ${nome}-${largura}.${formato}`, () => {
          expect(fs.existsSync(path.join(pasta, `${nome}-${largura}.${formato}`))).toBe(true);
        });

  it("hero AVIF 720 cabe no orçamento de 70 KB", () => {
    expect(fs.statSync(path.join(pasta, "hero-720.avif")).size).toBeLessThanOrEqual(70 * 1024);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/test/imagens.test.ts` → Expected: FAIL (arquivos não existem).

- [ ] **Step 3: Implementar `scripts/imagens.mjs`**

```js
/**
 * Gera as fotos da LP em AVIF e WebP a partir de fotos-originais/ (fora do git).
 * Originais: 3376x6000. Recorte 4:5 (3376x4220) a partir do y indicado.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const origem = path.join(raiz, "fotos-originais");
const destino = path.join(raiz, "public", "img");
const LARGURAS = [480, 720, 960, 1280];

const FOTOS = [
  { nome: "hero", arquivo: "_DSC2060.jpg", y: 600 },
  { nome: "sobre", arquivo: "_DSC2069.jpg", y: 1000 },
  { nome: "consulta", arquivo: "_DSC2001.jpg", y: 1000 },
  { nome: "cta-final", arquivo: "_DSC1992.jpg", y: 900 },
];

fs.mkdirSync(destino, { recursive: true });

for (const foto of FOTOS) {
  const entrada = path.join(origem, foto.arquivo);
  if (!fs.existsSync(entrada)) throw new Error(`Foto não encontrada: ${entrada}`);
  for (const largura of LARGURAS) {
    const filtro = `crop=3376:4220:0:${foto.y},scale=${largura}:-2:flags=lanczos`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", entrada, "-vf", filtro, "-c:v", "libwebp", "-quality", "78", path.join(destino, `${foto.nome}-${largura}.webp`)]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", entrada, "-vf", filtro, "-pix_fmt", "yuv420p", "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "34", "-cpu-used", "6", path.join(destino, `${foto.nome}-${largura}.avif`)]);
  }
  console.log(`imagens: ${foto.nome} ok`);
}
```

- [ ] **Step 4: Gerar e conferir**

Run: `npm run imagens` e depois `npx vitest run src/test/imagens.test.ts` → Expected: 33 testes PASS. Se o hero AVIF 720 passar de 70 KB, suba o `-crf` de 2 em 2 até caber e registre o valor no commit. Abra `public/img/hero-720.webp` e confirme que cabeça e jaleco aparecem inteiros no recorte; se não, ajuste o `y` da foto e gere de novo.

- [ ] **Step 5: Commit**

```bash
git add scripts/imagens.mjs public/img src/test/imagens.test.ts
git commit -m "feat: gera fotos da LP em AVIF e WebP"
```

### Tarefa 4 (Braçal · Floor Braçal · `feat/jsonld`): Dados estruturados

**Files:**
- Create: `src/data/jsonld.ts`, `src/components/JsonLd.tsx`
- Modify: `src/App.tsx` (renderizar `<JsonLd />` no fim do `<main>`), `scripts/verificar-build.mjs` (checagens novas)
- Test: `src/data/jsonld.test.ts`

**Interfaces:**
- Consumes: `todosOsLocais()` (Tarefa 2); `MEDICO`, `SITE_URL`, `WHATSAPP_NUMERO` (Tarefa 1); `/img/hero-960.webp` (Tarefa 3).
- Produces: `gerarJsonLd()`, `jsonLdComoTexto(): string`, `idDoLocal(localId: string): string`, componente `JsonLd`.

- [ ] **Step 1: Escrever o teste que falha** (`src/data/jsonld.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { gerarJsonLd, idDoLocal, jsonLdComoTexto } from "./jsonld";

type No = { "@type": string; "@id": string; [chave: string]: unknown };

describe("jsonld", () => {
  const grafo = gerarJsonLd()["@graph"] as No[];

  it("tem 1 médico, 12 clínicas e 2 hospitais", () => {
    expect(grafo.filter((n) => n["@type"] === "IndividualPhysician")).toHaveLength(1);
    expect(grafo.filter((n) => n["@type"] === "MedicalClinic")).toHaveLength(12);
    expect(grafo.filter((n) => n["@type"] === "Hospital")).toHaveLength(2);
  });

  it("practicesAt aponta para os 14 locais", () => {
    const medico = grafo[0] as No & { practicesAt: Array<{ "@id": string }> };
    const idsLocais = grafo.slice(1).map((n) => n["@id"]);
    expect(medico.practicesAt.map((p) => p["@id"])).toEqual(idsLocais);
    expect(idsLocais).toContain(idDoLocal("mendesclin"));
  });

  it("identifica CRM-MA e RQE", () => {
    const medico = grafo[0] as No & { identifier: Array<{ propertyID: string; value: string }> };
    expect(medico.identifier).toEqual([
      { "@type": "PropertyValue", propertyID: "CRM-MA", value: "16520" },
      { "@type": "PropertyValue", propertyID: "RQE", value: "7389" },
    ]);
  });

  it("local sem CEP não ganha postalCode", () => {
    const graca = grafo.find((n) => n["@id"] === idDoLocal("cm-lab-graca-aranha")) as No & { address: Record<string, string> };
    expect(graca.address.postalCode).toBeUndefined();
    expect(graca.address.addressLocality).toBe("Graça Aranha");
  });

  it("o texto não tem < cru", () => {
    expect(jsonLdComoTexto()).not.toContain("<");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/data/jsonld.test.ts` → Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

`src/data/jsonld.ts`:

```ts
import { MEDICO, SITE_URL, WHATSAPP_NUMERO } from "@/config";
import { todosOsLocais } from "@/data/locais";

export function idDoLocal(localId: string): string {
  return `${SITE_URL}/#local-${localId}`;
}

export function gerarJsonLd() {
  const locais = todosOsLocais().map(({ cidade, local }) => ({
    "@type": local.tipo === "hospital" ? "Hospital" : "MedicalClinic",
    "@id": idDoLocal(local.id),
    name: local.nome,
    address: {
      "@type": "PostalAddress",
      streetAddress: local.logradouro,
      addressLocality: cidade.nome,
      addressRegion: "MA",
      ...(local.cep ? { postalCode: local.cep } : {}),
      addressCountry: "BR",
    },
    hasMap: local.linkComoChegar,
  }));

  const medico = {
    "@type": "IndividualPhysician",
    "@id": `${SITE_URL}/#medico`,
    name: MEDICO.nome,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/img/hero-960.webp`,
    telephone: `+${WHATSAPP_NUMERO}`,
    medicalSpecialty: "https://schema.org/Musculoskeletal",
    identifier: [
      { "@type": "PropertyValue", propertyID: `CRM-${MEDICO.crmUf}`, value: MEDICO.crmNumero },
      { "@type": "PropertyValue", propertyID: "RQE", value: MEDICO.rqeNumero },
    ],
    practicesAt: locais.map((local) => ({ "@id": local["@id"] })),
  };

  return { "@context": "https://schema.org", "@graph": [medico, ...locais] };
}

export function jsonLdComoTexto(): string {
  return JSON.stringify(gerarJsonLd()).replace(/</g, "\\u003c");
}
```

`src/components/JsonLd.tsx`:

```tsx
import { jsonLdComoTexto } from "@/data/jsonld";

export function JsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdComoTexto() }} />;
}
```

Em `src/App.tsx`, importar `JsonLd` de `@/components/JsonLd` e renderizar `<JsonLd />` como último filho do `<main>`.

Em `scripts/verificar-build.mjs`, acrescentar a `EXIGIDOS`:

```js
  ["JSON-LD no HTML inicial", /<script type="application\/ld\+json">/],
  ["14 locais ligados ao médico no JSON-LD", (h) => (h.match(/#local-/g) || []).length === 28],
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test` e `npm run build` → Expected: tudo PASS; `verificar-build` com as duas checagens novas OK. Validar o JSON (copiar o conteúdo do script do `dist/index.html`) em https://validator.schema.org/ e anotar o resultado no relatório.

- [ ] **Step 5: Commit**

```bash
git add src/data/jsonld.ts src/data/jsonld.test.ts src/components/JsonLd.tsx src/App.tsx scripts/verificar-build.mjs
git commit -m "feat: adiciona JSON-LD do medico e dos 14 locais"
```

### Tarefa 5 (Dev · Floor Dev · `feat/whatsapp`): Origem, link do WhatsApp, cidade escolhida e CTA

**Files:**
- Create: `src/lib/origem.ts`, `src/lib/whatsapp.ts`, `src/lib/analytics.ts`, `src/content/whatsapp.ts`, `src/context/CidadeContext.tsx`, `src/components/CtaWhatsApp.tsx`
- Modify: `src/App.tsx` (envolver o conteúdo em `<CidadeProvider>`)
- Test: `src/lib/origem.test.ts`, `src/lib/whatsapp.test.ts`, `src/components/CtaWhatsApp.test.tsx`

**Interfaces:**
- Consumes: `buscarCidade`, `Cidade` (Tarefa 2); `WHATSAPP_NUMERO` (Tarefa 1).
- Produces:
  - `origem.ts`: `interface Origem { ref: string; gclid?; utm_source?; utm_medium?; utm_campaign?; utm_content?; cidade? }`, `gerarRef(aleatorio?): string`, `sanitizar(chave: string, valor: string | null): string | undefined`, `capturarOrigem(search: string, storage: Storage | null, aleatorio?): Origem`, `obterOrigem(): Origem`, `urlLimpa(href: string): string`, `reiniciarOrigemParaTestes(): void`. `utm_term` nunca é capturado (texto livre).
  - `whatsapp.ts`: `interface PedidoWhatsApp { cidade?: string; local?: string; resumo?: string; ref: string }`, `montarMensagem(p): string`, `montarLinkWhatsApp(p): string`, `LINK_WHATSAPP_BASE: string`. Com `resumo`, a mensagem não leva `ref`.
  - `analytics.ts` (mínimo, o Tracking completa na Tarefa 10 sem mudar a assinatura): `type ParametrosEvento = Record<string, string | number | undefined>`, `interface OpcoesEvento { aoConcluir?: () => void; tempoLimiteMs?: number }`, `track(evento: string, params?: ParametrosEvento, opcoes?: OpcoesEvento): void`.
  - `CidadeContext.tsx`: `type FonteEscolha = "url" | "aba" | "seletor"`, `CidadeProvider`, `useCidade(): { cidade: Cidade | undefined; fonte: FonteEscolha | undefined; escolherCidade(id: string, fonte: FonteEscolha): void }`.
  - `CtaWhatsApp.tsx`: `type LocalCta = "topbar" | "hero" | "identificacao" | "autoavaliacao" | "como_funciona" | "sobre" | "onde_atende" | "faq" | "rodape" | "flutuante"`; `<CtaWhatsApp localCta cidadeFixa? local? resumo? className? id? children />`; `navegacao.ir(url)` (troca nos testes).

Comportamento do clique (spec §7 e parecer R2): o `href` pré-renderizado é o link base (funciona sem JavaScript). Com JavaScript, o clique simples monta o link completo, faz `preventDefault`, põe `clique_whatsapp` no `dataLayer` com `eventCallback` e `eventTimeout` e navega na mesma aba quando o GTM confirma ou quando o tempo-limite de 800 ms vence (o que vier primeiro, uma vez só). Clique com Ctrl, Cmd, Shift ou botão do meio segue o comportamento do navegador (nova aba) e só registra o evento.

- [ ] **Step 1: Escrever os testes que falham**

`src/lib/origem.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { capturarOrigem, gerarRef, reiniciarOrigemParaTestes, sanitizar, urlLimpa } from "./origem";

function storageFalso(): Storage {
  const mapa = new Map<string, string>();
  return {
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => void mapa.set(k, v),
    removeItem: (k: string) => void mapa.delete(k),
    clear: () => mapa.clear(),
    key: () => null,
    get length() {
      return mapa.size;
    },
  } as Storage;
}

describe("origem", () => {
  beforeEach(() => reiniciarOrigemParaTestes());

  it("gera ref de 6 caracteres sem caracteres ambíguos", () => {
    expect(gerarRef()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it("captura UTMs permitidos e gclid, e nunca utm_term", () => {
    const o = capturarOrigem("?utm_source=google&utm_medium=cpc&utm_campaign=g1_dor&utm_term=dor+no+joelho&gclid=Cj0abc_1", storageFalso());
    expect(o).toMatchObject({ utm_source: "google", utm_medium: "cpc", utm_campaign: "g1_dor", gclid: "Cj0abc_1" });
    expect(o).not.toHaveProperty("utm_term");
  });

  it("descarta valores com espaço, acento, @ ou longos demais", () => {
    expect(sanitizar("utm_campaign", "dor no joelho")).toBeUndefined();
    expect(sanitizar("utm_content", "maria@email.com")).toBeUndefined();
    expect(sanitizar("utm_source", "joão")).toBeUndefined();
    expect(sanitizar("utm_source", "a".repeat(101))).toBeUndefined();
    expect(sanitizar("utm_source", "google")).toBe("google");
  });

  it("mantém ref e UTMs da sessão quando a URL vem sem parâmetros", () => {
    const storage = storageFalso();
    const primeira = capturarOrigem("?utm_source=google&utm_content=a1", storage);
    reiniciarOrigemParaTestes();
    const segunda = capturarOrigem("", storage);
    expect(segunda.ref).toBe(primeira.ref);
    expect(segunda).toMatchObject({ utm_source: "google", utm_content: "a1" });
  });

  it("uma campanha nova substitui o conjunto anterior de UTMs", () => {
    const storage = storageFalso();
    capturarOrigem("?utm_source=google&utm_content=a1", storage);
    reiniciarOrigemParaTestes();
    const nova = capturarOrigem("?utm_source=meta", storage);
    expect(nova.utm_source).toBe("meta");
    expect(nova.utm_content).toBeUndefined();
  });

  it("a cidade vale só para a navegação atual", () => {
    const storage = storageFalso();
    expect(capturarOrigem("?cidade=loreto", storage).cidade).toBe("loreto");
    reiniciarOrigemParaTestes();
    expect(capturarOrigem("", storage).cidade).toBeUndefined();
    reiniciarOrigemParaTestes();
    expect(capturarOrigem("?cidade=recife", storage).cidade).toBeUndefined();
  });

  it("funciona com storage que lança erro", () => {
    const quebrado = {
      getItem() {
        throw new Error("bloqueado");
      },
      setItem() {
        throw new Error("bloqueado");
      },
    } as unknown as Storage;
    expect(capturarOrigem("?utm_source=google", quebrado).utm_source).toBe("google");
  });

  it("urlLimpa mantém só parâmetros permitidos e válidos", () => {
    const limpa = urlLimpa("https://lp-dr-santos.vercel.app/?utm_source=google&utm_term=dor+no+joelho&nome=Maria&cidade=tuntum#duvidas");
    expect(limpa).toBe("https://lp-dr-santos.vercel.app/?utm_source=google&cidade=tuntum");
  });
});
```

`src/lib/whatsapp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MENSAGENS_WHATSAPP } from "@/content/whatsapp";
import { LINK_WHATSAPP_BASE, montarLinkWhatsApp, montarMensagem } from "./whatsapp";

describe("whatsapp", () => {
  it("o link base aponta para o número único", () => {
    expect(LINK_WHATSAPP_BASE.startsWith("https://wa.me/5513996822680?text=")).toBe(true);
  });

  it("sem cidade usa a mensagem base e termina com a ref", () => {
    const m = montarMensagem({ ref: "ABC234" });
    expect(m.startsWith(MENSAGENS_WHATSAPP.base)).toBe(true);
    expect(m.endsWith("(ref ABC234)")).toBe(true);
  });

  it("com cidade usa a mensagem da cidade", () => {
    expect(montarMensagem({ cidade: "Tuntum", ref: "ABC234" })).toBe(`${MENSAGENS_WHATSAPP.comCidade("Tuntum")} (ref ABC234)`);
  });

  it("com local usa cidade e local", () => {
    expect(montarMensagem({ cidade: "Balsas", local: "Hospital São José", ref: "ABC234" })).toBe(
      `${MENSAGENS_WHATSAPP.comLocal("Balsas", "Hospital São José")} (ref ABC234)`,
    );
  });

  it("com resumo, inclui o resumo e não leva a ref", () => {
    const m = montarMensagem({ resumo: "Marquei no site: joelho.", ref: "ABC234" });
    expect(m).toContain("Marquei no site: joelho.");
    expect(m).not.toContain("ABC234");
  });

  it("codifica a mensagem na URL", () => {
    const url = montarLinkWhatsApp({ cidade: "São Domingos do Azeitão", ref: "ABC234" });
    expect(url).not.toContain(" ");
    expect(new URL(url).searchParams.get("text")).toContain("São Domingos do Azeitão");
  });
});
```

`src/components/CtaWhatsApp.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider, useCidade } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { CtaWhatsApp, navegacao } from "./CtaWhatsApp";

function EscolherTuntum() {
  const { escolherCidade } = useCidade();
  return <button onClick={() => escolherCidade("tuntum", "aba")}>escolher</button>;
}

const textoDe = (url: string) => new URL(url).searchParams.get("text")!;

describe("CtaWhatsApp", () => {
  const irOriginal = navegacao.ir;

  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    navegacao.ir = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    navegacao.ir = irOriginal;
    vi.useRealTimers();
  });

  it("no HTML inicial aponta para o link base (funciona sem JavaScript)", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    expect(screen.getByRole("link", { name: "Agendar" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5513996822680\?text=/);
  });

  it("clique simples registra o evento e navega uma vez quando o GTM confirma", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Agendar" }));
    const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    expect(evento).toMatchObject({ local_cta: "hero", eventTimeout: 800 });
    expect(navegacao.ir).not.toHaveBeenCalled();
    (evento.eventCallback as () => void)();
    vi.advanceTimersByTime(1000);
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
    const url = vi.mocked(navegacao.ir).mock.calls[0][0];
    expect(textoDe(url)).toMatch(/\(ref [A-HJ-NP-Z2-9]{6}\)$/);
    expect(textoDe(url)).not.toContain("Balsas");
  });

  it("sem GTM, navega depois do tempo-limite", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="faq">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Agendar" }));
    vi.advanceTimersByTime(799);
    expect(navegacao.ir).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
  });

  it("clique com Ctrl deixa o navegador abrir nova aba e só registra o evento", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="rodape">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    fireEvent.click(link, { ctrlKey: true });
    vi.advanceTimersByTime(1000);
    expect(navegacao.ir).not.toHaveBeenCalled();
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", local_cta: "rodape" }));
    expect(textoDe(link.getAttribute("href")!)).toMatch(/\(ref /);
  });

  it("depois que o usuário escolhe a cidade, o clique inclui a cidade", () => {
    render(
      <CidadeProvider>
        <EscolherTuntum />
        <CtaWhatsApp localCta="faq">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByText("escolher"));
    fireEvent.click(screen.getByRole("link", { name: "Agendar" }));
    vi.advanceTimersByTime(800);
    expect(textoDe(vi.mocked(navegacao.ir).mock.calls[0][0])).toContain("Tuntum");
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", cidade: "Tuntum" }));
  });

  it("CTA de local manda cidade e local; o resumo nunca vai para o evento", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="onde_atende" cidadeFixa="Balsas" local="Hospital São José" resumo="Marquei no site: joelho.">
          Agendar em Balsas
        </CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Agendar em Balsas" }));
    vi.advanceTimersByTime(800);
    const texto = textoDe(vi.mocked(navegacao.ir).mock.calls[0][0]);
    expect(texto).toContain("Balsas");
    expect(texto).toContain("Hospital São José");
    expect(texto).toContain("Marquei no site: joelho.");
    const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    expect(JSON.stringify(evento)).not.toContain("joelho");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test` → Expected: FAIL nos três arquivos (módulos não existem).

- [ ] **Step 3: Implementar**

`src/lib/origem.ts`:

```ts
import { buscarCidade } from "@/data/locais";

/** Origem da visita. Só parâmetros permitidos e sanitizados; nenhum texto livre. */
export interface Origem {
  ref: string;
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  /** id de cidade da navegação atual (?cidade=), só se existir em locais.ts. Não persiste. */
  cidade?: string;
}

const CHAVE = "lp_origem_v1";
/** utm_term fica de fora de propósito: é a palavra buscada (texto livre) e pode conter sintoma. */
const UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const CAMPOS = [...UTMS, "gclid"] as const;
const PADRAO_UTM = /^[A-Za-z0-9_.-]{1,100}$/;
const PADRAO_GCLID = /^[A-Za-z0-9_-]{1,200}$/;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let emMemoria: Origem | null = null;

export function gerarRef(aleatorio: () => number = Math.random): string {
  let ref = "";
  for (let i = 0; i < 6; i++) ref += ALFABETO[Math.floor(aleatorio() * ALFABETO.length)];
  return ref;
}

export function sanitizar(chave: string, valor: string | null): string | undefined {
  if (!valor) return undefined;
  const padrao = chave === "gclid" ? PADRAO_GCLID : PADRAO_UTM;
  return padrao.test(valor) ? valor : undefined;
}

function ler(storage: Storage | null): Origem | null {
  if (!storage) return null;
  try {
    const bruto = storage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Origem) : null;
  } catch {
    return null;
  }
}

function gravar(storage: Storage | null, origem: Origem): void {
  if (!storage) return;
  try {
    const { cidade: _naoPersiste, ...persistir } = origem;
    void _naoPersiste;
    storage.setItem(CHAVE, JSON.stringify(persistir));
  } catch {
    /* storage bloqueado: a origem fica só em memória */
  }
}

function sessionStorageSeguro(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function capturarOrigem(search: string, storage: Storage | null, aleatorio: () => number = Math.random): Origem {
  const anterior = ler(storage) ?? emMemoria;
  const params = new URLSearchParams(search);
  const origem: Origem = { ref: anterior?.ref ?? gerarRef(aleatorio) };

  // Campanha nova (algum parâmetro válido na URL) substitui o conjunto; sem parâmetros, mantém o da sessão.
  const campanhaNova = CAMPOS.some((chave) => sanitizar(chave, params.get(chave)));
  for (const chave of CAMPOS) {
    const valor = campanhaNova ? sanitizar(chave, params.get(chave)) : anterior?.[chave];
    if (valor) origem[chave] = valor;
  }

  // Cidade: só da URL desta navegação.
  const cidade = buscarCidade(params.get("cidade"));
  if (cidade) origem.cidade = cidade.id;

  emMemoria = origem;
  gravar(storage, origem);
  return origem;
}

/** Só no navegador (efeitos e cliques). No servidor devolve uma origem vazia. */
export function obterOrigem(): Origem {
  if (emMemoria) return emMemoria;
  if (typeof window === "undefined") return { ref: "" };
  return capturarOrigem(window.location.search, sessionStorageSeguro());
}

/** URL sem parâmetros fora da lista permitida e sem âncora (page_location do GA4). */
export function urlLimpa(href: string): string {
  const url = new URL(href);
  const limpa = new URL(url.origin + url.pathname);
  for (const chave of CAMPOS) {
    const valor = sanitizar(chave, url.searchParams.get(chave));
    if (valor) limpa.searchParams.set(chave, valor);
  }
  const cidade = buscarCidade(url.searchParams.get("cidade"));
  if (cidade) limpa.searchParams.set("cidade", cidade.id);
  return limpa.toString();
}

export function reiniciarOrigemParaTestes(): void {
  emMemoria = null;
}
```

`src/content/whatsapp.ts` (texto aprovado da nota `copy-lp`, IDs `wa.*`, **sem** o marcador `(ref ...)`, que o código anexa; se a C1 ainda não tiver OK do Revisor, use o texto abaixo com o comentário `// PROVISORIO`, que a Tarefa 7 remove):

```ts
// PROVISORIO: trocar pelo texto aprovado da nota copy-lp (IDs wa.*) na Tarefa 7.
export const MENSAGENS_WHATSAPP = {
  base: "Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular.",
  comCidade: (cidade: string) => `Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular em ${cidade}.`,
  comLocal: (cidade: string, local: string) =>
    `Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular em ${cidade} (${local}).`,
};
```

`src/lib/whatsapp.ts`:

```ts
import { WHATSAPP_NUMERO } from "@/config";
import { MENSAGENS_WHATSAPP } from "@/content/whatsapp";

export interface PedidoWhatsApp {
  /** Nome da cidade escolhida pelo usuário (nunca presumida). */
  cidade?: string;
  /** Nome do local, no CTA de um cartão de local. */
  local?: string;
  /** Resumo da autoavaliação, só quando o usuário marcou a caixa de inclusão. */
  resumo?: string;
  ref: string;
}

export function montarMensagem(p: PedidoWhatsApp): string {
  const texto =
    p.cidade && p.local
      ? MENSAGENS_WHATSAPP.comLocal(p.cidade, p.local)
      : p.cidade
        ? MENSAGENS_WHATSAPP.comCidade(p.cidade)
        : MENSAGENS_WHATSAPP.base;
  // Com resumo clínico, a mensagem não leva a ref: a origem do clique não fica ligada às respostas.
  if (p.resumo) return `${texto} ${p.resumo.trim()}`;
  return p.ref ? `${texto} (ref ${p.ref})` : texto;
}

function link(texto: string): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}

export function montarLinkWhatsApp(p: PedidoWhatsApp): string {
  return link(montarMensagem(p));
}

/** Link do HTML pré-renderizado: funciona sem JavaScript. */
export const LINK_WHATSAPP_BASE = link(MENSAGENS_WHATSAPP.base);
```

`src/lib/analytics.ts` (versão mínima; o Tracking completa na Tarefa 10 mantendo esta assinatura e este comportamento):

```ts
export type ParametrosEvento = Record<string, string | number | undefined>;

export interface OpcoesEvento {
  /** Chamado uma vez: pelo GTM (eventCallback) ou pelo tempo-limite, o que vier primeiro. */
  aoConcluir?: () => void;
  tempoLimiteMs?: number;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(evento: string, params: ParametrosEvento = {}, opcoes: OpcoesEvento = {}): void {
  if (typeof window === "undefined") return;
  const limpo = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  window.dataLayer = window.dataLayer || [];
  const { aoConcluir, tempoLimiteMs = 800 } = opcoes;
  if (!aoConcluir) {
    window.dataLayer.push({ event: evento, ...limpo });
    return;
  }
  let concluido = false;
  const concluir = () => {
    if (concluido) return;
    concluido = true;
    aoConcluir();
  };
  window.dataLayer.push({ event: evento, ...limpo, eventCallback: concluir, eventTimeout: tempoLimiteMs });
  window.setTimeout(concluir, tempoLimiteMs);
}
```

`src/context/CidadeContext.tsx`:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buscarCidade, type Cidade } from "@/data/locais";
import { obterOrigem } from "@/lib/origem";

export type FonteEscolha = "url" | "aba" | "seletor";

interface ValorCidade {
  cidade: Cidade | undefined;
  fonte: FonteEscolha | undefined;
  escolherCidade: (id: string, fonte: FonteEscolha) => void;
}

const Contexto = createContext<ValorCidade | null>(null);

export function CidadeProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ cidade?: Cidade; fonte?: FonteEscolha }>({});

  // Cidade do anúncio (?cidade=) só depois da hidratação, para o HTML do servidor ficar neutro.
  useEffect(() => {
    const daUrl = buscarCidade(obterOrigem().cidade);
    if (daUrl) setEstado((atual) => (atual.cidade ? atual : { cidade: daUrl, fonte: "url" }));
  }, []);

  const escolherCidade = useCallback((id: string, fonte: FonteEscolha) => {
    const cidade = buscarCidade(id);
    if (cidade) setEstado({ cidade, fonte });
  }, []);

  const valor = useMemo(
    () => ({ cidade: estado.cidade, fonte: estado.fonte, escolherCidade }),
    [estado, escolherCidade],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCidade(): ValorCidade {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useCidade precisa estar dentro de <CidadeProvider>");
  return valor;
}
```

`src/components/CtaWhatsApp.tsx`:

```tsx
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useCidade } from "@/context/CidadeContext";
import { track } from "@/lib/analytics";
import { obterOrigem } from "@/lib/origem";
import { LINK_WHATSAPP_BASE, montarLinkWhatsApp } from "@/lib/whatsapp";

export type LocalCta =
  | "topbar"
  | "hero"
  | "identificacao"
  | "autoavaliacao"
  | "como_funciona"
  | "sobre"
  | "onde_atende"
  | "faq"
  | "rodape"
  | "flutuante";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick" | "target" | "rel"> {
  localCta: LocalCta;
  /** Cidade do cartão de local; tem prioridade sobre a cidade escolhida. */
  cidadeFixa?: string;
  /** Nome do local, no CTA de um cartão de local. */
  local?: string;
  /** Resumo da autoavaliação; só passe quando o usuário marcou a caixa de inclusão. */
  resumo?: string;
}

/** Navegação isolada para os testes trocarem. */
export const navegacao = {
  ir(url: string) {
    window.location.assign(url);
  },
};

export function CtaWhatsApp({ localCta, cidadeFixa, local, resumo, children, ...resto }: Props) {
  const { cidade } = useCidade();

  function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    const origem = obterOrigem();
    const nomeCidade = cidadeFixa ?? cidade?.nome;
    const url = montarLinkWhatsApp({ cidade: nomeCidade, local, resumo, ref: origem.ref });
    evento.currentTarget.href = url;
    const params = {
      local_cta: localCta,
      cidade: nomeCidade,
      local,
      // Sem ref quando há resumo: a mensagem também não leva a ref (spec §7).
      ref: resumo ? undefined : origem.ref,
      gclid: origem.gclid,
      utm_source: origem.utm_source,
      utm_medium: origem.utm_medium,
      utm_campaign: origem.utm_campaign,
      utm_content: origem.utm_content,
    };
    const novaAba = evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button !== 0;
    if (novaAba) {
      track("clique_whatsapp", params);
      return;
    }
    evento.preventDefault();
    track("clique_whatsapp", params, { aoConcluir: () => navegacao.ir(url) });
  }

  return (
    <a href={LINK_WHATSAPP_BASE} onClick={aoClicar} {...resto}>
      {children}
    </a>
  );
}
```

Em `src/App.tsx`, envolver o conteúdo do `<main>` com `<CidadeProvider>` (importado de `@/context/CidadeContext`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test` → Expected: todos PASS. `npm run build` → verde.

- [ ] **Step 5: Commit**

```bash
git add src/lib src/content/whatsapp.ts src/context src/components/CtaWhatsApp.tsx src/components/CtaWhatsApp.test.tsx src/App.tsx
git commit -m "feat: adiciona link do WhatsApp com origem sanitizada, cidade escolhida e CTA"
```

### Tarefa 5c (Dev · Floor Dev · `feat/whatsapp`): Correções do parecer R5

**Files:**
- Modify: `src/lib/origem.ts`, `src/lib/origem.test.ts`, `src/components/CtaWhatsApp.tsx`, `src/components/CtaWhatsApp.test.tsx`

**Interfaces:** mesmas da Tarefa 5. `sanitizar(chave, valor)` passa a aplicar a convenção fechada da spec §20 (R5).

- [ ] **Step 1: Testes que falham**

Em `src/lib/origem.test.ts`, trocar os valores de exemplo pela convenção (`utm_campaign=c01`, `utm_content=a01`, `utm_source=google` ou `facebook`) e acrescentar:

```ts
  it("aplica a convenção fechada de UTMs (spec §20, R5)", () => {
    expect(sanitizar("utm_campaign", "dor_joelho")).toBeUndefined();
    expect(sanitizar("utm_content", "artrose")).toBeUndefined();
    expect(sanitizar("utm_source", "joao")).toBeUndefined();
    expect(sanitizar("utm_medium", "dor")).toBeUndefined();
    expect(sanitizar("utm_campaign", "c01")).toBe("c01");
    expect(sanitizar("utm_content", "a0412")).toBe("a0412");
    expect(sanitizar("utm_source", "facebook")).toBe("facebook");
    expect(sanitizar("utm_medium", "cpc")).toBe("cpc");
  });

  it("aceita gclid com ponto", () => {
    expect(sanitizar("gclid", "Cj0.KCQ_a-1")).toBe("Cj0.KCQ_a-1");
  });

  it("URL com UTM clínico não leva o valor para page_location", () => {
    expect(urlLimpa("https://lp-dr-santos.vercel.app/?utm_campaign=dor_joelho&utm_source=google")).toBe(
      "https://lp-dr-santos.vercel.app/?utm_source=google",
    );
  });
```

Em `src/components/CtaWhatsApp.test.tsx`, acrescentar:

```tsx
  it("com resumo, o href do DOM continua o link base e a navegação usa a URL completa", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="autoavaliacao" resumo="Meu resumo: joelho.">
          Agendar
        </CtaWhatsApp>
      </CidadeProvider>,
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    fireEvent.click(link, { ctrlKey: true });
    expect(link.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
    vi.advanceTimersByTime(800);
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
    expect(textoDe(vi.mocked(navegacao.ir).mock.calls[0][0])).toContain("Meu resumo: joelho.");
    expect(document.body.innerHTML).not.toContain("joelho");
  });
```

(importar `LINK_WHATSAPP_BASE` de `@/lib/whatsapp`).

- [ ] **Step 2: Rodar e ver falhar** → `npm test` com FAIL nos testes novos.

- [ ] **Step 3: Implementar**

Em `src/lib/origem.ts`, trocar `PADRAO_UTM`, `PADRAO_GCLID` e `sanitizar` por:

```ts
const FONTES = ["google", "bing", "facebook", "instagram", "whatsapp", "email", "organico"];
const MEIOS = ["cpc", "pago", "social", "organico", "email", "referencia"];

/** Convenção fechada (spec §20, R5): nomes livres podem carregar condição de saúde. */
const REGRAS: Record<(typeof CAMPOS)[number], (valor: string) => boolean> = {
  utm_source: (v) => FONTES.includes(v),
  utm_medium: (v) => MEIOS.includes(v),
  utm_campaign: (v) => /^c\d{2,4}$/.test(v),
  utm_content: (v) => /^a\d{2,4}$/.test(v),
  gclid: (v) => /^[A-Za-z0-9_.-]{1,200}$/.test(v),
};

export function sanitizar(chave: string, valor: string | null): string | undefined {
  if (!valor) return undefined;
  const regra = REGRAS[chave as keyof typeof REGRAS];
  return regra && regra(valor) ? valor : undefined;
}
```

Em `src/components/CtaWhatsApp.tsx`: com `resumo`, não gravar a URL completa no `href`; todo clique (simples ou com modificador) faz `preventDefault` e navega por `navegacao.ir(url)` depois do `eventCallback` ou do tempo-limite; o botão do meio segue o navegador com o link base. Sem `resumo`, o comportamento da Tarefa 5 continua igual.

- [ ] **Step 4:** `npm test` e `npm run build` verdes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/origem.ts src/lib/origem.test.ts src/components/CtaWhatsApp.tsx src/components/CtaWhatsApp.test.tsx
git commit -m "fix: fecha a convencao de UTMs e tira o resumo de saude do href"
```

- [ ] **Step 6:** atualizar a Tarefa 6 sobre a correção: `git switch feat/onde-atende`, `git rebase feat/whatsapp` (branch local, sem push), `npm test` e `npm run build` verdes.

### Tarefa 6 (Dev · Floor Dev · `feat/onde-atende`): Abas por cidade com mapas sob demanda

**Files:**
- Create: `src/components/AbasCidades.tsx`, `src/components/CartaoLocal.tsx`, `src/sections/S6OndeAtende.tsx`, `src/content/ondeAtende.ts`
- Modify: `src/App.tsx` (renderizar `<S6OndeAtende />`)
- Test: `src/components/AbasCidades.test.tsx`, `src/test/html-inicial.test.tsx`

**Interfaces:**
- Consumes: `REGIOES`, `CIDADES`, `cidadesDaRegiao`, `todosOsLocais`, `urlEmbedMapa`, `Cidade`, `Local` (Tarefa 2); `useCidade`, `CtaWhatsApp`, `track` (Tarefa 5); `render` de `src/entry-server.tsx` (Tarefa 1).
- Produces: `<S6OndeAtende />` com `id="onde-atende"`; `<AbasCidades />`; ids de aba `aba-<cidadeId>` e de painel `painel-<cidadeId>` (a Tarefa 9 usa para rolar e focar); `src/test/html-inicial.test.tsx`, que as Tarefas 7 e 9 estendem.

Comportamento (spec §5.6 e parecer R2):
- Estado inicial neutro: visão geral com as 11 cidades e os 14 locais (nome, endereço, "Como chegar"), sem iframe. Tudo isso está no HTML inicial.
- Duas `tablist` (uma por região) com rótulo visível; roving `tabindex` por tablist; setas, Home e End movem o foco sem abrir; Enter, Espaço ou clique abrem.
- A aba aberta é a cidade do `CidadeContext`. Clique na aba chama `escolherCidade(id, "aba")` e `track("troca_aba_cidade")`.
- **Mapa:** só no painel aberto (os iframes das outras cidades são desmontados) e só depois de ação real do usuário: clique na aba (`fonte "aba"`) ou escolha no seletor da seção 4 (`fonte "seletor"`). Cidade vinda do anúncio (`fonte "url"`) abre o painel sem mapa e mostra o botão "Ver mapa". `referrerPolicy="no-referrer"` no iframe.
- Cada cartão: nome, endereço, "Como chegar" (`track("como_chegar")`, `rel="noreferrer"`) e CTA "Agendar em <cidade>" com cidade e local.
- Botão "Ver todas as cidades" volta à visão geral.

- [ ] **Step 1: Escrever os testes que falham**

`src/components/AbasCidades.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { AbasCidades } from "./AbasCidades";

function renderizar() {
  return render(
    <CidadeProvider>
      <AbasCidades />
    </CidadeProvider>,
  );
}

describe("AbasCidades", () => {
  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
  });

  it("mostra 11 abas em 2 listas por região, nenhuma aberta", () => {
    renderizar();
    expect(screen.getAllByRole("tablist")).toHaveLength(2);
    expect(screen.getAllByRole("tab")).toHaveLength(11);
    expect(screen.getAllByRole("tab").some((aba) => aba.getAttribute("aria-selected") === "true")).toBe(false);
  });

  it("estado inicial: visão geral com 14 'Como chegar' e nenhum iframe", () => {
    const { container } = renderizar();
    expect(screen.getAllByRole("link", { name: /como chegar/i })).toHaveLength(14);
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("clicar em Tuntum abre o painel, carrega 1 mapa sem referrer e registra o evento", () => {
    const { container } = renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    expect(screen.getByRole("tab", { name: "Tuntum" })).toHaveAttribute("aria-selected", "true");
    const painel = screen.getByRole("tabpanel", { name: "Tuntum" });
    expect(within(painel).getByText("R. dos Andrades, 58, Centro, Tuntum-MA, 65763-000")).toBeInTheDocument();
    const iframes = container.querySelectorAll("iframe");
    expect(iframes).toHaveLength(1);
    expect(iframes[0].getAttribute("src")).toContain("output=embed");
    expect(iframes[0].getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(window.dataLayer).toContainEqual({ event: "troca_aba_cidade", cidade: "Tuntum", regiao: "Centro Maranhense" });
  });

  it("Balsas mostra 3 locais com 3 mapas; trocar de aba desmonta os mapas anteriores", () => {
    const { container } = renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Balsas" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(3);
    expect(within(screen.getByRole("tabpanel", { name: "Balsas" })).getAllByRole("link", { name: /agendar em balsas/i })).toHaveLength(3);
    fireEvent.click(screen.getByRole("tab", { name: "Loreto" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("setas movem o foco sem abrir; End vai para a última da região", () => {
    renderizar();
    const balsas = screen.getByRole("tab", { name: "Balsas" });
    balsas.focus();
    fireEvent.keyDown(balsas, { key: "ArrowRight" });
    const azeitao = screen.getByRole("tab", { name: "São Domingos do Azeitão" });
    expect(azeitao).toHaveFocus();
    expect(azeitao).toHaveAttribute("aria-selected", "false");
    fireEvent.keyDown(azeitao, { key: "End" });
    expect(screen.getByRole("tab", { name: "Loreto" })).toHaveFocus();
  });

  it("aba e painel se referenciam por aria-controls e aria-labelledby", () => {
    renderizar();
    const aba = screen.getByRole("tab", { name: "Loreto" });
    fireEvent.click(aba);
    const painel = screen.getByRole("tabpanel", { name: "Loreto" });
    expect(aba.getAttribute("aria-controls")).toBe(painel.id);
    expect(painel.getAttribute("aria-labelledby")).toBe(aba.id);
  });

  it("'Como chegar' registra o evento com local e cidade", () => {
    renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Fortuna" }));
    const painel = screen.getByRole("tabpanel", { name: "Fortuna" });
    fireEvent.click(within(painel).getByRole("link", { name: /como chegar/i }));
    expect(window.dataLayer).toContainEqual({ event: "como_chegar", local: "Clínica Risalva Carvalho", cidade: "Fortuna" });
  });

  it("cidade do anúncio (?cidade=) abre o painel sem carregar mapa até o clique em 'Ver mapa'", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("?cidade=loreto", null);
    const { container } = renderizar();
    expect(screen.getByRole("tab", { name: "Loreto" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /ver mapa/i }));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });
});
```

`src/test/html-inicial.test.tsx` (confere o HTML que o prerender injeta, o mesmo que funciona sem JavaScript):

```tsx
import { describe, expect, it } from "vitest";
import { todosOsLocais } from "@/data/locais";
import { render } from "@/entry-server";

describe("HTML inicial (sem JavaScript)", () => {
  const html = render();

  it("tem os 14 locais com nome, endereço e link 'Como chegar'", () => {
    for (const { local } of todosOsLocais()) {
      expect(html).toContain(local.nome);
      expect(html).toContain(local.endereco);
      expect(html).toContain(local.linkComoChegar.replace(/&/g, "&amp;"));
    }
  });

  it("tem a âncora de onde atende e nenhum iframe", () => {
    expect(html).toContain('id="onde-atende"');
    expect(html).not.toContain("<iframe");
  });

  it("tem CTA com o link base do WhatsApp", () => {
    expect(html).toMatch(/href="https:\/\/wa\.me\/5513996822680\?text=/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test` → Expected: FAIL (módulos não existem; `html-inicial` sem os locais).

- [ ] **Step 3: Implementar**

`src/content/ondeAtende.ts` (texto aprovado da `copy-lp`, IDs `onde.*`, se a C1 já tiver OK; senão com o comentário `// PROVISORIO`, que a Tarefa 7 remove):

```ts
// PROVISORIO: trocar pelo texto aprovado da nota copy-lp (IDs onde.*) na Tarefa 7.
export const TEXTOS_ONDE_ATENDE = {
  titulo: "Onde ele atende",
  introducao: "São 14 clínicas e hospitais parceiros em 11 cidades do Maranhão. Escolha sua cidade para ver endereço, mapa e como agendar.",
  semCidade: "Escolha sua cidade acima para ver o mapa e agendar.",
  verTodas: "Ver todas as cidades",
  verMapa: "Ver mapa",
  comoChegar: "Como chegar",
  agendarEm: (cidade: string) => `Agendar em ${cidade}`,
  tituloMapa: (local: string) => `Mapa: ${local}`,
};
```

`src/components/CartaoLocal.tsx`:

```tsx
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { urlEmbedMapa, type Cidade, type Local } from "@/data/locais";
import { track } from "@/lib/analytics";

interface Props {
  cidade: Cidade;
  local: Local;
  /** true só no painel aberto e depois de ação real do usuário. */
  mostrarMapa: boolean;
}

export function CartaoLocal({ cidade, local, mostrarMapa }: Props) {
  return (
    <article className="cartao-local" aria-labelledby={`local-${local.id}`}>
      <h4 id={`local-${local.id}`}>{local.nome}</h4>
      <p>{local.endereco}</p>
      {local.diasAtendimento ? <p>{local.diasAtendimento}</p> : null}
      <div className="cartao-local__mapa" style={{ minHeight: 240 }}>
        {mostrarMapa ? (
          <iframe
            src={urlEmbedMapa(local)}
            title={T.tituloMapa(local.nome)}
            loading="lazy"
            referrerPolicy="no-referrer"
            width="100%"
            height="240"
          />
        ) : null}
      </div>
      <a
        href={local.linkComoChegar}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("como_chegar", { local: local.nome, cidade: cidade.nome })}
      >
        {T.comoChegar}
      </a>
      <CtaWhatsApp localCta="onde_atende" cidadeFixa={cidade.nome} local={local.nome}>
        {T.agendarEm(cidade.nome)}
      </CtaWhatsApp>
    </article>
  );
}
```

`src/components/AbasCidades.tsx`:

```tsx
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CartaoLocal } from "@/components/CartaoLocal";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { useCidade } from "@/context/CidadeContext";
import { CIDADES, REGIOES, cidadesDaRegiao, type Cidade } from "@/data/locais";
import { track } from "@/lib/analytics";

export function AbasCidades() {
  const { cidade: aberta, fonte, escolherCidade } = useCidade();
  const [visaoGeral, setVisaoGeral] = useState(true);
  /** Cidade cujo mapa o usuário liberou com uma ação real. */
  const [mapaLiberado, setMapaLiberado] = useState<string | undefined>();
  const refsAbas = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!aberta) return;
    setVisaoGeral(false);
    if (fonte === "aba" || fonte === "seletor") setMapaLiberado(aberta.id);
  }, [aberta, fonte]);

  function abrir(cidade: Cidade) {
    escolherCidade(cidade.id, "aba");
    const regiao = REGIOES.find((r) => r.id === cidade.regiaoId)!;
    track("troca_aba_cidade", { cidade: cidade.nome, regiao: regiao.nome });
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, lista: Cidade[], indice: number) {
    const destinos: Record<string, number> = {
      ArrowRight: (indice + 1) % lista.length,
      ArrowLeft: (indice - 1 + lista.length) % lista.length,
      Home: 0,
      End: lista.length - 1,
    };
    const destino = destinos[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    refsAbas.current.get(lista[destino].id)?.focus();
  }

  const mostrarGeral = visaoGeral || !aberta;

  return (
    <div className="abas-cidades">
      {REGIOES.map((regiao) => {
        const lista = cidadesDaRegiao(regiao.id);
        const indiceAberto = mostrarGeral ? -1 : lista.findIndex((c) => c.id === aberta?.id);
        return (
          <div key={regiao.id} className="abas-cidades__regiao">
            <h3 id={`regiao-${regiao.id}`}>{regiao.nome}</h3>
            <div role="tablist" aria-labelledby={`regiao-${regiao.id}`} className="abas-cidades__lista">
              {lista.map((cidade, indice) => {
                const selecionada = indice === indiceAberto;
                const focavel = indiceAberto >= 0 ? selecionada : indice === 0;
                return (
                  <button
                    key={cidade.id}
                    ref={(el) => {
                      if (el) refsAbas.current.set(cidade.id, el);
                      else refsAbas.current.delete(cidade.id);
                    }}
                    type="button"
                    role="tab"
                    id={`aba-${cidade.id}`}
                    aria-selected={selecionada}
                    aria-controls={`painel-${cidade.id}`}
                    tabIndex={focavel ? 0 : -1}
                    onClick={() => abrir(cidade)}
                    onKeyDown={(e) => aoTeclar(e, lista, indice)}
                    onFocus={(e) => e.currentTarget.scrollIntoView?.({ block: "nearest", inline: "nearest" })}
                  >
                    {cidade.nome}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {mostrarGeral ? (
        <div className="abas-cidades__geral">
          <p>{T.semCidade}</p>
          {CIDADES.map((cidade) => (
            <div key={cidade.id}>
              <h4>{cidade.nome}</h4>
              <ul>
                {cidade.locais.map((local) => (
                  <li key={local.id}>
                    <strong>{local.nome}</strong> {local.endereco}{" "}
                    <a
                      href={local.linkComoChegar}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => track("como_chegar", { local: local.nome, cidade: cidade.nome })}
                    >
                      {T.comoChegar}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {CIDADES.map((cidade) => {
        const estaAberta = !mostrarGeral && cidade.id === aberta?.id;
        const mapaPermitido = estaAberta && mapaLiberado === cidade.id;
        return (
          <div
            key={cidade.id}
            role="tabpanel"
            id={`painel-${cidade.id}`}
            aria-labelledby={`aba-${cidade.id}`}
            hidden={!estaAberta}
            tabIndex={0}
          >
            {estaAberta && !mapaPermitido ? (
              <button type="button" onClick={() => setMapaLiberado(cidade.id)}>
                {T.verMapa}
              </button>
            ) : null}
            {cidade.locais.map((local) => (
              <CartaoLocal key={local.id} cidade={cidade} local={local} mostrarMapa={mapaPermitido} />
            ))}
            <button type="button" onClick={() => setVisaoGeral(true)}>
              {T.verTodas}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

Nota: `hidden` tira o painel da árvore de acessibilidade, então `getByRole("tabpanel", { name })` só encontra o painel aberto. O painel recebe o nome pela aba (`aria-labelledby`).

`src/sections/S6OndeAtende.tsx`:

```tsx
import { AbasCidades } from "@/components/AbasCidades";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";

export function S6OndeAtende() {
  return (
    <section id="onde-atende" aria-labelledby="onde-atende-titulo">
      <h2 id="onde-atende-titulo">{T.titulo}</h2>
      <p>{T.introducao}</p>
      <AbasCidades />
    </section>
  );
}
```

Em `src/App.tsx`, renderizar `<S6OndeAtende />` dentro do `<CidadeProvider>`, antes do `<JsonLd />` (se a Tarefa 4 já estiver na `main`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test` → Expected: todos PASS. `npm run build` → verde (o `verificar-build` continua proibindo iframe no HTML inicial).

- [ ] **Step 5: Commit**

```bash
git add src/components/AbasCidades.tsx src/components/AbasCidades.test.tsx src/components/CartaoLocal.tsx src/sections/S6OndeAtende.tsx src/content/ondeAtende.ts src/test/html-inicial.test.tsx src/App.tsx
git commit -m "feat: adiciona abas por cidade com mapas sob demanda"
```

### Tarefa C1 e C2 (Copywriter · nota `copy-lp`)

- C1 (em andamento): todo o texto visível conforme a spec v2 (correções da revisão R1 já enviadas).
- C2 (depois do OK do Revisor na C1): `meta.title` (até 60 caracteres), `meta.description` (até 155), `alt` das 4 fotos e a minuta da política de privacidade (controlador: Dr. Patrick Santos, MÉDICO, CRM-MA 16520; dados de navegação medidos com consentimento via Google Analytics e Google Ads; dados enviados pelo próprio usuário no WhatsApp; finalidades; terceiros: Google e WhatsApp; retenção; direitos da LGPD; contato pelo WhatsApp). Marcar no topo da nota que é minuta para revisão jurídica.
- O Revisor aprova cada entrega (checklist §13) antes do Designer aplicar.
- **Bloqueio:** as Tarefas 7 e 8 só começam com a C1 APROVADA pelo Revisor; a Tarefa 9 só começa com a C2 APROVADA. Nenhum texto provisório chega a deploy: a Tarefa 7 remove todo comentário `// PROVISORIO` de `src/content/`.

### Tarefa 7 (Designer · Floor Front · `feat/base-visual`): Base visual, topbar, hero e botão flutuante

**Files:**
- Create: `src/styles/tokens.css`, `public/fonts/*.woff2`, `public/favicon.svg`, `src/components/{Secao,Foto,BotaoFlutuante}.tsx`, `src/sections/{S1Topbar,S2Hero}.tsx`, `src/content/{topbar,hero,meta}.ts`
- Modify: `src/styles/global.css`, `index.html` (título, descrição, favicon, preload das 2 fontes críticas), `src/content/whatsapp.ts` e `src/content/ondeAtende.ts` (texto aprovado da `copy-lp`), `src/components/{AbasCidades,CartaoLocal}.tsx` (só classes e estilo, sem mudar comportamento), `src/App.tsx`, `scripts/verificar-build.mjs`
- Test: `src/sections/S1Topbar.test.tsx`, `src/sections/S2Hero.test.tsx`, `src/components/BotaoFlutuante.test.tsx`

**Interfaces:**
- Consumes: `CtaWhatsApp`, `useCidade` (Tarefa 5); imagens `/img/<nome>-<w>.<fmt>` (Tarefa 3); `ASSINATURA`, `MEDICO` (Tarefa 1).
- Produces: `<Secao id titulo? fundo="creme"|"bege"|"grafite" children>`; `<Foto nome="hero"|"sobre"|"consulta"|"cta-final" alt sizes prioridade? className?>`; tokens Tailwind `--color-grafite`, `--color-creme`, `--color-bege`, `--color-dourado`, `--color-dourado-claro`, `--color-cta`, `--font-titulo`, `--font-corpo`; o CTA do hero tem `id="cta-hero"` (o botão flutuante observa esse id).

- [ ] **Step 1: Fontes self-hosted**

```bash
npm install -D @fontsource/lora @fontsource/figtree
```

Copiar para `public/fonts/`: `lora-latin-600-normal.woff2`, `lora-latin-700-normal.woff2`, `figtree-latin-400-normal.woff2`, `figtree-latin-600-normal.woff2` (de `node_modules/@fontsource/*/files/`). Pré-carregar só `figtree-latin-400-normal.woff2` e `lora-latin-700-normal.woff2` no `index.html` (`<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/...">`).

- [ ] **Step 2: Tokens e CSS global**

`src/styles/tokens.css`:

```css
@theme {
  --color-grafite: #15171b;
  --color-creme: #f8f4ec;
  --color-bege: #ede3d2;
  --color-dourado: #b98f4e;
  --color-dourado-claro: #d4b06a;
  --color-cta: #1e7f4f;
  --color-cta-escuro: #17663f;
  --font-titulo: "Lora", "Lora Fallback", Georgia, serif;
  --font-corpo: "Figtree", "Figtree Fallback", system-ui, sans-serif;
}

@font-face { font-family: "Figtree"; font-weight: 400; font-display: swap; src: url("/fonts/figtree-latin-400-normal.woff2") format("woff2"); }
@font-face { font-family: "Figtree"; font-weight: 600; font-display: swap; src: url("/fonts/figtree-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "Lora"; font-weight: 600; font-display: swap; src: url("/fonts/lora-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "Lora"; font-weight: 700; font-display: swap; src: url("/fonts/lora-latin-700-normal.woff2") format("woff2"); }
@font-face { font-family: "Figtree Fallback"; src: local("Arial"); size-adjust: 100%; }
@font-face { font-family: "Lora Fallback"; src: local("Georgia"); size-adjust: 100%; }
```

Ajuste o `size-adjust` dos fallbacks (e `ascent-override`, se precisar) para zerar o salto de layout na troca de fonte; registre os valores no commit.

`src/styles/global.css`:

```css
@import "tailwindcss";
@import "./tokens.css";

@layer base {
  html { scroll-behavior: smooth; scroll-padding-top: 4rem; }
  body { background: var(--color-creme); color: var(--color-grafite); font-family: var(--font-corpo); font-size: 1.125rem; line-height: 1.6; }
  h1, h2, h3 { font-family: var(--font-titulo); line-height: 1.2; }
  :focus-visible { outline: 3px solid var(--color-dourado); outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
}
```

`scroll-padding-top` compensa a topbar fixa nas âncoras; ajuste ao valor real da altura da topbar.

- [ ] **Step 3: Conteúdo aprovado**

Transcrever da nota `copy-lp` (versão aprovada pelo Revisor), sem editar texto e sem os colchetes de fonte: `src/content/topbar.ts`, `src/content/hero.ts`, `src/content/meta.ts` e os textos finais de `src/content/whatsapp.ts` e `src/content/ondeAtende.ts` (mantendo as assinaturas das funções e removendo o comentário `// PROVISORIO`). O `index.html` recebe `meta.title` e `meta.description` da nota `copy-lp-c2`. Conferir: `grep -r "PROVISORIO" src/content` sem resultado.

- [ ] **Step 4: Escrever os testes que falham**

`src/sections/S1Topbar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TEXTOS_TOPBAR } from "@/content/topbar";
import { S1Topbar } from "./S1Topbar";

describe("S1Topbar", () => {
  it("mostra o aviso de atendimento particular", () => {
    render(<S1Topbar />);
    expect(screen.getByText(TEXTOS_TOPBAR.aviso)).toBeInTheDocument();
    expect(TEXTOS_TOPBAR.aviso.toLowerCase()).toContain("particular");
  });
});
```

`src/sections/S2Hero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ASSINATURA } from "@/config";
import { TEXTOS_HERO } from "@/content/hero";
import { CidadeProvider } from "@/context/CidadeContext";
import { S2Hero } from "./S2Hero";

function renderizar() {
  return render(
    <CidadeProvider>
      <S2Hero />
    </CidadeProvider>,
  );
}

describe("S2Hero", () => {
  it("tem h1, badge de particular e assinatura completa", () => {
    renderizar();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS_HERO.badge)).toBeInTheDocument();
    expect(screen.getByText(ASSINATURA)).toBeInTheDocument();
    expect(ASSINATURA).toContain("MÉDICO");
  });

  it("tem o CTA do WhatsApp com id cta-hero", () => {
    renderizar();
    const cta = document.getElementById("cta-hero")!;
    expect(cta.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5513996822680/);
  });

  it("tem o link 'Veja onde ele atende' para a âncora real", () => {
    renderizar();
    expect(screen.getByRole("link", { name: /veja onde ele atende/i })).toHaveAttribute("href", "#onde-atende");
  });

  it("a foto do hero é prioritária e não é lazy", () => {
    renderizar();
    const img = screen.getByRole("img");
    expect(img).not.toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img.getAttribute("width")).toBeTruthy();
    expect(img.getAttribute("height")).toBeTruthy();
  });
});
```

`src/components/BotaoFlutuante.test.tsx`:

```tsx
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { BotaoFlutuante } from "./BotaoFlutuante";

let callback: IntersectionObserverCallback;

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  document.body.innerHTML = '<a id="cta-hero" href="#">hero</a>';
});

describe("BotaoFlutuante", () => {
  it("começa escondido e aparece quando o CTA do hero sai da tela", () => {
    render(
      <CidadeProvider>
        <BotaoFlutuante />
      </CidadeProvider>,
    );
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    act(() => callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `npm test` → Expected: FAIL nos três arquivos.

- [ ] **Step 6: Implementar**

`src/components/Foto.tsx`:

```tsx
const LARGURAS = [480, 720, 960, 1280];

interface FotoProps {
  nome: "hero" | "sobre" | "consulta" | "cta-final";
  alt: string;
  /** Ex.: "(min-width: 1024px) 480px, 100vw" */
  sizes: string;
  prioridade?: boolean;
  className?: string;
}

const srcset = (nome: string, formato: string) => LARGURAS.map((w) => `/img/${nome}-${w}.${formato} ${w}w`).join(", ");

export function Foto({ nome, alt, sizes, prioridade = false, className }: FotoProps) {
  // React 18 não conhece fetchPriority: o atributo vai em minúsculas.
  const prioridadeAttr = prioridade ? ({ fetchpriority: "high" } as Record<string, string>) : {};
  return (
    <picture>
      <source type="image/avif" srcSet={srcset(nome, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(nome, "webp")} sizes={sizes} />
      <img
        src={`/img/${nome}-720.webp`}
        alt={alt}
        width={720}
        height={900}
        sizes={sizes}
        loading={prioridade ? "eager" : "lazy"}
        decoding={prioridade ? "sync" : "async"}
        className={className}
        {...prioridadeAttr}
      />
    </picture>
  );
}
```

`src/components/Secao.tsx`:

```tsx
import type { ReactNode } from "react";

const FUNDOS = { creme: "bg-creme text-grafite", bege: "bg-bege text-grafite", grafite: "bg-grafite text-creme" } as const;

interface Props {
  id: string;
  tituloId?: string;
  fundo?: keyof typeof FUNDOS;
  children: ReactNode;
}

export function Secao({ id, tituloId, fundo = "creme", children }: Props) {
  return (
    <section id={id} aria-labelledby={tituloId} className={`${FUNDOS[fundo]} px-4 py-16 md:py-24`}>
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  );
}
```

`src/sections/S1Topbar.tsx` (sticky no topo, visível em todas as larguras):

```tsx
import { TEXTOS_TOPBAR } from "@/content/topbar";

export function S1Topbar() {
  return (
    <div className="sticky top-0 z-50 bg-dourado-claro px-4 py-2 text-center text-grafite">
      <p className="text-base font-semibold leading-snug">{TEXTOS_TOPBAR.aviso}</p>
    </div>
  );
}
```

`src/sections/S2Hero.tsx` (estrutura obrigatória; o layout e as classes são do Designer):

```tsx
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { ASSINATURA } from "@/config";
import { TEXTOS_HERO as T } from "@/content/hero";

export function S2Hero() {
  return (
    <header className="bg-creme px-4 pb-12 pt-6 md:pt-12">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2">
        <div>
          <p className="badge-particular">{T.badge}</p>
          <h1>{T.headline}</h1>
          <p>{T.subheadline}</p>
          <p>
            {T.linhaCidades} <a href="#onde-atende">{T.linkOndeAtende}</a>
          </p>
          <CtaWhatsApp id="cta-hero" localCta="hero" className="cta">
            {T.cta}
          </CtaWhatsApp>
          <p className="assinatura">{ASSINATURA}</p>
        </div>
        <Foto nome="hero" alt={T.altFoto} sizes="(min-width: 768px) 480px, 100vw" prioridade />
      </div>
    </header>
  );
}
```

`T.linkOndeAtende` precisa ser exatamente "Veja onde ele atende" (texto do brief).

`src/components/BotaoFlutuante.tsx`:

```tsx
import { useEffect, useState } from "react";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { TEXTOS_HERO as T } from "@/content/hero";

export function BotaoFlutuante() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById("cta-hero");
    if (!alvo || typeof IntersectionObserver === "undefined") return;
    const observador = new IntersectionObserver(([entrada]) => setVisivel(!entrada.isIntersecting));
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  if (!visivel) return null;
  return (
    <CtaWhatsApp localCta="flutuante" aria-label={T.flutuanteAria} className="fixed bottom-4 right-4 z-40 md:hidden">
      {T.flutuante}
    </CtaWhatsApp>
  );
}
```

`T.flutuanteAria` deve conter a palavra "WhatsApp" (o teste procura por ela).

`src/App.tsx` passa a renderizar, nesta ordem: `<S1Topbar />`, `<CidadeProvider>` com `<S2Hero />`, `<main id="conteudo">` (seções seguintes e `<S6OndeAtende />`), `<BotaoFlutuante />` e `<JsonLd />`. O `h1` provisório da Tarefa 1 sai; o teste `src/App.test.tsx` continua valendo porque o hero tem o `h1` com o nome do médico. Se a headline da copy não contiver "Dr. Patrick Santos", atualize o teste do App para procurar o nome na assinatura.

`public/favicon.svg`: monograma "PS" em dourado `#B98F4E` sobre grafite `#15171B`, traço fino, 32x32.

Em `scripts/verificar-build.mjs`, acrescentar a `EXIGIDOS`:

```js
  ["aviso de particular", /particular/i],
  ["assinatura com MÉDICO", /MÉDICO/],
  ["CRM-MA 16520", /CRM-MA 16520/],
  ["RQE 7389", /RQE 7389/],
  ["CTA do WhatsApp", /href="https:\/\/wa\.me\/5513996822680\?text=/],
  ["link para #onde-atende", /href="#onde-atende"/],
  ["foto do hero prioritária", /fetchpriority="high"/],
```

e a `PROIBIDOS`:

```js
  ["BMA na página", /\bBMA\b/],
  ["Instituto na página", /Instituto Patrick Santos/],
```

Acrescentar a `src/test/html-inicial.test.tsx`:

```tsx
  it("tem topbar de particular, assinatura completa e link para os locais", () => {
    expect(html).toContain(ASSINATURA);
    expect(html.toLowerCase()).toContain("particular");
    expect(html).toContain('href="#onde-atende"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).not.toMatch(/\bBMA\b|Instituto Patrick Santos/);
  });
```

(importar `ASSINATURA` de `@/config`).

- [ ] **Step 7: Rodar e ver passar; conferir nas três telas**

Run: `npm test` e `npm run build` → verdes. `npm run dev` no Floor e conferir 390x844 (CTA visível sem rolar, topbar em uma ou duas linhas), 820x1180 e 1440x900. Medir o tamanho do JS inicial (`dist/assets/*.js` gzip) e do CSS e registrar no relatório.

- [ ] **Step 8: Commit**

```bash
git add -A src public/fonts public/favicon.svg index.html scripts/verificar-build.mjs package.json package-lock.json
git commit -m "feat: adiciona base visual, topbar, hero e botao flutuante"
```

### Tarefa 8 (Designer · Floor Front · `feat/identificacao`): Identificação e autoavaliação

**Files:**
- Create: `src/sections/S3Identificacao.tsx`, `src/interativos/Autoavaliacao.tsx`, `src/content/identificacao.ts`, `src/content/autoavaliacao.ts`
- Modify: `src/App.tsx`
- Test: `src/interativos/Autoavaliacao.test.tsx`

**Interfaces:**
- Consumes: `CtaWhatsApp`, `track`, `Secao`.
- Produces: `<S3Identificacao />` com `id="para-quem"`; `montarResumo(respostas: Respostas, textos): string` exportada de `Autoavaliacao.tsx`; `interface Respostas { regiao?: string; limitacao?: string; tentativa?: string }` (valores são os rótulos das opções).

`src/content/autoavaliacao.ts` (estrutura; os textos vêm da `copy-lp`):

```ts
export interface Etapa {
  chave: "regiao" | "limitacao" | "tentativa";
  pergunta: string;
  opcoes: string[];
}

export const TEXTOS_AUTOAVALIACAO: {
  titulo: string;
  introducao: string;
  etapas: Etapa[];
  progresso: (atual: number, total: number) => string;
  pular: string;
  voltar: string;
  refazer: string;
  tituloResultado: string;
  /** Texto acessível mostrado ao voltar para uma etapa já respondida. */
  respostaAnterior: (resposta: string) => string;
  /** Fragmentos do resumo; cada um só entra quando a etapa foi respondida (spec §5.3). */
  resumo: {
    inicio: string;
    regiao: (valor: string) => string;
    limitacao: (valor: string) => string;
    tentativa: (valor: string) => string;
    /** Quando a pessoa pulou as três etapas. */
    semRespostas: string;
  };
  oQueAConsultaAvalia: string;
  aviso: string;
  incluirResumo: string;
  avisoPrivacidade: string;
  cta: string;
} = {
  /* textos da nota copy-lp, IDs autoavaliacao.* */
} as never;
```

O Designer substitui o `{} as never` pelo objeto completo com os textos aprovados. `etapas` tem exatamente 3 itens, na ordem regiao, limitacao, tentativa.

- [ ] **Step 1: Escrever o teste que falha** (`src/interativos/Autoavaliacao.test.tsx`)

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { navegacao } from "@/components/CtaWhatsApp";
import { TEXTOS_AUTOAVALIACAO as T } from "@/content/autoavaliacao";
import { CidadeProvider } from "@/context/CidadeContext";
import { reiniciarOrigemParaTestes } from "@/lib/origem";
import { Autoavaliacao, montarResumo } from "./Autoavaliacao";

function renderizar() {
  return render(
    <CidadeProvider>
      <Autoavaliacao />
    </CidadeProvider>,
  );
}

const [regiao, limitacao, tentativa] = T.etapas;

describe("Autoavaliacao", () => {
  beforeEach(() => {
    reiniciarOrigemParaTestes();
    window.dataLayer = [];
    navegacao.ir = vi.fn();
  });

  it("começa na etapa 1 com fieldset, legenda e progresso", () => {
    renderizar();
    expect(screen.getByRole("group", { name: regiao.pergunta })).toBeInTheDocument();
    expect(screen.getByText(T.progresso(1, 3))).toBeInTheDocument();
  });

  it("três toques levam ao resultado com o aviso e sem procedimento", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    expect(screen.getByText(T.aviso)).toBeInTheDocument();
    const resultado = document.body.textContent!;
    expect(resultado).not.toMatch(/\bPRP\b|\bBMA\b|infiltra/i);
  });

  it("voltar retorna à etapa anterior e pular avança sem resposta", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: T.pular }));
    expect(screen.getByText(T.progresso(2, 3))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: T.voltar }));
    expect(screen.getByText(T.progresso(1, 3))).toBeInTheDocument();
    expect(window.dataLayer).toContainEqual({ event: "autoavaliacao_pulada", etapa: 1 });
  });

  it("o resumo só vai para o WhatsApp com a caixa marcada", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    const cta = screen.getByRole("link", { name: T.cta });
    fireEvent.click(cta);
    expect(new URL(cta.getAttribute("href")!).searchParams.get("text")).not.toContain(regiao.opcoes[0]);
    fireEvent.click(screen.getByRole("checkbox", { name: T.incluirResumo }));
    fireEvent.click(cta);
    expect(new URL(cta.getAttribute("href")!).searchParams.get("text")).toContain(regiao.opcoes[0]);
  });

  it("nenhum evento carrega as respostas", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    const eventos = JSON.stringify(window.dataLayer);
    for (const etapa of T.etapas) for (const opcao of etapa.opcoes) expect(eventos).not.toContain(opcao);
    expect(window.dataLayer).toContainEqual({ event: "autoavaliacao_concluida" });
    expect(window.dataLayer).toContainEqual({ event: "autoavaliacao_etapa", etapa: 2 });
  });

  it("voltar, trocar e pular não deixam resposta omitida no resumo", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: T.voltar }));
    fireEvent.click(screen.getByRole("button", { name: T.pular }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    fireEvent.click(screen.getByRole("checkbox", { name: T.incluirResumo }));
    const cta = screen.getByRole("link", { name: T.cta });
    fireEvent.click(cta);
    expect(new URL(cta.getAttribute("href")!).searchParams.get("text")).not.toContain(regiao.opcoes[0]);
  });

  it("o resumo omite etapas puladas sem deixar buraco no texto", () => {
    expect(montarResumo({ limitacao: limitacao.opcoes[0] })).toBe(`${T.resumo.inicio} ${T.resumo.limitacao(limitacao.opcoes[0])}.`);
    expect(montarResumo({})).toBe(T.resumo.semRespostas);
    expect(montarResumo({ regiao: regiao.opcoes[0], tentativa: tentativa.opcoes[0] })).not.toMatch(/\s{2}|;\s*;/);
  });

  it("ao voltar, mostra a resposta anterior em texto e nenhum botão usa aria-pressed", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: T.voltar }));
    expect(screen.getByText(T.respostaAnterior(regiao.opcoes[0]))).toBeInTheDocument();
    expect(document.querySelector("[aria-pressed]")).toBeNull();
  });

  it("anuncia o progresso para leitor de tela", () => {
    renderizar();
    expect(screen.getByText(T.progresso(1, 3))).toHaveAttribute("aria-live", "polite");
  });

  it("move o foco para a pergunta seguinte depois de responder", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    expect(screen.getByText(limitacao.pergunta)).toHaveFocus();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/interativos/Autoavaliacao.test.tsx` → Expected: FAIL.

Padrão de acessibilidade escolhido (pareceres R2 e R2b, achado 7): cada etapa é um `<fieldset>` com `<legend>`, e cada opção é um `<button type="button">` que responde e avança (é uma ação, não um estado, por isso sem `aria-pressed`); ao voltar, a resposta anterior aparece em texto (`T.respostaAnterior`). Rádios nativos não servem aqui porque as setas mudam a seleção e disparariam o avanço automático, e trocar para rádio + "Continuar" dobraria os toques do público 50+. O progresso fica em `aria-live="polite"` e o foco vai para a pergunta seguinte depois de cada resposta, "Voltar" ou "Pular".

- [ ] **Step 3: Implementar `src/interativos/Autoavaliacao.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { TEXTOS_AUTOAVALIACAO as T } from "@/content/autoavaliacao";
import { track } from "@/lib/analytics";

export interface Respostas {
  regiao?: string;
  limitacao?: string;
  tentativa?: string;
}

export function montarResumo(respostas: Respostas, textos = T): string {
  const r = textos.resumo;
  const partes = [
    respostas.regiao ? r.regiao(respostas.regiao) : null,
    respostas.limitacao ? r.limitacao(respostas.limitacao) : null,
    respostas.tentativa ? r.tentativa(respostas.tentativa) : null,
  ].filter((p): p is string => Boolean(p));
  if (partes.length === 0) return r.semRespostas;
  return `${r.inicio} ${partes.join("; ")}.`;
}

export function Autoavaliacao() {
  const [etapa, setEtapa] = useState(0); // 0..2 perguntas, 3 resultado
  const [respostas, setRespostas] = useState<Respostas>({});
  const [incluir, setIncluir] = useState(false);
  const refPergunta = useRef<HTMLElement>(null);
  // Só move o foco depois de uma ação do usuário (nunca na carga da página, nem no StrictMode).
  const focarDepois = useRef(false);

  useEffect(() => {
    if (!focarDepois.current) return;
    focarDepois.current = false;
    refPergunta.current?.focus();
  }, [etapa]);

  function irPara(novaEtapa: number) {
    focarDepois.current = true;
    setEtapa(novaEtapa);
  }

  function avancar(novaEtapa: number) {
    irPara(novaEtapa);
    if (novaEtapa < 3) track("autoavaliacao_etapa", { etapa: novaEtapa + 1 });
    else track("autoavaliacao_concluida");
  }

  function responder(chave: keyof Respostas, valor: string) {
    setRespostas((r) => ({ ...r, [chave]: valor }));
    avancar(etapa + 1);
  }

  function pular() {
    // Pular apaga a resposta desta etapa: nada que a pessoa quis omitir entra no resumo.
    const chave = T.etapas[etapa].chave;
    setRespostas((r) => ({ ...r, [chave]: undefined }));
    track("autoavaliacao_pulada", { etapa: etapa + 1 });
    avancar(etapa + 1);
  }

  if (etapa === 3) {
    const resumo = montarResumo(respostas);
    return (
      <div className="autoavaliacao">
        <h3 ref={refPergunta as React.RefObject<HTMLHeadingElement>} tabIndex={-1}>
          {T.tituloResultado}
        </h3>
        <p>{resumo}</p>
        <p>{T.oQueAConsultaAvalia}</p>
        <p>{T.aviso}</p>
        <label>
          <input type="checkbox" checked={incluir} onChange={(e) => setIncluir(e.target.checked)} /> {T.incluirResumo}
        </label>
        <p>{T.avisoPrivacidade}</p>
        <CtaWhatsApp localCta="autoavaliacao" resumo={incluir ? resumo : undefined}>
          {T.cta}
        </CtaWhatsApp>
        <button
          type="button"
          onClick={() => {
            setRespostas({});
            setIncluir(false);
            irPara(0);
          }}
        >
          {T.refazer}
        </button>
      </div>
    );
  }

  const atual = T.etapas[etapa];
  return (
    <div className="autoavaliacao">
      <p aria-live="polite">{T.progresso(etapa + 1, 3)}</p>
      <fieldset>
        <legend>
          <span ref={refPergunta as React.RefObject<HTMLSpanElement>} tabIndex={-1}>
            {atual.pergunta}
          </span>
        </legend>
        {respostas[atual.chave] ? <p>{T.respostaAnterior(respostas[atual.chave]!)}</p> : null}
        {atual.opcoes.map((opcao) => (
          <button key={opcao} type="button" onClick={() => responder(atual.chave, opcao)}>
            {opcao}
          </button>
        ))}
      </fieldset>
      {etapa > 0 ? (
        <button type="button" onClick={() => irPara(etapa - 1)}>
          {T.voltar}
        </button>
      ) : null}
      <button type="button" onClick={pular}>
        {T.pular}
      </button>
    </div>
  );
}
```

Importe `type RefObject` de `react` em vez de usar `React.RefObject` se o lint de tipos pedir.

`src/sections/S3Identificacao.tsx`: `<Secao id="para-quem">` com título, os três exemplos estáticos (articulação, coluna, esporte) com o mesmo peso visual, `<CtaWhatsApp localCta="identificacao">` antes do interativo, `<Autoavaliacao />` e outro `<CtaWhatsApp localCta="identificacao">` depois. Textos de `src/content/identificacao.ts`.

Em `src/App.tsx`, renderizar `<S3Identificacao />` logo depois do hero.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test` e `npm run build` → verdes. Conferir no navegador: teclado (Tab chega às opções, Enter responde, foco vai para a pergunta seguinte), toque de 48 px, 390x844.

- [ ] **Step 5: Commit**

```bash
git add src/sections/S3Identificacao.tsx src/interativos src/content/identificacao.ts src/content/autoavaliacao.ts src/App.tsx
git commit -m "feat: adiciona secao de identificacao com autoavaliacao opcional"
```

### Tarefa 9 (Designer · Floor Front · `feat/secoes`): Como funciona, sobre, FAQ, rodapé e política

**Files:**
- Create: `src/sections/{S4ComoFunciona,S5Sobre,S7Faq,S8Rodape}.tsx`, `src/components/{SeletorCidade,Accordion}.tsx`, `src/content/{comoFunciona,sobre,faq,rodape}.ts`, `public/politica-de-privacidade.html`
- Modify: `src/App.tsx` (ordem final: S1, S2, S3, S4, S5, S6, S7, S8), estilo final de `AbasCidades`/`CartaoLocal`, `scripts/verificar-build.mjs`
- Test: `src/components/SeletorCidade.test.tsx`, `src/components/Accordion.test.tsx`, `src/App.test.tsx` (ordem e âncoras)

**Interfaces:**
- Consumes: `useCidade().escolherCidade`, ids `onde-atende` e `aba-<cidadeId>` (Tarefa 6), `CtaWhatsApp`, `Foto`, `Secao`, `track`, `ASSINATURA`, `REGIOES`, `cidadesDaRegiao`.
- Produces: seções com ids `como-funciona`, `sobre`, `duvidas`; rodapé com `id="rodape"` e um elemento `<div id="rodape-extra"></div>` onde a Tarefa 10 coloca o botão "Preferências de cookies".

- [ ] **Step 1: Escrever os testes que falham**

`src/components/SeletorCidade.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTOS_COMO_FUNCIONA } from "@/content/comoFunciona";
import { CidadeProvider, useCidade } from "@/context/CidadeContext";
import { SeletorCidade } from "./SeletorCidade";

function MostrarCidade() {
  const { cidade, fonte } = useCidade();
  return <output>{cidade ? `${cidade.nome}:${fonte}` : "nenhuma"}</output>;
}

describe("SeletorCidade", () => {
  beforeEach(() => {
    window.dataLayer = [];
    document.body.innerHTML = '<section id="onde-atende"></section>';
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("lista as 11 cidades em 2 grupos e começa sem escolha", () => {
    render(
      <CidadeProvider>
        <SeletorCidade />
        <MostrarCidade />
      </CidadeProvider>,
    );
    expect(screen.getAllByRole("option").filter((o) => (o as HTMLOptionElement).value)).toHaveLength(11);
    expect(screen.getByRole("status")).toHaveTextContent("nenhuma");
  });

  it("'Ver locais' escolhe a cidade, registra o evento e rola até os locais", () => {
    render(
      <CidadeProvider>
        <SeletorCidade />
        <MostrarCidade />
      </CidadeProvider>,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "tuntum" } });
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais }));
    expect(screen.getByRole("status")).toHaveTextContent("Tuntum:seletor");
    expect(window.dataLayer).toContainEqual({ event: "seletor_cidade", cidade: "Tuntum" });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
```

`src/components/Accordion.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Accordion } from "./Accordion";

const ITENS = [
  { id: "cirurgia", pergunta: "Vou precisar operar?", resposta: "Resposta A" },
  { id: "valor", pergunta: "Qual o valor da consulta?", resposta: "Resposta B" },
];

describe("Accordion", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it("começa fechado com o conteúdo no HTML", () => {
    render(<Accordion itens={ITENS} />);
    const botao = screen.getByRole("button", { name: "Vou precisar operar?" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(document.body.textContent).toContain("Resposta A");
  });

  it("abre a pergunta, expõe a região e registra o evento", () => {
    render(<Accordion itens={ITENS} />);
    const botao = screen.getByRole("button", { name: "Vou precisar operar?" });
    fireEvent.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Vou precisar operar?" })).toHaveTextContent("Resposta A");
    expect(window.dataLayer).toContainEqual({ event: "faq_aberta", pergunta: "cirurgia" });
  });
});
```

Acrescentar a `src/App.test.tsx`:

```tsx
  it("tem as seções na ordem com as âncoras", () => {
    const { container } = render(<App />);
    const ids = Array.from(container.querySelectorAll("section[id]")).map((s) => s.id);
    expect(ids).toEqual(["para-quem", "como-funciona", "sobre", "onde-atende", "duvidas"]);
    expect(container.querySelector("#rodape")).not.toBeNull();
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test` → Expected: FAIL nos novos testes.

- [ ] **Step 3: Implementar**

`src/components/SeletorCidade.tsx`:

```tsx
import { useState } from "react";
import { TEXTOS_COMO_FUNCIONA as T } from "@/content/comoFunciona";
import { useCidade } from "@/context/CidadeContext";
import { REGIOES, buscarCidade, cidadesDaRegiao } from "@/data/locais";
import { track } from "@/lib/analytics";

export function SeletorCidade() {
  const { escolherCidade } = useCidade();
  const [valor, setValor] = useState("");

  function verLocais() {
    const cidade = buscarCidade(valor);
    if (!cidade) return;
    escolherCidade(cidade.id, "seletor");
    track("seletor_cidade", { cidade: cidade.nome });
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    document.getElementById("onde-atende")?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth" });
    document.getElementById(`aba-${cidade.id}`)?.focus({ preventScroll: true });
  }

  return (
    <div className="seletor-cidade">
      <label htmlFor="seletor-cidade">{T.rotuloSeletor}</label>
      <select id="seletor-cidade" value={valor} onChange={(e) => setValor(e.target.value)}>
        <option value="">{T.opcaoVazia}</option>
        {REGIOES.map((regiao) => (
          <optgroup key={regiao.id} label={regiao.nome}>
            {cidadesDaRegiao(regiao.id).map((cidade) => (
              <option key={cidade.id} value={cidade.id}>
                {cidade.nome}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button type="button" onClick={verLocais}>
        {T.botaoVerLocais}
      </button>
      <a href="#onde-atende">{T.linkTodosLocais}</a>
    </div>
  );
}
```

O rótulo de `T.botaoVerLocais` vem da nota `copy-lp` (o teste usa o próprio conteúdo, não um texto fixo).

`src/components/Accordion.tsx`:

```tsx
import { useState } from "react";
import { track } from "@/lib/analytics";

export interface ItemAccordion {
  id: string;
  pergunta: string;
  resposta: string;
}

export function Accordion({ itens }: { itens: ItemAccordion[] }) {
  const [aberto, setAberto] = useState<string | null>(null);

  function alternar(id: string) {
    const abrir = aberto !== id;
    setAberto(abrir ? id : null);
    if (abrir) track("faq_aberta", { pergunta: id });
  }

  return (
    <div className="accordion">
      {itens.map((item) => {
        const expandido = aberto === item.id;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={`faq-${item.id}`}
                aria-expanded={expandido}
                aria-controls={`faq-${item.id}-resposta`}
                onClick={() => alternar(item.id)}
              >
                {item.pergunta}
              </button>
            </h3>
            <div id={`faq-${item.id}-resposta`} role="region" aria-labelledby={`faq-${item.id}`} hidden={!expandido}>
              <p>{item.resposta}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

O conteúdo das respostas fica no HTML mesmo fechado (`hidden`), então está no HTML pré-renderizado.

Seções (estrutura obrigatória; textos da `copy-lp`):
- `S4ComoFunciona`: `<Secao id="como-funciona">`, lista ordenada `<ol>` com os 6 passos visíveis, `<SeletorCidade />`, `<Foto nome="consulta" ...>` e `<CtaWhatsApp localCta="como_funciona">`.
- `S5Sobre`: `<Secao id="sobre">`, `<Foto nome="sobre" ...>`, fatos do dossiê, assinatura completa (`ASSINATURA`) e `<CtaWhatsApp localCta="sobre">`. Nenhum campo de `PENDENCIAS` exibido enquanto for `null`.
- `S7Faq`: `<Secao id="duvidas">`, `<Accordion itens={...} />` com as 11 perguntas da spec §5.7 e o bloco "Ainda tem dúvida?" com `<CtaWhatsApp localCta="faq">`.
- `S8Rodape`: `<footer id="rodape">` com `ASSINATURA`, cidades por região (`REGIOES` + `cidadesDaRegiao`), `<CtaWhatsApp localCta="rodape">`, link `/politica-de-privacidade.html`, aviso de LGPD, `<Foto nome="cta-final" ...>` e `<div id="rodape-extra"></div>`.
- `public/politica-de-privacidade.html`: página estática com a minuta da C2, mesma paleta e fontes, link de volta para `/`. Comentário HTML no topo: `<!-- Minuta para revisão jurídica -->`.

Em `scripts/verificar-build.mjs`, acrescentar a `EXIGIDOS`:

```js
  ["âncoras de todas as seções", (h) => ["para-quem", "como-funciona", "sobre", "onde-atende", "duvidas", "rodape"].every((id) => h.includes(`id="${id}"`))],
  ["FAQ com respostas no HTML", (h) => (h.match(/role="region"/g) || []).length >= 11],
  ["link da política de privacidade", /href="\/politica-de-privacidade\.html"/],
```

- [ ] **Step 4: Rodar e ver passar; revisar as três telas**

Run: `npm test` e `npm run build` → verdes. Conferir 390x844, 820x1180 e 1440x900; conferir `dist/index.html` aberto com JavaScript desativado (textos, âncoras, endereços, "Como chegar" e CTA funcionam).

- [ ] **Step 5: Commit**

```bash
git add -A src public/politica-de-privacidade.html scripts/verificar-build.mjs
git commit -m "feat: adiciona como funciona, sobre, FAQ, rodape e politica de privacidade"
```

### Tarefa 10 (Tracking · Floor Tracking · `feat/tracking`): Consentimento, eventos e GTM

**Files:**
- Create: `src/lib/consentimento.ts`, `src/components/AvisoCookies.tsx`, `src/content/cookies.ts`, `src/lib/profundidade.ts`
- Modify: `src/lib/analytics.ts` (completo, mesma assinatura de `track`), `index.html` (consent default no `<head>`), `src/main.tsx` (agendar GTM e profundidade depois da hidratação), `src/App.tsx` (`<AvisoCookies />`), `src/sections/S8Rodape.tsx` (botão "Preferências de cookies" em `#rodape-extra`)
- Test: `src/lib/consentimento.test.ts`, `src/lib/analytics.test.ts`, `src/components/AvisoCookies.test.tsx`, `src/lib/profundidade.test.ts`

**Interfaces:**
- Consumes: `track` e os eventos já emitidos pelas Tarefas 5, 6, 8 e 9; `GTM_ID` (Tarefa 1).
- Produces: `lerConsentimento(): "aceito" | "recusado" | null`, `salvarConsentimento(v: "aceito" | "recusado"): void`, `aplicarConsentimento(v): void`; `carregarGtm(): void` (idempotente), `agendarGtm(): void`; `observarProfundidade(): () => void`; evento de janela `abrir-preferencias-cookies`.

- [ ] **Step 1: Consent default no `index.html`** (antes de qualquer script, dentro do `<head>`)

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
  gtag('set', 'ads_data_redaction', true);
  try { if (localStorage.getItem('lp_consentimento_v1') === 'aceito') gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' }); } catch (e) {}
</script>
```

- [ ] **Step 2: Escrever os testes que falham**

`src/lib/consentimento.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { aplicarConsentimento, lerConsentimento, salvarConsentimento } from "./consentimento";

describe("consentimento", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it("começa sem escolha", () => {
    expect(lerConsentimento()).toBeNull();
  });

  it("salva e lê a escolha", () => {
    salvarConsentimento("recusado");
    expect(lerConsentimento()).toBe("recusado");
  });

  it("aceitar envia consent update granted", () => {
    aplicarConsentimento("aceito");
    const ultimo = Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>);
    expect(ultimo[0]).toBe("consent");
    expect(ultimo[1]).toBe("update");
    expect(ultimo[2]).toMatchObject({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
  });

  it("recusar envia consent update denied", () => {
    aplicarConsentimento("recusado");
    const ultimo = Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>);
    expect(ultimo[2]).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });
});
```

`src/lib/analytics.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    window.dataLayer = [];
    document.head.querySelectorAll("script[data-gtm]").forEach((s) => s.remove());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("track põe o evento na fila e remove parâmetros vazios", async () => {
    const { track } = await import("./analytics");
    track("faq_aberta", { pergunta: "valor", vazio: undefined });
    expect(window.dataLayer).toContainEqual({ event: "faq_aberta", pergunta: "valor" });
  });

  it("sem GTM_ID não injeta script", async () => {
    vi.stubEnv("VITE_GTM_ID", "");
    const { carregarGtm } = await import("./analytics");
    carregarGtm();
    expect(document.head.querySelector("script[data-gtm]")).toBeNull();
  });

  it("com GTM_ID injeta o script uma vez, mesmo chamado duas vezes", async () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
    const { carregarGtm } = await import("./analytics");
    carregarGtm();
    carregarGtm();
    const scripts = document.head.querySelectorAll("script[data-gtm]");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute("src")).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-TESTE01");
  });

  it("clique no WhatsApp antes do GTM dispara o carregamento na hora", async () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
    const { track } = await import("./analytics");
    track("clique_whatsapp", { local_cta: "hero" });
    expect(document.head.querySelector("script[data-gtm]")).not.toBeNull();
  });
});
```

`src/lib/profundidade.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { marcosAtingidos } from "./profundidade";

describe("profundidade", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it("calcula os marcos pela fração rolada", () => {
    expect(marcosAtingidos(0.1)).toEqual([]);
    expect(marcosAtingidos(0.5)).toEqual([25, 50]);
    expect(marcosAtingidos(0.95)).toEqual([25, 50, 75, 90]);
  });
});
```

`src/components/AvisoCookies.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { AvisoCookies } from "./AvisoCookies";

describe("AvisoCookies", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it("aparece quando não há escolha e some ao aceitar", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.aceitar }));
    expect(screen.queryByRole("button", { name: T.aceitar })).toBeNull();
    expect(localStorage.getItem("lp_consentimento_v1")).toBe("aceito");
  });

  it("recusar guarda a escolha e mantém negado", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.recusar }));
    expect(localStorage.getItem("lp_consentimento_v1")).toBe("recusado");
  });

  it("não aparece quando já existe escolha e reabre pelo evento", () => {
    localStorage.setItem("lp_consentimento_v1", "recusado");
    render(<AvisoCookies />);
    expect(screen.queryByRole("button", { name: T.aceitar })).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(screen.getByRole("button", { name: T.aceitar })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test` → Expected: FAIL nos quatro arquivos novos.

- [ ] **Step 4: Implementar**

`src/lib/consentimento.ts`:

```ts
export type Escolha = "aceito" | "recusado";

const CHAVE = "lp_consentimento_v1";

export function lerConsentimento(): Escolha | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "aceito" || valor === "recusado" ? valor : null;
  } catch {
    return null;
  }
}

export function salvarConsentimento(escolha: Escolha): void {
  try {
    localStorage.setItem(CHAVE, escolha);
  } catch {
    /* storage bloqueado: vale só nesta página */
  }
}

export function aplicarConsentimento(escolha: Escolha): void {
  const valor = escolha === "aceito" ? "granted" : "denied";
  window.dataLayer = window.dataLayer || [];
  // gtag precisa do objeto arguments, não de um array.
  (function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
  })("consent", "update", {
    ad_storage: valor,
    ad_user_data: valor,
    ad_personalization: valor,
    analytics_storage: valor,
  });
}
```

`src/lib/analytics.ts` (completo):

```ts
import { GTM_ID } from "@/config";
import { urlLimpa } from "@/lib/origem";

export type ParametrosEvento = Record<string, string | number | undefined>;

export interface OpcoesEvento {
  /** Chamado uma vez: pelo GTM (eventCallback) ou pelo tempo-limite, o que vier primeiro. */
  aoConcluir?: () => void;
  tempoLimiteMs?: number;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

let gtmCarregado = false;

/** URL sem utm_term, texto livre e âncora, para o GTM usar como page_location do GA4. */
export function registrarPagina(): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ pagina_limpa: urlLimpa(window.location.href) });
}

export function carregarGtm(): void {
  if (gtmCarregado || typeof document === "undefined") return;
  const id = import.meta.env.VITE_GTM_ID ?? GTM_ID;
  if (!id) return;
  gtmCarregado = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  script.dataset.gtm = "";
  document.head.appendChild(script);
}

/** Depois do primeiro frame, sem esperar gesto. */
export function agendarGtm(): void {
  const agendar = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
  agendar(() => carregarGtm());
}

export function track(evento: string, params: ParametrosEvento = {}, opcoes: OpcoesEvento = {}): void {
  if (typeof window === "undefined") return;
  const limpo = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  window.dataLayer = window.dataLayer || [];
  // O clique pode vir antes do carregamento agendado: carrega o GTM na hora.
  if (evento === "clique_whatsapp") carregarGtm();
  const { aoConcluir, tempoLimiteMs = 800 } = opcoes;
  if (!aoConcluir) {
    window.dataLayer.push({ event: evento, ...limpo });
    return;
  }
  let concluido = false;
  const concluir = () => {
    if (concluido) return;
    concluido = true;
    aoConcluir();
  };
  window.dataLayer.push({ event: evento, ...limpo, eventCallback: concluir, eventTimeout: tempoLimiteMs });
  window.setTimeout(concluir, tempoLimiteMs);
}
```

Acrescentar a `src/lib/analytics.test.ts`:

```ts
  it("registrarPagina põe a URL limpa na fila, sem utm_term", async () => {
    window.history.replaceState(null, "", "/?utm_source=google&utm_term=dor+no+joelho#duvidas");
    const { registrarPagina } = await import("./analytics");
    registrarPagina();
    const item = window.dataLayer!.find((e) => "pagina_limpa" in e)!;
    expect(item.pagina_limpa).toBe(`${window.location.origin}/?utm_source=google`);
  });

  it("track com aoConcluir chama uma vez só (callback do GTM e tempo-limite)", async () => {
    vi.useFakeTimers();
    const { track } = await import("./analytics");
    const aoConcluir = vi.fn();
    track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir });
    const item = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    (item.eventCallback as () => void)();
    vi.advanceTimersByTime(1000);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
```

`src/lib/profundidade.ts`:

```ts
import { track } from "@/lib/analytics";

const MARCOS = [25, 50, 75, 90];

export function marcosAtingidos(fracao: number): number[] {
  return MARCOS.filter((m) => fracao * 100 >= m);
}

export function observarProfundidade(): () => void {
  const enviados = new Set<number>();
  function aoRolar() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    for (const marco of marcosAtingidos(window.scrollY / total)) {
      if (enviados.has(marco)) continue;
      enviados.add(marco);
      track("profundidade_rolagem", { percentual: marco });
    }
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  return () => window.removeEventListener("scroll", aoRolar);
}
```

`src/components/AvisoCookies.tsx`:

```tsx
import { useEffect, useState } from "react";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { aplicarConsentimento, lerConsentimento, salvarConsentimento, type Escolha } from "@/lib/consentimento";

export function AvisoCookies() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    setAberto(lerConsentimento() === null);
    const reabrir = () => setAberto(true);
    window.addEventListener("abrir-preferencias-cookies", reabrir);
    return () => window.removeEventListener("abrir-preferencias-cookies", reabrir);
  }, []);

  function escolher(escolha: Escolha) {
    salvarConsentimento(escolha);
    aplicarConsentimento(escolha);
    setAberto(false);
  }

  if (!aberto) return null;
  return (
    <div role="region" aria-label={T.rotulo} className="fixed inset-x-0 bottom-0 z-50">
      <p>
        {T.texto} <a href="/politica-de-privacidade.html">{T.linkPolitica}</a>
      </p>
      <button type="button" onClick={() => escolher("recusado")}>
        {T.recusar}
      </button>
      <button type="button" onClick={() => escolher("aceito")}>
        {T.aceitar}
      </button>
    </div>
  );
}
```

Em `S8Rodape`, dentro de `#rodape-extra`: `<button type="button" onClick={() => window.dispatchEvent(new Event("abrir-preferencias-cookies"))}>{TEXTOS_COOKIES.preferencias}</button>`.

Em `src/main.tsx`, depois do `hydrateRoot`/`render`: `registrarPagina(); agendarGtm(); observarProfundidade();` (importados de `@/lib/analytics` e `@/lib/profundidade`). `registrarPagina` vem antes do GTM para o `page_location` já sair limpo.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test` e `npm run build` → verdes.

- [ ] **Step 6: Contêiner do GTM (sem publicar)**

Com os acessos da nota "Credenciais, instruções e acessos" (seguir as instruções dela), num workspace do contêiner:
- Variáveis de camada de dados: `local_cta`, `cidade`, `local`, `ref`, `regiao`, `pergunta`, `percentual`, `etapa`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `gclid`. **Não criar** variável, parâmetro nem campo para `utm_term`.
- Acionadores de evento personalizado: `clique_whatsapp`, `autoavaliacao_etapa`, `autoavaliacao_concluida`, `autoavaliacao_pulada`, `seletor_cidade`, `troca_aba_cidade`, `como_chegar`, `faq_aberta`, `profundidade_rolagem`.
- Tags: Google tag (GA4) na inicialização; um evento GA4 por evento acima com os parâmetros da spec §8; Vinculador de conversões; conversão do Google Ads em `clique_whatsapp` (ID e rótulo da ação: criada só depois da confirmação do André). Configurações de consentimento nativas das tags do Google.
- Google tag do GA4: `page_location` = variável de camada de dados `pagina_limpa` (sem `utm_term`, sem texto livre, sem âncora); não criar variável nem parâmetro para `utm_term`. Conferir que nenhum evento leva região do corpo, limitação ou tratamento.
- Validar no modo de visualização (Tag Assistant) com `npm run preview` do Floor e `VITE_GTM_ID` em `.env.local` (fora do git): todos os eventos, com consentimento aceito e recusado. **Critério de aceite da conversão:** com a aba de rede do Chrome aberta e "Preserve log" ligado, carregar a página e clicar no CTA do hero em até 1 segundo; a requisição de conversão do Google Ads (e o `collect?v=2` do GA4 com `gcs`/`gcd`) precisa aparecer **antes** da navegação para `wa.me`, com consentimento aceito e com recusado. Repetir 5 vezes; anotar quantas passaram. Registrar a lacuna conhecida: sem JavaScript o link abre o WhatsApp e nenhuma conversão é medida. **Não publicar.**
- Nenhuma tag, acionador ou variável usa `Click URL`, `Click Text` ou a URL de destino dos links. A medição otimizada de "cliques de saída" do stream do GA4 fica desligada (parecer R5).
- Mandar ao Maestro a lista do que seria publicado ou alterado em conta real (versão do contêiner com tags, acionadores e variáveis; ação de conversão no Google Ads com nome, categoria e contagem "uma"; retenção de dados do GA4 em 14 meses, como diz a política de privacidade; medição otimizada de cliques de saída desligada no stream). O Maestro pede ao André a confirmação única.

- [ ] **Step 7: Commit**

```bash
git add -A src index.html
git commit -m "feat: adiciona consentimento, eventos e carregamento do GTM"
```

### Tarefa 11 (Dev · ground, depois do merge da Tarefa 7): Vercel, preview e produção

**Files:**
- Create: `vercel.json` (numa branch `chore/vercel` no Floor Dev, pelo fluxo normal de revisão)

Regra (pareceres R2 e R2b, achado 1): até o marco de produção, cada entrega aprovada vai para um **preview** (protegido pela Vercel por padrão). O marco de produção é: Tarefas 8, 9 e 10 na `main`, C1 e C2 aprovadas, QA da Tarefa 12 sem falha crítica e fatos da política de privacidade confirmados pelo André (spec §17, item 10). Todos os comandos desta tarefa rodam no **Git Bash** (no PowerShell, `curl` vira `Invoke-WebRequest` e `grep` não existe). Daí em diante, **produção** a cada merge aprovado. O token vem da nota "Credenciais, instruções e acessos" para a variável `VERCEL_TOKEN` da sessão e nunca é impresso.

- [ ] **Step 1: `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(img|fonts)/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=2592000" }] }
  ]
}
```

- [ ] **Step 2: Criar e vincular o projeto** (no ground, na `main`, depois do merge)

```bash
npx vercel@60 project add lp-dr-santos --token "$VERCEL_TOKEN"
npx vercel@60 link --yes --project lp-dr-santos --token "$VERCEL_TOKEN"
```

- [ ] **Step 3: Deploy de preview (até o marco)**

```bash
npx vercel@60 pull --yes --environment=preview --token "$VERCEL_TOKEN"
npx vercel@60 build --token "$VERCEL_TOKEN"
npx vercel@60 deploy --prebuilt --token "$VERCEL_TOKEN"
```

O deploy pré-construído envia só `.vercel/output`, sem `Sobre o Patrick/` nem `fotos-originais/`. Mandar a URL de preview ao Maestro.

- [ ] **Step 4: Variável do GTM** (quando o Tracking tiver o ID do contêiner)

```bash
npx vercel@60 env add VITE_GTM_ID production --token "$VERCEL_TOKEN"
npx vercel@60 env add VITE_GTM_ID preview --token "$VERCEL_TOKEN"
```

O valor vem da nota de credenciais, digitado no prompt do comando (nunca em argumento nem em log). Como o Vite embute a variável no build, todo deploy depois disso começa com `vercel pull` do ambiente certo. Conferir no artefato sem imprimir o ID: `grep -l "googletagmanager" .vercel/output/static/assets/*.js | wc -l` deve ser ≥ 1 e `grep -c "GTM-" .vercel/output/static/assets/*.js` maior que 0.

- [ ] **Step 5: Produção (a partir do marco)**

```bash
npx vercel@60 pull --yes --environment=production --token "$VERCEL_TOKEN"
npx vercel@60 build --prod --token "$VERCEL_TOKEN"
npx vercel@60 deploy --prebuilt --prod --token "$VERCEL_TOKEN"
```

- [ ] **Step 6: Conferir**

Run: `curl -s -o /dev/null -w "%{http_code}" https://lp-dr-santos.vercel.app/` → Expected: `200`; `curl -s https://lp-dr-santos.vercel.app/ | grep -c "CRM-MA 16520"` → Expected: ≥ 1; `curl -s -o /dev/null -w "%{http_code}" https://lp-dr-santos.vercel.app/__preview.html` → Expected: `404`.

- [ ] **Step 7: Depois de cada merge aprovado**

Repetir o Step 3 (antes do marco) ou o Step 5 (depois do marco) no ground e mandar a URL ao Maestro.

### Tarefa 12 (Browser/QA): QA nas três telas e sem JavaScript

Ambiente: o preview mais recente da Vercel (a QA vem antes do marco de produção) e, se necessário, `npm run preview` do ground. Chrome liberado pelo Maestro (Tracking fora do Chrome).

- [ ] Em 390x844, 820x1180 e 1440x900, conferir e registrar (ok ou falha com passos, esperado, obtido e print):
  - topbar fixa visível do topo ao rodapé;
  - badge de particular no hero; CTA visível sem rolar no mobile; assinatura com MÉDICO, CRM e RQE;
  - "Veja onde ele atende" rola até `#onde-atende`;
  - autoavaliação: três toques, pular, voltar, teclado, foco, resultado sem procedimento, caixa de inclusão, CTA;
  - seletor de cidade da seção 4 abre a aba certa;
  - as 11 abas: estado inicial neutro, abertura, teclado, rolagem da barra no mobile;
  - os 14 mapas carregam na aba certa e mostram o local certo (anotar Mendesclin, Clinimed e CM LAB Graça Aranha);
  - os 14 "Como chegar" abrem o link do brief;
  - todos os CTAs abrem o WhatsApp com a mensagem certa (sem cidade, com cidade, com local, com resumo só com opt-in);
  - accordion do FAQ; botão flutuante no mobile; aviso de cookies (aceitar, recusar, reabrir pelo rodapé);
  - leitor de tela básico (NVDA ou narrador) na autoavaliação e nas abas.
- [ ] Sem JavaScript (DevTools > Desativar JavaScript): textos, âncoras, endereços, "Como chegar" e CTA base funcionam.
- [ ] Mandar o relatório ao Maestro e avisar que liberou o Chrome.

### Tarefa 13 (Tracking): Validação em produção

- [ ] Depois da confirmação do André e da publicação do contêiner e da ação de conversão: no ambiente publicado, conferir cada evento no Tag Assistant e nas requisições de rede, com consentimento aceito e recusado, incluindo clique imediato no CTA. Mandar ao Maestro a lista final de eventos com onde cada um dispara.

### Tarefa 14 (Maestro): PageSpeed e entrega final

- [ ] PageSpeed mobile e desktop pela API pública (`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Flp-dr-santos.vercel.app%2F&strategy=mobile` e `&strategy=desktop`), anotando nota, LCP, CLS e INP (ou TBT).
- [ ] Se mobile < 90: abrir tarefa de correção com o achado do relatório (Designer ou Dev) e repetir.
- [ ] Entrega ao André: URL da Vercel, lista de eventos com onde disparam, PageSpeed mobile e desktop, interativo escolhido e por quê, componentes do 21st.dev e do Motion Sites (se entrou algum) e as pendências da spec §17.
