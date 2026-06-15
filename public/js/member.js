// Member Portal JavaScript

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || user.role !== 'Member') {
  window.location.href = '/member-login.html';
}

// Get member data from user
let memberData = null;

// Load logo koperasi
async function loadMemberPortalLogo() {
  try {
    const response = await fetch('/api/koperasi/logo');
    const data = await response.json();
    
    if (data.logo) {
      const memberPortalLogo = document.getElementById('memberPortalLogo');
      const memberPortalLogoPlaceholder = document.getElementById('memberPortalLogoPlaceholder');
      
      memberPortalLogo.src = data.logo;
      memberPortalLogo.style.display = 'block';
      if (memberPortalLogoPlaceholder) memberPortalLogoPlaceholder.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading logo:', error);
  }
}

// Load logo on page load
loadMemberPortalLogo();

// Update current date
function updateMemberCurrentDate() {
  const dateElement = document.getElementById('memberDateText');
  if (!dateElement) return;
  
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const dateString = now.toLocaleDateString('id-ID', options);
  dateElement.textContent = dateString;
}

// Update date on page load
updateMemberCurrentDate();

// Update date every minute
setInterval(updateMemberCurrentDate, 60000);

// API Helper
const API = {
  async get(url) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },
  
  async post(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },
  
  async put(url, data) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
};

// Helper Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadMemberData();
  loadPage('dashboard');
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      loadPage(item.getAttribute('data-page'));
    });
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('memberData');
      window.location.href = '/member-login.html';
    }
  });
});

// Load member data
async function loadMemberData() {
  try {
    // Get member profile from API
    const response = await fetch('/api/member/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    
    memberData = await response.json();
    localStorage.setItem('memberData', JSON.stringify(memberData));
    
    // Update header
    document.getElementById('memberName').textContent = memberData.nama_lengkap || 'Member';
    
    if (memberData.foto) {
      document.getElementById('memberAvatar').innerHTML = `<img src="/uploads/${memberData.foto}" alt="Avatar">`;
    }
  } catch (error) {
    console.error('Error loading member data:', error);
    // If error, try to use cached data
    const cached = localStorage.getItem('memberData');
    if (cached) {
      memberData = JSON.parse(cached);
      document.getElementById('memberName').textContent = memberData.nama_lengkap || 'Member';
    } else {
      alert('Gagal memuat data. Silakan login kembali.');
      window.location.href = '/member-login.html';
    }
  }
}

// Load page
async function loadPage(page) {
  const content = document.getElementById('memberContent');
  content.innerHTML = '<div class="loading-member"><i data-feather="loader"></i><p>Memuat...</p></div>';
  feather.replace();
  
  try {
    switch(page) {
      case 'dashboard':
        await renderDashboard();
        break;
      case 'profil':
        await renderProfil();
        break;
      case 'simpanan':
        await renderSimpanan();
        break;
      case 'tagihan':
        await renderTagihan();
        break;
      case 'bayar-simpanan':
        await renderBayarSimpanan();
        break;
      case 'transaksi':
        await renderTransaksi();
        break;
      case 'laporan':
        await renderLaporan();
        break;
      case 'shu':
        await renderSHU();
        break;
      default:
        content.innerHTML = '<div class="empty-state"><i data-feather="alert-circle"></i><h3>Halaman tidak ditemukan</h3></div>';
    }
    feather.replace();
  } catch (error) {
    console.error('Error loading page:', error);
    content.innerHTML = '<div class="empty-state"><i data-feather="alert-circle"></i><h3>Terjadi kesalahan</h3><p>Silakan refresh halaman</p></div>';
    feather.replace();
  }
}

// Render Dashboard
async function renderDashboard() {
  if (!memberData) {
    console.error('memberData is null');
    return;
  }
  
  console.log('Loading dashboard for member:', memberData.id);
  
  try {
    // Get tagihan info for alert
    let tagihanInfo = null;
    try {
      tagihanInfo = await API.get('/api/member/tagihan-simpanan-wajib');
    } catch (e) {
      console.error('Error loading tagihan:', e);
    }
    
    // Get simpanan data with error handling
    let simpananPokok = [];
    let simpananWajib = [];
    let simpananKhusus = [];
    let simpananSukarela = [];
    let partisipasi = [];
    
    try {
      simpananPokok = await API.get('/api/simpanan/pokok');
      console.log('Simpanan Pokok loaded:', simpananPokok.length);
    } catch (e) {
      console.error('Error loading simpanan pokok:', e);
    }
    
    try {
      simpananWajib = await API.get('/api/simpanan/wajib');
      console.log('Simpanan Wajib loaded:', simpananWajib.length);
    } catch (e) {
      console.error('Error loading simpanan wajib:', e);
    }
    
    try {
      simpananKhusus = await API.get('/api/simpanan/khusus');
      console.log('Simpanan Khusus loaded:', simpananKhusus.length);
    } catch (e) {
      console.error('Error loading simpanan khusus:', e);
    }
    
    try {
      simpananSukarela = await API.get('/api/simpanan/sukarela');
      console.log('Simpanan Sukarela loaded:', simpananSukarela.length);
    } catch (e) {
      console.error('Error loading simpanan sukarela:', e);
    }
    
    try {
      partisipasi = await API.get('/api/partisipasi');
      console.log('Partisipasi loaded:', partisipasi.length);
    } catch (e) {
      console.error('Error loading partisipasi:', e);
    }
    
    // Calculate totals for this member
    const totalPokok = simpananPokok
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalWajib = simpananWajib
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalKhusus = simpananKhusus
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalSukarela = simpananSukarela
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalSimpanan = totalPokok + totalWajib + totalKhusus + totalSukarela;
    
    const totalPartisipasi = partisipasi
      .filter(p => p.anggota_id === memberData.id)
      .reduce((sum, p) => sum + p.jumlah_transaksi, 0);
    
    // Get actual SHU from database (if calculated by admin)
    const currentYear = new Date().getFullYear();
    let estimasiSHU = 0;
    let shuStatus = 'Belum Dihitung';
    
    try {
      const shuData = await API.get(`/api/shu/anggota/${currentYear}`);
      const mySHU = shuData.find(s => s.anggota_id === memberData.id);
      
      if (mySHU) {
        estimasiSHU = mySHU.total_shu || 0;
        shuStatus = 'Sudah Dihitung';
      }
    } catch (error) {
      console.log('SHU belum dihitung untuk tahun ini');
    }
    
    console.log('Totals calculated:', { totalSimpanan, totalPartisipasi, estimasiSHU, shuStatus });
  
  // Get pengumuman aktif
  let pengumumanAktif = [];
  try {
    pengumumanAktif = await API.get('/api/pengumuman/aktif');
  } catch (error) {
    console.log('No active pengumuman');
  }
  
  const content = document.getElementById('memberContent');
  content.innerHTML = `
    ${pengumumanAktif.length > 0 ? `
    <div class="banner-slider" id="bannerSlider">
      <div class="banner-slides">
        ${pengumumanAktif.map((item, index) => {
          const showOverlay = item.tampilkan_judul || item.tampilkan_konten;
          return `
          <div class="banner-slide ${index === 0 ? 'active' : ''}">
            <div style="position: relative; display: inline-block; width: 100%;">
              <img src="/uploads/${item.gambar}" alt="${item.judul || 'Pengumuman'}" class="banner-image">
              ${showOverlay ? `
              <div class="banner-overlay">
                ${item.tampilkan_judul && item.judul ? `<h3>${item.judul}</h3>` : ''}
                ${item.tampilkan_konten && item.konten ? `<p>${item.konten}</p>` : ''}
              </div>
              ` : ''}
            </div>
          </div>
          `;
        }).join('')}
      </div>
      ${pengumumanAktif.length > 1 ? `
      <button class="banner-prev" onclick="changeBannerSlide(-1)">❮</button>
      <button class="banner-next" onclick="changeBannerSlide(1)">❯</button>
      <div class="banner-dots">
        ${pengumumanAktif.map((_, index) => `
          <span class="banner-dot ${index === 0 ? 'active' : ''}" onclick="currentBannerSlide(${index})"></span>
        `).join('')}
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
      <i data-feather="home" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
      Dashboard Saya
    </h2>
    
    ${tagihanInfo && tagihanInfo.ringkasan.sisa_tagihan > 0 ? `
    <div style="background:#FFEBEE; border:1px solid #FFCDD2; border-radius:10px; padding:14px 18px; margin-bottom:20px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
      <i data-feather="alert-circle" style="color:#d32f2f; flex-shrink:0;"></i>
      <div style="flex:1; min-width:200px;">
        <strong style="color:#d32f2f;">Tunggakan Simpanan Wajib</strong>
        <div style="font-size:13px; color:#666; margin-top:2px;">
          ${tagihanInfo.ringkasan.bulan_belum_bayar} bulan belum terbayar · 
          Total: <strong>${new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(tagihanInfo.ringkasan.sisa_tagihan)}</strong>
        </div>
      </div>
      <button onclick="loadPage('tagihan')" 
        style="background:#d32f2f; color:#fff; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:13px; white-space:nowrap;">
        Lihat Tagihan
      </button>
    </div>
    ` : ''}
    
    <div class="dashboard-grid">
      <div class="stat-card-member success">
        <div class="stat-header">
          <div class="stat-icon">
            <i data-feather="dollar-sign"></i>
          </div>
        </div>
        <div class="stat-body">
          <h3>Total Simpanan</h3>
          <div class="stat-value">${formatCurrency(totalSimpanan)}</div>
          <div class="stat-label">Semua Jenis Simpanan</div>
        </div>
      </div>
      
      <div class="stat-card-member warning">
        <div class="stat-header">
          <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #FFA500);">
            <i data-feather="trending-up"></i>
          </div>
        </div>
        <div class="stat-body">
          <h3>Total Partisipasi</h3>
          <div class="stat-value">${formatCurrency(totalPartisipasi)}</div>
          <div class="stat-label">Transaksi dengan Koperasi</div>
        </div>
      </div>
      
      <div class="stat-card-member">
        <div class="stat-header">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4ECDC4, #44A08D);">
            <i data-feather="gift"></i>
          </div>
        </div>
        <div class="stat-body">
          <h3>${shuStatus === 'Sudah Dihitung' ? 'SHU' : 'Estimasi SHU'} ${currentYear}</h3>
          <div class="stat-value">${formatCurrency(estimasiSHU)}</div>
          <div class="stat-label">${shuStatus === 'Sudah Dihitung' ? 'Sudah Dihitung' : 'Belum Dihitung'}</div>
        </div>
      </div>
      
      <div class="stat-card-member danger">
        <div class="stat-header">
          <div class="stat-icon" style="background: linear-gradient(135deg, #FF6B6B, #EE5A6F);">
            <i data-feather="calendar"></i>
          </div>
        </div>
        <div class="stat-body">
          <h3>Masa Keanggotaan</h3>
          <div class="stat-value">${calculateMembership(memberData.tanggal_bergabung)}</div>
          <div class="stat-label">Sejak ${formatDate(memberData.tanggal_bergabung)}</div>
        </div>
      </div>
    </div>
    
    <div class="chart-container-member">
      <h3><i data-feather="pie-chart"></i> Komposisi Simpanan Saya</h3>
      <canvas id="simpananChart" style="max-height: 300px;"></canvas>
    </div>
    
    <div class="simpanan-table">
      <h3><i data-feather="list"></i> Ringkasan Simpanan</h3>
      <table>
        <thead>
          <tr>
            <th>Jenis Simpanan</th>
            <th>Jumlah Transaksi</th>
            <th>Total Simpanan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Simpanan Pokok</strong></td>
            <td>${simpananPokok.filter(s => s.anggota_id === memberData.id).length} transaksi</td>
            <td><strong>${formatCurrency(totalPokok)}</strong></td>
          </tr>
          <tr>
            <td><strong>Simpanan Wajib</strong></td>
            <td>${simpananWajib.filter(s => s.anggota_id === memberData.id).length} transaksi</td>
            <td><strong>${formatCurrency(totalWajib)}</strong></td>
          </tr>
          <tr>
            <td><strong>Simpanan Khusus</strong></td>
            <td>${simpananKhusus.filter(s => s.anggota_id === memberData.id).length} transaksi</td>
            <td><strong>${formatCurrency(totalKhusus)}</strong></td>
          </tr>
          <tr>
            <td><strong>Simpanan Sukarela</strong></td>
            <td>${simpananSukarela.filter(s => s.anggota_id === memberData.id).length} transaksi</td>
            <td><strong>${formatCurrency(totalSukarela)}</strong></td>
          </tr>
          <tr style="background: var(--member-bg); font-weight: 700;">
            <td>TOTAL</td>
            <td>${simpananPokok.filter(s => s.anggota_id === memberData.id).length + 
                  simpananWajib.filter(s => s.anggota_id === memberData.id).length +
                  simpananKhusus.filter(s => s.anggota_id === memberData.id).length +
                  simpananSukarela.filter(s => s.anggota_id === memberData.id).length} transaksi</td>
            <td><strong>${formatCurrency(totalSimpanan)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  
    // Render chart
    feather.replace();
    
    const ctx = document.getElementById('simpananChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Khusus', 'Simpanan Sukarela'],
          datasets: [{
            data: [totalPokok, totalWajib, totalKhusus, totalSukarela],
            backgroundColor: ['#2E7D32', '#4CAF50', '#FFC107', '#FFD54F'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                font: {
                  size: 14
                }
              }
            }
          }
        }
      });
    }
    
    console.log('Dashboard rendered successfully');
  } catch (error) {
    console.error('Error in renderDashboard:', error);
    const content = document.getElementById('memberContent');
    content.innerHTML = `
      <div class="empty-state">
        <i data-feather="alert-circle"></i>
        <h3>Terjadi Kesalahan</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="loadPage('dashboard')">Coba Lagi</button>
      </div>
    `;
    feather.replace();
  }
}

// Render Profil
async function renderProfil() {
  if (!memberData) return;
  
  const content = document.getElementById('memberContent');
  content.innerHTML = `
    <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
      <i data-feather="user" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
      Profil Saya
    </h2>
    
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar-large">
          ${memberData.foto ? 
            `<img src="/uploads/${memberData.foto}" alt="${memberData.nama_lengkap}">` :
            `<i data-feather="user"></i>`
          }
        </div>
        <div class="profile-info">
          <h2>${memberData.nama_lengkap}</h2>
          <div class="profile-meta">
            <div class="meta-item">
              <i data-feather="hash"></i>
              <span>${memberData.nomor_anggota}</span>
            </div>
            <div class="meta-item">
              <i data-feather="calendar"></i>
              <span>Bergabung ${formatDate(memberData.tanggal_bergabung)}</span>
            </div>
            <div class="meta-item">
              <i data-feather="check-circle"></i>
              <span class="badge badge-success">${memberData.status.charAt(0).toUpperCase() + memberData.status.slice(1)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="profile-grid">
        <div>
          <div class="profile-field">
            <label>NIK</label>
            <div class="value">${memberData.nik || '-'}</div>
          </div>
          <div class="profile-field">
            <label>Tempat, Tanggal Lahir</label>
            <div class="value">${memberData.tempat_lahir || '-'}, ${formatDate(memberData.tanggal_lahir)}</div>
          </div>
          <div class="profile-field">
            <label>Jenis Kelamin</label>
            <div class="value">${memberData.jenis_kelamin || '-'}</div>
          </div>
        </div>
        
        <div>
          <div class="profile-field">
            <label>Alamat</label>
            <div class="value">${memberData.alamat || '-'}</div>
          </div>
          <div class="profile-field">
            <label>Nomor Telepon</label>
            <div class="value">${memberData.nomor_telpon || '-'}</div>
          </div>
          <div class="profile-field">
            <label>Email</label>
            <div class="value">${memberData.email || '-'}</div>
          </div>
        </div>
        
        <div>
          <div class="profile-field">
            <label>Pekerjaan</label>
            <div class="value">${memberData.pekerjaan || '-'}</div>
          </div>
          <div class="profile-field">
            <label>Status Keanggotaan</label>
            <div class="value">
              <span class="badge badge-${memberData.status === 'aktif' ? 'success' : 'danger'}">
                ${memberData.status}
              </span>
            </div>
          </div>
          <div class="profile-field">
            <label>Foto KTP</label>
            <div class="value">
              ${memberData.foto_ktp ? `
                <button class="btn btn-sm btn-info" onclick="viewFotoKTPMember('${memberData.foto_ktp}')" style="padding: 6px 12px; font-size: 12px;">
                  <i data-feather="image"></i> Lihat KTP
                </button>
              ` : '<span style="color: #999;">Belum upload</span>'}
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--member-border); display: flex; gap: 12px;">
        <button class="btn btn-primary" onclick="editProfil()">
          <i data-feather="edit"></i> Edit Profil
        </button>
        <button class="btn btn-warning" onclick="gantiPassword()">
          <i data-feather="lock"></i> Ganti Password
        </button>
      </div>
    </div>
  `;
}

// Edit Profil
window.editProfil = function() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Edit Profil</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editProfilForm">
        <div class="form-row">
          <div class="form-group">
            <label>Nama Lengkap *</label>
            <input type="text" name="nama_lengkap" value="${memberData.nama_lengkap}" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>NIK</label>
            <input type="text" name="nik" value="${memberData.nik || ''}">
          </div>
          <div class="form-group">
            <label>Jenis Kelamin</label>
            <select name="jenis_kelamin">
              <option value="">Pilih</option>
              <option value="Laki-laki" ${memberData.jenis_kelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
              <option value="Perempuan" ${memberData.jenis_kelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Tempat Lahir</label>
            <input type="text" name="tempat_lahir" value="${memberData.tempat_lahir || ''}">
          </div>
          <div class="form-group">
            <label>Tanggal Lahir</label>
            <input type="date" name="tanggal_lahir" value="${memberData.tanggal_lahir || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label>Alamat</label>
          <textarea name="alamat" rows="2">${memberData.alamat || ''}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Telepon</label>
            <input type="text" name="nomor_telpon" value="${memberData.nomor_telpon || ''}">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${memberData.email || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label>Pekerjaan</label>
          <input type="text" name="pekerjaan" value="${memberData.pekerjaan || ''}">
        </div>
        
        <div class="form-group">
          <label>Foto Profil</label>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="file" id="inputFotoMember" name="foto" accept="image/*" onchange="previewImageMember(this, 'previewFotoMember')" style="flex: 1;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openCameraMember('inputFotoMember', 'previewFotoMember')" style="white-space: nowrap;">
              <i data-feather="camera"></i> Kamera
            </button>
          </div>
          ${memberData.foto ? `<small style="color: #666;">Foto saat ini: ${memberData.foto}</small>` : ''}
          <div id="previewFotoMember" style="margin-top: 10px;"></div>
        </div>
        
        <div class="form-group">
          <label>Foto KTP</label>
          ${memberData.foto_ktp ? `
            <div style="margin-bottom: 10px;">
              <button type="button" class="btn btn-sm btn-info" onclick="viewFotoKTPMember('${memberData.foto_ktp}')">
                <i data-feather="image"></i> Lihat KTP Saat Ini
              </button>
            </div>
          ` : ''}
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="file" id="inputKTPMember" name="foto_ktp" accept="image/*,.pdf" onchange="previewImageMember(this, 'previewKTPMember')" style="flex: 1;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openCameraMember('inputKTPMember', 'previewKTPMember')" style="white-space: nowrap;">
              <i data-feather="camera"></i> Kamera
            </button>
          </div>
          <small style="color: #666; font-size: 12px;">Format: JPG, PNG, PDF. Max 5MB. Kosongkan jika tidak ingin mengubah.</small>
          <div id="previewKTPMember" style="margin-top: 10px;"></div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">
            <i data-feather="save"></i> Simpan
          </button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">
            <i data-feather="x"></i> Batal
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  document.getElementById('editProfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Profil berhasil diupdate!');
        modal.remove();
        await loadMemberData();
        renderProfil();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    }
  });
};

// Ganti Password
window.gantiPassword = function() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">Ganti Password</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="gantiPasswordForm">
        <div class="form-group">
          <label>Password Lama *</label>
          <input type="password" name="currentPassword" required minlength="6">
        </div>
        
        <div class="form-group">
          <label>Password Baru *</label>
          <input type="password" name="newPassword" required minlength="6">
          <small style="color: #666;">Minimal 6 karakter</small>
        </div>
        
        <div class="form-group">
          <label>Konfirmasi Password Baru *</label>
          <input type="password" name="confirmPassword" required minlength="6">
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">
            <i data-feather="lock"></i> Ganti Password
          </button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">
            <i data-feather="x"></i> Batal
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  document.getElementById('gantiPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi tidak sama!');
      return;
    }
    
    try {
      const response = await fetch('/api/member/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Password berhasil diubah! Silakan login kembali.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('memberData');
        window.location.href = '/member-login.html';
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    }
  });
};

// Calculate membership duration
function calculateMembership(tanggalBergabung) {
  if (!tanggalBergabung) return '-';
  
  const start = new Date(tanggalBergabung);
  const now = new Date();
  const diff = now - start;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  
  if (years > 0) {
    return `${years} tahun`;
  } else if (months > 0) {
    return `${months} bulan`;
  } else {
    return '< 1 bulan';
  }
}

// Render Laporan Keuangan
async function renderLaporan() {
  const content = document.getElementById('memberContent');
  
  // Set default periode
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  content.innerHTML = `
    <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
      <i data-feather="bar-chart-2" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
      Laporan Keuangan Koperasi
    </h2>
    
    <div style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); padding: 24px; border-radius: 16px; color: white; margin-bottom: 32px; box-shadow: 0 8px 24px rgba(46, 125, 50, 0.3);">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
        <i data-feather="info" style="width: 24px; height: 24px;"></i>
        <h3 style="font-size: 18px; margin: 0;">Transparansi Keuangan</h3>
      </div>
      <p style="opacity: 0.95; margin: 0; line-height: 1.6;">
        Laporan keuangan koperasi untuk transparansi kepada seluruh anggota.
        Gunakan filter periode untuk melihat data berdasarkan waktu tertentu.
      </p>
    </div>
    
    <!-- Filter Periode -->
    <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h3 style="margin-bottom: 16px; color: var(--member-text);">
        <i data-feather="filter"></i> Filter Periode
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--member-text);">Periode</label>
          <select id="periodeLaporanMember" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
            <option value="harian">Harian</option>
            <option value="bulanan">Bulanan</option>
            <option value="tahunan">Tahunan</option>
            <option value="seluruh" selected>Seluruh Tahun</option>
          </select>
        </div>
        <div id="tahunGroupMember">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--member-text);">Tahun</label>
          <select id="tahunLaporanMember" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
            ${Array.from({length: 10}, (_, i) => currentYear + 5 - i).map(y => `
              <option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>
            `).join('')}
          </select>
        </div>
        <div id="bulanGroupMember" style="display: none;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--member-text);">Bulan</label>
          <select id="bulanLaporanMember" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Juni</option>
            <option value="07">Juli</option>
            <option value="08">Agustus</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
        <div id="tanggalGroupMember" style="display: none;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--member-text);">Tanggal</label>
          <input type="date" id="tanggalLaporanMember" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button onclick="window.updateLaporanMember()" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
            <i data-feather="refresh-cw" style="width: 16px; height: 16px;"></i> Tampilkan
          </button>
        </div>
      </div>
    </div>
    
    <!-- Content Area -->
    <div id="laporanContentMember"></div>
  `;
  
  feather.replace();
  
  // Set default bulan
  document.getElementById('bulanLaporanMember').value = currentMonth;
  
  // Event listener untuk periode change
  document.getElementById('periodeLaporanMember').addEventListener('change', (e) => {
    const periode = e.target.value;
    const bulanGroup = document.getElementById('bulanGroupMember');
    const tanggalGroup = document.getElementById('tanggalGroupMember');
    const tahunGroup = document.getElementById('tahunGroupMember');
    
    if (periode === 'harian') {
      if (tahunGroup) tahunGroup.style.display = 'block';
      if (bulanGroup) bulanGroup.style.display = 'none';
      if (tanggalGroup) tanggalGroup.style.display = 'block';
    } else if (periode === 'bulanan') {
      if (tahunGroup) tahunGroup.style.display = 'block';
      if (bulanGroup) bulanGroup.style.display = 'block';
      if (tanggalGroup) tanggalGroup.style.display = 'none';
    } else if (periode === 'tahunan') {
      if (tahunGroup) tahunGroup.style.display = 'block';
      if (bulanGroup) bulanGroup.style.display = 'none';
      if (tanggalGroup) tanggalGroup.style.display = 'none';
    } else if (periode === 'seluruh') {
      if (tahunGroup) tahunGroup.style.display = 'none';
      if (bulanGroup) bulanGroup.style.display = 'none';
      if (tanggalGroup) tanggalGroup.style.display = 'none';
    }
  });
  
  // Load data pertama kali dengan periode default (seluruh)
  await updateLaporanMember();
}

// Function untuk update laporan berdasarkan filter
window.updateLaporanMember = async function() {
  const laporanContent = document.getElementById('laporanContentMember');
  const periode = document.getElementById('periodeLaporanMember').value;
  const tahun = document.getElementById('tahunLaporanMember').value;
  const bulan = document.getElementById('bulanLaporanMember').value;
  const tanggal = document.getElementById('tanggalLaporanMember').value;
  
  laporanContent.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading"></div><p>Memuat data...</p></div>';
  
  try {
    // Get all financial data
    const anggota = await API.get('/api/anggota');
    const simpananPokok = await API.get('/api/simpanan/pokok');
    const simpananWajib = await API.get('/api/simpanan/wajib');
    const simpananKhusus = await API.get('/api/simpanan/khusus');
    const simpananSukarela = await API.get('/api/simpanan/sukarela');
    const penjualan = await API.get('/api/transaksi/penjualan');
    const pengeluaran = await API.get('/api/transaksi/pengeluaran');
    const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
    
    // Filter data berdasarkan periode
    let filteredPenjualan = penjualan;
    let filteredPengeluaran = pengeluaran;
    let filteredPendapatanLain = pendapatanLain;
    
    let periodeText = 'Seluruh Data';
    
    if (periode === 'harian' && tanggal) {
      filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi === tanggal);
      filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi === tanggal);
      filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi === tanggal);
      
      const date = new Date(tanggal);
      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      periodeText = `${date.getDate()} ${namaBulan[date.getMonth()]} ${date.getFullYear()}`;
    } else if (periode === 'bulanan' && bulan) {
      const monthPrefix = `${tahun}-${bulan}`;
      filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(monthPrefix));
      filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(monthPrefix));
      filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(monthPrefix));
      
      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      periodeText = `${namaBulan[parseInt(bulan) - 1]} ${tahun}`;
    } else if (periode === 'tahunan') {
      filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
      filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
      filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
      
      periodeText = `Tahun ${tahun}`;
    } else if (periode === 'seluruh') {
      // Semua data tanpa filter
      periodeText = 'Seluruh Data';
    }
    
    // Calculate totals
    const totalAnggota = anggota.filter(a => a.status === 'aktif').length;
    
    const totalSimpanan = 
      simpananPokok.reduce((sum, s) => sum + s.jumlah, 0) +
      simpananWajib.reduce((sum, s) => sum + s.jumlah, 0) +
      simpananKhusus.reduce((sum, s) => sum + s.jumlah, 0) +
      simpananSukarela.reduce((sum, s) => sum + s.jumlah, 0);
    
    const totalPenjualan = filteredPenjualan.reduce((sum, p) => sum + (p.jumlah_penjualan || 0), 0);
    const totalHPP = filteredPenjualan.reduce((sum, p) => sum + (p.hpp || 0), 0);
    const totalPendapatanLain = filteredPendapatanLain.reduce((sum, p) => sum + (p.jumlah || 0), 0);
    
    // Formula Laba/Rugi (dengan Pendapatan Lain)
    const totalPendapatan = totalPenjualan + totalPendapatanLain;
    const labaKotor = totalPendapatan - totalHPP;
    
    // Perhitungan untuk Neraca
    const totalSimpananPokok = simpananPokok.reduce((sum, s) => sum + (s.jumlah || 0), 0);
    const totalSimpananWajib = simpananWajib.reduce((sum, s) => sum + (s.jumlah || 0), 0);
    const totalSimpananKhusus = simpananKhusus.reduce((sum, s) => sum + (s.jumlah || 0), 0);
    const totalSimpananSukarela = simpananSukarela.reduce((sum, s) => sum + (s.jumlah || 0), 0);
    
    // Hitung Pembelian Barang dan Pembelian Aset dari Pengeluaran
    const pembelianBarang = filteredPengeluaran
      .filter(p => p.kategori === 'Pembelian Barang')
      .reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
    
    const pengeluaranAset = filteredPengeluaran
      .filter(p => p.kategori === 'Pembelian Aset & Inventaris' || p.kategori === 'Pembelian Aset');
    
    const pembelianAset = pengeluaranAset
      .reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
    
    // Hitung Penjualan Barang dan Penjualan Aset
    const penjualanBarang = filteredPenjualan
      .filter(p => p.kategori === 'Barang' || !p.kategori)
      .reduce((sum, item) => sum + parseFloat(item.jumlah_penjualan || 0), 0);
    
    const hppBarang = filteredPenjualan
      .filter(p => p.kategori === 'Barang' || !p.kategori)
      .reduce((sum, item) => sum + parseFloat(item.hpp || 0), 0);
    
    const penjualanAset = filteredPenjualan
      .filter(p => p.kategori === 'Aset')
      .reduce((sum, item) => sum + parseFloat(item.jumlah_penjualan || 0), 0);
    
    // AKTIVA
    const persediaan = pembelianBarang - hppBarang;
    const aktivaTetap = pembelianAset - penjualanAset;
    
    const biayaOperasional = filteredPengeluaran
      .filter(p => p.kategori !== 'Pembelian Barang' && p.kategori !== 'Pembelian Aset & Inventaris' && p.kategori !== 'Pembelian Aset')
      .reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
    
    const totalPengeluaran = biayaOperasional; // Untuk tampilan stat card
    const labaBersih = labaKotor - biayaOperasional;
    
    // PASIVA - hitung cadangan dulu
    let cadangan = 0; // Simplified for member portal
    const shuTahunBerjalan = labaBersih;
    
    // Kas & Bank = Total Simpanan + Laba Bersih + Cadangan - Persediaan - Aktiva Tetap
    const kasBank = totalSimpanan + labaBersih + cadangan - persediaan - aktivaTetap;
    const totalAktiva = kasBank + persediaan + aktivaTetap;
    
    const totalPasiva = totalSimpananPokok + totalSimpananWajib + totalSimpananKhusus + totalSimpananSukarela + cadangan + shuTahunBerjalan;
    
    laporanContent.innerHTML = `
      <!-- Periode Info -->
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 16px 24px; border-radius: 12px; color: white; margin-bottom: 24px; text-align: center;">
        <h3 style="margin: 0; font-size: 18px;">
          <i data-feather="calendar"></i> Periode: <strong>${periodeText}</strong>
        </h3>
      </div>
      
      <div class="dashboard-grid" style="margin-bottom: 32px;">
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <i data-feather="users"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Anggota Aktif</h3>
            <div class="stat-value">${totalAnggota}</div>
            <div class="stat-label">Anggota Terdaftar</div>
          </div>
        </div>
        
        <div class="stat-card-member success">
          <div class="stat-header">
            <div class="stat-icon">
              <i data-feather="dollar-sign"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Simpanan</h3>
            <div class="stat-value">${formatCurrency(totalSimpanan)}</div>
            <div class="stat-label">Semua Jenis Simpanan</div>
          </div>
        </div>
        
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4ECDC4, #44A08D);">
              <i data-feather="dollar-sign"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Pendapatan</h3>
            <div class="stat-value">${formatCurrency(totalPendapatan)}</div>
            <div class="stat-label">${periodeText}</div>
          </div>
        </div>
        
        <div class="stat-card-member danger">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #FF6B6B, #EE5A6F);">
              <i data-feather="trending-down"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Biaya Operasional</h3>
            <div class="stat-value">${formatCurrency(biayaOperasional)}</div>
            <div class="stat-label">${periodeText}</div>
          </div>
        </div>
      </div>
      
      <div style="background: ${labaBersih >= 0 ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'linear-gradient(135deg, #eb3349, #f45c43)'}; padding: 32px; border-radius: 16px; color: white; margin-bottom: 32px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
          <div>
            <h3 style="font-size: 16px; margin-bottom: 8px; opacity: 0.9;">
              ${labaBersih >= 0 ? '💰 SHU/Laba Bersih' : '📉 Rugi'}
            </h3>
            <div style="font-size: 42px; font-weight: 700;">${formatCurrency(Math.abs(labaBersih))}</div>
            <p style="opacity: 0.9; margin: 8px 0 0 0; font-size: 14px;">
              Laba Kotor: ${formatCurrency(labaKotor)} - Biaya Operasional: ${formatCurrency(biayaOperasional)}
            </p>
            <p style="opacity: 0.8; margin: 4px 0 0 0; font-size: 12px;">
              Periode: ${periodeText}
            </p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 64px; opacity: 0.3;">
              ${labaBersih >= 0 ? '📈' : '📉'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="simpanan-table" style="margin-bottom: 24px;">
        <h3><i data-feather="pie-chart"></i> Rincian Simpanan</h3>
        <table>
          <thead>
            <tr>
              <th>Jenis Simpanan</th>
              <th>Jumlah Transaksi</th>
              <th>Total Nominal</th>
              <th>Persentase</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Simpanan Pokok</strong></td>
              <td>${simpananPokok.length} transaksi</td>
              <td>${formatCurrency(totalSimpananPokok)}</td>
              <td>${totalSimpanan > 0 ? ((totalSimpananPokok / totalSimpanan) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Simpanan Wajib</strong></td>
              <td>${simpananWajib.length} transaksi</td>
              <td>${formatCurrency(totalSimpananWajib)}</td>
              <td>${totalSimpanan > 0 ? ((totalSimpananWajib / totalSimpanan) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Simpanan Khusus</strong></td>
              <td>${simpananKhusus.length} transaksi</td>
              <td>${formatCurrency(totalSimpananKhusus)}</td>
              <td>${totalSimpanan > 0 ? ((totalSimpananKhusus / totalSimpanan) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Simpanan Sukarela</strong></td>
              <td>${simpananSukarela.length} transaksi</td>
              <td>${formatCurrency(totalSimpananSukarela)}</td>
              <td>${totalSimpanan > 0 ? ((totalSimpananSukarela / totalSimpanan) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr style="background: var(--member-bg); font-weight: 700;">
              <td>TOTAL</td>
              <td>${simpananPokok.length + simpananWajib.length + simpananKhusus.length + simpananSukarela.length} transaksi</td>
              <td><strong>${formatCurrency(totalSimpanan)}</strong></td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="simpanan-table" style="margin-bottom: 24px;">
        <h3><i data-feather="trending-up"></i> Laporan Laba Rugi</h3>
        <table>
          <thead>
            <tr>
              <th>Keterangan</th>
              <th style="text-align: right;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #e8f5e9;">
              <td><strong>PENDAPATAN</strong></td>
              <td></td>
            </tr>
            <tr>
              <td style="padding-left: 24px;">Penjualan</td>
              <td style="text-align: right;">${formatCurrency(totalPenjualan)}</td>
            </tr>
            <tr>
              <td style="padding-left: 24px;">Pendapatan Lain</td>
              <td style="text-align: right;">${formatCurrency(totalPendapatanLain)}</td>
            </tr>
            <tr style="background: #e3f2fd;">
              <td><strong>Total Pendapatan</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(totalPendapatan)}</strong></td>
            </tr>
            <tr style="background: #ffebee;">
              <td><strong>HARGA POKOK PENJUALAN (HPP)</strong></td>
              <td></td>
            </tr>
            <tr>
              <td style="padding-left: 24px;">HPP</td>
              <td style="text-align: right; color: #d32f2f;">(${formatCurrency(totalHPP)})</td>
            </tr>
            <tr style="background: #fff3e0;">
              <td><strong>LABA KOTOR</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(labaKotor)}</strong></td>
            </tr>
            <tr style="background: #ffebee;">
              <td><strong>PENGELUARAN</strong></td>
              <td></td>
            </tr>
            <tr>
              <td style="padding-left: 24px;">Biaya Operasional</td>
              <td style="text-align: right; color: #d32f2f;">(${formatCurrency(biayaOperasional)})</td>
            </tr>
            <tr style="background: ${labaBersih >= 0 ? '#e8f5e9' : '#ffebee'}; font-weight: 700; font-size: 16px;">
              <td><strong>${labaBersih >= 0 ? 'SHU TAHUN BERJALAN' : 'RUGI TAHUN BERJALAN'}</strong></td>
              <td style="text-align: right; color: ${labaBersih >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>${formatCurrency(Math.abs(labaBersih))}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="simpanan-table" style="margin-bottom: 24px;">
        <h3><i data-feather="briefcase"></i> Neraca</h3>
        <p style="text-align: center; color: #666; margin-bottom: 20px; font-size: 14px;">
          Per ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h4 style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 12px; border-radius: 8px; margin: 0 0 12px 0; text-align: center;">
              <i data-feather="trending-up" style="width: 18px; height: 18px;"></i> AKTIVA
            </h4>
            <table>
              <tbody>
                <tr>
                  <td>Kas & Bank</td>
                  <td style="text-align: right;">${formatCurrency(kasBank)}</td>
                </tr>
                <tr>
                  <td>Persediaan</td>
                  <td style="text-align: right;">${formatCurrency(persediaan)}</td>
                </tr>
                <tr>
                  <td>Aktiva Tetap</td>
                  <td style="text-align: right;">${formatCurrency(aktivaTetap)}</td>
                </tr>
                <tr style="background: #e8f5e9; font-weight: 700; font-size: 16px;">
                  <td><strong>TOTAL AKTIVA</strong></td>
                  <td style="text-align: right;"><strong>${formatCurrency(totalAktiva)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px; border-radius: 8px; margin: 0 0 12px 0; text-align: center;">
              <i data-feather="pie-chart" style="width: 18px; height: 18px;"></i> PASIVA
            </h4>
            <table>
              <tbody>
                <tr>
                  <td>Simpanan Pokok</td>
                  <td style="text-align: right;">${formatCurrency(totalSimpananPokok)}</td>
                </tr>
                <tr>
                  <td>Simpanan Wajib</td>
                  <td style="text-align: right;">${formatCurrency(totalSimpananWajib)}</td>
                </tr>
                <tr>
                  <td>Simpanan Khusus</td>
                  <td style="text-align: right;">${formatCurrency(totalSimpananKhusus)}</td>
                </tr>
                <tr>
                  <td>Simpanan Sukarela</td>
                  <td style="text-align: right;">${formatCurrency(totalSimpananSukarela)}</td>
                </tr>
                <tr>
                  <td>Cadangan</td>
                  <td style="text-align: right;">${formatCurrency(cadangan)}</td>
                </tr>
                <tr>
                  <td>SHU Tahun Berjalan</td>
                  <td style="text-align: right;">${formatCurrency(shuTahunBerjalan)}</td>
                </tr>
                <tr style="background: #e8f5e9; font-weight: 700; font-size: 16px;">
                  <td><strong>TOTAL PASIVA</strong></td>
                  <td style="text-align: right;"><strong>${formatCurrency(totalPasiva)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        ${pengeluaranAset.length > 0 ? `
        <div style="margin-top: 24px;">
          <h4 style="color: var(--member-primary); margin-bottom: 12px;">
            <i data-feather="package" style="width: 18px; height: 18px;"></i>
            Detail Aset Tetap
          </h4>
          <table>
            <thead>
              <tr>
                <th>Tanggal Perolehan</th>
                <th>Nama Aset</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Nilai Perolehan</th>
                <th>Unit Usaha</th>
              </tr>
            </thead>
            <tbody>
              ${pengeluaranAset.map(item => {
                const qty = item.qty || 1;
                const harga = item.harga || (item.jumlah / qty);
                return `
                <tr>
                  <td>${formatDate(item.tanggal_transaksi)}</td>
                  <td>${item.keterangan || 'Aset Tetap'}</td>
                  <td style="text-align: center;">${qty}</td>
                  <td>${formatCurrency(harga)}</td>
                  <td><strong>${formatCurrency(item.jumlah || 0)}</strong></td>
                  <td>${item.nama_usaha || 'Umum'}</td>
                </tr>
                `;
              }).join('')}
              <tr style="background: #f8f9fa; font-weight: 700;">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td style="text-align: center;"><strong>${pengeluaranAset.reduce((sum, item) => sum + (item.qty || 1), 0)}</strong></td>
                <td></td>
                <td><strong>${formatCurrency(pembelianAset)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}
      </div>
      

    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading laporan member:', error);
    laporanContent.innerHTML = `
      <div class="empty-state">
        <i data-feather="alert-circle"></i>
        <h3>Terjadi Kesalahan</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="window.updateLaporanMember()">Coba Lagi</button>
      </div>
    `;
    feather.replace();
  }
};

// ===== RENDER TAGIHAN SIMPANAN WAJIB =====
async function renderTagihan() {
  const content = document.getElementById('memberContent');
  
  try {
    const data = await API.get('/api/member/tagihan-simpanan-wajib');
    const { anggota, ringkasan, daftar_bulan } = data;
    
    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
    
    const statusColor = ringkasan.status === 'lunas' ? '#2E7D32' : '#d32f2f';
    const statusLabel = ringkasan.status === 'lunas' ? '✅ Lunas' : '⚠️ Ada Tunggakan';
    
    // Render daftar bulan (terbaru di atas)
    const bulanRows = [...daftar_bulan].reverse().map(b => {
      const statusMap = {
        lunas: { label: 'Lunas', color: '#2E7D32', bg: '#E8F5E9' },
        kurang: { label: 'Kurang Bayar', color: '#F57C00', bg: '#FFF3E0' },
        belum_bayar: { label: 'Belum Bayar', color: '#d32f2f', bg: '#FFEBEE' }
      };
      const s = statusMap[b.status];
      return `
        <tr>
          <td>${b.label}</td>
          <td>${formatCurrency(b.tagihan)}</td>
          <td>
            <span style="background:${s.bg}; color:${s.color}; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600;">
              ${s.label}
            </span>
          </td>
        </tr>`;
    }).join('');
    
    content.innerHTML = `
      <div class="member-section">
        <h2 style="margin-bottom:20px; color:#2E7D32;">
          <i data-feather="file-minus"></i> Tagihan Simpanan Wajib
        </h2>
        
        <!-- Ringkasan -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:16px; margin-bottom:24px;">
          <div style="background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:4px solid #2E7D32;">
            <div style="font-size:12px; color:#666; margin-bottom:4px;">Iuran Per Bulan</div>
            <div style="font-size:20px; font-weight:700; color:#2E7D32;">${formatCurrency(ringkasan.simpanan_per_bulan)}</div>
          </div>
          <div style="background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:4px solid #1565C0;">
            <div style="font-size:12px; color:#666; margin-bottom:4px;">Total Tagihan</div>
            <div style="font-size:20px; font-weight:700; color:#1565C0;">${formatCurrency(ringkasan.total_tagihan)}</div>
            <div style="font-size:11px; color:#999;">${ringkasan.total_bulan} bulan sejak bergabung</div>
          </div>
          <div style="background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:4px solid #2E7D32;">
            <div style="font-size:12px; color:#666; margin-bottom:4px;">Sudah Dibayar</div>
            <div style="font-size:20px; font-weight:700; color:#2E7D32;">${formatCurrency(ringkasan.total_bayar)}</div>
            <div style="font-size:11px; color:#999;">${ringkasan.bulan_terbayar} bulan terbayar</div>
          </div>
          <div style="background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:4px solid ${statusColor};">
            <div style="font-size:12px; color:#666; margin-bottom:4px;">Sisa Tagihan</div>
            <div style="font-size:20px; font-weight:700; color:${statusColor};">${formatCurrency(ringkasan.sisa_tagihan)}</div>
            <div style="font-size:11px; color:${statusColor}; font-weight:600;">${statusLabel}</div>
          </div>
        </div>
        
        ${ringkasan.sisa_tagihan > 0 ? `
        <!-- Alert Tunggakan -->
        <div style="background:#FFEBEE; border:1px solid #FFCDD2; border-radius:10px; padding:16px; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
          <i data-feather="alert-circle" style="color:#d32f2f; flex-shrink:0;"></i>
          <div>
            <strong style="color:#d32f2f;">Anda memiliki tunggakan ${ringkasan.bulan_belum_bayar} bulan</strong>
            <div style="font-size:13px; color:#666; margin-top:4px;">
              Total tunggakan: <strong>${formatCurrency(ringkasan.sisa_tagihan)}</strong>. 
              Segera lakukan pembayaran melalui menu <strong>Bayar Simpanan</strong>.
            </div>
          </div>
          <button onclick="loadPage('bayar-simpanan')" 
            style="margin-left:auto; background:#d32f2f; color:#fff; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:13px; white-space:nowrap; flex-shrink:0;">
            Bayar Sekarang
          </button>
        </div>
        ` : `
        <!-- Lunas -->
        <div style="background:#E8F5E9; border:1px solid #C8E6C9; border-radius:10px; padding:16px; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
          <i data-feather="check-circle" style="color:#2E7D32; flex-shrink:0;"></i>
          <div>
            <strong style="color:#2E7D32;">Simpanan wajib Anda sudah lunas!</strong>
            <div style="font-size:13px; color:#666; margin-top:4px;">Terima kasih atas kepatuhan Anda dalam membayar simpanan wajib.</div>
          </div>
        </div>
        `}
        
        <!-- Tabel Detail Per Bulan -->
        <div style="background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.08); overflow:hidden;">
          <div style="padding:16px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0; font-size:15px;">Detail Tagihan Per Bulan</h3>
            <span style="font-size:12px; color:#666;">Bergabung: ${new Date(anggota.tanggal_bergabung).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</span>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:#F5F5F5;">
                  <th style="padding:12px 16px; text-align:left; font-size:13px; color:#555;">Bulan</th>
                  <th style="padding:12px 16px; text-align:left; font-size:13px; color:#555;">Tagihan</th>
                  <th style="padding:12px 16px; text-align:left; font-size:13px; color:#555;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${bulanRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    feather.replace();
    
  } catch (error) {
    console.error('Error loading tagihan:', error);
    content.innerHTML = `
      <div class="empty-state">
        <i data-feather="alert-circle"></i>
        <h3>Gagal memuat tagihan</h3>
        <p>${error.message}</p>
      </div>`;
    feather.replace();
  }
}

// Render Simpanan
async function renderSimpanan() {
  if (!memberData) return;
  
  const content = document.getElementById('memberContent');
  
  try {
    // Get member's simpanan history (including pending and rejected)
    const myHistory = await API.get('/api/simpanan/member/history');
    
    // Group by jenis_simpanan
    const myPokok = myHistory.filter(s => s.jenis_simpanan === 'pokok');
    const myWajib = myHistory.filter(s => s.jenis_simpanan === 'wajib');
    const myKhusus = myHistory.filter(s => s.jenis_simpanan === 'khusus');
    const mySukarela = myHistory.filter(s => s.jenis_simpanan === 'sukarela');
    
    // Calculate totals (only approved)
    const totalPokok = myPokok.filter(s => s.status === 'approved' || !s.status).reduce((sum, s) => sum + s.jumlah, 0);
    const totalWajib = myWajib.filter(s => s.status === 'approved' || !s.status).reduce((sum, s) => sum + s.jumlah, 0);
    const totalKhusus = myKhusus.filter(s => s.status === 'approved' || !s.status).reduce((sum, s) => sum + s.jumlah, 0);
    const totalSukarela = mySukarela.filter(s => s.status === 'approved' || !s.status).reduce((sum, s) => sum + s.jumlah, 0);
    
    content.innerHTML = `
      <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
        <i data-feather="dollar-sign" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
        Simpanan Saya
      </h2>
      
      <div class="dashboard-grid" style="margin-bottom: 32px;">
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #2E7D32, #4CAF50);">
              <i data-feather="shield"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Simpanan Pokok</h3>
            <div class="stat-value">${formatCurrency(totalPokok)}</div>
            <div class="stat-label">${myPokok.length} Transaksi</div>
          </div>
        </div>
        
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4ECDC4, #44A08D);">
              <i data-feather="calendar"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Simpanan Wajib</h3>
            <div class="stat-value">${formatCurrency(totalWajib)}</div>
            <div class="stat-label">${myWajib.length} Transaksi</div>
          </div>
        </div>
        
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #FFA500);">
              <i data-feather="star"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Simpanan Khusus</h3>
            <div class="stat-value">${formatCurrency(totalKhusus)}</div>
            <div class="stat-label">${myKhusus.length} Transaksi</div>
          </div>
        </div>
        
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <i data-feather="heart"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Simpanan Sukarela</h3>
            <div class="stat-value">${formatCurrency(totalSukarela)}</div>
            <div class="stat-label">${mySukarela.length} Transaksi</div>
          </div>
        </div>
      </div>
      
      ${renderSimpananTable('Simpanan Pokok', myPokok)}
      ${renderSimpananTable('Simpanan Wajib', myWajib)}
      ${renderSimpananTable('Simpanan Khusus', myKhusus)}
      ${renderSimpananTable('Simpanan Sukarela', mySukarela)}
    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading simpanan:', error);
    content.innerHTML = `
      <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
        <i data-feather="dollar-sign" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
        Simpanan Saya
      </h2>
      <div class="empty-state">
        <i data-feather="alert-circle"></i>
        <h3>Terjadi Kesalahan</h3>
        <p>${error.message}</p>
      </div>
    `;
    feather.replace();
  }
}

// Helper function to render simpanan table
function renderSimpananTable(title, data) {
  if (data.length === 0) return '';
  
  const totalApproved = data.filter(s => s.status === 'approved' || !s.status).reduce((sum, s) => sum + s.jumlah, 0);
  
  return `
    <div class="simpanan-table" style="margin-bottom: 24px;">
      <h3><i data-feather="list"></i> ${title}</h3>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Jumlah</th>
            <th>Metode</th>
            <th>Status</th>
            <th>Keterangan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(s => {
            const statusBadge = s.status === 'pending' 
              ? '<span class="badge badge-warning">Pending</span>'
              : s.status === 'rejected'
              ? '<span class="badge badge-danger">Ditolak</span>'
              : '<span class="badge badge-success">Disetujui</span>';
            
            const keterangan = s.status === 'rejected' && s.rejection_reason
              ? `<div>${s.keterangan || '-'}</div><div style="color: #d32f2f; font-size: 12px; margin-top: 4px;"><strong>Alasan Ditolak:</strong> ${s.rejection_reason}</div>`
              : (s.keterangan || '-');
            
            const downloadButton = (s.status === 'approved' || !s.status) 
              ? `<button class="btn btn-sm btn-success" onclick="downloadStrukSimpanan('${s.id}', '${title}', '${s.tanggal_transaksi}', '${s.jumlah}', '${s.metode_pembayaran || 'Tunai'}')" title="Download Struk">
                   <i data-feather="download"></i>
                 </button>`
              : '<span style="color: #999; font-size: 12px;">-</span>';
            
            return `
              <tr style="${s.status === 'rejected' ? 'background: #ffebee;' : ''}">
                <td>${formatDate(s.tanggal_transaksi)}</td>
                <td><strong>${formatCurrency(s.jumlah)}</strong></td>
                <td>${s.metode_pembayaran || '-'}</td>
                <td>${statusBadge}</td>
                <td>${keterangan}</td>
                <td style="text-align: center;">${downloadButton}</td>
              </tr>
            `;
          }).join('')}
          <tr style="background: var(--member-bg); font-weight: 700;">
            <td colspan="3">TOTAL DISETUJUI</td>
            <td colspan="3"><strong>${formatCurrency(totalApproved)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// Render Transaksi
async function renderTransaksi() {
  if (!memberData) return;
  
  const content = document.getElementById('memberContent');
  
  try {
    // Get all transaction data
    const simpananPokok = await API.get('/api/simpanan/pokok');
    const simpananWajib = await API.get('/api/simpanan/wajib');
    const simpananKhusus = await API.get('/api/simpanan/khusus');
    const simpananSukarela = await API.get('/api/simpanan/sukarela');
    const partisipasi = await API.get('/api/partisipasi');
    
    // Combine all transactions
    const allTransactions = [
      ...simpananPokok.filter(s => s.anggota_id === memberData.id).map(s => ({
        ...s,
        jenis: 'Simpanan Pokok',
        type: 'simpanan'
      })),
      ...simpananWajib.filter(s => s.anggota_id === memberData.id).map(s => ({
        ...s,
        jenis: 'Simpanan Wajib',
        type: 'simpanan'
      })),
      ...simpananKhusus.filter(s => s.anggota_id === memberData.id).map(s => ({
        ...s,
        jenis: 'Simpanan Khusus',
        type: 'simpanan'
      })),
      ...simpananSukarela.filter(s => s.anggota_id === memberData.id).map(s => ({
        ...s,
        jenis: 'Simpanan Sukarela',
        type: 'simpanan'
      })),
      ...partisipasi.filter(p => p.anggota_id === memberData.id).map(p => ({
        ...p,
        jenis: 'Partisipasi',
        type: 'partisipasi',
        jumlah: p.jumlah_transaksi
      }))
    ];
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.tanggal_transaksi) - new Date(a.tanggal_transaksi));
    
    const totalSimpanan = allTransactions
      .filter(t => t.type === 'simpanan')
      .reduce((sum, t) => sum + t.jumlah, 0);
      
    const totalPartisipasi = allTransactions
      .filter(t => t.type === 'partisipasi')
      .reduce((sum, t) => sum + t.jumlah, 0);
    
    content.innerHTML = `
      <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
        <i data-feather="file-text" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
        Riwayat Transaksi
      </h2>
      
      <div class="dashboard-grid" style="margin-bottom: 32px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
        <div class="stat-card-member success">
          <div class="stat-header">
            <div class="stat-icon">
              <i data-feather="trending-up"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Transaksi</h3>
            <div class="stat-value">${allTransactions.length}</div>
            <div class="stat-label">Semua Jenis Transaksi</div>
          </div>
        </div>
        
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #2E7D32, #4CAF50);">
              <i data-feather="dollar-sign"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Simpanan</h3>
            <div class="stat-value">${formatCurrency(totalSimpanan)}</div>
            <div class="stat-label">Akumulasi Simpanan</div>
          </div>
        </div>
        
        <div class="stat-card-member warning">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #FFA500);">
              <i data-feather="shopping-cart"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Partisipasi</h3>
            <div class="stat-value">${formatCurrency(totalPartisipasi)}</div>
            <div class="stat-label">Transaksi dengan Koperasi</div>
          </div>
        </div>
      </div>
      
      <div class="simpanan-table">
        <h3><i data-feather="list"></i> Semua Transaksi</h3>
        ${allTransactions.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis Transaksi</th>
                <th>Jumlah</th>
                <th>Metode</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${allTransactions.map(t => {
                const downloadButton = (t.type === 'simpanan' && (t.status === 'approved' || !t.status))
                  ? `<button class="btn btn-sm btn-success" onclick="downloadStrukSimpanan('${t.id}', '${t.jenis}', '${t.tanggal_transaksi}', '${t.jumlah}', '${t.metode_pembayaran || 'Tunai'}')" title="Download Struk">
                       <i data-feather="download"></i>
                     </button>`
                  : '<span style="color: #999; font-size: 12px;">-</span>';
                
                return `
                  <tr>
                    <td>${formatDate(t.tanggal_transaksi)}</td>
                    <td>
                      <span class="badge badge-${t.type === 'simpanan' ? 'success' : 'warning'}">
                        ${t.jenis}
                      </span>
                    </td>
                    <td><strong>${formatCurrency(t.jumlah)}</strong></td>
                    <td>${t.metode_pembayaran || '-'}</td>
                    <td>${t.keterangan || '-'}</td>
                    <td style="text-align: center;">${downloadButton}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <i data-feather="inbox"></i>
            <h3>Belum Ada Transaksi</h3>
            <p>Riwayat transaksi Anda akan muncul di sini</p>
          </div>
        `}
      </div>
    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading transaksi:', error);
    content.innerHTML = `
      <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
        <i data-feather="file-text" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
        Riwayat Transaksi
      </h2>
      <div class="empty-state">
        <i data-feather="alert-circle"></i>
        <h3>Terjadi Kesalahan</h3>
        <p>${error.message}</p>
      </div>
    `;
    feather.replace();
  }
}

// Render SHU
async function renderSHU() {
  if (!memberData) return;
  
  const content = document.getElementById('memberContent');
  
  try {
    // Get simpanan and partisipasi data
    const simpananPokok = await API.get('/api/simpanan/pokok');
    const simpananWajib = await API.get('/api/simpanan/wajib');
    const simpananKhusus = await API.get('/api/simpanan/khusus');
    const simpananSukarela = await API.get('/api/simpanan/sukarela');
    const partisipasi = await API.get('/api/partisipasi');
    
    // Calculate member's totals
    const totalPokok = simpananPokok
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalWajib = simpananWajib
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalKhusus = simpananKhusus
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalSukarela = simpananSukarela
      .filter(s => s.anggota_id === memberData.id)
      .reduce((sum, s) => sum + s.jumlah, 0);
      
    const totalSimpanan = totalPokok + totalWajib + totalKhusus + totalSukarela;
    
    // Calculate partisipasi based on selected mode
    const selectedYear = window.selectedSHUYear || new Date().getFullYear();
    const selectedMode = window.selectedSHUMode || 'seluruh'; // 'seluruh' atau 'tahunan'
    
    let totalPartisipasi, totalPartisipasiSemua;
    
    if (selectedMode === 'seluruh') {
      // Partisipasi dari seluruh tahun
      totalPartisipasi = partisipasi
        .filter(p => p.anggota_id === memberData.id)
        .reduce((sum, p) => sum + p.jumlah_transaksi, 0);
      
      totalPartisipasiSemua = partisipasi.reduce((sum, p) => sum + p.jumlah_transaksi, 0);
    } else {
      // Partisipasi dari tahun tertentu
      totalPartisipasi = partisipasi
        .filter(p => p.anggota_id === memberData.id && new Date(p.tanggal_transaksi).getFullYear() == selectedYear)
        .reduce((sum, p) => sum + p.jumlah_transaksi, 0);
      
      totalPartisipasiSemua = partisipasi
        .filter(p => new Date(p.tanggal_transaksi).getFullYear() == selectedYear)
        .reduce((sum, p) => sum + p.jumlah_transaksi, 0);
    }
    
    // Calculate total simpanan from all members
    const totalSimpananSemua = 
      simpananPokok.reduce((sum, s) => sum + s.jumlah, 0) +
      simpananWajib.reduce((sum, s) => sum + s.jumlah, 0) +
      simpananKhusus.reduce((sum, s) => sum + s.jumlah, 0) +
      simpananSukarela.reduce((sum, s) => sum + s.jumlah, 0);
    
    // Calculate percentage contribution
    const persenSimpanan = totalSimpananSemua > 0 ? (totalSimpanan / totalSimpananSemua * 100) : 0;
    const persenPartisipasi = totalPartisipasiSemua > 0 ? (totalPartisipasi / totalPartisipasiSemua * 100) : 0;
    
    const currentYear = new Date().getFullYear();
    
    // Get actual SHU data from database (if calculated by admin)
    let shuDariSimpanan = 0;
    let shuDariPartisipasi = 0;
    let estimasiSHU = 0;
    let shuStatus = 'Belum Dihitung';
    
    try {
      const shuData = await API.get(`/api/shu/anggota/${selectedYear}`);
      const mySHU = shuData.find(s => s.anggota_id === memberData.id);
      
      if (mySHU) {
        // Use actual calculated SHU from admin
        shuDariSimpanan = mySHU.shu_simpanan || 0;
        shuDariPartisipasi = mySHU.shu_transaksi || 0;
        estimasiSHU = mySHU.total_shu || 0;
        shuStatus = 'Sudah Dihitung';
      } else {
        // SHU belum dihitung, tampilkan pesan
        shuStatus = 'Belum Dihitung';
      }
    } catch (error) {
      // If error or not calculated yet, show status
      console.log('SHU belum dihitung untuk tahun ini');
      shuStatus = 'Belum Dihitung';
    }
    
    // Generate year options
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    
    const periodeText = selectedMode === 'seluruh' ? 'Seluruh Tahun' : `Tahun ${selectedYear}`;
    
    content.innerHTML = `
      <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
        <i data-feather="gift" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
        SHU Saya
      </h2>
      
      <!-- Filter Periode -->
      <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #555;">
              <i data-feather="calendar" style="width: 16px; height: 16px;"></i>
              Periode Perhitungan
            </label>
            <select id="shuModeSelect" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
              <option value="seluruh" ${selectedMode === 'seluruh' ? 'selected' : ''}>Seluruh Tahun (Akumulasi)</option>
              <option value="tahunan" ${selectedMode === 'tahunan' ? 'selected' : ''}>Per Tahun</option>
            </select>
          </div>
          
          <div id="yearSelectContainer" style="flex: 1; min-width: 200px; ${selectedMode === 'seluruh' ? 'display: none;' : ''}">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #555;">
              <i data-feather="calendar" style="width: 16px; height: 16px;"></i>
              Pilih Tahun
            </label>
            <select id="shuYearSelect" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
              ${years.map(y => `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
          
          <div style="display: flex; align-items: flex-end;">
            <button onclick="updateSHUPeriode()" style="padding: 10px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              <i data-feather="refresh-cw" style="width: 16px; height: 16px;"></i>
              Update
            </button>
          </div>
        </div>
        
        <div style="margin-top: 16px; padding: 12px; background: #f0f7ff; border-radius: 8px; font-size: 14px; color: #1976d2;">
          <i data-feather="info" style="width: 16px; height: 16px;"></i>
          <strong>Periode Aktif:</strong> ${periodeText}
          ${selectedMode === 'seluruh' ? ' - Menampilkan akumulasi dari semua data historis' : ''}
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 16px; color: white; margin-bottom: 32px; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);">
        <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 16px;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <i data-feather="gift" style="width: 32px; height: 32px;"></i>
          </div>
          <div>
            <h3 style="font-size: 18px; margin-bottom: 8px; opacity: 0.9;">
              ${shuStatus === 'Sudah Dihitung' ? 'SHU' : 'Estimasi SHU'} ${periodeText}
            </h3>
            <div style="font-size: 42px; font-weight: 700;">${formatCurrency(estimasiSHU)}</div>
            <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">
              Status: <strong>${shuStatus}</strong>
            </div>
          </div>
        </div>
        <p style="opacity: 0.9; margin: 0;">
          <i data-feather="info" style="width: 16px; height: 16px;"></i>
          ${shuStatus === 'Sudah Dihitung' 
            ? `SHU sudah dihitung oleh admin berdasarkan laba bersih koperasi (${periodeText})` 
            : 'SHU belum dihitung. Hubungi admin untuk perhitungan SHU'}
        </p>
      </div>
      
      <div class="dashboard-grid" style="margin-bottom: 32px;">
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #2E7D32, #4CAF50);">
              <i data-feather="dollar-sign"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Simpanan</h3>
            <div class="stat-value">${formatCurrency(totalSimpanan)}</div>
            <div class="stat-label">${persenSimpanan.toFixed(2)}% dari total koperasi</div>
          </div>
        </div>
        
        <div class="stat-card-member warning">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #FFA500);">
              <i data-feather="shopping-cart"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>Total Partisipasi</h3>
            <div class="stat-value">${formatCurrency(totalPartisipasi)}</div>
            <div class="stat-label">${persenPartisipasi.toFixed(2)}% dari total (${periodeText})</div>
          </div>
        </div>
        
        <div class="stat-card-member success">
          <div class="stat-header">
            <div class="stat-icon">
              <i data-feather="trending-up"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>SHU dari Simpanan</h3>
            <div class="stat-value">${formatCurrency(shuDariSimpanan)}</div>
            <div class="stat-label">${shuStatus === 'Sudah Dihitung' ? 'Berdasarkan jasa simpanan' : 'Menunggu perhitungan'}</div>
          </div>
        </div>
        
        <div class="stat-card-member">
          <div class="stat-header">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4ECDC4, #44A08D);">
              <i data-feather="activity"></i>
            </div>
          </div>
          <div class="stat-body">
            <h3>SHU dari Partisipasi</h3>
            <div class="stat-value">${formatCurrency(shuDariPartisipasi)}</div>
            <div class="stat-label">${shuStatus === 'Sudah Dihitung' ? 'Berdasarkan jasa transaksi' : 'Menunggu perhitungan'}</div>
          </div>
        </div>
      </div>
      
      <div class="simpanan-table">
        <h3><i data-feather="info"></i> Tentang SHU (Sisa Hasil Usaha)</h3>
        <div style="padding: 24px; background: #f8f9fa; border-radius: 12px; line-height: 1.8;">
          <p style="margin-bottom: 16px;">
            <strong>Sisa Hasil Usaha (SHU)</strong> adalah keuntungan yang diperoleh koperasi dalam satu tahun buku yang dibagikan kepada anggota sesuai dengan kontribusi mereka.
          </p>
          
          <h4 style="margin: 24px 0 12px 0; color: var(--member-primary);">Komponen Perhitungan SHU:</h4>
          <ul style="margin-left: 24px;">
            <li><strong>Jasa Simpanan:</strong> Berdasarkan total simpanan Anda (Pokok, Wajib, Khusus, Sukarela)</li>
            <li><strong>Jasa Transaksi:</strong> Berdasarkan partisipasi Anda dalam transaksi dengan koperasi</li>
          </ul>
          
          <h4 style="margin: 24px 0 12px 0; color: var(--member-primary);">Catatan Penting:</h4>
          <ul style="margin-left: 24px;">
            <li>Angka di atas adalah <strong>estimasi</strong> berdasarkan perhitungan sederhana</li>
            <li>SHU aktual akan ditentukan dalam Rapat Anggota Tahunan (RAT)</li>
            <li>Pembagian SHU mempertimbangkan berbagai faktor termasuk keuntungan koperasi</li>
            <li>Persentase pembagian dapat berbeda setiap tahunnya</li>
          </ul>
          
          <div style="margin-top: 24px; padding: 16px; background: white; border-left: 4px solid var(--member-primary); border-radius: 8px;">
            <strong>💡 Tips Meningkatkan SHU:</strong>
            <ul style="margin: 12px 0 0 24px;">
              <li>Tingkatkan simpanan Anda secara rutin</li>
              <li>Aktif bertransaksi dengan unit usaha koperasi</li>
              <li>Ikuti program-program koperasi</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading SHU:', error);
    content.innerHTML = `
      <h2 style="font-size: 28px; color: var(--member-text); margin-bottom: 24px;">
        <i data-feather="gift" style="width: 28px; height: 28px; color: var(--member-primary);"></i>
        SHU Saya
      </h2>
      <div class="empty-state">
        <i data-feather="alert-circle"></i>
        <h3>Terjadi Kesalahan</h3>
        <p>${error.message}</p>
      </div>
    `;
    feather.replace();
  }
}


// Banner Slider Functions
let currentBannerIndex = 0;
let bannerSlideInterval;

function changeBannerSlide(direction) {
  const slides = document.querySelectorAll('.banner-slide');
  const dots = document.querySelectorAll('.banner-dot');
  
  if (slides.length === 0) return;
  
  slides[currentBannerIndex].classList.remove('active');
  dots[currentBannerIndex]?.classList.remove('active');
  
  currentBannerIndex += direction;
  
  if (currentBannerIndex >= slides.length) currentBannerIndex = 0;
  if (currentBannerIndex < 0) currentBannerIndex = slides.length - 1;
  
  slides[currentBannerIndex].classList.add('active');
  dots[currentBannerIndex]?.classList.add('active');
}

function currentBannerSlide(index) {
  const slides = document.querySelectorAll('.banner-slide');
  const dots = document.querySelectorAll('.banner-dot');
  
  if (slides.length === 0) return;
  
  slides[currentBannerIndex].classList.remove('active');
  dots[currentBannerIndex]?.classList.remove('active');
  
  currentBannerIndex = index;
  
  slides[currentBannerIndex].classList.add('active');
  dots[currentBannerIndex]?.classList.add('active');
}

function startBannerAutoSlide() {
  const slides = document.querySelectorAll('.banner-slide');
  if (slides.length > 1) {
    bannerSlideInterval = setInterval(() => {
      changeBannerSlide(1);
    }, 5000); // Auto slide setiap 5 detik
  }
}

function stopBannerAutoSlide() {
  if (bannerSlideInterval) {
    clearInterval(bannerSlideInterval);
  }
}

// Start auto slide when dashboard loads
setTimeout(() => {
  startBannerAutoSlide();
}, 1000);


// ===== BAYAR SIMPANAN PAGE =====

window.renderBayarSimpanan = async function() {
  const contentArea = document.getElementById('memberContent');
  
  contentArea.innerHTML = `
    <div class="member-card">
      <div class="member-card-header">
        <h2 class="member-card-title">
          <i data-feather="credit-card"></i>
          Bayar Simpanan
        </h2>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">
          Lakukan pembayaran simpanan dengan mudah dan aman
        </p>
      </div>
      
      <div class="member-card-body">
        <!-- Info Box -->
        <div style="background: linear-gradient(135deg, #E3F2FD, #BBDEFB); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #2196F3;">
          <div style="display: flex; align-items: start; gap: 15px;">
            <i data-feather="info" style="color: #2196F3; width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;"></i>
            <div>
              <h4 style="margin: 0 0 10px 0; color: #1976D2; font-size: 16px;">Informasi Penting</h4>
              <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
                <li>Pembayaran simpanan akan diverifikasi oleh admin dalam 1x24 jam</li>
                <li>Pastikan bukti pembayaran yang diupload jelas dan valid</li>
                <li>Anda akan menerima notifikasi setelah pembayaran disetujui</li>
                <li>Untuk pertanyaan, hubungi admin koperasi</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Payment Note Box -->
        <div style="background: linear-gradient(135deg, #E8F5E9, #C8E6C9); padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #4CAF50; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);">
          <div style="display: flex; align-items: start; gap: 15px; margin-bottom: 20px;">
            <div style="background: #4CAF50; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-feather="dollar-sign" style="color: white; width: 24px; height: 24px;"></i>
            </div>
            <div>
              <h3 style="margin: 0 0 5px 0; color: #2E7D32; font-size: 18px; font-weight: 600;">Catatan:</h3>
            </div>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0 0 8px 0; color: #2E7D32; font-size: 15px; font-weight: 600;">
              <i data-feather="check-circle" style="width: 16px; height: 16px; color: #4CAF50;"></i>
              Simpanan Pokok: <strong style="color: #1B5E20;">Rp. 100.000</strong>
            </p>
            <p style="margin: 0; color: #2E7D32; font-size: 15px; font-weight: 600;">
              <i data-feather="check-circle" style="width: 16px; height: 16px; color: #4CAF50;"></i>
              Simpanan Wajib: <strong style="color: #1B5E20;">Rp. 30.000/bulan</strong>
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="margin: 0 0 15px 0; color: #2E7D32; font-size: 16px; font-weight: 600;">
              Transfer pembayaran Anda melalui:
            </h4>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="background: linear-gradient(135deg, #F1F8E9, #DCEDC8); padding: 15px; border-radius: 8px; border-left: 4px solid #689F38;">
                <p style="margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;">Bank Koperasi NU Vibes</p>
                <p style="margin: 0; color: #2E7D32; font-size: 16px; font-weight: 700;">
                  BJB Syariah: <span style="color: #1B5E20; letter-spacing: 1px;">5430102667788</span>
                </p>
              </div>
              
              <div style="background: linear-gradient(135deg, #F1F8E9, #DCEDC8); padding: 15px; border-radius: 8px; border-left: 4px solid #689F38;">
                <p style="margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;">Bank Mandiri</p>
                <p style="margin: 0; color: #2E7D32; font-size: 16px; font-weight: 700;">
                  Mandiri: <span style="color: #1B5E20; letter-spacing: 1px;">1300028466996</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Form Bayar Simpanan -->
        <form id="bayarSimpananForm" style="max-width: 700px;">
          <div class="form-group">
            <label>Jenis Simpanan *</label>
            <select name="jenis_simpanan" id="jenisSimpananMember" required style="padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
              <option value="">Pilih Jenis Simpanan</option>
              <option value="pokok">Simpanan Pokok</option>
              <option value="wajib">Simpanan Wajib</option>
              <option value="khusus">Simpanan Khusus</option>
              <option value="sukarela">Simpanan Sukarela</option>
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Jumlah Pembayaran *</label>
              <input type="number" 
                     name="jumlah" 
                     required 
                     min="1000" 
                     step="1000"
                     placeholder="Contoh: 100000"
                     style="padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
              <small style="color: #666; font-size: 12px;">Minimal Rp 1.000</small>
            </div>
            <div class="form-group">
              <label>Tanggal Pembayaran *</label>
              <input type="date" 
                     name="tanggal_transaksi" 
                     value="${new Date().toISOString().split('T')[0]}" 
                     required
                     style="padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
            </div>
          </div>
          
          <div class="form-group">
            <label>Metode Pembayaran *</label>
            <select name="metode_pembayaran" required style="padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
              <option value="Transfer">Transfer Bank</option>
              <option value="E-Wallet">E-Wallet (GoPay, OVO, Dana, dll)</option>
              <option value="Tunai">Tunai (Setor ke Kantor)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Keterangan</label>
            <textarea name="keterangan" 
                      rows="3" 
                      placeholder="Tambahkan catatan jika diperlukan..."
                      style="padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;"></textarea>
          </div>
          
          <div class="form-group">
            <label>Bukti Pembayaran * <span style="color: #d32f2f;">(Wajib)</span></label>
            
            <!-- Tombol pilihan upload -->
            <div class="upload-buttons-container">
              <button type="button" 
                      onclick="triggerFileUpload()" 
                      class="btn btn-secondary">
                <i data-feather="upload"></i>
                <span>Pilih File</span>
              </button>
              <button type="button" 
                      onclick="triggerCameraCapture()" 
                      class="btn btn-primary">
                <i data-feather="camera"></i>
                <span>Ambil Foto</span>
              </button>
            </div>
            
            <!-- Input file (hidden) -->
            <input type="file" 
                   name="bukti_pembayaran" 
                   id="buktiBayarMember"
                   accept="image/*,.pdf" 
                   required
                   onchange="previewBuktiBayarMember(this)"
                   style="display: none;">
            
            <!-- Input camera (hidden) -->
            <input type="file" 
                   id="buktiBayarCamera"
                   accept="image/*" 
                   capture="environment"
                   onchange="handleCameraCapture(this)"
                   style="display: none;">
            
            <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
              Format: JPG, PNG, PDF. Maksimal 5MB. Upload foto/scan bukti transfer atau struk pembayaran.
            </small>
            <div id="previewBuktiBayarMember" style="margin-top: 15px;"></div>
          </div>
          
          <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
            <div style="display: flex; align-items: start; gap: 12px;">
              <i data-feather="alert-circle" style="color: #F57C00; width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;"></i>
              <p style="margin: 0; color: #E65100; font-size: 13px; line-height: 1.6;">
                <strong>Perhatian:</strong> Pastikan bukti pembayaran yang diupload jelas dan sesuai dengan jumlah yang diinput. 
                Pembayaran yang tidak sesuai akan ditolak oleh admin.
              </p>
            </div>
          </div>
          
          <div class="btn-group" style="margin-top: 25px;">
            <button type="submit" class="btn btn-primary" style="padding: 14px 32px; font-size: 15px;">
              <i data-feather="send"></i>
              <span>Kirim Pembayaran</span>
            </button>
            <button type="button" class="btn btn-secondary" onclick="renderSimpanan()" style="padding: 14px 32px; font-size: 15px;">
              <i data-feather="x"></i>
              <span>Batal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  feather.replace();
  
  // Handle form submit
  document.getElementById('bayarSimpananForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const buktiBayar = formData.get('bukti_pembayaran');
    
    if (!buktiBayar || buktiBayar.size === 0) {
      alert('Bukti pembayaran wajib diupload!');
      return;
    }
    
    // Validate file size (5MB)
    if (buktiBayar.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar! Maksimal 5MB');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-feather="loader"></i> Mengirim...';
    feather.replace();
    
    try {
      const response = await fetch('/api/simpanan/member/bayar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('✅ ' + result.message + '\n\nPembayaran Anda akan diverifikasi oleh admin dalam 1x24 jam. Terima kasih!');
        renderSimpanan(); // Redirect to simpanan page
      } else {
        alert('❌ Error: ' + result.error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        feather.replace();
      }
    } catch (error) {
      alert('❌ Terjadi kesalahan: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      feather.replace();
    }
  });
};

// Preview bukti bayar member
window.previewBuktiBayarMember = function(input) {
  const file = input.files[0];
  const preview = document.getElementById('previewBuktiBayarMember');
  
  if (!preview) return;
  
  if (file) {
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar! Maksimal 5MB');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung! Gunakan JPG, PNG, GIF, atau PDF');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
    // Show preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `
          <div style="text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <img src="${e.target.result}" 
                 style="max-width: 300px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
              ✓ ${file.name} (${(file.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      preview.innerHTML = `
        <div style="padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center;">
          <i data-feather="file-text" style="width: 48px; height: 48px; color: #d32f2f;"></i>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
            ✓ ${file.name} (${(file.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      `;
      feather.replace();
    }
  } else {
    preview.innerHTML = '';
  }
};

// Trigger file upload
window.triggerFileUpload = function() {
  document.getElementById('buktiBayarMember').click();
};

// Trigger camera capture
window.triggerCameraCapture = function() {
  document.getElementById('buktiBayarCamera').click();
};

// Handle camera capture
window.handleCameraCapture = function(input) {
  const file = input.files[0];
  
  if (!file) return;
  
  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar! Maksimal 5MB');
    input.value = '';
    return;
  }
  
  // Transfer file to main input
  const mainInput = document.getElementById('buktiBayarMember');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  mainInput.files = dataTransfer.files;
  
  // Trigger preview
  previewBuktiBayarMember(mainInput);
  
  // Clear camera input
  input.value = '';
};

console.log('=== BAYAR SIMPANAN MEMBER LOADED ===');


// ===== MEMBER FOTO KTP FUNCTIONS =====

// Preview image for member
window.previewImageMember = function(input, previewId) {
  const file = input.files[0];
  const preview = document.getElementById(previewId);
  
  if (!preview) return;
  
  if (file) {
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar! Maksimal 5MB');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung! Gunakan JPG, PNG, GIF, atau PDF');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
    // Show preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `
          <div style="text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <img src="${e.target.result}" 
                 style="max-width: 200px; max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
              ✓ ${file.name} (${(file.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      preview.innerHTML = `
        <div style="padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center;">
          <i data-feather="file-text" style="width: 48px; height: 48px; color: #d32f2f;"></i>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            ✓ ${file.name} (${(file.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      `;
      feather.replace();
    }
  } else {
    preview.innerHTML = '';
  }
};

// View foto KTP member
window.viewFotoKTPMember = function(filename) {
  if (!filename) {
    alert('Tidak ada foto KTP');
    return;
  }
  
  const fileUrl = `/uploads/${filename}`;
  const ext = filename.split('.').pop().toLowerCase();
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3 class="modal-title">Foto KTP Saya</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div style="padding: 20px; text-align: center;">
        ${ext === 'pdf' ? `
          <iframe src="${fileUrl}" 
                  style="width: 100%; height: 600px; border: none; border-radius: 8px;"></iframe>
          <br>
          <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin-top: 10px;">
            <i data-feather="external-link"></i> Buka di Tab Baru
          </a>
        ` : `
          <img src="${fileUrl}" 
               style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <br>
          <a href="${fileUrl}" download class="btn btn-primary" style="margin-top: 10px;">
            <i data-feather="download"></i> Download
          </a>
        `}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  feather.replace();
};

console.log('=== MEMBER FOTO KTP FUNCTIONS LOADED ===');


// ===== CAMERA FUNCTIONS FOR MEMBER =====

let currentCameraStream = null;
let currentCameraInputId = null;
let currentCameraPreviewId = null;

// Open camera for member
window.openCameraMember = function(inputId, previewId) {
  currentCameraInputId = inputId;
  currentCameraPreviewId = previewId;
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'cameraModalMember';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h3 class="modal-title">Ambil Foto dengan Kamera</h3>
        <button class="modal-close" onclick="closeCameraMember()">×</button>
      </div>
      <div style="padding: 20px;">
        <div style="position: relative; background: #000; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
          <video id="cameraVideoMember" autoplay playsinline style="width: 100%; height: auto; display: block; max-height: 400px;"></video>
          <canvas id="cameraCanvasMember" style="display: none;"></canvas>
        </div>
        
        <div id="cameraErrorMember" style="display: none; padding: 12px; background: #ffebee; color: #c62828; border-radius: 8px; margin-bottom: 16px;">
          <i data-feather="alert-circle"></i>
          <span id="cameraErrorTextMember"></span>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button type="button" class="btn btn-primary" onclick="capturePhotoMember()" id="btnCaptureMember">
            <i data-feather="camera"></i> Ambil Foto
          </button>
          <button type="button" class="btn btn-secondary" onclick="switchCameraMember()" id="btnSwitchMember">
            <i data-feather="refresh-cw"></i> Ganti Kamera
          </button>
          <button type="button" class="btn btn-danger" onclick="closeCameraMember()">
            <i data-feather="x"></i> Batal
          </button>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 12px;">
          <i data-feather="info"></i> Pastikan pencahayaan cukup dan foto terlihat jelas
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  // Start camera
  startCameraMember();
};

// Start camera
let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for back camera

async function startCameraMember() {
  try {
    // Stop existing stream if any
    if (currentCameraStream) {
      currentCameraStream.getTracks().forEach(track => track.stop());
    }
    
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    
    currentCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById('cameraVideoMember');
    
    if (video) {
      video.srcObject = currentCameraStream;
      
      // Hide error message
      const errorDiv = document.getElementById('cameraErrorMember');
      if (errorDiv) errorDiv.style.display = 'none';
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    
    const errorDiv = document.getElementById('cameraErrorMember');
    const errorText = document.getElementById('cameraErrorTextMember');
    
    if (errorDiv && errorText) {
      errorDiv.style.display = 'block';
      
      if (error.name === 'NotAllowedError') {
        errorText.textContent = 'Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.';
      } else if (error.name === 'NotFoundError') {
        errorText.textContent = 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.';
      } else {
        errorText.textContent = 'Gagal mengakses kamera: ' + error.message;
      }
      
      feather.replace();
    }
  }
}

// Switch camera (front/back)
window.switchCameraMember = async function() {
  currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  await startCameraMember();
};

// Capture photo
window.capturePhotoMember = function() {
  const video = document.getElementById('cameraVideoMember');
  const canvas = document.getElementById('cameraCanvasMember');
  
  if (!video || !canvas) return;
  
  // Set canvas size to video size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw video frame to canvas
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convert canvas to blob
  canvas.toBlob(function(blob) {
    if (!blob) {
      alert('Gagal mengambil foto. Silakan coba lagi.');
      return;
    }
    
    // Create file from blob
    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // Create FileList-like object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Set to input file
    const input = document.getElementById(currentCameraInputId);
    if (input) {
      input.files = dataTransfer.files;
      
      // Trigger preview
      previewImageMember(input, currentCameraPreviewId);
    }
    
    // Close camera modal
    closeCameraMember();
    
    // Show success message
    const preview = document.getElementById(currentCameraPreviewId);
    if (preview) {
      setTimeout(() => {
        const successMsg = document.createElement('p');
        successMsg.style.cssText = 'color: #2e7d32; font-size: 12px; margin-top: 8px; text-align: center;';
        successMsg.innerHTML = '<i data-feather="check-circle"></i> Foto berhasil diambil dari kamera';
        preview.appendChild(successMsg);
        feather.replace();
        
        setTimeout(() => successMsg.remove(), 3000);
      }, 100);
    }
  }, 'image/jpeg', 0.9);
};

// Close camera
window.closeCameraMember = function() {
  // Stop camera stream
  if (currentCameraStream) {
    currentCameraStream.getTracks().forEach(track => track.stop());
    currentCameraStream = null;
  }
  
  // Remove modal
  const modal = document.getElementById('cameraModalMember');
  if (modal) {
    modal.remove();
  }
  
  // Reset variables
  currentCameraInputId = null;
  currentCameraPreviewId = null;
  currentFacingMode = 'user';
};

console.log('=== CAMERA FUNCTIONS FOR MEMBER LOADED ===');

// ===== DOWNLOAD STRUK PEMBAYARAN =====

// Download struk pembayaran simpanan
window.downloadStrukSimpanan = async function(transaksiId, jenisSimpanan, tanggal, jumlah, metode) {
  try {
    // Get koperasi info and member data
    const koperasiInfo = await API.get('/api/koperasi-info');
    
    if (!memberData) {
      alert('Data member tidak ditemukan');
      return;
    }
    
    // Create struk content
    const strukContent = generateStrukHTML({
      koperasiInfo,
      memberData,
      transaksi: {
        id: transaksiId,
        jenis: jenisSimpanan,
        tanggal: tanggal,
        jumlah: parseFloat(jumlah),
        metode: metode
      }
    });
    
    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(strukContent);
    printWindow.document.close();
    
    // Auto print after content loads
    printWindow.onload = function() {
      printWindow.print();
    };
    
  } catch (error) {
    console.error('Error downloading struk:', error);
    alert('Gagal mendownload struk pembayaran: ' + error.message);
  }
};

// Generate HTML content for struk pembayaran
function generateStrukHTML(data) {
  const { koperasiInfo, memberData, transaksi } = data;
  const currentDate = new Date().toLocaleString('id-ID');
  
  // Generate QR Code data with optimized format (shorter but readable)
  const qrData = `KOPERASI: ${koperasiInfo.nama_koperasi || 'NU Vibes'}\\nTRX: #${String(transaksi.id).padStart(6, '0')}\\nANGGOTA: ${memberData.nomor_anggota}\\nJENIS: ${transaksi.jenis}\\nJUMLAH: ${transaksi.jumlah}\\nTGL: ${transaksi.tanggal}`;
  
  // Escape single quotes in qrData for safe injection
  const safeQrData = qrData.replace(/'/g, "\\'");
  const transactionId = String(transaksi.id).padStart(6, '0');
  const memberNumber = memberData.nomor_anggota;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Pembayaran ${transaksi.jenis}</title>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Courier New', monospace;
          max-width: 400px;
          margin: 20px auto;
          padding: 20px;
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h2 {
          margin: 8px 0 5px 0;
          font-size: 18px;
          color: #2E7D32;
          font-weight: bold;
        }
        .header .address {
          margin: 5px 0;
          font-size: 13px;
          color: #555;
          line-height: 1.3;
        }
        .header .contact {
          margin: 8px 0 5px 0;
          font-size: 12px;
          color: #666;
        }
        .struk-info {
          margin-bottom: 20px;
        }
        .struk-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        .struk-row.total {
          border-top: 1px dashed #333;
          padding-top: 10px;
          margin-top: 15px;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          border-top: 2px dashed #333;
          padding-top: 15px;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .badge {
          background: #2E7D32;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .qr-code {
          width: 100px;
          height: 100px;
          margin: 15px auto;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          position: relative;
        }
        .qr-code canvas {
          width: 90px !important;
          height: 90px !important;
        }
        .qr-fallback {
          font-size: 10px;
          color: #999;
          text-align: center;
          padding: 20px;
          line-height: 1.2;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${koperasiInfo.nama_koperasi || 'Koperasi NU Vibes'}</h2>
        <div class="address">${koperasiInfo.alamat || 'Gedung Dakwah NU Kota Bandung, Jl. Sancang No. 8 Kota Bandung'}</div>
        <div class="contact">Telp: ${koperasiInfo.nomor_telpon || '+628211281926'}</div>
        <div class="contact">Website: nuvibes.nukotabandung.or.id</div>
        <div style="margin-top: 12px;">
          <span class="badge">STRUK PEMBAYARAN</span>
        </div>
      </div>
      
      <div class="struk-info">
        <div class="struk-row">
          <span>No. Transaksi:</span>
          <span><strong>#${transactionId}</strong></span>
        </div>
        <div class="struk-row">
          <span>Tanggal:</span>
          <span>${formatDate(transaksi.tanggal)}</span>
        </div>
        <div class="struk-row">
          <span>Waktu Cetak:</span>
          <span>${currentDate}</span>
        </div>
      </div>
      
      <div class="struk-info">
        <div class="struk-row">
          <span>No. Anggota:</span>
          <span><strong>${memberData.nomor_anggota}</strong></span>
        </div>
        <div class="struk-row">
          <span>Nama:</span>
          <span><strong>${memberData.nama_lengkap}</strong></span>
        </div>
        <div class="struk-row">
          <span>Telepon:</span>
          <span>${memberData.nomor_telpon || '08557556777'}</span>
        </div>
      </div>
      
      <div class="struk-info">
        <div class="struk-row">
          <span>Jenis Transaksi:</span>
          <span><strong>${transaksi.jenis}</strong></span>
        </div>
        <div class="struk-row">
          <span>Metode Pembayaran:</span>
          <span>${transaksi.metode}</span>
        </div>
        <div class="struk-row total">
          <span>JUMLAH BAYAR:</span>
          <span><strong>${formatCurrency(transaksi.jumlah)}</strong></span>
        </div>
      </div>
      
      <div class="footer">
        <div class="qr-code" id="qrcode">
          <div class="qr-fallback">QR Code<br>Loading...</div>
        </div>
        <p><strong>TERIMA KASIH</strong></p>
        <p>Simpan struk ini sebagai bukti pembayaran</p>
        <p>Untuk informasi lebih lanjut hubungi customer service</p>
        <p style="margin-top: 15px; font-size: 10px;">
          Dicetak pada: ${currentDate}<br>
          Sistem Koperasi NU Vibes v2.0
        </p>
      </div>
      
      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2E7D32; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
          <span>🖨️ Cetak Ulang</span>
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
          <span>❌ Tutup</span>
        </button>
      </div>
      
      <!-- QR Code Libraries -->
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
      
      <script>
        // QR Code data (injected safely)
        const qrData = '${safeQrData}';
        const qrContainer = document.getElementById('qrcode');
        const transactionId = '${transactionId}';
        const memberNumber = '${memberNumber}';
        
        // Method 1: Try QRCode library
        function generateQRWithQRCode() {
          return new Promise((resolve, reject) => {
            if (typeof QRCode !== 'undefined') {
              const canvas = document.createElement('canvas');
              QRCode.toCanvas(canvas, qrData, {
                width: 90,
                height: 90,
                margin: 1,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              }, function (error) {
                if (error) {
                  reject(error);
                } else {
                  resolve(canvas);
                }
              });
            } else {
              reject(new Error('QRCode library not available'));
            }
          });
        }
        
        // Method 2: Try QRious library
        function generateQRWithQRious() {
          return new Promise((resolve, reject) => {
            if (typeof QRious !== 'undefined') {
              try {
                const qr = new QRious({
                  value: qrData,
                  size: 90,
                  background: 'white',
                  foreground: 'black'
                });
                resolve(qr.canvas);
              } catch (error) {
                reject(error);
              }
            } else {
              reject(new Error('QRious library not available'));
            }
          });
        }
        
        // Method 3: Use Google Charts API as fallback
        function generateQRWithGoogle() {
          return new Promise((resolve, reject) => {
            try {
              const img = document.createElement('img');
              const encodedData = encodeURIComponent(qrData);
              img.src = 'https://chart.googleapis.com/chart?chs=90x90&cht=qr&chl=' + encodedData;
              img.style.width = '90px';
              img.style.height = '90px';
              
              img.onload = function() { resolve(img); };
              img.onerror = function() { reject(new Error('Google Charts API failed')); };
            } catch (error) {
              reject(error);
            }
          });
        }
        
        // Try to generate QR code with fallbacks
        async function generateQRCode() {
          console.log('Starting QR Code generation...');
          console.log('QR Data:', qrData);
          console.log('QR Data length:', qrData.length);
          
          try {
            console.log('Trying QRCode library...');
            const canvas1 = await generateQRWithQRCode();
            qrContainer.innerHTML = '';
            qrContainer.appendChild(canvas1);
            console.log('QR Code generated with QRCode library');
            return;
          } catch (error) {
            console.log('QRCode library failed:', error.message);
          }
          
          try {
            console.log('Trying QRious library...');
            const canvas2 = await generateQRWithQRious();
            qrContainer.innerHTML = '';
            qrContainer.appendChild(canvas2);
            console.log('QR Code generated with QRious library');
            return;
          } catch (error) {
            console.log('QRious library failed:', error.message);
          }
          
          try {
            console.log('Trying Google Charts API...');
            const img = await generateQRWithGoogle();
            qrContainer.innerHTML = '';
            qrContainer.appendChild(img);
            console.log('QR Code generated with Google Charts API');
            return;
          } catch (error) {
            console.log('Google Charts API failed:', error.message);
          }
          
          // All methods failed - show fallback
          console.log('All QR generation methods failed, showing fallback');
          qrContainer.innerHTML = '<div class="qr-fallback">QR Code<br>Unavailable<br><small>TRX: #' + transactionId + '<br>' + memberNumber + '</small></div>';
          console.log('All QR Code generation methods failed');
        }
        
        // Generate QR code when page loads
        window.onload = function() {
          console.log('Page loaded, starting QR generation in 500ms...');
          setTimeout(generateQRCode, 500);
        };
      </script>
    </body>
    </html>
  `;
}

// Update SHU Periode
window.updateSHUPeriode = async function() {
  const modeSelect = document.getElementById('shuModeSelect');
  const yearSelect = document.getElementById('shuYearSelect');
  
  if (!modeSelect) return;
  
  window.selectedSHUMode = modeSelect.value;
  window.selectedSHUYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
  
  // Re-render SHU page with new periode
  await renderSHU();
};

// Event listener for mode change
document.addEventListener('change', function(e) {
  if (e.target.id === 'shuModeSelect') {
    const yearContainer = document.getElementById('yearSelectContainer');
    if (yearContainer) {
      yearContainer.style.display = e.target.value === 'seluruh' ? 'none' : 'block';
    }
  }
});

console.log('✅ Download struk pembayaran feature loaded successfully');
console.log('✅ SHU periode selection feature loaded successfully');