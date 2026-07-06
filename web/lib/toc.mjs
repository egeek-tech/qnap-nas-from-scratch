import { slugify } from './slugify.mjs';

// Plain display text for a heading: read the inline token's parsed children so
// markdown markup (inline `code` backticks, link/emphasis syntax) does not leak
// into the sidebar/rail/search labels. Falls back to the raw content.
function headingText(inline) {
  if (!inline) return '';
  if (inline.children && inline.children.length) {
    return inline.children
      .filter(t => t.type === 'text' || t.type === 'code_inline')
      .map(t => t.content)
      .join('');
  }
  return inline.content || '';
}

export function collectHeadings(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'heading_open') continue;
    const level = Number(tokens[i].tag.slice(1));
    const text = headingText(tokens[i + 1]);
    // Prefer the id markdown-it-anchor already assigned (it disambiguates duplicate
    // headings as slug, slug-1, slug-2 ...). Fall back to slugify(text) when no anchor
    // plugin ran (unit tests). Keeps nav/rail/search slugs identical to rendered ids.
    const id = typeof tokens[i].attrGet === 'function' ? tokens[i].attrGet('id') : null;
    out.push({ level, text, slug: id || slugify(text) });
  }
  return out;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderSidebar(headings) {
  const tops = headings.filter(h => h.level === 1);
  const items = tops.map((h, idx) =>
    `<a href="#${h.slug}"${idx === 0 ? ' class="on"' : ''}><span class="n">${String(idx + 1).padStart(2, '0')}</span> ${esc(h.text)}</a>`
  ).join('\n');
  return `<div class="grp">Guide</div>\n${items}`;
}

export function renderRail(headings) {
  const firstTop = headings.findIndex(h => h.level === 1);
  const sub = [];
  for (let i = firstTop + 1; i < headings.length && headings[i].level !== 1; i++) {
    if (headings[i].level <= 3) sub.push(headings[i]);
  }
  const links = sub.map((h, idx) =>
    `<a href="#${h.slug}"${idx === 0 ? ' class="on"' : ''}>${esc(h.text)}</a>`
  ).join('\n');
  return `<div class="t">On this page</div>\n${links}`;
}
