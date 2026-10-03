/** Resolve paths under `public/` for both dev and production (GitHub Pages `homepage`). */
export function assetUrl(path) {
  const base = process.env.PUBLIC_URL || "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
