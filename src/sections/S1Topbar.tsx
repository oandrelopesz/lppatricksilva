import { TEXTOS_TOPBAR } from "@/content/topbar";

export function S1Topbar() {
  return (
    <div className="premium-topbar sticky top-0 z-50 bg-grafite px-4 py-2.5 text-center text-creme">
      <p className="mx-auto max-w-6xl text-[18px] font-semibold leading-snug sm:text-lg">{TEXTOS_TOPBAR.aviso}</p>
    </div>
  );
}
