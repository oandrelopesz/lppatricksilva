import { TEXTOS_TOPBAR } from "@/content/topbar";

export function S1Topbar() {
  return (
    <div className="sticky top-0 z-50 bg-dourado-claro px-4 py-2 text-center text-grafite">
      <p className="mx-auto max-w-5xl text-base font-semibold leading-snug">{TEXTOS_TOPBAR.aviso}</p>
    </div>
  );
}
