import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buscarCidade, type Cidade } from "@/data/locais";
import { obterOrigem } from "@/lib/origem";

export type FonteEscolha = "url" | "aba" | "seletor";

interface ValorCidade {
  cidade: Cidade | undefined;
  fonte: FonteEscolha | undefined;
  escolherCidade: (id: string, fonte: FonteEscolha) => void;
  /** A pessoa deixou a cidade em branco (seletor): os CTAs voltam à mensagem base. */
  limparCidade: () => void;
  /**
   * Conta os pedidos de abertura (cada escolherCidade). Reaplicar a mesma cidade depois de
   * "Ver todas as cidades" não troca o objeto Cidade, mas soma um pedido e reabre a aba (R15).
   */
  pedidosAbertura: number;
  /** Conta os pedidos para mostrar a visão geral de locais; a cidade escolhida continua. */
  pedidosVisaoGeral: number;
  pedirVisaoGeral: () => void;
}

const Contexto = createContext<ValorCidade | null>(null);

export function CidadeProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ cidade?: Cidade; fonte?: FonteEscolha }>({});
  const [pedidosVisaoGeral, setPedidosVisaoGeral] = useState(0);
  const [pedidosAbertura, setPedidosAbertura] = useState(0);

  // Cidade do anúncio (?cidade=) só depois da hidratação, para o HTML do servidor ficar neutro.
  useEffect(() => {
    const daUrl = buscarCidade(obterOrigem().cidade);
    if (daUrl) setEstado((atual) => (atual.cidade ? atual : { cidade: daUrl, fonte: "url" }));
  }, []);

  const escolherCidade = useCallback((id: string, fonte: FonteEscolha) => {
    const cidade = buscarCidade(id);
    if (!cidade) return;
    setEstado({ cidade, fonte });
    setPedidosAbertura((n) => n + 1);
  }, []);

  const limparCidade = useCallback(() => setEstado({}), []);

  const pedirVisaoGeral = useCallback(() => setPedidosVisaoGeral((n) => n + 1), []);

  const valor = useMemo(
    () => ({
      cidade: estado.cidade,
      fonte: estado.fonte,
      escolherCidade,
      limparCidade,
      pedidosAbertura,
      pedidosVisaoGeral,
      pedirVisaoGeral,
    }),
    [estado, escolherCidade, limparCidade, pedidosAbertura, pedidosVisaoGeral, pedirVisaoGeral],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCidade(): ValorCidade {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useCidade precisa estar dentro de <CidadeProvider>");
  return valor;
}
