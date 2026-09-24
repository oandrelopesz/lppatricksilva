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
