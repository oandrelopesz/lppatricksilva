import { TEXTOS_TOPBAR } from "@/content/topbar";

export function S1Topbar() {
  return (
    <div className="premium-topbar sticky top-0 z-50 bg-dourado-claro px-4 py-2.5 text-center text-grafite">
      <p className="mx-auto max-w-6xl text-sm font-semibold leading-snug tracking-wide sm:text-base">{TEXTOS_TOPBAR.aviso}</p>
    </div>
  );
}
