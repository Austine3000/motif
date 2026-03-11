(function bootstrapStaticSiteEnhancements() {
  const yearTarget = document.querySelector('#current-year');
  if (yearTarget) {
    yearTarget.textContent = String(new Date().getFullYear());
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('[data-nav-link]');
  for (const link of navLinks) {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.setAttribute('data-active', 'true');
      link.setAttribute('aria-current', 'page');
    }
  }
})();
