import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CartaoLocal } from "@/components/CartaoLocal";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { MapaMaranhao } from "@/components/MapaMaranhao";
import { Icone } from "@/components/icones/Icone";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { useCidade } from "@/context/CidadeContext";
import { CIDADES, REGIOES, cidadesDaRegiao, type Cidade, type RegiaoId } from "@/data/locais";
import { track } from "@/lib/analytics";

/** Os mapas carregam quando a seção chega a esta distância da viewport (spec §21). */
const MARGEM_MAPAS_PX = 400;
const INTERVALO_FALLBACK_MS = 200;

function secaoPerto(secao: Element): boolean {
  const { top, bottom } = secao.getBoundingClientRect();
  return top < window.innerHeight + MARGEM_MAPAS_PX && bottom > -MARGEM_MAPAS_PX;
}

/** Evento da troca de aba, também usado quando a cidade é aberta de fora da seção (rodapé). */
export function registrarTrocaAba(cidade: Cidade): void {
  const regiao = REGIOES.find((item) => item.id === cidade.regiaoId)!;
  track("troca_aba_cidade", { cidade: cidade.nome, regiao: regiao.nome });
}

/**
 * Barra de abas com sombra nas bordas só onde ainda há cidades para rolar. Recalcula no scroll da
 * lista (inclusive o causado pelo foco por teclado) e no resize.
 */
function ListaComSombra({ rotuloId, children }: { rotuloId: string; children: ReactNode }) {
  const refLista = useRef<HTMLDivElement>(null);
  const [sombras, setSombras] = useState({ esquerda: false, direita: false });

  useEffect(() => {
    const lista = refLista.current;
    if (!lista) return;
    const medir = () => {
      const maximo = lista.scrollWidth - lista.clientWidth;
      const esquerda = maximo > 1 && lista.scrollLeft > 1;
      const direita = maximo > 1 && lista.scrollLeft < maximo - 1;
      setSombras((atual) => (atual.esquerda === esquerda && atual.direita === direita ? atual : { esquerda, direita }));
    };
    medir();
    lista.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      lista.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  return (
    <div
      className="abas-cidades__lista-wrap"
      data-sombra-esquerda={sombras.esquerda ? "" : undefined}
      data-sombra-direita={sombras.direita ? "" : undefined}
    >
      <div ref={refLista} role="tablist" aria-labelledby={rotuloId} className="abas-cidades__lista">
        {children}
      </div>
    </div>
  );
}

export function AbasCidades() {
  const { cidade: escolhida, escolherCidade, pedidosAbertura, pedidosVisaoGeral } = useCidade();
  // A primeira aba é só visual: não altera a cidade dos CTAs gerais.
  const [aberta, setAberta] = useState<Cidade>(CIDADES[0]);
  const [visaoGeral, setVisaoGeral] = useState(false);
  const [mapasVisiveis, setMapasVisiveis] = useState(false);
  // Sem JavaScript (e no HTML do servidor), a lista geral fica visível; só some depois de montar.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const [focadaPorRegiao, setFocadaPorRegiao] = useState<Partial<Record<RegiaoId, string>>>({});
  const refsAbas = useRef(new Map<string, HTMLButtonElement>());
  const focoVindoDoMapa = useRef(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!escolhida) return;
    setAberta(escolhida);
    setVisaoGeral(false);
    setFocadaPorRegiao({});
  }, [escolhida, pedidosAbertura]);

  useEffect(() => { if (pedidosVisaoGeral > 0) setVisaoGeral(true); }, [pedidosVisaoGeral]);

  useEffect(() => {
    const secao = raiz.current?.closest("section") ?? raiz.current;
    if (!secao) return;
    if (typeof IntersectionObserver === "undefined") {
      // Sem observer: mede a distância no scroll, com throttling.
      if (secaoPerto(secao)) {
        setMapasVisiveis(true);
        return;
      }
      let espera: ReturnType<typeof setTimeout> | undefined;
      const conferir = () => {
        espera = undefined;
        if (!secaoPerto(secao)) return;
        setMapasVisiveis(true);
        parar();
      };
      const agendar = () => {
        if (espera === undefined) espera = setTimeout(conferir, INTERVALO_FALLBACK_MS);
      };
      const parar = () => {
        window.removeEventListener("scroll", agendar);
        window.removeEventListener("resize", agendar);
        if (espera !== undefined) clearTimeout(espera);
      };
      window.addEventListener("scroll", agendar, { passive: true });
      window.addEventListener("resize", agendar);
      return parar;
    }
    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        setMapasVisiveis(true);
        observador.disconnect();
      }
    }, { rootMargin: `${MARGEM_MAPAS_PX}px 0px`, threshold: 0 });
    observador.observe(secao);
    return () => observador.disconnect();
  }, []);

  /** Clique na aba ou no mapa ilustrado: a seção já está na tela, então os mapas podem montar. */
  function abrir(cidade: Cidade) {
    setAberta(cidade);
    setVisaoGeral(false);
    setMapasVisiveis(true);
    escolherCidade(cidade.id, "aba");
    registrarTrocaAba(cidade);
  }

  function abrirPeloMapa(cidade: Cidade) {
    abrir(cidade);
    const aba = refsAbas.current.get(cidade.id);
    const painel = document.getElementById(`painel-${cidade.id}`);
    const retangulo = painel?.getBoundingClientRect();
    const recuo = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (aba) {
      const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
      const painelForaDaTela = !retangulo || retangulo.bottom <= recuo || retangulo.top >= window.innerHeight;
      aba.scrollIntoView?.({ behavior: reduzir ? "auto" : "smooth", block: painelForaDaTela ? "start" : "nearest", inline: "start" });
      focoVindoDoMapa.current = true;
      aba.focus({ preventScroll: true });
      focoVindoDoMapa.current = false;
    }
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, lista: Cidade[], indice: number) {
    const destinos: Record<string, number> = { ArrowRight: (indice + 1) % lista.length, ArrowLeft: (indice - 1 + lista.length) % lista.length, Home: 0, End: lista.length - 1 };
    const destino = destinos[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    refsAbas.current.get(lista[destino].id)?.focus();
  }

  return (
    <div className="abas-cidades" ref={raiz}>
      <MapaMaranhao cidadeAberta={visaoGeral ? undefined : aberta.id} aoEscolher={(id) => {
        const cidade = CIDADES.find((item) => item.id === id);
        if (cidade) abrirPeloMapa(cidade);
      }} />
      {REGIOES.map((regiao) => {
        const lista = cidadesDaRegiao(regiao.id);
        const indiceAberto = visaoGeral ? -1 : lista.findIndex((cidade) => cidade.id === aberta.id);
        return <div key={regiao.id} className="abas-cidades__regiao">
          <h3 id={`regiao-${regiao.id}`}>{regiao.nome}</h3>
          <ListaComSombra rotuloId={`regiao-${regiao.id}`}>
            {lista.map((cidade, indice) => {
              const selecionada = indice === indiceAberto;
              const focada = focadaPorRegiao[regiao.id];
              const focavel = focada ? cidade.id === focada : indiceAberto >= 0 ? selecionada : indice === 0;
              return <button key={cidade.id} ref={(el) => { if (el) refsAbas.current.set(cidade.id, el); else refsAbas.current.delete(cidade.id); }}
                type="button" role="tab" id={`aba-${cidade.id}`} aria-selected={selecionada} aria-controls={`painel-${cidade.id}`}
                tabIndex={focavel ? 0 : -1} onClick={() => abrir(cidade)} onKeyDown={(evento) => aoTeclar(evento, lista, indice)}
                onFocus={(evento) => { setFocadaPorRegiao((atual) => ({ ...atual, [regiao.id]: cidade.id })); if (!focoVindoDoMapa.current) evento.currentTarget.scrollIntoView?.({ block: "nearest", inline: "nearest" }); }}>
                <Icone nome="mapa" className="h-5 w-5 shrink-0" />
                <span>{cidade.nome}</span>
              </button>;
            })}
          </ListaComSombra>
        </div>;
      })}
      <div className="abas-cidades__geral" hidden={montado && !visaoGeral}>{CIDADES.map((cidade) => <div key={cidade.id}>
        <h4>{cidade.nome}</h4><ul>{cidade.locais.map((local) => <li key={local.id}>
          <strong>{local.nome}</strong> {local.endereco}{" "}
          <a href={local.linkComoChegar} target="_blank" rel="noreferrer" onClick={() => track("como_chegar", { local: local.nome, cidade: cidade.nome })}>{T.clinica.comoChegar}</a>{" "}
          <CtaWhatsApp localCta="onde_atende" cidadeFixa={cidade.nome} local={local.nome}>{T.clinica.cta(cidade.nome)}</CtaWhatsApp>
        </li>)}</ul>
      </div>)}</div>
      {CIDADES.map((cidade) => {
        const estaAberta = !visaoGeral && cidade.id === aberta.id;
        return <div key={cidade.id} role="tabpanel" id={`painel-${cidade.id}`} aria-labelledby={`aba-${cidade.id}`} hidden={!estaAberta} tabIndex={0}>
          {estaAberta ? <>
            {cidade.locais.length > 1 ? <p>{T.multiplas(cidade.locais.length)}</p> : null}
            <div className="abas-cidades__cartoes">{cidade.locais.map((local) => <CartaoLocal key={local.id} cidade={cidade} local={local} mostrarMapa={mapasVisiveis} />)}</div>
            <button className="abas-cidades__ver-todas" type="button" onClick={() => setVisaoGeral(true)}>{T.verTodas}</button>
          </> : null}
        </div>;
      })}
    </div>
  );
}
