import type { CSSProperties, MouseEvent } from "react";
import { CIDADES } from "@/data/locais";
import { MAPA_MA, PONTOS_CIDADES } from "@/data/mapaMaranhao";

interface Props {
  cidadeAberta?: string;
  aoEscolher: (id: string) => void;
}

const LARGURA_COMPACTA = 246;
const ALTURA_COMPACTA = 287;

type Posicao = { x: number; y: number };

function lado(a: Posicao, b: Posicao, c: Posicao) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function cruzam(a: { origem: Posicao; marcador: Posicao }, b: { origem: Posicao; marcador: Posicao }) {
  return lado(a.origem, a.marcador, b.origem) * lado(a.origem, a.marcador, b.marcador) < 0 &&
    lado(b.origem, b.marcador, a.origem) * lado(b.origem, b.marcador, a.marcador) < 0;
}

function distanciaDaLinha(ponto: Posicao, inicio: Posicao, fim: Posicao) {
  const dx = fim.x - inicio.x, dy = fim.y - inicio.y;
  const proporcao = Math.max(0, Math.min(1, ((ponto.x - inicio.x) * dx + (ponto.y - inicio.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(ponto.x - inicio.x - proporcao * dx, ponto.y - inicio.y - proporcao * dy);
}

// As chamadas seguem o ângulo dos centroides. Entre os encaixes válidos, usa o de menor linha total.
function distribuirCompacto() {
  const cidades = CIDADES.map((cidade) => ({ cidade, origem: {
    x: PONTOS_CIDADES[cidade.id].x * LARGURA_COMPACTA / 600,
    y: PONTOS_CIDADES[cidade.id].y * ALTURA_COMPACTA / 700,
  } }));
  const centro = { x: cidades.reduce((soma, item) => soma + item.origem.x, 0) / cidades.length,
    y: cidades.reduce((soma, item) => soma + item.origem.y, 0) / cidades.length };
  cidades.sort((a, b) => Math.atan2(a.origem.y - centro.y, a.origem.x - centro.x) -
    Math.atan2(b.origem.y - centro.y, b.origem.x - centro.x));
  const encaixes: Posicao[] = [
    [54, 72], [110, 72], [166, 72], [222, 72], [222, 128], [222, 184],
    [222, 240], [166, 240], [110, 240], [54, 240], [54, 184], [54, 128],
  ].map(([x, y]) => ({ x, y }));
  let melhor: { custo: number; posicoes: Map<string, Posicao> } | undefined;
  for (let ignorado = 0; ignorado < encaixes.length; ignorado++) {
    const disponiveis = encaixes.filter((_, indice) => indice !== ignorado);
    for (let inicio = 0; inicio < disponiveis.length; inicio++) {
      const chamadas = cidades.map((item, indice) => ({ ...item,
        marcador: disponiveis[(inicio + indice) % disponiveis.length] }));
      if (chamadas.some((a, i) => chamadas.some((b, j) => i !== j &&
        (cruzam(a, b) || distanciaDaLinha(b.marcador, a.origem, a.marcador) < 25)))) continue;
      const custo = chamadas.reduce((soma, item) => soma + Math.hypot(item.marcador.x - item.origem.x, item.marcador.y - item.origem.y), 0);
      if (!melhor || custo < melhor.custo) melhor = { custo, posicoes: new Map(chamadas.map(({ cidade, marcador }) => [cidade.id, marcador])) };
    }
  }
  if (!melhor) throw new Error("Não foi possível distribuir os pontos do mapa");
  return CIDADES.map((cidade) => melhor.posicoes.get(cidade.id)!);
}

// Distribui áreas de toque de 48 px com ao menos 8 px livres, inclusive na menor tela (320 px).
function distribuir(largura: number, altura: number, passo: number, anguloPasso: number) {
  const marcadores: { x: number; y: number }[] = [];
  for (const cidade of CIDADES) {
    const ponto = PONTOS_CIDADES[cidade.id];
    const origemX = ponto.x * largura / 600;
    const origemY = ponto.y * altura / 700;
    let posicao = { x: origemX, y: origemY };
    busca: for (let raio = 0; raio <= Math.max(largura, altura); raio += passo) {
      for (let angulo = 0; angulo < 360; angulo += anguloPasso) {
        const x = origemX + raio * Math.cos(angulo * Math.PI / 180);
        const y = origemY + raio * Math.sin(angulo * Math.PI / 180);
        if (x < 24 || x > largura - 24 || y < 24 || y > altura - 24) continue;
        if (marcadores.some((outro) => {
          const dx = Math.max(Math.abs(outro.x - x) - 48, 0);
          const dy = Math.max(Math.abs(outro.y - y) - 48, 0);
          return Math.hypot(dx, dy) < 8;
        })) continue;
        posicao = { x, y };
        break busca;
      }
    }
    marcadores.push(posicao);
  }
  return marcadores;
}

const posicoesCompactas = distribuirCompacto();
const posicoesAmplas = distribuir(600, 700, 12, 30);
function linhaCompacta(ponto: Posicao, compacto: Posicao) {
  const x = compacto.x * 600 / LARGURA_COMPACTA;
  const y = compacto.y * 700 / ALTURA_COMPACTA;
  const dx = ponto.x - x, dy = ponto.y - y;
  const comprimento = Math.hypot(dx, dy);
  const distanciaNaTela = Math.hypot(dx * LARGURA_COMPACTA / 600, dy * ALTURA_COMPACTA / 700);
  if (distanciaNaTela < 12) return undefined;
  return `M ${x} ${y} L ${ponto.x - dx * 10 / comprimento} ${ponto.y - dy * 10 / comprimento}`;
}
const marcadores = CIDADES.map((cidade, indice) => ({
  cidade,
  ponto: PONTOS_CIDADES[cidade.id],
  numero: indice + 1,
  compacto: posicoesCompactas[indice],
  amplo: posicoesAmplas[indice],
  guiaCompacta: linhaCompacta(PONTOS_CIDADES[cidade.id], posicoesCompactas[indice]),
}));

export function MapaMaranhao({ cidadeAberta, aoEscolher }: Props) {
  function escolherPeloQuadro(evento: MouseEvent<HTMLDivElement>) {
    if ((evento.target as Element).closest(".mapa-ma__ponto")) return;
    const quadro = evento.currentTarget.getBoundingClientRect();
    if (quadro.width && quadro.height) {
      const x = (evento.clientX - quadro.left) * 600 / quadro.width;
      const y = (evento.clientY - quadro.top) * 700 / quadro.height;
      const proximo = marcadores.map(({ cidade, ponto }) => ({ id: cidade.id,
        distancia: Math.hypot((x - ponto.x) * quadro.width / 600, (y - ponto.y) * quadro.height / 700) }))
        .sort((a, b) => a.distancia - b.distancia)[0];
      if (proximo.distancia <= 18) { aoEscolher(proximo.id); return; }
    }
    const botoes = evento.currentTarget.querySelectorAll<HTMLButtonElement>(".mapa-ma__ponto");
    let maisPerto: { id: string; distancia: number } | undefined;
    botoes.forEach((botao, indice) => {
      const retangulo = botao.getBoundingClientRect();
      const distancia = Math.hypot(evento.clientX - (retangulo.left + retangulo.width / 2), evento.clientY - (retangulo.top + retangulo.height / 2));
      if (!maisPerto || distancia < maisPerto.distancia) maisPerto = { id: marcadores[indice].cidade.id, distancia };
    });
    if (maisPerto && maisPerto.distancia <= 72) aoEscolher(maisPerto.id);
  }

  return <figure className="mapa-ma">
    <div className="mapa-ma__rolagem">
      <div className="mapa-ma__quadro" role="group" aria-label="Cidades no mapa ilustrado do Maranhão" onClick={escolherPeloQuadro}>
        <svg viewBox={MAPA_MA.viewBox} aria-hidden="true" focusable="false">
          <defs>
            <marker id="mapa-ma-seta" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 1 1 L 11 6 L 1 11 Z" fill="#d4dcd9" />
            </marker>
            <marker id="mapa-ma-seta-ouro" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 1 1 L 11 6 L 1 11 Z" fill="#c9a96c" />
            </marker>
          </defs>
          <path className="mapa-ma__contorno" d={MAPA_MA.contorno} />
          <g className="mapa-ma__rotas">
            <path className="mapa-ma__rota" d={`M ${marcadores.slice(0, 4).map(({ ponto }) => `${ponto.x} ${ponto.y}`).join(" L ")}`} />
            <path className="mapa-ma__rota" d={`M ${marcadores.slice(4).map(({ ponto }) => `${ponto.x} ${ponto.y}`).join(" L ")}`} />
          </g>
          {[...marcadores].sort((a, b) => Number(a.cidade.id === cidadeAberta) - Number(b.cidade.id === cidadeAberta)).map(({ cidade, ponto, guiaCompacta, amplo }) => <g key={cidade.id}>
            {guiaCompacta ?
              <path className="mapa-ma__guia mapa-ma__guia--compacta" data-cidade={cidade.id} data-ativa={cidade.id === cidadeAberta ? "" : undefined}
                d={guiaCompacta} markerEnd={cidade.id === cidadeAberta ? "url(#mapa-ma-seta-ouro)" : "url(#mapa-ma-seta)"} /> : null}
            {Math.hypot(ponto.x - amplo.x, ponto.y - amplo.y) > 6 ?
              <path className="mapa-ma__guia mapa-ma__guia--ampla" data-ativa={cidade.id === cidadeAberta ? "" : undefined}
                d={`M ${ponto.x} ${ponto.y} L ${amplo.x} ${amplo.y}`} /> : null}
            <circle className="mapa-ma__centroide" data-cidade={cidade.id} data-ativa={cidade.id === cidadeAberta ? "" : undefined}
              cx={ponto.x} cy={ponto.y} r="7" />
          </g>)}
        </svg>
        {marcadores.map(({ cidade, numero, compacto, amplo }) => <button key={cidade.id} className="mapa-ma__ponto" type="button"
          style={{ "--x-compacto": `${compacto.x / LARGURA_COMPACTA * 100}%`, "--y-compacto": `${compacto.y / ALTURA_COMPACTA * 100}%`,
            "--x-amplo": `${amplo.x / 600 * 100}%`, "--y-amplo": `${amplo.y / 700 * 100}%`,
            "--limite-etiqueta": `${compacto.x > LARGURA_COMPACTA / 2 ? compacto.x - 30 : LARGURA_COMPACTA - compacto.x - 30}px` } as CSSProperties}
          data-lado={compacto.x > LARGURA_COMPACTA / 2 ? "esquerda" : "direita"}
          aria-label={`${numero}, Cidade de ${cidade.nome} no mapa`} aria-current={cidade.id === cidadeAberta ? "location" : undefined}
          onClick={() => aoEscolher(cidade.id)}><span className="mapa-ma__numero" aria-hidden="true">{numero}</span>
            {cidade.id === cidadeAberta ? <span className="mapa-ma__etiqueta" aria-hidden="true">{cidade.nome}</span> : null}
          </button>)}
      </div>
    </div>
    <ol className="mapa-ma__legenda">{marcadores.map(({ cidade, numero }) => <li key={cidade.id} className={cidade.id === cidadeAberta ? "mapa-ma__legenda-ativa" : undefined}>
      <span aria-hidden="true">{numero.toString().padStart(2, "0")}</span> {cidade.nome}
    </li>)}</ol>
    <figcaption>Fonte: IBGE, API de Malhas Geográficas v3 (malha estadual e centroides municipais), acesso em 24/09/2026. <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noreferrer">Documentação do IBGE</a>. Os pontos são ilustrativos, não endereços.</figcaption>
  </figure>;
}
