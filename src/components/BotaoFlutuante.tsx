import { useEffect, useState } from "react";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { TEXTOS_HERO as T } from "@/content/hero";

export function BotaoFlutuante() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById("cta-hero");
    if (!alvo || typeof IntersectionObserver === "undefined") return;
    const observador = new IntersectionObserver(([entrada]) => setVisivel(!entrada.isIntersecting));
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  if (!visivel) return null;
  return (
    <CtaWhatsApp
      localCta="flutuante"
      aria-label={T.flutuanteAria}
      className="premium-cta fixed bottom-4 right-4 z-40 inline-flex min-h-12 min-w-12 items-center justify-center rounded bg-cta px-5 py-3 text-base font-semibold text-white md:hidden"
    >
      {T.flutuante}
    </CtaWhatsApp>
  );
}
