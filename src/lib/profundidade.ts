import { track } from "@/lib/analytics";

const MARCOS = [25, 50, 75, 90];
const CHAVE = "lp_profundidade_v1";

/** Fallback quando o sessionStorage está bloqueado: vale enquanto a página estiver aberta. */
let emMemoria = new Set<number>();

export function marcosAtingidos(fracao: number): number[] {
  return MARCOS.filter((m) => fracao * 100 >= m);
}

function lerEnviados(): Set<number> {
  try {
    const salvo = JSON.parse(sessionStorage.getItem(CHAVE) ?? "[]");
    if (Array.isArray(salvo)) for (const m of salvo) if (MARCOS.includes(m)) emMemoria.add(m);
  } catch {
    /* storage bloqueado ou valor inválido: fica a memória */
  }
  return emMemoria;
}

function salvarEnviados(enviados: Set<number>): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify([...enviados].sort((a, b) => a - b)));
  } catch {
    /* storage bloqueado: vale só nesta página */
  }
}

/** Uma vez por marco, por sessão (spec §8). */
export function observarProfundidade(): () => void {
  function aoRolar() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const enviados = lerEnviados();
    for (const marco of marcosAtingidos(window.scrollY / total)) {
      if (enviados.has(marco)) continue;
      enviados.add(marco);
      salvarEnviados(enviados);
      track("profundidade_rolagem", { percentual: marco });
    }
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  return () => window.removeEventListener("scroll", aoRolar);
}

export function reiniciarProfundidadeParaTestes(): void {
  emMemoria = new Set();
}
