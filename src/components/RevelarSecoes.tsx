import { useEffect } from "react";

const SECOES = "#para-quem, #como-funciona, #sobre, #onde-atende, #duvidas, #rodape";

/** A classe é aplicada só após a hidratação; com JS desligado, todo o conteúdo permanece visível. */
export function RevelarSecoes() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const pendentes = [...document.querySelectorAll<HTMLElement>(SECOES)].filter((secao) => secao.getBoundingClientRect().top > window.innerHeight * .75);
    if (!pendentes.length) return;
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.remove("revelar-pendente");
        observador.unobserve(entrada.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    for (const secao of pendentes) {
      secao.classList.add("revelar-alvo");
      secao.classList.add("revelar-pendente");
      observador.observe(secao);
    }
    return () => {
      observador.disconnect();
      for (const secao of pendentes) secao.classList.remove("revelar-pendente", "revelar-alvo");
    };
  }, []);
  return null;
}
