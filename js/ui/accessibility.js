export function prefersReducedMotion() {
  return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

export function watchReducedMotion(onChange = () => {}) {
  const media = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!media) return () => {};
  const listener = () => onChange(media.matches);
  media.addEventListener?.('change', listener);
  return () => media.removeEventListener?.('change', listener);
}
