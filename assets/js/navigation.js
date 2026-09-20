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
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateSection);
    }
  }, { passive: true });
  window.addEventListener('resize', updateSection);
  window.addEventListener('hashchange', updateSection);
  updateSection();
})();
