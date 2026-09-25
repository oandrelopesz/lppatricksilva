import { CIDADES } from "@/data/locais";
import { MAPA_MA, PONTOS_CIDADES } from "@/data/mapaMaranhao";

interface Props {
  cidadeAberta?: string;
  aoEscolher: (id: string) => void;
}

// Mantém 48 px de área de toque sem sobrepor as cidades próximas no centro do estado.
const marcadores = CIDADES.map((cidade, indice) => {
  const ponto = PONTOS_CIDADES[cidade.id];
  return { cidade, ponto, numero: indice + 1, x: ponto.x, y: ponto.y };
});
for (let indice = 0; indice < marcadores.length; indice++) {
  const atual = marcadores[indice];
  for (let raio = 0; raio <= 180; raio += 12) {
    let achou = false;
    for (let angulo = 0; angulo < 360; angulo += 30) {
      const x = atual.ponto.x + raio * Math.cos(angulo * Math.PI / 180);
      const y = atual.ponto.y + raio * Math.sin(angulo * Math.PI / 180);
      if (x < 26 || x > 574 || y < 26 || y > 674) continue;
      if (marcadores.slice(0, indice).some((outro) => {
        const dx = Math.max(Math.abs(outro.x - x) - 48, 0);
        const dy = Math.max(Math.abs(outro.y - y) - 48, 0);
        return Math.hypot(dx, dy) < 8;
      })) continue;
      atual.x = x;
      atual.y = y;
      achou = true;
      break;
    }
    if (achou) break;
  }
}

export function MapaMaranhao({ cidadeAberta, aoEscolher }: Props) {
  return <figure className="mapa-ma">
    <div className="mapa-ma__rolagem">
      <div className="mapa-ma__quadro" role="group" aria-label="Cidades no mapa ilustrado do Maranhão">
        <svg viewBox={MAPA_MA.viewBox} aria-hidden="true" focusable="false">
          <path className="mapa-ma__contorno" d={MAPA_MA.contorno} />
          <path className="mapa-ma__rota" d={`M ${marcadores.slice(0, 4).map(({ ponto }) => `${ponto.x} ${ponto.y}`).join(" L ")}`} />
          <path className="mapa-ma__rota" d={`M ${marcadores.slice(4).map(({ ponto }) => `${ponto.x} ${ponto.y}`).join(" L ")}`} />
          {marcadores.map(({ cidade, ponto, x, y }) => <g key={cidade.id}>
            {Math.hypot(ponto.x - x, ponto.y - y) > 6 ? <path className="mapa-ma__guia" d={`M ${ponto.x} ${ponto.y} L ${x} ${y}`} /> : null}
            <circle className="mapa-ma__centroide" cx={ponto.x} cy={ponto.y} r="3" />
          </g>)}
        </svg>
        {marcadores.map(({ cidade, numero, x, y }) => <button key={cidade.id} className="mapa-ma__ponto" type="button"
          style={{ left: x, top: y }} aria-label={`Cidade de ${cidade.nome} no mapa`} aria-current={cidade.id === cidadeAberta ? "location" : undefined}
          onClick={() => aoEscolher(cidade.id)}><span aria-hidden="true">{numero}</span></button>)}
      </div>
    </div>
    <ol className="mapa-ma__legenda">{marcadores.map(({ cidade, numero }) => <li key={cidade.id} className={cidade.id === cidadeAberta ? "mapa-ma__legenda-ativa" : undefined}>
      <span aria-hidden="true">{numero.toString().padStart(2, "0")}</span> {cidade.nome}
    </li>)}</ol>
    <figcaption>Fonte: IBGE, API de Malhas Geográficas v3 (malha estadual e centroides municipais), acesso em 24/09/2026. <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noreferrer">Documentação do IBGE</a>. Os pontos são ilustrativos, não endereços.</figcaption>
  </figure>;
}
