-- ============================================================
-- DATABASE: Koperasi NU Vibes
-- Konversi dari SQLite ke MySQL
-- Import via phpMyAdmin
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

CREATE DATABASE IF NOT EXISTS `koperasi_nuvibes`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `koperasi_nuvibes`;

-- ============================================================
-- TABEL: koperasi_info
-- ============================================================
CREATE TABLE IF NOT EXISTS `koperasi_info` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nama_koperasi` VARCHAR(255) NOT NULL,
  `alamat` TEXT,
  `nomor_telpon` VARCHAR(50),
  `email` VARCHAR(255),
  `nomor_induk_koperasi` VARCHAR(100),
  `nomor_induk_berusaha` VARCHAR(100),
  `nomor_badan_hukum` VARCHAR(100),
  `tanggal_berdiri` DATE,
  `logo` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `koperasi_info` (`nama_koperasi`, `alamat`, `nomor_telpon`, `email`, `tanggal_berdiri`) VALUES
('Koperasi NU Vibes', 'Jl. Contoh No. 123', '021-12345678', 'info@nuvibes.com', '2020-01-01');

-- ============================================================
-- TABEL: users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nama_lengkap` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `hak_akses` VARCHAR(100),
  `foto` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'aktif',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password default: admin123 (bcrypt hash)
INSERT INTO `users` (`username`, `password`, `nama_lengkap`, `role`, `hak_akses`, `status`) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'Admin', 'all', 'aktif');

-- ============================================================
-- TABEL: unit_usaha
-- ============================================================
CREATE TABLE IF NOT EXISTS `unit_usaha` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nama_usaha` VARCHAR(255) NOT NULL,
  `jenis_usaha` VARCHAR(100),
  `deskripsi` TEXT,
  `logo` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'Aktif',
  `tanggal_mulai` DATE,
  `modal_awal` DECIMAL(15,2) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: aset_inventaris
-- ============================================================
CREATE TABLE IF NOT EXISTS `aset_inventaris` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `unit_usaha_id` INT,
  `nama_aset` VARCHAR(255) NOT NULL,
  `kategori` VARCHAR(100),
  `nilai` DECIMAL(15,2) DEFAULT 0,
  `nilai_sekarang` DECIMAL(15,2) DEFAULT 0,
  `tanggal_perolehan` DATE,
  `kondisi` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`unit_usaha_id`) REFERENCES `unit_usaha`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: anggota
-- ============================================================
CREATE TABLE IF NOT EXISTS `anggota` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomor_anggota` VARCHAR(50) NOT NULL UNIQUE,
  `nama_lengkap` VARCHAR(255) NOT NULL,
  `nik` VARCHAR(20),
  `tempat_lahir` VARCHAR(100),
  `tanggal_lahir` DATE,
  `jenis_kelamin` VARCHAR(20),
  `alamat` TEXT,
  `nomor_telpon` VARCHAR(20),
  `email` VARCHAR(255),
  `pekerjaan` VARCHAR(100),
  `foto` VARCHAR(255),
  `foto_ktp` VARCHAR(255),
  `tanggal_bergabung` DATE,
  `status` VARCHAR(20) DEFAULT 'aktif',
  `username` VARCHAR(100),
  `password` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: pengurus
-- ============================================================
CREATE TABLE IF NOT EXISTS `pengurus` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `anggota_id` INT,
  `jabatan` VARCHAR(100) NOT NULL,
  `periode_mulai` DATE,
  `periode_selesai` DATE,
  `status` VARCHAR(20) DEFAULT 'aktif',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: karyawan
-- ============================================================
CREATE TABLE IF NOT EXISTS `karyawan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomor_karyawan` VARCHAR(50) NOT NULL UNIQUE,
  `nama_lengkap` VARCHAR(255) NOT NULL,
  `nik` VARCHAR(20),
  `tempat_lahir` VARCHAR(100),
  `tanggal_lahir` DATE,
  `jenis_kelamin` VARCHAR(20),
  `alamat` TEXT,
  `nomor_telpon` VARCHAR(20),
  `email` VARCHAR(255),
  `jabatan` VARCHAR(100),
  `unit_usaha_id` INT,
  `foto` VARCHAR(255),
  `tanggal_bergabung` DATE,
  `gaji` DECIMAL(15,2) DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'aktif',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`unit_usaha_id`) REFERENCES `unit_usaha`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: simpanan_pokok
-- ============================================================
CREATE TABLE IF NOT EXISTS `simpanan_pokok` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `anggota_id` INT NOT NULL,
  `jumlah` DECIMAL(15,2) NOT NULL,
  `tanggal_transaksi` DATE NOT NULL,
  `metode_pembayaran` VARCHAR(50),
  `keterangan` TEXT,
  `bukti_pembayaran` VARCHAR(255),
  `tahun_pembukuan` INT,
  `status` VARCHAR(20) DEFAULT 'approved',
  `rejection_reason` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: simpanan_wajib
-- ============================================================
CREATE TABLE IF NOT EXISTS `simpanan_wajib` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `anggota_id` INT NOT NULL,
  `jumlah` DECIMAL(15,2) NOT NULL,
  `tanggal_transaksi` DATE NOT NULL,
  `metode_pembayaran` VARCHAR(50),
  `keterangan` TEXT,
  `bukti_pembayaran` VARCHAR(255),
  `tahun_pembukuan` INT,
  `status` VARCHAR(20) DEFAULT 'approved',
  `rejection_reason` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: simpanan_khusus
-- ============================================================
CREATE TABLE IF NOT EXISTS `simpanan_khusus` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `anggota_id` INT NOT NULL,
  `jumlah` DECIMAL(15,2) NOT NULL,
  `tanggal_transaksi` DATE NOT NULL,
  `metode_pembayaran` VARCHAR(50),
  `keterangan` TEXT,
  `bukti_pembayaran` VARCHAR(255),
  `tahun_pembukuan` INT,
  `status` VARCHAR(20) DEFAULT 'approved',
  `rejection_reason` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: simpanan_sukarela
-- ============================================================
CREATE TABLE IF NOT EXISTS `simpanan_sukarela` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `anggota_id` INT NOT NULL,
  `jumlah` DECIMAL(15,2) NOT NULL,
  `jenis` VARCHAR(20),
  `tanggal_transaksi` DATE NOT NULL,
  `metode_pembayaran` VARCHAR(50),
  `keterangan` TEXT,
  `bukti_pembayaran` VARCHAR(255),
  `tahun_pembukuan` INT,
  `status` VARCHAR(20) DEFAULT 'approved',
  `rejection_reason` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: partisipasi_anggota
-- ============================================================
CREATE TABLE IF NOT EXISTS `partisipasi_anggota` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `anggota_id` INT NOT NULL,
  `unit_usaha_id` INT,
  `jumlah_transaksi` DECIMAL(15,2) NOT NULL,
  `tanggal_transaksi` DATE NOT NULL,
  `keterangan` TEXT,
  `bukti_partisipasi` VARCHAR(255),
  `tahun_pembukuan` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`unit_usaha_id`) REFERENCES `unit_usaha`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: transaksi_penjualan
-- ============================================================
CREATE TABLE IF NOT EXISTS `transaksi_penjualan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `unit_usaha_id` INT NOT NULL,
  `kategori` VARCHAR(50) DEFAULT 'Barang',
  `tanggal_transaksi` DATE NOT NULL,
  `jumlah_penjualan` DECIMAL(15,2) NOT NULL,
  `hpp` DECIMAL(15,2) DEFAULT 0,
  `keuntungan` DECIMAL(15,2) DEFAULT 0,
  `keterangan` TEXT,
  `tahun_pembukuan` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`unit_usaha_id`) REFERENCES `unit_usaha`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: pengeluaran
-- ============================================================
CREATE TABLE IF NOT EXISTS `pengeluaran` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `unit_usaha_id` INT,
  `kategori` VARCHAR(100) NOT NULL,
  `qty` INT DEFAULT 1,
  `harga` DECIMAL(15,2) DEFAULT 0,
  `jumlah` DECIMAL(15,2) NOT NULL,
  `tanggal_transaksi` DATE NOT NULL,
  `keterangan` TEXT,
  `bukti_pengeluaran` VARCHAR(255),
  `tahun_pembukuan` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`unit_usaha_id`) REFERENCES `unit_usaha`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: pendapatan_lain
-- ============================================================
CREATE TABLE IF NOT EXISTS `pendapatan_lain` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `unit_usaha_id` INT,
  `kategori` VARCHAR(100) NOT NULL,
  `jumlah` DECIMAL(15,2) NOT NULL,
  `tanggal_transaksi` DATE NOT NULL,
  `keterangan` TEXT,
  `tahun_pembukuan` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`unit_usaha_id`) REFERENCES `unit_usaha`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: komponen_shu
-- ============================================================
CREATE TABLE IF NOT EXISTS `komponen_shu` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tahun` INT NOT NULL,
  `cadangan` DECIMAL(5,2) DEFAULT 0,
  `jasa_simpanan` DECIMAL(5,2) DEFAULT 0,
  `jasa_transaksi` DECIMAL(5,2) DEFAULT 0,
  `pengurus_pengawas` DECIMAL(5,2) DEFAULT 0,
  `pegawai` DECIMAL(5,2) DEFAULT 0,
  `dana_pendidikan` DECIMAL(5,2) DEFAULT 0,
  `dana_sosial` DECIMAL(5,2) DEFAULT 0,
  `dana_pengembangan` DECIMAL(5,2) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: shu_anggota
-- ============================================================
CREATE TABLE IF NOT EXISTS `shu_anggota` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `anggota_id` INT NOT NULL,
  `tahun` INT NOT NULL,
  `shu_simpanan` DECIMAL(15,2) DEFAULT 0,
  `shu_transaksi` DECIMAL(15,2) DEFAULT 0,
  `total_shu` DECIMAL(15,2) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_anggota_tahun` (`anggota_id`, `tahun`),
  FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: dokumen_rat
-- ============================================================
CREATE TABLE IF NOT EXISTS `dokumen_rat` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tahun` INT NOT NULL,
  `nama_dokumen` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `tanggal_upload` DATE NOT NULL,
  `keterangan` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: artikel
-- ============================================================
CREATE TABLE IF NOT EXISTS `artikel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `konten` LONGTEXT NOT NULL,
  `ringkasan` TEXT,
  `gambar_utama` VARCHAR(255),
  `kategori` VARCHAR(50) DEFAULT 'berita',
  `penulis` VARCHAR(100),
  `status` VARCHAR(20) DEFAULT 'draft',
  `views` INT DEFAULT 0,
  `tanggal_publikasi` DATE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: galeri
-- ============================================================
CREATE TABLE IF NOT EXISTS `galeri` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT,
  `gambar` VARCHAR(255) NOT NULL,
  `kategori` VARCHAR(50) DEFAULT 'kegiatan',
  `tanggal_kegiatan` DATE,
  `status` VARCHAR(20) DEFAULT 'aktif',
  `urutan` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: pengumuman
-- ============================================================
CREATE TABLE IF NOT EXISTS `pengumuman` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(255) NOT NULL,
  `konten` TEXT,
  `gambar` VARCHAR(255),
  `tipe` VARCHAR(20) DEFAULT 'info',
  `status` VARCHAR(20) DEFAULT 'aktif',
  `urutan` INT DEFAULT 0,
  `tanggal_mulai` DATE,
  `tanggal_selesai` DATE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: pesan_kontak
-- ============================================================
CREATE TABLE IF NOT EXISTS `pesan_kontak` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telepon` VARCHAR(20),
  `pesan` TEXT NOT NULL,
  `status` VARCHAR(20) DEFAULT 'unread',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: activity_log
-- ============================================================
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SELESAI
-- ============================================================
