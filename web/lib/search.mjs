export function buildSearchIndex(headings, sections) {
  return headings.map(h => ({
    slug: h.slug, title: h.text, level: h.level,
    text: (sections[h.slug] || '').replace(/\s+/g, ' ').trim().slice(0, 500),
  }));
}

// Given rendered HTML, return plain text grouped by the heading slug it falls under.
export function sectionsFromHtml(html) {
  const sections = {};
  const re = /<h[1-6][^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)(?=<h[1-6][^>]*\bid=|$)/gi;
  for (const m of html.matchAll(re)) {
    sections[m[1]] = m[2].replace(/<[^>]+>/g, ' ');
  }
  return sections;
}
