import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CartaoLocal } from "@/components/CartaoLocal";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { useCidade } from "@/context/CidadeContext";
import { CIDADES, REGIOES, cidadesDaRegiao, type Cidade, type RegiaoId } from "@/data/locais";
import { track } from "@/lib/analytics";

export function AbasCidades() {
  const { cidade: aberta, fonte, escolherCidade, pedidosVisaoGeral } = useCidade();
  const [visaoGeral, setVisaoGeral] = useState(true);
  /** Cidade cujo mapa o usuário liberou com uma ação real. */
  const [mapaLiberado, setMapaLiberado] = useState<string | undefined>();
  /** Roving tabindex: última aba focada em cada tablist (por região). */
  const [focadaPorRegiao, setFocadaPorRegiao] = useState<Partial<Record<RegiaoId, string>>>({});
  const refsAbas = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!aberta) return;
    setVisaoGeral(false);
    if (fonte === "aba" || fonte === "seletor") setMapaLiberado(aberta.id);
  }, [aberta, fonte]);

  // Pedido de visão geral vindo de fora (seletor com a opção vazia).
  useEffect(() => {
    if (pedidosVisaoGeral > 0) setVisaoGeral(true);
  }, [pedidosVisaoGeral]);

  // Nova cidade selecionada (aba, seletor ou URL): a selecionada volta a ser a parada do Tab.
  useEffect(() => setFocadaPorRegiao({}), [aberta]);

  function abrir(cidade: Cidade) {
    // Sai da visão geral aqui mesmo: reabrir a mesma cidade não muda o contexto e o efeito não rodaria.
    setVisaoGeral(false);
    setMapaLiberado(cidade.id);
    escolherCidade(cidade.id, "aba");
    const regiao = REGIOES.find((r) => r.id === cidade.regiaoId)!;
    track("troca_aba_cidade", { cidade: cidade.nome, regiao: regiao.nome });
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, lista: Cidade[], indice: number) {
    const destinos: Record<string, number> = {
      ArrowRight: (indice + 1) % lista.length,
      ArrowLeft: (indice - 1 + lista.length) % lista.length,
      Home: 0,
      End: lista.length - 1,
    };
    const destino = destinos[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    refsAbas.current.get(lista[destino].id)?.focus();
  }

  const mostrarGeral = visaoGeral || !aberta;

  return (
    <div className="abas-cidades">
      {REGIOES.map((regiao) => {
        const lista = cidadesDaRegiao(regiao.id);
        const indiceAberto = mostrarGeral ? -1 : lista.findIndex((c) => c.id === aberta?.id);
        return (
          <div key={regiao.id} className="abas-cidades__regiao">
            <h3 id={`regiao-${regiao.id}`}>{regiao.nome}</h3>
            <div role="tablist" aria-labelledby={`regiao-${regiao.id}`} className="abas-cidades__lista">
              {lista.map((cidade, indice) => {
                const selecionada = indice === indiceAberto;
                const focada = focadaPorRegiao[regiao.id];
                const focavel = focada ? cidade.id === focada : indiceAberto >= 0 ? selecionada : indice === 0;
                return (
                  <button
                    key={cidade.id}
                    ref={(el) => {
                      if (el) refsAbas.current.set(cidade.id, el);
                      else refsAbas.current.delete(cidade.id);
                    }}
                    type="button"
                    role="tab"
                    id={`aba-${cidade.id}`}
                    aria-selected={selecionada}
                    aria-controls={`painel-${cidade.id}`}
                    tabIndex={focavel ? 0 : -1}
                    onClick={() => abrir(cidade)}
                    onKeyDown={(e) => aoTeclar(e, lista, indice)}
                    onFocus={(e) => {
                      setFocadaPorRegiao((atual) => ({ ...atual, [regiao.id]: cidade.id }));
                      e.currentTarget.scrollIntoView?.({ block: "nearest", inline: "nearest" });
                    }}
                  >
                    {cidade.nome}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {mostrarGeral ? (
        <div className="abas-cidades__geral">
          {CIDADES.map((cidade) => (
            <div key={cidade.id}>
              <h4>{cidade.nome}</h4>
              <ul>
                {cidade.locais.map((local) => (
                  <li key={local.id}>
                    <strong>{local.nome}</strong> {local.endereco}{" "}
                    <a
                      href={local.linkComoChegar}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => track("como_chegar", { local: local.nome, cidade: cidade.nome })}
                    >
                      {T.clinica.comoChegar}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {CIDADES.map((cidade) => {
        const estaAberta = !mostrarGeral && cidade.id === aberta?.id;
        const mapaPermitido = estaAberta && mapaLiberado === cidade.id;
        return (
          <div
            key={cidade.id}
            role="tabpanel"
            id={`painel-${cidade.id}`}
            aria-labelledby={`aba-${cidade.id}`}
            hidden={!estaAberta}
            tabIndex={0}
          >
            {estaAberta && !mapaPermitido ? (
              <button type="button" onClick={() => setMapaLiberado(cidade.id)}>
                {T.verMapa}
              </button>
            ) : null}
            {cidade.locais.length > 1 ? <p>{T.multiplas(cidade.locais.length)}</p> : null}
            {cidade.locais.map((local) => (
              <CartaoLocal key={local.id} cidade={cidade} local={local} mostrarMapa={mapaPermitido} />
            ))}
            <button type="button" onClick={() => setVisaoGeral(true)}>
              {T.verTodas}
            </button>
          </div>
        );
      })}
    </div>
  );
}
