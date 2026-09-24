/**
 * Gera os dados do mapa ilustrado do Maranhão (src/data/mapaMaranhao.ts) a partir da API pública do IBGE.
 * Fontes: malha estadual (qualidade mínima), lista de municípios e centroides municipais.
 * Projeção equirretangular simples (lon corrigido por cos(lat)) em um viewBox 0 0 600 700, com margem.
 */
import fs from "node:fs";
import path from "node:path";

const VIEWBOX = { largura: 600, altura: 700 };
const MARGEM = 16;
const LIMITE_PONTOS = 400;
const TOLERANCIA_INICIAL = 0.5;
const PASSO_TOLERANCIA = 0.5;

const API = "https://servicodados.ibge.gov.br/api";
const UF = "21";

/** id de src/data/locais.ts -> nome do município no IBGE. */
const CIDADES = [
  { id: "balsas", municipio: "Balsas" },
  { id: "sao-domingos-do-azeitao", municipio: "São Domingos do Azeitão" },
  { id: "sao-raimundo-das-mangabeiras", municipio: "São Raimundo das Mangabeiras" },
  { id: "loreto", municipio: "Loreto" },
  { id: "presidente-dutra", municipio: "Presidente Dutra" },
  { id: "fortuna", municipio: "Fortuna" },
  { id: "goncalves-dias", municipio: "Gonçalves Dias" },
  { id: "sao-domingos-do-maranhao", municipio: "São Domingos do Maranhão" },
  { id: "tuntum", municipio: "Tuntum" },
  { id: "graca-aranha", municipio: "Graça Aranha" },
  { id: "barra-do-corda", municipio: "Barra do Corda" },
];

async function pegarJson(url) {
  const resposta = await fetch(url, { headers: { accept: "application/json" } });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${url}`);
  return resposta.json();
}

/** Distância de um ponto ao segmento AB. */
function distanciaSegmento(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const comprimento = Math.hypot(dx, dy);
  if (comprimento === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / comprimento;
}

/** Ramer-Douglas-Peucker: reduz o número de pontos mantendo a forma. */
function simplificar(pontos, tolerancia) {
  if (pontos.length < 3) return pontos.slice();
  const a = pontos[0];
  const b = pontos[pontos.length - 1];
  let indice = -1;
  let maior = 0;
  for (let i = 1; i < pontos.length - 1; i++) {
    const d = distanciaSegmento(pontos[i], a, b);
    if (d > maior) {
      maior = d;
      indice = i;
    }
  }
  if (maior <= tolerancia) return [a, b];
  const esquerda = simplificar(pontos.slice(0, indice + 1), tolerancia);
  const direita = simplificar(pontos.slice(indice), tolerancia);
  return esquerda.slice(0, -1).concat(direita);
}

/** Remove o ponto de fechamento (igual ao primeiro), simplifica e refecha. */
function simplificarAnel(anel, tolerancia) {
  const fechado = anel.length > 1 && anel[0][0] === anel[anel.length - 1][0] && anel[0][1] === anel[anel.length - 1][1];
  const aberto = fechado ? anel.slice(0, -1) : anel.slice();
  const reduzido = simplificar(aberto, tolerancia);
  return fechado ? reduzido.concat([reduzido[0]]) : reduzido;
}

/** Extrai os anéis (arrays de [lon, lat]) de uma geometria Polygon/MultiPolygon. */
function aneis(geometria) {
  if (geometria.type === "Polygon") return geometria.coordinates;
  if (geometria.type === "MultiPolygon") return geometria.coordinates.flat();
  throw new Error(`Geometria não suportada: ${geometria.type}`);
}

const arredondar = (n) => Math.round(n * 100) / 100;

const hoje = new Date().toISOString().slice(0, 10);

const malha = await pegarJson(`${API}/v3/malhas/estados/${UF}?formato=application/vnd.geo+json&qualidade=minima`);
const municipios = await pegarJson(`${API}/v1/localidades/estados/${UF}/municipios`);

const idPorNome = new Map(municipios.map((m) => [m.nome, m.id]));
const aneisBrutos = aneis(malha.features[0].geometry);

const centroides = [];
for (const cidade of CIDADES) {
  const codigo = idPorNome.get(cidade.municipio);
  if (!codigo) throw new Error(`Município não encontrado no IBGE: ${cidade.municipio}`);
  const metadados = await pegarJson(`${API}/v3/malhas/municipios/${codigo}/metadados`);
  const centroide = metadados[0]?.centroide;
  if (!centroide) throw new Error(`Centroide ausente para ${cidade.municipio} (${codigo})`);
  centroides.push({ id: cidade.id, lon: centroide.longitude, lat: centroide.latitude });
}

// Projeção: x = (lon - lonMin) * cos(latMédia); y = (latMax - lat). Escala comum para caber com margem.
const todos = aneisBrutos.flat().concat(centroides.map((c) => [c.lon, c.lat]));
const lonMin = Math.min(...todos.map((p) => p[0]));
const latMin = Math.min(...todos.map((p) => p[1]));
const latMax = Math.max(...todos.map((p) => p[1]));
const cos = Math.cos((((latMin + latMax) / 2) * Math.PI) / 180);

const cru = ([lon, lat]) => [(lon - lonMin) * cos, latMax - lat];
const crus = todos.map(cru);
const xMax = Math.max(...crus.map((p) => p[0]));
const yMax = Math.max(...crus.map((p) => p[1]));

const disponivelX = VIEWBOX.largura - MARGEM * 2;
const disponivelY = VIEWBOX.altura - MARGEM * 2;
const escala = Math.min(disponivelX / xMax, disponivelY / yMax);
const offX = MARGEM + (disponivelX - xMax * escala) / 2;
const offY = MARGEM + (disponivelY - yMax * escala) / 2;
const projetar = ([lon, lat]) => {
  const [x, y] = cru([lon, lat]);
  return [arredondar(offX + x * escala), arredondar(offY + y * escala)];
};

const aneisProjetados = aneisBrutos.map((anel) => anel.map(projetar));

// Simplifica até caber no limite de pontos, mantendo a forma.
let tolerancia = TOLERANCIA_INICIAL;
let simplificados = aneisProjetados.map((anel) => simplificarAnel(anel, tolerancia));
let totalPontos = simplificados.reduce((soma, anel) => soma + anel.length, 0);
while (totalPontos > LIMITE_PONTOS) {
  tolerancia += PASSO_TOLERANCIA;
  simplificados = aneisProjetados.map((anel) => simplificarAnel(anel, tolerancia));
  totalPontos = simplificados.reduce((soma, anel) => soma + anel.length, 0);
}

const contorno = simplificados
  .map((anel) => `M ${anel.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`)
  .join(" ");

const pontos = {};
for (const centroide of centroides) {
  const [x, y] = projetar([centroide.lon, centroide.lat]);
  pontos[centroide.id] = { x, y };
}

const linhasPontos = CIDADES.map((cidade) => `  ${JSON.stringify(cidade.id)}: { x: ${pontos[cidade.id].x}, y: ${pontos[cidade.id].y} },`).join("\n");

const saida = `/**
 * Mapa ilustrado do Maranhão. Gerado por scripts/mapa-maranhao.mjs; não editar à mão.
 */
export const MAPA_MA = {
  viewBox: "0 0 ${VIEWBOX.largura} ${VIEWBOX.altura}",
  contorno: ${JSON.stringify(contorno)},
  fonte: "IBGE, malha estadual e municipal, qualidade mínima, acesso em ${hoje}",
} as const;

export const PONTOS_CIDADES: Record<string, { x: number; y: number }> = {
${linhasPontos}
};
`;

const destino = path.resolve(import.meta.dirname, "..", "src", "data", "mapaMaranhao.ts");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, saida);

console.log(
  `mapa-maranhao: ${aneisBrutos.length} anel(is), ${totalPontos} pontos no contorno (tolerância ${tolerancia}), ${centroides.length} cidades -> ${path.relative(process.cwd(), destino)}`,
);