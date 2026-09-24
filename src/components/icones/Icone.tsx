import { useId } from "react";
import type { ReactNode } from "react";

export type NomeIcone =
  | "joelho" | "quadril" | "ombro" | "coluna" | "peCalcanhar"
  | "cotovelo" | "tendaoTreino" | "calendario" | "mapa" | "conversa" | "ultrassom";

const desenhos: Record<NomeIcone, ReactNode> = {
  joelho: <><path d="M8 2v5c0 2 1 3 3 4l2 1c2 1 3 3 3 5v5"/><path d="M6 22v-5c0-2 1-4 3-5l2-1"/><circle cx="13" cy="13" r="2"/></>,
  quadril: <><path d="M5 3c0 4 2 7 5 8l2 1 2-1c3-1 5-4 5-8"/><path d="M7 10c-2 2-2 5 0 7l2 2v3m8-12c2 2 2 5 0 7l-2 2v3"/><circle cx="12" cy="13" r="2"/></>,
  ombro: <><path d="M3 8c3-4 7-5 11-3 3 1 5 4 7 6"/><path d="M8 7c1 3 3 5 6 6l4 2v7"/><path d="M4 11c2 2 4 3 7 3"/><circle cx="14" cy="10" r="2"/></>,
  coluna: <><path d="M12 2c-2 2-2 4 0 6s2 4 0 6-2 4 0 8"/><path d="M7 5h10M7 10h10M7 15h10M7 20h10"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="12" cy="15" r="1"/></>,
  peCalcanhar: <><path d="M5 3v10c0 3 2 5 5 5h3c2 0 3 1 3 3h5v-3c0-3-2-5-5-6l-3-1V3"/><path d="M5 17c-1 1-2 3-2 5h8"/></>,
  cotovelo: <><path d="M5 2v7c0 3 2 5 5 5h3c3 0 5 2 5 5v3"/><path d="M10 2v5c0 2 1 3 3 3h2c4 0 7 3 7 7v5"/><circle cx="14" cy="14" r="2"/></>,
  tendaoTreino: <><path d="M4 7h3m10 0h3M2 10V4m20 6V4M7 7h10"/><path d="M8 16c2-2 6-2 8 0l2 3-2 3H8l-2-3 2-3Z"/><path d="M10 18h4"/></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h3m3 0h3m-9 4h3"/></>,
  mapa: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  conversa: <><path d="M20 11a8 8 0 0 1-8 8 9 9 0 0 1-3-.5L4 21l1.5-5A8 8 0 1 1 20 11Z"/><path d="M8 10h8m-8 4h5"/></>,
  ultrassom: <><rect x="3" y="3" width="16" height="13" rx="2"/><path d="M6 12c2-4 3-1 5-4 2 4 3 0 5 3m-6 5v4m-4 0h8m5-8h2v9h-3"/></>,
};

interface Props {
  nome: NomeIcone;
  titulo?: string;
  className?: string;
}

export function Icone({ nome, titulo, className }: Props) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titulo ? "img" : undefined}
      aria-labelledby={titulo ? id : undefined}
      aria-hidden={titulo ? undefined : true}
    >
      {titulo ? <title id={id}>{titulo}</title> : null}
      {desenhos[nome]}
    </svg>
  );
}
