(() => {
  const root = document.documentElement;

  // theme toggle (the inline <head> script sets the initial mode before paint).
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
  };
  document.getElementById('themebtn')?.addEventListener('click', () => {
    const next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-mode', next); store.set('theme', next);
  });

  // reading progress
  const bar = document.getElementById('bar');
  addEventListener('scroll', () => {
    const h = document.documentElement;
    if (bar) bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100) + '%';
  }, { passive: true });

  // ----- left-nav scroll-spy + dynamic "on this page" rail -----
  // Group each top-level (h1) section's subsections so the rail can show the
  // CURRENT section as the reader scrolls, instead of a static first-section list.
  const rail = document.getElementById('rail');
  const heads = [...document.querySelectorAll('main h1, main h2, main h3')];
  const sections = new Map();            // h1 id -> [{ id, text, level }]
  let curH1 = null;
  for (const h of heads) {
    const level = Number(h.tagName[1]);
    if (level === 1) { curH1 = h.id; sections.set(curH1, []); }
    else if (curH1) sections.get(curH1).push({ id: h.id, text: h.textContent, level });
  }
  const navLinks = new Map([...document.querySelectorAll('.lnav a')].map(a => [a.getAttribute('href').slice(1), a]));

  function buildRail(h1id) {
    if (!rail) return;
    const subs = sections.get(h1id) || [];
    const frag = document.createDocumentFragment();
    const t = document.createElement('div'); t.className = 't'; t.textContent = 'On this page';
    frag.append(t);
    for (const s of subs) {
      const a = document.createElement('a');
      a.href = '#' + s.id; a.textContent = s.text; a.dataset.sub = s.id;
      if (s.level === 3) a.style.paddingLeft = '24px';
      frag.append(a);
    }
    rail.replaceChildren(frag);
  }

  let activeH1 = null;
  const navSpy = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('on'));
      navLinks.get(e.target.id)?.classList.add('on');
      if (e.target.id !== activeH1) { activeH1 = e.target.id; buildRail(activeH1); }
    }
  }, { rootMargin: '-40% 0px -55% 0px' });
  navLinks.forEach((_, id) => { const el = document.getElementById(id); if (el) navSpy.observe(el); });

  // highlight the active subsection within the (dynamically built) rail
  const subSpy = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) {
      rail?.querySelectorAll('a').forEach(a => a.classList.remove('on'));
      rail?.querySelector('a[data-sub="' + e.target.id + '"]')?.classList.add('on');
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  heads.forEach(h => { const l = Number(h.tagName[1]); if (l >= 2 && l <= 3) subSpy.observe(h); });

  // initial rail = first section (matches the server-rendered no-JS fallback)
  if (sections.size) buildRail([...sections.keys()][0]);

  // copy buttons on code blocks
  document.querySelectorAll('pre.shiki').forEach(pre => {
    const wrap = document.createElement('div'); wrap.className = 'shiki-wrap';
    pre.replaceWith(wrap); wrap.appendChild(pre);
    const btn = document.createElement('button'); btn.className = 'copy'; btn.textContent = 'Copy';
    btn.onclick = () => { navigator.clipboard?.writeText(pre.innerText);
      btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy', 1200); };
    wrap.appendChild(btn);
  });

  // search — build result nodes with safe DOM APIs (textContent only)
  const data = JSON.parse(document.getElementById('searchdata')?.textContent || '[]');
  const dlg = document.getElementById('searchdlg');
  const input = document.getElementById('searchinput');
  const results = document.getElementById('searchresults');
  const open = () => { dlg.showModal(); input.value = ''; renderResults(''); input.focus(); };
  document.getElementById('searchbtn')?.addEventListener('click', open);
  addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
  function renderResults(q) {
    const term = q.trim().toLowerCase();
    const hits = !term ? data.slice(0, 8)
      : data.filter(d => (d.title + ' ' + d.text).toLowerCase().includes(term)).slice(0, 12);
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
  input?.addEventListener('input', () => renderResults(input.value));
  results?.addEventListener('click', (e) => { if (e.target.closest('a')) dlg.close(); });

  // mobile drawer
  document.querySelector('.logo')?.addEventListener('click', () => document.getElementById('lnav')?.classList.toggle('open'));
})();
