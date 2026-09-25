import { useEffect, useState } from "react";
import { EVENTO_CONSENTIMENTO, aceitouAlguma, lerConsentimento, type Escolha } from "@/lib/consentimento";

/**
 * Se a pessoa aceitou pelo menos uma categoria de medição. Começa false (igual ao HTML do servidor),
 * lê a escolha depois de montar e acompanha as escolhas feitas depois no aviso de cookies.
 */
export function useAceiteMedicao(): boolean {
  const [aceite, setAceite] = useState(false);
  useEffect(() => {
    setAceite(aceitouAlguma(lerConsentimento()));
    const aoEscolher = (evento: Event) => setAceite(aceitouAlguma((evento as CustomEvent<Escolha>).detail));
    window.addEventListener(EVENTO_CONSENTIMENTO, aoEscolher);
    return () => window.removeEventListener(EVENTO_CONSENTIMENTO, aoEscolher);
  }, []);
  return aceite;
}
