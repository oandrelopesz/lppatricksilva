import { useState } from "react";
import { TEXTOS_COMO_FUNCIONA as T } from "@/content/comoFunciona";
import { useCidade } from "@/context/CidadeContext";
import { REGIOES, buscarCidade, cidadesDaRegiao } from "@/data/locais";
import { track } from "@/lib/analytics";

export function SeletorCidade() {
  const { escolherCidade } = useCidade();
  const [valor, setValor] = useState("");

  function verLocais() {
    const cidade = buscarCidade(valor);
    if (!cidade) return;
    escolherCidade(cidade.id, "seletor");
    track("seletor_cidade", { cidade: cidade.nome });
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    document.getElementById("onde-atende")?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth" });
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
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-grafite/30 bg-white px-4 py-3"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
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
          className="min-h-12 rounded-xl bg-grafite px-5 py-3 font-semibold text-creme"
          onClick={verLocais}
        >
          {T.botaoVerLocais}
        </button>
      </div>
    </div>
  );
}
