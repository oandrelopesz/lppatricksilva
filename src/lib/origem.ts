import { buscarCidade } from "@/data/locais";

/** Origem da visita. Só parâmetros permitidos e sanitizados; nenhum texto livre. */
export interface Origem {
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

let emMemoria: Origem | null = null;

export function sanitizar(chave: string, valor: string | null): string | undefined {
  if (!valor) return undefined;
  const regra = REGRAS[chave as keyof typeof REGRAS];
  return regra && regra(valor) ? valor : undefined;
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

export function capturarOrigem(search: string, storage: Storage | null): Origem {
  // Uma sessão antiga pode ter "ref" gravado: só os CAMPOS são copiados, então ele é ignorado
  // e sai do storage na próxima gravação (spec §21, sem código de referência).
  const anterior = ler(storage) ?? emMemoria;
  const params = new URLSearchParams(search);
  const origem: Origem = {};

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
  if (typeof window === "undefined") return {};
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

/**
 * utm_* que sai da barra de endereço, decidido pela chave em minúsculas (UTM_TERM, Utm_Term...):
 * só fica um nome minúsculo da convenção com o valor inteiro aprovado; utm_term, variantes de caixa,
 * utm_* sem convenção e valores fora da convenção saem (parecer R24).
 */
function utmProibida(chave: string, valor: string): boolean {
  if (!chave.toLowerCase().startsWith("utm_")) return false;
  const daConvencao = (UTMS as readonly string[]).includes(chave);
  return !daConvencao || sanitizar(chave, valor) === undefined;
}

/**
 * Na carga, antes do pagina_limpa e do GTM: tira da barra de endereço o utm_term (a palavra buscada)
 * e as UTMs fora da convenção fechada, porque a tag do Ads e o ccm/collect mandam a URL completa
 * (spec §8, "Endereço sem termo de busca"). Mantém caminho, âncora, gclid, gbraid, wbraid,
 * gad_source, UTMs válidas e demais parâmetros, com a codificação original. Sem nada a tirar, não
 * toca no histórico.
 */
export function limparEndereco(): void {
  const busca = window.location.search.replace(/^\?/, "");
  if (!busca) return;
  const pares = busca.split("&");
  const mantidos = pares.filter((par) => {
    // Chave e valor só no primeiro "=": o resto (inclusive outros "=") é parte do valor validado.
    const corte = par.indexOf("=");
    const chaveBruta = corte < 0 ? par : par.slice(0, corte);
    const valorBruto = corte < 0 ? "" : par.slice(corte + 1);
    const decodificar = (texto: string) => {
      try {
        return decodeURIComponent(texto.replace(/\+/g, " "));
      } catch {
        return texto;
      }
    };
    return !utmProibida(decodificar(chaveBruta), decodificar(valorBruto));
  });
  if (mantidos.length === pares.length) return;
  const query = mantidos.length ? `?${mantidos.join("&")}` : "";
  window.history.replaceState(window.history.state, "", window.location.pathname + query + window.location.hash);
}

export function reiniciarOrigemParaTestes(): void {
  emMemoria = null;
}
