import { useEffect, useRef, useState } from "react";
import { TEXTOS_COMO_FUNCIONA as T } from "@/content/comoFunciona";
import { useCidade } from "@/context/CidadeContext";
import { REGIOES, buscarCidade, cidadesDaRegiao } from "@/data/locais";
import { track } from "@/lib/analytics";
import { suspenderAtualizacaoPassiva } from "@/lib/navegacaoSecoes";

function rolarParaLocais(): void {
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  suspenderAtualizacaoPassiva();
  document.getElementById("onde-atende")?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth" });
}

export function SeletorCidade() {
  const { cidade: escolhida, escolherCidade, limparCidade, pedirVisaoGeral } = useCidade();
  const [valor, setValor] = useState("");
  /** Escolha feita no select e ainda não aplicada pelo botão: a cidade do contexto não a atropela. */
  const pendente = useRef(false);

  // Acompanha a cidade escolhida em outro lugar (?cidade= ou aba).
  useEffect(() => {
    if (!pendente.current) setValor(escolhida?.id ?? "");
  }, [escolhida]);

  function verLocais() {
    pendente.current = false;
    const cidade = buscarCidade(valor);
    if (!cidade) {
      // Opção vazia: a pessoa informa a cidade na conversa. Limpa a cidade e mostra todas as cidades.
      limparCidade();
      pedirVisaoGeral();
      rolarParaLocais();
      document.querySelector<HTMLElement>('#onde-atende [role="tab"][tabindex="0"]')?.focus({ preventScroll: true });
      return;
    }
    escolherCidade(cidade.id, "seletor");
    track("seletor_cidade", { cidade: cidade.nome });
    rolarParaLocais();
    document.getElementById(`aba-${cidade.id}`)?.focus({ preventScroll: true });
  }

  return (
    <div className="premium-card seletor-cidade bg-bege p-5">
      <label className="block font-semibold" htmlFor="seletor-cidade">{T.rotuloSeletor}</label>
      <p className="mt-2" id="apoio-seletor-cidade">{T.apoioSeletor}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select
          id="seletor-cidade"
          aria-describedby="apoio-seletor-cidade"
          className="min-h-12 min-w-0 flex-1 rounded border border-grafite/30 bg-white px-4 py-3"
          value={valor}
          onChange={(evento) => {
            pendente.current = true;
            setValor(evento.target.value);
          }}
        >
          <option value="">{T.opcaoVazia}</option>
          {REGIOES.map((regiao) => (
            <optgroup key={regiao.id} label={regiao.nome}>
              {cidadesDaRegiao(regiao.id).map((cidade) => (
                <option key={cidade.id} value={cidade.id}>{cidade.nome}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          className="min-h-12 rounded bg-grafite px-5 py-3 font-semibold text-creme"
          onClick={verLocais}
        >
          {T.botaoVerLocais}
        </button>
      </div>
    </div>
  );
}
