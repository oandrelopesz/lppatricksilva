import type { CSSProperties, MouseEvent } from "react";
import { CIDADES } from "@/data/locais";
import { MAPA_MA, PONTOS_CIDADES } from "@/data/mapaMaranhao";

interface Props {
  cidadeAberta?: string;
  aoEscolher: (id: string) => void;
}

const LARGURA_COMPACTA = 244;
const ALTURA_COMPACTA = 285;

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

const posicoesCompactas = distribuir(LARGURA_COMPACTA, ALTURA_COMPACTA, 6, 15);
const posicoesAmplas = distribuir(600, 700, 12, 30);
const marcadores = CIDADES.map((cidade, indice) => ({
  cidade,
  ponto: PONTOS_CIDADES[cidade.id],
  numero: indice + 1,
  compacto: posicoesCompactas[indice],
  amplo: posicoesAmplas[indice],
}));

export function MapaMaranhao({ cidadeAberta, aoEscolher }: Props) {
  function escolherPeloQuadro(evento: MouseEvent<HTMLDivElement>) {
    if ((evento.target as Element).closest(".mapa-ma__ponto")) return;
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
          <path className="mapa-ma__contorno" d={MAPA_MA.contorno} />
          <g className="mapa-ma__rotas">
            <path className="mapa-ma__rota" d={`M ${marcadores.slice(0, 4).map(({ ponto }) => `${ponto.x} ${ponto.y}`).join(" L ")}`} />
            <path className="mapa-ma__rota" d={`M ${marcadores.slice(4).map(({ ponto }) => `${ponto.x} ${ponto.y}`).join(" L ")}`} />
          </g>
          {marcadores.map(({ cidade, ponto, compacto, amplo }) => <g key={cidade.id}>
            {Math.hypot(ponto.x - compacto.x * 600 / LARGURA_COMPACTA, ponto.y - compacto.y * 700 / ALTURA_COMPACTA) > 6 ?
              <path className="mapa-ma__guia mapa-ma__guia--compacta" data-ativa={cidade.id === cidadeAberta ? "" : undefined}
                d={`M ${ponto.x} ${ponto.y} L ${compacto.x * 600 / LARGURA_COMPACTA} ${compacto.y * 700 / ALTURA_COMPACTA}`} /> : null}
            {Math.hypot(ponto.x - amplo.x, ponto.y - amplo.y) > 6 ?
              <path className="mapa-ma__guia mapa-ma__guia--ampla" d={`M ${ponto.x} ${ponto.y} L ${amplo.x} ${amplo.y}`} /> : null}
            <circle className="mapa-ma__centroide" cx={ponto.x} cy={ponto.y} r="3" />
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
