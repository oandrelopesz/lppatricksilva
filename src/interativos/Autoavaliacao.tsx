import { useEffect, useRef, useState } from "react";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Icone } from "@/components/icones/Icone";
import { TEXTOS_AUTOAVALIACAO as T } from "@/content/autoavaliacao";
import { track } from "@/lib/analytics";

export interface Respostas {
  regiao?: string;
  limitacao?: string;
  tentativa?: string;
}

export function montarResumo(respostas: Respostas, textos = T): string {
  const r = textos.resumo;
  const partes = [
    respostas.regiao ? r.regiao(respostas.regiao) : null,
    respostas.limitacao ? r.limitacao(respostas.limitacao) : null,
    respostas.tentativa ? r.tentativa(respostas.tentativa) : null,
  ].filter((parte): parte is string => Boolean(parte));
  if (partes.length === 0) return r.semRespostas;
  return `${r.inicio} ${partes.join("; ")}.`;
}

export function Autoavaliacao() {
  const [etapa, setEtapa] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [incluir, setIncluir] = useState(false);
  const refPergunta = useRef<HTMLElement>(null);
  const focarDepois = useRef(false);

  useEffect(() => {
    if (!focarDepois.current) return;
    focarDepois.current = false;
    refPergunta.current?.focus();
  }, [etapa]);

  function irPara(novaEtapa: number) {
    focarDepois.current = true;
    setEtapa(novaEtapa);
  }

  function avancar(novaEtapa: number) {
    irPara(novaEtapa);
    if (novaEtapa < T.etapas.length) track("autoavaliacao_etapa", { etapa: novaEtapa + 1 });
    else track("autoavaliacao_concluida");
  }

  function responder(chave: keyof Respostas, valor: string) {
    setRespostas((anteriores) => ({ ...anteriores, [chave]: valor }));
    avancar(etapa + 1);
  }

  function pular() {
    const chave = T.etapas[etapa].chave;
    setRespostas((anteriores) => ({ ...anteriores, [chave]: undefined }));
    track("autoavaliacao_pulada", { etapa: etapa + 1 });
    avancar(etapa + 1);
  }

  const classeAcao = "inline-flex min-h-12 items-center justify-center rounded px-5 py-3 text-lg font-semibold";

  if (etapa === T.etapas.length) {
    const resumo = montarResumo(respostas);
    const haRespostas = Object.values(respostas).some(Boolean);
    return (
      <div className="premium-card autoavaliacao-painel autoavaliacao-resultado bg-white p-6 sm:p-10">
        <h3 ref={refPergunta as React.RefObject<HTMLHeadingElement>} tabIndex={-1} className="text-2xl font-semibold">
          {T.tituloResultado}
        </h3>
        <p className="autoavaliacao-resumo mt-6 bg-bege p-5">{resumo}</p>
        <p className="mt-4">{T.oQueAConsultaAvalia}</p>
        <p className="autoavaliacao-aviso mt-5 border-l-2 border-dourado pl-4 font-semibold">{T.aviso}</p>
        {haRespostas ? (
          <>
            <label className="autoavaliacao-inclusao mt-6 flex min-h-12 items-center gap-3 border border-grafite/20 p-4">
              <input className="size-6 shrink-0 accent-cta" type="checkbox" checked={incluir} onChange={(e) => setIncluir(e.target.checked)} />
              <span>{T.incluirResumo}</span>
            </label>
            <p className="mt-2">{T.avisoPrivacidade}</p>
          </>
        ) : null}
        <CtaWhatsApp
          localCta="autoavaliacao"
          resumo={haRespostas && incluir ? resumo : undefined}
          className={`${classeAcao} premium-cta mt-6 w-full bg-cta text-center text-white hover:bg-cta-escuro sm:w-auto`}
        >
          {T.cta}
        </CtaWhatsApp>
        <button
          type="button"
          className={`${classeAcao} mt-3 w-full border border-grafite/30 text-grafite sm:ml-3 sm:w-auto`}
          onClick={() => {
            setRespostas({});
            setIncluir(false);
            irPara(0);
          }}
        >
          {T.refazer}
        </button>
      </div>
    );
  }

  const atual = T.etapas[etapa];
  return (
    <div className="premium-card autoavaliacao-painel bg-white p-6 sm:p-10">
      <h3 className="text-2xl font-semibold">{T.titulo}</h3>
      <p className="mt-3">{T.introducao}</p>
      <p className="mt-5 font-semibold" aria-live="polite">{T.progresso(etapa + 1, T.etapas.length)}</p>
      <div
        role="progressbar"
        aria-label={T.progresso(etapa + 1, T.etapas.length)}
        aria-valuemin={0}
        aria-valuemax={T.etapas.length}
        aria-valuenow={etapa + 1}
        className="autoavaliacao-progresso mt-2"
      >
        {T.etapas.map((item, indice) => <span key={item.chave} data-completo={indice <= etapa} aria-hidden="true" />)}
      </div>
      <fieldset key={etapa} className="autoavaliacao-etapa mt-8">
        <legend className="text-xl font-semibold">
          <span ref={refPergunta as React.RefObject<HTMLSpanElement>} tabIndex={-1}>{atual.pergunta}</span>
        </legend>
        {respostas[atual.chave] ? <p className="mt-2">{T.respostaAnterior(respostas[atual.chave]!)}</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {atual.opcoes.map((opcao, indice) => (
            <button
              key={opcao}
              type="button"
              className="autoavaliacao-opcao min-h-12 bg-white px-4 py-4 text-left focus-visible:outline-cta"
              onClick={() => responder(atual.chave, opcao)}
            >
              {etapa === 0 ? <span className="autoavaliacao-opcao__icone"><Icone nome={(["joelho", "quadril", "ombro", "coluna", "coluna", "peCalcanhar", "cotovelo"] as const)[indice]} className="h-8 w-8 text-eco" /></span> : null}
              {opcao}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-3">
        {etapa > 0 ? <button className={`${classeAcao} autoavaliacao-nav`} type="button" onClick={() => irPara(etapa - 1)}>{T.voltar}</button> : null}
        <button className={`${classeAcao} autoavaliacao-nav`} type="button" onClick={pular}>{T.pular}</button>
      </div>
    </div>
  );
}
