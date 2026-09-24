/**
 * Gera as fotos da LP em AVIF e WebP a partir de fotos-originais/ (fora do git).
 * Originais: 3376x6000. Recorte 4:5 (3376x4220) a partir do y indicado.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const origem = path.join(raiz, "fotos-originais");
const destino = path.join(raiz, "public", "img");
const LARGURAS = [480, 720, 960, 1280];

const FOTOS = [
  { nome: "hero", arquivo: "_DSC2060.jpg", y: 600 },
  { nome: "sobre", arquivo: "_DSC2069.jpg", y: 1000 },
  { nome: "consulta", arquivo: "_DSC2001.jpg", y: 1000 },
  { nome: "cta-final", arquivo: "_DSC1992.jpg", y: 900 },
];

fs.mkdirSync(destino, { recursive: true });

for (const foto of FOTOS) {
  const entrada = path.join(origem, foto.arquivo);
  if (!fs.existsSync(entrada)) throw new Error(`Foto não encontrada: ${entrada}`);
  for (const largura of LARGURAS) {
    const filtro = `crop=3376:4220:0:${foto.y},scale=${largura}:-2:flags=lanczos`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", entrada, "-vf", filtro, "-c:v", "libwebp", "-quality", "78", path.join(destino, `${foto.nome}-${largura}.webp`)]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", entrada, "-vf", filtro, "-pix_fmt", "yuv420p", "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "34", "-cpu-used", "6", path.join(destino, `${foto.nome}-${largura}.avif`)]);
  }
  console.log(`imagens: ${foto.nome} ok`);
}
