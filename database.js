const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// ============================================================
// Deteksi mode database: MySQL atau SQLite
// Set DB_TYPE=mysql di .env untuk gunakan MySQL
// ============================================================
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let db;

if (DB_TYPE === 'mysql') {
  // ===== MySQL Mode =====
  const mysql = require('mysql2');

  const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME     || 'koperasi_nuvibes',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
  });

  // Bungkus pool agar API-nya sama dengan SQLite (callback style)
  db = {
    _type: 'mysql',
    _pool: pool,

    // Jalankan query tanpa return rows
    run(sql, params, callback) {
      // Ganti ? placeholder SQLite dengan ? MySQL (sudah sama)
      const mysqlSql = toMysql(sql);
      pool.query(mysqlSql, params || [], (err, results) => {
        if (err) {
          if (callback) callback.call({ changes: 0, lastID: null }, err);
          return;
        }
        if (callback) {
          callback.call(
            { changes: results.affectedRows, lastID: results.insertId },
            null
          );
        }
      });
    },

    // Ambil satu baris
    get(sql, params, callback) {
      const mysqlSql = toMysql(sql);
      pool.query(mysqlSql, params || [], (err, results) => {
        if (err) { callback(err, null); return; }
        callback(null, results[0] || null);
      });
    },

    // Ambil semua baris
    all(sql, params, callback) {
      const mysqlSql = toMysql(sql);
      pool.query(mysqlSql, params || [], (err, results) => {
        if (err) { callback(err, []); return; }
        callback(null, results);
      });
    },

    // serialize tidak diperlukan di MySQL tapi dipertahankan agar kode server.js tetap jalan
    serialize(fn) { fn(); }
  };

  // Test koneksi & seed data awal
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.error('❌ MySQL connection error:', err.message);
    } else {
      console.log('✅ MySQL connected:', process.env.DB_NAME || 'koperasi_nuvibes');
      insertInitialData();
    }
  });

} else {
  // ===== SQLite Mode (default) =====
  const sqlite3 = require('sqlite3').verbose();

  const dbPath    = process.env.DATABASE_PATH || './koperasi.db';
  const uploadPath = process.env.UPLOAD_PATH  || './uploads';

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir))    fs.mkdirSync(dbDir,    { recursive: true });
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

  console.log(`Using SQLite: ${dbPath}`);

  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
    } else {
      console.log('SQLite connected');
      initializeSQLite(sqliteDb);
    }
  });

  db = sqliteDb;
}

// ============================================================
// Helper: konversi beberapa sintaks SQLite → MySQL
// ============================================================
function toMysql(sql) {
  return sql
    // AUTOINCREMENT → AUTO_INCREMENT sudah di SQL file, tapi query dinamis mungkin masih pakai lama
    .replace(/\bAUTOINCREMENT\b/gi, 'AUTO_INCREMENT')
    // strftime('%Y', col) → YEAR(col)
    .replace(/strftime\s*\(\s*'%Y'\s*,\s*([^)]+)\)/gi, 'YEAR($1)')
    // strftime('%Y-%m', col) → DATE_FORMAT(col,'%Y-%m')
    .replace(/strftime\s*\(\s*'%Y-%m'\s*,\s*([^)]+)\)/gi, "DATE_FORMAT($1,'%Y-%m')")
    // strftime('%Y-%m-%d', col) → DATE_FORMAT(col,'%Y-%m-%d')
    .replace(/strftime\s*\(\s*'%Y-%m-%d'\s*,\s*([^)]+)\)/gi, "DATE_FORMAT($1,'%Y-%m-%d')")
    // CURRENT_TIMESTAMP sudah support MySQL
    // INSERT OR REPLACE → REPLACE
    .replace(/INSERT OR REPLACE/gi, 'REPLACE')
    // INSERT OR IGNORE → INSERT IGNORE
    .replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE');
}

// ============================================================
// Seed data awal (MySQL & SQLite)
// ============================================================
function insertInitialData() {
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) { console.error('Seed check error:', err); return; }
    if (!row || row.count === 0) {
      const hashed = bcrypt.hashSync('admin123', 10);
      db.run(
        `INSERT INTO users (username, password, nama_lengkap, role, hak_akses) VALUES (?, ?, ?, ?, ?)`,
        ['admin', hashed, 'Administrator', 'Admin', 'all'],
        (err) => {
          if (err) console.error('Seed admin error:', err);
          else console.log('✅ Default admin created (admin / admin123)');
        }
      );
    }
  });

  db.get('SELECT COUNT(*) as count FROM koperasi_info', [], (err, row) => {
    if (err) return;
    if (!row || row.count === 0) {
      db.run(
        `INSERT INTO koperasi_info (nama_koperasi, alamat, nomor_telpon, email, tanggal_berdiri) VALUES (?, ?, ?, ?, ?)`,
        ['Koperasi NU Vibes', 'Jl. Contoh No. 123', '021-12345678', 'info@nuvibes.com', '2020-01-01'],
        (err) => { if (err) console.error('Seed koperasi_info error:', err); }
      );
    }
  });
}

// ============================================================
// Inisialisasi tabel SQLite (hanya dipakai di mode sqlite)
// Untuk MySQL gunakan koperasi_nuvibes.sql via phpMyAdmin
// ============================================================
function initializeSQLite(sqliteDb) {
  sqliteDb.serialize(() => {
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS koperasi_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_koperasi TEXT NOT NULL, alamat TEXT, nomor_telpon TEXT, email TEXT,
      nomor_induk_koperasi TEXT, nomor_induk_berusaha TEXT, nomor_badan_hukum TEXT,
      tanggal_berdiri DATE, logo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS unit_usaha (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_usaha TEXT NOT NULL, jenis_usaha TEXT, deskripsi TEXT, logo TEXT,
      status TEXT DEFAULT 'Aktif', tanggal_mulai DATE, modal_awal REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS aset_inventaris (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_usaha_id INTEGER, nama_aset TEXT NOT NULL, kategori TEXT,
      nilai REAL DEFAULT 0, nilai_sekarang REAL DEFAULT 0,
      tanggal_perolehan DATE, kondisi TEXT,
      FOREIGN KEY (unit_usaha_id) REFERENCES unit_usaha(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      nama_lengkap TEXT NOT NULL, role TEXT NOT NULL, hak_akses TEXT,
      foto TEXT, status TEXT DEFAULT 'aktif',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS anggota (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor_anggota TEXT UNIQUE NOT NULL, nama_lengkap TEXT NOT NULL,
      nik TEXT, tempat_lahir TEXT, tanggal_lahir DATE, jenis_kelamin TEXT,
      alamat TEXT, nomor_telpon TEXT, email TEXT, pekerjaan TEXT,
      foto TEXT, foto_ktp TEXT, tanggal_bergabung DATE,
      status TEXT DEFAULT 'aktif', username TEXT, password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS pengurus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER, jabatan TEXT NOT NULL,
      periode_mulai DATE, periode_selesai DATE, status TEXT DEFAULT 'aktif',
      FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS karyawan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor_karyawan TEXT UNIQUE NOT NULL, nama_lengkap TEXT NOT NULL,
      nik TEXT, tempat_lahir TEXT, tanggal_lahir DATE, jenis_kelamin TEXT,
      alamat TEXT, nomor_telpon TEXT, email TEXT, jabatan TEXT,
      unit_usaha_id INTEGER, foto TEXT, tanggal_bergabung DATE,
      gaji REAL DEFAULT 0, status TEXT DEFAULT 'aktif',
      FOREIGN KEY (unit_usaha_id) REFERENCES unit_usaha(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS simpanan_pokok (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER NOT NULL, jumlah REAL NOT NULL,
      tanggal_transaksi DATE NOT NULL, metode_pembayaran TEXT, keterangan TEXT,
      bukti_pembayaran TEXT, tahun_pembukuan INTEGER,
      status TEXT DEFAULT 'approved', rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS simpanan_wajib (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER NOT NULL, jumlah REAL NOT NULL,
      tanggal_transaksi DATE NOT NULL, metode_pembayaran TEXT, keterangan TEXT,
      bukti_pembayaran TEXT, tahun_pembukuan INTEGER,
      status TEXT DEFAULT 'approved', rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS simpanan_khusus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER NOT NULL, jumlah REAL NOT NULL,
      tanggal_transaksi DATE NOT NULL, metode_pembayaran TEXT, keterangan TEXT,
      bukti_pembayaran TEXT, tahun_pembukuan INTEGER,
      status TEXT DEFAULT 'approved', rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS simpanan_sukarela (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER NOT NULL, jumlah REAL NOT NULL, jenis TEXT,
      tanggal_transaksi DATE NOT NULL, metode_pembayaran TEXT, keterangan TEXT,
      bukti_pembayaran TEXT, tahun_pembukuan INTEGER,
      status TEXT DEFAULT 'approved', rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS partisipasi_anggota (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER NOT NULL, unit_usaha_id INTEGER,
      jumlah_transaksi REAL NOT NULL, tanggal_transaksi DATE NOT NULL,
      keterangan TEXT, bukti_partisipasi TEXT, tahun_pembukuan INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (anggota_id) REFERENCES anggota(id),
      FOREIGN KEY (unit_usaha_id) REFERENCES unit_usaha(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS transaksi_penjualan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_usaha_id INTEGER NOT NULL, kategori TEXT DEFAULT 'Barang',
      tanggal_transaksi DATE NOT NULL, jumlah_penjualan REAL NOT NULL,
      hpp REAL DEFAULT 0, keuntungan REAL DEFAULT 0,
      keterangan TEXT, tahun_pembukuan INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_usaha_id) REFERENCES unit_usaha(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS pengeluaran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_usaha_id INTEGER, kategori TEXT NOT NULL,
      qty INTEGER DEFAULT 1, harga REAL DEFAULT 0, jumlah REAL NOT NULL,
      tanggal_transaksi DATE NOT NULL, keterangan TEXT,
      bukti_pengeluaran TEXT, tahun_pembukuan INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_usaha_id) REFERENCES unit_usaha(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS pendapatan_lain (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_usaha_id INTEGER, kategori TEXT NOT NULL,
      jumlah REAL NOT NULL, tanggal_transaksi DATE NOT NULL,
      keterangan TEXT, tahun_pembukuan INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_usaha_id) REFERENCES unit_usaha(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS komponen_shu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tahun INTEGER NOT NULL, cadangan REAL DEFAULT 0,
      jasa_simpanan REAL DEFAULT 0, jasa_transaksi REAL DEFAULT 0,
      pengurus_pengawas REAL DEFAULT 0, pegawai REAL DEFAULT 0,
      dana_pendidikan REAL DEFAULT 0, dana_sosial REAL DEFAULT 0,
      dana_pengembangan REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS shu_anggota (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anggota_id INTEGER NOT NULL, tahun INTEGER NOT NULL,
      shu_simpanan REAL DEFAULT 0, shu_transaksi REAL DEFAULT 0,
      total_shu REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (anggota_id) REFERENCES anggota(id)
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS dokumen_rat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tahun INTEGER NOT NULL, nama_dokumen TEXT NOT NULL,
      file_path TEXT NOT NULL, tanggal_upload DATE NOT NULL,
      keterangan TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS artikel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, konten TEXT NOT NULL,
      ringkasan TEXT, gambar_utama TEXT, kategori TEXT DEFAULT 'berita',
      penulis TEXT, status TEXT DEFAULT 'draft', views INTEGER DEFAULT 0,
      tanggal_publikasi DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS galeri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL, deskripsi TEXT, gambar TEXT NOT NULL,
      kategori TEXT DEFAULT 'kegiatan', tanggal_kegiatan DATE,
      status TEXT DEFAULT 'aktif', urutan INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS pengumuman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL, konten TEXT, gambar TEXT,
      tipe TEXT DEFAULT 'info', status TEXT DEFAULT 'aktif',
      urutan INTEGER DEFAULT 0, tanggal_mulai DATE, tanggal_selesai DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS pesan_kontak (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL, email TEXT NOT NULL, telepon TEXT,
      pesan TEXT NOT NULL, status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL, username TEXT NOT NULL,
      action TEXT NOT NULL, module TEXT NOT NULL, description TEXT,
      ip_address TEXT, user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    insertInitialData();
  });
}

module.exports = db;
