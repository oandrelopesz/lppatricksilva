import { track } from "@/lib/analytics";

const MARCOS = [25, 50, 75, 90];

export function marcosAtingidos(fracao: number): number[] {
  return MARCOS.filter((m) => fracao * 100 >= m);
}

export function observarProfundidade(): () => void {
  const enviados = new Set<number>();
  function aoRolar() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    for (const marco of marcosAtingidos(window.scrollY / total)) {
      if (enviados.has(marco)) continue;
      enviados.add(marco);
      track("profundidade_rolagem", { percentual: marco });
    }
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  return () => window.removeEventListener("scroll", aoRolar);
}
