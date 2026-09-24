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
    <div className="divide-y divide-grafite/20 rounded-2xl border border-grafite/20">
      {itens.map((item) => {
        const expandido = aberto === item.id;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={`faq-${item.id}`}
                aria-expanded={expandido}
                aria-controls={`faq-${item.id}-resposta`}
                className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-4 text-left text-lg font-semibold"
                onClick={() => alternar(item.id)}
              >
                {item.pergunta}
                <span aria-hidden="true">{expandido ? "−" : "+"}</span>
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
              {item.link ? <a className="mt-3 inline-block font-semibold underline underline-offset-4" href="#onde-atende">{item.link}</a> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
