// Page loader
window.loadPage = async function(page) {
  // Check if transaksi functions are now loaded after fix
  if (typeof window.renderPenjualan === 'function') {
    console.log('✅ renderPenjualan loaded successfully');
  }
  if (typeof window.renderPengeluaran === 'function') {
    console.log('✅ renderPengeluaran loaded successfully');  
  }
  if (typeof window.renderPendapatanLain === 'function') {
    console.log('✅ renderPendapatanLain loaded successfully');
  }
  
  // Fallback functions for transaksi pages if not loaded (should not be needed now)
  if (!window.renderPenjualan) {
    window.renderPenjualan = function() {
      contentArea.innerHTML = `
        <div class="alert alert-warning">
          <i data-feather="alert-triangle"></i>
          <h4>Function renderPenjualan sedang dimuat...</h4>
          <p>
            <button onclick="window.location.reload()" class="btn btn-primary">
              <i data-feather="refresh-cw"></i> Refresh Halaman
            </button>
            <button onclick="console.log('Test function:', typeof window.testRenderPenjualan); alert('Check console for debug info');" class="btn btn-secondary">
              <i data-feather="info"></i> Debug Info
            </button>
          </p>
          <details style="margin-top: 10px;">
            <summary><strong>Troubleshooting</strong></summary>
            <ul>
              <li>Script pages-transaksi.js mungkin tidak berhasil dimuat</li>
              <li>Cek browser console untuk error messages</li>
              <li>Pastikan server berjalan dengan baik</li>
              <li>Coba logout dan login kembali</li>
            </ul>
          </details>
        </div>
      `;
      feather.replace();
    };
  }
  
  if (!window.renderPengeluaran) {
    window.renderPengeluaran = function() {
      contentArea.innerHTML = `
        <div class="alert alert-warning">
          <i data-feather="alert-triangle"></i>
          Function renderPengeluaran sedang dimuat... Silakan refresh halaman.
        </div>
      `;
      feather.replace();
    };
  }
  
  if (!window.renderPendapatanLain) {
    window.renderPendapatanLain = function() {
      contentArea.innerHTML = `
        <div class="alert alert-warning">
          <i data-feather="alert-triangle"></i>
          Function renderPendapatanLain sedang dimuat... Silakan refresh halaman.
        </div>
      `;
      feather.replace();
    };
  }
  
  // Dynamic lookup - get function at call time, not definition time
  const pages = {
    'beranda': 'renderBeranda',
    'info-koperasi': 'renderInfoKoperasi',
    'unit-usaha': 'renderUnitUsaha',
    'aset-inventaris': 'renderAsetInventaris',
    'approval-anggota': 'renderApprovalAnggota',
    'data-anggota': 'renderDataAnggota',
    'data-pengurus': 'renderDataPengurus',
    'data-karyawan': 'renderDataKaryawan',
    'approval-simpanan': 'renderApprovalSimpanan',
    'simpanan-pokok': 'renderSimpanan',
    'simpanan-wajib': 'renderSimpanan',
    'simpanan-khusus': 'renderSimpanan',
    'simpanan-sukarela': 'renderSimpanan',
    'partisipasi-anggota': 'renderPartisipasiAnggota',
    'penjualan': 'renderPenjualan',
    'pengeluaran': 'renderPengeluaran',
    'pendapatan-lain': 'renderPendapatanLain',
    'shu': 'renderSHU',
    'publikasi': 'renderPublikasi',
    'pengumuman': 'renderPengumuman',
    'laporan': 'renderLaporan',
    'profil': 'renderProfil',
    'pengaturan': 'renderPengaturan'
  };
  
  const functionName = pages[page];
  if (functionName && window[functionName]) {
    contentArea.innerHTML = '<div class="loading">Memuat data...</div>';
    try {
      // All simpanan pages now use unified view (no parameter needed)
      await window[functionName]();
      feather.replace();
    } catch (error) {
      console.error('Error loading page:', error);
      contentArea.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Error</h3>
          </div>
          <div class="error-message">
            <p>Terjadi kesalahan saat memuat halaman: ${error.message}</p>
            <p><small>Silakan refresh halaman atau hubungi administrator.</small></p>
          </div>
        </div>
      `;
    }
  } else {
    console.error(`Page "${page}" not found. Function "${functionName}" is ${typeof window[functionName]}`);
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Halaman Tidak Ditemukan</h3>
        </div>
        <div class="error-message">
          <p>Halaman "${page}" tidak ditemukan.</p>
          <p><small>Debug: Function "${functionName}" is ${typeof window[functionName]}</small></p>
        </div>
      </div>
    `;
  }
};

// Beranda Page
window.renderBeranda = async function() {
  const stats = await API.get('/api/dashboard/stats');
  
  contentArea.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" style="border-left: 4px solid #2E7D32;">
        <div class="stat-header">
          <div>
            <div class="stat-title">Total Anggota</div>
            <div class="stat-value">${stats.totalAnggota || 0}</div>
            <div class="stat-label">Anggota Aktif</div>
          </div>
          <div class="stat-icon" style="background: linear-gradient(135deg, #2E7D32, #4CAF50);">
            <i data-feather="users" style="color: white; width: 28px; height: 28px;"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card" style="border-left: 4px solid #FFD700;">
        <div class="stat-header">
          <div>
            <div class="stat-title">Total Simpanan</div>
            <div class="stat-value">${formatCurrency(stats.totalSimpanan || 0)}</div>
            <div class="stat-label">Pokok + Wajib + Khusus + Sukarela</div>
          </div>
          <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #FFA500);">
            <i data-feather="dollar-sign" style="color: white; width: 28px; height: 28px;"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card" style="border-left: 4px solid #4ECDC4;">
        <div class="stat-header">
          <div>
            <div class="stat-title">Total Pendapatan</div>
            <div class="stat-value">${formatCurrency(stats.totalPendapatan || 0)}</div>
            <div class="stat-label">Penjualan + Pendapatan Lain</div>
          </div>
          <div class="stat-icon" style="background: linear-gradient(135deg, #4ECDC4, #44A08D);">
            <i data-feather="dollar-sign" style="color: white; width: 28px; height: 28px;"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card" style="border-left: 4px solid #00C9A7;">
        <div class="stat-header">
          <div>
            <div class="stat-title">Laba Kotor</div>
            <div class="stat-value">${formatCurrency(stats.labaKotor || 0)}</div>
            <div class="stat-label">Total Pendapatan - HPP</div>
          </div>
          <div class="stat-icon" style="background: linear-gradient(135deg, #00C9A7, #00B894);">
            <i data-feather="trending-up" style="color: white; width: 28px; height: 28px;"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card" style="border-left: 4px solid #FF6B6B;">
        <div class="stat-header">
          <div>
            <div class="stat-title">Biaya Operasional</div>
            <div class="stat-value">${formatCurrency(stats.totalPengeluaran || 0)}</div>
            <div class="stat-label">Tanpa Pembelian Barang & Aset</div>
          </div>
          <div class="stat-icon" style="background: linear-gradient(135deg, #FF6B6B, #EE5A6F);">
            <i data-feather="credit-card" style="color: white; width: 28px; height: 28px;"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card" style="border-left: 4px solid ${stats.labaRugi >= 0 ? '#00C9A7' : '#FF6B6B'};">
        <div class="stat-header">
          <div>
            <div class="stat-title">${stats.labaRugi >= 0 ? 'SHU Tahun Berjalan' : 'Rugi Tahun Berjalan'}</div>
            <div class="stat-value" style="color: ${stats.labaRugi >= 0 ? '#00C9A7' : '#FF6B6B'}">
              ${formatCurrency(Math.abs(stats.labaRugi || 0))}
            </div>
            <div class="stat-label">Laba Kotor - Biaya Operasional</div>
          </div>
          <div class="stat-icon" style="background: linear-gradient(135deg, ${stats.labaRugi >= 0 ? '#00C9A7, #00B894' : '#FF6B6B, #EE5A6F'});">
            <i data-feather="${stats.labaRugi >= 0 ? 'trending-up' : 'trending-down'}" style="color: white; width: 28px; height: 28px;"></i>
          </div>
        </div>
      </div>
    </div>
    
    <div class="charts-grid">
      <div class="chart-container">
        <h3 class="chart-title">Komposisi Simpanan</h3>
        <canvas id="simpananChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3 class="chart-title">Pendapatan Bulanan</h3>
        <canvas id="labaRugiChart"></canvas>
      </div>
    </div>
    
    <!-- Tagihan Anggota -->
    <div class="card" style="margin-top: 30px;">
      <div class="card-header">
        <h3 class="card-title">
          <i data-feather="alert-circle" style="width: 20px; height: 20px; margin-right: 8px; color: #FF6B6B;"></i>
          Tagihan Simpanan Belum Dibayar
        </h3>
        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="text" id="searchTagihan" placeholder="Cari nama / no. anggota..." 
            style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; width: 250px; font-size: 14px;"
            oninput="filterTagihan(this.value)">
          <button class="btn btn-success" onclick="exportTagihan()">
            <i data-feather="download"></i> Export
          </button>
          <button class="btn btn-secondary" onclick="window.loadTagihanWidget()">
            <i data-feather="refresh-cw"></i> Refresh
          </button>
        </div>
      </div>
      <div id="tagihanWidget">
        <div class="loading" style="padding: 40px; text-align: center;">Memuat data tagihan...</div>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="card" style="margin-top: 30px;">
      <div class="card-header">
        <h3 class="card-title">
          <i data-feather="activity" style="width: 20px; height: 20px; margin-right: 8px;"></i>
          Aktivitas Terkini
        </h3>
        <button class="btn btn-secondary" onclick="refreshActivity()" title="Refresh">
          <i data-feather="refresh-cw"></i> Refresh
        </button>
      </div>
      <div class="card-body">
        <div id="activityLogContainer">
          <div class="loading">Memuat aktivitas...</div>
        </div>
      </div>
    </div>
  `;
  
  // Render charts
  window.renderSimpananChart();
  window.renderLabaRugiChart();
  
  // Load tagihan anggota
  window.loadTagihanWidget();

  // Load activity log
  window.loadRecentActivity();
}

// ===== TAGIHAN ANGGOTA WIDGET =====
let allTagihanData = [];

window.loadTagihanWidget = async function() {
  const container = document.getElementById('tagihanWidget');
  if (!container) return;

  container.innerHTML = '<div class="loading" style="padding: 40px; text-align: center;">Memuat data tagihan...</div>';

  try {
    const result = await API.get('/api/tagihan/anggota');
    allTagihanData = result.data || [];
    renderTagihanTable(allTagihanData, result);
  } catch (e) {
    container.innerHTML = `<div style="padding: 20px; color: #c62828;">Gagal memuat data tagihan: ${e.message}</div>`;
  }
};

function renderTagihanTable(data, summary) {
  const container = document.getElementById('tagihanWidget');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `
      <div style="padding: 60px; text-align: center; color: #4CAF50;">
        <i data-feather="check-circle" style="width: 56px; height: 56px; margin-bottom: 16px;"></i>
        <h3 style="margin: 0;">Semua anggota sudah lunas!</h3>
        <p style="color: #999; margin-top: 8px;">Tidak ada tagihan simpanan yang belum dibayar.</p>
      </div>
    `;
    feather.replace();
    return;
  }

  // Summary cards
  const totalMenunggak = summary ? summary.total_anggota_menunggak : data.length;
  const totalTagihan   = summary ? summary.total_tagihan_keseluruhan
                                 : data.reduce((s, r) => s + r.total_tagihan, 0);
  const totalPokok     = data.reduce((s, r) => s + r.tagihan_pokok, 0);
  const totalWajib     = data.reduce((s, r) => s + r.tagihan_wajib, 0);

  container.innerHTML = `
    <!-- Summary cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 20px 20px 0;">
      <div style="background: linear-gradient(135deg, #FF6B6B, #EE5A6F); color: white; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 6px;">Anggota Menunggak</div>
        <div style="font-size: 32px; font-weight: 700;">${totalMenunggak}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">dari total anggota aktif</div>
      </div>
      <div style="background: linear-gradient(135deg, #FF9800, #F57C00); color: white; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 6px;">Total Tagihan</div>
        <div style="font-size: 22px; font-weight: 700;">${formatCurrency(totalTagihan)}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">keseluruhan</div>
      </div>
      <div style="background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 6px;">Tagihan Simpanan Pokok</div>
        <div style="font-size: 22px; font-weight: 700;">${formatCurrency(totalPokok)}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">belum dibayar</div>
      </div>
      <div style="background: linear-gradient(135deg, #1976D2, #1565C0); color: white; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 6px;">Tagihan Simpanan Wajib</div>
        <div style="font-size: 22px; font-weight: 700;">${formatCurrency(totalWajib)}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">belum dibayar</div>
      </div>
    </div>

    <!-- Tabel -->
    <div class="table-container" style="margin-top: 20px;">
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>No. Anggota</th>
            <th>Nama Anggota</th>
            <th>No. Telpon</th>
            <th style="text-align: right;">Tagihan Pokok (Rp)</th>
            <th style="text-align: right;">Tagihan Wajib (Rp)</th>
            <th style="text-align: right;">Total Tagihan (Rp)</th>
            <th style="text-align: center;">Status</th>
            <th style="text-align: center;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((item, i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td><strong>${item.nomor_anggota}</strong></td>
              <td>${item.nama_lengkap}</td>
              <td>${item.nomor_telpon || '-'}</td>
              <td style="text-align: right; color: ${item.tagihan_pokok > 0 ? '#c62828' : '#2e7d32'};">
                ${item.tagihan_pokok > 0 ? formatCurrency(item.tagihan_pokok) : '<span style="color:#2e7d32;">Lunas</span>'}
              </td>
              <td style="text-align: right; color: ${item.tagihan_wajib > 0 ? '#c62828' : '#2e7d32'};">
                ${item.tagihan_wajib > 0 ? formatCurrency(item.tagihan_wajib) : '<span style="color:#2e7d32;">Lunas</span>'}
              </td>
              <td style="text-align: right; font-weight: 700; color: #c62828;">
                ${formatCurrency(item.total_tagihan)}
              </td>
              <td style="text-align: center;">
                <span style="background: #FFEBEE; color: #c62828; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                  Belum Lunas
                </span>
              </td>
              <td style="text-align: center;">
                <button class="btn btn-sm btn-info" onclick="lihatDetailTagihan(${item.id}, '${item.nama_lengkap}')" title="Detail">
                  <i data-feather="eye"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  feather.replace();
}

window.filterTagihan = function(keyword) {
  if (!keyword) {
    renderTagihanTable(allTagihanData, {
      total_anggota_menunggak: allTagihanData.length,
      total_tagihan_keseluruhan: allTagihanData.reduce((s, r) => s + r.total_tagihan, 0)
    });
    return;
  }
  const kw = keyword.toLowerCase();
  const filtered = allTagihanData.filter(r =>
    r.nama_lengkap.toLowerCase().includes(kw) ||
    r.nomor_anggota.toLowerCase().includes(kw)
  );
  renderTagihanTable(filtered, {
    total_anggota_menunggak: filtered.length,
    total_tagihan_keseluruhan: filtered.reduce((s, r) => s + r.total_tagihan, 0)
  });
};

window.exportTagihan = function() {
  if (!allTagihanData.length) {
    alert('Tidak ada data tagihan untuk diexport.');
    return;
  }

  let csv = 'No.,No. Anggota,Nama Anggota,No. Telpon,Tagihan Pokok (Rp),Tagihan Wajib (Rp),Total Tagihan (Rp)\n';
  allTagihanData.forEach((item, i) => {
    csv += `${i + 1},"${item.nomor_anggota}","${item.nama_lengkap}","${item.nomor_telpon || ''}",${item.tagihan_pokok},${item.tagihan_wajib},${item.total_tagihan}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tagihan-anggota-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

window.lihatDetailTagihan = async function(anggotaId, namaAnggota) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Detail Tagihan - ${namaAnggota}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div style="padding: 24px;" id="detailTagihanContent">
        <div class="loading">Memuat detail...</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const data = allTagihanData.find(r => r.id === anggotaId);
    if (!data) throw new Error('Data tidak ditemukan');

    document.getElementById('detailTagihanContent').innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div style="background: #f9f9f9; padding: 14px; border-radius: 8px;">
          <div style="font-size: 12px; color: #999;">No. Anggota</div>
          <div style="font-weight: 600;">${data.nomor_anggota}</div>
        </div>
        <div style="background: #f9f9f9; padding: 14px; border-radius: 8px;">
          <div style="font-size: 12px; color: #999;">Tgl. Bergabung</div>
          <div style="font-weight: 600;">${formatDate(data.tanggal_bergabung) || '-'}</div>
        </div>
        <div style="background: #f9f9f9; padding: 14px; border-radius: 8px;">
          <div style="font-size: 12px; color: #999;">Sudah Bayar Pokok</div>
          <div style="font-weight: 600; color: #2e7d32;">${formatCurrency(data.sudah_bayar_pokok)}</div>
        </div>
        <div style="background: #f9f9f9; padding: 14px; border-radius: 8px;">
          <div style="font-size: 12px; color: #999;">Sudah Bayar Wajib</div>
          <div style="font-weight: 600; color: #2e7d32;">${formatCurrency(data.sudah_bayar_wajib)}</div>
        </div>
        <div style="background: #f9f9f9; padding: 14px; border-radius: 8px;">
          <div style="font-size: 12px; color: #999;">Kewajiban Wajib (${data.total_bulan_wajib} bulan × ${formatCurrency(data.tarif_wajib || 30000)})</div>
          <div style="font-weight: 600;">${formatCurrency(data.total_bulan_wajib * (data.tarif_wajib || 30000))}</div>
        </div>
        <div style="background: #FFEBEE; padding: 14px; border-radius: 8px; border: 1px solid #FFCDD2;">
          <div style="font-size: 12px; color: #999;">No. Telpon</div>
          <div style="font-weight: 600;">${data.nomor_telpon || '-'}</div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #FF6B6B, #EE5A6F); color: white; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 14px; opacity: 0.9;">Total Tagihan Belum Dibayar</div>
        <div style="font-size: 32px; font-weight: 700; margin: 8px 0;">${formatCurrency(data.total_tagihan)}</div>
        <div style="font-size: 13px; opacity: 0.8;">
          Pokok: ${formatCurrency(data.tagihan_pokok)} + Wajib: ${formatCurrency(data.tagihan_wajib)}
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button class="btn btn-primary" style="flex: 1;"
          onclick="loadPage('simpanan-pokok'); this.closest('.modal').remove();">
          <i data-feather="plus"></i> Input Simpanan
        </button>
        <button class="btn btn-secondary" style="flex: 1;"
          onclick="this.closest('.modal').remove();">
          Tutup
        </button>
      </div>
    `;
    feather.replace();
  } catch (e) {
    document.getElementById('detailTagihanContent').innerHTML =
      `<p style="color: red;">Error: ${e.message}</p>`;
  }
};

window.renderSimpananChart = async function() {
  const ctx = document.getElementById('simpananChart');
  if (!ctx) return;
  
  // Get simpanan data
  const pokok = await API.get('/api/simpanan/pokok');
  const wajib = await API.get('/api/simpanan/wajib');
  const khusus = await API.get('/api/simpanan/khusus');
  const sukarela = await API.get('/api/simpanan/sukarela');
  
  const totalPokok = pokok.reduce((sum, item) => sum + item.jumlah, 0);
  const totalWajib = wajib.reduce((sum, item) => sum + item.jumlah, 0);
  const totalKhusus = khusus.reduce((sum, item) => sum + item.jumlah, 0);
  const totalSukarela = sukarela.reduce((sum, item) => sum + item.jumlah, 0);
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Khusus', 'Simpanan Sukarela'],
      datasets: [{
        data: [totalPokok, totalWajib, totalKhusus, totalSukarela],
        backgroundColor: ['#2E7D32', '#4CAF50', '#FFC107', '#FFD54F']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

window.renderLabaRugiChart = async function() {
  const ctx = document.getElementById('labaRugiChart');
  if (!ctx) return;
  
  try {
    // Get data for current year
    const currentYear = new Date().getFullYear();
    const penjualan = await API.get('/api/transaksi/penjualan');
    const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
    
    // Pastikan data adalah array
    const penjualanData = Array.isArray(penjualan) ? penjualan : [];
    const pendapatanLainData = Array.isArray(pendapatanLain) ? pendapatanLain : [];
    
    // Calculate pendapatan per month
    const pendapatanPerBulan = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const yearMonth = `${currentYear}-${monthStr}`;
      
      // Filter data by month
      const penjualanBulan = penjualanData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(yearMonth));
      const pendapatanLainBulan = pendapatanLainData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(yearMonth));
      
      // Calculate totals
      const totalPenjualan = penjualanBulan.reduce((sum, p) => sum + (p.jumlah_penjualan || 0), 0);
      const totalPendapatanLain = pendapatanLainBulan.reduce((sum, p) => sum + (p.jumlah || 0), 0);
      
      // Total Pendapatan = Penjualan + Pendapatan Lain
      const totalPendapatan = totalPenjualan + totalPendapatanLain;
      
      pendapatanPerBulan.push(totalPendapatan);
    }
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        datasets: [{
          label: 'Pendapatan Bulanan',
          data: pendapatanPerBulan,
          borderColor: '#2E7D32',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Pendapatan: ' + formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error rendering laba/rugi chart:', error);
  }
}

// Info Koperasi Page
window.renderInfoKoperasi = async function() {
  const info = await API.get('/api/koperasi-info');
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Informasi Koperasi</h3>
        <button class="btn btn-primary" onclick="editKoperasiInfo()">Edit Informasi</button>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Nama Koperasi</label>
          <p><strong>${info.nama_koperasi || '-'}</strong></p>
        </div>
        <div class="form-group">
          <label>Nomor Induk Koperasi</label>
          <p><strong>${info.nomor_induk_koperasi || '-'}</strong></p>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Nomor Induk Berusaha</label>
          <p><strong>${info.nomor_induk_berusaha || '-'}</strong></p>
        </div>
        <div class="form-group">
          <label>Nomor Badan Hukum</label>
          <p><strong>${info.nomor_badan_hukum || '-'}</strong></p>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Alamat</label>
          <p><strong>${info.alamat || '-'}</strong></p>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Nomor Telepon</label>
          <p><strong>${info.nomor_telpon || '-'}</strong></p>
        </div>
        <div class="form-group">
          <label>Email</label>
          <p><strong>${info.email || '-'}</strong></p>
        </div>
        <div class="form-group">
          <label>Tanggal Berdiri</label>
          <p><strong>${formatDate(info.tanggal_berdiri)}</strong></p>
        </div>
      </div>
      
      <div class="form-group">
        <label>Logo Koperasi</label>
        ${info.logo ? `
          <div style="margin-bottom: 15px;">
            <img src="${info.logo}" alt="Logo" style="max-width: 200px; border-radius: 10px; box-shadow: var(--shadow-md);">
          </div>
        ` : ''}
        <button class="btn btn-info" onclick="uploadLogoKoperasi()">
          <i data-feather="upload"></i> Upload Logo Baru
        </button>
      </div>

      <!-- Tarif Simpanan -->
      <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #E8F5E9, #F1F8E9); border-radius: 12px; border-left: 4px solid #2E7D32;">
        <h4 style="color: #2E7D32; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
          <i data-feather="tag" style="width: 20px; height: 20px;"></i>
          Tarif Simpanan
        </h4>
        <div class="form-row">
          <div class="form-group">
            <label>Simpanan Pokok (sekali bayar)</label>
            <p><strong style="font-size: 18px; color: #2E7D32;">${formatCurrency(info.tarif_simpanan_pokok || 100000)}</strong></p>
          </div>
          <div class="form-group">
            <label>Simpanan Wajib (per bulan)</label>
            <p><strong style="font-size: 18px; color: #2E7D32;">${formatCurrency(info.tarif_simpanan_wajib || 30000)}</strong></p>
          </div>
        </div>
        <p style="color: #666; font-size: 13px; margin: 0;">
          Tarif ini digunakan untuk menghitung tagihan anggota di dashboard. Klik "Edit Informasi" untuk mengubah tarif.
        </p>
      </div>
    </div>
  `;
  
  feather.replace();
}

window.uploadLogoKoperasi = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB!');
      return;
    }
    
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      const response = await API.uploadFile('/api/koperasi/upload-logo', formData);
      
      if (response.success) {
        alert('Logo koperasi berhasil diupdate!');
        
        // Update sidebar logo
        const sidebarLogo = document.getElementById('sidebarLogo');
        const logoPlaceholder = document.getElementById('logoPlaceholder');
        
        sidebarLogo.src = response.logo;
        sidebarLogo.style.display = 'block';
        if (logoPlaceholder) logoPlaceholder.style.display = 'none';
        
        // Reload page
        window.renderInfoKoperasi();
      } else {
        alert('Gagal upload logo: ' + response.message);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Terjadi kesalahan saat upload logo');
    }
  };
  
  input.click();
}

window.editKoperasiInfo = async function() {
  const info = await API.get('/api/koperasi-info');
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit Informasi Koperasi</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editKoperasiForm">
        <div class="form-row">
          <div class="form-group">
            <label>Nama Koperasi *</label>
            <input type="text" name="nama_koperasi" value="${info.nama_koperasi || ''}" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Induk Koperasi</label>
            <input type="text" name="nomor_induk_koperasi" value="${info.nomor_induk_koperasi || ''}">
          </div>
          <div class="form-group">
            <label>Nomor Induk Berusaha</label>
            <input type="text" name="nomor_induk_berusaha" value="${info.nomor_induk_berusaha || ''}">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Badan Hukum</label>
            <input type="text" name="nomor_badan_hukum" value="${info.nomor_badan_hukum || ''}">
          </div>
          <div class="form-group">
            <label>Tanggal Berdiri</label>
            <input type="date" name="tanggal_berdiri" value="${info.tanggal_berdiri || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label>Alamat</label>
          <textarea name="alamat">${info.alamat || ''}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Telepon</label>
            <input type="text" name="nomor_telpon" value="${info.nomor_telpon || ''}">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${info.email || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label>Logo</label>
          <input type="file" name="logo" accept="image/*">
        </div>
        
        <div style="padding: 16px; background: #F1F8E9; border-radius: 8px; border-left: 3px solid #2E7D32; margin-bottom: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #2E7D32; font-size: 15px;">⚙️ Tarif Simpanan</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Simpanan Pokok (Rp) — sekali bayar</label>
              <input type="number" name="tarif_simpanan_pokok" value="${info.tarif_simpanan_pokok || 100000}" min="0" step="1000" placeholder="100000">
              <small style="color: #888;">Digunakan untuk menghitung tagihan anggota</small>
            </div>
            <div class="form-group">
              <label>Simpanan Wajib (Rp) — per bulan</label>
              <input type="number" name="tarif_simpanan_wajib" value="${info.tarif_simpanan_wajib || 30000}" min="0" step="1000" placeholder="30000">
              <small style="color: #888;">Digunakan untuk menghitung tagihan anggota</small>
            </div>
          </div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('editKoperasiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`/api/koperasi-info/${info.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Data berhasil diupdate');
        modal.remove();
        window.renderInfoKoperasi();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  });
};

// Unit Usaha - Moved to pages-extended.js for tile layout

// Aset & Inventaris Page
window.renderAsetInventaris = async function() {
  const pengeluaran = await API.get('/api/transaksi/pengeluaran');
  
  // Filter hanya pembelian aset & inventaris
  const asetInventaris = pengeluaran.filter(p => 
    p.kategori === 'Pembelian Aset & Inventaris' || p.kategori === 'Pembelian Aset'
  );
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Aset & Inventaris</h3>
        <p style="color: #666; margin: 8px 0 0 0;">Data aset dan inventaris dari transaksi pembelian</p>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal Perolehan</th>
              <th>Nama Aset</th>
              <th>Qty</th>
              <th>Harga Satuan</th>
              <th>Nilai Perolehan</th>
              <th>Unit Usaha</th>
            </tr>
          </thead>
          <tbody>
            ${asetInventaris.length > 0 ? asetInventaris.map((item, index) => {
              const qty = item.qty || 1;
              const harga = item.harga || (item.jumlah / qty); // Hitung harga satuan jika kosong
              return `
              <tr>
                <td>${index + 1}</td>
                <td>${formatDate(item.tanggal_transaksi)}</td>
                <td>${item.keterangan || '-'}</td>
                <td style="text-align: center;">${qty}</td>
                <td>${formatCurrency(harga)}</td>
                <td><strong>${formatCurrency(item.jumlah)}</strong></td>
                <td>${item.nama_usaha || '-'}</td>
              </tr>
              `;
            }).join('') : '<tr><td colspan="7" style="text-align: center; color: #999;">Belum ada data aset & inventaris</td></tr>'}
          </tbody>
          <tfoot>
            <tr style="background: #f8f9fa; font-weight: bold;">
              <td colspan="2"><strong>TOTAL</strong></td>
              <td><strong>${asetInventaris.length} Item</strong></td>
              <td style="text-align: center;"><strong>${asetInventaris.reduce((sum, item) => sum + (item.qty || 1), 0)}</strong></td>
              <td></td>
              <td><strong>${formatCurrency(asetInventaris.reduce((sum, item) => sum + (item.jumlah || 0), 0))}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="margin-top: 20px; padding: 16px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196F3;">
        <h4 style="margin: 0 0 8px 0; color: #1976D2;">ℹ️ Informasi</h4>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          Data aset & inventaris diambil dari transaksi <strong>Pengeluaran</strong> dengan kategori <strong>"Pembelian Aset & Inventaris"</strong>.<br>
          Untuk menambah aset baru, silakan input melalui menu <strong>Pengeluaran</strong> dengan kategori tersebut.
        </p>
      </div>
    </div>
  `;
  
  feather.replace();
};

// Data Anggota Page
// Global variable untuk menyimpan data dan sort state
let anggotaData = [];
let currentSortColumn = 'created_at';
let currentSortOrder = 'desc';

let searchKeyword = '';

// Helper function: Create searchable select for anggota
window.createSearchableAnggotaSelect = function(containerId, name = 'anggota_id', required = true, selectedId = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div style="position: relative;">
      <input 
        type="text" 
        id="${containerId}_search" 
        placeholder="Ketik untuk mencari anggota..."
        autocomplete="off"
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 5px;"
      >
      <select 
        id="${containerId}_select" 
        ${required ? 'required' : ''}
        size="8"
        style="width: 100%; border: 1px solid #ddd; border-radius: 5px; max-height: 200px;"
      >
        <option value="">-- Pilih Anggota --</option>
      </select>
      <input type="hidden" name="${name}" id="${containerId}_value" ${required ? 'required' : ''}>
    </div>
  `;
  
  const searchInput = document.getElementById(`${containerId}_search`);
  const selectElement = document.getElementById(`${containerId}_select`);
  const hiddenInput = document.getElementById(`${containerId}_value`);
  
  let allAnggota = [];
  
  // Load anggota data
  API.get('/api/anggota').then(data => {
    allAnggota = data.filter(a => a.status === 'aktif');
    renderAnggotaOptions(allAnggota);
    
    if (selectedId) {
      selectElement.value = selectedId;
      hiddenInput.value = selectedId;
      const selected = allAnggota.find(a => a.id == selectedId);
      if (selected) {
        searchInput.value = `${selected.nomor_anggota} - ${selected.nama_lengkap}`;
      }
    }
  });
  
  function renderAnggotaOptions(anggotaList) {
    selectElement.innerHTML = '<option value="">-- Pilih Anggota --</option>' + 
      anggotaList.map(a => `
        <option value="${a.id}">${a.nomor_anggota} - ${a.nama_lengkap}</option>
      `).join('');
  }
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    if (!keyword) {
      renderAnggotaOptions(allAnggota);
      return;
    }
    
    const filtered = allAnggota.filter(a => {
      return (
        (a.nomor_anggota && a.nomor_anggota.toLowerCase().includes(keyword)) ||
        (a.nama_lengkap && a.nama_lengkap.toLowerCase().includes(keyword))
      );
    });
    
    renderAnggotaOptions(filtered);
  });
  
  // Select functionality
  selectElement.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    hiddenInput.value = selectedId;
    
    if (selectedId) {
      const selected = allAnggota.find(a => a.id == selectedId);
      if (selected) {
        searchInput.value = `${selected.nomor_anggota} - ${selected.nama_lengkap}`;
      }
    } else {
      searchInput.value = '';
    }
  });
  
  // Double click to select
  selectElement.addEventListener('dblclick', (e) => {
    if (selectElement.value) {
      const selected = allAnggota.find(a => a.id == selectElement.value);
      if (selected) {
        searchInput.value = `${selected.nomor_anggota} - ${selected.nama_lengkap}`;
        hiddenInput.value = selectElement.value;
      }
    }
  });
};

window.renderDataAnggota = async function() {
  anggotaData = await API.get('/api/anggota');
  searchKeyword = '';
  renderAnggotaTable();
}

function renderAnggotaTable(updateOnly = false) {
  // Filter data by search keyword
  let filteredData = anggotaData;
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    filteredData = anggotaData.filter(item => {
      return (
        (item.nomor_anggota && item.nomor_anggota.toLowerCase().includes(keyword)) ||
        (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(keyword)) ||
        (item.nik && item.nik.toLowerCase().includes(keyword)) ||
        (item.nomor_telpon && item.nomor_telpon.toLowerCase().includes(keyword)) ||
        (item.email && item.email.toLowerCase().includes(keyword))
      );
    });
  }
  
  // Sort data
  const sortedData = sortAnggotaData(filteredData, currentSortColumn, currentSortOrder);
  
  // If updateOnly, just update the table body and counter
  if (updateOnly) {
    const tbody = document.querySelector('.table-container tbody');
    const counter = document.querySelector('.filter-section > div:last-child');
    
    if (tbody) {
      tbody.innerHTML = sortedData.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.foto ? `<img src="/uploads/${item.foto}?t=${Date.now()}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2224%22>👤</text></svg>'">` : '👤'}</td>
          <td><strong>${item.nomor_anggota}</strong></td>
          <td>${item.nama_lengkap}</td>
          <td>${item.nik || '-'}</td>
          <td>${item.nomor_telpon || '-'}</td>
          <td>${item.tanggal_bergabung ? new Date(item.tanggal_bergabung).toLocaleDateString('id-ID') : '-'}</td>
          <td><span class="badge badge-${item.status === 'aktif' ? 'success' : 'danger'}">${item.status}</span></td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-info" onclick="detailAnggota(${item.id})" title="Detail">
                <i data-feather="eye"></i>
                <span class="btn-text">Detail</span>
              </button>
              <button class="btn btn-sm btn-warning" onclick="editAnggota(${item.id})" title="Edit">
                <i data-feather="edit"></i>
                <span class="btn-text">Edit</span>
              </button>
              <button class="btn btn-sm btn-danger" onclick="hapusAnggota(${item.id})" title="Hapus">
                <i data-feather="trash-2"></i>
                <span class="btn-text">Hapus</span>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      feather.replace();
    }
    
    if (counter) {
      counter.innerHTML = searchKeyword 
        ? `Ditemukan: <strong>${sortedData.length}</strong> dari ${anggotaData.length} anggota` 
        : `Total: <strong>${sortedData.length}</strong> anggota`;
    }
    
    return;
  }
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Data Anggota</h3>
        <div class="btn-group">
          <button class="btn btn-danger" onclick="bulkDeleteAnggota()" title="Hapus semua data anggota">
            <i data-feather="trash-2"></i> Hapus Semua Data
          </button>
          <button class="btn btn-success" onclick="exportAnggota()">
            <i data-feather="download"></i> Export Excel
          </button>
          <button class="btn btn-info" onclick="importAnggota()">
            <i data-feather="upload"></i> Import Excel
          </button>
          <button class="btn btn-warning" onclick="cetakAnggota()">
            <i data-feather="printer"></i> Cetak
          </button>
          <button class="btn btn-primary" onclick="tambahAnggota()">
            <i data-feather="plus"></i> Tambah Anggota
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <div class="search-section" style="margin-bottom: 15px;">
          <div style="position: relative; max-width: 400px;">
            <i data-feather="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #999;"></i>
            <input 
              type="text" 
              id="searchAnggota" 
              placeholder="Cari anggota (nama, nomor, NIK, telepon)..." 
              value="${searchKeyword}"
              style="width: 100%; padding: 10px 10px 10px 40px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; transition: border-color 0.3s;"
              oninput="searchAnggota(this.value)"
              onfocus="this.style.borderColor='#2E7D32'"
              onblur="this.style.borderColor='#ddd'"
            >
            ${searchKeyword ? `
              <button 
                onclick="clearSearchAnggota()" 
                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #999; padding: 4px;"
                title="Hapus pencarian"
              >
                <i data-feather="x" style="width: 18px; height: 18px;"></i>
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="filter-section" style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i data-feather="filter" style="width: 20px; height: 20px; color: #2E7D32;"></i>
            <label style="font-weight: 600; margin: 0;">Urutkan:</label>
          </div>
          <select id="sortColumn" onchange="changeSortColumn(this.value)" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; min-width: 200px;">
            <option value="nomor_anggota" ${currentSortColumn === 'nomor_anggota' ? 'selected' : ''}>Nomor Anggota</option>
            <option value="nama_lengkap" ${currentSortColumn === 'nama_lengkap' ? 'selected' : ''}>Nama Lengkap</option>
            <option value="tanggal_bergabung" ${currentSortColumn === 'tanggal_bergabung' ? 'selected' : ''}>Tanggal Bergabung</option>
            <option value="status" ${currentSortColumn === 'status' ? 'selected' : ''}>Status</option>
            <option value="created_at" ${currentSortColumn === 'created_at' ? 'selected' : ''}>Terbaru Ditambahkan</option>
          </select>
          <button onclick="toggleSortOrder()" class="btn btn-secondary" style="display: flex; align-items: center; gap: 8px;">
            <i data-feather="${currentSortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}" style="width: 16px; height: 16px;"></i>
            ${currentSortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
          <div style="margin-left: auto; color: #666;">
            ${searchKeyword ? `Ditemukan: <strong>${sortedData.length}</strong> dari ${anggotaData.length} anggota` : `Total: <strong>${sortedData.length}</strong> anggota`}
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Foto</th>
              <th>No. Anggota</th>
              <th>Nama Lengkap</th>
              <th>NIK</th>
              <th>Telepon</th>
              <th>Foto KTP</th>
              <th>Tanggal Bergabung</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${sortedData.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.foto ? `<img src="/uploads/${item.foto}?t=${Date.now()}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2224%22>👤</text></svg>'">` : '👤'}</td>
                <td><strong>${item.nomor_anggota}</strong></td>
                <td>${item.nama_lengkap}</td>
                <td>${item.nik || '-'}</td>
                <td>${item.nomor_telpon || '-'}</td>
                <td style="text-align: center;">
                  ${item.foto_ktp ? `
                    <button class="btn btn-sm btn-info" onclick="viewFotoKTP('${item.foto_ktp}')" title="Lihat Foto KTP">
                      <i data-feather="image"></i> Lihat
                    </button>
                  ` : '<span style="color: #999; font-size: 12px;">Tidak ada</span>'}
                </td>
                <td>${item.tanggal_bergabung ? new Date(item.tanggal_bergabung).toLocaleDateString('id-ID') : '-'}</td>
                <td><span class="badge badge-${item.status === 'aktif' ? 'success' : 'danger'}">${item.status}</span></td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="detailAnggota(${item.id})" title="Detail">
                      <i data-feather="eye"></i>
                      <span class="btn-text">Detail</span>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editAnggota(${item.id})" title="Edit">
                      <i data-feather="edit"></i>
                      <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="hapusAnggota(${item.id})" title="Hapus">
                      <i data-feather="trash-2"></i>
                      <span class="btn-text">Hapus</span>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  feather.replace();
}

// Function to sort anggota data
function sortAnggotaData(data, column, order) {
  return [...data].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';
    
    // Convert to lowercase for string comparison
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    // Compare
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// Function to change sort column
window.changeSortColumn = function(column) {
  currentSortColumn = column;
  renderAnggotaTable();
}

// Function to toggle sort order
window.toggleSortOrder = function() {
  currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  renderAnggotaTable();
}

// Function to search anggota
window.searchAnggota = function(keyword) {
  searchKeyword = keyword;
  renderAnggotaTable(true); // Update only table, not entire page
}

// Function to clear search
window.clearSearchAnggota = function() {
  searchKeyword = '';
  renderAnggotaTable();
}

window.tambahAnggota = function() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Anggota</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="tambahAnggotaForm">
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Anggota *</label>
            <input type="text" name="nomor_anggota" required>
          </div>
          <div class="form-group">
            <label>Nama Lengkap *</label>
            <input type="text" name="nama_lengkap" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>NIK</label>
            <input type="text" name="nik">
          </div>
          <div class="form-group">
            <label>Jenis Kelamin</label>
            <select name="jenis_kelamin">
              <option value="">Pilih</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Tempat Lahir</label>
            <input type="text" name="tempat_lahir">
          </div>
          <div class="form-group">
            <label>Tanggal Lahir</label>
            <input type="date" name="tanggal_lahir">
          </div>
        </div>
        
        <div class="form-group">
          <label>Alamat</label>
          <textarea name="alamat"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Telepon</label>
            <input type="text" name="nomor_telpon">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Username</label>
            <input type="text" name="username">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Pekerjaan</label>
            <input type="text" name="pekerjaan">
          </div>
          <div class="form-group">
            <label>Tanggal Bergabung</label>
            <input type="date" name="tanggal_bergabung" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Foto Profil</label>
            <input type="file" name="foto" accept="image/*" onchange="previewImage(this, 'previewFoto')">
            <div id="previewFoto" style="margin-top: 10px;"></div>
          </div>
          <div class="form-group">
            <label>Foto KTP</label>
            <input type="file" name="foto_ktp" accept="image/*,.pdf" onchange="previewImage(this, 'previewKTP')">
            <small style="color: #666; font-size: 12px;">Format: JPG, PNG, PDF. Max 5MB</small>
            <div id="previewKTP" style="margin-top: 10px;"></div>
          </div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('tambahAnggotaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('/api/anggota', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Anggota berhasil ditambahkan');
        modal.remove();
        window.renderDataAnggota();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  });
};

window.hapusAnggota = async function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
    const result = await API.delete(`/api/anggota/${id}`);
    alert(result.message);
    window.renderDataAnggota();
  }
};

// Bulk Delete All Anggota
window.bulkDeleteAnggota = async function() {
  const confirmation = confirm(
    '⚠️ PERINGATAN KERAS!\n\n' +
    'Anda akan menghapus SEMUA DATA ANGGOTA!\n\n' +
    'Tindakan ini akan:\n' +
    '• Menghapus semua anggota (kecuali yang terkait dengan akun admin)\n' +
    '• TIDAK DAPAT DIBATALKAN\n' +
    '• Data yang terhapus TIDAK DAPAT DIKEMBALIKAN\n\n' +
    'Apakah Anda BENAR-BENAR yakin ingin melanjutkan?'
  );
  
  if (!confirmation) return;
  
  // Double confirmation
  const doubleConfirm = confirm(
    '⚠️ KONFIRMASI TERAKHIR!\n\n' +
    'Ini adalah kesempatan terakhir untuk membatalkan.\n\n' +
    'Klik OK untuk MENGHAPUS SEMUA DATA ANGGOTA\n' +
    'Klik Cancel untuk membatalkan'
  );
  
  if (!doubleConfirm) return;
  
  try {
    const result = await API.delete('/api/anggota/bulk/all');
    alert(`✅ ${result.message}\n\n${result.deleted} anggota berhasil dihapus.`);
    window.renderDataAnggota();
  } catch (error) {
    alert(`❌ Gagal menghapus data: ${error.message}`);
  }
};

// Import Anggota dari Excel
window.importAnggota = async function() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h3 class="modal-title">Import Data Anggota dari Excel</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <div class="modal-body">
        <div class="alert alert-info" style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #1976d2;">
            <i data-feather="info"></i> Panduan Import Excel
          </h4>
          <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Download template Excel terlebih dahulu</li>
            <li>Isi data anggota sesuai kolom yang tersedia</li>
            <li>Kolom wajib: <strong>Nomor Anggota</strong> dan <strong>Nama Lengkap</strong></li>
            <li>Format tanggal: <strong>YYYY-MM-DD</strong> (contoh: 2024-01-15)</li>
            <li>Status: <strong>aktif</strong> atau <strong>nonaktif</strong></li>
            <li>Password default: <strong>nomor anggota</strong></li>
            <li>Upload file Excel yang sudah diisi</li>
          </ol>
        </div>
        
        <div style="margin-bottom: 20px;">
          <button class="btn btn-success" onclick="downloadTemplateAnggota()" style="width: 100%;">
            <i data-feather="download"></i> Download Template Excel
          </button>
        </div>
        
        <form id="formImportAnggota" enctype="multipart/form-data">
          <div class="form-group">
            <label>Upload File Excel *</label>
            <input type="file" name="file" accept=".xlsx,.xls" required>
            <small style="color: #666;">Format: .xlsx atau .xls</small>
          </div>
          
          <div class="btn-group">
            <button type="submit" class="btn btn-primary">
              <i data-feather="upload"></i> Import Data
            </button>
            <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">
              <i data-feather="x"></i> Batal
            </button>
          </div>
        </form>
        
        <div id="importProgress" style="display: none; margin-top: 20px;">
          <div style="text-align: center; padding: 20px;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #2E7D32; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
            <p>Sedang mengimport data...</p>
          </div>
        </div>
        
        <div id="importResult" style="display: none; margin-top: 20px;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  document.getElementById('formImportAnggota').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const progressDiv = document.getElementById('importProgress');
    const resultDiv = document.getElementById('importResult');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
      progressDiv.style.display = 'block';
      resultDiv.style.display = 'none';
      submitBtn.disabled = true;
      
      const response = await fetch('/api/anggota/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      progressDiv.style.display = 'none';
      resultDiv.style.display = 'block';
      
      if (response.ok) {
        let errorHtml = '';
        if (result.results.errors.length > 0) {
          const errorList = result.results.errors.map(err => `<li>${err}</li>`).join('');
          errorHtml = `
            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; color: #d32f2f;">Detail Error (${result.results.errors.length})</summary>
              <ul style="margin: 10px 0 0 20px; max-height: 200px; overflow-y: auto;">
                ${errorList}
              </ul>
            </details>
          `;
        }
        
        resultDiv.innerHTML = `
          <div class="alert alert-success" style="padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #2e7d32;">
              <i data-feather="check-circle"></i> Import Berhasil!
            </h4>
            <p style="margin: 0 0 10px 0;"><strong>Berhasil:</strong> ${result.results.success} anggota</p>
            <p style="margin: 0;"><strong>Gagal:</strong> ${result.results.failed} anggota</p>
            ${errorHtml}
          </div>
        `;
        feather.replace();
        
        // Refresh data anggota
        setTimeout(() => {
          modal.remove();
          renderDataAnggota();
        }, 3000);
      } else {
        resultDiv.innerHTML = `
          <div class="alert alert-danger" style="padding: 15px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #c62828;">
              <i data-feather="x-circle"></i> Import Gagal
            </h4>
            <p style="margin: 0;">${result.error}</p>
          </div>
        `;
        feather.replace();
      }
    } catch (error) {
      progressDiv.style.display = 'none';
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div class="alert alert-danger" style="padding: 15px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #c62828;">
            <i data-feather="x-circle"></i> Terjadi Kesalahan
          </h4>
          <p style="margin: 0;">${error.message}</p>
        </div>
      `;
      feather.replace();
    } finally {
      submitBtn.disabled = false;
    }
  });
};

// Download Template Excel Anggota
window.downloadTemplateAnggota = async function() {
  try {
    const response = await fetch('/api/anggota/template', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Anggota.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      alert('Gagal mendownload template');
    }
  } catch (error) {
    alert('Terjadi kesalahan: ' + error.message);
  }
};

// ===== DATA PENGURUS =====
window.renderDataPengurus = async function() {
  try {
    const pengurus = await API.get('/api/pengurus');
    const pengurusData = Array.isArray(pengurus) ? pengurus : [];
    
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Data Pengurus</h3>
          <div class="btn-group">
            <button class="btn btn-danger" onclick="bulkDeletePengurus()" title="Hapus semua data pengurus">
              <i data-feather="trash-2"></i> Hapus Semua Data
            </button>
            <button class="btn btn-primary" onclick="tambahPengurus()">
              <i data-feather="plus"></i> Tambah Pengurus
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Foto</th>
                <th>No. Anggota</th>
                <th>Nama Lengkap</th>
                <th>Jabatan</th>
                <th>Periode Mulai</th>
                <th>Periode Selesai</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${pengurusData.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 40px;">
                    <i data-feather="inbox" style="width: 48px; height: 48px; color: #ccc;"></i>
                    <p style="margin-top: 10px; color: #999;">Belum ada data pengurus</p>
                  </td>
                </tr>
              ` : pengurusData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.foto ? `<img src="/uploads/${item.foto}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;">` : '👤'}</td>
                  <td>${item.nomor_anggota || '-'}</td>
                  <td>${item.nama_lengkap || '-'}</td>
                  <td><span class="badge badge-info">${item.jabatan}</span></td>
                  <td>${item.periode_mulai ? formatDate(item.periode_mulai) : '-'}</td>
                  <td>${item.periode_selesai ? formatDate(item.periode_selesai) : '-'}</td>
                  <td><span class="badge badge-${item.status === 'aktif' ? 'success' : 'secondary'}">${item.status || 'aktif'}</span></td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-warning" onclick="editPengurus(${item.id})" title="Edit">
                        <i data-feather="edit"></i>
                        <span class="btn-text">Edit</span>
                      </button>
                      <button class="btn btn-sm btn-danger" onclick="deletePengurus(${item.id})" title="Hapus">
                        <i data-feather="trash-2"></i>
                        <span class="btn-text">Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading pengurus data:', error);
    contentArea.innerHTML = `
      <div class="alert alert-danger">
        <i data-feather="alert-circle"></i>
        Terjadi kesalahan saat memuat data pengurus: ${error.message}
      </div>
    `;
    feather.replace();
  }
};

// Bulk Delete Pengurus
window.bulkDeletePengurus = async function() {
  const confirmation = confirm(
    '⚠️ PERINGATAN KERAS!\n\n' +
    'Anda akan menghapus SEMUA DATA PENGURUS!\n\n' +
    'Tindakan ini akan:\n' +
    '• Menghapus semua data pengurus\n' +
    '• TIDAK DAPAT DIBATALKAN\n' +
    '• Data yang terhapus TIDAK DAPAT DIKEMBALIKAN\n\n' +
    'Apakah Anda BENAR-BENAR yakin ingin melanjutkan?'
  );
  
  if (!confirmation) return;
  
  // Double confirmation
  const doubleConfirm = confirm(
    '⚠️ KONFIRMASI TERAKHIR!\n\n' +
    'Ini adalah kesempatan terakhir untuk membatalkan.\n\n' +
    'Klik OK untuk MENGHAPUS SEMUA DATA PENGURUS\n' +
    'Klik Cancel untuk membatalkan'
  );
  
  if (!doubleConfirm) return;
  
  try {
    const result = await API.delete('/api/pengurus/bulk/all');
    alert(`✅ ${result.message}\n\n${result.deleted} data pengurus berhasil dihapus.`);
    window.renderDataPengurus();
  } catch (error) {
    alert(`❌ Gagal menghapus data: ${error.message}`);
  }
};

// Tambah Pengurus (placeholder - bisa dikembangkan lebih lanjut)
window.tambahPengurus = async function() {
  alert('Fitur tambah pengurus akan segera tersedia');
};

// Edit Pengurus (placeholder - bisa dikembangkan lebih lanjut)
window.editPengurus = async function(id) {
  alert('Fitur edit pengurus akan segera tersedia');
};

// Delete Pengurus
window.deletePengurus = async function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus data pengurus ini?')) {
    try {
      const result = await API.delete(`/api/pengurus/${id}`);
      alert(result.message);
      window.renderDataPengurus();
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message);
    }
  }
};

// Simpanan Page - Unified
// Global variables for simpanan filter
let allSimpananData = [];
let simpananFilters = {
  jenis: 'semua',
  anggota: 'semua',
  tanggalDari: '',
  tanggalSampai: '',
  sortBy: 'tanggal_transaksi',
  sortOrder: 'desc'
};

window.renderSimpanan = async function() {
  // Load all simpanan data
  const [pokok, wajib, khusus, sukarela, anggota] = await Promise.all([
    API.get('/api/simpanan/pokok'),
    API.get('/api/simpanan/wajib'),
    API.get('/api/simpanan/khusus'),
    API.get('/api/simpanan/sukarela'),
    API.get('/api/anggota')
  ]);
  
  // Combine all data with jenis label
  allSimpananData = [
    ...pokok.map(s => ({ ...s, jenis_simpanan: 'pokok', jenis_label: 'Simpanan Pokok' })),
    ...wajib.map(s => ({ ...s, jenis_simpanan: 'wajib', jenis_label: 'Simpanan Wajib' })),
    ...khusus.map(s => ({ ...s, jenis_simpanan: 'khusus', jenis_label: 'Simpanan Khusus' })),
    ...sukarela.map(s => ({ ...s, jenis_simpanan: 'sukarela', jenis_label: 'Simpanan Sukarela' }))
  ];
  
  renderSimpananTable(anggota);
}

function renderSimpananTable(anggota) {
  // Apply filters
  let filteredData = filterSimpananData(allSimpananData);
  
  // Calculate total
  const totalJumlah = filteredData.reduce((sum, item) => sum + item.jumlah, 0);
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Transaksi Simpanan</h3>
        <div class="btn-group">
          <button class="btn btn-danger" onclick="showBulkDeleteSimpananMenu()" title="Hapus semua data simpanan">
            <i data-feather="trash-2"></i> Hapus Semua Data
          </button>
          <button class="btn btn-success" onclick="exportSimpananUnified()">
            <i data-feather="download"></i> Export
          </button>
          <button class="btn btn-secondary" onclick="cetakSimpananUnified()">
            <i data-feather="printer"></i> Cetak
          </button>
          <button class="btn btn-info" onclick="showImportSimpananMenu()">
            <i data-feather="upload"></i> Import Excel
          </button>
          <button class="btn btn-primary" onclick="tambahSimpananUnified()">
            <i data-feather="plus"></i> Tambah Transaksi
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <div class="filter-section">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i data-feather="filter" style="width: 20px; height: 20px; color: #2E7D32;"></i>
            <label style="font-weight: 600; margin: 0;">Filter:</label>
          </div>
          
          <select id="filterJenis" onchange="changeSimpananFilter('jenis', this.value)">
            <option value="semua">Semua Jenis</option>
            <option value="pokok" ${simpananFilters.jenis === 'pokok' ? 'selected' : ''}>Simpanan Pokok</option>
            <option value="wajib" ${simpananFilters.jenis === 'wajib' ? 'selected' : ''}>Simpanan Wajib</option>
            <option value="khusus" ${simpananFilters.jenis === 'khusus' ? 'selected' : ''}>Simpanan Khusus</option>
            <option value="sukarela" ${simpananFilters.jenis === 'sukarela' ? 'selected' : ''}>Simpanan Sukarela</option>
          </select>
          
          <select id="filterAnggota" onchange="changeSimpananFilter('anggota', this.value)">
            <option value="semua">Semua Anggota</option>
            ${anggota.map(a => `
              <option value="${a.id}" ${simpananFilters.anggota == a.id ? 'selected' : ''}>
                ${a.nomor_anggota} - ${a.nama_lengkap}
              </option>
            `).join('')}
          </select>
          
          <input type="date" id="filterTanggalDari" value="${simpananFilters.tanggalDari}" 
                 onchange="changeSimpananFilter('tanggalDari', this.value)" 
                 placeholder="Dari Tanggal">
          
          <input type="date" id="filterTanggalSampai" value="${simpananFilters.tanggalSampai}" 
                 onchange="changeSimpananFilter('tanggalSampai', this.value)" 
                 placeholder="Sampai Tanggal">
          
          <select id="sortSimpanan" onchange="changeSimpananFilter('sortBy', this.value)">
            <option value="tanggal_transaksi" ${simpananFilters.sortBy === 'tanggal_transaksi' ? 'selected' : ''}>Tanggal</option>
            <option value="jumlah" ${simpananFilters.sortBy === 'jumlah' ? 'selected' : ''}>Jumlah</option>
            <option value="nama_lengkap" ${simpananFilters.sortBy === 'nama_lengkap' ? 'selected' : ''}>Nama Anggota</option>
          </select>
          
          <button onclick="toggleSimpananSortOrder()" class="btn btn-secondary">
            <i data-feather="${simpananFilters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}"></i>
            ${simpananFilters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
          
          <button onclick="resetSimpananFilter()" class="btn btn-warning" style="margin-left: auto;">
            <i data-feather="refresh-cw"></i> Reset
          </button>
          
          <div style="color: #666; white-space: nowrap;">
            <strong>${filteredData.length}</strong> transaksi | 
            <strong>${formatCurrency(totalJumlah)}</strong>
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Jenis Simpanan</th>
              <th>No. Anggota</th>
              <th>Nama Anggota</th>
              <th>Jumlah</th>
              <th>Metode</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                  <i data-feather="inbox" style="width: 48px; height: 48px; color: #ccc;"></i>
                  <p style="margin-top: 10px; color: #999;">Tidak ada transaksi yang sesuai filter</p>
                </td>
              </tr>
            ` : filteredData.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${formatDate(item.tanggal_transaksi)}</td>
                <td><span class="badge badge-info">${item.jenis_label}</span></td>
                <td>${item.nomor_anggota}</td>
                <td>${item.nama_lengkap}</td>
                <td><strong>${formatCurrency(item.jumlah)}</strong></td>
                <td>${item.metode_pembayaran || '-'}</td>
                <td>${item.keterangan || '-'}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editSimpanan(${item.id}, '${item.jenis_simpanan}')" title="Edit">
                      <i data-feather="edit"></i>
                      <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSimpanan(${item.id}, '${item.jenis_simpanan}')" title="Hapus">
                      <i data-feather="trash-2"></i>
                      <span class="btn-text">Hapus</span>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="cetakStruk(${item.id}, '${item.jenis_simpanan}')" title="Cetak">
                      <i data-feather="printer"></i>
                      <span class="btn-text">Cetak</span>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  feather.replace();
}

function filterSimpananData(data) {
  let filtered = [...data];
  
  // Filter by jenis
  if (simpananFilters.jenis !== 'semua') {
    filtered = filtered.filter(item => item.jenis_simpanan === simpananFilters.jenis);
  }
  
  // Filter by anggota
  if (simpananFilters.anggota !== 'semua') {
    filtered = filtered.filter(item => item.anggota_id == simpananFilters.anggota);
  }
  
  // Filter by date range
  if (simpananFilters.tanggalDari) {
    filtered = filtered.filter(item => item.tanggal_transaksi >= simpananFilters.tanggalDari);
  }
  if (simpananFilters.tanggalSampai) {
    filtered = filtered.filter(item => item.tanggal_transaksi <= simpananFilters.tanggalSampai);
  }
  
  // Sort
  filtered.sort((a, b) => {
    let aVal = a[simpananFilters.sortBy];
    let bVal = b[simpananFilters.sortBy];
    
    if (simpananFilters.sortBy === 'tanggal_transaksi') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return simpananFilters.sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return simpananFilters.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return filtered;
}

window.changeSimpananFilter = async function(filterType, value) {
  simpananFilters[filterType] = value;
  const anggota = await API.get('/api/anggota');
  renderSimpananTable(anggota);
}

window.toggleSimpananSortOrder = async function() {
  simpananFilters.sortOrder = simpananFilters.sortOrder === 'asc' ? 'desc' : 'asc';
  const anggota = await API.get('/api/anggota');
  renderSimpananTable(anggota);
}

window.resetSimpananFilter = async function() {
  simpananFilters = {
    jenis: 'semua',
    anggota: 'semua',
    tanggalDari: '',
    tanggalSampai: '',
    sortBy: 'tanggal_transaksi',
    sortOrder: 'desc'
  };
  const anggota = await API.get('/api/anggota');
  renderSimpananTable(anggota);
}

// Unified Tambah Simpanan with Jenis Dropdown
window.tambahSimpananUnified = function() {
  API.get('/api/anggota').then(anggota => {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Tambah Transaksi Simpanan</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        
        <form id="tambahSimpananForm">
          <div class="form-group">
            <label>Jenis Simpanan *</label>
            <select name="jenis_simpanan" id="jenisSimpananSelect" required>
              <option value="">Pilih Jenis Simpanan</option>
              <option value="pokok">Simpanan Pokok</option>
              <option value="wajib">Simpanan Wajib</option>
              <option value="khusus">Simpanan Khusus</option>
              <option value="sukarela">Simpanan Sukarela</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Anggota *</label>
            <div id="anggotaSelectContainer"></div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Jumlah *</label>
              <input type="number" name="jumlah" required min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Tanggal Transaksi *</label>
              <input type="date" name="tanggal_transaksi" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>
          
          <div class="form-group">
            <label>Metode Pembayaran</label>
            <select name="metode_pembayaran">
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer</option>
              <option value="E-Wallet">E-Wallet</option>
            </select>
          </div>
          
          <div class="form-group" id="jenisSukarelaGroup" style="display: none;">
            <label>Jenis Transaksi</label>
            <select name="jenis">
              <option value="Setoran">Setoran</option>
              <option value="Penarikan">Penarikan</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Keterangan</label>
            <textarea name="keterangan"></textarea>
          </div>
          
          <div class="form-group">
            <label>Bukti Pembayaran (Opsional)</label>
            
            <!-- Tombol pilihan upload -->
            <div class="upload-buttons-container">
              <button type="button" 
                      onclick="triggerFileUploadSimpanan()" 
                      class="btn btn-secondary">
                <i data-feather="upload"></i>
                <span>Pilih File</span>
              </button>
              <button type="button" 
                      onclick="triggerCameraCaptureSimpanan()" 
                      class="btn btn-info">
                <i data-feather="camera"></i>
                <span>Ambil Foto</span>
              </button>
            </div>
            
            <!-- Input file (hidden) -->
            <input type="file" 
                   name="bukti_pembayaran" 
                   id="buktiSimpanan"
                   accept="image/*,.pdf" 
                   onchange="previewBuktiSimpanan(this)"
                   style="display: none;">
            
            <!-- Input camera (hidden) -->
            <input type="file" 
                   id="buktiSimpananCamera"
                   accept="image/*" 
                   capture="environment"
                   onchange="handleCameraCaptureSimpanan(this)"
                   style="display: none;">
            
            <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
              Format: JPG, PNG, PDF. Maksimal 5MB. Upload foto/scan bukti transfer atau struk.
            </small>
            <div id="previewBuktiSimpanan" style="margin-top: 15px;"></div>
          </div>
          
          <div class="btn-group">
            <button type="submit" class="btn btn-primary">Simpan</button>
            <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    feather.replace();
    
    // Initialize searchable select for anggota
    createSearchableAnggotaSelect('anggotaSelectContainer', 'anggota_id', true);
    
    // Show/hide jenis field for sukarela
    const jenisSimpananSelect = document.getElementById('jenisSimpananSelect');
    const jenisSukarelaGroup = document.getElementById('jenisSukarelaGroup');
    
    jenisSimpananSelect.addEventListener('change', (e) => {
      if (e.target.value === 'sukarela') {
        jenisSukarelaGroup.style.display = 'block';
      } else {
        jenisSukarelaGroup.style.display = 'none';
      }
    });
    
    document.getElementById('tambahSimpananForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const jenis = formData.get('jenis_simpanan');
      formData.delete('jenis_simpanan');
      
      // Remove jenis field if not sukarela
      if (jenis !== 'sukarela') {
        formData.delete('jenis');
      }
      
      try {
        const response = await fetch(`/api/simpanan/${jenis}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData // Send FormData directly for file upload
        });
        
        const result = await response.json();
        
        if (response.ok) {
          alert(result.message);
          modal.remove();
          renderSimpanan();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
      }
    });
  });
};

// Keep old function for backward compatibility
window.tambahSimpanan = function(jenis) {
  tambahSimpananUnified();
};

// Edit Simpanan
window.editSimpanan = async function(id, jenis) {
  const simpanan = await API.get(`/api/simpanan/${jenis}`);
  const item = simpanan.find(s => s.id === id);
  const anggota = await API.get('/api/anggota');
  
  const jenisLabel = {
    'pokok': 'Simpanan Pokok',
    'wajib': 'Simpanan Wajib',
    'khusus': 'Simpanan Khusus',
    'sukarela': 'Simpanan Sukarela'
  };
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit ${jenisLabel[jenis]}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editSimpananForm">
        <div class="form-group">
          <label>Anggota *</label>
          <select name="anggota_id" required>
            <option value="">Pilih Anggota</option>
            ${anggota.filter(a => a.status === 'aktif').map(a => `
              <option value="${a.id}" ${a.id === item.anggota_id ? 'selected' : ''}>${a.nomor_anggota} - ${a.nama_lengkap}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Jumlah *</label>
            <input type="number" name="jumlah" value="${item.jumlah}" required min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>Tanggal Transaksi *</label>
            <input type="date" name="tanggal_transaksi" value="${item.tanggal_transaksi}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label>Metode Pembayaran</label>
          <select name="metode_pembayaran">
            <option value="Tunai" ${item.metode_pembayaran === 'Tunai' ? 'selected' : ''}>Tunai</option>
            <option value="Transfer" ${item.metode_pembayaran === 'Transfer' ? 'selected' : ''}>Transfer</option>
            <option value="E-Wallet" ${item.metode_pembayaran === 'E-Wallet' ? 'selected' : ''}>E-Wallet</option>
          </select>
        </div>
        
        ${jenis === 'sukarela' ? `
        <div class="form-group">
          <label>Jenis</label>
          <select name="jenis">
            <option value="Setoran" ${item.jenis === 'Setoran' ? 'selected' : ''}>Setoran</option>
            <option value="Penarikan" ${item.jenis === 'Penarikan' ? 'selected' : ''}>Penarikan</option>
          </select>
        </div>
        ` : ''}
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan">${item.keterangan || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Bukti Pembayaran (Opsional)</label>
          
          ${item.bukti_pembayaran ? `
            <div style="margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
              <small style="color: #666;">Bukti saat ini: ${item.bukti_pembayaran}</small>
              <button type="button" class="btn btn-sm btn-info" onclick="window.open('/uploads/${item.bukti_pembayaran}', '_blank')" style="margin-left: 10px;">
                <i data-feather="eye"></i> Lihat
              </button>
            </div>
          ` : ''}
          
          <!-- Tombol pilihan upload -->
          <div class="upload-buttons-container">
            <button type="button" 
                    onclick="triggerFileUploadSimpananEdit()" 
                    class="btn btn-secondary">
              <i data-feather="upload"></i>
              <span>Pilih File</span>
            </button>
            <button type="button" 
                    onclick="triggerCameraCaptureSimpananEdit()" 
                    class="btn btn-info">
              <i data-feather="camera"></i>
              <span>Ambil Foto</span>
            </button>
          </div>
          
          <!-- Input file (hidden) -->
          <input type="file" 
                 name="bukti_pembayaran" 
                 id="buktiSimpananEdit"
                 accept="image/*,.pdf" 
                 onchange="previewBuktiSimpananEdit(this)"
                 style="display: none;">
          
          <!-- Input camera (hidden) -->
          <input type="file" 
                 id="buktiSimpananCameraEdit"
                 accept="image/*" 
                 capture="environment"
                 onchange="handleCameraCaptureSimpananEdit(this)"
                 style="display: none;">
          
          <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
            Format: JPG, PNG, PDF. Maksimal 5MB. Kosongkan jika tidak ingin mengubah.
          </small>
          <div id="previewBuktiSimpananEdit" style="margin-top: 15px;"></div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Update</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  document.getElementById('editSimpananForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`/api/simpanan/${jenis}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Don't set Content-Type, let browser set it for multipart/form-data
        },
        body: formData // Send FormData directly for file upload
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(result.message);
        modal.remove();
        renderSimpanan();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    }
  });
};

// Delete Simpanan
window.deleteSimpanan = async function(id, jenis) {
  const jenisLabel = {
    'pokok': 'Simpanan Pokok',
    'wajib': 'Simpanan Wajib',
    'khusus': 'Simpanan Khusus',
    'sukarela': 'Simpanan Sukarela'
  };
  
  if (confirm(`Apakah Anda yakin ingin menghapus data ${jenisLabel[jenis]} ini?`)) {
    const result = await API.delete(`/api/simpanan/${jenis}/${id}`);
    alert(result.message);
    renderSimpanan();
  }
};

// Show Bulk Delete Simpanan Menu
window.showBulkDeleteSimpananMenu = function() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">⚠️ Hapus Semua Data Simpanan</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h4 style="color: #856404; margin-top: 0;">
            <i data-feather="alert-triangle" style="width: 24px; height: 24px;"></i>
            PERINGATAN KERAS!
          </h4>
          <p style="color: #856404; margin: 10px 0;">
            Tindakan ini akan menghapus SEMUA data simpanan yang dipilih dan TIDAK DAPAT DIBATALKAN!
          </p>
        </div>
        
        <p style="margin-bottom: 20px; font-weight: 600;">Pilih jenis simpanan yang ingin dihapus:</p>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <button class="btn btn-danger btn-block" onclick="bulkDeleteSimpanan('pokok')" style="justify-content: flex-start; padding: 15px;">
            <i data-feather="trash-2"></i>
            <span>Hapus Semua Simpanan Pokok</span>
          </button>
          
          <button class="btn btn-danger btn-block" onclick="bulkDeleteSimpanan('wajib')" style="justify-content: flex-start; padding: 15px;">
            <i data-feather="trash-2"></i>
            <span>Hapus Semua Simpanan Wajib</span>
          </button>
          
          <button class="btn btn-danger btn-block" onclick="bulkDeleteSimpanan('khusus')" style="justify-content: flex-start; padding: 15px;">
            <i data-feather="trash-2"></i>
            <span>Hapus Semua Simpanan Khusus</span>
          </button>
          
          <button class="btn btn-danger btn-block" onclick="bulkDeleteSimpanan('sukarela')" style="justify-content: flex-start; padding: 15px;">
            <i data-feather="trash-2"></i>
            <span>Hapus Semua Simpanan Sukarela</span>
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  feather.replace();
};

// Bulk Delete Simpanan
window.bulkDeleteSimpanan = async function(jenis) {
  const jenisLabel = {
    'pokok': 'Simpanan Pokok',
    'wajib': 'Simpanan Wajib',
    'khusus': 'Simpanan Khusus',
    'sukarela': 'Simpanan Sukarela'
  };
  
  const confirmation = confirm(
    `⚠️ PERINGATAN KERAS!\n\n` +
    `Anda akan menghapus SEMUA DATA ${jenisLabel[jenis].toUpperCase()}!\n\n` +
    `Tindakan ini:\n` +
    `• Menghapus semua transaksi ${jenisLabel[jenis]}\n` +
    `• TIDAK DAPAT DIBATALKAN\n` +
    `• Data yang terhapus TIDAK DAPAT DIKEMBALIKAN\n\n` +
    `Apakah Anda BENAR-BENAR yakin?`
  );
  
  if (!confirmation) return;
  
  // Double confirmation
  const doubleConfirm = confirm(
    `⚠️ KONFIRMASI TERAKHIR!\n\n` +
    `Klik OK untuk MENGHAPUS SEMUA ${jenisLabel[jenis].toUpperCase()}\n` +
    `Klik Cancel untuk membatalkan`
  );
  
  if (!doubleConfirm) return;
  
  try {
    const result = await API.delete(`/api/simpanan/${jenis}/bulk/all`);
    alert(`✅ ${result.message}`);
    
    // Close modal and refresh
    document.querySelector('.modal')?.remove();
    renderSimpanan();
  } catch (error) {
    alert(`❌ Gagal menghapus data: ${error.message}`);
  }
};

// Partisipasi Anggota
window.renderPartisipasiAnggota = async function() {
  try {
    const partisipasi = await API.get('/api/partisipasi');
    
    // Pastikan partisipasi adalah array
    const partisipasiData = Array.isArray(partisipasi) ? partisipasi : [];
    
    const totalPartisipasi = partisipasiData.reduce((sum, item) => sum + parseFloat(item.jumlah_transaksi || 0), 0);
    const totalTransaksi = partisipasiData.length;
    const totalAnggota = new Set(partisipasiData.map(item => item.anggota_id)).size;
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Partisipasi Anggota</h3>
        <div class="btn-group">
          <button class="btn btn-danger" onclick="bulkDeletePartisipasi()" title="Hapus semua data partisipasi anggota">
            <i data-feather="trash-2"></i> Hapus Semua Data
          </button>
          <button class="btn btn-success" onclick="exportPartisipasiUnified()">
            <i data-feather="download"></i> Export
          </button>
          <button class="btn btn-secondary" onclick="cetakPartisipasiUnified()">
            <i data-feather="printer"></i> Cetak
          </button>
          <button class="btn btn-info" onclick="importPartisipasiExcel()">
            <i data-feather="upload"></i> Import Excel
          </button>
          <button class="btn btn-primary" onclick="tambahPartisipasi()">
            <i data-feather="plus"></i> Tambah Partisipasi
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>No. Anggota</th>
              <th>Nama Anggota</th>
              <th>Unit Usaha</th>
              <th>Jumlah Transaksi</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${partisipasiData.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${formatDate(item.tanggal_transaksi)}</td>
                <td>${item.nomor_anggota}</td>
                <td>${item.nama_lengkap}</td>
                <td>${item.nama_usaha || '-'}</td>
                <td><strong>${formatCurrency(item.jumlah_transaksi)}</strong></td>
                <td>${item.keterangan || '-'}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editPartisipasi(${item.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePartisipasi(${item.id})">Hapus</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  feather.replace();
  } catch (error) {
    console.error('Error loading partisipasi data:', error);
    contentArea.innerHTML = `
      <div class="alert alert-danger">
        <i data-feather="alert-circle"></i>
        Terjadi kesalahan saat memuat data partisipasi: ${error.message}
      </div>
    `;
    feather.replace();
  }
}

window.tambahPartisipasi = async function() {
  const anggota = await API.get('/api/anggota');
  const unitUsaha = await API.get('/api/unit-usaha');
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Partisipasi Anggota</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="tambahPartisipasiForm">
        <div class="form-group">
          <label>Anggota *</label>
          <div id="anggotaSelectContainerPartisipasi"></div>
        </div>
        
        <div class="form-group">
          <label>Unit Usaha</label>
          <select name="unit_usaha_id">
            <option value="">Pilih Unit Usaha</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}">${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Jumlah Transaksi *</label>
            <input type="number" name="jumlah_transaksi" required min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>Tanggal Transaksi *</label>
            <input type="date" name="tanggal_transaksi" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan"></textarea>
        </div>
        
        <div class="form-group">
          <label>Bukti Partisipasi (Opsional)</label>
          
          <!-- Tombol pilihan upload -->
          <div class="upload-buttons-container">
            <button type="button" 
                    onclick="triggerFileUploadPartisipasi()" 
                    class="btn btn-secondary">
              <i data-feather="upload"></i>
              <span>Pilih File</span>
            </button>
            <button type="button" 
                    onclick="triggerCameraCapturePartisipasi()" 
                    class="btn btn-info">
              <i data-feather="camera"></i>
              <span>Ambil Foto</span>
            </button>
          </div>
          
          <!-- Input file (hidden) -->
          <input type="file" 
                 name="bukti_partisipasi" 
                 id="buktiPartisipasi"
                 accept="image/*,.pdf" 
                 onchange="previewBuktiPartisipasi(this)"
                 style="display: none;">
          
          <!-- Input camera (hidden) -->
          <input type="file" 
                 id="buktiPartisipasiCamera"
                 accept="image/*" 
                 capture="environment"
                 onchange="handleCameraCapturePartisipasi(this)"
                 style="display: none;">
          
          <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
            Format: JPG, PNG, PDF. Maksimal 5MB. Upload foto/scan bukti transaksi atau nota.
          </small>
          <div id="previewBuktiPartisipasi" style="margin-top: 15px;"></div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  // Initialize searchable select for anggota
  createSearchableAnggotaSelect('anggotaSelectContainerPartisipasi', 'anggota_id', true);
  
  document.getElementById('tambahPartisipasiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await API.postFormData('/api/partisipasi', formData);
    alert(result.message);
    modal.remove();
    window.renderPartisipasiAnggota();
  });
};

// Edit Partisipasi
window.editPartisipasi = async function(id) {
  const partisipasi = await API.get('/api/partisipasi');
  const item = partisipasi.find(p => p.id === id);
  const anggota = await API.get('/api/anggota');
  const unitUsaha = await API.get('/api/unit-usaha');
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit Partisipasi Anggota</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editPartisipasiForm">
        <div class="form-group">
          <label>Anggota *</label>
          <select name="anggota_id" required>
            <option value="">Pilih Anggota</option>
            ${anggota.filter(a => a.status === 'aktif').map(a => `
              <option value="${a.id}" ${a.id === item.anggota_id ? 'selected' : ''}>${a.nomor_anggota} - ${a.nama_lengkap}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Unit Usaha</label>
          <select name="unit_usaha_id">
            <option value="">Pilih Unit Usaha</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}" ${u.id === item.unit_usaha_id ? 'selected' : ''}>${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Jumlah Transaksi *</label>
            <input type="number" name="jumlah_transaksi" value="${item.jumlah_transaksi}" required min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>Tanggal Transaksi *</label>
            <input type="date" name="tanggal_transaksi" value="${item.tanggal_transaksi}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan">${item.keterangan || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Bukti Partisipasi (Opsional)</label>
          
          ${item.bukti_partisipasi ? `
            <div style="margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
              <small style="color: #666;">Bukti saat ini: ${item.bukti_partisipasi}</small>
              <button type="button" class="btn btn-sm btn-info" onclick="window.open('/uploads/${item.bukti_partisipasi}', '_blank')" style="margin-left: 10px;">
                <i data-feather="eye"></i> Lihat
              </button>
            </div>
          ` : ''}
          
          <!-- Tombol pilihan upload -->
          <div class="upload-buttons-container">
            <button type="button" 
                    onclick="triggerFileUploadPartisipasiEdit()" 
                    class="btn btn-secondary">
              <i data-feather="upload"></i>
              <span>Pilih File</span>
            </button>
            <button type="button" 
                    onclick="triggerCameraCapturePartisipasiEdit()" 
                    class="btn btn-info">
              <i data-feather="camera"></i>
              <span>Ambil Foto</span>
            </button>
          </div>
          
          <!-- Input file (hidden) -->
          <input type="file" 
                 name="bukti_partisipasi" 
                 id="buktiPartisipasiEdit"
                 accept="image/*,.pdf" 
                 onchange="previewBuktiPartisipasiEdit(this)"
                 style="display: none;">
          
          <!-- Input camera (hidden) -->
          <input type="file" 
                 id="buktiPartisipasiCameraEdit"
                 accept="image/*" 
                 capture="environment"
                 onchange="handleCameraCapturePartisipasiEdit(this)"
                 style="display: none;">
          
          <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
            Format: JPG, PNG, PDF. Maksimal 5MB. Kosongkan jika tidak ingin mengubah.
          </small>
          <div id="previewBuktiPartisipasiEdit" style="margin-top: 15px;"></div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Update</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  document.getElementById('editPartisipasiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await API.putFormData(`/api/partisipasi/${id}`, formData);
    alert(result.message);
    modal.remove();
    window.renderPartisipasiAnggota();
  });
};

// Delete Partisipasi
window.deletePartisipasi = async function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus data partisipasi ini?')) {
    const result = await API.delete(`/api/partisipasi/${id}`);
    alert(result.message);
    window.renderPartisipasiAnggota();
  }
};

// Bulk Delete Partisipasi Anggota
window.bulkDeletePartisipasi = async function() {
  const confirmation = confirm(
    '⚠️ PERINGATAN KERAS!\n\n' +
    'Anda akan menghapus SEMUA DATA PARTISIPASI ANGGOTA!\n\n' +
    'Tindakan ini akan:\n' +
    '• Menghapus semua transaksi partisipasi anggota\n' +
    '• TIDAK DAPAT DIBATALKAN\n' +
    '• Data yang terhapus TIDAK DAPAT DIKEMBALIKAN\n\n' +
    'Apakah Anda BENAR-BENAR yakin ingin melanjutkan?'
  );
  
  if (!confirmation) return;
  
  // Double confirmation
  const doubleConfirm = confirm(
    '⚠️ KONFIRMASI TERAKHIR!\n\n' +
    'Ini adalah kesempatan terakhir untuk membatalkan.\n\n' +
    'Klik OK untuk MENGHAPUS SEMUA DATA PARTISIPASI ANGGOTA\n' +
    'Klik Cancel untuk membatalkan'
  );
  
  if (!doubleConfirm) return;
  
  try {
    const result = await API.delete('/api/partisipasi/bulk/all');
    alert(`✅ ${result.message}\n\n${result.deleted} transaksi partisipasi anggota berhasil dihapus.`);
    window.renderPartisipasiAnggota();
  } catch (error) {
    alert(`❌ Gagal menghapus data: ${error.message}`);
  }
};

// Penjualan - Using pages-transaksi.js version with filter (line 638)

window.tambahPenjualan = async function() {
  try {
    const unitUsaha = await API.get('/api/unit-usaha');
    console.log('Unit Usaha loaded:', unitUsaha);
    
    if (!unitUsaha || unitUsaha.length === 0) {
      alert('Belum ada Unit Usaha. Silakan tambahkan Unit Usaha terlebih dahulu.');
      return;
    }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Penjualan</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="tambahPenjualanForm">
        <div class="form-group">
          <label>Unit Usaha *</label>
          <select name="unit_usaha_id" required>
            <option value="">Pilih Unit Usaha</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}">${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Kategori *</label>
          <select name="kategori" required>
            <option value="">Pilih Kategori</option>
            <option value="Barang">Barang</option>
            <option value="Aset">Aset</option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Jumlah Penjualan *</label>
            <input type="number" name="jumlah_penjualan" required min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>HPP (Harga Pokok Penjualan)</label>
            <input type="number" name="hpp" min="0" step="0.01" value="0">
          </div>
        </div>
        
        <div class="form-group">
          <label>Tanggal Transaksi *</label>
          <input type="date" name="tanggal_transaksi" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan"></textarea>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('tambahPenjualanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const result = await API.post('/api/transaksi/penjualan', data);
    alert(result.message);
    modal.remove();
    window.renderPenjualan();
  });
  } catch (error) {
    console.error('Error loading unit usaha:', error);
    alert('Gagal memuat data Unit Usaha: ' + error.message);
  }
};

// Edit Penjualan
window.editPenjualan = async function(id) {
  try {
    const penjualan = await API.get('/api/transaksi/penjualan');
    const penjualanData = Array.isArray(penjualan) ? penjualan : [];
    const item = penjualanData.find(p => p.id === id);
    const unitUsaha = await API.get('/api/unit-usaha');
    
    if (!unitUsaha || unitUsaha.length === 0) {
      alert('Belum ada Unit Usaha. Silakan tambahkan Unit Usaha terlebih dahulu.');
      return;
    }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit Penjualan</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editPenjualanForm">
        <div class="form-group">
          <label>Unit Usaha *</label>
          <select name="unit_usaha_id" required>
            <option value="">Pilih Unit Usaha</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}" ${u.id === item.unit_usaha_id ? 'selected' : ''}>${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Kategori *</label>
          <select name="kategori" required>
            <option value="Barang" ${item.kategori === 'Barang' ? 'selected' : ''}>Barang</option>
            <option value="Aset" ${item.kategori === 'Aset' ? 'selected' : ''}>Aset</option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Jumlah Penjualan *</label>
            <input type="number" name="jumlah_penjualan" value="${item.jumlah_penjualan}" required min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>HPP (Harga Pokok Penjualan)</label>
            <input type="number" name="hpp" value="${item.hpp || 0}" min="0" step="0.01">
          </div>
        </div>
        
        <div class="form-group">
          <label>Tanggal Transaksi *</label>
          <input type="date" name="tanggal_transaksi" value="${item.tanggal_transaksi}" required>
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan">${item.keterangan || ''}</textarea>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Update</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('editPenjualanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const result = await API.put(`/api/transaksi/penjualan/${id}`, data);
    alert(result.message);
    modal.remove();
    window.renderPenjualan();
  });
  } catch (error) {
    console.error('Error editing penjualan:', error);
    alert('Gagal memuat data: ' + error.message);
  }
};

// Delete Penjualan
window.deletePenjualan = async function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus data penjualan ini?')) {
    const result = await API.delete(`/api/transaksi/penjualan/${id}`);
    alert(result.message);
    window.renderPenjualan();
  }
};

// Pengeluaran - Using pages-transaksi.js version with filter (line 787)

window.tambahPengeluaran = async function() {
  try {
    const unitUsaha = await API.get('/api/unit-usaha');
    console.log('Unit Usaha loaded:', unitUsaha);
    
    if (!unitUsaha || unitUsaha.length === 0) {
      alert('Belum ada Unit Usaha. Silakan tambahkan Unit Usaha terlebih dahulu di menu Data Unit Usaha.');
      return;
    }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Pengeluaran</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="tambahPengeluaranForm">
        <div class="form-group">
          <label>Unit Usaha</label>
          <select name="unit_usaha_id">
            <option value="">Umum</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}">${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Kategori *</label>
            <select name="kategori" required>
              <option value="">Pilih Kategori</option>
              <option value="Gaji Karyawan">Gaji Karyawan</option>
              <option value="Operasional">Operasional</option>
              <option value="Pembelian Barang">Pembelian Barang</option>
              <option value="Pembelian Aset & Inventaris">Pembelian Aset & Inventaris</option>
              <option value="Listrik & Air">Listrik & Air</option>
              <option value="Transportasi">Transportasi</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Qty (Jumlah Item) *</label>
            <input type="number" id="qtyPengeluaran" name="qty" required min="1" step="1" value="1">
          </div>
          <div class="form-group">
            <label>Harga Satuan *</label>
            <input type="number" id="hargaPengeluaran" name="harga" required min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>Total Jumlah *</label>
            <input type="number" id="jumlahPengeluaran" name="jumlah" required min="0" step="0.01" readonly style="background: #f0f0f0;">
          </div>
        </div>
        
        <div class="form-group">
          <label>Tanggal Transaksi *</label>
          <input type="date" name="tanggal_transaksi" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan"></textarea>
        </div>
        
        <div class="form-group">
          <label>Bukti Pengeluaran (Opsional)</label>
          
          <!-- Tombol pilihan upload -->
          <div class="upload-buttons-container">
            <button type="button" 
                    onclick="triggerFileUploadPengeluaran()" 
                    class="btn btn-secondary">
              <i data-feather="upload"></i>
              <span>Pilih File</span>
            </button>
            <button type="button" 
                    onclick="triggerCameraCapturePengeluaran()" 
                    class="btn btn-info">
              <i data-feather="camera"></i>
              <span>Ambil Foto</span>
            </button>
          </div>
          
          <!-- Input file (hidden) -->
          <input type="file" 
                 name="bukti_pengeluaran" 
                 id="buktiPengeluaran"
                 accept="image/*,.pdf" 
                 onchange="previewBuktiPengeluaran(this)"
                 style="display: none;">
          
          <!-- Input camera (hidden) -->
          <input type="file" 
                 id="buktiPengeluaranCamera"
                 accept="image/*" 
                 capture="environment"
                 onchange="handleCameraCapturePengeluaran(this)"
                 style="display: none;">
          
          <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
            Format: JPG, PNG, PDF. Maksimal 5MB. Upload foto/scan nota atau kwitansi.
          </small>
          <div id="previewBuktiPengeluaran" style="margin-top: 15px;"></div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  // Auto-calculate jumlah
  const qtyInput = document.getElementById('qtyPengeluaran');
  const hargaInput = document.getElementById('hargaPengeluaran');
  const jumlahInput = document.getElementById('jumlahPengeluaran');
  
  function calculateJumlah() {
    const qty = parseFloat(qtyInput.value) || 0;
    const harga = parseFloat(hargaInput.value) || 0;
    jumlahInput.value = (qty * harga).toFixed(2);
  }
  
  qtyInput.addEventListener('input', calculateJumlah);
  hargaInput.addEventListener('input', calculateJumlah);
  
  document.getElementById('tambahPengeluaranForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await API.postFormData('/api/transaksi/pengeluaran', formData);
    alert(result.message);
    modal.remove();
    window.renderPengeluaran();
  });
  
  } catch (error) {
    console.error('Error loading unit usaha:', error);
    alert('Gagal memuat data Unit Usaha: ' + error.message);
  }
};

// Edit Pengeluaran
window.editPengeluaran = async function(id) {
  try {
    const pengeluaran = await API.get('/api/transaksi/pengeluaran');
    const item = pengeluaran.find(p => p.id === id);
    const unitUsaha = await API.get('/api/unit-usaha');
    
    if (!unitUsaha || unitUsaha.length === 0) {
      alert('Belum ada Unit Usaha. Silakan tambahkan Unit Usaha terlebih dahulu.');
      return;
    }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit Pengeluaran</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editPengeluaranForm">
        <div class="form-group">
          <label>Unit Usaha</label>
          <select name="unit_usaha_id">
            <option value="">Umum</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}" ${u.id === item.unit_usaha_id ? 'selected' : ''}>${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Kategori *</label>
            <select name="kategori" required>
              <option value="Gaji Karyawan" ${item.kategori === 'Gaji Karyawan' ? 'selected' : ''}>Gaji Karyawan</option>
              <option value="Operasional" ${item.kategori === 'Operasional' ? 'selected' : ''}>Operasional</option>
              <option value="Pembelian Barang" ${item.kategori === 'Pembelian Barang' ? 'selected' : ''}>Pembelian Barang</option>
              <option value="Pembelian Aset & Inventaris" ${item.kategori === 'Pembelian Aset & Inventaris' || item.kategori === 'Pembelian Aset' ? 'selected' : ''}>Pembelian Aset & Inventaris</option>
              <option value="Listrik & Air" ${item.kategori === 'Listrik & Air' ? 'selected' : ''}>Listrik & Air</option>
              <option value="Transportasi" ${item.kategori === 'Transportasi' ? 'selected' : ''}>Transportasi</option>
              <option value="Lain-lain" ${item.kategori === 'Lain-lain' ? 'selected' : ''}>Lain-lain</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Qty (Jumlah Item) *</label>
            <input type="number" id="qtyPengeluaranEdit" name="qty" value="${item.qty || 1}" required min="1" step="1">
          </div>
          <div class="form-group">
            <label>Harga Satuan *</label>
            <input type="number" id="hargaPengeluaranEdit" name="harga" value="${item.harga || (item.jumlah / (item.qty || 1))}" required min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>Total Jumlah *</label>
            <input type="number" id="jumlahPengeluaranEdit" name="jumlah" value="${item.jumlah}" required min="0" step="0.01" readonly style="background: #f0f0f0;">
          </div>
        </div>
        
        <div class="form-group">
          <label>Tanggal Transaksi *</label>
          <input type="date" name="tanggal_transaksi" value="${item.tanggal_transaksi}" required>
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan">${item.keterangan || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Bukti Pengeluaran (Opsional)</label>
          
          ${item.bukti_pengeluaran ? `
            <div style="margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
              <small style="color: #666;">Bukti saat ini: ${item.bukti_pengeluaran}</small>
              <button type="button" class="btn btn-sm btn-info" onclick="window.open('/uploads/${item.bukti_pengeluaran}', '_blank')" style="margin-left: 10px;">
                <i data-feather="eye"></i> Lihat
              </button>
            </div>
          ` : ''}
          
          <!-- Tombol pilihan upload -->
          <div class="upload-buttons-container">
            <button type="button" 
                    onclick="triggerFileUploadPengeluaranEdit()" 
                    class="btn btn-secondary">
              <i data-feather="upload"></i>
              <span>Pilih File</span>
            </button>
            <button type="button" 
                    onclick="triggerCameraCapturePengeluaranEdit()" 
                    class="btn btn-info">
              <i data-feather="camera"></i>
              <span>Ambil Foto</span>
            </button>
          </div>
          
          <!-- Input file (hidden) -->
          <input type="file" 
                 name="bukti_pengeluaran" 
                 id="buktiPengeluaranEdit"
                 accept="image/*,.pdf" 
                 onchange="previewBuktiPengeluaranEdit(this)"
                 style="display: none;">
          
          <!-- Input camera (hidden) -->
          <input type="file" 
                 id="buktiPengeluaranCameraEdit"
                 accept="image/*" 
                 capture="environment"
                 onchange="handleCameraCapturePengeluaranEdit(this)"
                 style="display: none;">
          
          <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
            Format: JPG, PNG, PDF. Maksimal 5MB. Kosongkan jika tidak ingin mengubah.
          </small>
          <div id="previewBuktiPengeluaranEdit" style="margin-top: 15px;"></div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Update</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  feather.replace();
  
  // Auto-calculate jumlah for edit form
  const qtyInputEdit = document.getElementById('qtyPengeluaranEdit');
  const hargaInputEdit = document.getElementById('hargaPengeluaranEdit');
  const jumlahInputEdit = document.getElementById('jumlahPengeluaranEdit');
  
  function calculateJumlahEdit() {
    const qty = parseFloat(qtyInputEdit.value) || 0;
    const harga = parseFloat(hargaInputEdit.value) || 0;
    jumlahInputEdit.value = (qty * harga).toFixed(2);
  }
  
  qtyInputEdit.addEventListener('input', calculateJumlahEdit);
  hargaInputEdit.addEventListener('input', calculateJumlahEdit);
  
  document.getElementById('editPengeluaranForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await API.putFormData(`/api/transaksi/pengeluaran/${id}`, formData);
    alert(result.message);
    modal.remove();
    window.renderPengeluaran();
  });
  } catch (error) {
    console.error('Error editing pengeluaran:', error);
    alert('Gagal memuat data: ' + error.message);
  }
};

// Delete Pengeluaran
window.deletePengeluaran = async function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) {
    const result = await API.delete(`/api/transaksi/pengeluaran/${id}`);
    alert(result.message);
    window.renderPengeluaran();
  }
};

// Pendapatan Lain - Using pages-transaksi.js version

// SHU Page
window.renderSHU = async function() {
  const tahun = new Date().getFullYear();
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Sisa Hasil Usaha (SHU)</h3>
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 16px; border-radius: 8px; color: white; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">📊 Formula Perhitungan SHU</h4>
        <p style="margin: 0; font-size: 13px; opacity: 0.95;">
          <strong>SHU Tahun Berjalan</strong> = Laba Kotor - Biaya Operasional<br>
          <em style="font-size: 12px;">Catatan: Pembelian Barang dan Pembelian Aset tidak termasuk dalam biaya operasional</em>
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label>Tahun:</label>
        <select id="tahunSHU" style="padding: 8px; border-radius: 8px; border: 2px solid #e0e0e0; margin-left: 10px;">
          ${Array.from({length: 10}, (_, i) => tahun + 5 - i).map(y => `
            <option value="${y}" ${y === tahun ? 'selected' : ''}>${y}</option>
          `).join('')}
        </select>
        <button class="btn btn-primary" onclick="aturKomponenSHU()" style="margin-left: 10px;">Atur Komponen SHU</button>
        <button class="btn btn-success" onclick="hitungSHU()" style="margin-left: 10px;">Hitung SHU</button>
      </div>
      
      <div id="shuContent">
        <div class="loading">Memuat data SHU...</div>
      </div>
    </div>
  `;
  
  document.getElementById('tahunSHU').addEventListener('change', () => {
    loadSHUData();
  });
  
  loadSHUData();
}

async function loadSHUData() {
  const tahun = document.getElementById('tahunSHU').value;
  console.log('Loading SHU data for tahun:', tahun);
  
  // Add timestamp to prevent caching
  const timestamp = new Date().getTime();
  const komponen = await API.get(`/api/shu/komponen/${tahun}?t=${timestamp}`);
  const anggotaSHU = await API.get(`/api/shu/anggota/${tahun}?t=${timestamp}`);
  
  console.log('Loaded komponen:', komponen);
  console.log('Loaded anggotaSHU count:', anggotaSHU.length);
  
  const shuContent = document.getElementById('shuContent');
  
  if (komponen && komponen.id) {
    const totalPersentase = parseFloat(komponen.cadangan || 0) + parseFloat(komponen.jasa_simpanan || 0) + 
                           parseFloat(komponen.jasa_transaksi || 0) + parseFloat(komponen.pengurus_pengawas || 0) + 
                           parseFloat(komponen.pegawai || 0) + parseFloat(komponen.dana_pendidikan || 0) + 
                           parseFloat(komponen.dana_sosial || 0) + parseFloat(komponen.dana_pengembangan || 0);
    
    // Hitung total SHU yang dibagikan ke anggota
    const totalSHUDibagikan = anggotaSHU.reduce((sum, item) => sum + (item.total_shu || 0), 0);
    const totalSHUSimpanan = anggotaSHU.reduce((sum, item) => sum + (item.shu_simpanan || 0), 0);
    const totalSHUTransaksi = anggotaSHU.reduce((sum, item) => sum + (item.shu_transaksi || 0), 0);
    const totalAnggota = anggotaSHU.length;
    const rataSHU = totalAnggota > 0 ? totalSHUDibagikan / totalAnggota : 0;
    
    // Hitung SHU Tahun Berjalan (dari komponen.shu_tahun_berjalan atau hitung dari API)
    // Untuk sementara kita ambil dari total yang sudah dibagikan dibagi dengan persentase yang dibagikan ke anggota
    const persentaseDibagikanKeAnggota = parseFloat(komponen.jasa_simpanan || 0) + parseFloat(komponen.jasa_transaksi || 0);
    const shuTahunBerjalan = persentaseDibagikanKeAnggota > 0 ? (totalSHUDibagikan / persentaseDibagikanKeAnggota) * 100 : 0;
    
    // Hitung SHU per komponen berdasarkan persentase
    const shuCadangan = (shuTahunBerjalan * parseFloat(komponen.cadangan || 0)) / 100;
    const shuPengurusPengawas = (shuTahunBerjalan * parseFloat(komponen.pengurus_pengawas || 0)) / 100;
    const shuPegawai = (shuTahunBerjalan * parseFloat(komponen.pegawai || 0)) / 100;
    const shuDanaPendidikan = (shuTahunBerjalan * parseFloat(komponen.dana_pendidikan || 0)) / 100;
    const shuDanaSosial = (shuTahunBerjalan * parseFloat(komponen.dana_sosial || 0)) / 100;
    const shuDanaPengembangan = (shuTahunBerjalan * parseFloat(komponen.dana_pengembangan || 0)) / 100;
    
    // Total SHU = SHU yang dibagikan + semua komponen lainnya
    const totalSHUKeseluruhan = shuCadangan + totalSHUSimpanan + totalSHUTransaksi + shuPengurusPengawas + shuPegawai + shuDanaPendidikan + shuDanaSosial + shuDanaPengembangan;
    
    shuContent.innerHTML = `
      ${anggotaSHU.length > 0 ? `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="stat-card" style="border-left: 4px solid #FFD700;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Total Anggota</div>
              <div class="stat-value" style="color: #FFD700;">${totalAnggota}</div>
              <div class="stat-label">Penerima SHU</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #FFA500);">
              <i data-feather="users" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #667eea;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Total SHU</div>
              <div class="stat-value" style="color: #667eea;">${formatCurrency(totalSHUKeseluruhan)}</div>
              <div class="stat-label">Seluruh Komponen</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <i data-feather="dollar-sign" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #9B59B6;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Cadangan</div>
              <div class="stat-value" style="color: #9B59B6;">${formatCurrency(shuCadangan)}</div>
              <div class="stat-label">${komponen.cadangan}% dari SHU</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #9B59B6, #8E44AD);">
              <i data-feather="shield" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #00C9A7;">
          <div class="stat-header">
            <div>
              <div class="stat-title">SHU Simpanan</div>
              <div class="stat-value" style="color: #00C9A7;">${formatCurrency(totalSHUSimpanan)}</div>
              <div class="stat-label">Jasa Partisipasi Simpanan</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #00C9A7, #00B894);">
              <i data-feather="trending-up" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #4ECDC4;">
          <div class="stat-header">
            <div>
              <div class="stat-title">SHU Transaksi</div>
              <div class="stat-value" style="color: #4ECDC4;">${formatCurrency(totalSHUTransaksi)}</div>
              <div class="stat-label">Jasa Partisipasi Transaksi</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #4ECDC4, #44A08D);">
              <i data-feather="shopping-cart" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #E67E22;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Pengurus & Pengawas</div>
              <div class="stat-value" style="color: #E67E22;">${formatCurrency(shuPengurusPengawas)}</div>
              <div class="stat-label">${komponen.pengurus_pengawas}% dari SHU</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #E67E22, #D35400);">
              <i data-feather="briefcase" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #3498DB;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Pegawai</div>
              <div class="stat-value" style="color: #3498DB;">${formatCurrency(shuPegawai)}</div>
              <div class="stat-label">${komponen.pegawai}% dari SHU</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #3498DB, #2980B9);">
              <i data-feather="user-check" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #1ABC9C;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Dana Pendidikan</div>
              <div class="stat-value" style="color: #1ABC9C;">${formatCurrency(shuDanaPendidikan)}</div>
              <div class="stat-label">${komponen.dana_pendidikan}% dari SHU</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #1ABC9C, #16A085);">
              <i data-feather="book-open" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #E74C3C;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Dana Sosial</div>
              <div class="stat-value" style="color: #E74C3C;">${formatCurrency(shuDanaSosial)}</div>
              <div class="stat-label">${komponen.dana_sosial}% dari SHU</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #E74C3C, #C0392B);">
              <i data-feather="heart" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card" style="border-left: 4px solid #F39C12;">
          <div class="stat-header">
            <div>
              <div class="stat-title">Dana Pengembangan</div>
              <div class="stat-value" style="color: #F39C12;">${formatCurrency(shuDanaPengembangan)}</div>
              <div class="stat-label">${komponen.dana_pengembangan}% dari SHU</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #F39C12, #E67E22);">
              <i data-feather="trending-up" style="color: white; width: 28px; height: 28px;"></i>
            </div>
          </div>
        </div>
      </div>
      ` : ''}
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4 style="color: var(--primary-green); margin: 0;">Komponen SHU Tahun ${tahun}</h4>
        <button id="btnEditKomponenSHU" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
          <i data-feather="edit-2" style="width: 16px; height: 16px;"></i> Edit Komponen
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Komponen</th>
              <th>Persentase</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Cadangan</td><td>${komponen.cadangan}%</td></tr>
            <tr><td>Jasa Partisipasi Simpanan</td><td>${komponen.jasa_simpanan}%</td></tr>
            <tr><td>Jasa Partisipasi Transaksi</td><td>${komponen.jasa_transaksi}%</td></tr>
            <tr><td>SHU Pengurus & Pengawas</td><td>${komponen.pengurus_pengawas}%</td></tr>
            <tr><td>SHU Pegawai</td><td>${komponen.pegawai}%</td></tr>
            <tr><td>Dana Pendidikan</td><td>${komponen.dana_pendidikan}%</td></tr>
            <tr><td>Dana Sosial</td><td>${komponen.dana_sosial}%</td></tr>
            <tr><td>Dana Pengembangan</td><td>${komponen.dana_pengembangan}%</td></tr>
            <tr style="font-weight: bold; background: #f8f9fa;">
              <td>Total</td>
              <td>${totalPersentase}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      ${anggotaSHU.length > 0 ? `
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 30px 0 15px;">
          <h4 style="color: var(--primary-green); margin: 0;">SHU Per Anggota</h4>
          <div>
            <button class="btn btn-info" onclick="cetakSHUPerAnggota(${tahun})" style="margin-right: 10px;">
              <i data-feather="printer"></i> Cetak
            </button>
            <button class="btn btn-success" onclick="exportSHU(${tahun})" style="margin-right: 10px;">
              <i data-feather="download"></i> Export Excel
            </button>
            <button class="btn btn-danger" onclick="resetSHU(${tahun})">
              <i data-feather="refresh-cw"></i> Reset SHU
            </button>
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>No. Anggota</th>
                <th>Nama Anggota</th>
                <th>SHU Simpanan</th>
                <th>SHU Transaksi</th>
                <th>Total SHU</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${anggotaSHU.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.nomor_anggota}</td>
                  <td>${item.nama_lengkap}</td>
                  <td>${formatCurrency(item.shu_simpanan)}</td>
                  <td>${formatCurrency(item.shu_transaksi)}</td>
                  <td><strong>${formatCurrency(item.total_shu)}</strong></td>
                  <td>
                    <button class="btn btn-sm btn-info" onclick="cetakStrukSHU(${item.anggota_id}, ${tahun})">
                      <i data-feather="printer"></i> Cetak
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="margin-top: 20px; color: #666;">Belum ada data SHU anggota. Silakan hitung SHU terlebih dahulu.</p>'}
    `;
    feather.replace();
    
    // Attach event listener untuk tombol Edit Komponen
    const btnEdit = document.getElementById('btnEditKomponenSHU');
    if (btnEdit) {
      btnEdit.addEventListener('click', window.editKomponenSHU);
    }
  } else {
    shuContent.innerHTML = '<p style="color: #666;">Komponen SHU belum diatur untuk tahun ini. Silakan atur komponen SHU terlebih dahulu.</p>';
  }
}

window.editKomponenSHU = async function() {
  console.log('editKomponenSHU called');
  try {
    const tahun = document.getElementById('tahunSHU').value;
    console.log('Tahun:', tahun);
    const anggotaSHU = await API.get(`/api/shu/anggota/${tahun}`);
    
    // Peringatan jika SHU sudah dihitung
    if (anggotaSHU.length > 0) {
      if (!confirm('⚠️ PERINGATAN!\n\nSHU untuk tahun ini sudah dihitung dan dibagikan ke anggota.\n\nJika Anda mengubah komponen SHU, Anda perlu menghitung ulang SHU untuk menerapkan perubahan.\n\nLanjutkan edit komponen SHU?')) {
        return;
      }
    }
    
    const komponen = await API.get(`/api/shu/komponen/${tahun}`);
    console.log('Komponen data:', komponen);
    
    if (!komponen || !komponen.id) {
      alert('Komponen SHU belum diatur untuk tahun ini. Silakan atur komponen SHU terlebih dahulu menggunakan tombol "Atur Komponen SHU".');
      return;
    }
    
    console.log('Opening edit modal...');
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit Komponen SHU Tahun ${tahun}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editKomponenSHUForm">
        <p style="color: #666; margin-bottom: 20px;">Masukkan persentase untuk setiap komponen (total harus 100%)</p>
        
        <div class="form-row">
          <div class="form-group">
            <label>Cadangan (%)</label>
            <input type="number" name="cadangan" value="${komponen.cadangan || 40}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>Jasa Partisipasi Simpanan (%)</label>
            <input type="number" name="jasa_simpanan" value="${komponen.jasa_simpanan || 25}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Jasa Partisipasi Transaksi (%)</label>
            <input type="number" name="jasa_transaksi" value="${komponen.jasa_transaksi || 15}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>SHU Pengurus & Pengawas (%)</label>
            <input type="number" name="pengurus_pengawas" value="${komponen.pengurus_pengawas || 5}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>SHU Pegawai (%)</label>
            <input type="number" name="pegawai" value="${komponen.pegawai || 5}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>Dana Pendidikan (%)</label>
            <input type="number" name="dana_pendidikan" value="${komponen.dana_pendidikan || 5}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Dana Sosial (%)</label>
            <input type="number" name="dana_sosial" value="${komponen.dana_sosial || 3}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>Dana Pengembangan (%)</label>
            <input type="number" name="dana_pengembangan" value="${komponen.dana_pengembangan || 2}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <input type="hidden" name="tahun" value="${tahun}">
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('editKomponenSHUForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    console.log('Form data:', data);
    
    // Validasi total persentase
    const total = Object.keys(data).reduce((sum, key) => {
      if (key !== 'tahun') return sum + parseFloat(data[key]);
      return sum;
    }, 0);
    console.log('Total persentase:', total);
    
    if (Math.abs(total - 100) > 0.01) {
      alert(`Total persentase harus 100%. Saat ini: ${total.toFixed(2)}%`);
      return;
    }
    
    try {
      console.log('Sending data to API:', data);
      const result = await API.post('/api/shu/komponen', data);
      console.log('API response:', result);
      alert(result.message || 'Komponen SHU berhasil diperbarui!');
      modal.remove();
      console.log('Reloading SHU data...');
      await loadSHUData();
      console.log('SHU data reloaded');
    } catch (error) {
      console.error('Error updating komponen SHU:', error);
      alert('Gagal memperbarui komponen SHU: ' + (error.message || 'Terjadi kesalahan'));
    }
  });
  } catch (error) {
    console.error('Error in editKomponenSHU:', error);
    alert('Terjadi kesalahan: ' + (error.message || 'Tidak dapat membuka form edit'));
  }
};

window.aturKomponenSHU = async function() {
  const tahun = document.getElementById('tahunSHU').value;
  const komponen = await API.get(`/api/shu/komponen/${tahun}`);
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Atur Komponen SHU Tahun ${tahun}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="komponenSHUForm">
        <p style="color: #666; margin-bottom: 20px;">Masukkan persentase untuk setiap komponen (total harus 100%)</p>
        
        <div class="form-row">
          <div class="form-group">
            <label>Cadangan (%)</label>
            <input type="number" name="cadangan" value="${komponen.cadangan || 40}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>Jasa Partisipasi Simpanan (%)</label>
            <input type="number" name="jasa_simpanan" value="${komponen.jasa_simpanan || 25}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Jasa Partisipasi Transaksi (%)</label>
            <input type="number" name="jasa_transaksi" value="${komponen.jasa_transaksi || 15}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>SHU Pengurus & Pengawas (%)</label>
            <input type="number" name="pengurus_pengawas" value="${komponen.pengurus_pengawas || 5}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>SHU Pegawai (%)</label>
            <input type="number" name="pegawai" value="${komponen.pegawai || 5}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>Dana Pendidikan (%)</label>
            <input type="number" name="dana_pendidikan" value="${komponen.dana_pendidikan || 5}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Dana Sosial (%)</label>
            <input type="number" name="dana_sosial" value="${komponen.dana_sosial || 3}" step="0.01" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>Dana Pengembangan (%)</label>
            <input type="number" name="dana_pengembangan" value="${komponen.dana_pengembangan || 2}" step="0.01" min="0" max="100" required>
          </div>
        </div>
        
        <input type="hidden" name="tahun" value="${tahun}">
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('komponenSHUForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Validasi total persentase
    const total = Object.keys(data).reduce((sum, key) => {
      if (key !== 'tahun') return sum + parseFloat(data[key]);
      return sum;
    }, 0);
    
    if (Math.abs(total - 100) > 0.01) {
      alert(`Total persentase harus 100%. Saat ini: ${total.toFixed(2)}%`);
      return;
    }
    
    const result = await API.post('/api/shu/komponen', data);
    alert(result.message);
    modal.remove();
    loadSHUData();
  });
};

window.hitungSHU = async function() {
  const tahun = document.getElementById('tahunSHU').value;
  
  // Tampilkan dialog untuk memilih periode
  const periodeChoice = confirm(
    `Pilih periode untuk perhitungan SHU:\n\n` +
    `• OK = Seluruh Tahun (akumulasi semua data)\n` +
    `• Cancel = Tahun ${tahun} saja\n\n` +
    `Rekomendasi: Pilih "Seluruh Tahun" untuk SHU yang lebih akurat`
  );
  
  const periode = periodeChoice ? 'seluruh' : 'tahunan';
  const periodeText = periodeChoice ? 'Seluruh Tahun' : `Tahun ${tahun}`;
  
  if (confirm(`Hitung SHU untuk ${periodeText}? Proses ini akan menghitung ulang SHU semua anggota.`)) {
    try {
      // Kirim request dengan parameter periode
      const result = await API.post(`/api/shu/hitung/${tahun}`, { periode });
      
      // Tampilkan hasil dengan detail lengkap
      const message = 
        `${result.message}\n\n` +
        `📊 DETAIL PERHITUNGAN SHU:\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 Total Penjualan: ${formatCurrency(result.totalPenjualan)}\n` +
        `💵 Total Pendapatan Lain: ${formatCurrency(result.totalPendapatanLain)}\n` +
        `📈 Total Pendapatan: ${formatCurrency(result.totalPendapatan)}\n` +
        `📉 HPP: ${formatCurrency(result.totalHPP)}\n` +
        `💚 Laba Kotor: ${formatCurrency(result.labaKotor)}\n` +
        `💸 Biaya Operasional: ${formatCurrency(result.biayaOperasional)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎯 SHU (Sisa Hasil Usaha): ${formatCurrency(result.keuntunganBersih)}\n` +
        `👥 Total Anggota Aktif: ${result.totalAnggota}\n` +
        `📅 Periode: ${result.periode || periodeText}\n\n` +
        `📝 Formula: SHU = Laba Kotor - Biaya Operasional\n` +
        `📝 Catatan: Pembelian Barang & Aset tidak termasuk biaya operasional`;
      
      alert(message);
      loadSHUData();
      
    } catch (error) {
      console.error('Error calculating SHU:', error);
      alert(`Gagal menghitung SHU: ${error.message}`);
    }
  }
};

window.resetSHU = async function(tahun) {
  if (confirm(`⚠️ PERINGATAN!\n\nApakah Anda yakin ingin mereset SHU tahun ${tahun}?\n\nSemua data SHU per anggota untuk tahun ${tahun} akan dihapus dan tidak dapat dikembalikan!\n\nKlik OK untuk melanjutkan atau Cancel untuk membatalkan.`)) {
    try {
      const result = await API.delete(`/api/shu/reset/${tahun}`);
      alert(`✅ ${result.message}\n${result.deleted} data SHU berhasil dihapus.`);
      loadSHUData();
    } catch (error) {
      alert('❌ Gagal mereset SHU: ' + error.message);
    }
  }
};

window.cetakStrukSHU = async function(anggotaId, tahun) {
  try {
    // Get data SHU anggota
    const anggotaSHU = await API.get(`/api/shu/anggota/${tahun}`);
    const shuData = anggotaSHU.find(item => item.anggota_id === anggotaId);
    
    if (!shuData) {
      alert('Data SHU tidak ditemukan');
      return;
    }
    
    // Get info koperasi
    const info = await API.get('/api/koperasi-info');
    
    // Get komponen SHU
    const komponen = await API.get(`/api/shu/komponen/${tahun}`);
    
    // Generate QR Code data
    const qrData = 'KOPERASI: ' + (info.nama_koperasi || 'NU Vibes') + '\\n' +
                   'SHU: ' + tahun + '\\n' +
                   'ANGGOTA: ' + shuData.nomor_anggota + '\\n' +
                   'NAMA: ' + shuData.nama_lengkap + '\\n' +
                   'TOTAL: ' + shuData.total_shu + '\\n' +
                   'TGL: ' + new Date().toISOString().split('T')[0];
    
    // Clean and escape QR data
    const cleanQrData = qrData.replace(/\\n/g, ' | ').replace(/'/g, '').replace(/"/g, '').replace(/\n/g, ' | ');
    const safeTransactionId = String(shuData.anggota_id).padStart(6, '0');
    
    const qrCodeHTML = `
      <script>
        console.log('SHU QR Code script loaded');
        
        function generateQRCode() {
          const qrContainer = document.getElementById('qrcode');
          const qrData = '${cleanQrData}';
          
          console.log('Generating SHU QR Code...');
          console.log('QR Data:', qrData);
          
          // Method 1: Try Google Charts API
          try {
            console.log('Trying Google Charts API...');
            const img = document.createElement('img');
            const encodedData = encodeURIComponent(qrData);
            const googleUrl = 'https://chart.googleapis.com/chart?chs=60x60&cht=qr&chl=' + encodedData;
            
            img.src = googleUrl;
            img.style.width = '55px';
            img.style.height = '55px';
            img.style.border = 'none';
            
            let loadTimeout = setTimeout(function() {
              console.log('Google Charts timeout, trying fallback...');
              tryQRServer();
            }, 5000);
            
            img.onload = function() {
              clearTimeout(loadTimeout);
              console.log('Google Charts QR Code loaded successfully');
              qrContainer.innerHTML = '';
              qrContainer.appendChild(img);
            };
            
            img.onerror = function() {
              clearTimeout(loadTimeout);
              console.log('Google Charts failed, trying QRServer...');
              tryQRServer();
            };
            
          } catch (error) {
            console.error('Google Charts error:', error);
            tryQRServer();
          }
          
          function tryQRServer() {
            try {
              console.log('Trying QRServer API...');
              const img2 = document.createElement('img');
              const encodedData2 = encodeURIComponent(qrData);
              const qrServerUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=' + encodedData2;
              
              img2.src = qrServerUrl;
              img2.style.width = '55px';
              img2.style.height = '55px';
              img2.style.border = 'none';
              
              let loadTimeout2 = setTimeout(function() {
                console.log('QRServer timeout, showing fallback...');
                showFallback();
              }, 5000);
              
              img2.onload = function() {
                clearTimeout(loadTimeout2);
                console.log('QRServer API loaded successfully');
                qrContainer.innerHTML = '';
                qrContainer.appendChild(img2);
              };
              
              img2.onerror = function() {
                clearTimeout(loadTimeout2);
                console.log('QRServer failed, showing fallback...');
                showFallback();
              };
              
            } catch (error) {
              console.error('QRServer error:', error);
              showFallback();
            }
          }
          
          function showFallback() {
            console.log('All QR methods failed, showing text fallback');
            qrContainer.innerHTML = '<div style="font-size: 7px; text-align: center; padding: 8px; color: #666; line-height: 1.1; border: 1px dashed #ccc;">QR Code<br>Service<br>Unavailable<br><small style="font-size: 6px; margin-top: 3px; display: block;">SHU: #${safeTransactionId}</small></div>';
          }
        }
        
        // Start generation with proper timing
        function startQRGeneration() {
          const qrContainer = document.getElementById('qrcode');
          if (qrContainer) {
            console.log('QR container found, starting generation...');
            generateQRCode();
          } else {
            console.log('QR container not found, retrying...');
            setTimeout(startQRGeneration, 200);
          }
        }
        
        // Multiple initialization methods
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(startQRGeneration, 100);
          });
        } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
          setTimeout(startQRGeneration, 100);
        }
        
        // Fallback initialization
        setTimeout(startQRGeneration, 500);
      </script>
    `;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk SHU - ${shuData.nama_lengkap}</title>
        <style>
          body { font-family: "Courier New", monospace; width: 72mm; max-width: 72mm; margin: 0; padding: 2mm; background: white; color: #000; font-size: 11px; line-height: 1.2; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
          .header h2 { margin: 5px 0; font-size: 14px; font-weight: bold; text-align: center; letter-spacing: 0.5px; }
          .header .address { margin: 4px 0; font-size: 9px; line-height: 1.3; text-align: center; }
          .header .contact { margin: 4px 0; font-size: 8px; text-align: center; }
          .header .website { margin: 2px 0; font-size: 8px; text-align: center; color: #333; font-weight: bold; }
          .badge { background: #000; color: white; padding: 3px 8px; font-size: 9px; font-weight: bold; margin-top: 6px; display: inline-block; border-radius: 2px; }
          .content { margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px; }
          .row.total { border-top: 1px dashed #000; padding-top: 6px; margin-top: 10px; font-weight: bold; font-size: 11px; }
          .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 8px; }
          .qr-code { width: 60px; height: 60px; margin: 10px auto; border: 1px solid #000; display: flex; align-items: center; justify-content: center; background: white; }
          .qr-code canvas { width: 55px !important; height: 55px !important; }
          .qr-code img { width: 55px !important; height: 55px !important; }
          .qr-fallback { font-size: 7px; text-align: center; padding: 8px; line-height: 1.1; }
          .separator { border-top: 1px dashed #000; margin: 6px 0; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 8px; }
          @media print { body { width: 80mm; max-width: 80mm; margin: 0; padding: 0; font-size: 10px; } .no-print { display: none; } @page { size: 80mm auto; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${info.nama_koperasi || 'KOPERASI NU VIBES'}</h2>
          <div class="address">${info.alamat || 'Gedung Dakwah NU Kota Bandung'}</div>
          <div class="contact">Telp: ${info.nomor_telpon || '+628211281926'}</div>
          <div class="website">Website: nuvibes.nukotabandung.or.id</div>
          <div style="margin-top: 6px;">
            <span class="badge">STRUK SHU</span>
          </div>
        </div>
        
        <div class="content">
          <div class="separator"></div>
          <div class="row"><span>Jenis:</span><span class="bold">SISA HASIL USAHA</span></div>
          <div class="row"><span>Tahun:</span><span class="bold">${tahun}</span></div>
          <div class="separator"></div>
          <div class="row"><span>No.Anggota:</span><span class="bold">${shuData.nomor_anggota}</span></div>
          <div class="row"><span>Nama:</span><span class="bold">${shuData.nama_lengkap.length > 20 ? shuData.nama_lengkap.substring(0, 20) + '...' : shuData.nama_lengkap}</span></div>
          <div class="separator"></div>
          <div class="center bold small">RINCIAN SHU:</div>
          <div class="row"><span>Jasa Simpanan (${komponen.jasa_simpanan}%)</span><span>Rp ${formatNumber(shuData.shu_simpanan)}</span></div>
          <div class="row"><span>Jasa Transaksi (${komponen.jasa_transaksi}%)</span><span>Rp ${formatNumber(shuData.shu_transaksi)}</span></div>
          <div class="separator"></div>
          <div class="row total center"><span class="bold">TOTAL SHU</span></div>
          <div class="row total center"><span class="bold">Rp ${formatNumber(shuData.total_shu)}</span></div>
          <div class="separator"></div>
          <div class="center small">Terbilang: ${terbilang(shuData.total_shu)} Rupiah</div>
        </div>
        
        <div class="footer">
          <div class="separator"></div>
          <div class="qr-code" id="qrcode"><div class="qr-fallback">QR Code<br>Loading...</div></div>
          <div class="center bold">TERIMA KASIH</div>
          <div class="center small">Atas partisipasi Anda dalam koperasi</div>
          <div class="separator"></div>
          <div class="center small">Petugas: Admin</div>
          <div class="center small">${new Date().toLocaleString('id-ID')}</div>
          <div class="center small">Sistem Koperasi NU Vibes v2.0</div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 12px;">
            <span>🖨️ Cetak Ulang</span>
          </button>
          <button onclick="window.close()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
            <span>❌ Tutup</span>
          </button>
        </div>
        
        ${qrCodeHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error cetak struk SHU:', error);
    alert('Gagal mencetak struk SHU: ' + error.message);
  }
};

// Helper function untuk format number tanpa Rp
function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

// Helper function terbilang
function terbilang(angka) {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  if (angka < 12) return bilangan[angka];
  if (angka < 20) return terbilang(angka - 10) + ' Belas';
  if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10);
  if (angka < 200) return 'Seratus ' + terbilang(angka - 100);
  if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100);
  if (angka < 2000) return 'Seribu ' + terbilang(angka - 1000);
  if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000);
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000);
  return terbilang(Math.floor(angka / 1000000000)) + ' Miliar ' + terbilang(angka % 1000000000);
}

// Pengumuman Page - DUPLICATE REMOVED, USING VERSION AT LINE 4969

window.exportSHU = async function(tahun) {
  try {
    const anggotaSHU = await API.get(`/api/shu/anggota/${tahun}`);
    
    if (anggotaSHU.length === 0) {
      alert('Tidak ada data SHU untuk diekspor.');
      return;
    }
    
    // Prepare CSV data
    let csv = 'No,No. Anggota,Nama Anggota,SHU Simpanan,SHU Transaksi,Total SHU\n';
    
    anggotaSHU.forEach((item, index) => {
      csv += `${index + 1},${item.nomor_anggota},"${item.nama_lengkap}",${item.shu_simpanan},${item.shu_transaksi},${item.total_shu}\n`;
    });
    
    // Calculate totals
    const totalSHUSimpanan = anggotaSHU.reduce((sum, item) => sum + item.shu_simpanan, 0);
    const totalSHUTransaksi = anggotaSHU.reduce((sum, item) => sum + item.shu_transaksi, 0);
    const grandTotal = anggotaSHU.reduce((sum, item) => sum + item.total_shu, 0);
    
    csv += `\n,,"TOTAL",${totalSHUSimpanan},${totalSHUTransaksi},${grandTotal}\n`;
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `SHU_Anggota_${tahun}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Data SHU tahun ${tahun} berhasil diekspor!\nFile: SHU_Anggota_${tahun}.csv`);
  } catch (error) {
    alert('❌ Gagal mengekspor SHU: ' + error.message);
  }
};

// Laporan
window.renderLaporan = async function() {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Laporan Keuangan</h3>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Jenis Laporan</label>
          <select id="jenisLaporan" onchange="togglePeriodeOptions()">
            <option value="labarugi">Laporan Laba/Rugi</option>
            <option value="neraca">Neraca</option>
            <option value="aruskas">Laporan Arus Kas</option>
            <option value="bukukas">Buku Kas</option>
            <option value="keseluruhan">Laporan Keuangan Keseluruhan Tahun</option>
          </select>
        </div>
        
        <div class="form-group" id="periodeGroup">
          <label>Periode</label>
          <select id="periodeLaporan">
            <option value="harian">Harian</option>
            <option value="bulanan">Bulanan</option>
            <option value="tahunan">Tahunan</option>
            <option value="seluruh">Seluruh Tahun</option>
          </select>
        </div>
        
        <div class="form-group" id="tahunGroup">
          <label>Tahun</label>
          <select id="tahunLaporan">
            ${Array.from({length: 10}, (_, i) => new Date().getFullYear() + 5 - i).map(y => `
              <option value="${y}" ${y === new Date().getFullYear() ? 'selected' : ''}>${y}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group" id="bulanGroup">
          <label>Bulan</label>
          <select id="bulanLaporan">
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
            <option value="11" ${new Date().getMonth() === 10 ? 'selected' : ''}>November</option>
            <option value="12">Desember</option>
          </select>
        </div>
        
        <div class="form-group" id="tanggalGroup" style="display: none;">
          <label>Tanggal</label>
          <input type="date" id="tanggalLaporan" value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      
      <div class="btn-group">
        <button class="btn btn-primary" onclick="tampilkanLaporan()">Tampilkan Laporan</button>
        <button class="btn btn-success" onclick="cetakLaporan()">Cetak PDF</button>
        <button class="btn btn-info" onclick="exportExcel()">Export Excel</button>
      </div>
      
      <div id="laporanContent" style="margin-top: 30px;"></div>
    </div>
  `;
  
  // Set current month as default
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  document.getElementById('bulanLaporan').value = currentMonth;
  
  // Handle jenis laporan change
  document.getElementById('jenisLaporan').addEventListener('change', togglePeriodeOptions);
  
  // Handle periode change
  document.getElementById('periodeLaporan').addEventListener('change', (e) => {
    const periode = e.target.value;
    const bulanGroup = document.getElementById('bulanGroup');
    const tanggalGroup = document.getElementById('tanggalGroup');
    const tahunGroup = document.getElementById('tahunGroup');
    
    if (periode === 'harian') {
      // Harian: Tampilkan tahun dan tanggal, sembunyikan bulan
      if (tahunGroup) tahunGroup.style.display = 'block';
      if (bulanGroup) bulanGroup.style.display = 'none';
      if (tanggalGroup) tanggalGroup.style.display = 'block';
    } else if (periode === 'bulanan') {
      // Bulanan: Tampilkan tahun dan bulan, sembunyikan tanggal
      if (tahunGroup) tahunGroup.style.display = 'block';
      if (bulanGroup) bulanGroup.style.display = 'block';
      if (tanggalGroup) tanggalGroup.style.display = 'none';
    } else if (periode === 'tahunan') {
      // Tahunan: Tampilkan tahun saja, sembunyikan bulan dan tanggal
      if (tahunGroup) tahunGroup.style.display = 'block';
      if (bulanGroup) bulanGroup.style.display = 'none';
      if (tanggalGroup) tanggalGroup.style.display = 'none';
    } else if (periode === 'seluruh') {
      // Seluruh Tahun: Sembunyikan SEMUA filter
      if (tahunGroup) tahunGroup.style.display = 'none';
      if (bulanGroup) bulanGroup.style.display = 'none';
      if (tanggalGroup) tanggalGroup.style.display = 'none';
    }
  });
  
  // Initialize visibility
  togglePeriodeOptions();
}

window.tampilkanLaporan = async function() {
  const jenis = document.getElementById('jenisLaporan').value;
  const periode = document.getElementById('periodeLaporan').value;
  const tahun = document.getElementById('tahunLaporan').value;
  const bulan = document.getElementById('bulanLaporan').value;
  const tanggal = document.getElementById('tanggalLaporan').value;
  
  const laporanContent = document.getElementById('laporanContent');
  laporanContent.innerHTML = '<div class="loading">Memuat laporan...</div>';
  
  try {
    if (jenis === 'keseluruhan') {
      // Laporan Keuangan Keseluruhan Tahun
      await tampilkanLaporanKeseluruhan(tahun);
      return;
    }
    
    if (jenis === 'labarugi') {
      const penjualan = await API.get('/api/transaksi/penjualan');
      const pengeluaran = await API.get('/api/transaksi/pengeluaran');
      const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
      
      // Pastikan data adalah array
      const penjualanData = Array.isArray(penjualan) ? penjualan : [];
      const pengeluaranData = Array.isArray(pengeluaran) ? pengeluaran : [];
      const pendapatanLainData = Array.isArray(pendapatanLain) ? pendapatanLain : [];
      
      // Filter by periode
      let filteredPenjualan = penjualanData;
      let filteredPengeluaran = pengeluaranData;
      let filteredPendapatanLain = pendapatanLainData;
      
      if (periode === 'harian' && tanggal) {
        filteredPenjualan = penjualanData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi === tanggal);
        filteredPengeluaran = pengeluaranData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi === tanggal);
        filteredPendapatanLain = pendapatanLainData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi === tanggal);
      } else if (periode === 'bulanan' && bulan) {
        filteredPenjualan = penjualanData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredPengeluaran = pengeluaranData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredPendapatanLain = pendapatanLainData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
      } else if (periode === 'tahunan') {
        filteredPenjualan = penjualanData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
        filteredPengeluaran = pengeluaranData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
        filteredPendapatanLain = pendapatanLainData.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
      } else if (periode === 'seluruh') {
        // Seluruh tahun - SEMUA data tanpa filter
        filteredPenjualan = penjualanData;
        filteredPengeluaran = pengeluaranData;
        filteredPendapatanLain = pendapatanLainData;
      }
      
      const totalPenjualan = filteredPenjualan.reduce((sum, item) => sum + parseFloat(item.jumlah_penjualan || 0), 0);
      const totalHPP = filteredPenjualan.reduce((sum, item) => sum + parseFloat(item.hpp || 0), 0);
      const totalPendapatanLain = filteredPendapatanLain.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      
      // Filter pengeluaran: Exclude "Pembelian Barang" dan "Pembelian Aset & Inventaris"
      // Pembelian Barang masuk ke Persediaan di Neraca, bukan HPP
      // Pembelian Aset masuk ke Aset Tetap di Neraca
      const pengeluaranOperasional = filteredPengeluaran.filter(p => 
        p.kategori !== 'Pembelian Barang' && 
        p.kategori !== 'Pembelian Aset & Inventaris'
      );
      const totalPengeluaran = pengeluaranOperasional.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      
      // Formula yang benar:
      // Total Pendapatan = Penjualan + Pendapatan Lain
      // Laba Kotor = Total Pendapatan - HPP (dari transaksi penjualan)
      // Laba Bersih = Laba Kotor - Pengeluaran Operasional
      const totalPendapatan = totalPenjualan + totalPendapatanLain;
      const labaKotor = totalPendapatan - totalHPP;
      const labaRugi = labaKotor - totalPengeluaran;
      
      laporanContent.innerHTML = `
        <h4 style="color: var(--primary-teal);">Laporan Laba/Rugi</h4>
        <div class="table-container">
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
                <td style="padding-left: 30px;">Penjualan</td>
                <td style="text-align: right;">${formatCurrency(totalPenjualan)}</td>
              </tr>
              <tr>
                <td style="padding-left: 30px;">Pendapatan Lain</td>
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
                <td style="padding-left: 30px;">HPP</td>
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
                <td style="padding-left: 30px;">Biaya Operasional</td>
                <td style="text-align: right; color: #d32f2f;">(${formatCurrency(totalPengeluaran)})</td>
              </tr>
              <tr style="background: ${labaRugi >= 0 ? '#e8f5e9' : '#ffebee'}; font-weight: bold; font-size: 16px;">
                <td><strong>${labaRugi >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</strong></td>
                <td style="text-align: right; color: ${labaRugi >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>${formatCurrency(Math.abs(labaRugi))}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
      `;
    } else if (jenis === 'neraca') {
      const simpanan = await API.get('/api/simpanan/pokok');
      const wajib = await API.get('/api/simpanan/wajib');
      const khusus = await API.get('/api/simpanan/khusus');
      const sukarela = await API.get('/api/simpanan/sukarela');
      const penjualan = await API.get('/api/transaksi/penjualan');
      const pengeluaran = await API.get('/api/transaksi/pengeluaran');
      const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
      
      // Filter simpanan by periode
      let filteredSimpanan = simpanan;
      let filteredWajib = wajib;
      let filteredKhusus = khusus;
      let filteredSukarela = sukarela;
      
      if (periode === 'harian' && tanggal) {
        filteredSimpanan = simpanan.filter(s => s.tanggal_transaksi && s.tanggal_transaksi === tanggal);
        filteredWajib = wajib.filter(s => s.tanggal_transaksi && s.tanggal_transaksi === tanggal);
        filteredKhusus = khusus.filter(s => s.tanggal_transaksi && s.tanggal_transaksi === tanggal);
        filteredSukarela = sukarela.filter(s => s.tanggal_transaksi && s.tanggal_transaksi === tanggal);
      } else if (periode === 'bulanan' && bulan) {
        filteredSimpanan = simpanan.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredWajib = wajib.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredKhusus = khusus.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredSukarela = sukarela.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
      } else if (periode === 'tahunan') {
        filteredSimpanan = simpanan.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
        filteredWajib = wajib.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
        filteredKhusus = khusus.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
        filteredSukarela = sukarela.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
      } else if (periode === 'seluruh') {
        // Seluruh tahun - SEMUA data tanpa filter
        filteredSimpanan = simpanan;
        filteredWajib = wajib;
        filteredKhusus = khusus;
        filteredSukarela = sukarela;
      }
      
      // Calculate simpanan sukarela with setoran (+) and penarikan (-)
      const totalSukarelaSetoran = filteredSukarela
        .filter(s => s.jenis === 'Setoran')
        .reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      const totalSukarelaPenarikan = filteredSukarela
        .filter(s => s.jenis === 'Penarikan')
        .reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      const totalSukarela = totalSukarelaSetoran - totalSukarelaPenarikan;
      
      const totalSimpananPokok = filteredSimpanan.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      const totalSimpananWajib = filteredWajib.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      const totalSimpananKhusus = filteredKhusus.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      const totalSimpanan = totalSimpananPokok + totalSimpananWajib + totalSimpananKhusus + totalSukarela;
      
      // Filter transaksi by periode
      let filteredPenjualan = penjualan;
      let filteredPengeluaran = pengeluaran;
      let filteredPendapatanLain = pendapatanLain;
      
      if (periode === 'harian' && tanggal) {
        filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi === tanggal);
        filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi === tanggal);
        filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi === tanggal);
      } else if (periode === 'bulanan' && bulan) {
        filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
      } else if (periode === 'tahunan') {
        filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
        filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
        filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
      } else if (periode === 'seluruh') {
        // Seluruh tahun - SEMUA data tanpa filter
        filteredPenjualan = penjualan;
        filteredPengeluaran = pengeluaran;
        filteredPendapatanLain = pendapatanLain;
      }
      
      const totalPenjualan = filteredPenjualan.reduce((sum, item) => sum + parseFloat(item.jumlah_penjualan || 0), 0);
      const totalHPP = filteredPenjualan.reduce((sum, item) => sum + parseFloat(item.hpp || 0), 0);
      const totalPendapatanLain = filteredPendapatanLain.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      
      // Hitung Biaya Operasional (exclude Pembelian Barang dan Aset)
      const biayaOperasional = filteredPengeluaran
        .filter(p => p.kategori !== 'Pembelian Barang' && p.kategori !== 'Pembelian Aset & Inventaris' && p.kategori !== 'Pembelian Aset')
        .reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      
      // Formula Laba/Rugi (dengan Pendapatan Lain)
      const totalPendapatan = totalPenjualan + totalPendapatanLain;
      const labaKotor = totalPendapatan - totalHPP;
      const labaBersih = labaKotor - biayaOperasional;
      
      // Hitung Pembelian Barang dan Pembelian Aset dari Pengeluaran
      const pembelianBarang = filteredPengeluaran
        .filter(p => p.kategori === 'Pembelian Barang')
        .reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
      
      const filteredPengeluaranAset = filteredPengeluaran
        .filter(p => p.kategori === 'Pembelian Aset & Inventaris' || p.kategori === 'Pembelian Aset');
      
      const pembelianAset = filteredPengeluaranAset
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
      // Persediaan = Pembelian Barang - HPP Barang
      const persediaan = pembelianBarang - hppBarang;
      
      // Aktiva Tetap = Pembelian Aset - Penjualan Aset
      const aktivaTetap = pembelianAset - penjualanAset;
      
      // Get Cadangan from SHU tahun sebelumnya (hitung dulu sebelum kasBank)
      const tahunSebelumnya = parseInt(tahun) - 1;
      let cadangan = 0;
      try {
        const shuSebelumnya = await API.get(`/api/shu/komponen/${tahunSebelumnya}`);
        if (shuSebelumnya && shuSebelumnya.cadangan) {
          // Hitung total SHU tahun sebelumnya
          const anggotaSHU = await API.get(`/api/shu/anggota/${tahunSebelumnya}`);
          const totalSHUSebelumnya = anggotaSHU.reduce((sum, a) => sum + parseFloat(a.total_shu || 0), 0);
          cadangan = totalSHUSebelumnya * (parseFloat(shuSebelumnya.cadangan) / 100);
        }
      } catch (error) {
        console.log('No SHU data for previous year');
      }
      
      // Kas & Bank = Total Simpanan + Laba Bersih + Cadangan - Persediaan - Aktiva Tetap
      // (Pendapatan Lain sudah termasuk dalam Laba Bersih)
      const kasBank = totalSimpanan + labaBersih + cadangan - persediaan - aktivaTetap;
      
      const totalAktiva = kasBank + persediaan + aktivaTetap;
      
      // PASIVA & MODAL
      // Hutang Jangka Pendek = Simpanan Sukarela
      const hutangJangkaPendek = totalSukarela;
      
      // Hutang Jangka Panjang = Simpanan Khusus
      const hutangJangkaPanjang = totalSimpananKhusus;
      
      // SHU Tahun Berjalan = Laba Bersih (sama dengan Laporan Laba/Rugi)
      const shuTahunBerjalan = labaBersih;
      
      const totalPasiva = hutangJangkaPendek + hutangJangkaPanjang + totalSimpananPokok + totalSimpananWajib + cadangan + shuTahunBerjalan;
      
      // Format periode untuk tampilan
      let periodeText = '';
      if (periode === 'harian' && tanggal) {
        const date = new Date(tanggal);
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        periodeText = `${date.getDate()} ${namaBulan[date.getMonth()]} ${date.getFullYear()}`;
      } else if (periode === 'bulanan' && bulan) {
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        periodeText = `${namaBulan[parseInt(bulan) - 1]} ${tahun}`;
      } else if (periode === 'tahunan') {
        periodeText = `Tahun ${tahun}`;
      } else if (periode === 'seluruh') {
        periodeText = `Seluruh Data`;
      } else {
        periodeText = `Semua Periode`;
      }
      
      laporanContent.innerHTML = `
        <h4 style="color: var(--primary-teal);">Neraca</h4>
        <p style="text-align: center; color: #666; margin-bottom: 20px;">Per ${periodeText}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="table-container">
            <h5>AKTIVA</h5>
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
                <tr style="background: #f8f9fa; font-weight: bold;">
                  <td><strong>TOTAL AKTIVA</strong></td>
                  <td style="text-align: right;"><strong>${formatCurrency(totalAktiva)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="table-container">
            <h5>PASIVA</h5>
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
                  <td style="text-align: right;">${formatCurrency(hutangJangkaPendek)}</td>
                </tr>
                <tr>
                  <td>Cadangan</td>
                  <td style="text-align: right;">${formatCurrency(cadangan)}</td>
                </tr>
                <tr>
                  <td>SHU Tahun Berjalan</td>
                  <td style="text-align: right;">${formatCurrency(shuTahunBerjalan)}</td>
                </tr>
                <tr style="background: #f8f9fa; font-weight: bold;">
                  <td><strong>TOTAL PASIVA</strong></td>
                  <td style="text-align: right;"><strong>${formatCurrency(totalPasiva)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        ${filteredPengeluaranAset.length > 0 ? `
        <div style="margin-top: 30px;">
          <h5>Detail Aset Tetap</h5>
          <div class="table-container">
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
                ${filteredPengeluaranAset.map(item => {
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
                <tr style="background: #f8f9fa; font-weight: bold;">
                  <td colspan="2"><strong>TOTAL</strong></td>
                  <td style="text-align: center;"><strong>${filteredPengeluaranAset.reduce((sum, item) => sum + (item.qty || 1), 0)}</strong></td>
                  <td></td>
                  <td><strong>${formatCurrency(pembelianAset)}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}
      `;
    } else if (jenis === 'aruskas') {
      // Laporan Arus Kas
      const simpananPokok = await API.get('/api/simpanan/pokok');
      const simpananWajib = await API.get('/api/simpanan/wajib');
      const simpananKhusus = await API.get('/api/simpanan/khusus');
      const simpananSukarela = await API.get('/api/simpanan/sukarela');
      const penjualan = await API.get('/api/transaksi/penjualan');
      const pengeluaran = await API.get('/api/transaksi/pengeluaran');
      const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
      const aset = await API.get('/api/aset');
      
      // Filter by periode
      let filteredSimpananPokok = simpananPokok;
      let filteredSimpananWajib = simpananWajib;
      let filteredSimpananKhusus = simpananKhusus;
      let filteredSimpananSukarela = simpananSukarela;
      let filteredPenjualan = penjualan;
      let filteredPengeluaran = pengeluaran;
      let filteredPendapatanLain = pendapatanLain;
      let filteredAset = aset;
      
      if (periode === 'harian' && tanggal) {
        filteredSimpananPokok = simpananPokok.filter(s => s.tanggal_transaksi === tanggal);
        filteredSimpananWajib = simpananWajib.filter(s => s.tanggal_transaksi === tanggal);
        filteredSimpananKhusus = simpananKhusus.filter(s => s.tanggal_transaksi === tanggal);
        filteredSimpananSukarela = simpananSukarela.filter(s => s.tanggal_transaksi === tanggal);
        filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi === tanggal);
        filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi === tanggal);
        filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi === tanggal);
        filteredAset = aset.filter(a => a.tanggal_perolehan === tanggal);
      } else if (periode === 'bulanan' && bulan) {
        filteredSimpananPokok = simpananPokok.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredSimpananWajib = simpananWajib.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredSimpananKhusus = simpananKhusus.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredSimpananSukarela = simpananSukarela.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(`${tahun}-${bulan}`));
        filteredAset = aset.filter(a => a.tanggal_perolehan && a.tanggal_perolehan.startsWith(`${tahun}-${bulan}`));
      } else if (periode === 'tahunan') {
        filteredSimpananPokok = simpananPokok.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
        filteredSimpananWajib = simpananWajib.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
        filteredSimpananKhusus = simpananKhusus.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
        filteredSimpananSukarela = simpananSukarela.filter(s => s.tanggal_transaksi && s.tanggal_transaksi.startsWith(tahun));
        filteredPenjualan = penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
        filteredPengeluaran = pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
        filteredPendapatanLain = pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun));
        filteredAset = aset.filter(a => a.tanggal_perolehan && a.tanggal_perolehan.startsWith(tahun));
      } else if (periode === 'seluruh') {
        // Seluruh tahun - SEMUA data tanpa filter
        filteredSimpananPokok = simpananPokok;
        filteredSimpananWajib = simpananWajib;
        filteredSimpananKhusus = simpananKhusus;
        filteredSimpananSukarela = simpananSukarela;
        filteredPenjualan = penjualan;
        filteredPengeluaran = pengeluaran;
        filteredPendapatanLain = pendapatanLain;
        filteredAset = aset;
      }
      
      // AKTIVITAS OPERASIONAL
      const penerimaanPenjualan = filteredPenjualan.reduce((sum, p) => sum + parseFloat(p.jumlah_penjualan || 0), 0);
      const penerimaanPendapatanLain = filteredPendapatanLain.reduce((sum, p) => sum + parseFloat(p.jumlah || 0), 0);
      
      // Pembayaran Biaya Operasional (tanpa Pembelian Barang dan Pembelian Aset)
      const pembayaranBiayaOperasional = filteredPengeluaran
        .filter(p => p.kategori !== 'Pembelian Barang' && p.kategori !== 'Pembelian Aset & Inventaris' && p.kategori !== 'Pembelian Aset')
        .reduce((sum, p) => sum + parseFloat(p.jumlah || 0), 0);
      
      const pembayaranHPP = filteredPenjualan.reduce((sum, p) => sum + parseFloat(p.hpp || 0), 0);
      
      const kasOperasional = penerimaanPenjualan + penerimaanPendapatanLain - pembayaranBiayaOperasional - pembayaranHPP;
      
      // AKTIVITAS INVESTASI
      // Pembelian Barang
      const pembelianBarang = filteredPengeluaran
        .filter(p => p.kategori === 'Pembelian Barang')
        .reduce((sum, p) => sum + parseFloat(p.jumlah || 0), 0);
      
      // HPP Barang (barang yang sudah terjual)
      const hppBarang = filteredPenjualan
        .filter(p => p.kategori === 'Barang' || !p.kategori)
        .reduce((sum, p) => sum + parseFloat(p.hpp || 0), 0);
      
      // Persediaan = Pembelian Barang - HPP Barang
      const persediaanBarang = pembelianBarang - hppBarang;
      
      // Pembelian Aset (masuk ke Aktiva Tetap)
      const pembelianAset = filteredPengeluaran
        .filter(p => p.kategori === 'Pembelian Aset & Inventaris' || p.kategori === 'Pembelian Aset')
        .reduce((sum, p) => sum + parseFloat(p.jumlah || 0), 0);
      
      const kasInvestasi = -(persediaanBarang + pembelianAset); // Negatif karena pengeluaran
      
      // AKTIVITAS PENDANAAN
      const penerimaanSimpananPokok = filteredSimpananPokok.reduce((sum, s) => sum + parseFloat(s.jumlah || 0), 0);
      const penerimaanSimpananWajib = filteredSimpananWajib.reduce((sum, s) => sum + parseFloat(s.jumlah || 0), 0);
      const penerimaanSimpananKhusus = filteredSimpananKhusus.reduce((sum, s) => sum + parseFloat(s.jumlah || 0), 0);
      
      // Simpanan Sukarela: Setoran (+) Penarikan (-)
      const setoran = filteredSimpananSukarela.filter(s => s.jenis === 'Setoran').reduce((sum, s) => sum + parseFloat(s.jumlah || 0), 0);
      const penarikan = filteredSimpananSukarela.filter(s => s.jenis === 'Penarikan').reduce((sum, s) => sum + parseFloat(s.jumlah || 0), 0);
      const penerimaanSimpananSukarela = setoran - penarikan;
      
      const kasPendanaan = penerimaanSimpananPokok + penerimaanSimpananWajib + penerimaanSimpananKhusus + penerimaanSimpananSukarela;
      
      // TOTAL KAS
      const kenaikanKas = kasOperasional + kasInvestasi + kasPendanaan;
      
      // Kas Awal (dari periode sebelumnya - simplified: 0 untuk demo)
      const kasAwal = 0;
      const kasAkhir = kasAwal + kenaikanKas;
      
      // Format periode untuk tampilan
      let periodeText = '';
      if (periode === 'harian' && tanggal) {
        const date = new Date(tanggal);
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        periodeText = `${date.getDate()} ${namaBulan[date.getMonth()]} ${date.getFullYear()}`;
      } else if (periode === 'bulanan' && bulan) {
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        periodeText = `${namaBulan[parseInt(bulan) - 1]} ${tahun}`;
      } else if (periode === 'tahunan') {
        periodeText = `Tahun ${tahun}`;
      } else if (periode === 'seluruh') {
        periodeText = `Seluruh Data`;
      } else {
        periodeText = `Semua Periode`;
      }
      
      laporanContent.innerHTML = `
        <h4 style="color: var(--primary-teal);">Laporan Arus Kas</h4>
        <p style="text-align: center; color: #666; margin-bottom: 20px;">Periode ${periodeText}</p>
        
        <div class="table-container">
          <table>
            <tbody>
              <!-- AKTIVITAS OPERASIONAL -->
              <tr style="background: #e3f2fd;">
                <td colspan="2"><strong>AKTIVITAS OPERASIONAL</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Penerimaan dari Penjualan</td>
                <td style="text-align: right;">${formatCurrency(penerimaanPenjualan)}</td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Penerimaan Pendapatan Lain</td>
                <td style="text-align: right;">${formatCurrency(penerimaanPendapatanLain)}</td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Pembayaran untuk HPP</td>
                <td style="text-align: right; color: #d32f2f;">(${formatCurrency(pembayaranHPP)})</td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Pembayaran Biaya Operasional</td>
                <td style="text-align: right; color: #d32f2f;">(${formatCurrency(pembayaranBiayaOperasional)})</td>
              </tr>
              <tr style="background: #fff3e0; font-weight: bold;">
                <td style="padding-left: 40px;"><strong>Kas Bersih dari Aktivitas Operasional</strong></td>
                <td style="text-align: right; color: ${kasOperasional >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>${formatCurrency(kasOperasional)}</strong></td>
              </tr>
              
              <!-- AKTIVITAS INVESTASI -->
              <tr style="background: #e8f5e9;">
                <td colspan="2"><strong>AKTIVITAS INVESTASI</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Pembelian Barang</td>
                <td style="text-align: right; color: #d32f2f;">(${formatCurrency(pembelianBarang)})</td>
              </tr>
              <tr>
                <td style="padding-left: 40px; font-size: 13px; color: #666;">Dikurangi: HPP Barang Terjual</td>
                <td style="text-align: right; font-size: 13px; color: #2e7d32;">${formatCurrency(hppBarang)}</td>
              </tr>
              <tr>
                <td style="padding-left: 40px; font-style: italic;">Persediaan Barang</td>
                <td style="text-align: right; color: #d32f2f;">(${formatCurrency(persediaanBarang)})</td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Pembelian Aset Tetap</td>
                <td style="text-align: right; color: #d32f2f;">(${formatCurrency(pembelianAset)})</td>
              </tr>
              <tr style="background: #fff3e0; font-weight: bold;">
                <td style="padding-left: 40px;"><strong>Kas Bersih dari Aktivitas Investasi</strong></td>
                <td style="text-align: right; color: ${kasInvestasi >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>${formatCurrency(kasInvestasi)}</strong></td>
              </tr>
              
              <!-- AKTIVITAS PENDANAAN -->
              <tr style="background: #fce4ec;">
                <td colspan="2"><strong>AKTIVITAS PENDANAAN</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Penerimaan Simpanan Pokok</td>
                <td style="text-align: right;">${formatCurrency(penerimaanSimpananPokok)}</td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Penerimaan Simpanan Wajib</td>
                <td style="text-align: right;">${formatCurrency(penerimaanSimpananWajib)}</td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Penerimaan Simpanan Khusus</td>
                <td style="text-align: right;">${formatCurrency(penerimaanSimpananKhusus)}</td>
              </tr>
              <tr>
                <td style="padding-left: 20px;">Penerimaan Simpanan Sukarela (Bersih)</td>
                <td style="text-align: right; ${penerimaanSimpananSukarela < 0 ? 'color: #d32f2f;' : ''}">${penerimaanSimpananSukarela >= 0 ? formatCurrency(penerimaanSimpananSukarela) : '(' + formatCurrency(Math.abs(penerimaanSimpananSukarela)) + ')'}</td>
              </tr>
              <tr style="background: #fff3e0; font-weight: bold;">
                <td style="padding-left: 40px;"><strong>Kas Bersih dari Aktivitas Pendanaan</strong></td>
                <td style="text-align: right; color: ${kasPendanaan >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>${formatCurrency(kasPendanaan)}</strong></td>
              </tr>
              
              <!-- TOTAL -->
              <tr style="background: #f5f5f5; font-weight: bold; font-size: 15px;">
                <td><strong>KENAIKAN (PENURUNAN) KAS</strong></td>
                <td style="text-align: right; color: ${kenaikanKas >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>${formatCurrency(kenaikanKas)}</strong></td>
              </tr>
              <tr>
                <td><strong>KAS AWAL PERIODE</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(kasAwal)}</strong></td>
              </tr>
              <tr style="background: #e8f5e9; font-weight: bold; font-size: 16px;">
                <td><strong>KAS AKHIR PERIODE</strong></td>
                <td style="text-align: right; color: #2e7d32;"><strong>${formatCurrency(kasAkhir)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (jenis === 'bukukas') {
      // Buku Kas
      const simpananPokok = await API.get('/api/simpanan/pokok');
      const simpananWajib = await API.get('/api/simpanan/wajib');
      const simpananKhusus = await API.get('/api/simpanan/khusus');
      const simpananSukarela = await API.get('/api/simpanan/sukarela');
      const penjualan = await API.get('/api/transaksi/penjualan');
      const pengeluaran = await API.get('/api/transaksi/pengeluaran');
      const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
      
      // Combine all transactions
      let allTransactions = [];
      
      // Penerimaan dari Simpanan
      simpananPokok.forEach(s => {
        allTransactions.push({
          tanggal: s.tanggal_transaksi,
          uraian: `Simpanan Pokok - ${s.nama_lengkap} (${s.nomor_anggota})${s.keterangan ? ' - ' + s.keterangan : ''}`,
          penerimaan: parseFloat(s.jumlah || 0),
          pengeluaran: 0
        });
      });
      
      simpananWajib.forEach(s => {
        allTransactions.push({
          tanggal: s.tanggal_transaksi,
          uraian: `Simpanan Wajib - ${s.nama_lengkap} (${s.nomor_anggota})${s.keterangan ? ' - ' + s.keterangan : ''}`,
          penerimaan: parseFloat(s.jumlah || 0),
          pengeluaran: 0
        });
      });
      
      simpananKhusus.forEach(s => {
        allTransactions.push({
          tanggal: s.tanggal_transaksi,
          uraian: `Simpanan Khusus - ${s.nama_lengkap} (${s.nomor_anggota})${s.keterangan ? ' - ' + s.keterangan : ''}`,
          penerimaan: parseFloat(s.jumlah || 0),
          pengeluaran: 0
        });
      });
      
      simpananSukarela.forEach(s => {
        if (s.jenis === 'Setoran') {
          allTransactions.push({
            tanggal: s.tanggal_transaksi,
            uraian: `Simpanan Sukarela (Setoran) - ${s.nama_lengkap} (${s.nomor_anggota})${s.keterangan ? ' - ' + s.keterangan : ''}`,
            penerimaan: parseFloat(s.jumlah || 0),
            pengeluaran: 0
          });
        } else {
          allTransactions.push({
            tanggal: s.tanggal_transaksi,
            uraian: `Simpanan Sukarela (Penarikan) - ${s.nama_lengkap} (${s.nomor_anggota})${s.keterangan ? ' - ' + s.keterangan : ''}`,
            penerimaan: 0,
            pengeluaran: parseFloat(s.jumlah || 0)
          });
        }
      });
      
      // Penerimaan dari Penjualan
      penjualan.forEach(p => {
        allTransactions.push({
          tanggal: p.tanggal_transaksi,
          uraian: `Hasil Penjualan${p.nama_usaha ? ' - ' + p.nama_usaha : ''}${p.keterangan ? ' - ' + p.keterangan : ''}`,
          penerimaan: parseFloat(p.jumlah_penjualan || 0),
          pengeluaran: 0
        });
      });
      
      // Penerimaan dari Pendapatan Lain
      pendapatanLain.forEach(p => {
        allTransactions.push({
          tanggal: p.tanggal_transaksi,
          uraian: `${p.kategori}${p.nama_usaha ? ' - ' + p.nama_usaha : ''}${p.keterangan ? ' - ' + p.keterangan : ''}`,
          penerimaan: parseFloat(p.jumlah || 0),
          pengeluaran: 0
        });
      });
      
      // Pengeluaran
      pengeluaran.forEach(p => {
        allTransactions.push({
          tanggal: p.tanggal_transaksi,
          uraian: `${p.kategori}${p.nama_usaha ? ' - ' + p.nama_usaha : ''}${p.keterangan ? ' - ' + p.keterangan : ''}`,
          penerimaan: 0,
          pengeluaran: parseFloat(p.jumlah || 0)
        });
      });
      
      // Filter by periode
      if (periode === 'harian' && tanggal) {
        allTransactions = allTransactions.filter(t => t.tanggal === tanggal);
      } else if (periode === 'bulanan' && bulan) {
        allTransactions = allTransactions.filter(t => t.tanggal && t.tanggal.startsWith(`${tahun}-${bulan}`));
      } else if (periode === 'tahunan') {
        allTransactions = allTransactions.filter(t => t.tanggal && t.tanggal.startsWith(tahun));
      } else if (periode === 'seluruh') {
        // Seluruh tahun - SEMUA data tanpa filter
        // allTransactions sudah berisi semua data
      }
      
      // Sort by date
      allTransactions.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
      
      // Calculate running balance
      let saldo = 0;
      allTransactions.forEach(t => {
        saldo += t.penerimaan - t.pengeluaran;
        t.saldo = saldo;
      });
      
      // Calculate totals
      const totalPenerimaan = allTransactions.reduce((sum, t) => sum + t.penerimaan, 0);
      const totalPengeluaran = allTransactions.reduce((sum, t) => sum + t.pengeluaran, 0);
      const saldoAkhir = totalPenerimaan - totalPengeluaran;
      
      // Format periode untuk tampilan
      let periodeText = '';
      if (periode === 'harian' && tanggal) {
        const date = new Date(tanggal);
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        periodeText = `${date.getDate()} ${namaBulan[date.getMonth()]} ${date.getFullYear()}`;
      } else if (periode === 'bulanan' && bulan) {
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        periodeText = `${namaBulan[parseInt(bulan) - 1]} ${tahun}`;
      } else if (periode === 'tahunan') {
        periodeText = `Tahun ${tahun}`;
      } else if (periode === 'seluruh') {
        periodeText = `Seluruh Data`;
      } else {
        periodeText = `Tahun ${tahun}`;
      }
      
      laporanContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h4 style="color: var(--primary-teal); margin-bottom: 5px;">BUKU KAS</h4>
          <p style="color: #666;">Periode: ${periodeText}</p>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">No.</th>
                <th style="width: 120px;">Tanggal</th>
                <th>Uraian</th>
                <th style="width: 150px; text-align: right;">Penerimaan (Rp)</th>
                <th style="width: 150px; text-align: right;">Pengeluaran (Rp)</th>
                <th style="width: 150px; text-align: right;">Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody>
              ${allTransactions.length > 0 ? allTransactions.map((item, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td>${formatDate(item.tanggal)}</td>
                  <td>${item.uraian}</td>
                  <td style="text-align: right; color: #2e7d32;">${item.penerimaan > 0 ? formatCurrency(item.penerimaan) : '-'}</td>
                  <td style="text-align: right; color: #d32f2f;">${item.pengeluaran > 0 ? formatCurrency(item.pengeluaran) : '-'}</td>
                  <td style="text-align: right; font-weight: 600; color: ${item.saldo >= 0 ? '#2e7d32' : '#d32f2f'};">${formatCurrency(item.saldo)}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i data-feather="inbox" style="width: 48px; height: 48px; margin-bottom: 10px;"></i>
                    <p>Tidak ada transaksi pada periode ini</p>
                  </td>
                </tr>
              `}
              
              ${allTransactions.length > 0 ? `
                <tr style="background: #f5f5f5; font-weight: bold; font-size: 15px;">
                  <td colspan="3" style="text-align: right; padding-right: 20px;"><strong>TOTAL</strong></td>
                  <td style="text-align: right; color: #2e7d32;"><strong>${formatCurrency(totalPenerimaan)}</strong></td>
                  <td style="text-align: right; color: #d32f2f;"><strong>${formatCurrency(totalPengeluaran)}</strong></td>
                  <td style="text-align: right; color: ${saldoAkhir >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>${formatCurrency(saldoAkhir)}</strong></td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
        
        ${allTransactions.length > 0 ? `
          <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #E8F5E9, #F1F8E9); border-radius: 12px; border-left: 4px solid #2E7D32;">
            <h4 style="color: #2E7D32; margin-bottom: 15px;">📊 Ringkasan Buku Kas</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div>
                <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Total Penerimaan</p>
                <p style="font-size: 20px; font-weight: bold; color: #2e7d32;">${formatCurrency(totalPenerimaan)}</p>
              </div>
              <div>
                <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Total Pengeluaran</p>
                <p style="font-size: 20px; font-weight: bold; color: #d32f2f;">${formatCurrency(totalPengeluaran)}</p>
              </div>
              <div>
                <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Saldo Akhir</p>
                <p style="font-size: 20px; font-weight: bold; color: ${saldoAkhir >= 0 ? '#2e7d32' : '#d32f2f'};">${formatCurrency(saldoAkhir)}</p>
              </div>
              <div>
                <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Jumlah Transaksi</p>
                <p style="font-size: 20px; font-weight: bold; color: #1976D2;">${allTransactions.length}</p>
              </div>
            </div>
          </div>
        ` : ''}
      `;
    }
    
    feather.replace();
  } catch (error) {
    laporanContent.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
  }
};

// Toggle periode options based on jenis laporan
window.togglePeriodeOptions = function() {
  const jenis = document.getElementById('jenisLaporan').value;
  const periodeGroup = document.getElementById('periodeGroup');
  const bulanGroup = document.getElementById('bulanGroup');
  const tanggalGroup = document.getElementById('tanggalGroup');
  
  if (jenis === 'keseluruhan') {
    // Untuk laporan keseluruhan, sembunyikan periode, bulan, tanggal
    periodeGroup.style.display = 'none';
    bulanGroup.style.display = 'none';
    tanggalGroup.style.display = 'none';
  } else {
    // Untuk laporan lain, tampilkan periode
    periodeGroup.style.display = 'block';
    
    // Update visibility bulan/tanggal berdasarkan periode
    const periode = document.getElementById('periodeLaporan').value;
    if (periode === 'harian') {
      bulanGroup.style.display = 'none';
      tanggalGroup.style.display = 'block';
    } else if (periode === 'bulanan') {
      bulanGroup.style.display = 'block';
      tanggalGroup.style.display = 'none';
    } else {
      bulanGroup.style.display = 'none';
      tanggalGroup.style.display = 'none';
    }
  }
};

// Tampilkan Laporan Keuangan Keseluruhan Tahun
window.tampilkanLaporanKeseluruhan = async function(tahun) {
  const laporanContent = document.getElementById('laporanContent');
  
  try {
    // Ambil semua data transaksi untuk tahun yang dipilih
    const penjualan = await API.get('/api/transaksi/penjualan');
    const pengeluaran = await API.get('/api/transaksi/pengeluaran');
    const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
    const partisipasi = await API.get('/api/partisipasi');
    
    // Filter data berdasarkan tahun - pastikan data array dan ada tanggal_transaksi
    const filteredPenjualan = Array.isArray(penjualan) ? penjualan.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun)) : [];
    const filteredPengeluaran = Array.isArray(pengeluaran) ? pengeluaran.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun)) : [];
    const filteredPendapatanLain = Array.isArray(pendapatanLain) ? pendapatanLain.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun)) : [];
    const filteredPartisipasi = Array.isArray(partisipasi) ? partisipasi.filter(p => p.tanggal_transaksi && p.tanggal_transaksi.startsWith(tahun)) : [];
    
    // Hitung total per kategori - pastikan parsing numerik yang benar
    const totalPenjualan = filteredPenjualan.reduce((sum, item) => {
      const nilai = parseFloat(item.jumlah_penjualan || 0);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);
    
    const totalHPP = filteredPenjualan.reduce((sum, item) => {
      const nilai = parseFloat(item.hpp || 0);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);
    
    const totalPendapatanLain = filteredPendapatanLain.reduce((sum, item) => {
      const nilai = parseFloat(item.jumlah || 0);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);
    
    const totalPartisipasi = filteredPartisipasi.reduce((sum, item) => {
      const nilai = parseFloat(item.jumlah_transaksi || 0);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);
    
    // Kategorisasi pengeluaran
    const pengeluaranOperasional = filteredPengeluaran.filter(p => 
      p.kategori !== 'Pembelian Barang' && p.kategori !== 'Pembelian Aset & Inventaris'
    );
    const pembelianBarang = filteredPengeluaran.filter(p => p.kategori === 'Pembelian Barang');
    const pembelianAset = filteredPengeluaran.filter(p => p.kategori === 'Pembelian Aset & Inventaris');
    
    const totalPengeluaranOperasional = pengeluaranOperasional.reduce((sum, item) => {
      const nilai = parseFloat(item.jumlah || 0);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);
    
    const totalPembelianBarang = pembelianBarang.reduce((sum, item) => {
      const nilai = parseFloat(item.jumlah || 0);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);
    
    const totalPembelianAset = pembelianAset.reduce((sum, item) => {
      const nilai = parseFloat(item.jumlah || 0);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);
    
    // Hitung ringkasan keuangan
    const totalPendapatan = totalPenjualan + totalPendapatanLain;
    const labaKotor = totalPendapatan - totalHPP;
    const labaBersih = labaKotor - totalPengeluaranOperasional;
    
    // Debug logging
    console.log('=== DEBUG LAPORAN KESELURUHAN ===');
    console.log('Tahun:', tahun);
    console.log('Total Penjualan:', totalPenjualan);
    console.log('Total Pendapatan Lain:', totalPendapatanLain);
    console.log('Total Pendapatan (Penjualan + Pendapatan Lain):', totalPendapatan);
    console.log('Filtered Pendapatan Lain Data:', filteredPendapatanLain);
    // Hitung persentase dengan validasi
    const persentasePenjualan = totalPendapatan > 0 ? ((totalPenjualan / totalPendapatan) * 100) : 0;
    const persentasePendapatanLain = totalPendapatan > 0 ? ((totalPendapatanLain / totalPendapatan) * 100) : 0;
    
    console.log('Persentase Penjualan (calculated):', persentasePenjualan);
    console.log('Persentase Pendapatan Lain (calculated):', persentasePendapatanLain);
    console.log('=================================');
    
    // Hitung data per bulan untuk grafik
    const dataPerBulan = [];
    for (let bulan = 1; bulan <= 12; bulan++) {
      const bulanStr = bulan.toString().padStart(2, '0');
      const penjualanBulan = filteredPenjualan.filter(p => p.tanggal_transaksi.includes(`${tahun}-${bulanStr}`));
      const pengeluaranBulan = pengeluaranOperasional.filter(p => p.tanggal_transaksi.includes(`${tahun}-${bulanStr}`));
      const pendapatanLainBulan = filteredPendapatanLain.filter(p => p.tanggal_transaksi.includes(`${tahun}-${bulanStr}`));
      
      const totalPenjualanBulan = penjualanBulan.reduce((sum, item) => {
        const nilai = parseFloat(item.jumlah_penjualan || 0);
        return sum + (isNaN(nilai) ? 0 : nilai);
      }, 0);
      
      const totalPengeluaranBulan = pengeluaranBulan.reduce((sum, item) => {
        const nilai = parseFloat(item.jumlah || 0);
        return sum + (isNaN(nilai) ? 0 : nilai);
      }, 0);
      
      const totalPendapatanLainBulan = pendapatanLainBulan.reduce((sum, item) => {
        const nilai = parseFloat(item.jumlah || 0);
        return sum + (isNaN(nilai) ? 0 : nilai);
      }, 0);
      
      dataPerBulan.push({
        bulan: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][bulan - 1],
        penjualan: totalPenjualanBulan,
        pengeluaran: totalPengeluaranBulan,
        pendapatanLain: totalPendapatanLainBulan,
        netIncome: (totalPenjualanBulan + totalPendapatanLainBulan) - totalPengeluaranBulan
      });
    }
    
    laporanContent.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h2 style="margin: 0 0 10px 0; font-size: 28px;">📊 Laporan Keuangan Keseluruhan</h2>
        <p style="margin: 0; font-size: 18px; opacity: 0.9;">Tahun ${tahun}</p>
      </div>
      
      <!-- Ringkasan Keuangan -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Total Pendapatan</div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(totalPendapatan)}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">Penjualan + Pendapatan Lain</div>
        </div>
        
        <div style="background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Laba Kotor</div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(labaKotor)}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">Pendapatan - HPP</div>
        </div>
        
        <div style="background: linear-gradient(135deg, ${labaBersih >= 0 ? '#FF9800, #F57C00' : '#f44336, #d32f2f'}); color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">${labaBersih >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(Math.abs(labaBersih))}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">Laba Kotor - Biaya Operasional</div>
        </div>
        
        <div style="background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Total Partisipasi</div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(totalPartisipasi)}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">Transaksi Anggota</div>
        </div>
      </div>
      
      <!-- Detail Pendapatan -->
      <div class="card" style="margin-bottom: 30px;">
        <div class="card-header">
          <h4 style="color: #4CAF50; margin: 0;">💰 Detail Pendapatan</h4>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Kategori</th>
                <th style="text-align: right;">Jumlah</th>
                <th style="text-align: right;">Persentase</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Penjualan</td>
                <td style="text-align: right;">${formatCurrency(totalPenjualan)}</td>
                <td style="text-align: right;">${persentasePenjualan.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>Pendapatan Lain</td>
                <td style="text-align: right;">${formatCurrency(totalPendapatanLain)}</td>
                <td style="text-align: right;">${persentasePendapatanLain.toFixed(1)}%</td>
              </tr>
              <tr style="background: #e8f5e9; font-weight: bold;">
                <td><strong>Total Pendapatan</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(totalPendapatan)}</strong></td>
                <td style="text-align: right;"><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Detail Pengeluaran -->
      <div class="card" style="margin-bottom: 30px;">
        <div class="card-header">
          <h4 style="color: #f44336; margin: 0;">💸 Detail Pengeluaran</h4>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Kategori</th>
                <th style="text-align: right;">Jumlah</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>HPP (Harga Pokok Penjualan)</td>
                <td style="text-align: right; color: #f44336;">${formatCurrency(totalHPP)}</td>
                <td style="font-size: 12px; color: #666;">Biaya langsung produksi</td>
              </tr>
              <tr>
                <td>Biaya Operasional</td>
                <td style="text-align: right; color: #f44336;">${formatCurrency(totalPengeluaranOperasional)}</td>
                <td style="font-size: 12px; color: #666;">Biaya operasional harian</td>
              </tr>
              <tr>
                <td>Pembelian Barang</td>
                <td style="text-align: right; color: #FF9800;">${formatCurrency(totalPembelianBarang)}</td>
                <td style="font-size: 12px; color: #666;">Masuk ke persediaan</td>
              </tr>
              <tr>
                <td>Pembelian Aset & Inventaris</td>
                <td style="text-align: right; color: #FF9800;">${formatCurrency(totalPembelianAset)}</td>
                <td style="font-size: 12px; color: #666;">Masuk ke aset tetap</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Grafik Tren Bulanan -->
      <div class="card" style="margin-bottom: 30px;">
        <div class="card-header">
          <h4 style="color: #2196F3; margin: 0;">📈 Tren Keuangan Bulanan ${tahun}</h4>
        </div>
        <div style="padding: 20px;">
          <canvas id="trenBulananChart" width="800" height="400"></canvas>
        </div>
      </div>
      
      <!-- Ringkasan Transaksi -->
      <div class="card">
        <div class="card-header">
          <h4 style="color: #9C27B0; margin: 0;">📋 Ringkasan Transaksi</h4>
        </div>
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #4CAF50;">${filteredPenjualan.length}</div>
              <div style="color: #666; margin-top: 5px;">Transaksi Penjualan</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #f44336;">${filteredPengeluaran.length}</div>
              <div style="color: #666; margin-top: 5px;">Transaksi Pengeluaran</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #2196F3;">${filteredPendapatanLain.length}</div>
              <div style="color: #666; margin-top: 5px;">Pendapatan Lain</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #9C27B0;">${filteredPartisipasi.length}</div>
              <div style="color: #666; margin-top: 5px;">Partisipasi Anggota</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render chart setelah DOM ready
    setTimeout(() => {
      renderTrenBulananChart(dataPerBulan);
    }, 100);
    
  } catch (error) {
    laporanContent.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
  }
};

// Render chart tren bulanan
window.renderTrenBulananChart = function(data) {
  const canvas = document.getElementById('trenBulananChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Setup
  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => Math.max(d.penjualan, d.pengeluaran, d.pendapatanLain)));
  const scale = chartHeight / (maxValue * 1.1);
  
  // Draw grid lines
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const y = padding + (chartHeight * i / 10);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
  }
  
  // Draw month labels
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const x = padding + (chartWidth * i / (data.length - 1));
    ctx.fillText(d.bulan, x, height - 20);
  });
  
  // Draw value labels
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const value = (maxValue * i / 5);
    const y = padding + chartHeight - (chartHeight * i / 5);
    ctx.fillText(formatCurrency(value), padding - 10, y + 4);
  }
  
  // Draw lines
  const drawLine = (values, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    values.forEach((value, i) => {
      const x = padding + (chartWidth * i / (values.length - 1));
      const y = padding + chartHeight - (value * scale);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = color;
    values.forEach((value, i) => {
      const x = padding + (chartWidth * i / (values.length - 1));
      const y = padding + chartHeight - (value * scale);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };
  
  // Draw lines for each category
  drawLine(data.map(d => d.penjualan), '#4CAF50');
  drawLine(data.map(d => d.pengeluaran), '#f44336');
  drawLine(data.map(d => d.pendapatanLain), '#2196F3');
  
  // Draw legend
  const legend = [
    { label: 'Penjualan', color: '#4CAF50' },
    { label: 'Pengeluaran', color: '#f44336' },
    { label: 'Pendapatan Lain', color: '#2196F3' }
  ];
  
  ctx.font = '14px Arial';
  legend.forEach((item, i) => {
    const x = padding + 20;
    const y = padding + 20 + (i * 25);
    
    // Draw color box
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y - 10, 15, 15);
    
    // Draw label
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, x + 25, y + 2);
  });
};

// Cetak Laporan
window.cetakLaporan = async function() {
  const jenis = document.getElementById('jenisLaporan')?.value;
  const periode = document.getElementById('periodeLaporan')?.value;
  const tahun = document.getElementById('tahunLaporan')?.value;
  const bulan = document.getElementById('bulanLaporan')?.value;
  const tanggal = document.getElementById('tanggalLaporan')?.value;
  
  if (!jenis) {
    alert('Silakan pilih jenis laporan terlebih dahulu');
    return;
  }
  
  if (jenis === 'neraca') {
    window.cetakLaporanNeraca(periode, tahun, bulan, tanggal);
  } else if (jenis === 'aruskas') {
    window.cetakLaporanArusKas(periode, tahun, bulan, tanggal);
  } else if (jenis === 'bukukas') {
    // Cetak Buku Kas
    await cetakBukuKasFromLaporan(periode, tahun, bulan, tanggal);
  } else {
    alert('Cetak untuk jenis laporan ini belum tersedia');
  }
};

// Export Excel
window.exportExcel = async function() {
  const jenis = document.getElementById('jenisLaporan')?.value;
  const periode = document.getElementById('periodeLaporan')?.value;
  const tahun = document.getElementById('tahunLaporan')?.value;
  const bulan = document.getElementById('bulanLaporan')?.value;
  const tanggal = document.getElementById('tanggalLaporan')?.value;
  
  if (!jenis) {
    alert('Silakan pilih jenis laporan terlebih dahulu');
    return;
  }
  
  if (jenis === 'bukukas') {
    // Export Buku Kas
    await exportBukuKasFromLaporan(periode, tahun, bulan, tanggal);
  } else {
    alert('Export Excel untuk jenis laporan ini belum tersedia');
  }
};

// Helper function untuk cetak Buku Kas dari halaman laporan
async function cetakBukuKasFromLaporan(periode, tahun, bulan, tanggal) {
  try {
    const info = await API.get('/api/koperasi-info');
    
    // Get all transactions
    const [simpanan, penjualan, pengeluaran, pendapatanLain] = await Promise.all([
      API.get('/api/simpanan/all'),
      API.get('/api/transaksi/penjualan'),
      API.get('/api/transaksi/pengeluaran'),
      API.get('/api/transaksi/pendapatan-lain')
    ]);
    
    // Build transactions array
    const allTransactions = [];
    
    simpanan.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `Simpanan ${item.jenis_simpanan} - ${item.nama_lengkap} (${item.nomor_anggota})`,
        penerimaan: parseFloat(item.jumlah || 0),
        pengeluaran: 0
      });
    });
    
    penjualan.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `Penjualan - ${item.keterangan || 'Hasil Penjualan'} (${item.nama_usaha || '-'})`,
        penerimaan: parseFloat(item.jumlah_penjualan || 0),
        pengeluaran: 0
      });
    });
    
    pendapatanLain.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `Pendapatan Lain - ${item.keterangan || '-'}`,
        penerimaan: parseFloat(item.jumlah || 0),
        pengeluaran: 0
      });
    });
    
    pengeluaran.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `${item.kategori || 'Pengeluaran'} - ${item.keterangan || '-'}`,
        penerimaan: 0,
        pengeluaran: parseFloat(item.jumlah || 0)
      });
    });
    
    // Filter by periode
    let filteredTransactions = allTransactions;
    if (periode === 'harian' && tanggal) {
      filteredTransactions = allTransactions.filter(t => t.tanggal === tanggal);
    } else if (periode === 'bulanan' && bulan) {
      filteredTransactions = allTransactions.filter(t => t.tanggal && t.tanggal.startsWith(`${tahun}-${bulan}`));
    } else if (periode === 'tahunan') {
      filteredTransactions = allTransactions.filter(t => t.tanggal && t.tanggal.startsWith(tahun));
    }
    
    // Sort by date
    filteredTransactions.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    
    // Calculate running balance
    let saldo = 0;
    const rows = filteredTransactions.map((item, index) => {
      saldo += item.penerimaan - item.pengeluaran;
      return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${formatDate(item.tanggal)}</td>
          <td>${item.uraian}</td>
          <td style="text-align: right;">${item.penerimaan > 0 ? formatCurrency(item.penerimaan) : '-'}</td>
          <td style="text-align: right;">${item.pengeluaran > 0 ? formatCurrency(item.pengeluaran) : '-'}</td>
          <td style="text-align: right; font-weight: bold;">${formatCurrency(saldo)}</td>
        </tr>
      `;
    }).join('');
    
    const totalPenerimaan = filteredTransactions.reduce((sum, t) => sum + t.penerimaan, 0);
    const totalPengeluaran = filteredTransactions.reduce((sum, t) => sum + t.pengeluaran, 0);
    
    // Format periode
    let periodeText = '';
    if (periode === 'harian' && tanggal) {
      const date = new Date(tanggal);
      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      periodeText = `${date.getDate()} ${namaBulan[date.getMonth()]} ${date.getFullYear()}`;
    } else if (periode === 'bulanan' && bulan) {
      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      periodeText = `${namaBulan[parseInt(bulan) - 1]} ${tahun}`;
    } else if (periode === 'tahunan') {
      periodeText = `Tahun ${tahun}`;
    } else if (periode === 'seluruh') {
      periodeText = `Seluruh Data`;
    } else {
      periodeText = `Tahun ${tahun}`;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Buku Kas - ${info.nama_koperasi || 'Koperasi'}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header h2 { margin: 5px 0; }
          .header p { margin: 3px 0; font-size: 14px; }
          .periode { text-align: center; margin: 15px 0; font-weight: bold; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th, td { border: 1px solid #333; padding: 6px; }
          th { background-color: #2E7D32; color: white; text-align: center; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tfoot tr { background-color: #f0f0f0; font-weight: bold; }
          .summary { margin-top: 20px; padding: 15px; background: #f8f9fa; border: 1px solid #ddd; }
          .summary-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .footer { margin-top: 30px; font-size: 12px; text-align: right; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${info.nama_koperasi || 'Koperasi'}</h2>
          <p>${info.alamat || ''}</p>
          <p>Telp: ${info.nomor_telpon || '-'} | Email: ${info.email || '-'}</p>
          <h3 style="margin-top: 15px;">BUKU KAS</h3>
        </div>
        
        <div class="periode">Periode: ${periodeText}</div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">No.</th>
              <th style="width: 90px;">Tanggal</th>
              <th>Uraian</th>
              <th style="width: 120px;">Penerimaan (Rp)</th>
              <th style="width: 120px;">Pengeluaran (Rp)</th>
              <th style="width: 120px;">Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right;"><strong>TOTAL</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(totalPenerimaan)}</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(totalPengeluaran)}</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(saldo)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="summary">
          <h4 style="margin: 0 0 10px 0;">Ringkasan</h4>
          <div class="summary-row">
            <span>Total Penerimaan:</span>
            <strong>${formatCurrency(totalPenerimaan)}</strong>
          </div>
          <div class="summary-row">
            <span>Total Pengeluaran:</span>
            <strong>${formatCurrency(totalPengeluaran)}</strong>
          </div>
          <div class="summary-row" style="border-top: 2px solid #333; padding-top: 8px; margin-top: 8px;">
            <span>Saldo Akhir:</span>
            <strong style="color: ${saldo >= 0 ? '#2E7D32' : '#d32f2f'};">${formatCurrency(saldo)}</strong>
          </div>
        </div>
        
        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2E7D32; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Cetak Dokumen
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Tutup
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Helper function untuk export Buku Kas dari halaman laporan
async function exportBukuKasFromLaporan(periode, tahun, bulan, tanggal) {
  try {
    // Get all transactions
    const [simpanan, penjualan, pengeluaran, pendapatanLain] = await Promise.all([
      API.get('/api/simpanan/all'),
      API.get('/api/transaksi/penjualan'),
      API.get('/api/transaksi/pengeluaran'),
      API.get('/api/transaksi/pendapatan-lain')
    ]);
    
    // Build transactions array
    const allTransactions = [];
    
    simpanan.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `Simpanan ${item.jenis_simpanan} - ${item.nama_lengkap} (${item.nomor_anggota})`,
        penerimaan: parseFloat(item.jumlah || 0),
        pengeluaran: 0
      });
    });
    
    penjualan.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `Penjualan - ${item.keterangan || 'Hasil Penjualan'} (${item.nama_usaha || '-'})`,
        penerimaan: parseFloat(item.jumlah_penjualan || 0),
        pengeluaran: 0
      });
    });
    
    pendapatanLain.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `Pendapatan Lain - ${item.keterangan || '-'}`,
        penerimaan: parseFloat(item.jumlah || 0),
        pengeluaran: 0
      });
    });
    
    pengeluaran.forEach(item => {
      allTransactions.push({
        tanggal: item.tanggal_transaksi,
        uraian: `${item.kategori || 'Pengeluaran'} - ${item.keterangan || '-'}`,
        penerimaan: 0,
        pengeluaran: parseFloat(item.jumlah || 0)
      });
    });
    
    // Filter by periode
    let filteredTransactions = allTransactions;
    if (periode === 'harian' && tanggal) {
      filteredTransactions = allTransactions.filter(t => t.tanggal === tanggal);
    } else if (periode === 'bulanan' && bulan) {
      filteredTransactions = allTransactions.filter(t => t.tanggal && t.tanggal.startsWith(`${tahun}-${bulan}`));
    } else if (periode === 'tahunan') {
      filteredTransactions = allTransactions.filter(t => t.tanggal && t.tanggal.startsWith(tahun));
    }
    
    // Sort by date
    filteredTransactions.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    
    // Build CSV
    let saldo = 0;
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;
    
    let csv = 'No.,Tanggal,Uraian,Penerimaan (Rp),Pengeluaran (Rp),Saldo (Rp)\n';
    
    filteredTransactions.forEach((item, index) => {
      saldo += item.penerimaan - item.pengeluaran;
      totalPenerimaan += item.penerimaan;
      totalPengeluaran += item.pengeluaran;
      
      const uraian = (item.uraian || '').replace(/"/g, '""');
      csv += `${index + 1},"${formatDate(item.tanggal)}","${uraian}",${item.penerimaan},${item.pengeluaran},${saldo}\n`;
    });
    
    csv += `\nTOTAL,,,${totalPenerimaan},${totalPengeluaran},${saldo}\n`;
    
    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `buku-kas-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Data Buku Kas berhasil diexport!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Pengaturan
window.renderPengaturan = async function() {
  const users = await API.get('/api/users');
  const koperasiInfo = await API.get('/api/koperasi-info');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Cek apakah user adalah kasir
  const isKasir = currentUser.role === 'Kasir';
  
  contentArea.innerHTML = `
    <!-- Manajemen User Section -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Manajemen User</h3>
        ${!isKasir ? `<button class="btn btn-primary" onclick="tambahUser()"><i data-feather="plus"></i> Tambah User</button>` : ''}
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Nama Lengkap</th>
              <th>Role</th>
              <th>Hak Akses</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${item.username}</strong></td>
                <td>${item.nama_lengkap}</td>
                <td><span class="badge badge-info">${item.role}</span></td>
                <td>${item.hak_akses || 'all'}</td>
                <td><span class="badge badge-${item.status === 'aktif' ? 'success' : 'danger'}">${item.status}</span></td>
                <td>
                  <div class="btn-group">
                    ${!isKasir ? `<button class="btn btn-sm btn-warning" onclick="editUser(${item.id})"><i data-feather="edit"></i> Edit</button>` : ''}
                    ${!isKasir && item.id !== 1 ? `<button class="btn btn-sm btn-danger" onclick="hapusUser(${item.id})"><i data-feather="trash-2"></i> Hapus</button>` : ''}
                    ${isKasir ? '<span class="badge badge-warning">Akses Terbatas</span>' : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.tambahUser = function() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Cek apakah user adalah kasir
  if (currentUser.role === 'Kasir') {
    alert('Anda tidak memiliki akses untuk menambah user');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Tambah User</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="tambahUserForm">
        <div class="form-row">
          <div class="form-group">
            <label>Username *</label>
            <input type="text" name="username" required>
          </div>
          <div class="form-group">
            <label>Password *</label>
            <input type="password" name="password" required>
          </div>
        </div>
        
        <div class="form-group">
          <label>Nama Lengkap *</label>
          <input type="text" name="nama_lengkap" required>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Role *</label>
            <select name="role" required>
              <option value="Admin">Admin</option>
              <option value="Pengurus">Pengurus</option>
              <option value="Pengawas">Pengawas</option>
              <option value="Kasir">Kasir</option>
            </select>
          </div>
          <div class="form-group">
            <label>Hak Akses</label>
            <input type="text" name="hak_akses" value="all" placeholder="all atau pisahkan dengan koma">
          </div>
        </div>
        
        <div class="form-group">
          <label>Foto</label>
          <input type="file" name="foto" accept="image/*">
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('tambahUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('User berhasil ditambahkan');
        modal.remove();
        window.renderPengaturan();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  });
};

window.hapusUser = async function(id) {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Cek apakah user adalah kasir
  if (currentUser.role === 'Kasir') {
    alert('Anda tidak memiliki akses untuk menghapus user');
    return;
  }
  
  if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
    const result = await API.delete(`/api/users/${id}`);
    alert(result.message);
    window.renderPengaturan();
  }
};

// Detail Anggota
window.detailAnggota = async function(id) {
  const anggota = await API.get(`/api/anggota/${id}`);
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Detail Anggota</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <div style="text-align: center; margin-bottom: 20px;">
        ${anggota.foto ? `<img src="/uploads/${anggota.foto}?t=${Date.now()}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 50%; border: 4px solid var(--primary-green);" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">` : ''}<div style="width: 120px; height: 120px; background: #f0f0f0; border-radius: 50%; display: ${anggota.foto ? 'none' : 'inline-flex'}; align-items: center; justify-content: center; font-size: 48px;">👤</div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Nomor Anggota</label>
          <p><strong>${anggota.nomor_anggota}</strong></p>
        </div>
        <div class="form-group">
          <label>Nama Lengkap</label>
          <p><strong>${anggota.nama_lengkap}</strong></p>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>NIK</label>
          <p>${anggota.nik || '-'}</p>
        </div>
        <div class="form-group">
          <label>Jenis Kelamin</label>
          <p>${anggota.jenis_kelamin || '-'}</p>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Tempat, Tanggal Lahir</label>
          <p>${anggota.tempat_lahir || '-'}, ${formatDate(anggota.tanggal_lahir)}</p>
        </div>
        <div class="form-group">
          <label>Pekerjaan</label>
          <p>${anggota.pekerjaan || '-'}</p>
        </div>
      </div>
      
      <div class="form-group">
        <label>Alamat</label>
        <p>${anggota.alamat || '-'}</p>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Nomor Telepon</label>
          <p>${anggota.nomor_telpon || '-'}</p>
        </div>
        <div class="form-group">
          <label>Email</label>
          <p>${anggota.email || '-'}</p>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Tanggal Bergabung</label>
          <p>${formatDate(anggota.tanggal_bergabung)}</p>
        </div>
        <div class="form-group">
          <label>Status</label>
          <p><span class="badge badge-${anggota.status === 'aktif' ? 'success' : 'danger'}">${anggota.status}</span></p>
        </div>
      </div>
      
      <div class="btn-group" style="margin-top: 20px;">
        <button class="btn btn-warning" onclick="this.closest('.modal').remove(); editAnggota(${id});">Edit</button>
        <button class="btn btn-danger" onclick="this.closest('.modal').remove()">Tutup</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
};

// Edit Anggota
window.editAnggota = async function(id) {
  const anggota = await API.get(`/api/anggota/${id}`);
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit Anggota</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editAnggotaForm">
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Anggota *</label>
            <input type="text" name="nomor_anggota" value="${anggota.nomor_anggota}" required>
          </div>
          <div class="form-group">
            <label>Nama Lengkap *</label>
            <input type="text" name="nama_lengkap" value="${anggota.nama_lengkap}" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>NIK</label>
            <input type="text" name="nik" value="${anggota.nik || ''}">
          </div>
          <div class="form-group">
            <label>Jenis Kelamin</label>
            <select name="jenis_kelamin">
              <option value="">Pilih</option>
              <option value="Laki-laki" ${anggota.jenis_kelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
              <option value="Perempuan" ${anggota.jenis_kelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Tempat Lahir</label>
            <input type="text" name="tempat_lahir" value="${anggota.tempat_lahir || ''}">
          </div>
          <div class="form-group">
            <label>Tanggal Lahir</label>
            <input type="date" name="tanggal_lahir" value="${anggota.tanggal_lahir || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label>Alamat</label>
          <textarea name="alamat">${anggota.alamat || ''}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Nomor Telepon</label>
            <input type="text" name="nomor_telpon" value="${anggota.nomor_telpon || ''}">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${anggota.email || ''}">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" value="${anggota.username || ''}">
          </div>
          <div class="form-group">
            <label>Password (kosongkan jika tidak diubah)</label>
            <input type="password" name="password" placeholder="Kosongkan jika tidak diubah">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Pekerjaan</label>
            <input type="text" name="pekerjaan" value="${anggota.pekerjaan || ''}">
          </div>
          <div class="form-group">
            <label>Tanggal Bergabung</label>
            <input type="date" name="tanggal_bergabung" value="${anggota.tanggal_bergabung || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label>Status</label>
          <select name="status">
            <option value="aktif" ${anggota.status === 'aktif' ? 'selected' : ''}>Aktif</option>
            <option value="nonaktif" ${anggota.status === 'nonaktif' ? 'selected' : ''}>Non-Aktif</option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Foto Profil</label>
            ${anggota.foto ? `<div style="margin-bottom: 10px;"><img src="/uploads/${anggota.foto}?t=${Date.now()}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'"></div>` : ''}
            <input type="file" name="foto" accept="image/*" onchange="previewImage(this, 'previewFotoEdit')">
            <div id="previewFotoEdit" style="margin-top: 10px;"></div>
          </div>
          <div class="form-group">
            <label>Foto KTP</label>
            ${anggota.foto_ktp ? `
              <div style="margin-bottom: 10px;">
                <button type="button" class="btn btn-sm btn-info" onclick="viewFotoKTP('${anggota.foto_ktp}')">
                  <i data-feather="image"></i> Lihat KTP Saat Ini
                </button>
              </div>
            ` : ''}
            <input type="file" name="foto_ktp" accept="image/*,.pdf" onchange="previewImage(this, 'previewKTPEdit')">
            <small style="color: #666; font-size: 12px;">Format: JPG, PNG, PDF. Max 5MB</small>
            <div id="previewKTPEdit" style="margin-top: 10px;"></div>
          </div>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('editAnggotaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`/api/anggota/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Anggota berhasil diupdate');
        modal.remove();
        window.renderDataAnggota();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  });
};

// Edit Unit Usaha - Moved to pages-extended.js

// Edit User
window.editUser = async function(id) {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Cek apakah user adalah kasir
  if (currentUser.role === 'Kasir') {
    alert('Anda tidak memiliki akses untuk mengedit user');
    return;
  }
  
  const users = await API.get('/api/users');
  const user = users.find(u => u.id === id);
  
  if (!user) {
    alert('Data tidak ditemukan');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit User</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editUserForm">
        <div class="form-row">
          <div class="form-group">
            <label>Username *</label>
            <input type="text" name="username" value="${user.username}" required>
          </div>
          <div class="form-group">
            <label>Password (kosongkan jika tidak diubah)</label>
            <input type="password" name="password">
          </div>
        </div>
        
        <div class="form-group">
          <label>Nama Lengkap *</label>
          <input type="text" name="nama_lengkap" value="${user.nama_lengkap}" required>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Role *</label>
            <select name="role" required>
              <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
              <option value="Pengurus" ${user.role === 'Pengurus' ? 'selected' : ''}>Pengurus</option>
              <option value="Pengawas" ${user.role === 'Pengawas' ? 'selected' : ''}>Pengawas</option>
              <option value="Kasir" ${user.role === 'Kasir' ? 'selected' : ''}>Kasir</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <option value="aktif" ${user.status === 'aktif' ? 'selected' : ''}>Aktif</option>
              <option value="nonaktif" ${user.status === 'nonaktif' ? 'selected' : ''}>Non-Aktif</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label>Hak Akses</label>
          <input type="text" name="hak_akses" value="${user.hak_akses || 'all'}" placeholder="all atau pisahkan dengan koma">
        </div>
        
        <div class="form-group">
          <label>Foto</label>
          <input type="file" name="foto" accept="image/*">
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('User berhasil diupdate');
        modal.remove();
        window.renderPengaturan();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  });
};







// Debug: Log fungsi yang tersedia
console.log('pages.js loaded');
console.log('Available render functions:');
console.log('- renderBeranda:', typeof window.renderBeranda);
console.log('- renderInfoKoperasi:', typeof window.renderInfoKoperasi);
console.log('- renderUnitUsaha:', typeof window.renderUnitUsaha);
console.log('- renderAsetInventaris:', typeof window.renderAsetInventaris);
console.log('- renderDataAnggota:', typeof window.renderDataAnggota);
console.log('- renderDataPengurus:', typeof window.renderDataPengurus);
console.log('- renderDataKaryawan:', typeof window.renderDataKaryawan);
console.log('- renderSimpanan:', typeof window.renderSimpanan);
console.log('- renderPartisipasiAnggota:', typeof window.renderPartisipasiAnggota);
console.log('- renderPenjualan:', typeof window.renderPenjualan);
console.log('- renderPengeluaran:', typeof window.renderPengeluaran);
console.log('- renderSHU:', typeof window.renderSHU);
console.log('- renderLaporan:', typeof window.renderLaporan);
console.log('- renderPengaturan:', typeof window.renderPengaturan);

// Tambah Pendapatan Lain
window.tambahPendapatanLain = async function() {
  try {
    const unitUsaha = await API.get('/api/unit-usaha');
    
    if (!unitUsaha || unitUsaha.length === 0) {
      alert('Belum ada Unit Usaha. Silakan tambahkan Unit Usaha terlebih dahulu di menu Data Unit Usaha.');
      return;
    }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Pendapatan Lain</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="tambahPendapatanLainForm">
        <div class="form-group">
          <label>Unit Usaha</label>
          <select name="unit_usaha_id">
            <option value="">Umum</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}">${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Kategori *</label>
            <select name="kategori" required>
              <option value="">Pilih Kategori</option>
              <option value="Bunga Bank">Bunga Bank</option>
              <option value="Sewa Aset">Sewa Aset</option>
              <option value="Jasa Konsultasi">Jasa Konsultasi</option>
              <option value="Komisi">Komisi</option>
              <option value="Hibah">Hibah</option>
              <option value="Donasi">Donasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div class="form-group">
            <label>Jumlah *</label>
            <input type="number" name="jumlah" required min="0" step="0.01" placeholder="0">
          </div>
        </div>
        
        <div class="form-group">
          <label>Tanggal Transaksi *</label>
          <input type="date" name="tanggal_transaksi" required value="${new Date().toISOString().split('T')[0]}">
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan" rows="3" placeholder="Keterangan tambahan (opsional)"></textarea>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('tambahPendapatanLainForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const result = await API.post('/api/transaksi/pendapatan-lain', data);
    alert(result.message);
    modal.remove();
    window.renderPendapatanLain();
  });
  } catch (error) {
    console.error('Error loading unit usaha:', error);
    alert('Gagal memuat data Unit Usaha: ' + error.message);
  }
};

// Edit Pendapatan Lain
window.editPendapatanLain = async function(id) {
  try {
    const pendapatanLain = await API.get('/api/transaksi/pendapatan-lain');
    const item = pendapatanLain.find(p => p.id === id);
    const unitUsaha = await API.get('/api/unit-usaha');
    
    if (!unitUsaha || unitUsaha.length === 0) {
      alert('Belum ada Unit Usaha. Silakan tambahkan Unit Usaha terlebih dahulu.');
      return;
    }
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit Pendapatan Lain</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="editPendapatanLainForm">
        <div class="form-group">
          <label>Unit Usaha</label>
          <select name="unit_usaha_id">
            <option value="">Umum</option>
            ${unitUsaha.filter(u => u.status && u.status.toLowerCase() === 'aktif').map(u => `
              <option value="${u.id}" ${u.id === item.unit_usaha_id ? 'selected' : ''}>${u.nama_usaha}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Kategori *</label>
            <select name="kategori" required>
              <option value="Bunga Bank" ${item.kategori === 'Bunga Bank' ? 'selected' : ''}>Bunga Bank</option>
              <option value="Sewa Aset" ${item.kategori === 'Sewa Aset' ? 'selected' : ''}>Sewa Aset</option>
              <option value="Jasa Konsultasi" ${item.kategori === 'Jasa Konsultasi' ? 'selected' : ''}>Jasa Konsultasi</option>
              <option value="Komisi" ${item.kategori === 'Komisi' ? 'selected' : ''}>Komisi</option>
              <option value="Hibah" ${item.kategori === 'Hibah' ? 'selected' : ''}>Hibah</option>
              <option value="Donasi" ${item.kategori === 'Donasi' ? 'selected' : ''}>Donasi</option>
              <option value="Lainnya" ${item.kategori === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
            </select>
          </div>
          <div class="form-group">
            <label>Jumlah *</label>
            <input type="number" name="jumlah" value="${item.jumlah}" required min="0" step="0.01">
          </div>
        </div>
        
        <div class="form-group">
          <label>Tanggal Transaksi *</label>
          <input type="date" name="tanggal_transaksi" value="${item.tanggal_transaksi}" required>
        </div>
        
        <div class="form-group">
          <label>Keterangan</label>
          <textarea name="keterangan" rows="3">${item.keterangan || ''}</textarea>
        </div>
        
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Update</button>
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Batal</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('editPendapatanLainForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const result = await API.put(`/api/transaksi/pendapatan-lain/${id}`, data);
    alert(result.message);
    modal.remove();
    window.renderPendapatanLain();
  });
  } catch (error) {
    console.error('Error editing pendapatan lain:', error);
    alert('Gagal memuat data: ' + error.message);
  }
};

// Delete Pendapatan Lain
window.deletePendapatanLain = async function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus data pendapatan lain ini?')) {
    const result = await API.delete(`/api/transaksi/pendapatan-lain/${id}`);
    alert(result.message);
    window.renderPendapatanLain();
  }
};



// Render Profil User
window.renderProfil = async function() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  contentArea.innerHTML = `
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-photo-container">
          ${user.foto ? `
            <img src="${user.foto}" alt="Foto Profil" class="profile-photo" id="profilePhoto">
          ` : `
            <div class="profile-photo-placeholder" id="profilePhotoPlaceholder">
              ${user.nama_lengkap ? user.nama_lengkap.charAt(0).toUpperCase() : 'U'}
            </div>
          `}
          <label class="profile-photo-upload" for="photoUpload">
            <i data-feather="camera"></i>
            <input type="file" id="photoUpload" accept="image/*">
          </label>
        </div>
        <div class="profile-info">
          <h2>${user.nama_lengkap || 'User'}</h2>
          <p>${user.role || 'User'} • ${user.username || ''}</p>
        </div>
      </div>
      
      <div class="profile-content">
        <div class="profile-card">
          <h3>
            <i data-feather="user"></i>
            Informasi Akun
          </h3>
          <div class="info-row">
            <span class="info-label">Username</span>
            <span class="info-value">${user.username || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nama Lengkap</span>
            <span class="info-value">${user.nama_lengkap || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Role</span>
            <span class="info-value">${user.role || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="color: var(--success);">● Aktif</span>
          </div>
        </div>
        
        <div class="profile-card">
          <h3>
            <i data-feather="lock"></i>
            Ganti Password
          </h3>
          <form class="password-form" id="changePasswordForm">
            <div class="form-group">
              <label>Password Lama</label>
              <input type="password" id="oldPassword" required>
            </div>
            <div class="form-group">
              <label>Password Baru</label>
              <input type="password" id="newPassword" required minlength="6">
            </div>
            <div class="form-group">
              <label>Konfirmasi Password Baru</label>
              <input type="password" id="confirmPassword" required minlength="6">
            </div>
            <div class="password-requirements">
              <strong>Persyaratan Password:</strong>
              <ul>
                <li>Minimal 6 karakter</li>
                <li>Kombinasi huruf dan angka (recommended)</li>
                <li>Hindari password yang mudah ditebak</li>
              </ul>
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              <i data-feather="save"></i> Ganti Password
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  
  feather.replace();
  
  // Handle photo upload
  document.getElementById('photoUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB!');
      return;
    }
    
    const formData = new FormData();
    formData.append('foto', file);
    
    try {
      const response = await API.uploadFile('/api/users/upload-photo', formData);
      
      if (response.success) {
        alert('Foto profil berhasil diupdate!');
        
        // Update user data in localStorage
        user.foto = response.foto;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update header user photo
        const userPhoto = document.getElementById('userPhoto');
        const userAvatarPlaceholder = document.getElementById('userAvatarPlaceholder');
        if (userPhoto) {
          userPhoto.src = response.foto;
          userPhoto.style.display = 'block';
          if (userAvatarPlaceholder) userAvatarPlaceholder.style.display = 'none';
        }
        
        // Reload page
        renderProfil();
      } else {
        alert('Gagal upload foto: ' + response.message);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Terjadi kesalahan saat upload foto');
    }
  });
  
  // Handle password change
  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate
    if (newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi password tidak cocok!');
      return;
    }
    
    if (newPassword.length < 6) {
      alert('Password baru minimal 6 karakter!');
      return;
    }
    
    try {
      const response = await API.post('/api/users/change-password', {
        oldPassword,
        newPassword
      });
      
      if (response.success) {
        alert('Password berhasil diubah!');
        document.getElementById('changePasswordForm').reset();
      } else {
        alert('Gagal ubah password: ' + response.message);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Terjadi kesalahan saat mengubah password');
    }
  });
};

// Function to update sidebar logo koperasi (NOT user photo)
// This function is only used when uploading logo koperasi from Info Koperasi page
function updateSidebarLogo(logoUrl) {
  const sidebarLogo = document.getElementById('sidebarLogo');
  const logoPlaceholder = document.getElementById('logoPlaceholder');
  
  if (logoUrl) {
    sidebarLogo.src = logoUrl;
    sidebarLogo.style.display = 'block';
    if (logoPlaceholder) logoPlaceholder.style.display = 'none';
  }
}


// ===== PENGUMUMAN PAGE =====
window.renderPengumuman = async function() {
  try {
    const pengumuman = await API.get('/api/pengumuman');
    
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i data-feather="megaphone"></i>
            Kelola Pengumuman
          </h3>
          <button class="btn btn-primary" onclick="tambahPengumuman()">
            <i data-feather="plus"></i> Tambah Pengumuman
          </button>
        </div>
        
        <div class="card-body">
          ${pengumuman.length === 0 ? `
            <div class="empty-state">
              <i data-feather="megaphone"></i>
              <h3>Belum Ada Pengumuman</h3>
              <p>Klik tombol "Tambah Pengumuman" untuk membuat pengumuman baru</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Gambar</th>
                    <th>Judul</th>
                    <th>Konten</th>
                    <th>Status</th>
                    <th>Periode</th>
                    <th>Urutan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${pengumuman.map(item => `
                    <tr>
                      <td>
                        <img src="/uploads/${item.gambar}" alt="${item.judul}" 
                             style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;">
                      </td>
                      <td><strong>${item.judul}</strong></td>
                      <td>${item.konten ? (item.konten.length > 50 ? item.konten.substring(0, 50) + '...' : item.konten) : '-'}</td>
                      <td>
                        <span class="badge badge-${item.status === 'aktif' ? 'success' : 'secondary'}">
                          ${item.status}
                        </span>
                      </td>
                      <td>
                        ${item.tanggal_mulai ? formatDate(item.tanggal_mulai) : '-'}<br>
                        ${item.tanggal_selesai ? 's/d ' + formatDate(item.tanggal_selesai) : ''}
                      </td>
                      <td>${item.urutan}</td>
                      <td>
                        <div class="btn-group">
                          <button class="btn btn-sm btn-warning" onclick="editPengumuman(${item.id})">
                            <i data-feather="edit"></i>
                          </button>
                          <button class="btn btn-sm btn-danger" onclick="hapusPengumuman(${item.id}, '${item.judul}')">
                            <i data-feather="trash-2"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading pengumuman:', error);
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="error-message">
            <p>Gagal memuat data pengumuman: ${error.message}</p>
          </div>
        </div>
      </div>
    `;
  }
};

// Tambah Pengumuman
window.tambahPengumuman = function() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Pengumuman</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <form id="formPengumuman" enctype="multipart/form-data">
        <div class="form-group">
          <label>Judul Pengumuman *</label>
          <input type="text" name="judul" required>
        </div>
        
        <div class="form-group">
          <label>Konten</label>
          <textarea name="konten" rows="3" placeholder="Isi konten pengumuman (opsional)"></textarea>
        </div>
        
        <div class="form-group">
          <label>Gambar Banner *</label>
          <input type="file" name="gambar" accept="image/*" required>
          <small style="color: #666;">Format: JPG, PNG, GIF. Maksimal 5MB. Rekomendasi ukuran: 1200x400px</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-Aktif</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Urutan</label>
            <input type="number" name="urutan" value="0" min="0">
            <small style="color: #666;">Urutan tampilan (0 = paling atas)</small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Tanggal Mulai</label>
            <input type="date" name="tanggal_mulai">
          </div>
          
          <div class="form-group">
            <label>Tanggal Selesai</label>
            <input type="date" name="tanggal_selesai">
          </div>
        </div>
        
        <div class="form-group">
          <label style="display: block; margin-bottom: 8px;">Opsi Tampilan</label>
          <div style="display: flex; gap: 20px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" name="tampilkan_judul" value="1" checked style="width: auto; cursor: pointer;">
              <span>Tampilkan Judul</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" name="tampilkan_konten" value="1" checked style="width: auto; cursor: pointer;">
              <span>Tampilkan Konten</span>
            </label>
          </div>
          <small style="color: #666;">Centang untuk menampilkan judul/konten di banner</small>
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
  
  document.getElementById('formPengumuman').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Handle checkbox values
    const tampilkanJudul = e.target.querySelector('input[name="tampilkan_judul"]').checked;
    const tampilkanKonten = e.target.querySelector('input[name="tampilkan_konten"]').checked;
    
    formData.set('tampilkan_judul', tampilkanJudul ? '1' : '0');
    formData.set('tampilkan_konten', tampilkanKonten ? '1' : '0');
    
    try {
      const response = await fetch('/api/pengumuman', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Pengumuman berhasil ditambahkan!');
        modal.remove();
        renderPengumuman();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    }
  });
};

// Edit Pengumuman
window.editPengumuman = async function(id) {
  try {
    const pengumuman = await API.get(`/api/pengumuman/${id}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Pengumuman</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        
        <form id="formEditPengumuman" enctype="multipart/form-data">
          <div class="form-group">
            <label>Judul Pengumuman *</label>
            <input type="text" name="judul" value="${pengumuman.judul}" required>
          </div>
          
          <div class="form-group">
            <label>Konten</label>
            <textarea name="konten" rows="3">${pengumuman.konten || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label>Gambar Banner</label>
            <input type="file" name="gambar" accept="image/*">
            <small style="color: #666;">
              Gambar saat ini: ${pengumuman.gambar}<br>
              Kosongkan jika tidak ingin mengubah gambar
            </small>
            ${pengumuman.gambar ? `
              <div style="margin-top: 10px;">
                <img src="/uploads/${pengumuman.gambar}" alt="Preview" 
                     style="max-width: 100%; height: auto; border-radius: 4px;">
              </div>
            ` : ''}
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Status</label>
              <select name="status">
                <option value="aktif" ${pengumuman.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                <option value="nonaktif" ${pengumuman.status === 'nonaktif' ? 'selected' : ''}>Non-Aktif</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Urutan</label>
              <input type="number" name="urutan" value="${pengumuman.urutan || 0}" min="0">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Tanggal Mulai</label>
              <input type="date" name="tanggal_mulai" value="${pengumuman.tanggal_mulai || ''}">
            </div>
            
            <div class="form-group">
              <label>Tanggal Selesai</label>
              <input type="date" name="tanggal_selesai" value="${pengumuman.tanggal_selesai || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label style="display: block; margin-bottom: 8px;">Opsi Tampilan</label>
            <div style="display: flex; gap: 20px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" name="tampilkan_judul" value="1" ${pengumuman.tampilkan_judul !== 0 ? 'checked' : ''} style="width: auto; cursor: pointer;">
                <span>Tampilkan Judul</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" name="tampilkan_konten" value="1" ${pengumuman.tampilkan_konten !== 0 ? 'checked' : ''} style="width: auto; cursor: pointer;">
                <span>Tampilkan Konten</span>
              </label>
            </div>
            <small style="color: #666;">Centang untuk menampilkan judul/konten di banner</small>
          </div>
          
          <div class="btn-group">
            <button type="submit" class="btn btn-primary">
              <i data-feather="save"></i> Update
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
    
    document.getElementById('formEditPengumuman').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Handle checkbox values
      const tampilkanJudul = e.target.querySelector('input[name="tampilkan_judul"]').checked;
      const tampilkanKonten = e.target.querySelector('input[name="tampilkan_konten"]').checked;
      
      formData.set('tampilkan_judul', tampilkanJudul ? '1' : '0');
      formData.set('tampilkan_konten', tampilkanKonten ? '1' : '0');
      
      try {
        const response = await fetch(`/api/pengumuman/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          alert('Pengumuman berhasil diupdate!');
          modal.remove();
          renderPengumuman();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
      }
    });
  } catch (error) {
    alert('Gagal memuat data pengumuman: ' + error.message);
  }
};

// Hapus Pengumuman
window.hapusPengumuman = async function(id, judul) {
  if (!confirm(`Apakah Anda yakin ingin menghapus pengumuman "${judul}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/pengumuman/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Pengumuman berhasil dihapus!');
      renderPengumuman();
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    alert('Terjadi kesalahan: ' + error.message);
  }
};

// Debug: Verify all functions are loaded
console.log('=== PAGES.JS LOADED ===');
console.log('renderSHU:', typeof window.renderSHU);
console.log('renderLaporan:', typeof window.renderLaporan);
console.log('renderPengumuman:', typeof window.renderPengumuman);
console.log('renderProfil:', typeof window.renderProfil);
console.log('renderPengaturan:', typeof window.renderPengaturan);
console.log('=======================');


// Export Simpanan Unified to Excel (CSV)
window.exportSimpananUnified = function() {
  if (!allSimpananData || allSimpananData.length === 0) {
    alert('Tidak ada data untuk diexport');
    return;
  }
  
  // Use filtered data
  const simpanan = filterSimpananData(allSimpananData);
  
  let csv = 'No,Tanggal,Jenis Simpanan,No. Anggota,Nama Anggota,Jumlah,Metode,Keterangan\n';
  
  simpanan.forEach((item, index) => {
    csv += `${index + 1},"${formatDate(item.tanggal_transaksi)}","${item.jenis_label || item.jenis_simpanan}","${item.nomor_anggota}","${item.nama_lengkap}","${item.jumlah}","${item.metode_pembayaran || '-'}","${item.keterangan || '-'}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `transaksi-simpanan-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  showNotification('Data transaksi simpanan berhasil diexport', 'success');
};

// Cetak Simpanan Unified
window.cetakSimpananUnified = async function() {
  if (!allSimpananData || allSimpananData.length === 0) {
    alert('Tidak ada data untuk dicetak');
    return;
  }
  
  // Use filtered data
  const simpanan = filterSimpananData(allSimpananData);
  const info = await API.get('/api/koperasi-info');
  
  const totalSimpanan = simpanan.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transaksi Simpanan - ${info.nama_koperasi || 'Koperasi'}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h2 { margin: 5px 0; }
        .header p { margin: 3px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #2E7D32; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin-top: 20px; text-align: right; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; text-align: right; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${info.nama_koperasi || 'Koperasi'}</h2>
        <p>${info.alamat || ''}</p>
        <p>Telp: ${info.nomor_telpon || '-'} | Email: ${info.email || '-'}</p>
        <h3 style="margin-top: 15px;">TRANSAKSI SIMPANAN</h3>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>No. Anggota</th>
            <th>Nama Anggota</th>
            <th>Jumlah</th>
            <th>Metode</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${simpanan.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${formatDate(item.tanggal_transaksi)}</td>
              <td>${item.jenis_label || item.jenis_simpanan}</td>
              <td>${item.nomor_anggota}</td>
              <td>${item.nama_lengkap}</td>
              <td style="text-align: right;">${formatCurrency(item.jumlah)}</td>
              <td>${item.metode_pembayaran || '-'}</td>
              <td>${item.keterangan || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        Total Simpanan: ${formatCurrency(totalSimpanan)}
      </div>
      
      <div class="footer">
        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2E7D32; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Cetak Dokumen
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
          Tutup
        </button>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
};

// Export Partisipasi Unified to Excel (CSV)
window.exportPartisipasiUnified = async function() {
  const partisipasi = await API.get('/api/partisipasi');
  
  let csv = 'No,Tanggal,No. Anggota,Nama Anggota,Unit Usaha,Jumlah Transaksi,Keterangan\n';
  
  partisipasi.forEach((item, index) => {
    csv += `${index + 1},"${formatDate(item.tanggal_transaksi)}","${item.nomor_anggota}","${item.nama_lengkap}","${item.nama_usaha || '-'}","${item.jumlah_transaksi}","${item.keterangan || '-'}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `partisipasi-anggota-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  showNotification('Data partisipasi anggota berhasil diexport', 'success');
};

// Cetak Partisipasi Unified
window.cetakPartisipasiUnified = async function() {
  const partisipasi = await API.get('/api/partisipasi');
  const info = await API.get('/api/koperasi-info');
  
  const totalPartisipasi = partisipasi.reduce((sum, item) => sum + parseFloat(item.jumlah_transaksi || 0), 0);
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Partisipasi Anggota - ${info.nama_koperasi || 'Koperasi'}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h2 { margin: 5px 0; }
        .header p { margin: 3px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #2E7D32; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin-top: 20px; text-align: right; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; text-align: right; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${info.nama_koperasi || 'Koperasi'}</h2>
        <p>${info.alamat || ''}</p>
        <p>Telp: ${info.nomor_telpon || '-'} | Email: ${info.email || '-'}</p>
        <h3 style="margin-top: 15px;">PARTISIPASI ANGGOTA</h3>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Anggota</th>
            <th>Nama Anggota</th>
            <th>Unit Usaha</th>
            <th>Jumlah Transaksi</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${partisipasi.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${formatDate(item.tanggal_transaksi)}</td>
              <td>${item.nomor_anggota}</td>
              <td>${item.nama_lengkap}</td>
              <td>${item.nama_usaha || '-'}</td>
              <td style="text-align: right;">${formatCurrency(item.jumlah_transaksi)}</td>
              <td>${item.keterangan || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        Total Partisipasi: ${formatCurrency(totalPartisipasi)}
      </div>
      
      <div class="footer">
        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2E7D32; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Cetak Dokumen
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
          Tutup
        </button>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
};


// Alias functions for compatibility
window.hapusPenjualan = window.deletePenjualan;
window.hapusPengeluaran = window.deletePengeluaran;
window.hapusPendapatanLain = window.deletePendapatanLain;


// ===== BUKTI PENGELUARAN UPLOAD FUNCTIONS =====

// Trigger file upload for pengeluaran
window.triggerFileUploadPengeluaran = function() {
  document.getElementById('buktiPengeluaran').click();
};

// Trigger camera capture for pengeluaran
window.triggerCameraCapturePengeluaran = function() {
  document.getElementById('buktiPengeluaranCamera').click();
};

// Handle camera capture for pengeluaran
window.handleCameraCapturePengeluaran = function(input) {
  const file = input.files[0];
  
  if (!file) return;
  
  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar! Maksimal 5MB');
    input.value = '';
    return;
  }
  
  // Transfer file to main input
  const mainInput = document.getElementById('buktiPengeluaran');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  mainInput.files = dataTransfer.files;
  
  // Trigger preview
  previewBuktiPengeluaran(mainInput);
  
  // Clear camera input
  input.value = '';
};

// Preview bukti pengeluaran
window.previewBuktiPengeluaran = function(input) {
  const file = input.files[0];
  const preview = document.getElementById('previewBuktiPengeluaran');
  
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


// Trigger file upload for pengeluaran edit
window.triggerFileUploadPengeluaranEdit = function() {
  document.getElementById('buktiPengeluaranEdit').click();
};

// Trigger camera capture for pengeluaran edit
window.triggerCameraCapturePengeluaranEdit = function() {
  document.getElementById('buktiPengeluaranCameraEdit').click();
};

// Handle camera capture for pengeluaran edit
window.handleCameraCapturePengeluaranEdit = function(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar! Maksimal 5MB');
    input.value = '';
    return;
  }
  
  const mainInput = document.getElementById('buktiPengeluaranEdit');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  mainInput.files = dataTransfer.files;
  
  previewBuktiPengeluaranEdit(mainInput);
  input.value = '';
};

// Preview bukti pengeluaran edit
window.previewBuktiPengeluaranEdit = function(input) {
  const file = input.files[0];
  const preview = document.getElementById('previewBuktiPengeluaranEdit');
  
  if (!preview) return;
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar! Maksimal 5MB');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung! Gunakan JPG, PNG, GIF, atau PDF');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
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


// ===== BUKTI PARTISIPASI UPLOAD FUNCTIONS =====

// Trigger file upload for partisipasi
window.triggerFileUploadPartisipasi = function() {
  document.getElementById('buktiPartisipasi').click();
};

// Trigger camera capture for partisipasi
window.triggerCameraCapturePartisipasi = function() {
  document.getElementById('buktiPartisipasiCamera').click();
};

// Handle camera capture for partisipasi
window.handleCameraCapturePartisipasi = function(input) {
  const file = input.files[0];
  
  if (!file) return;
  
  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar! Maksimal 5MB');
    input.value = '';
    return;
  }
  
  // Transfer file to main input
  const mainInput = document.getElementById('buktiPartisipasi');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  mainInput.files = dataTransfer.files;
  
  // Trigger preview
  previewBuktiPartisipasi(mainInput);
  
  // Clear camera input
  input.value = '';
};

// Preview bukti partisipasi
window.previewBuktiPartisipasi = function(input) {
  const file = input.files[0];
  const preview = document.getElementById('previewBuktiPartisipasi');
  
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


// Trigger file upload for partisipasi edit
window.triggerFileUploadPartisipasiEdit = function() {
  document.getElementById('buktiPartisipasiEdit').click();
};

// Trigger camera capture for partisipasi edit
window.triggerCameraCapturePartisipasiEdit = function() {
  document.getElementById('buktiPartisipasiCameraEdit').click();
};

// Handle camera capture for partisipasi edit
window.handleCameraCapturePartisipasiEdit = function(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar! Maksimal 5MB');
    input.value = '';
    return;
  }
  
  const mainInput = document.getElementById('buktiPartisipasiEdit');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  mainInput.files = dataTransfer.files;
  
  previewBuktiPartisipasiEdit(mainInput);
  input.value = '';
};

// Preview bukti partisipasi edit
window.previewBuktiPartisipasiEdit = function(input) {
  const file = input.files[0];
  const preview = document.getElementById('previewBuktiPartisipasiEdit');
  
  if (!preview) return;
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar! Maksimal 5MB');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung! Gunakan JPG, PNG, GIF, atau PDF');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
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


// ===== BUKTI SIMPANAN UPLOAD FUNCTIONS =====

// Trigger file upload for simpanan
window.triggerFileUploadSimpanan = function() {
  document.getElementById('buktiSimpanan').click();
};

// Trigger camera capture for simpanan
window.triggerCameraCaptureSimpanan = function() {
  document.getElementById('buktiSimpananCamera').click();
};

// Handle camera capture for simpanan
window.handleCameraCaptureSimpanan = function(input) {
  const file = input.files[0];
  
  if (!file) return;
  
  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar! Maksimal 5MB');
    input.value = '';
    return;
  }
  
  // Transfer file to main input
  const mainInput = document.getElementById('buktiSimpanan');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  mainInput.files = dataTransfer.files;
  
  // Trigger preview
  previewBuktiSimpanan(mainInput);
  
  // Clear camera input
  input.value = '';
};

// Preview bukti simpanan
window.previewBuktiSimpanan = function(input) {
  const file = input.files[0];
  const preview = document.getElementById('previewBuktiSimpanan');
  
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


// Trigger file upload for simpanan edit
window.triggerFileUploadSimpananEdit = function() {
  document.getElementById('buktiSimpananEdit').click();
};

// Trigger camera capture for simpanan edit
window.triggerCameraCaptureSimpananEdit = function() {
  document.getElementById('buktiSimpananCameraEdit').click();
};

// Handle camera capture for simpanan edit
window.handleCameraCaptureSimpananEdit = function(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar! Maksimal 5MB');
    input.value = '';
    return;
  }
  
  const mainInput = document.getElementById('buktiSimpananEdit');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  mainInput.files = dataTransfer.files;
  
  previewBuktiSimpananEdit(mainInput);
  input.value = '';
};

// Preview bukti simpanan edit
window.previewBuktiSimpananEdit = function(input) {
  const file = input.files[0];
  const preview = document.getElementById('previewBuktiSimpananEdit');
  
  if (!preview) return;
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar! Maksimal 5MB');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung! Gunakan JPG, PNG, GIF, atau PDF');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    
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


// ===== ACTIVITY LOG FUNCTIONS =====

// Load recent activity
window.loadRecentActivity = async function() {
  try {
    const activities = await API.get('/api/activity-log/recent?limit=15');
    
    // Debug: Log first activity to check date format
    if (activities && activities.length > 0) {
      console.log('Sample activity:', activities[0]);
      console.log('Created at:', activities[0].created_at);
      console.log('Parsed date:', new Date(activities[0].created_at));
      console.log('Current time:', new Date());
    }
    
    const container = document.getElementById('activityLogContainer');
    
    if (!activities || activities.length === 0) {
      container.innerHTML = `
        <div class="activity-empty">
          <i data-feather="inbox"></i>
          <p>Belum ada aktivitas</p>
        </div>
      `;
      feather.replace();
      return;
    }
    
    container.innerHTML = `
      <div class="activity-list">
        ${activities.map(activity => `
          <div class="activity-item ${getActivityColor(activity.action)}">
            <div class="activity-icon">
              <i data-feather="${getActivityIcon(activity.action)}"></i>
            </div>
            <div class="activity-content">
              <div class="activity-header">
                <strong>${activity.username}</strong>
                <span class="activity-action">${getActionText(activity.action)}</span>
                <span class="activity-module">${activity.module}</span>
              </div>
              ${activity.description ? `
                <div class="activity-description">${activity.description}</div>
              ` : ''}
              <div class="activity-time" title="${activity.created_at}">
                <i data-feather="clock"></i>
                ${formatTimeAgo(activity.created_at)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading activity:', error);
    document.getElementById('activityLogContainer').innerHTML = `
      <div class="activity-empty">
        <i data-feather="alert-circle"></i>
        <p style="color: #d32f2f;">Gagal memuat aktivitas</p>
      </div>
    `;
    feather.replace();
  }
};

// Refresh activity
window.refreshActivity = function() {
  document.getElementById('activityLogContainer').innerHTML = '<div class="loading">Memuat aktivitas...</div>';
  window.loadRecentActivity();
};

// Get activity color class
function getActivityColor(action) {
  const colors = {
    'CREATE': 'activity-create',
    'UPDATE': 'activity-update',
    'DELETE': 'activity-delete',
    'LOGIN': 'activity-login',
    'LOGOUT': 'activity-logout',
    'APPROVE': 'activity-approve',
    'REJECT': 'activity-reject',
    'VIEW': 'activity-view',
    'EXPORT': 'activity-export',
    'PRINT': 'activity-print'
  };
  return colors[action] || 'activity-default';
}

// Get activity icon
function getActivityIcon(action) {
  const icons = {
    'CREATE': 'plus-circle',
    'UPDATE': 'edit',
    'DELETE': 'trash-2',
    'LOGIN': 'log-in',
    'LOGOUT': 'log-out',
    'APPROVE': 'check-circle',
    'REJECT': 'x-circle',
    'VIEW': 'eye',
    'EXPORT': 'download',
    'PRINT': 'printer'
  };
  return icons[action] || 'activity';
}

// Get action text in Indonesian
function getActionText(action) {
  const texts = {
    'CREATE': 'menambahkan',
    'UPDATE': 'mengupdate',
    'DELETE': 'menghapus',
    'LOGIN': 'login ke',
    'LOGOUT': 'logout dari',
    'APPROVE': 'menyetujui',
    'REJECT': 'menolak',
    'VIEW': 'melihat',
    'EXPORT': 'mengexport',
    'PRINT': 'mencetak'
  };
  return texts[action] || action.toLowerCase();
}

// Format time ago with proper timezone handling
function formatTimeAgo(dateStr) {
  if (!dateStr) return '-';
  
  try {
    let date;
    
    // SQLite CURRENT_TIMESTAMP returns UTC time in format "YYYY-MM-DD HH:MM:SS"
    // We need to treat it as UTC and convert to local time
    if (dateStr.includes('T')) {
      // Already ISO format
      date = new Date(dateStr);
    } else {
      // SQLite format: "YYYY-MM-DD HH:MM:SS"
      // Add 'Z' to treat as UTC, then convert to local
      date = new Date(dateStr.replace(' ', 'T') + 'Z');
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return formatDate(dateStr);
    }
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    // Debug log
    console.log('Time ago debug:', {
      original: dateStr,
      parsed: date.toString(),
      now: now.toString(),
      diffSeconds: diff,
      diffMinutes: Math.floor(diff / 60)
    });
    
    // Handle future dates (clock skew) - allow up to 60 seconds
    if (diff < -60) {
      console.warn('Future date detected:', dateStr, 'Diff:', diff);
      return 'Baru saja';
    }
    
    if (diff < 0 || diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)} minggu yang lalu`;
    
    // Format tanggal lengkap jika lebih dari 1 bulan
    return formatDate(dateStr);
  } catch (error) {
    console.error('Error formatting time ago:', error, dateStr);
    return formatDate(dateStr);
  }
}

console.log('=== ACTIVITY LOG FUNCTIONS LOADED ===');


// ===== PREVIEW IMAGE FUNCTIONS =====

// Preview image for file upload
window.previewImage = function(input, previewId) {
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
          <div style="text-align: center;">
            <img src="${e.target.result}" 
                 style="max-width: 150px; max-height: 120px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      preview.innerHTML = `
        <div style="padding: 10px; background: #f0f0f0; border-radius: 4px; text-align: center;">
          <i data-feather="file-text" style="width: 24px; height: 24px; color: #d32f2f;"></i>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
            📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      `;
      feather.replace();
    }
  } else {
    preview.innerHTML = '';
  }
};

// View foto KTP
window.viewFotoKTP = function(filename) {
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
        <h3 class="modal-title">Foto KTP</h3>
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

console.log('=== PREVIEW IMAGE FUNCTIONS LOADED ===');


// ===== VIEW BUKTI PEMBAYARAN FUNCTIONS =====

// View bukti pembayaran
window.viewBuktiBayar = function(filename) {
  if (!filename) {
    alert('Tidak ada bukti pembayaran');
    return;
  }
  
  const fileUrl = `/uploads/${filename}`;
  const ext = filename.split('.').pop().toLowerCase();
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3 class="modal-title">Bukti Pembayaran</h3>
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

console.log('=== VIEW BUKTI PEMBAYARAN FUNCTIONS LOADED ===');


// ===== APPROVAL SIMPANAN PAGE =====

window.renderApprovalSimpanan = async function() {
  try {
    const pendingSimpanan = await API.get('/api/simpanan/pending');
    
    // Validate that pendingSimpanan is an array
    if (!Array.isArray(pendingSimpanan)) {
      throw new Error('Data tidak valid: ' + JSON.stringify(pendingSimpanan));
    }
    
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i data-feather="check-circle"></i>
            Persetujuan Pembayaran Simpanan
          </h3>
          <div class="badge badge-warning" style="font-size: 14px; padding: 8px 16px;">
            ${pendingSimpanan.length} Menunggu Persetujuan
          </div>
        </div>
        
        <div class="card-body">
          ${pendingSimpanan.length === 0 ? `
            <div class="empty-state">
              <i data-feather="check-circle" style="width: 64px; height: 64px; color: #4CAF50;"></i>
              <h3>Tidak Ada Pembayaran Pending</h3>
              <p>Semua pembayaran simpanan sudah diproses</p>
            </div>
          ` : `
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Jenis Simpanan</th>
                    <th>No. Anggota</th>
                    <th>Nama Anggota</th>
                    <th>Jumlah</th>
                    <th>Metode</th>
                    <th>Bukti</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingSimpanan.map((item, index) => {
                    const jenisLabel = {
                      'pokok': 'Simpanan Pokok',
                      'wajib': 'Simpanan Wajib',
                      'khusus': 'Simpanan Khusus',
                      'sukarela': 'Simpanan Sukarela'
                    };
                    
                    return `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${formatDate(item.tanggal_transaksi)}</td>
                        <td><strong>${jenisLabel[item.jenis_simpanan]}</strong></td>
                        <td>${item.nomor_anggota}</td>
                        <td>${item.nama_lengkap}</td>
                        <td><strong style="color: #2E7D32;">${formatCurrency(item.jumlah)}</strong></td>
                        <td>${item.metode_pembayaran || '-'}</td>
                        <td style="text-align: center;">
                          ${item.bukti_pembayaran ? `
                            <button class="btn btn-sm btn-info" onclick="viewBuktiBayar('${item.bukti_pembayaran}')" title="Lihat Bukti">
                              <i data-feather="image"></i> Lihat
                            </button>
                          ` : '<span style="color: #999;">-</span>'}
                        </td>
                        <td>
                          <span class="badge badge-warning">Pending</span>
                        </td>
                        <td>
                          <div class="btn-group">
                            <button class="btn btn-sm btn-success" onclick="approveSimpanan('${item.jenis_simpanan}', ${item.id})" title="Setujui">
                              <i data-feather="check"></i> Setujui
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="rejectSimpanan('${item.jenis_simpanan}', ${item.id})" title="Tolak">
                              <i data-feather="x"></i> Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
    
    feather.replace();
  } catch (error) {
    console.error('Error loading approval simpanan:', error);
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="empty-state">
            <i data-feather="alert-circle"></i>
            <h3>Gagal Memuat Data</h3>
            <p>${error.message}</p>
          </div>
        </div>
      </div>
    `;
    feather.replace();
  }
};

// Approve Simpanan
window.approveSimpanan = async function(jenis, id) {
  if (!confirm('Apakah Anda yakin ingin menyetujui pembayaran simpanan ini?')) {
    return;
  }
  
  try {
    const result = await API.put(`/api/simpanan/approve/${jenis}/${id}`, {});
    alert('✅ ' + result.message);
    renderApprovalSimpanan(); // Reload page
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// Reject Simpanan
window.rejectSimpanan = async function(jenis, id) {
  const alasan = prompt('Masukkan alasan penolakan:');
  
  if (!alasan) {
    alert('Alasan penolakan harus diisi!');
    return;
  }
  
  if (!confirm('Apakah Anda yakin ingin menolak pembayaran simpanan ini?')) {
    return;
  }
  
  try {
    const result = await API.put(`/api/simpanan/reject/${jenis}/${id}`, { alasan });
    alert('✅ ' + result.message);
    renderApprovalSimpanan(); // Reload page
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

console.log('=== APPROVAL SIMPANAN FUNCTIONS LOADED ===');


// ===== TAHUN PEMBUKUAN FUNCTIONS =====

// Edit Tahun Pembukuan
// Tutup Buku
// Buka Tahun Baru
console.log('=== TAHUN PEMBUKUAN FUNCTIONS LOADED ===');



