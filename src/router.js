// ===== SPA Router — Hash-based =====

const routes = {};
let currentRoute = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigateTo(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return currentRoute;
}

export function initRouter() {
  function handleRoute() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    currentRoute = hash;

    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === hash);
    });

    // Update bottom nav active state
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === hash);
    });

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('show');

    // Render page
    const handler = routes[hash];
    const content = document.getElementById('page-content');
    if (handler && content) {
      content.innerHTML = '';
      content.className = 'page-content fade-in';
      handler(content);
      // Scroll to top
      content.scrollTo(0, 0);
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
