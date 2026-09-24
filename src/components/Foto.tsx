const LARGURAS = [480, 720, 960, 1280];

interface FotoProps {
  nome: "hero" | "sobre" | "consulta" | "cta-final";
  alt: string;
  sizes: string;
  prioridade?: boolean;
  className?: string;
}

const srcset = (nome: string, formato: string) =>
  LARGURAS.map((largura) => `/img/${nome}-${largura}.${formato} ${largura}w`).join(", ");

export function Foto({ nome, alt, sizes, prioridade = false, className }: FotoProps) {
  const prioridadeAttr = prioridade ? ({ fetchpriority: "high" } as Record<string, string>) : {};

  return (
    <picture>
      <source type="image/avif" srcSet={srcset(nome, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(nome, "webp")} sizes={sizes} />
      <img
        src={`/img/${nome}-720.webp`}
        alt={alt}
        width={720}
        height={900}
        sizes={sizes}
        loading={prioridade ? "eager" : "lazy"}
        decoding={prioridade ? "sync" : "async"}
        className={className}
        {...prioridadeAttr}
      />
    </picture>
  );
}
