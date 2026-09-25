# LP Atendimento Particular MA: Dr. Patrick Santos

Spec de design, versão 2. Data: 24/09/2026. Dono: Maestro. Decisões delegadas pelo André ("pode decidir tudo por mim").
A versão 2 incorpora o parecer R1 do Revisor (MUDANÇAS NECESSÁRIAS, 13 achados, todos aceitos; ajustes de compatibilidade com o brief registrados na seção 18).

## 1. Objetivo e métrica

Landing page de captação para Google Ads (rede de pesquisa), tráfego principalmente de celular. A conversão medida é o **clique de saída para o WhatsApp** (não é consulta agendada), com mensagem pré-preenchida. Sem formulário.

- Público: só particular.
- Metas técnicas: PageSpeed mobile acima de 90 e desktop acima de 95 no build publicado; LCP abaixo de 2,5 s e CLS até 0,1 em 4G simulado; INP abaixo de 200 ms.
- Orçamento: JS inicial até 90 KB gzip; CSS até 25 KB; no máximo 2 fontes pré-carregadas somando até 60 KB; foto do hero até 70 KB (AVIF 720 px); nenhum iframe antes de ação do usuário.
- Deploy: Vercel, projeto `lp-dr-santos`, domínio `lp-dr-santos.vercel.app` até o domínio definitivo (exceção de publicação autorizada pelo André). Cada entrega aprovada pelo Revisor vai para um preview da Vercel até o marco de produção (seções 3 a 8 e consentimento na `main`, copy C1 e C2 aprovadas, QA sem falha crítica e fatos da política de privacidade confirmados pelo André: controlador, bases legais, compartilhamentos, retenção e atendimento a direitos, com o modo avançado do consentimento descrito como é); a partir do marco, produção a cada entrega aprovada (seção 18).

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
- Máximo de 4 blocos de texto. Sem travessão. Headline até 70 caracteres e subheadline até 140 (parecer R3b), para o CTA caber na primeira dobra a 390x844.

### 5.3 Identificação: para quem é
1. Três exemplos estáticos com o mesmo peso visual: articulação (joelho, quadril, ombro), coluna (lombar, ciática, pescoço) e esporte (calcanhar, tendão, cotovelo), com sinais que a pessoa reconhece nela mesma (textos do copy a partir de ICPs e personas).
2. CTA direto visível antes e depois do interativo.
3. **Interativo A (opcional, curto):** autoavaliação em 3 toques, com "Pular" em toda etapa e "Voltar" nas etapas 2 e 3 (na primeira não há etapa anterior).
   - Etapas: onde dói; o que a dor já atrapalha; o que já tentou. Cada etapa é um `<fieldset>` com `<legend>`, opções como botões de resposta grandes (48 px, sem `aria-pressed`: cada um é uma ação que responde e avança), foco movido para a próxima pergunta após responder, voltar ou pular, progresso em `aria-live` ("Etapa 2 de 3"). Ao voltar, a resposta anterior aparece em texto ("Sua resposta: ...").
   - "Pular" apaga a resposta da etapa. O resumo é montado por fragmentos condicionais (região, limitação, tentativa), com texto próprio para cada combinação de respostas omitidas e para nenhuma resposta, sem inferir condição nem tratamento.
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
- **Mapa:** o iframe `https://www.google.com/maps?q=<NOME ENDERECO>&output=embed` (com `URLSearchParams`) só existe no painel aberto e só depois de ação real do usuário (clique na aba ou escolha no seletor da seção 5.4). Cidade vinda de `?cidade=` abre o painel sem mapa e mostra o botão "Ver mapa". Trocar de aba desmonta os mapas anteriores. Altura reservada. `title="Mapa: <local>"`, `loading="lazy"`, `referrerpolicy="no-referrer"` (a URL da página, com gclid e UTMs, não vai para o Google Maps).
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

- `lib/origem.ts`: na primeira carga lê da URL só `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `gclid`, com a convenção fechada da seção 20 (R5): listas fechadas para origem e meio, códigos opacos `c01` e `a01` para campanha e conteúdo, `gclid` em `[A-Za-z0-9_.-]` até 200 caracteres. `utm_term` nunca é lido (é a palavra buscada e pode conter sintoma). Uma campanha nova substitui o conjunto anterior. Guarda em `sessionStorage` (try/catch, com fallback em memória). Não gera código de referência (decisão do André, §21). `cidade` vale só para a navegação atual e não é guardada. `urlLimpa()` monta a URL sem parâmetros fora da lista e sem âncora, para o `page_location` do GA4.
- `lib/whatsapp.ts`: `montarLinkWhatsApp(pedido)` devolve `https://wa.me/5513996822680?text=<mensagem>`.
  - Sem cidade escolhida: mensagem base que pede para a pessoa informar a cidade.
  - Com cidade escolhida: mensagem com a cidade. Com local: cidade e local.
  - Com resumo da autoavaliação (só se a caixa estiver marcada): acrescenta o resumo.
  - A mensagem nunca leva código de referência nem outro marcador: é só o texto aprovado da copy, com cidade, local ou resumo quando houver (decisão do André, §21).
- O `href` do HTML pré-renderizado é o link base, então o CTA funciona sem JavaScript (sem medição nesse caso; lacuna registrada). Com JavaScript, o clique simples monta o link completo, faz `preventDefault`, põe `clique_whatsapp` no `dataLayer` com `eventCallback` e `eventTimeout` (800 ms com o GTM já carregado, 2.000 ms sem ele; §8) e navega na mesma aba quando o GTM confirma o disparo das tags ou quando o tempo-limite vence (uma vez só). Clique com Ctrl, Cmd, Shift ou botão do meio segue o navegador (nova aba) e só registra o evento.

## 8. Consentimento e tracking

Implementado pelo Tracking. Publicar versão do contêiner do GTM e criar ações de conversão no Google Ads: uma confirmação única do André, com a lista do que vai ser publicado.

- **Consent Mode v2 (modo avançado):** `index.html` define `dataLayer` e `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500})` antes de qualquer tag. "Aceitar" envia `consent update` com tudo `granted`; "Recusar" mantém negado. **Transparência:** no modo avançado o GTM carrega e as tags do Google enviam sinais limitados sobre a página e o clique mesmo com consentimento negado, sem cookies de medição e sem identificadores do aparelho. gtag('set', 'ads_data_redaction', true) fica ligado para ocultar identificadores de clique de anúncio enquanto ad_storage estiver negado (a validar na rede). O aviso de cookies e a política dizem isso com essas palavras simples; nenhum texto afirma que "nada é ativado antes da escolha". Validação jurídica formal do modelo: recomendada, pendência do André.
- **Carregamento do GTM:** depois do primeiro frame, no que vier primeiro: `requestIdleCallback` com `{ timeout: 1500 }` (fallback `setTimeout` de 1,5 s) ou a primeira interação (`pointerdown`, `touchstart`, `keydown` ou `scroll`, passivos, uma vez). Se o usuário clicar num CTA antes, o clique dispara o carregamento na hora. A navegação espera o `eventCallback` do GTM ou um tempo-limite: 800 ms se o GTM já tinha carregado no momento do clique; 2.000 ms se ainda não tinha (validação da parte B: com 800 ms, o clique imediato podia levar ao `wa.me` antes de a conversão sair).
- **Endereço sem termo de busca:** na carga, antes de pôr `pagina_limpa` e antes do GTM, a página tira da barra de endereço (`history.replaceState`) o `utm_term` e qualquer `utm_*` fora da convenção fechada, mantendo caminho, `gclid`, `gbraid`, `wbraid`, `gad_source`, as UTMs válidas e os demais parâmetros. Motivo (validação da parte B): a tag de conversão do Ads e o `ccm/collect` enviam a URL completa da barra de endereço. Regra para a Effect: nenhum modelo de acompanhamento ou sufixo de URL final usa `{keyword}` nem `utm_term`. Eventos anteriores ficam na fila do `dataLayer`, que o GTM processa ao carregar.
- **`page_location` limpo:** antes do GTM, a página põe `pagina_limpa` no `dataLayer`: a URL de `urlLimpa()` sem `gclid`, sempre (parecer R17). A Google tag do GA4 e todas as tags de evento usam essa variável como `page_location`. Nenhuma variável para `utm_term` nem para `gclid`. O `gclid` nunca vai ao GA4; o vinculador de conversões e a conversão do Google Ads o leem nativamente da URL de entrada.
- **Campos do clique:** antes de cada `clique_whatsapp`, a página zera no `dataLayer` todos os campos opcionais (`local_cta`, `intencao`, `cidade`, `local`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`), para nenhum valor de um clique passar para o seguinte (parecer R17).
- **Critério de aceite da conversão:** com a aba de rede do Chrome (Preserve log), clique no CTA do hero em até 1 s após carregar: a requisição de conversão do Google Ads e o `collect?v=2` do GA4 aparecem antes da navegação para `wa.me`, com consentimento aceito e recusado, em 5 tentativas. Não basta o script do GTM ter sido injetado.
- **Conversão primária única:** a tag de conversão do Google Ads disparada pelo evento `clique_whatsapp`. O evento de GA4 com o mesmo nome é evento-chave para análise e não é importado como conversão primária no Ads (evita contagem dupla).

| Evento (dataLayer) | Parâmetros | Onde dispara |
|---|---|---|
| `clique_whatsapp` (conversão primária) | `local_cta` (topbar, hero, identificacao, autoavaliacao, como_funciona, sobre, onde_atende, faq, rodape, flutuante), `cidade`, `local`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` (sem `gclid`) | Todo CTA de agendamento |
| `autoavaliacao_etapa` | `etapa` (1, 2, 3) | Avanço de etapa. Sem respostas |
| `autoavaliacao_concluida` | nenhum | Resultado exibido. Sem respostas |
| `autoavaliacao_pulada` | `etapa` | Clique em "Pular" |
| `seletor_cidade` | `cidade` | Seletor da seção 5.4 |
| `troca_aba_cidade` | `cidade`, `regiao` | Abertura de aba em `#onde-atende` |
| `como_chegar` | `local`, `cidade` | Clique em "Como chegar" |
| `faq_aberta` | `pergunta` | Abertura de pergunta |
| `profundidade_rolagem` | `percentual` (25, 50, 75, 90) | Uma vez por marco, por sessão (sessionStorage, com fallback em memória) |

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

| Asset gerado | Onde entrou | O que representa |
|---|---|---|
| `public/favicon.svg` (Tarefa 7a, commit 8503e3e) | Favicon da página | Monograma "PS" provisório em traço fino, dourado `#B98F4E` sobre grafite `#15171B`, até chegar o logo oficial |

## 13. Compliance

Checklist do Revisor antes de cada merge com texto visível:
- **CFM 2.336/2023:** assinatura com nome, a palavra MÉDICO, CRM-MA 16520, especialidade e RQE 7389 no hero, no Sobre e no rodapé. Sem promessa ou garantia de resultado, sem superlativo, sem sensacionalismo, sem apelo de medo exagerado. Sem antes e depois. Sem depoimento. Sem paciente identificável. Honestidade sobre limites (a página diz quando a cirurgia é o caminho). Não anunciar pessoa jurídica (Instituto) sem os dados exigidos.
- **CFM 2.464/2026 (PRP):** PRP só como procedimento auxiliar possível após avaliação, nas indicações previstas (osteoartrite de joelho, discopatia lombar, epicondilite lateral e reparo meniscal); nunca como promessa de cura, garantia de regeneração ou substituto de cirurgia indicada; nunca ligado a outra região. BMA não aparece.
- **Google Ads e LGPD:** nada que atribua condição ao leitor ("você tem artrose?"); nenhum dado de saúde em analytics; consentimento conforme a seção 8.
- **Regras de copy do time:** sem travessão, sem "não é sobre X, é sobre Y", sem tríade emocional, sem palavras abstratas (clareza, propósito, jornada), sem fechamento de coach.

## 14. Testes e QA

- **Unitários (Vitest + Testing Library):** `origem.ts` (captura, persistência, storage bloqueado, `cidade` válida e inválida), `whatsapp.ts` (número, codificação, sem cidade, com cidade, com local, resumo só com opt-in, nenhum marcador `ref`), `locais.ts` (14 locais, 11 cidades, 2 regiões, Balsas 3, Barra do Corda 2, campos obrigatórios), `jsonld.ts` (12 MedicalClinic, 2 Hospital, `practicesAt` com 14 `@id`), abas (estado inicial neutro, `?cidade=`, teclado, `aria-*`, iframe só após abrir), autoavaliação (pular, voltar, foco, resultado sem procedimento, opt-in), consentimento (padrão negado, aceitar, recusar, persistência), `analytics.ts` (eventos sem dado de saúde, fila antes do GTM).
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
10. **Fatos da política de privacidade: confirmados pelo André em 24/09/2026.** Controlador: Dr. Patrick Santos, pessoa física. Repasse: conversas do WhatsApp (nome, telefone e mensagem) vão para a clínica parceira da cidade escolhida, para agendar. Retenção: GA4 14 meses; conversas do WhatsApp até 2 anos após o último contato (prontuário segue o CFM). Direitos: pelo WhatsApp, resposta em até 15 dias. Bases legais adotadas pelo Maestro: consentimento para cookies e identificadores (art. 7º, I); procedimentos preliminares a pedido da pessoa (art. 7º, V); tutela da saúde para informação de saúde enviada pela própria pessoa (art. 11, II, f). Revisão jurídica formal do texto e do Consent Mode v2: recomendada, não bloqueia.
11. Razão social e CNPJ (fonte externa no dossiê): confirmar antes de usar na política de privacidade.
12. Hermes (Braçal e Git Manager): provider opencode-go sem credencial, sem perfis `bracal` e `git`, sem aprovação automática.
13. **Fatos operacionais sem fonte** (a copy não afirma até confirmar): se valor, formas de pagamento e duração são informados antes de marcar; como o retorno é marcado; orientação depois de procedimento; quais procedimentos cada cidade oferece; lista do que levar na consulta.
14. **Domínio definitivo:** o `SITE_URL` e o canonical apontam para `lp-dr-santos.vercel.app`. Se a campanha usar outro domínio, atualizar o `SITE_URL`, conferir o HTML servido e a URL canônica escolhida no Search Console, e testar os sitelinks (`/onde-atende` e `/onde-atende/`, com query) com status 200.

## 18. Registro do parecer R1 (Revisor)

Aceitos os 13 achados. Dois ajustes para cumprir o brief:
- Achado 8 (mapa só por comando "Mostrar mapa"): o brief exige embed em toda aba, carregado quando a aba é aberta. Mantido o carregamento na abertura da aba, mas sem nenhuma aba aberta por padrão; abrir a aba já é ação explícita do usuário.
- Achado 4 (aba não é escolha): o brief exige a cidade da aba vista na mensagem. Mantido, mas só depois que o usuário abre uma aba (nunca por padrão) ou vindo de `?cidade=` validado.

## 21. Direção visual (Tarefa V, pedido do André em 24/09/2026)

O André avaliou a página como sem acabamento visual: sem mapa aparente, interativos sem destaque, sem assets e com a foto do hero errada. Decisões:
- **Fotos:** hero `_DSC2069` (explicando no modelo de joelho, escolha do André); sobre `_DSC1992` (sala de ultrassom); como funciona `_DSC2001`; CTA final `_DSC2011` (sentado, sorrindo). A `_DSC2060` sai da página.
- **Direção de arte:** clínica premium, calma e explicada. Grafite, dourado e bege dos tokens; títulos em Lora com escala editorial; bastante respiro; ritmo de fundos creme, bege e grafite; fotos com cantos de 24 px e filete dourado fino; textura sutil (grão ou linhas finas em SVG) só em fundos grandes.
- **Assets gerados pelo Codex (SVG, registrados na tabela da §12):** ícones de linha (1,5 px) para joelho, quadril, ombro, coluna, pé e calcanhar, cotovelo, tendão e treino, calendário, alfinete de mapa, conversa, ultrassom; ilustrações anatômicas neutras em traço fino (joelho, coluna, ombro); **mapa ilustrado do Maranhão** feito a partir da malha oficial do IBGE (dados públicos, citar a fonte), simplificado, com as 11 cidades marcadas pelas coordenadas reais.
- **Interativos com destaque:** autoavaliação em cartões com ícone por região, barra de progresso e cartão de resultado; "Como funciona" como linha do tempo visual com ícones (sem esconder conteúdo, parecer R1); seletor de cidade estilizado; "Onde atende" com o mapa do Maranhão interativo (tocar numa cidade = abrir a aba dela, o que libera o mapa do Google por ação real), abas com rolagem horizontal, scroll-snap e sombra indicando mais cidades, cartões de local com alvos de 48 px (parecer R13, item 2).
- **Movimento:** revelação leve ao rolar (CSS + IntersectionObserver), transições curtas, tudo desligado em `prefers-reduced-motion`. Sem biblioteca pesada; JS inicial continua até 90 KB gzip e PageSpeed mobile acima de 90.
- **21st.dev e Motion Sites:** o Designer pode pedir ao Browser/QA para trazer um componente gratuito que ajude a conversão (regras da §12).
- **Mapas por clínica (pedido do André, 24/09/2026, substitui as regras de mapa da §5.6 e dos pareceres R1/R2):** a seção "Onde ele atende" abre já com uma aba visível: a cidade de `?cidade=` válido ou, sem ela, a primeira cidade (Balsas). Em toda aba aberta, cada clínica mostra o embed do Google Maps (interativo), endereço, "Como chegar" e o CTA da clínica. Os iframes carregam quando a seção chega a 400 px da viewport (IntersectionObserver), nunca na abertura da página, e ao trocar de aba os mapas da nova cidade carregam direto (sem botão "Ver mapa"); os da aba anterior são desmontados. A aba aberta por padrão é só visual: não vira cidade escolhida no `CidadeContext` (os CTAs gerais continuam sem cidade até a pessoa escolher); o CTA de cada cartão continua levando cidade e clínica. `referrerpolicy="no-referrer"` e `loading="lazy"` continuam. O mapa ilustrado do Maranhão fica acima das abas, com as 11 cidades clicáveis (tocar = abrir a aba, com fonte aba) e o crédito "Fonte: IBGE, API de Malhas Geográficas v3 (malha estadual e centroides municipais), acesso em 24/09/2026", com link para a documentação; os pontos são ilustrativos (centroides), não endereços. A política de privacidade passa a citar o Google Maps como terceiro que carrega os mapas quando a pessoa chega à seção de locais.
- **Direção frontend-design v2 (pedido do André, skill frontend-design, 24/09/2026):** refatoração só visual, sem mudar texto nem comportamento interativo. Conceito "atlas de consultório": o médico que explica com o modelo anatômico e guia procedimentos por ultrassom, e que viaja por 11 cidades. Tokens: grafite de exame `#171B20`, gesso `#EDEFEA` (fundo principal, frio, no lugar do creme), linho `#DDD2BE` (bege da marca), ouro fosco `#A98545` (só filetes, monograma e foco), eco `#56717F` (azul-cinza do ultrassom, rotas e mapa), verde WhatsApp `#1E7F4F` (só CTA). Tipos: Atkinson Hyperlegible Next no corpo e interface (legibilidade para 50 a 70 anos) e Source Serif 4 nos títulos, com escala modular 1,25 no mobile e 1,333 no desktop, corpo de 19 px no mobile e medida até 66 caracteres. Único elemento ousado: a foto do hero recortada no formato de leque do ultrassom, com borda granulada, e uma varredura de revelação ao carregar (uma vez; estática com movimento reduzido). Resto contido: "pranchas" anatômicas com filete no lugar de cartões com sombra; linha do tempo como rota numerada (é sequência de verdade); seção de locais escura com o mapa em filete dourado e rota tracejada entre as cidades; FAQ em lista com filetes. Sem fade por seção, sem rótulos em caixa alta, sem seta em botão, sem gradiente decorativo. Assets por modelo de imagem da OpenAI podem entrar (pranchas anatômicas em traço de gravura, textura sutil), sempre neutros, leves e registrados na tabela da §12.
- **Ajuste do André direto ao Designer (24/09/2026):** o recorte em leque/gota do hero saiu; a foto do hero fica inteira numa moldura editorial. Os mapas das clínicas ficam em coluna única no mobile e no desktop, cada um com nome e endereço. Assets gerados na refatoração: `public/prancha-joelho.webp`, `public/prancha-coluna.webp`, `public/prancha-ombro.webp` (gravuras anatômicas neutras, GPT Image + ffmpeg WebP), registrados na §12.
- **URLs por seção (pedido do André, 24/09/2026, para sitelinks do Google Ads):** cada seção tem URL própria no formato `domínio/<slug>`: `/inicio`, `/para-quem`, `/como-funciona`, `/sobre`, `/onde-atende`, `/duvidas`, `/agendar` (o slug é o id da seção). O build grava `dist/<slug>/index.html` com o mesmo HTML pré-renderizado e `rel="canonical"` para a raiz. Na carga em `/<slug>` a página rola até a seção; links internos mantêm `href="#<slug>"` sem JavaScript e, com JavaScript, rolam e trocam a URL (`pushState`); a rolagem atualiza a URL da seção dominante (`replaceState`). Para não gerar `page_view` a cada troca de URL, a medição otimizada do GA4 fica com "alterações de página com base em eventos do histórico do navegador" desligada (entra na configuração da conta, junto com cliques de saída e pesquisa no site). Decisões do parecer R20: (a) a primeira seção usa a raiz `/` quando a URL muda por clique ou rolagem; `/inicio` continua publicado e abre a página no topo, mas não é gerado pela navegação; (b) cada troca de URL dispara no `window` o evento `lp:secao` (`detail: { slug, caminho }`), e a medição responde atualizando `pagina_limpa` no `dataLayer` (URL corrente limpa, sem `gclid`, `utm_term`, fragmento ou texto livre), sem novo `page_view`; os eventos seguintes levam o `page_location` da seção atual, porque cada tag de evento lê `{{DLV - pagina_limpa}}`; (c) uma navegação explícita (clique em link interno, Voltar ou Avançar, carga em `/<slug>`) cancela a atualização pendente da rolagem até a rolagem programada terminar, e move o foco para o título da seção (`tabIndex=-1`, `preventScroll`); a atualização passiva por rolagem nunca move o foco.
- **Mapa do Maranhão no celular (pedido do André, 24/09/2026):** "queria que desse pra ver todo sem arrastar e ainda ser clicável". O mapa escala para a largura da tela (sem rolagem horizontal), com pontos posicionados em porcentagem e afastamento calculado também para o tamanho compacto; tocar em qualquer lugar do mapa escolhe a cidade mais próxima (com distância máxima), e os botões dos pontos seguem para teclado e leitor de tela; sem rotas tracejadas no celular, linha-guia só quando o ponto precisou sair do lugar; ponto selecionado com etiqueta do nome da cidade; legenda em 2 colunas; depois da escolha pelo mapa, a página rola até as abas e dá foco à aba escolhida.
- **Sem código de referência (decisão do André, 24/09/2026):** "não pode ter esse (ref xxxxx números na mensagem)". A mensagem do WhatsApp sai só com o texto aprovado. O `ref` sai também do evento `clique_whatsapp`, do `origem.ts` e do contêiner do GTM: sem o código na mensagem, ele não serve para ligar a conversa ao clique, e manter um identificador sem uso contraria a minimização de dados.
- **Contêiner do GTM (decisão do André, 24/09/2026):** usar o contêiner existente GTM-M6GH8FC9 (conta "PATRICK SILVA", vazio) em vez de criar conta nova; a importação entra num workspace próprio.
- **Deploy inicial (decisão do André, 24/09/2026):** o primeiro deploy ficou público em `lp-dr-santos.vercel.app` antes do marco; o André decidiu manter no ar (conteúdo aprovado, sem GTM nem cookies). Os próximos deploys seguem a cada entrega aprovada.
- **Preview ao vivo do design:** terminal "Servidor Design" no Floor Front (porta 8082) e portais "LP design ao vivo" e "LP design 3 telas", para o André acompanhar antes do merge.

## 19. Registro do parecer R2 (Revisor, plano)

Aceitos os 11 achados: preview até o marco de produção; mapa só por ação real e só no painel aberto, com `no-referrer`; origem sanitizada e sem `utm_term`, `page_location` limpo; navegação do CTA depois do `eventCallback` do GTM ou de 800 ms, com critério de aceite pela requisição de conversão na rede; cidade da URL só para a navegação atual; "Pular" apaga a resposta da etapa; progresso com `aria-live`; checagem dos 14 nomes e endereços no HTML inicial; `vercel pull` antes de cada build; contagem do `verificar-build` corrigida. Ajuste no achado 7 (rádios): mantidos botões de resposta dentro de `fieldset`/`legend`, porque rádios avançariam a etapa ao navegar com as setas; o padrão completo está na Tarefa 8 do plano.
Ajuste no achado 1: o brief pede produção a cada entrega aprovada; a produção começa no marco e, dali em diante, segue a cada entrega aprovada. A validação jurídica do consentimento continua como pendência (§17, item 10) e não bloqueia o marco, porque o André autorizou a publicação.

## 20. Registro dos pareceres R2b e R3 (Revisor)

- R2b: aceito que os **fatos** da política (controlador, bases, compartilhamentos, retenção, direitos e descrição exata do modo avançado) precisam estar confirmados pelo André antes da produção; só o parecer jurídico formal segue como pendência não bloqueante. `utm_term` removido também da lista de variáveis do GTM. Autoavaliação sem `aria-pressed`, com a resposta anterior em texto. Marcador `(ref ...)` só no código (`whatsapp.ts`), nunca nos textos da copy. Rótulos de botão nos testes vêm do conteúdo, não de texto fixo. Comandos de verificação de deploy em Git Bash.
- R5 (Tarefa 5): (1) com resumo da autoavaliação, a URL completa do WhatsApp nunca vai para o `href` do DOM: o `href` fica no link base e a navegação usa a URL completa só por código (clique simples ou com modificador; o botão do meio abre o link base). (2) Convenção fechada de UTMs, porque nomes livres podem carregar condição de saúde: `utm_source` em {google, bing, facebook, instagram, whatsapp, email, organico}; `utm_medium` em {cpc, pago, social, organico, email, referencia}; `utm_campaign` no formato `c` + 2 a 4 dígitos (ex.: `c01` = grupo dor crônica articular, `c02` = especialidade); `utm_content` no formato `a` + 2 a 4 dígitos (ex.: `a01` a `a04` = anúncios). Qualquer outro valor é descartado da origem, do `page_location` e dos eventos. A Effect monta as campanhas com esses códigos. (3) `gclid` aceita ponto. (4) A medição otimizada de cliques de saída do GA4 fica desligada no stream e nenhuma tag usa `Click URL` (alteração em conta real: entra na confirmação única do André).
- R3: aviso e política reescritos para o modo avançado; sem `ref` com resumo; PRP só no FAQ e só nas quatro indicações da Resolução CFM 2.464/2026; garantias operacionais sem fonte retiradas (§17, item 13); primeira dobra e meta com sinal do ICP esporte; modelos de resumo para respostas omitidas; C2 é a fonte final de meta e alts; rótulos "Ver mapa" e do seletor definidos na copy; assinatura com "MÉDICO" em maiúsculas.
