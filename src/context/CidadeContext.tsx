import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buscarCidade, type Cidade } from "@/data/locais";
import { obterOrigem } from "@/lib/origem";

export type FonteEscolha = "url" | "aba" | "seletor";

interface ValorCidade {
  cidade: Cidade | undefined;
  fonte: FonteEscolha | undefined;
  escolherCidade: (id: string, fonte: FonteEscolha) => void;
}

const Contexto = createContext<ValorCidade | null>(null);

export function CidadeProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ cidade?: Cidade; fonte?: FonteEscolha }>({});

  // Cidade do anúncio (?cidade=) só depois da hidratação, para o HTML do servidor ficar neutro.
  useEffect(() => {
    const daUrl = buscarCidade(obterOrigem().cidade);
    if (daUrl) setEstado((atual) => (atual.cidade ? atual : { cidade: daUrl, fonte: "url" }));
  }, []);

  const escolherCidade = useCallback((id: string, fonte: FonteEscolha) => {
    const cidade = buscarCidade(id);
    if (cidade) setEstado({ cidade, fonte });
  }, []);

  const valor = useMemo(
    () => ({ cidade: estado.cidade, fonte: estado.fonte, escolherCidade }),
    [estado, escolherCidade],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCidade(): ValorCidade {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useCidade precisa estar dentro de <CidadeProvider>");
  return valor;
}
