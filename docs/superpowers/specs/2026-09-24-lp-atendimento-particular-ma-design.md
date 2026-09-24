# LP Atendimento Particular MA: Dr. Patrick Santos

Spec de design. Data: 24/09/2026. Dono: Maestro. Aprovação de decisões delegada pelo André ("pode decidir tudo por mim").

## 1. Objetivo e métrica

Landing page de captação para Google Ads (rede de pesquisa), tráfego principalmente de celular. A conversão é o clique no botão de agendamento, que abre o WhatsApp com mensagem pré-preenchida. Sem formulário.

- Público: só particular.
- Meta técnica: PageSpeed mobile acima de 90 (desktop acima de 95), CLS 0, LCP abaixo de 2,5 s em 4G simulado.
- Deploy: Vercel, projeto `lp-dr-santos`, domínio `lp-dr-santos.vercel.app` até o domínio definitivo. Deploy de produção a cada entrega aprovada pelo Revisor (exceção autorizada pelo André).

## 2. Fontes e regra de dados

Tudo o que aparece na página sai destes arquivos. Ninguém inventa dado, número, depoimento, credencial nem data de atendimento. O que faltar vira placeholder marcado em `src/config.ts` e entra na lista de pendências.

| Fonte | Uso |
|---|---|
| Brief do André (chat do Maestro, 24/09/2026) | Arquitetura da página, endereços e links dos 14 locais, regras de tracking e deploy |
| `Sobre o Patrick/dossie-instituto-patrick-santos-2026-09-18.md` (pasta fora do git: dados do cliente) | Nome, CRM, RQE, serviços, posicionamento, tom, identidade visual, compliance |
| `Sobre o Patrick/ICP_*.md` (3 ICPs + comparativo) | Dores, desejos, objeções, nível de consciência, gatilhos |
| `Sobre o Patrick/PERSONAS_*.md` (15 personas) | Voz do cliente, sinais de identificação, objeções por perfil |
| `Downloads/Estrategia-Dr-Patrick-Silva.pdf` | Filtro de público (particular), jornada, rastreamento |
| `fotos-originais/` (17 fotos, fora do git) | Fotos do médico |
| Nota do canvas "Credenciais, instruções e acessos" | Acessos de GTM, GA4, Google Ads, Vercel, 21st.dev e Motion Sites. Só Tracking, Dev e Browser/QA leem. Nunca copiar credencial para spec, código, commit ou log |

## 3. O médico e o público (resumo)

- **Nome na página:** Dr. Patrick Santos. Marca: Instituto Patrick Santos, Ortopedia e Traumatologia. Nome civil (só na política de privacidade, se usada a razão social): Patrick S. e Silva.
- **Registro:** CRM-MA 16520, RQE 7389. Especialidade: Ortopedia e Traumatologia.
- **Foco declarado:** medicina regenerativa (infiltração com ácido hialurônico, PRP, BMA), infiltrações e procedimentos guiados por ultrassom, com formação em ultrassom feita em Salvador. Posicionamento atual: "Ortopedia humanizada".
- **Público:** três ICPs com o mesmo peso (decisão do André).
  1. Artrose e desgaste articular, 50+, joelho, quadril e ombro. Quer continuar andando sem depender de ninguém e adiar a cirurgia.
  2. Dor de coluna no trabalhador ativo, 35 a 60, lombar, ciática e cervical. Perde dinheiro quando trava.
  3. Lesão esportiva e tendinopatia, 25 a 50, fascite, ombro, cotovelo e tendão. Quer voltar a treinar sem parar.
- **Filtro comum:** só particular. Não atende plano de saúde nem SUS.
- **Dor principal:** dor que já limita a rotina (escada, sono, trabalho, estrada, treino) depois de tratamentos que só aliviaram por um tempo.
- **Desejo principal:** alívio da dor e retorno da mobilidade (palavras do briefing), na própria cidade, sem viajar para a capital.
- **Objeções:** medo de cirurgia; "não tem mais jeito" e "é da idade"; "infiltração é corticoide e estraga o osso"; tratamento que só mascara; tratamento moderno só na capital; se vale o valor; onde e quando ele atende; "ortopedista só manda parar" (esporte).
- **Nível de consciência:** predominante consciente do problema entrando em consciente da solução. Filhos na capital e quem já fez infiltração estão em consciente do produto.
- **Canal de agendamento:** WhatsApp único `5513996822680`, exibido como (13) 99682-2680 (decisão do André).
- **Dias de atendimento:** o dossiê não traz agenda recorrente por cidade. A página não mostra dias; mostra "datas da próxima vinda confirmadas pelo WhatsApp". Pendência.

## 4. Decisões de arquitetura

**Abordagem escolhida: HTML pré-renderizado no build**, no padrão da LP do Dr. Henrique (`../../Dr Henrique Isaacsson/drhenriqueisaacsson/scripts/prerender.mjs` e `src/entry-server.tsx`).

- Vite + React 18 + TypeScript + Tailwind CSS v4, mobile first.
- `npm run build` = `tsc --noEmit` + `vite build` + `vite build --ssr src/entry-server.tsx` + `node scripts/prerender.mjs`. O prerender injeta o HTML do `App` no `#root`, embute o CSS no `<head>` e adia o bundle para depois do primeiro frame. Em produção o React hidrata; em dev renderiza do zero.
- Todo componente precisa renderizar no servidor sem acessar `window`, `document` ou `sessionStorage` durante o render. Efeitos de navegador ficam em `useEffect`.
- Seções abaixo da dobra (a partir da 4) carregam com `React.lazy` depois do primeiro gesto do usuário ou 2,5 s, com placeholder de altura fixa para CLS 0. As seções 1 a 3 entram no HTML pré-renderizado.
- Sem backend. Deploy estático na Vercel.
- Testes: Vitest + Testing Library para lógica e componentes; verificação do HTML de build por script.

### Estrutura de pastas

```
src/
  App.tsx                    ordem das seções, lazy load a partir da seção 4
  main.tsx                   hydrate em produção, render em dev
  entry-server.tsx           renderToString(<App />) para o prerender
  config.ts                  WhatsApp, nome, CRM, RQE, GTM_ID, placeholders (VALOR_CONSULTA etc.)
  data/locais.ts             14 locais em 11 cidades, agrupados por região (fonte: brief)
  data/jsonld.ts             gera o JSON-LD (IndividualPhysician + 14 MedicalClinic)
  content/*.ts               textos por seção, vindos da nota "copy-lp" do Copywriter
  context/CidadeContext.tsx  cidade e clínica em foco (aba aberta ou escolha na interação)
  lib/whatsapp.ts            monta o link wa.me com a mensagem e a referência de origem
  lib/origem.ts              captura e preserva UTMs e gclid na sessão, gera a referência curta
  lib/analytics.ts           track() no dataLayer + carregamento tardio do GTM
  components/                Topbar, CtaWhatsApp, BotaoFlutuante, Secao, Foto, Accordion, Abas
  sections/                  S1Topbar ... S8Rodape
  interativos/               Autoavaliacao, LinhaDoTempo (conforme a escolha do Revisor)
  styles/tokens.css, global.css
scripts/prerender.mjs, scripts/imagens.mjs
public/fonts/, public/img/, public/politica-de-privacidade.html
public/__preview.html        só em dev, no .gitignore
```

## 5. Página: seções, nesta ordem

Âncoras com id próprio para anúncios e para o link "Veja onde ele atende": `#para-quem`, `#como-funciona`, `#sobre`, `#onde-atende`, `#duvidas`.

### 5.1 Topbar fixa (todas as larguras)
Fixa no topo em mobile, tablet e desktop. Fundo dourado da marca com texto quase preto em negrito (contraste mínimo 7:1). Mensagem: atendimento exclusivamente particular, não aceita plano de saúde nem SUS. O Copywriter lapida, mas a informação precisa caber em uma linha a 360 px (ou duas linhas curtas) e ficar impossível de não ver. A mesma informação aparece como badge no hero.

### 5.2 Hero
- Badge "Atendimento particular" com o mesmo aviso da topbar.
- Headline, subheadline e CTA de agendamento (WhatsApp). O CTA aparece sem rolagem a 390x844.
- Linha que deixa claro já na primeira dobra que ele atende em várias cidades do Maranhão (11 cidades, 14 locais), com o link "Veja onde ele atende" que rola até `#onde-atende`.
- CRM e RQE visíveis junto ao nome.
- Foto: `_DSC2060` (jaleco preto, sorrindo, fundo neutro claro), recorte 4:5 no mobile e 3:4 no desktop. É a imagem de LCP: `fetchpriority="high"`, sem lazy, com `srcset`.
- Máximo de 4 blocos de texto. Sem travessão.

### 5.3 Identificação: para quem é (com elemento interativo obrigatório)
Sinais que o paciente reconhece nele mesmo, cobrindo os três ICPs (exemplos a lapidar pelo copy, todos tirados de ICP e personas: joelho que dói na escada, quadril que dói ao levantar da cadeira, ombro que dói ao levantar o braço, lombar que trava depois do dia de trabalho, dor que desce pela perna ao dirigir, calcanhar que dói no primeiro passo da manhã, dor que volta depois do treino, "já me disseram que é da idade", "já me falaram em cirurgia", "o remédio só alivia por uns dias"). O elemento interativo vive aqui (ver seção 6).

### 5.4 Como funciona a consulta
Passo a passo do primeiro contato ao retorno:
1. Você chama no WhatsApp e diz sua cidade. Escolhe a clínica mais perto na lista de locais (link para `#onde-atende`).
2. Pelo WhatsApp você recebe a data da próxima vinda do Dr. Patrick à sua cidade e o valor da consulta particular.
3. Consulta: conversa sobre a dor e o que já foi tentado, exame físico e os exames que você trouxer.
4. Plano explicado com calma: o que dá para tratar no consultório, quando uma infiltração (ácido hialurônico, PRP) ou outro procedimento pode ser indicado e quando a cirurgia é o caminho. Sem promessa de resultado.
5. Procedimento, quando indicado, guiado por ultrassom quando for o caso.
6. Retorno para acompanhar a evolução.

Fotos de apoio: `_DSC2001` (no aparelho de ultrassom). Não afirmar ultrassom em toda consulta nem em toda clínica (lacuna do ICP).

### 5.5 Sobre o doutor
Só fatos do dossiê: ortopedista e traumatologista, CRM-MA 16520, RQE 7389; foco em medicina regenerativa (ácido hialurônico, PRP, BMA) e infiltrações; procedimentos guiados por ultrassom, com formação em ultrassom em Salvador; atende em 14 clínicas e hospitais parceiros em 11 cidades do Maranhão; tom de quem explica com calma ("ortopedia humanizada"); também ensina outros médicos. Graduação, residência e anos de experiência não constam no dossiê: placeholder marcado, sem inventar. Foto: `_DSC2069` (explicando no modelo de joelho).

### 5.6 Onde ele atende
- Abas horizontais por cidade, agrupadas por região com rótulo de grupo: "Sul Maranhense" (Balsas, São Domingos do Azeitão, São Raimundo das Mangabeiras, Loreto) e "Centro Maranhense" (Presidente Dutra, Fortuna, Gonçalves Dias, São Domingos do Maranhão, Tuntum, Graça Aranha, Barra do Corda). 11 abas.
- Mobile: a barra de abas rola na horizontal com scroll-snap e indicação visual de que há mais abas. Desktop: todas visíveis, quebrando em duas linhas por região se precisar.
- Padrão ARIA de abas (`role="tablist"`, `tab`, `tabpanel`, setas do teclado, Home/End).
- Cada clínica mostra: nome, endereço por escrito, dias de atendimento (hoje nenhum: não mostra o campo), embed do Google Maps e botão "Como chegar" com o link do brief. Balsas mostra 3 clínicas e Barra do Corda mostra 2 na mesma aba.
- Embed: `https://www.google.com/maps?q=<NOME+ENDERECO codificados>&output=embed`, em `<iframe loading="lazy" title="Mapa: <clínica>">`. O `src` só é definido quando a aba é aberta. A aba padrão (Balsas) carrega o mapa quando a seção chega a 300 px da viewport. Altura fixa reservada para CLS 0.
- CTA por clínica: o dossiê indica canal único (WhatsApp de marca), então cada clínica tem um botão "Agendar em <cidade>" que usa o mesmo número com a cidade e a clínica na mensagem.
- Trocar de aba atualiza a cidade em foco no `CidadeContext`; a partir daí todos os CTAs da página incluem essa cidade na mensagem.
- Endereços: exatamente como o brief. Mendesclin usa o endereço escrito (Praça do Mercado Central, nº 14); a divergência com a ficha do Maps vai para a entrega final. Clinimed e CM LAB Graça Aranha ficam sem número, como no brief.

### 5.7 FAQ (accordion)
Perguntas de alto valor, com respostas só a partir das fontes; o que não existe nas fontes vira texto honesto ("informado pelo WhatsApp") mais placeholder em `config.ts`:
- Vou precisar operar? (honestidade sobre limites, sem prometer evitar cirurgia)
- Infiltração é corticoide? Estraga o osso? (diferença entre corticoide, ácido hialurônico e PRP, sem promessa)
- Me disseram que é da idade e não tem mais jeito. Vale consultar?
- Preciso ir para a capital para esse tipo de tratamento?
- Em quais cidades e clínicas ele atende, e em que dias? (lista + datas pelo WhatsApp)
- Qual o valor da consulta e as formas de pagamento? (placeholder `VALOR_CONSULTA`, `FORMAS_PAGAMENTO`)
- Por que não atende plano de saúde nem SUS?
- O que levar na consulta? (exames de imagem que já tiver, lista de remédios, relatórios anteriores; validar com o médico)
- Quanto tempo dura a consulta? (placeholder `DURACAO_CONSULTA`)
- Como funciona o retorno? (placeholder `RETORNO`)
- Como agendar?

Um bloco "Ainda tem dúvida?" com CTA no fim do FAQ.

### 5.8 Rodapé
Nome, CRM-MA 16520, RQE 7389, especialidade, lista resumida das 11 cidades por região, CTA final, link para `/politica-de-privacidade.html`, aviso de LGPD ("usamos cookies e ferramentas de medição para entender o uso da página; veja a política de privacidade"). Nome, CRM e RQE juntos, como exige a Resolução CFM 2.336/2023 para publicidade de médico.

### 5.9 Botão flutuante
Botão de WhatsApp fixo no canto inferior direito no mobile, a partir do momento em que o CTA do hero sai da viewport. Não cobre a topbar nem os controles das abas.

## 6. Elementos interativos (ideias para o Revisor)

Todos terminam em CTA de agendamento. A dor é acentuada com informação, não com susto. Nenhum devolve diagnóstico: todos trazem "isso não substitui a avaliação na consulta".

**Ideia A: autoavaliação em 3 toques (recomendada para a seção 3).**
1. Onde dói? (joelho, quadril, ombro, coluna lombar, pescoço, pé e calcanhar, cotovelo)
2. O que essa dor já tirou de você? (subir escada, dormir a noite inteira, trabalhar sem parar, dirigir, treinar, ajoelhar ou agachar, pegar o neto no colo)
3. O que você já tentou? (remédio, fisioterapia, infiltração com corticoide, disseram que é da idade, falaram em cirurgia, nada ainda)

Resultado: um cartão com o resumo em palavras do próprio paciente ("dor no joelho que já atrapalha a escada, depois de remédio e fisioterapia"), o que a consulta investiga, as opções que o médico pode avaliar (sem prometer) e o CTA "Agendar avaliação" com a mensagem já contendo região e limitação. Cobre os três ICPs por igual e aumenta a qualidade da conversa no WhatsApp.

**Ideia B: linha do tempo que o lead avança (recomendada para a seção 4).**
Os seis passos de "Como funciona" viram uma linha do tempo com botão "Próximo passo". O passo 1 abre o seletor de cidade (atalho para a aba certa em `#onde-atende`). O último passo termina em CTA. Reduz a ansiedade de quem nunca fez procedimento e resolve a dúvida "onde e quando".

**Ideia C: um dia com a dor x o dia que você quer de volta.**
Alternância entre dois cenários do dia (acordar, trabalho, tarde, noite). Risco: pode ser lida como promessa de resultado (vedada pelo CFM). Só entra se o Revisor achar um enquadramento seguro.

**Recomendação do Maestro:** A na seção 3 e B na seção 4. A escolha final é do Revisor, registrada nesta spec antes da execução.

## 7. Link de agendamento e origem

- `lib/origem.ts`: na primeira carga, lê `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` e `gclid` da URL e grava em `sessionStorage` (try/catch). Gera uma referência curta aleatória de 6 caracteres por sessão (`ref`). Tudo é lido depois por `whatsapp.ts` e `analytics.ts`.
- `lib/whatsapp.ts`: `montarLinkWhatsApp({ local, cidade?, clinica?, contexto? })` devolve `https://wa.me/5513996822680?text=<mensagem codificada>`. Mensagem base (texto final do Copywriter), por exemplo: "Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular em Balsas. (ref A7K2Q9)". Com cidade, inclui a cidade; com clínica, a clínica; com contexto da autoavaliação, uma frase curta com região e limitação. A `ref` fica no fim da mensagem e vai no evento do dataLayer junto com UTMs e gclid, para ligar a conversa do WhatsApp à origem do clique sem expor o gclid ao paciente.
- Os links são montados no clique (não no render) para usar a cidade em foco e a origem atual; o `href` pré-renderizado é o link base sem cidade, para funcionar sem JavaScript.

## 8. Tracking

Implementado pelo Tracking. GTM carregado depois da primeira interação ou 3,5 s, para não pesar a primeira dobra. GA4 e conversão do Google Ads configurados no GTM. Publicar versão do contêiner e criar ações de conversão no Google Ads: uma confirmação única do André, com a lista do que vai ser publicado.

| Evento (dataLayer) | Parâmetros | Onde dispara |
|---|---|---|
| `agendamento_whatsapp` (conversão principal) | `local_cta` (topbar, hero, identificacao, como_funciona, sobre, onde_atende, faq, rodape, flutuante), `cidade`, `clinica`, `ref`, UTMs, `gclid` | Todo CTA de agendamento |
| `autoavaliacao_etapa` | `etapa`, `resposta` | Cada toque da ideia A |
| `autoavaliacao_resultado` | `regiao`, `limitacao`, `tentativa` | Resultado da ideia A |
| `linha_tempo_passo` | `passo` | Cada avanço da ideia B |
| `troca_aba_cidade` | `cidade`, `regiao` | Troca de aba em `#onde-atende` |
| `como_chegar` | `clinica`, `cidade` | Clique em "Como chegar" |
| `faq_aberta` | `pergunta` | Abertura de pergunta |
| `profundidade_rolagem` | `percentual` (25, 50, 75, 90) | Uma vez por marco, por sessão |

Validação: modo de visualização do GTM e requisições de rede (`collect?v=2`, conversão do Ads) no Chrome, local e em produção.

## 9. Dados estruturados

`data/jsonld.ts` gera um `<script type="application/ld+json">` pré-renderizado no HTML:
- `IndividualPhysician` (subtipo de `Physician`): nome, `medicalSpecialty` ortopedia, `identifier` com CRM-MA 16520 e RQE 7389, `telephone`, `url`, `image`, `practicesAt` apontando para as 14 clínicas por `@id`.
- 14 `MedicalClinic`, uma por local: `name`, `address` (`PostalAddress` com rua, cidade, `addressRegion` "MA", CEP quando houver, país "BR"), `hasMap` com o link do brief.
- Validar no validador do schema.org e no teste de resultados avançados do Google.

## 10. Identidade visual

- Linha do dossiê: monograma em traço fino, paleta escura com dourado e bege, tipografia serifada. O logo oficial não foi entregue: usar wordmark tipográfico "Dr. Patrick Santos" com a linha "Instituto Patrick Santos · Ortopedia e Traumatologia" até receber o arquivo (pendência).
- Tokens iniciais (o Designer ajusta mantendo AA): grafite `#15171B`, creme de fundo `#F8F4EC`, bege `#EDE3D2`, dourado `#B98F4E` (texto dourado só sobre grafite), dourado claro da topbar `#D4B06A` com texto `#15171B`, CTA verde WhatsApp escuro `#1E7F4F` com texto branco.
- Tipografia: Lora 600/700 nos títulos (serifada, calma e legível para 50+), Figtree 400/600 no corpo, self-hosted em woff2 com subset latin, `font-display: swap` e fallback métrico. Corpo mínimo 18 px no mobile, entrelinha 1,6, porque o público chega a 70 anos.
- Alvos de toque de 48 px, contraste WCAG AA em tudo, foco visível, `prefers-reduced-motion` respeitado.
- Transição entre seções só por cor de fundo.

## 11. Imagens

- Seleção: hero `_DSC2060`; sobre `_DSC2069`; como funciona `_DSC2001`; rodapé ou CTA final `_DSC1992`. Outras só se o Designer justificar.
- `scripts/imagens.mjs` (ffmpeg) gera AVIF e WebP nas larguras 480, 720, 960 e 1280 em `public/img/`, com recorte definido por foto. Originais continuam em `fotos-originais/`, fora do git.
- `<picture>` com AVIF, WebP e `srcset`/`sizes`. Hero sem lazy e com `fetchpriority="high"`; demais com `loading="lazy"` e `decoding="async"`. Dimensões explícitas para CLS 0.

## 12. Componentes de terceiros (21st.dev e Motion Sites)

Opcional. O Designer pode propor um elemento que ajude a conversão (não decoração). A navegação nos sites é feita pelo Browser/QA com os acessos da nota de credenciais; só itens gratuitos no Motion Sites; ninguém assina, paga ou cadastra forma de pagamento. O prompt fornecido pelo site é adaptado à stack, à identidade, ao mobile e ao tom. Conferir licença de uso comercial. Animação pesada com lazy load e `prefers-reduced-motion`. Registrar aqui: nome, URL, licença e onde entrou. Hoje: nenhum.

## 13. Compliance (Resolução CFM 2.336/2023)

Checklist do Revisor antes de cada merge com texto visível:
- CRM e RQE visíveis no hero, no Sobre e no rodapé.
- Sem promessa ou garantia de resultado, sem superlativo ("o melhor", "referência"), sem sensacionalismo e sem apelo de medo exagerado.
- Sem antes e depois. Sem depoimento (a página não usa os comentários do Instagram).
- Sem paciente identificável nas fotos (só fotos do médico).
- Honestidade sobre limites: a página diz quando a cirurgia é o caminho.
- Nada que atribua condição ao usuário de forma que o Google Ads reprove ("você tem artrose?").
- Regras de copy do time: sem travessão, sem "não é sobre X, é sobre Y", sem tríade emocional, sem palavras abstratas (clareza, propósito, jornada), sem fechamento de coach.

## 14. Testes e QA

- **Unitários (Vitest):** `whatsapp.ts` (número, codificação, cidade, clínica, ref), `origem.ts` (captura, persistência, storage bloqueado), `locais.ts` (14 locais, 11 cidades, 2 regiões, Balsas com 3 e Barra do Corda com 2, todo local com nome, endereço e link), `jsonld.ts` (14 clínicas, `@id` referenciados), abas (troca, teclado, `src` do iframe só depois de abrir), interativos (caminho completo termina em CTA com mensagem certa), `analytics.ts` (eventos e parâmetros).
- **Build:** script confere no `dist/index.html` a topbar, o CTA, CRM, RQE e o JSON-LD, e que nenhum iframe de mapa está no HTML inicial.
- **Browser/QA (390x844, 820x1180, 1440x900):** topbar, CTAs, link "Veja onde ele atende", interativos, as 11 abas, os 14 embeds, os 14 links "Como chegar", accordion, botão flutuante, teclado e leitor de tela básico.
- **Performance:** PageSpeed mobile e desktop no deploy da Vercel.
- **Tracking:** eventos no modo de visualização do GTM e nas requisições de rede, local e em produção.

## 15. Time, floors e fluxo

| Agente | Entrega | Onde |
|---|---|---|
| Copywriter | Todo o texto da página, por seção, na nota do canvas `copy-lp`, antes do front começar | Canvas |
| Dev Full Stack | Scaffold com prerender, preview das três telas, `whatsapp.ts`, `origem.ts`, `CidadeContext`, componente de abas com mapas sob demanda, Vercel | Floor próprio |
| Designer Front-End | Tokens, componentes, as 8 seções, os interativos, imagens aplicadas, responsivo | Floor próprio |
| Braçal | `locais.ts` com os 14 locais, `jsonld.ts`, `scripts/imagens.mjs`, testes | Floor próprio |
| Tracking | `analytics.ts`, eventos, GTM, GA4, conversão do Ads (após confirmação) | Floor próprio |
| Revisor | Parecer na spec, no plano e em cada diff (código, CFM, copy, performance, acessibilidade) | Só lê |
| Git Manager | Commit inicial, uma branch por tarefa, conventional commits, merge após OK do Revisor, push | Ground |
| Browser/QA | QA nas três telas; navegação no 21st.dev e no Motion Sites se o Designer pedir | Chrome (nunca junto do Tracking) |

- O ground fica sempre na `main` e roda o servidor de desenvolvimento (porta 8080). Dois portais no canvas acompanham a `main` em tempo real: a LP (`http://localhost:8080/`) e as três telas (`http://localhost:8080/__preview.html`, mobile 390x844, tablet 820x1180, desktop 1440x900, com rótulo e escala para caber).
- Nunca force push na `main`. Push para `origin` autorizado pelo Maestro a cada merge.

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
8. Razão social e CNPJ vieram de fonte externa no dossiê: confirmar antes de usar na política de privacidade.
9. Hermes (Braçal e Git Manager): provider opencode-go sem credencial, sem perfis `bracal` e `git`, sem aprovação automática.
