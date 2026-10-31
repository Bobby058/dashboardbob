const BASE_URL = 'http://localhost:5001/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('gf_token');
  const res = await fetch(BASE_URL + endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem('gf_token');
    localStorage.removeItem('gf_logged');
    window.location.href = 'login.html';
    return;
  }

  return res.json();
}

const API = {
  // AUTH
  login: (data) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => apiFetch('/auth/profile'),
  updateProfile: (data) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // BARANG
  getAllBarang: () => apiFetch('/barang'),
  addBarang: (data) => apiFetch('/barang', { method: 'POST', body: JSON.stringify(data) }),
  updateBarang: (kode, data) => apiFetch('/barang/' + kode, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBarang: (kode) => apiFetch('/barang/' + kode, { method: 'DELETE' }),

  // INBOUND
  getAllInbound: () => apiFetch('/inbound'),
  addInbound: (data) => apiFetch('/inbound', { method: 'POST', body: JSON.stringify(data) }),
  deleteInbound: (id) => apiFetch('/inbound/' + id, { method: 'DELETE' }),

  // OUTBOUND
  getAllOutbound: () => apiFetch('/outbound'),
  addOutbound: (data) => apiFetch('/outbound', { method: 'POST', body: JSON.stringify(data) }),
  deleteOutbound: (id) => apiFetch('/outbound/' + id, { method: 'DELETE' }),

  // RETUR
  getAllRetur: () => apiFetch('/retur'),

  // SUMMARY (dashboard)
  getSummary: () => apiFetch('/summary'),
  getChartData: () => apiFetch('/summary/chart'),
};
