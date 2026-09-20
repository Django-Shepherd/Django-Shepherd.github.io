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
    if (document.documentElement.dataset.view === 'home' && !dialog.open && !switchingView) {
      if (window.scrollY > 48) {
        history.pushState(null, '', '#about');
        showView();
      }
    }
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateSection);
    }
  }, { passive: true });
  window.addEventListener('resize', updateSection);

  // Use the same transition for scrolling and navigation links.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let switchingView = false;
  let activeAnimation;
  let navigationRevision = 0;
  const showView = (focus = false) => {
    const revision = ++navigationRevision;
    const target = document.getElementById(location.hash.slice(1));
    const reading = target && main.contains(target);
    const nextView = reading ? 'reading' : 'home';
    const changed = document.documentElement.dataset.view !== nextView;
    activeAnimation?.cancel();
    if (dialog.open) dialog.close();

    const applyView = () => {
      if (revision !== navigationRevision) return;
      document.documentElement.dataset.view = nextView;
      if (reading) home.removeAttribute('aria-current');
      else home.setAttribute('aria-current', 'page');
      if (reading) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
      if (focus) {
        const destination = reading ? target : cover;
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
      }
      updateSection();
    };

    if (!changed || reducedMotion.matches) {
      switchingView = false;
      applyView();
      return;
    }

    switchingView = true;
    const content = document.querySelector('.reading-layout');
    const outgoing = reading ? cover : content;
    const incoming = reading ? content : cover;
    const animateView = async () => {
      try {
        activeAnimation = outgoing.animate(
          [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-12px)' }],
          { duration: 160, easing: 'ease-out', fill: 'forwards' }
        );
        await activeAnimation.finished;
        if (revision !== navigationRevision) return;
        applyView();
        activeAnimation.cancel();
        activeAnimation = incoming.animate(
          [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' }
        );
        await activeAnimation.finished;
      } catch {
        // A newer navigation cancels the previous animation.
      } finally {
        if (revision === navigationRevision) {
          activeAnimation?.cancel();
          activeAnimation = null;
          switchingView = false;
        }
      }
    };
    animateView();
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
