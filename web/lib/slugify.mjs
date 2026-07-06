// GitHub-style slug: lowercase, strip non-word (keep spaces/hyphens), spaces->hyphens.
export function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // drop punctuation (incl. escaped \&, dots, parens)
    .replace(/\s/g, '-');
}
