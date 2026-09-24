import { useEffect, useRef, useState } from "react";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
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

  const classeAcao = "inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-lg font-semibold";

  if (etapa === T.etapas.length) {
    const resumo = montarResumo(respostas);
    const haRespostas = Object.values(respostas).some(Boolean);
    return (
      <div className="rounded-2xl border border-grafite/15 bg-creme p-5 sm:p-8">
        <h3 ref={refPergunta as React.RefObject<HTMLHeadingElement>} tabIndex={-1} className="text-2xl font-semibold">
          {T.tituloResultado}
        </h3>
        <p className="mt-4">{resumo}</p>
        <p className="mt-4">{T.oQueAConsultaAvalia}</p>
        <p className="mt-4 font-semibold">{T.aviso}</p>
        {haRespostas ? (
          <>
            <label className="mt-6 flex min-h-12 items-center gap-3">
              <input className="size-6 shrink-0 accent-cta" type="checkbox" checked={incluir} onChange={(e) => setIncluir(e.target.checked)} />
              <span>{T.incluirResumo}</span>
            </label>
            <p className="mt-2">{T.avisoPrivacidade}</p>
          </>
        ) : null}
        <CtaWhatsApp
          localCta="autoavaliacao"
          resumo={haRespostas && incluir ? resumo : undefined}
          className={`${classeAcao} mt-6 w-full bg-cta text-center text-white hover:bg-cta-escuro sm:w-auto`}
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
    <div className="rounded-2xl border border-grafite/15 bg-creme p-5 sm:p-8">
      <h3 className="text-2xl font-semibold">{T.titulo}</h3>
      <p className="mt-3">{T.introducao}</p>
      <p className="mt-5 font-semibold" aria-live="polite">{T.progresso(etapa + 1, T.etapas.length)}</p>
      <fieldset className="mt-4">
        <legend className="text-xl font-semibold">
          <span ref={refPergunta as React.RefObject<HTMLSpanElement>} tabIndex={-1}>{atual.pergunta}</span>
        </legend>
        {respostas[atual.chave] ? <p className="mt-2">{T.respostaAnterior(respostas[atual.chave]!)}</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {atual.opcoes.map((opcao) => (
            <button
              key={opcao}
              type="button"
              className="min-h-12 rounded-lg border border-grafite/25 bg-white px-4 py-3 text-left hover:border-grafite focus-visible:outline-cta"
              onClick={() => responder(atual.chave, opcao)}
            >
              {opcao}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-3">
        {etapa > 0 ? <button className={`${classeAcao} border border-grafite/30`} type="button" onClick={() => irPara(etapa - 1)}>{T.voltar}</button> : null}
        <button className={`${classeAcao} border border-grafite/30`} type="button" onClick={pular}>{T.pular}</button>
      </div>
    </div>
  );
}
