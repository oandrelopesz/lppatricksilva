import { useState } from "react";
import { track } from "@/lib/analytics";

export interface ItemAccordion {
  id: string;
  pergunta: string;
  resposta: string;
  link?: string;
}

export function Accordion({ itens }: { itens: ItemAccordion[] }) {
  const [aberto, setAberto] = useState<string | null>(null);

  function alternar(id: string) {
    const abrir = aberto !== id;
    setAberto(abrir ? id : null);
    if (abrir) track("faq_aberta", { pergunta: id });
  }

  return (
    <div className="faq-acordeao premium-card">
      {itens.map((item) => {
        const expandido = aberto === item.id;
        return (
          <div key={item.id} className="faq-item">
            <h3>
              <button
                type="button"
                id={`faq-${item.id}`}
                aria-expanded={expandido}
                aria-controls={`faq-${item.id}-resposta`}
                className="faq-pergunta flex min-h-12 w-full items-center justify-between gap-4 px-5 py-4 text-left text-lg font-semibold"
                onClick={() => alternar(item.id)}
              >
                {item.pergunta}
                <svg className="faq-icone" aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path className="faq-icone__vertical" d="M16 10v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </h3>
            <div
              id={`faq-${item.id}-resposta`}
              role="region"
              aria-labelledby={`faq-${item.id}`}
              className="px-5 pb-5"
              hidden={!expandido}
            >
              <p>{item.resposta}</p>
              {item.link ? <a className="mt-3 inline-flex min-h-12 items-center font-semibold underline underline-offset-4" href="#onde-atende">{item.link}</a> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
