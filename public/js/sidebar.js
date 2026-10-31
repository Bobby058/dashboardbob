

function renderSidebar() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('gf_user')) || {}; } catch { return {}; }
  })();

  const inits = (user.nama || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const html = `
  <div id="page-loader"><div class="loader-ring"></div></div>
  <div id="sidebar-overlay" class="sidebar-overlay"></div>

  <nav class="sidebar" id="sidebar">
    <a href="index.html" class="sidebar-brand">
      <div class="sidebar-brand-icon">📦</div>
      <div class="sidebar-brand-text">
        Giofans<br>
        <span class="sidebar-brand-sub">Logistik System</span>
      </div>
    </a>

    <div class="sidebar-section">
      <div class="sidebar-label">Utama</div>
      <a href="index.html" class="sidebar-link">
        <span class="icon">🏠</span> Dashboard
      </a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">Transaksi</div>
      <a href="inbound.html" class="sidebar-link">
        <span class="icon">📥</span> Inbound
      </a>
      <a href="outbound.html" class="sidebar-link">
        <span class="icon">📤</span> Outbound
      </a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">Inventori</div>
      <a href="inventory.html" class="sidebar-link">
        <span class="icon">📦</span> Data Inventory
      </a>
      <a href="inventory-alert.html" class="sidebar-link">
        <span class="icon">⚠️</span> Inventory Alert
      </a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">Laporan</div>
      <a href="histori-inbound.html" class="sidebar-link">
        <span class="icon">📋</span> Histori Inbound
      </a>
      <a href="histori-outbound.html" class="sidebar-link">
        <span class="icon">📋</span> Histori Outbound
      </a>
      <a href="histori-retur.html" class="sidebar-link">
        <span class="icon">🔄</span> Histori Retur
      </a>
    </div>

    <div class="sidebar-footer">
      <a href="profile.html" class="sidebar-user">
        <div class="sidebar-avatar">${inits}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user.nama || 'admin'}</div>
          <div class="sidebar-user-role">${user.jabatan || 'Staff Gudang'}</div>
        </div>
      </a>
    </div>
  </nav>`;

  document.body.insertAdjacentHTML('afterbegin', html);
}

// Auth guard — cek token JWT, bukan gf_logged
function authGuard() {
  if (!localStorage.getItem('gf_token')) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  if (confirm('Yakin ingin keluar?')) {
    localStorage.removeItem('gf_token');
    localStorage.removeItem('gf_logged');
    localStorage.removeItem('gf_user');
    window.location.href = 'login.html';
  }
}


document.addEventListener('DOMContentLoaded', () => {
  if (!authGuard()) return;
  document.body.style.visibility = 'visible';
  renderSidebar();
});
