
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 200);
  }
});

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const toggleBtn = document.getElementById('sidebar-toggle');

function openSidebar() {
  sidebar?.classList.add('open');
  overlay?.classList.add('show');
}

function closeSidebar() {
  sidebar?.classList.remove('open');
  overlay?.classList.remove('show');
}

toggleBtn?.addEventListener('click', () => {
  if (sidebar?.classList.contains('open')) closeSidebar();
  else openSidebar();
});

overlay?.addEventListener('click', closeSidebar);

document.querySelectorAll('.sidebar-item-parent > .sidebar-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const item = link.parentElement;
    const submenu = item.querySelector('.sidebar-submenu');
    const isOpen = item.classList.contains('open');

    // close all
    document.querySelectorAll('.sidebar-item-parent').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.sidebar-submenu')?.classList.remove('open');
    });

    if (!isOpen) {
      item.classList.add('open');
      submenu?.classList.add('open');
    }
  });
});

// ========== ACTIVE LINK ==========
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.sidebar-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage) {
    link.classList.add('active');
    // open parent if in submenu
    const parentItem = link.closest('.sidebar-item-parent');
    if (parentItem) {
      parentItem.classList.add('open');
      parentItem.querySelector('.sidebar-submenu')?.classList.add('open');
    }
  }
});

// ========== TOPBAR TITLE ==========
const pageTitles = {
  'index.html': 'Dashboard',
  'inbound.html': 'Input Inbound',
  'outbound.html': 'Input Outbound',
  'inventory.html': 'Data Inventory',
  'inventory-alert.html': 'Inventory Alert',
  'histori-inbound.html': 'Histori Inbound',
  'histori-outbound.html': 'Histori Outbound',
  'histori-retur.html': 'Histori Retur',
  'profile.html': 'Profil Pengguna',
};
const titleEl = document.getElementById('topbar-title');
if (titleEl && pageTitles[currentPage]) {
  titleEl.textContent = pageTitles[currentPage];
}

// ========== TOAST ==========
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastIn .2s ease reverse';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// ========== TABS ==========
document.querySelectorAll('.tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = tab.dataset.tab;
    const parent = tab.closest('.tabs-wrapper') || document;

    parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(targetId)?.classList.add('active');
  });
});

// ========== FORMAT HELPERS ==========
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNumber(n) {
  return Number(n).toLocaleString('id-ID');
}

function generateId(prefix = 'TRX') {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(-2)
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
    + String(now.getHours()).padStart(2, '0')
    + String(now.getMinutes()).padStart(2, '0')
    + String(now.getSeconds()).padStart(2, '0');
  return `${prefix}-${ts}`;
}

// ========== CONFIRM DIALOG ==========
function confirmAction(message, callback) {
  if (window.confirm(message)) callback();
}
