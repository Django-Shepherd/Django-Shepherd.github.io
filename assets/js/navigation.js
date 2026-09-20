(() => {
  const sidebar = document.getElementById('reading-sidebar');
  const dialog = document.getElementById('mobile-navigation');
  const toggle = document.getElementById('_menu');
  const close = dialog.querySelector('.mobile-navigation-close');
  const mobileSidebar = sidebar.cloneNode(true);
  mobileSidebar.removeAttribute('id');
  dialog.append(mobileSidebar);

  toggle.addEventListener('click', () => {
    dialog.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
  });
  dialog.addEventListener('click', event => {
    if (event.target.closest('a')) dialog.close();
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX > bounds.right || event.clientX < bounds.left) dialog.close();
    }
  });

  const desktop = window.matchMedia('(min-width: 64em)');
  desktop.addEventListener('change', () => {
    if (desktop.matches && dialog.open) dialog.close();
  });

  const sections = [...document.querySelectorAll('#_main .section-title')];
  const links = [...document.querySelectorAll('[data-section]')];
  const main = document.getElementById('_main');
  const cover = document.getElementById('_sidebar');
  const home = document.getElementById('_home');
  let scheduled = false;
  const updateSection = () => {
    scheduled = false;
    const active = sections.filter(section => section.getBoundingClientRect().top <= 120).pop() || sections[0];
    links.forEach(link => {
      if (link.dataset.section === active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', () => {
    if (document.documentElement.dataset.view === 'home' && !dialog.open && !viewFrame) {
      const coverBottom = cover.getBoundingClientRect().bottom;
      if (coverBottom <= 0) {
        history.pushState(null, '', '#about');
        showView(false, -coverBottom);
      }
    }
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateSection);
    }
  }, { passive: true });
  window.addEventListener('resize', updateSection);

  // Keep the cover above the content until the reader scrolls past it.
  let viewFrame;
  const showView = (focus = false, scrollOffset = null) => {
    const target = document.getElementById(location.hash.slice(1));
    const reading = target && main.contains(target);
    document.documentElement.dataset.view = reading ? 'reading' : 'home';
    if (reading) home.removeAttribute('aria-current');
    else home.setAttribute('aria-current', 'page');
    if (dialog.open) dialog.close();
    window.cancelAnimationFrame(viewFrame);
    viewFrame = window.requestAnimationFrame(() => {
      viewFrame = null;
      if (reading && scrollOffset !== null) window.scrollTo({ top: scrollOffset, behavior: 'instant' });
      else if (reading) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
      if (focus) {
        const destination = reading ? target : cover;
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
      }
      updateSection();
    });
  };

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href);
    const normalizePath = path => path.replace(/index\.html$/, '');
    if (url.origin !== location.origin || normalizePath(url.pathname) !== normalizePath(location.pathname)) return;
    const target = document.getElementById(url.hash.slice(1));
    const isHome = !url.hash || ['#_sidebar', '#home', '#_drawer--opened'].includes(url.hash);
    if (!isHome && !(target && main.contains(target))) return;
    event.preventDefault();
    const hash = isHome ? '#_sidebar' : url.hash;
    if (location.hash !== hash) history.pushState(null, '', hash);
    showView(true);
  });

  history.scrollRestoration = 'manual';
  window.addEventListener('hashchange', () => showView());
  window.addEventListener('popstate', () => showView());
  showView();
})();
