// Split the README head into hero (title + lede) and the guide body.
// The lead <img>, the H1, and the hand-written TOC bullet list are removed from the body.
// The lede is reduced to plain text (markdown links/code/emphasis stripped) because it is
// injected into <meta description> and the hero <p> un-rendered — the real README's first
// paragraph contains a markdown link that would otherwise display as raw [text](url).
export function extractHero(markdown) {
  const lines = markdown.split('\n');
  let i = 0;
  const isBlank = (l) => l.trim() === '';
  const isTocItem = (l) => /^\s*-\s+\[.*\]\(#.*\)/.test(l);

  while (i < lines.length && (isBlank(lines[i]) || /^\s*<img/i.test(lines[i]))) i++;

  let title = '';
  if (/^#\s+/.test(lines[i] || '')) { title = lines[i].replace(/^#\s+/, '').trim(); i++; }

  while (i < lines.length && (isBlank(lines[i]) || isTocItem(lines[i]) || /^\s*>/.test(lines[i]))) i++;

  let lede = '';
  for (let j = i; j < lines.length; j++) {
    const l = lines[j];
    if (isBlank(l) || /^#/.test(l)) { if (lede) break; else continue; }
    lede += (lede ? ' ' : '') + l.trim();
  }
  lede = toPlainText(lede);

  let start = lines.findIndex((l, idx) => idx >= i && /^#{1,6}\s+/.test(l));
  if (start === -1) start = i;
  const body = lines.slice(start).join('\n');

  return { title, lede, body };
}

// Reduce inline markdown to plain text for the lede (links -> text, drop code/emphasis markers).
function toPlainText(s) {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images -> alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')  // links  -> link text
    .replace(/`([^`]+)`/g, '$1')              // inline code
    .replace(/(\*\*|__)(.+?)\1/g, '$2')       // bold
    .replace(/(\*|_)(.+?)\1/g, '$2')          // italic
    .trim();
}
