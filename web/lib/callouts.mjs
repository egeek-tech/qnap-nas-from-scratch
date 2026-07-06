const TYPES = { note:'Note', tip:'Tip', important:'Important', warning:'Warning', caution:'Caution' };

// markdown-it core rule: retag blockquotes that start with "[!TYPE]" into admonition html.
export default function calloutsPlugin(md) {
  md.core.ruler.after('block', 'gfm_callouts', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'blockquote_open') continue;

      // The marker must be the first paragraph directly inside this blockquote:
      // blockquote_open, paragraph_open, inline("[!TYPE] ..."). Scoping to i+1/i+2
      // (not a scan of all remaining tokens) prevents misattributing a later
      // callout's marker to an earlier, unrelated blockquote.
      if (tokens[i + 1]?.type !== 'paragraph_open' || tokens[i + 2]?.type !== 'inline') continue;
      const inline = tokens[i + 2];
      const m = inline.content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
      if (!m) continue;
      const type = m[1].toLowerCase();
      inline.content = inline.content.slice(m[0].length).replace(/^\n/, '');

      // Find this blockquote's matching close (respecting nested blockquotes).
      let depth = 0, close = i;
      for (let j = i; j < tokens.length; j++) {
        if (tokens[j].type === 'blockquote_open') depth++;
        if (tokens[j].type === 'blockquote_close') { depth--; if (depth === 0) { close = j; break; } }
      }

      const openHtml = new state.Token('html_block', '', 0);
      openHtml.content =
        `<div class="adm adm-${type}"><span class="ic">!</span><div>` +
        `<div class="h">${TYPES[type]}</div>`;
      const closeHtml = new state.Token('html_block', '', 0);
      closeHtml.content = `</div></div>\n`;
      tokens[i] = openHtml;
      tokens[close] = closeHtml;

      // When the marker sat alone on its own line, stripping it emptied the first
      // paragraph. Remove that now-empty paragraph (paragraph_open, inline,
      // paragraph_close) so the render doesn't emit a stray <p></p> before the body.
      if (inline.content === '') tokens.splice(i + 1, 3);
    }
    return true;
  });
}
