import Shiki from '@shikijs/markdown-it';

// Dual-theme highlighter: emits CSS-variable colors; theme.css flips them for dark mode.
export function createHighlighterPlugin() {
  return Shiki({
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: 'light',
    langs: ['bash', 'ini', 'toml', 'json', 'yaml', 'c', 'xml', 'diff', 'systemd', 'properties'],
    fallbackLanguage: 'bash',
  });
}
