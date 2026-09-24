# LP Atendimento Particular MA: Dr. Patrick Santos

Spec de design, versão 2. Data: 24/09/2026. Dono: Maestro. Decisões delegadas pelo André ("pode decidir tudo por mim").
A versão 2 incorpora o parecer R1 do Revisor (MUDANÇAS NECESSÁRIAS, 13 achados, todos aceitos; ajustes de compatibilidade com o brief registrados na seção 18).

## 1. Objetivo e métrica

Landing page de captação para Google Ads (rede de pesquisa), tráfego principalmente de celular. A conversão medida é o **clique de saída para o WhatsApp** (não é consulta agendada), com mensagem pré-preenchida. Sem formulário.

- Público: só particular.
- Metas técnicas: PageSpeed mobile acima de 90 e desktop acima de 95 no build publicado; LCP abaixo de 2,5 s e CLS até 0,1 em 4G simulado; INP abaixo de 200 ms.
- Orçamento: JS inicial até 90 KB gzip; CSS até 25 KB; no máximo 2 fontes pré-carregadas somando até 60 KB; foto do hero até 70 KB (AVIF 720 px); nenhum iframe antes de ação do usuário.
- Deploy: Vercel, projeto `lp-dr-santos`, domínio `lp-dr-santos.vercel.app` até o domínio definitivo. Deploy de produção a cada entrega aprovada pelo Revisor (exceção autorizada pelo André).

## 2. Fontes e regra de dados

Tudo o que aparece na página sai destes arquivos. Ninguém inventa dado, número, depoimento, credencial nem data de atendimento. O que faltar fica em `src/config.ts` com valor `null`, **nunca aparece como placeholder para o público** (a página orienta a perguntar no WhatsApp) e entra na lista de pendências.

| Fonte | Uso |
|---|---|
| Brief do André (chat do Maestro, 24/09/2026) | Arquitetura da página, endereços e links dos 14 locais, regras de tracking e deploy |
| `Sobre o Patrick/` (fora do git: dados do cliente): dossiê, 3 ICPs + comparativo, 15 personas | Nome, CRM, RQE, serviços, tom, dores, objeções, voz do cliente |
| `Downloads/Estrategia-Dr-Patrick-Silva.pdf` | Filtro de público (particular), jornada, rastreamento |
| `fotos-originais/` (17 fotos, fora do git) | Fotos do médico |
| Nota do canvas "Credenciais, instruções e acessos" | Acessos de GTM, GA4, Google Ads, Vercel, 21st.dev e Motion Sites. Só Tracking, Dev e Browser/QA leem. Nunca copiar credencial para spec, código, commit ou log |
| Resolução CFM 2.336/2023 (publicidade) e Resolução CFM 2.464/2026 (PRP) | Regras de compliance da seção 13 |

## 3. O médico e o público

- **Nome e assinatura:** Dr. Patrick Santos, MÉDICO, CRM-MA 16520, Ortopedia e Traumatologia, RQE 7389. A página anuncia a pessoa física. "Instituto Patrick Santos" não aparece até o André confirmar o enquadramento (pendência).
- **O que ele faz (dossiê), como a página pode dizer:** consulta ortopédica; infiltrações articulares, inclusive com ácido hialurônico; procedimentos guiados por ultrassom (formação em ultrassom em Salvador); PRP apenas como possibilidade avaliada na consulta, nos casos previstos pela Resolução CFM 2.464/2026, sem ligar a regiões fora dessas indicações. **BMA não aparece na página.** "Medicina regenerativa" não é chamada de especialidade e não vem com promessa de regeneração.
- **Público:** três ICPs com o mesmo peso (decisão do André).
  1. Artrose e desgaste articular, 50+, joelho, quadril e ombro.
  2. Dor de coluna no trabalhador ativo, 35 a 60, lombar, ciática e cervical.
  3. Lesão esportiva e tendinopatia, 25 a 50, calcanhar, ombro, cotovelo e tendão.
- **Filtro comum:** só particular. Não atende plano de saúde nem SUS.
- **Dor principal:** dor que já limita a rotina (escada, sono, trabalho, estrada, treino) depois de tratamentos que só aliviaram por um tempo.
- **Desejo principal:** alívio da dor e retorno da mobilidade (briefing), na própria cidade, sem viajar para a capital.
- **Objeções:** medo de cirurgia; "não tem mais jeito" e "é da idade"; "infiltração é corticoide e estraga o osso"; tratamento que só mascara; tratamento moderno só na capital; se vale o valor; onde e quando ele atende; "ortopedista só manda parar" (esporte).
- **Nível de consciência:** predominante consciente do problema entrando em consciente da solução; filhos na capital e quem já fez infiltração em consciente do produto.
- **Canal de agendamento:** WhatsApp único `5513996822680`, exibido como (13) 99682-2680 (decisão do André).
- **Dias de atendimento:** o dossiê não traz agenda por cidade. A página não mostra dias nem promete data: orienta a consultar a disponibilidade da cidade pelo WhatsApp.

## 4. Arquitetura

**Abordagem: HTML pré-renderizado no build**, no padrão da LP do Dr. Henrique (`C:\Users\Andre\LPs\Effect\Dr Henrique Isaacsson\drhenriqueisaacsson\scripts\prerender.mjs`).

- Vite + React 18 + TypeScript + Tailwind CSS v4, mobile first. Node 24.
- `npm run build` = `tsc --noEmit` + `vite build` + `vite build --ssr src/entry-server.tsx --outDir dist-ssr` + `node scripts/prerender.mjs` + `node scripts/verificar-build.mjs`.
- **Todas as seções entram no HTML pré-renderizado.** Nada de `React.lazy` para conteúdo (o `renderToString` entregaria só o fallback). A página funciona sem JavaScript: textos, âncoras, endereços, links "Como chegar" e CTAs (link base do WhatsApp). O JS só hidrata a interação.
- Carregam sob demanda apenas: iframes de mapa (quando o usuário abre a aba da cidade), GTM (seção 8) e qualquer animação pesada.
- Componentes renderizam no servidor sem acessar `window`, `document` ou `sessionStorage` no render; efeitos de navegador ficam em `useEffect`.
- Sem backend. Deploy estático na Vercel.

### Estrutura de pastas

```
src/
  App.tsx                    ordem das seções
  main.tsx                   hydrate em produção, render em dev
  entry-server.tsx           renderToString(<App />) para o prerender
  config.ts                  médico, WhatsApp, SITE_URL, GTM_ID, pendências (null)
  data/locais.ts             14 locais em 11 cidades, 2 regiões (fonte: brief)
  data/jsonld.ts             IndividualPhysician + 12 MedicalClinic + 2 Hospital
  content/*.ts               textos por seção, vindos da nota "copy-lp"
  context/CidadeContext.tsx  cidade escolhida pelo usuário (nunca presumida)
  lib/origem.ts              UTMs, gclid e referência curta da sessão
  lib/whatsapp.ts            monta o link wa.me
  lib/consentimento.ts       Consent Mode v2 e escolha do usuário
  lib/analytics.ts           track() no dataLayer + carregamento do GTM
  components/                Topbar, CtaWhatsApp, BotaoFlutuante, Secao, Foto, Accordion, Abas, CartaoLocal, AvisoCookies
  sections/                  S1Topbar ... S8Rodape
  interativos/Autoavaliacao.tsx
  styles/tokens.css, global.css
scripts/prerender.mjs, scripts/verificar-build.mjs, scripts/imagens.mjs
public/fonts/, public/img/, public/politica-de-privacidade.html, public/favicon.svg
public/__preview.html        só em dev, no .gitignore e removido do build
```

## 5. Página: seções, nesta ordem

Âncoras: `#para-quem`, `#como-funciona`, `#sobre`, `#onde-atende`, `#duvidas`. Todas existem no HTML inicial.

### 5.1 Topbar fixa (todas as larguras)
Fixa no topo em mobile, tablet e desktop. Fundo dourado claro com texto grafite em negrito (contraste mínimo 7:1). Mensagem: atendimento exclusivamente particular, não aceita plano de saúde nem SUS. Cabe em uma linha a 360 px (ou duas curtas). A mesma informação aparece como badge no hero.

### 5.2 Hero
- Badge "Atendimento particular" com o mesmo aviso da topbar.
- Headline, subheadline e CTA (chamar no WhatsApp para agendar). CTA visível sem rolagem a 390x844.
- Linha que diz que ele atende em 14 clínicas e hospitais parceiros de 11 cidades do Maranhão, com o link "Veja onde ele atende" (`href="#onde-atende"`, âncora real).
- Assinatura completa (seção 3) junto ao nome.
- Foto `_DSC2060` (jaleco preto, sorrindo, fundo neutro), recorte 4:5. Imagem de LCP: `<img>` no HTML inicial com `srcset`/`sizes` corretos, `fetchpriority="high"`, sem lazy.
- Máximo de 4 blocos de texto. Sem travessão.

### 5.3 Identificação: para quem é
1. Três exemplos estáticos com o mesmo peso visual: articulação (joelho, quadril, ombro), coluna (lombar, ciática, pescoço) e esporte (calcanhar, tendão, cotovelo), com sinais que a pessoa reconhece nela mesma (textos do copy a partir de ICPs e personas).
2. CTA direto visível antes e depois do interativo.
3. **Interativo A (opcional, curto):** autoavaliação em 3 toques, com "Pular" e "Voltar" em toda etapa.
   - Etapas: onde dói; o que a dor já atrapalha; o que já tentou. Cada etapa é um `<fieldset>` com `<legend>`, opções como botões de rádio grandes (48 px), foco movido para a próxima legenda após responder, progresso anunciado ("Etapa 2 de 3").
   - Resultado: resume o que a pessoa marcou e diz o que a consulta avalia. Não dá diagnóstico, não sugere procedimento (nem PRP, nem infiltração) e traz "isso não substitui a avaliação na consulta".
   - CTA do resultado com a caixa "Incluir meu resumo na mensagem do WhatsApp", desmarcada por padrão, com aviso curto de privacidade. Só com a caixa marcada o resumo entra na mensagem.
   - As respostas ficam só em memória do componente: não vão para storage, dataLayer, GA4 nem Ads.

### 5.4 Como funciona a consulta
Seis passos legíveis de uma vez (sem clique para revelar):
1. Você chama no WhatsApp e diz sua cidade.
2. Pelo WhatsApp você consulta a disponibilidade na sua cidade e o valor da consulta particular.
3. Consulta: conversa sobre a dor e o que já foi tentado, exame físico e os exames que você levar.
4. Plano explicado com calma: o que dá para tratar no consultório e quando a cirurgia é o caminho.
5. Procedimento, quando indicado.
6. Retorno, quando indicado, para acompanhar a evolução.

Abaixo dos passos, um controle simples "Sua cidade" (`<select>` nativo com as 11 cidades agrupadas por região em `<optgroup>`) com botão "Ver locais": define a cidade escolhida no `CidadeContext`, abre a aba correspondente em `#onde-atende` e rola até lá. Foto de apoio: `_DSC2001`. Não afirmar ultrassom em toda consulta nem em toda clínica.

### 5.5 Sobre o doutor
Só fatos do dossiê: assinatura completa; atua com infiltrações articulares e procedimentos guiados por ultrassom, com formação em ultrassom em Salvador; atende em 14 clínicas e hospitais parceiros em 11 cidades do Maranhão; jeito de explicar com calma ("ortopedia humanizada", posicionamento dele); também ensina outros médicos. Graduação, residência e anos de experiência: ausentes no dossiê, não aparecem (pendência). Foto: `_DSC2069` (explicando no modelo de joelho).

### 5.6 Onde ele atende
- Abas por cidade, agrupadas por região com rótulo visível: "Sul Maranhense" (Balsas, São Domingos do Azeitão, São Raimundo das Mangabeiras, Loreto) e "Centro Maranhense" (Presidente Dutra, Fortuna, Gonçalves Dias, São Domingos do Maranhão, Tuntum, Graça Aranha, Barra do Corda). 11 abas.
- **Estado inicial neutro:** nenhuma aba aberta, a não ser que a URL traga `?cidade=<id>` válido (vindo do anúncio) ou que o usuário tenha escolhido a cidade no seletor da seção 5.4. Sem aba aberta, o painel mostra "Escolha sua cidade acima" e nenhum iframe.
- Mobile: barra de abas com rolagem horizontal, scroll-snap, sombra indicando que há mais abas, e a aba focada rola para ficar visível.
- Padrão ARIA de abas: `role="tablist"` com `aria-label`, `role="tab"` com `aria-selected`, `aria-controls` e roving `tabindex`; `role="tabpanel"` com `aria-labelledby`; setas, Home e End; ativação manual (Enter/Espaço) para não abrir mapas só por navegar com setas.
- Cada local mostra, no HTML: nome, endereço por escrito exatamente como no brief e botão "Como chegar" com o link do brief. Dias de atendimento: campo existe nos dados, mas hoje nenhum local tem, então não aparece.
- **Mapa:** o iframe `https://www.google.com/maps?q=<NOME ENDERECO>&output=embed` (com `URLSearchParams`) só recebe `src` quando o usuário abre a aba daquela cidade. Altura reservada. `title="Mapa: <local>"`, `loading="lazy"`, `referrerpolicy="no-referrer-when-downgrade"`.
- Cada local tem CTA "Agendar em <cidade>" com cidade e local na mensagem.
- Abrir uma aba é uma escolha explícita do usuário: a cidade dessa aba passa a ir na mensagem dos CTAs gerais (exigência do brief). O CTA de um local manda cidade e local.
- Endereços exatamente como no brief (Mendesclin com o endereço escrito; divergência reportada no fim; Clinimed e CM LAB Graça Aranha sem número).

### 5.7 FAQ (accordion)
Respostas só a partir das fontes. Quando a informação não existe (valor, pagamento, duração, retorno, dias), a resposta orienta a perguntar no WhatsApp, sem placeholder visível.
- Vou precisar operar? (honestidade sobre limites; sem prometer evitar cirurgia)
- Infiltração é corticoide? Estraga o osso? (diferença entre corticoide e ácido hialurônico; PRP só dentro da Resolução CFM 2.464/2026; sem promessa)
- Me disseram que é da idade e que não tem mais jeito. Vale consultar?
- Preciso ir para a capital para esse tipo de tratamento?
- Em quais cidades e clínicas ele atende, e em que dias?
- Qual o valor da consulta e as formas de pagamento?
- Por que não atende plano de saúde nem SUS?
- O que levar na consulta? (exames de imagem que já tiver, lista de remédios, relatórios anteriores; validar com o médico)
- Quanto tempo dura a consulta?
- Como funciona o retorno?
- Como agendar?

Accordion com `<button aria-expanded aria-controls>` e painel `role="region"`; conteúdo presente no HTML. Bloco "Ainda tem dúvida?" com CTA no fim.

### 5.8 Rodapé
Assinatura completa, lista resumida das 11 cidades por região, CTA final, link para `/politica-de-privacidade.html`, aviso de LGPD e link "Preferências de cookies" que reabre o aviso.

### 5.9 Botão flutuante
Botão de WhatsApp fixo no canto inferior direito no mobile, depois que o CTA do hero sai da viewport. Não cobre a topbar, as abas nem o aviso de cookies.

### 5.10 Aviso de cookies
Barra inferior não bloqueante com "Aceitar" e "Recusar" e link para a política. Padrão negado até a escolha. A escolha fica em `localStorage` (try/catch) e pode ser mudada pelo link do rodapé. Clique em CTA não é consentimento.

## 6. Elementos interativos: decisão (parecer R1 do Revisor)

- **A entra**, na seção 5.3, no formato opcional e curto descrito em 5.3.
- **B não entra** como linha do tempo de clique: atrasava a resposta sobre local, data e valor e custava JS, INP e acessibilidade. Fica o seletor simples de cidade da seção 5.4.
- **C não entra:** o contraste "dia com dor x dia recuperado" sugere desfecho garantido.

## 7. Link do WhatsApp e origem

- `lib/origem.ts`: na primeira carga lê `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid` e `cidade` da URL e grava em `sessionStorage` (try/catch, com fallback em memória). Gera uma referência curta de 6 caracteres por sessão (`ref`).
- `lib/whatsapp.ts`: `montarLinkWhatsApp(pedido)` devolve `https://wa.me/5513996822680?text=<mensagem>`.
  - Sem cidade escolhida: mensagem base que pede para a pessoa informar a cidade.
  - Com cidade escolhida: mensagem com a cidade. Com local: cidade e local.
  - Com resumo da autoavaliação (só se a caixa estiver marcada): acrescenta o resumo.
  - Toda mensagem termina com `(ref XXXXXX)`.
- O `href` do HTML pré-renderizado é o link base, então o CTA funciona sem JavaScript. No clique, o handler troca o `href` pelo link completo antes da navegação (sem `preventDefault`, sem `window.open` assíncrono). `target="_blank"` e `rel="noopener"`.

## 8. Consentimento e tracking

Implementado pelo Tracking. Publicar versão do contêiner do GTM e criar ações de conversão no Google Ads: uma confirmação única do André, com a lista do que vai ser publicado.

- **Consent Mode v2 (modo avançado):** `index.html` define `dataLayer` e `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500})` antes de qualquer tag. "Aceitar" envia `consent update` com tudo `granted`; "Recusar" mantém negado. Validação jurídica do modelo: pendência para o André.
- **Carregamento do GTM:** depois do primeiro frame, em `requestIdleCallback` (fallback 1,5 s), sem esperar gesto. Se o usuário clicar num CTA antes, o clique dispara o carregamento na hora. Eventos anteriores ficam na fila do `dataLayer`, que o GTM processa ao carregar. Teste obrigatório de clique imediato.
- **Conversão primária única:** a tag de conversão do Google Ads disparada pelo evento `clique_whatsapp`. O evento de GA4 com o mesmo nome é evento-chave para análise e não é importado como conversão primária no Ads (evita contagem dupla).

| Evento (dataLayer) | Parâmetros | Onde dispara |
|---|---|---|
| `clique_whatsapp` (conversão primária) | `local_cta` (topbar, hero, identificacao, autoavaliacao, como_funciona, sobre, onde_atende, faq, rodape, flutuante), `cidade`, `local`, `ref`, `utm_*`, `gclid` | Todo CTA de agendamento |
| `autoavaliacao_etapa` | `etapa` (1, 2, 3) | Avanço de etapa. Sem respostas |
| `autoavaliacao_concluida` | nenhum | Resultado exibido. Sem respostas |
| `autoavaliacao_pulada` | `etapa` | Clique em "Pular" |
| `seletor_cidade` | `cidade` | Seletor da seção 5.4 |
| `troca_aba_cidade` | `cidade`, `regiao` | Abertura de aba em `#onde-atende` |
| `como_chegar` | `local`, `cidade` | Clique em "Como chegar" |
| `faq_aberta` | `pergunta` | Abertura de pergunta |
| `profundidade_rolagem` | `percentual` (25, 50, 75, 90) | Uma vez por marco, por sessão |

Nenhum evento carrega dado de saúde (região do corpo, limitação, tratamento). Validação: modo de visualização do GTM e requisições de rede (`collect?v=2` com `gcs`/`gcd`, conversão do Ads) no Chrome, local e em produção, com consentimento aceito e recusado.

## 9. Dados estruturados

`data/jsonld.ts` gera um `<script type="application/ld+json">` no HTML inicial, com `@graph`:
- `IndividualPhysician` (`@id` `${SITE_URL}/#medico`): nome, `medicalSpecialty` `https://schema.org/Musculoskeletal`, `identifier` com CRM-MA 16520 e RQE 7389, `telephone`, `url`, `image` absoluto (hero 960 px), `practicesAt` com os `@id` dos 14 locais (a lista do brief é a confirmação dos vínculos).
- 12 `MedicalClinic` e 2 `Hospital` (Hospital São José e Hospital Florêncio Brandes), com `@id` estável `${SITE_URL}/#local-<id>`, `name`, `address` (`PostalAddress` com `streetAddress`, `addressLocality`, `addressRegion` "MA", `postalCode` quando houver, `addressCountry` "BR") e `hasMap` com o link do brief.
- `SITE_URL` vem de `config.ts` e muda quando o domínio definitivo chegar. Validar no validador do schema.org (sintaxe); o teste de resultados avançados não garante exibição.

## 10. Identidade visual

- Linha do dossiê: monograma em traço fino, paleta escura com dourado e bege, tipografia serifada. Logo oficial não entregue: wordmark tipográfico "Dr. Patrick Santos" e favicon com as iniciais "PS" (pendência do arquivo).
- Tokens iniciais (o Designer ajusta mantendo AA): grafite `#15171B`, creme de fundo `#F8F4EC`, bege `#EDE3D2`, dourado `#B98F4E` (texto dourado só sobre grafite), dourado claro da topbar `#D4B06A` com texto `#15171B`, CTA verde WhatsApp escuro `#1E7F4F` com texto branco.
- Tipografia: Lora 600/700 nos títulos e Figtree 400/600 no corpo, self-hosted em woff2 (subset latin), `font-display: swap`, fallback métrico. Corpo mínimo 18 px no mobile, entrelinha 1,6.
- Alvos de toque de 48 px, contraste WCAG AA, foco visível, `prefers-reduced-motion` respeitado. Transição entre seções só por cor de fundo.

## 11. Imagens

- Seleção: hero `_DSC2060`; sobre `_DSC2069`; como funciona `_DSC2001`; CTA final `_DSC1992`.
- `scripts/imagens.mjs` (ffmpeg: libaom-av1 e libwebp) gera AVIF e WebP nas larguras 480, 720, 960 e 1280 em `public/img/`, recorte 4:5 por foto. Originais continuam em `fotos-originais/`, fora do git.
- `<picture>` com AVIF, WebP e `srcset`/`sizes`; dimensões explícitas. Hero sem lazy e com `fetchpriority="high"`; demais com `loading="lazy"` e `decoding="async"`.

## 12. Componentes de terceiros (21st.dev e Motion Sites)

Opcional. O Designer pode propor um elemento que ajude a conversão (não decoração). A navegação nos sites é feita pelo Browser/QA com os acessos da nota de credenciais; só itens gratuitos no Motion Sites; ninguém assina, paga ou cadastra forma de pagamento. O prompt fornecido pelo site é adaptado à stack, à identidade, ao mobile e ao tom. Conferir licença de uso comercial. Animação pesada com lazy load e `prefers-reduced-motion`, dentro do orçamento da seção 1. Registrar aqui: nome, URL, licença e onde entrou. Hoje: nenhum.

**Assets gerados (autorizado pelo André):** o Designer (Codex) pode gerar assets e elementos visuais (ícones, grafismos, texturas, ilustrações anatômicas neutras, favicon e monograma provisório) e colocá-los na página, em SVG sempre que possível ou em AVIF/WebP dentro do orçamento da seção 1. Limites: nenhuma imagem de paciente, de procedimento em pessoa, de antes e depois ou que sugira resultado; nenhuma imagem gerada que represente o Dr. Patrick (as fotos dele são só as reais); nada que imite marca de terceiros. Registrar cada asset gerado aqui (arquivo, onde entrou e o que representa) para o Revisor conferir.

## 13. Compliance

Checklist do Revisor antes de cada merge com texto visível:
- **CFM 2.336/2023:** assinatura com nome, a palavra MÉDICO, CRM-MA 16520, especialidade e RQE 7389 no hero, no Sobre e no rodapé. Sem promessa ou garantia de resultado, sem superlativo, sem sensacionalismo, sem apelo de medo exagerado. Sem antes e depois. Sem depoimento. Sem paciente identificável. Honestidade sobre limites (a página diz quando a cirurgia é o caminho). Não anunciar pessoa jurídica (Instituto) sem os dados exigidos.
- **CFM 2.464/2026 (PRP):** PRP só como procedimento auxiliar possível após avaliação, nas indicações previstas (osteoartrite de joelho, discopatia lombar, epicondilite lateral e reparo meniscal); nunca como promessa de cura, garantia de regeneração ou substituto de cirurgia indicada; nunca ligado a outra região. BMA não aparece.
- **Google Ads e LGPD:** nada que atribua condição ao leitor ("você tem artrose?"); nenhum dado de saúde em analytics; consentimento conforme a seção 8.
- **Regras de copy do time:** sem travessão, sem "não é sobre X, é sobre Y", sem tríade emocional, sem palavras abstratas (clareza, propósito, jornada), sem fechamento de coach.

## 14. Testes e QA

- **Unitários (Vitest + Testing Library):** `origem.ts` (captura, persistência, storage bloqueado, `cidade` válida e inválida), `whatsapp.ts` (número, codificação, sem cidade, com cidade, com local, resumo só com opt-in, `ref`), `locais.ts` (14 locais, 11 cidades, 2 regiões, Balsas 3, Barra do Corda 2, campos obrigatórios), `jsonld.ts` (12 MedicalClinic, 2 Hospital, `practicesAt` com 14 `@id`), abas (estado inicial neutro, `?cidade=`, teclado, `aria-*`, iframe só após abrir), autoavaliação (pular, voltar, foco, resultado sem procedimento, opt-in), consentimento (padrão negado, aceitar, recusar, persistência), `analytics.ts` (eventos sem dado de saúde, fila antes do GTM).
- **Build (`verificar-build.mjs`):** o `dist/index.html` contém a topbar, os 8 blocos com suas âncoras, CTA com `wa.me`, a palavra MÉDICO, CRM, RQE, os 14 endereços e o JSON-LD; não contém iframe, `[PREENCHER]`, "BMA" nem folha de estilo bloqueante.
- **Sem JavaScript:** Browser/QA abre o build com JS desativado e confere textos, âncoras, endereços, "Como chegar" e CTA.
- **Browser/QA (390x844, 820x1180, 1440x900):** topbar, CTAs, "Veja onde ele atende", autoavaliação (toque, teclado, leitor de tela básico), seletor de cidade, as 11 abas, os 14 mapas, os 14 "Como chegar", accordion, botão flutuante, aviso de cookies.
- **Performance:** PageSpeed mobile e desktop no deploy da Vercel; LCP, CLS e INP registrados.
- **Tracking:** eventos no modo de visualização do GTM e nas requisições de rede, local e em produção, com consentimento aceito e recusado, incluindo clique imediato no CTA.

## 15. Time, floors e fluxo

| Agente | Entrega | Onde |
|---|---|---|
| Copywriter | Todo o texto da página na nota `copy-lp`, antes do front começar | Canvas |
| Dev Full Stack | Scaffold com prerender e preview, `origem.ts`, `whatsapp.ts`, `CidadeContext`, `CtaWhatsApp`, abas com mapas sob demanda, Vercel | Floor Dev |
| Designer Front-End | Tokens, fontes, componentes, as seções, a autoavaliação, imagens aplicadas, responsivo | Floor Front |
| Braçal | `locais.ts`, `jsonld.ts`, `scripts/imagens.mjs`, testes | Floor Braçal |
| Tracking | `consentimento.ts`, `analytics.ts`, eventos, aviso de cookies (lógica), GTM, GA4, conversão do Ads (após confirmação) | Floor Tracking |
| Revisor | Parecer na spec, no plano e em cada diff | Só lê |
| Git Manager | Uma branch por tarefa, conventional commits, merge na `main` após OK do Revisor, push | Ground |
| Browser/QA | QA nas três telas e sem JS; navegação no 21st.dev e no Motion Sites se o Designer pedir | Chrome (nunca junto do Tracking) |

- Floors do Maestri são worktrees git do mesmo repositório (confirmado no Windows): cada branch de floor aparece no ground e o Git Manager faz o merge com `git merge --no-ff`.
- O ground fica sempre na `main` e roda o servidor de desenvolvimento (porta 8080) num terminal do canvas. Dois portais no canvas acompanham a `main`: a LP (`http://localhost:8080/`) e as três telas (`http://localhost:8080/__preview.html`).
- Nunca force push na `main`. Push para `origin` depois de cada merge.

## 16. Fora do escopo

Formulário, agendamento online, página por cidade, blog, depoimentos, Meta Pixel e API de Conversões (o brief pede GTM, GA4 e Google Ads), domínio definitivo.

## 17. Pendências para o André

1. Mendesclin: o endereço escrito (Praça do Mercado Central, nº 14) diverge da ficha do Maps (R. Gonçalves Dias).
2. Clinimed (Loreto) e CM LAB (Graça Aranha) sem número no endereço.
3. Presidente Dutra: o brief cita a Clínica Levive; o dossiê mostra peças da Clínica Pró Saúde.
4. Dias de atendimento por cidade: ausentes no dossiê.
5. Valor da consulta, formas de pagamento, duração da consulta e regra de retorno: ausentes no dossiê.
6. Graduação, residência e tempo de experiência: ausentes no dossiê.
7. Arquivo do logo (monograma): não recebido.
8. "Instituto Patrick Santos": confirmar se é pessoa jurídica anunciante; se for, a página precisa do registro da PJ e do diretor técnico antes de usar a marca.
9. Oferta de PRP e BMA: confirmar com o médico o que ele faz dentro da Resolução CFM 2.464/2026; BMA fica fora da página até confirmação médica e jurídica.
10. Modelo de consentimento (Consent Mode v2 com padrão negado): validar com o jurídico.
11. Razão social e CNPJ (fonte externa no dossiê): confirmar antes de usar na política de privacidade.
12. Hermes (Braçal e Git Manager): provider opencode-go sem credencial, sem perfis `bracal` e `git`, sem aprovação automática.

## 18. Registro do parecer R1 (Revisor)

Aceitos os 13 achados. Dois ajustes para cumprir o brief:
- Achado 8 (mapa só por comando "Mostrar mapa"): o brief exige embed em toda aba, carregado quando a aba é aberta. Mantido o carregamento na abertura da aba, mas sem nenhuma aba aberta por padrão; abrir a aba já é ação explícita do usuário.
- Achado 4 (aba não é escolha): o brief exige a cidade da aba vista na mensagem. Mantido, mas só depois que o usuário abre uma aba (nunca por padrão) ou vindo de `?cidade=` validado.
