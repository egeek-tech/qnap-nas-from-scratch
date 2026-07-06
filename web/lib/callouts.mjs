const TYPES = { note:'Note', tip:'Tip', important:'Important', warning:'Warning', caution:'Caution' };

// markdown-it core rule: retag blockquotes that start with "[!TYPE]" into admonition html.
export default function calloutsPlugin(md) {
  md.core.ruler.after('block', 'gfm_callouts', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'blockquote_open') continue;
      const inline = tokens.slice(i).find(t => t.type === 'inline');
      if (!inline) continue;
      const m = inline.content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
      if (!m) continue;
      const type = m[1].toLowerCase();
      inline.content = inline.content.slice(m[0].length).replace(/^\n/, '');
      if (inline.children && inline.children.length) {
        inline.children[0].content = inline.children[0].content.replace(/^\[!.*?\]\s*/i, '');
      }
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
    }
    return true;
  });
}
