// Member routes for authentication and profile management
const express = require('express');
const router = express.Router();
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('./helpers/email-service');

const JWT_SECRET = process.env.JWT_SECRET || 'koperasi-nu-vibes-secret-key-2024';
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
  console.log(`✅ Member routes: Created upload directory: ${UPLOAD_PATH}`);
}

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Member Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Try to find by username or email
  db.get(
    'SELECT * FROM anggota WHERE (username = ? OR email = ?) AND status = "aktif"',
    [username, username],
    async (err, anggota) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!anggota) {
        return res.status(401).json({ error: 'Username/email atau password salah' });
      }
      
      if (!anggota.password) {
        return res.status(401).json({ error: 'Akun belum diaktifkan. Hubungi admin untuk mengatur password.' });
      }
      
      const validPassword = await bcrypt.compare(password, anggota.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Username/email atau password salah' });
      }
      
      // Generate token
      const token = jwt.sign(
        { 
          id: anggota.id, 
          username: anggota.username || anggota.email,
          role: 'Member',
          anggota_id: anggota.id
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Remove password from response
      delete anggota.password;
      
      res.json({
        token,
        user: {
          id: anggota.id,
          username: anggota.username || anggota.email,
          nama_lengkap: anggota.nama_lengkap,
          role: 'Member',
          anggota_id: anggota.id
        },
        anggota: anggota
      });
    }
  );
});

// Get member profile (authenticated)
router.get('/profile', authenticateMember, (req, res) => {
  db.get(
    'SELECT id, nomor_anggota, nama_lengkap, nik, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, nomor_telpon, email, pekerjaan, foto, foto_ktp, tanggal_bergabung, status, username FROM anggota WHERE id = ?',
    [req.user.anggota_id],
    (err, anggota) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!anggota) {
        return res.status(404).json({ error: 'Anggota tidak ditemukan' });
      }
      
      res.json(anggota);
    }
  );
});

// Update member profile with foto and foto_ktp
router.put('/profile', authenticateMember, upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'foto_ktp', maxCount: 1 }
]), (req, res) => {
  try {
    console.log('📝 Update profile request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const { 
      nama_lengkap, 
      nik, 
      tempat_lahir, 
      tanggal_lahir, 
      jenis_kelamin, 
      alamat, 
      nomor_telpon, 
      email, 
      pekerjaan 
    } = req.body;
    
    let updateFields = [];
    let values = [];
    
    if (nama_lengkap) {
      updateFields.push('nama_lengkap = ?');
      values.push(nama_lengkap);
    }
    if (nik) {
      updateFields.push('nik = ?');
      values.push(nik);
    }
    if (tempat_lahir) {
      updateFields.push('tempat_lahir = ?');
      values.push(tempat_lahir);
    }
    if (tanggal_lahir) {
      updateFields.push('tanggal_lahir = ?');
      values.push(tanggal_lahir);
    }
    if (jenis_kelamin) {
      updateFields.push('jenis_kelamin = ?');
      values.push(jenis_kelamin);
    }
    if (alamat) {
      updateFields.push('alamat = ?');
      values.push(alamat);
    }
    if (nomor_telpon) {
      updateFields.push('nomor_telpon = ?');
      values.push(nomor_telpon);
    }
    if (email) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (pekerjaan) {
      updateFields.push('pekerjaan = ?');
      values.push(pekerjaan);
    }
    
    // Handle foto profil upload
    if (req.files && req.files.foto && req.files.foto[0]) {
      updateFields.push('foto = ?');
      values.push(req.files.foto[0].filename);
      console.log('Foto uploaded:', req.files.foto[0].filename);
    }
    
    // Handle foto KTP upload
    if (req.files && req.files.foto_ktp && req.files.foto_ktp[0]) {
      updateFields.push('foto_ktp = ?');
      values.push(req.files.foto_ktp[0].filename);
      console.log('Foto KTP uploaded:', req.files.foto_ktp[0].filename);
    }
    
    if (updateFields.length === 0) {
      console.log('❌ No fields to update');
      return res.status(400).json({ error: 'Tidak ada data yang diupdate' });
    }
    
    values.push(req.user.anggota_id);
    
    const sql = `UPDATE anggota SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('SQL:', sql);
    console.log('Values:', values);
    
    db.run(sql, values, function(err) {
      if (err) {
        console.error('❌ Update error:', err);
        return res.status(500).json({ error: 'Gagal update profil: ' + err.message });
      }
      
      console.log('✅ Profile updated successfully');
      res.json({ 
        message: 'Profil berhasil diupdate',
        foto: req.files && req.files.foto ? req.files.foto[0].filename : null,
        foto_ktp: req.files && req.files.foto_ktp ? req.files.foto_ktp[0].filename : null
      });
    });
  } catch (error) {
    console.error('❌ Unexpected error in update profile:', error);
    res.status(500).json({ error: 'Terjadi kesalahan: ' + error.message });
  }
});

// Change password
router.post('/change-password', authenticateMember, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }
  
  // Get current password and email
  db.get(
    'SELECT password, email, nama_lengkap FROM anggota WHERE id = ?',
    [req.user.anggota_id],
    async (err, anggota) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!anggota) {
        return res.status(404).json({ error: 'Anggota tidak ditemukan' });
      }
      
      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, anggota.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Password lama tidak sesuai' });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      db.run(
        'UPDATE anggota SET password = ? WHERE id = ?',
        [hashedPassword, req.user.anggota_id],
        async (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Send password changed email
          if (anggota.email && process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
            try {
              console.log('📧 Sending password changed email to:', anggota.email);
              await emailService.sendPasswordChangedEmail(anggota);
            } catch (emailError) {
              console.error('❌ Failed to send password changed email:', emailError.message);
              // Don't fail the request if email fails
            }
          }
          
          res.json({ message: 'Password berhasil diubah' });
        }
      );
    }
  );
});

// Middleware to authenticate member
function authenticateMember(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
}

// ===== TAGIHAN SIMPANAN WAJIB =====
const SIMPANAN_WAJIB_PER_BULAN = parseInt(process.env.SIMPANAN_WAJIB_PER_BULAN) || 30000;

// Get tagihan simpanan wajib member
router.get('/tagihan-simpanan-wajib', authenticateMember, (req, res) => {
  const anggotaId = req.user.anggota_id;

  // Get member data (tanggal bergabung)
  db.get('SELECT id, nama_lengkap, nomor_anggota, tanggal_bergabung FROM anggota WHERE id = ?', [anggotaId], (err, anggota) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!anggota) return res.status(404).json({ error: 'Anggota tidak ditemukan' });

    const tanggalBergabung = new Date(anggota.tanggal_bergabung);
    const sekarang = new Date();

    // Hitung total bulan sejak bergabung (inklusif bulan bergabung)
    const totalBulan =
      (sekarang.getFullYear() - tanggalBergabung.getFullYear()) * 12 +
      (sekarang.getMonth() - tanggalBergabung.getMonth()) + 1;

    const totalTagihan = totalBulan * SIMPANAN_WAJIB_PER_BULAN;

    // Get total yang sudah dibayar
    db.get(
      `SELECT COALESCE(SUM(jumlah), 0) as total_bayar 
       FROM simpanan_wajib 
       WHERE anggota_id = ? AND (status = 'approved' OR status IS NULL)`,
      [anggotaId],
      (err, bayar) => {
        if (err) return res.status(500).json({ error: err.message });

        const totalBayar = bayar.total_bayar || 0;
        const sisaTagihan = Math.max(0, totalTagihan - totalBayar);
        const bulanTerbayar = Math.floor(totalBayar / SIMPANAN_WAJIB_PER_BULAN);
        const bulanBelumBayar = Math.max(0, totalBulan - bulanTerbayar);

        // Generate daftar bulan tagihan
        const daftarBulan = [];
        let saldoBerjalan = totalBayar;

        for (let i = 0; i < totalBulan; i++) {
          const bulan = new Date(tanggalBergabung);
          bulan.setMonth(bulan.getMonth() + i);

          const tagihan = SIMPANAN_WAJIB_PER_BULAN;
          let statusBulan;

          if (saldoBerjalan >= tagihan) {
            statusBulan = 'lunas';
            saldoBerjalan -= tagihan;
          } else if (saldoBerjalan > 0) {
            statusBulan = 'kurang';
            saldoBerjalan = 0;
          } else {
            statusBulan = 'belum_bayar';
          }

          daftarBulan.push({
            bulan: bulan.getMonth() + 1,
            tahun: bulan.getFullYear(),
            label: bulan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
            tagihan,
            status: statusBulan
          });
        }

        res.json({
          anggota: {
            id: anggota.id,
            nama_lengkap: anggota.nama_lengkap,
            nomor_anggota: anggota.nomor_anggota,
            tanggal_bergabung: anggota.tanggal_bergabung
          },
          ringkasan: {
            total_bulan: totalBulan,
            total_tagihan: totalTagihan,
            total_bayar: totalBayar,
            sisa_tagihan: sisaTagihan,
            bulan_terbayar: bulanTerbayar,
            bulan_belum_bayar: bulanBelumBayar,
            simpanan_per_bulan: SIMPANAN_WAJIB_PER_BULAN,
            status: sisaTagihan === 0 ? 'lunas' : 'ada_tunggakan'
          },
          daftar_bulan: daftarBulan
        });
      }
    );
  });
});

module.exports = router;
