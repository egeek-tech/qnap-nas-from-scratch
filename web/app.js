(() => {
  const root = document.documentElement;

  // theme toggle (persisted; initial from prefers-color-scheme unless stored)
  const stored = localStorage.getItem('theme');
  if (stored) root.setAttribute('data-mode', stored);
  else if (matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-mode', 'dark');
  document.getElementById('themebtn')?.addEventListener('click', () => {
    const next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-mode', next); localStorage.setItem('theme', next);
  });

  // reading progress
  const bar = document.getElementById('bar');
  addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100) + '%';
  }, { passive: true });

  // scroll-spy for the left nav (top-level sections)
  const navLinks = new Map([...document.querySelectorAll('.lnav a')].map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('on'));
      navLinks.get(e.target.id)?.classList.add('on');
    }});
  }, { rootMargin: '-40% 0px -55% 0px' });
  navLinks.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

  // copy buttons on code blocks
  document.querySelectorAll('pre.shiki').forEach(pre => {
    const wrap = document.createElement('div'); wrap.className = 'shiki-wrap';
    pre.replaceWith(wrap); wrap.appendChild(pre);
    const btn = document.createElement('button'); btn.className = 'copy'; btn.textContent = 'Copy';
    btn.onclick = () => { navigator.clipboard?.writeText(pre.innerText);
      btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy', 1200); };
    wrap.appendChild(btn);
  });

  // search — build result nodes with safe DOM APIs (no innerHTML)
  const data = JSON.parse(document.getElementById('searchdata')?.textContent || '[]');
  const dlg = document.getElementById('searchdlg');
  const input = document.getElementById('searchinput');
  const results = document.getElementById('searchresults');
  const open = () => { dlg.showModal(); input.value = ''; render(''); input.focus(); };
  document.getElementById('searchbtn')?.addEventListener('click', open);
  addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
  function render(q) {
    const t = q.trim().toLowerCase();
    const hits = !t ? data.slice(0, 8)
      : data.filter(d => (d.title + ' ' + d.text).toLowerCase().includes(t)).slice(0, 12);
    results.replaceChildren();
    if (!hits.length) {
      const none = document.createElement('div');
      none.className = 's-ctx'; none.style.padding = '10px'; none.textContent = 'No results';
      results.append(none);
      return;
    }
    for (const d of hits) {
      const a = document.createElement('a'); a.href = '#' + d.slug;
      const ti = document.createElement('span'); ti.className = 's-title'; ti.textContent = d.title;
      const cx = document.createElement('div'); cx.className = 's-ctx'; cx.textContent = d.text.slice(0, 90);
      a.append(ti, cx);
      results.append(a);
    }
  }
  input?.addEventListener('input', () => render(input.value));
  results?.addEventListener('click', (e) => { if (e.target.closest('a')) dlg.close(); });

  // mobile drawer
  document.querySelector('.logo')?.addEventListener('click', () => document.getElementById('lnav')?.classList.toggle('open'));
})();
