import type { ReactNode } from "react";

const FUNDOS = {
  creme: "bg-creme text-grafite",
  bege: "bg-bege text-grafite",
  grafite: "bg-grafite text-creme",
} as const;

interface Props {
  id: string;
  tituloId?: string;
  fundo?: keyof typeof FUNDOS;
  children: ReactNode;
}

export function Secao({ id, tituloId, fundo = "creme", children }: Props) {
  return (
    <section id={id} aria-labelledby={tituloId} className={`${FUNDOS[fundo]} px-4 py-16 md:py-24`}>
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  );
}
