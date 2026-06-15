const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const db = require('./database');
const emailService = require('./helpers/email-service');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'koperasi-nu-vibes-secret-key-2024';
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, 'public', 'uploads');

console.log('🔧 Server Configuration:');
console.log('  - PORT:', PORT);
console.log('  - UPLOAD_PATH:', UPLOAD_PATH);
console.log('  - __dirname:', __dirname);
console.log('  - Resolved UPLOAD_PATH:', path.resolve(UPLOAD_PATH));
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');

// Verify email configuration on startup
if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
  console.log('');
  console.log('📧 Email Configuration:');
  console.log('  - HOST:', process.env.EMAIL_HOST || 'NOT SET');
  console.log('  - PORT:', process.env.EMAIL_PORT || 'NOT SET');
  console.log('  - SECURE:', process.env.EMAIL_SECURE || 'NOT SET');
  console.log('  - USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('  - PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
  console.log('  - FROM:', process.env.EMAIL_FROM || 'NOT SET');
  console.log('');
  
  // Verify email config
  emailService.verifyEmailConfig().then(verified => {
    if (verified) {
      console.log('✅ Email notifications are enabled and configured correctly');
    } else {
      console.log('⚠️ Email notifications enabled but configuration has issues');
      console.log('   Check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD');
    }
  }).catch(err => {
    console.error('❌ Email verification error:', err.message);
  });
} else {
  console.log('');
  console.log('⚠️ Email notifications are DISABLED');
  console.log('   Set ENABLE_EMAIL_NOTIFICATIONS=true to enable');
  console.log('');
}

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
  console.log(`✅ Created upload directory: ${UPLOAD_PATH}`);
} else {
  console.log(`✅ Upload directory exists: ${UPLOAD_PATH}`);
  // List files in upload directory
  try {
    const files = fs.readdirSync(UPLOAD_PATH);
    console.log(`📁 Files in upload directory: ${files.length} files`);
    if (files.length > 0 && files.length <= 10) {
      console.log('   Files:', files.join(', '));
    }
  } catch (err) {
    console.error('❌ Error reading upload directory:', err.message);
  }
}

// Middleware
app.use(cors());

// Set response headers for better mobile compatibility (but not Content-Type)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.use(express.json({ limit: '50mb' })); // Increase limit for large payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase limit for form data
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOAD_PATH)); // Serve uploads from absolute path

app.use(session({
  secret: SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Multer configuration for bukti files (images and PDFs)
const buktiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bukti-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const buktiUpload = multer({
  storage: buktiStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF are allowed.'));
    }
  }
});

// Authentication middleware - supports both admin and member tokens
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.session.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  // Try to verify with admin secret first
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (!err) {
      req.user = user;
      return next();
    }
    
    // If admin verification fails, try member secret
    const MEMBER_SECRET = 'koperasi-nu-vibes-secret-key-2024';
    jwt.verify(token, MEMBER_SECRET, (err2, user2) => {
      if (err2) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user2;
      next();
    });
  });
};

// Activity Log Middleware
const logActivity = (action, module, description = '') => {
  return (req, res, next) => {
    if (req.user) {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';
      
      db.run(
        `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, req.user.username, action, module, description, ip, userAgent],
        (err) => {
          if (err) console.error('Error logging activity:', err);
        }
      );
    }
    next();
  };
};



// ===== AUTH ROUTES =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || '';

  db.get('SELECT * FROM users WHERE username = ? AND status = "aktif"', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Username atau password salah' });

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        req.session.token = token;
        req.session.user = { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap, foto: user.foto };
        
        // Log activity
        db.run(
          `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.username, 'LOGIN', 'Auth', `${user.nama_lengkap} login ke sistem`, ip, userAgent],
          (err) => {
            if (err) console.error('Error logging activity:', err);
          }
        );
        
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap, hak_akses: user.hak_akses, foto: user.foto } });
      } else {
        res.status(401).json({ error: 'Username atau password salah' });
      }
    });
  });
});

app.post('/api/logout', authenticateToken, (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || '';
  
  // Log activity before logout
  if (req.user) {
    db.run(
      `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.username, 'LOGOUT', 'Auth', `${req.user.username} logout dari sistem`, ip, userAgent],
      (err) => {
        if (err) console.error('Error logging activity:', err);
      }
    );
  }
  
  req.session.destroy();
  res.json({ message: 'Logout berhasil' });
});

app.get('/api/check-auth', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ===== PUBLIC REGISTRATION =====
app.post('/api/register/anggota', upload.fields([
  { name: 'foto_ktp', maxCount: 1 },
  { name: 'pas_foto', maxCount: 1 }
]), (req, res) => {
  try {
    console.log('📝 Register anggota request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const { 
      nomor_anggota, 
      nama_lengkap, 
      nik, 
      tempat_lahir, 
      tanggal_lahir, 
      jenis_kelamin, 
      alamat, 
      nomor_telpon, 
      email, 
      pekerjaan, 
      tanggal_bergabung, 
      username, 
      password, 
      status 
    } = req.body;
    
    // Get uploaded files
    const fotoKTP = req.files && req.files['foto_ktp'] ? req.files['foto_ktp'][0].filename : null;
    const pasFoto = req.files && req.files['pas_foto'] ? req.files['pas_foto'][0].filename : null;
    
    console.log('Foto KTP:', fotoKTP);
    console.log('Pas Foto:', pasFoto);

    // Validate required fields
    if (!nomor_anggota || !nama_lengkap || !alamat || !nomor_telpon) {
      console.log('❌ Validation failed: missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Data tidak lengkap. Nama, alamat, dan nomor telepon harus diisi.' 
      });
    }

    // Check if nomor_anggota already exists
    db.get('SELECT id FROM anggota WHERE nomor_anggota = ?', [nomor_anggota], (err, row) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan database: ' + err.message });
      }
      
      if (row) {
        console.log('❌ Nomor anggota already exists');
        return res.status(400).json({ 
          success: false, 
          message: 'Nomor anggota sudah terdaftar. Silakan refresh halaman.' 
        });
      }

      // Check if username already exists (if provided)
      if (username) {
        db.get('SELECT id FROM anggota WHERE username = ?', [username], (err, row) => {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ success: false, message: 'Terjadi kesalahan database: ' + err.message });
          }
          
          if (row) {
            console.log('❌ Username already exists');
            return res.status(400).json({ 
              success: false, 
              message: 'Username sudah digunakan. Silakan pilih username lain.' 
            });
          }

            // Hash password if provided
          let hashedPassword = null;
          if (password) {
            hashedPassword = bcrypt.hashSync(password, 10);
          }

          // Insert new anggota
          console.log('💾 Inserting new anggota...');
          db.run(`INSERT INTO anggota (
            nomor_anggota, nama_lengkap, nik, tempat_lahir, tanggal_lahir, 
            jenis_kelamin, alamat, nomor_telpon, email, pekerjaan, 
            tanggal_bergabung, username, password, status, foto, foto_ktp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              nomor_anggota, nama_lengkap, nik, tempat_lahir, tanggal_lahir,
              jenis_kelamin, alamat, nomor_telpon, email, pekerjaan,
              tanggal_bergabung, username, hashedPassword, 'pending',
              pasFoto, fotoKTP
            ],
            function(err) {
              if (err) {
                console.error('❌ Insert error:', err);
                return res.status(500).json({ success: false, message: 'Gagal menyimpan data: ' + err.message });
              }
              
              console.log('✅ Registration successful, ID:', this.lastID);
              res.json({ 
                success: true, 
                message: 'Pendaftaran berhasil',
                data: {
                  id: this.lastID,
                  nomor_anggota: nomor_anggota,
                  nama_lengkap: nama_lengkap
                }
              });
            }
          );
        });
      } else {
        // No username provided, insert without checking username
        console.log('💾 Inserting new anggota (no username)...');
        db.run(`INSERT INTO anggota (
          nomor_anggota, nama_lengkap, nik, tempat_lahir, tanggal_lahir, 
          jenis_kelamin, alamat, nomor_telpon, email, pekerjaan, 
          tanggal_bergabung, status, foto, foto_ktp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nomor_anggota, nama_lengkap, nik, tempat_lahir, tanggal_lahir,
            jenis_kelamin, alamat, nomor_telpon, email, pekerjaan,
            tanggal_bergabung, 'pending', pasFoto, fotoKTP
          ],
          function(err) {
            if (err) {
              console.error('❌ Insert error:', err);
              return res.status(500).json({ success: false, message: 'Gagal menyimpan data: ' + err.message });
            }
            
            console.log('✅ Registration successful, ID:', this.lastID);
            res.json({ 
              success: true, 
              message: 'Pendaftaran berhasil',
              data: {
                id: this.lastID,
                nomor_anggota: nomor_anggota,
                nama_lengkap: nama_lengkap
              }
            });
          }
        );
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in register:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan: ' + error.message 
    });
  }
});

// ===== APPROVAL ENDPOINTS =====
// Get pending registrations
app.get('/api/anggota/pending', authenticateToken, (req, res) => {
  db.all(`
    SELECT id, nomor_anggota, nama_lengkap, nik, alamat, nomor_telpon, 
           email, tanggal_bergabung, foto, foto_ktp, created_at
    FROM anggota 
    WHERE status = 'pending' 
    ORDER BY created_at DESC
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get pending count
app.get('/api/anggota/pending/count', authenticateToken, (req, res) => {
  db.get(`
    SELECT COUNT(*) as count 
    FROM anggota 
    WHERE status = 'pending'
  `, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ count: row.count });
  });
});

// Approve or reject anggota
app.post('/api/anggota/:id/approve', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;
  
  const newStatus = action === 'approve' ? 'aktif' : 'ditolak';
  
  db.run(`
    UPDATE anggota 
    SET status = ?
    WHERE id = ?
  `, [newStatus, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Anggota tidak ditemukan' });
    }
    
    res.json({ 
      success: true, 
      message: action === 'approve' ? 'Anggota disetujui' : 'Anggota ditolak',
      reason: reason
    });
  });
});

// ===== KOPERASI INFO ROUTES =====
// Public endpoint for landing page
app.get('/api/koperasi-info', (req, res) => {
  db.get('SELECT * FROM koperasi_info ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// Tambahkan kolom tarif jika belum ada (migration)
db.run(`ALTER TABLE koperasi_info ADD COLUMN tarif_simpanan_pokok REAL DEFAULT 100000`, () => {});
db.run(`ALTER TABLE koperasi_info ADD COLUMN tarif_simpanan_wajib REAL DEFAULT 30000`, () => {});

// ===== TAHUN PEMBUKUAN HISTORY ROUTES =====


app.put('/api/koperasi-info/:id', authenticateToken, upload.single('logo'), (req, res) => {
  const { id } = req.params;
  const { 
    nama_koperasi, alamat, nomor_telpon, email, nomor_induk_koperasi, nomor_induk_berusaha, 
    nomor_badan_hukum, tanggal_berdiri, tarif_simpanan_pokok, tarif_simpanan_wajib
  } = req.body;
  const logo = req.file ? req.file.filename : null;

  let query = `UPDATE koperasi_info SET updated_at = CURRENT_TIMESTAMP`;
  let params = [];

  // Add fields dynamically if they exist
  if (nama_koperasi !== undefined) { query += ', nama_koperasi = ?'; params.push(nama_koperasi); }
  if (alamat !== undefined)        { query += ', alamat = ?';        params.push(alamat); }
  if (nomor_telpon !== undefined)  { query += ', nomor_telpon = ?';  params.push(nomor_telpon); }
  if (email !== undefined)         { query += ', email = ?';         params.push(email); }
  if (nomor_induk_koperasi !== undefined) { query += ', nomor_induk_koperasi = ?'; params.push(nomor_induk_koperasi); }
  if (nomor_induk_berusaha !== undefined) { query += ', nomor_induk_berusaha = ?'; params.push(nomor_induk_berusaha); }
  if (nomor_badan_hukum !== undefined)    { query += ', nomor_badan_hukum = ?';    params.push(nomor_badan_hukum); }
  if (tanggal_berdiri !== undefined)      { query += ', tanggal_berdiri = ?';      params.push(tanggal_berdiri); }
  if (tarif_simpanan_pokok !== undefined) { query += ', tarif_simpanan_pokok = ?'; params.push(parseFloat(tarif_simpanan_pokok) || 100000); }
  if (tarif_simpanan_wajib !== undefined) { query += ', tarif_simpanan_wajib = ?'; params.push(parseFloat(tarif_simpanan_wajib) || 30000); }
  if (logo) { query += ', logo = ?'; params.push(logo); }

  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Data koperasi berhasil diupdate', id: this.lastID });
  });
});

// ===== UNIT USAHA ROUTES =====
app.get('/api/unit-usaha', authenticateToken, (req, res) => {
  db.all('SELECT * FROM unit_usaha ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/unit-usaha', authenticateToken, upload.single('logo'), (req, res) => {
  const { nama_usaha, jenis_usaha, deskripsi, tanggal_mulai, modal_awal } = req.body;
  const logo = req.file ? req.file.filename : null;

  db.run('INSERT INTO unit_usaha (nama_usaha, jenis_usaha, deskripsi, logo, tanggal_mulai, modal_awal) VALUES (?, ?, ?, ?, ?, ?)',
    [nama_usaha, jenis_usaha, deskripsi, logo, tanggal_mulai, modal_awal || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Unit usaha berhasil ditambahkan', id: this.lastID });
    }
  );
});

app.put('/api/unit-usaha/:id', authenticateToken, upload.single('logo'), (req, res) => {
  const { id } = req.params;
  const { nama_usaha, jenis_usaha, deskripsi, status, tanggal_mulai, modal_awal } = req.body;
  const logo = req.file ? req.file.filename : null;

  let query = 'UPDATE unit_usaha SET nama_usaha = ?, jenis_usaha = ?, deskripsi = ?, status = ?, tanggal_mulai = ?, modal_awal = ?';
  let params = [nama_usaha, jenis_usaha, deskripsi, status, tanggal_mulai, modal_awal || 0];

  if (logo) {
    query += ', logo = ?';
    params.push(logo);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Unit usaha berhasil diupdate' });
  });
});

app.delete('/api/unit-usaha/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM unit_usaha WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Unit usaha berhasil dihapus' });
  });
});

// ===== IMPORT ROUTES =====
const anggotaRoutes = require('./routes-anggota');
const simpananRoutes = require('./routes-simpanan');
const pengurusRoutes = require('./routes-pengurus');
const karyawanRoutes = require('./routes-karyawan');
const asetRoutes = require('./routes-aset');
const memberRoutes = require('./routes-member');
const pengumumanRoutes = require('./routes-pengumuman');

// Public endpoint for pengurus (must be before authenticated route)
app.get('/api/pengurus/public', (req, res) => {
  db.all(`SELECT 
            p.id, 
            p.jabatan, 
            p.periode_mulai, 
            p.periode_selesai,
            a.nama_lengkap, 
            a.nomor_telpon, 
            a.email, 
            a.foto 
          FROM pengurus p
          LEFT JOIN anggota a ON p.anggota_id = a.id
          WHERE p.status = 'aktif'
          ORDER BY 
            CASE p.jabatan
              WHEN 'Ketua' THEN 1
              WHEN 'Wakil Ketua' THEN 2
              WHEN 'Sekretaris' THEN 3
              WHEN 'Bendahara' THEN 4
              WHEN 'Pengawas' THEN 5
              ELSE 99
            END`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.use('/api/anggota', authenticateToken, anggotaRoutes);
app.use('/api/member', memberRoutes); // Member routes (login tidak perlu auth)
app.use('/api/simpanan', authenticateToken, simpananRoutes);
app.use('/api/pengurus', authenticateToken, pengurusRoutes);
app.use('/api/karyawan', authenticateToken, karyawanRoutes);
app.use('/api/aset', authenticateToken, asetRoutes);
app.use('/api/pengumuman', pengumumanRoutes); // Pengumuman routes (aktif endpoint tidak perlu auth)

// ===== DEBUG ENDPOINT FOR FILE ACCESS =====
app.get('/api/debug/file/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_PATH, filename);
  
  console.log('🔍 Debug file access:');
  console.log('  - Filename:', filename);
  console.log('  - UPLOAD_PATH:', UPLOAD_PATH);
  console.log('  - Full path:', filePath);
  console.log('  - File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    res.json({
      exists: true,
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      uploadPath: UPLOAD_PATH,
      accessUrl: `/uploads/${filename}`
    });
  } else {
    // Check if file exists in public/uploads (relative path)
    const relativePath = path.join(__dirname, 'public', 'uploads', filename);
    console.log('  - Checking relative path:', relativePath);
    console.log('  - Relative exists:', fs.existsSync(relativePath));
    
    res.json({
      exists: false,
      searchedPath: filePath,
      alternativePath: relativePath,
      alternativeExists: fs.existsSync(relativePath),
      uploadPath: UPLOAD_PATH
    });
  }
});

// ===== BULK DELETE ENDPOINTS (Must be after routes to avoid conflicts) =====

// Bulk delete all anggota (except admin users)
app.delete('/api/anggota/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all anggota requested');
  
  try {
    // Get all anggota IDs first
    db.all('SELECT id FROM anggota', [], (err, allAnggota) => {
      if (err) {
        console.error('Error getting all anggota:', err);
        return res.status(500).json({ error: 'Gagal mengambil data anggota: ' + err.message });
      }
      
      const idsToDelete = allAnggota.map(a => a.id);
      console.log(`Total anggota: ${idsToDelete.length}`);
      
      if (idsToDelete.length === 0) {
        return res.json({ 
          message: 'Tidak ada anggota yang dapat dihapus',
          deleted: 0
        });
      }
      
      const count = idsToDelete.length;
      const placeholders = idsToDelete.map(() => '?').join(',');
      
      // Delete related data first (to avoid foreign key constraints)
      db.serialize(() => {
        console.log('Deleting related data...');
        
        // Delete simpanan
        db.run(`DELETE FROM simpanan_pokok WHERE anggota_id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) console.error('Error deleting simpanan_pokok:', err);
          else console.log('✓ Deleted simpanan_pokok');
        });
        
        db.run(`DELETE FROM simpanan_wajib WHERE anggota_id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) console.error('Error deleting simpanan_wajib:', err);
          else console.log('✓ Deleted simpanan_wajib');
        });
        
        db.run(`DELETE FROM simpanan_khusus WHERE anggota_id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) console.error('Error deleting simpanan_khusus:', err);
          else console.log('✓ Deleted simpanan_khusus');
        });
        
        db.run(`DELETE FROM simpanan_sukarela WHERE anggota_id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) console.error('Error deleting simpanan_sukarela:', err);
          else console.log('✓ Deleted simpanan_sukarela');
        });
        
        // Delete partisipasi
        db.run(`DELETE FROM partisipasi_anggota WHERE anggota_id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) console.error('Error deleting partisipasi_anggota:', err);
          else console.log('✓ Deleted partisipasi_anggota');
        });
        
        // Delete SHU
        db.run(`DELETE FROM shu_anggota WHERE anggota_id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) console.error('Error deleting shu_anggota:', err);
          else console.log('✓ Deleted shu_anggota');
        });
        
        // Delete pengurus
        db.run(`DELETE FROM pengurus WHERE anggota_id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) console.error('Error deleting pengurus:', err);
          else console.log('✓ Deleted pengurus');
        });
        
        // Finally, delete anggota
        db.run(`DELETE FROM anggota WHERE id IN (${placeholders})`, idsToDelete, function(err) {
          if (err) {
            console.error('Error bulk deleting anggota:', err);
            return res.status(500).json({ error: 'Gagal menghapus anggota: ' + err.message });
          }
          
          console.log(`✅ Bulk deleted ${count} anggota and their related data`);
          res.json({ 
            message: `Berhasil menghapus ${count} anggota beserta data terkait`,
            deleted: count
          });
        });
      });
    });
  } catch (error) {
    console.error('Unexpected error in bulk delete:', error);
    res.status(500).json({ error: 'Terjadi kesalahan: ' + error.message });
  }
});

// Bulk delete all simpanan pokok
app.delete('/api/simpanan/pokok/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all simpanan pokok requested');
  
  db.get('SELECT COUNT(*) as count FROM simpanan_pokok', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM simpanan_pokok', [], function(err) {
      if (err) {
        console.error('Error bulk deleting simpanan pokok:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} simpanan pokok`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi simpanan pokok`,
        deleted: count
      });
    });
  });
});

// Bulk delete all simpanan wajib
app.delete('/api/simpanan/wajib/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all simpanan wajib requested');
  
  db.get('SELECT COUNT(*) as count FROM simpanan_wajib', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM simpanan_wajib', [], function(err) {
      if (err) {
        console.error('Error bulk deleting simpanan wajib:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} simpanan wajib`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi simpanan wajib`,
        deleted: count
      });
    });
  });
});

// Bulk delete all simpanan khusus
app.delete('/api/simpanan/khusus/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all simpanan khusus requested');
  
  db.get('SELECT COUNT(*) as count FROM simpanan_khusus', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM simpanan_khusus', [], function(err) {
      if (err) {
        console.error('Error bulk deleting simpanan khusus:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} simpanan khusus`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi simpanan khusus`,
        deleted: count
      });
    });
  });
});

// Bulk delete all simpanan sukarela
app.delete('/api/simpanan/sukarela/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all simpanan sukarela requested');
  
  db.get('SELECT COUNT(*) as count FROM simpanan_sukarela', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM simpanan_sukarela', [], function(err) {
      if (err) {
        console.error('Error bulk deleting simpanan sukarela:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} simpanan sukarela`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi simpanan sukarela`,
        deleted: count
      });
    });
  });
});

// Bulk delete all transaksi penjualan
app.delete('/api/transaksi/penjualan/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all transaksi penjualan requested');
  
  db.get('SELECT COUNT(*) as count FROM transaksi_penjualan', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM transaksi_penjualan', [], function(err) {
      if (err) {
        console.error('Error bulk deleting transaksi penjualan:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} transaksi penjualan`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi penjualan`,
        deleted: count
      });
    });
  });
});

// Bulk delete all pendapatan lain
app.delete('/api/transaksi/pendapatan-lain/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all pendapatan lain requested');
  
  db.get('SELECT COUNT(*) as count FROM pendapatan_lain', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM pendapatan_lain', [], function(err) {
      if (err) {
        console.error('Error bulk deleting pendapatan lain:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} pendapatan lain`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi pendapatan lain`,
        deleted: count
      });
    });
  });
});

// Bulk delete all pengeluaran
app.delete('/api/transaksi/pengeluaran/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all pengeluaran requested');
  
  db.get('SELECT COUNT(*) as count FROM pengeluaran', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM pengeluaran', [], function(err) {
      if (err) {
        console.error('Error bulk deleting pengeluaran:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} pengeluaran`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi pengeluaran`,
        deleted: count
      });
    });
  });
});

// Bulk delete all partisipasi anggota
app.delete('/api/partisipasi/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all partisipasi anggota requested');
  
  db.get('SELECT COUNT(*) as count FROM partisipasi_anggota', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM partisipasi_anggota', [], function(err) {
      if (err) {
        console.error('Error bulk deleting partisipasi anggota:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} partisipasi anggota`);
      res.json({ 
        message: `Berhasil menghapus ${count} transaksi partisipasi anggota`,
        deleted: count
      });
    });
  });
});

// Bulk delete all pengurus
app.delete('/api/pengurus/bulk/all', authenticateToken, (req, res) => {
  console.log('🗑️ Bulk delete all pengurus requested');
  
  db.get('SELECT COUNT(*) as count FROM pengurus', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = row.count;
    
    db.run('DELETE FROM pengurus', [], function(err) {
      if (err) {
        console.error('Error bulk deleting pengurus:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`✅ Bulk deleted ${count} pengurus`);
      res.json({ 
        message: `Berhasil menghapus ${count} data pengurus`,
        deleted: count
      });
    });
  });
});

// ===== DASHBOARD STATS =====
// Test endpoint untuk cek database connection
app.get('/api/test/db', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM anggota', [], (err, row) => {
    if (err) {
      res.json({ 
        status: 'error', 
        message: err.message,
        connected: false 
      });
    } else {
      res.json({ 
        status: 'success', 
        message: 'Database connected',
        connected: true,
        totalAnggota: row.count
      });
    }
  });
});

// Public endpoint for landing page (limited data)
app.get('/api/public/stats', (req, res) => {
  const stats = {};
  
  // Total Anggota
  db.get('SELECT COUNT(*) as total FROM anggota WHERE status = "aktif"', [], (err, row) => {
    if (err) {
      console.error('Error getting total anggota:', err);
      stats.totalAnggota = 0;
    } else {
      stats.totalAnggota = row ? row.total : 0;
    }
    
    // Total Simpanan
    db.get(`SELECT 
            (SELECT COALESCE(SUM(CAST(jumlah AS REAL)), 0) FROM simpanan_pokok) +
            (SELECT COALESCE(SUM(CAST(jumlah AS REAL)), 0) FROM simpanan_wajib) +
            (SELECT COALESCE(SUM(CAST(jumlah AS REAL)), 0) FROM simpanan_khusus) +
            (SELECT COALESCE(SUM(CASE WHEN jenis = 'Setoran' THEN CAST(jumlah AS REAL) ELSE -CAST(jumlah AS REAL) END), 0) FROM simpanan_sukarela) as total`, [], (err2, row2) => {
      if (err2) {
        console.error('Error getting total simpanan:', err2);
        stats.totalSimpanan = 0;
      } else {
        stats.totalSimpanan = row2 ? parseFloat(row2.total) || 0 : 0;
      }
      
      // Calculate total aset (simplified: simpanan + laba)
      db.get(`SELECT 
              COALESCE(
                (SELECT SUM(jumlah_penjualan - hpp) FROM transaksi_penjualan), 0
              ) +
              COALESCE(
                (SELECT SUM(jumlah) FROM pendapatan_lain), 0
              ) -
              COALESCE(
                (SELECT SUM(jumlah) FROM pengeluaran 
                 WHERE kategori NOT IN ('Pembelian Barang', 'Pembelian Aset', 'Pembelian Aset & Inventaris')), 0
              ) as labaBersih`, [], (err3, row3) => {
        if (err3) {
          console.error('Error calculating laba bersih:', err3);
          stats.labaBersih = 0;
        } else {
          stats.labaBersih = row3 ? parseFloat(row3.labaBersih) || 0 : 0;
        }
        
        console.log('Public stats:', stats);
        res.json(stats);
      });
    });
  });
});

// ===== TAGIHAN ANGGOTA =====
app.get('/api/tagihan/anggota', authenticateToken, (req, res) => {
  const tahunSekarang = new Date().getFullYear();
  const bulanSekarang = new Date().getMonth() + 1;

  // Ambil tarif dari koperasi_info
  db.get('SELECT tarif_simpanan_pokok, tarif_simpanan_wajib FROM koperasi_info LIMIT 1', [], (err, tarif) => {
    const SIMPANAN_POKOK = (tarif && tarif.tarif_simpanan_pokok) ? parseFloat(tarif.tarif_simpanan_pokok) : 100000;
    const SIMPANAN_WAJIB = (tarif && tarif.tarif_simpanan_wajib) ? parseFloat(tarif.tarif_simpanan_wajib) : 30000;

    db.all(`
      SELECT 
        a.id, a.nomor_anggota, a.nama_lengkap, a.nomor_telpon, a.tanggal_bergabung,
        COALESCE((
          SELECT SUM(jumlah) FROM simpanan_pokok 
          WHERE anggota_id = a.id AND (status = 'approved' OR status IS NULL)
        ), 0) AS total_pokok_dibayar,
        COALESCE((
          SELECT SUM(jumlah) FROM simpanan_wajib 
          WHERE anggota_id = a.id AND (status = 'approved' OR status IS NULL)
        ), 0) AS total_wajib_dibayar,
        CAST(strftime('%Y', COALESCE(a.tanggal_bergabung, a.created_at)) AS INTEGER) AS tahun_bergabung,
        CAST(strftime('%m', COALESCE(a.tanggal_bergabung, a.created_at)) AS INTEGER) AS bulan_bergabung
      FROM anggota a
      WHERE a.status = 'aktif'
      ORDER BY a.nomor_anggota ASC
    `, [], (err, anggotaList) => {
      if (err) return res.status(500).json({ error: err.message });

      const result = anggotaList.map(a => {
        const tBergabung = a.tahun_bergabung || tahunSekarang;
        const bBergabung = a.bulan_bergabung || 1;
        const totalBulanWajib = Math.max(0,
          (tahunSekarang - tBergabung) * 12 + (bulanSekarang - bBergabung + 1)
        );
        const kewajibanWajib  = totalBulanWajib * SIMPANAN_WAJIB;
        const tagihanPokok    = a.total_pokok_dibayar >= SIMPANAN_POKOK ? 0 : SIMPANAN_POKOK - a.total_pokok_dibayar;
        const tagihanWajib    = Math.max(0, kewajibanWajib - a.total_wajib_dibayar);
        const totalTagihan    = tagihanPokok + tagihanWajib;

        return {
          id: a.id,
          nomor_anggota: a.nomor_anggota,
          nama_lengkap: a.nama_lengkap,
          nomor_telpon: a.nomor_telpon,
          tanggal_bergabung: a.tanggal_bergabung,
          tagihan_pokok: tagihanPokok,
          tagihan_wajib: tagihanWajib,
          total_tagihan: totalTagihan,
          sudah_bayar_pokok: parseFloat(a.total_pokok_dibayar),
          sudah_bayar_wajib: parseFloat(a.total_wajib_dibayar),
          total_bulan_wajib: totalBulanWajib,
          tarif_pokok: SIMPANAN_POKOK,
          tarif_wajib: SIMPANAN_WAJIB
        };
      });

      const adaTagihan = result.filter(r => r.total_tagihan > 0);
      res.json({
        data: adaTagihan,
        total_anggota_menunggak: adaTagihan.length,
        total_tagihan_keseluruhan: adaTagihan.reduce((s, r) => s + r.total_tagihan, 0),
        tarif_pokok: SIMPANAN_POKOK,
        tarif_wajib: SIMPANAN_WAJIB
      });
    });
  });
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  console.log('Getting dashboard stats for ALL years (seluruh tahun)');
  const stats = {};
    
  // Total Anggota (tidak perlu filter tahun)
  db.get('SELECT COUNT(*) as total FROM anggota WHERE status = "aktif"', [], (err, row) => {
    if (err) {
      console.error('Error getting total anggota:', err);
      stats.totalAnggota = 0;
    } else {
      stats.totalAnggota = row ? row.total : 0;
    }
    
    // Total Simpanan (semua data)
    db.get(`SELECT 
            (SELECT COALESCE(SUM(CAST(jumlah AS REAL)), 0) FROM simpanan_pokok WHERE (status = 'approved' OR status IS NULL)) +
            (SELECT COALESCE(SUM(CAST(jumlah AS REAL)), 0) FROM simpanan_wajib WHERE (status = 'approved' OR status IS NULL)) +
            (SELECT COALESCE(SUM(CAST(jumlah AS REAL)), 0) FROM simpanan_khusus WHERE (status = 'approved' OR status IS NULL)) +
            (SELECT COALESCE(SUM(CASE WHEN jenis = 'Setoran' THEN CAST(jumlah AS REAL) ELSE -CAST(jumlah AS REAL) END), 0) FROM simpanan_sukarela WHERE (status = 'approved' OR status IS NULL)) as total`, 
            [], (err, row) => {
      if (err) {
        console.error('Error calculating total simpanan:', err);
        stats.totalSimpanan = 0;
      } else {
        stats.totalSimpanan = row ? parseFloat(row.total) || 0 : 0;
      }
      continueStats();
    });
  });
  
  function continueStats() {
    // Total Penjualan - SEMUA TAHUN
    db.get("SELECT COALESCE(SUM(jumlah_penjualan), 0) as total FROM transaksi_penjualan", [], (err, row) => {
      if (err) {
        console.error('Error getting penjualan stats:', err);
        stats.totalPenjualan = 0;
      } else {
        stats.totalPenjualan = row ? row.total : 0;
        console.log('Total Penjualan (seluruh tahun):', stats.totalPenjualan);
      }
      continueWithHPP();
    });
  }
  
  function continueWithHPP() {
    // Total HPP - SEMUA TAHUN
    db.get("SELECT COALESCE(SUM(hpp), 0) as total FROM transaksi_penjualan", [], (err, row) => {
      if (err) {
        console.error('Error getting HPP stats:', err);
        stats.totalHPP = 0;
      } else {
        stats.totalHPP = row ? row.total : 0;
        console.log('Total HPP (seluruh tahun):', stats.totalHPP);
      }
      continueWithPengeluaran();
    });
  }
  
  function continueWithPengeluaran() {
    // Total Pengeluaran (Biaya Operasional) - SEMUA TAHUN
    db.get(`SELECT COALESCE(SUM(jumlah), 0) as total 
            FROM pengeluaran 
            WHERE kategori NOT IN ('Pembelian Barang', 'Pembelian Aset & Inventaris')`, [], (err, row) => {
      if (err) {
        console.error('Error getting pengeluaran stats:', err);
        stats.totalPengeluaran = 0;
      } else {
        stats.totalPengeluaran = row ? row.total : 0;
        console.log('Total Pengeluaran (seluruh tahun):', stats.totalPengeluaran);
      }
      continueWithPendapatanLain();
    });
  }
  
  function continueWithPendapatanLain() {
    // Total Pendapatan Lain - SEMUA TAHUN
    db.get("SELECT COALESCE(SUM(jumlah), 0) as total FROM pendapatan_lain", [], (err, row) => {
      if (err) {
        console.error('Error getting pendapatan lain stats:', err);
        stats.totalPendapatanLain = 0;
      } else {
        stats.totalPendapatanLain = row ? row.total : 0;
        console.log('Total Pendapatan Lain (seluruh tahun):', stats.totalPendapatanLain);
      }
      finalizeStats();
    });
  }
  
  function finalizeStats() {
    try {
      // Calculate totals with safe defaults
      stats.totalPenjualan = stats.totalPenjualan || 0;
      stats.totalPendapatanLain = stats.totalPendapatanLain || 0;
      stats.totalHPP = stats.totalHPP || 0;
      stats.totalPengeluaran = stats.totalPengeluaran || 0;
      
      // Total Pendapatan = Penjualan + Pendapatan Lain
      stats.totalPendapatan = stats.totalPenjualan + stats.totalPendapatanLain;
      
      // Laba Kotor = Total Pendapatan - HPP
      stats.labaKotor = stats.totalPendapatan - stats.totalHPP;
      
      // Laba Bersih = Laba Kotor - Biaya Operasional
      stats.labaBersih = stats.labaKotor - stats.totalPengeluaran;
      
      // Laba/Rugi = Laba Bersih
      stats.labaRugi = stats.labaBersih;
      
      console.log('Dashboard stats calculated successfully (seluruh tahun):', stats);
      res.json(stats);
    } catch (finalError) {
      console.error('Error in finalizeStats:', finalError);
      res.status(500).json({ error: 'Error calculating final stats: ' + finalError.message });
    }
  }
});

// Debug endpoint untuk melihat data transaksi
app.get('/api/debug/transaksi', authenticateToken, (req, res) => {
  const currentYear = new Date().getFullYear();
  
  // Check data transaksi
  db.all("SELECT COUNT(*) as count, strftime('%Y', tanggal_transaksi) as tahun FROM transaksi_penjualan GROUP BY strftime('%Y', tanggal_transaksi) ORDER BY tahun DESC", [], (err, penjualan) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all("SELECT COUNT(*) as count, strftime('%Y', tanggal_transaksi) as tahun FROM pengeluaran GROUP BY strftime('%Y', tanggal_transaksi) ORDER BY tahun DESC", [], (err2, pengeluaran) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      db.all("SELECT COUNT(*) as count, strftime('%Y', tanggal_transaksi) as tahun FROM pendapatan_lain GROUP BY strftime('%Y', tanggal_transaksi) ORDER BY tahun DESC", [], (err3, pendapatanLain) => {
        if (err3) return res.status(500).json({ error: err3.message });
        
        // Get sample data for current year
        db.all("SELECT tanggal_transaksi, jumlah_penjualan, hpp FROM transaksi_penjualan WHERE strftime('%Y', tanggal_transaksi) = ? LIMIT 5", [currentYear.toString()], (err4, samplePenjualan) => {
          if (err4) return res.status(500).json({ error: err4.message });
          
          res.json({
            currentYear,
            penjualan: penjualan || [],
            pengeluaran: pengeluaran || [],
            pendapatanLain: pendapatanLain || [],
            samplePenjualan: samplePenjualan || []
          });
        });
      });
    });
  });
});

// ===== TRANSAKSI ROUTES =====
app.get('/api/transaksi/penjualan', authenticateToken, (req, res) => {
  db.all(`SELECT tp.*, uu.nama_usaha 
          FROM transaksi_penjualan tp 
          LEFT JOIN unit_usaha uu ON tp.unit_usaha_id = uu.id 
          ORDER BY tp.tanggal_transaksi DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transaksi/penjualan', authenticateToken, (req, res) => {
  const { unit_usaha_id, tanggal_transaksi, jumlah_penjualan, hpp, keterangan } = req.body;
  
  console.log('📊 Import penjualan request:');
  console.log('  - unit_usaha_id:', unit_usaha_id);
  console.log('  - tanggal_transaksi:', tanggal_transaksi);
  console.log('  - jumlah_penjualan:', jumlah_penjualan);
  console.log('  - hpp:', hpp);
  console.log('  - keterangan:', keterangan);
  
  const keuntungan = jumlah_penjualan - (hpp || 0);
  
  // Get unit usaha name for activity log
  if (unit_usaha_id) {
    db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
      if (err) {
        console.error('❌ Error getting unit usaha:', err);
        return res.status(500).json({ error: err.message });
      }
      insertPenjualan(unitUsaha ? unitUsaha.nama_usaha : null);
    });
  } else {
    insertPenjualan(null);
  }
  
  function insertPenjualan(unitUsahaName) {
    db.run('INSERT INTO transaksi_penjualan (unit_usaha_id, tanggal_transaksi, jumlah_penjualan, hpp, keuntungan, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
      [unit_usaha_id, tanggal_transaksi, jumlah_penjualan, hpp, keuntungan, keterangan],
      function(err) {
      if (err) {
        console.error('❌ Error inserting penjualan:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('✅ Penjualan inserted, ID:', this.lastID);
      
      // Log activity
      const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
      const unitUsahaText = unitUsahaName ? ` dari ${unitUsahaName}` : '';
      const description = `Menambahkan penjualan${unitUsahaText} sebesar ${formatCurrency(jumlah_penjualan)} (Keuntungan: ${formatCurrency(keuntungan)})`;
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';
      
      db.run(
        `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, req.user.username, 'CREATE', 'Penjualan', description, ip, userAgent],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
      
      res.json({ message: 'Transaksi penjualan berhasil ditambahkan', id: this.lastID });
    }
  );
  }
});

app.get('/api/transaksi/pengeluaran', authenticateToken, (req, res) => {
  db.all(`SELECT p.*, uu.nama_usaha 
          FROM pengeluaran p 
          LEFT JOIN unit_usaha uu ON p.unit_usaha_id = uu.id 
          ORDER BY p.tanggal_transaksi DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transaksi/pengeluaran', authenticateToken, buktiUpload.single('bukti_pengeluaran'), (req, res) => {
  const { unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan } = req.body;
  const bukti_pengeluaran = req.file ? req.file.filename : null;
  
  // Get unit usaha name for activity log
  if (unit_usaha_id) {
    db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
      insertPengeluaran(unitUsaha ? unitUsaha.nama_usaha : null);
    });
  } else {
    insertPengeluaran(null);
  }
  
  function insertPengeluaran(unitUsahaName) {
    // Check if bukti_pengeluaran column exists
    db.all("PRAGMA table_info(pengeluaran)", [], (err, columns) => {
      const hasBuktiColumn = columns && columns.some(col => col.name === 'bukti_pengeluaran');
      
      if (hasBuktiColumn) {
        // Insert with bukti_pengeluaran
        db.run('INSERT INTO pengeluaran (unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan, bukti_pengeluaran) VALUES (?, ?, ?, ?, ?, ?)',
          [unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan, bukti_pengeluaran],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log activity
            const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
            const unitUsahaText = unitUsahaName ? ` untuk ${unitUsahaName}` : '';
            const description = `Menambahkan pengeluaran ${kategori}${unitUsahaText} sebesar ${formatCurrency(jumlah)}`;
            
            const ip = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent') || '';
            
            db.run(
              `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [req.user.id, req.user.username, 'CREATE', 'Pengeluaran', description, ip, userAgent],
              (logErr) => {
                if (logErr) console.error('Error logging activity:', logErr);
              }
            );
            
            res.json({ message: 'Pengeluaran berhasil ditambahkan', id: this.lastID, bukti_pengeluaran });
          }
        );
      } else {
        // Insert without bukti_pengeluaran (backward compatibility)
        db.run('INSERT INTO pengeluaran (unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan) VALUES (?, ?, ?, ?, ?)',
          [unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log activity
            const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
            const unitUsahaText = unitUsahaName ? ` untuk ${unitUsahaName}` : '';
            const description = `Menambahkan pengeluaran ${kategori}${unitUsahaText} sebesar ${formatCurrency(jumlah)}`;
            
            const ip = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent') || '';
            
            db.run(
              `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [req.user.id, req.user.username, 'CREATE', 'Pengeluaran', description, ip, userAgent],
              (logErr) => {
                if (logErr) console.error('Error logging activity:', logErr);
              }
            );
            
            res.json({ message: 'Pengeluaran berhasil ditambahkan', id: this.lastID });
          }
        );
      }
    });
  }
});

// ===== PARTISIPASI ANGGOTA =====
app.get('/api/partisipasi', authenticateToken, (req, res) => {
  db.all(`SELECT pa.*, a.nama_lengkap, a.nomor_anggota, uu.nama_usaha 
          FROM partisipasi_anggota pa 
          JOIN anggota a ON pa.anggota_id = a.id 
          LEFT JOIN unit_usaha uu ON pa.unit_usaha_id = uu.id 
          ORDER BY pa.tanggal_transaksi DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/partisipasi', authenticateToken, buktiUpload.single('bukti_partisipasi'), async (req, res) => {
  const { anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan } = req.body;
  const bukti_partisipasi = req.file ? req.file.filename : null;
  
  // Get anggota name for activity log
  db.get('SELECT nama_lengkap, nomor_anggota FROM anggota WHERE id = ?', [anggota_id], (err, anggota) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!anggota) return res.status(404).json({ error: 'Anggota tidak ditemukan' });
    
    // Get unit usaha name for activity log
    if (unit_usaha_id) {
        db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
          insertPartisipasi(unitUsaha ? unitUsaha.nama_usaha : null);
        });
      } else {
        insertPartisipasi(null);
      }
      
      function insertPartisipasi(unitUsahaName) {
        // Check if bukti_partisipasi column exists
        db.all("PRAGMA table_info(partisipasi_anggota)", [], (err, columns) => {
          const hasBuktiColumn = columns && columns.some(col => col.name === 'bukti_partisipasi');
          
          if (hasBuktiColumn) {
            // Insert with bukti_partisipasi
            db.run('INSERT INTO partisipasi_anggota (anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan, bukti_partisipasi) VALUES (?, ?, ?, ?, ?, ?)',
              [anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan, bukti_partisipasi],
              function(err) {
              if (err) return res.status(500).json({ error: err.message });
              
              // Log activity
              const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
              const unitUsahaText = unitUsahaName ? ` di ${unitUsahaName}` : '';
              const description = `Menambahkan partisipasi ${anggota.nama_lengkap} (${anggota.nomor_anggota})${unitUsahaText} sebesar ${formatCurrency(jumlah_transaksi)}`;
              
              const ip = req.ip || req.connection.remoteAddress;
              const userAgent = req.get('user-agent') || '';
              
              db.run(
                `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, req.user.username, 'CREATE', 'Partisipasi', description, ip, userAgent],
                (logErr) => {
                  if (logErr) console.error('Error logging activity:', logErr);
                }
              );
              
              res.json({ message: 'Partisipasi anggota berhasil ditambahkan', id: this.lastID, bukti_partisipasi });
            }
          );
        } else {
          // Insert without bukti_partisipasi (backward compatibility)
          db.run('INSERT INTO partisipasi_anggota (anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan) VALUES (?, ?, ?, ?, ?)',
            [anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              
              // Log activity
              const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
              const unitUsahaText = unitUsahaName ? ` di ${unitUsahaName}` : '';
              const description = `Menambahkan partisipasi ${anggota.nama_lengkap} (${anggota.nomor_anggota})${unitUsahaText} sebesar ${formatCurrency(jumlah_transaksi)}`;
              
              const ip = req.ip || req.connection.remoteAddress;
              const userAgent = req.get('user-agent') || '';
              
              db.run(
                `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, req.user.username, 'CREATE', 'Partisipasi', description, ip, userAgent],
                (logErr) => {
                  if (logErr) console.error('Error logging activity:', logErr);
                }
              );
              
              res.json({ message: 'Partisipasi anggota berhasil ditambahkan', id: this.lastID });
            }
          );
        }
      });
      }
    });
});

// ===== SHU ROUTES =====
app.get('/api/shu/komponen/:tahun', authenticateToken, (req, res) => {
  db.get('SELECT * FROM komponen_shu WHERE tahun = ?', [req.params.tahun], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.post('/api/shu/komponen', authenticateToken, (req, res) => {
  const { tahun, cadangan, jasa_simpanan, jasa_transaksi, pengurus_pengawas, pegawai, dana_pendidikan, dana_sosial, dana_pengembangan } = req.body;
  
  console.log('Updating komponen SHU:', { tahun, cadangan, jasa_simpanan, jasa_transaksi, pengurus_pengawas, pegawai, dana_pendidikan, dana_sosial, dana_pengembangan });
  
  // Check if komponen already exists
  db.get('SELECT id FROM komponen_shu WHERE tahun = ?', [tahun], (err, row) => {
    if (err) {
      console.error('Error checking komponen SHU:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      // Update existing komponen
      console.log('Updating existing komponen with id:', row.id);
      db.run(`UPDATE komponen_shu 
              SET cadangan = ?, jasa_simpanan = ?, jasa_transaksi = ?, pengurus_pengawas = ?, 
                  pegawai = ?, dana_pendidikan = ?, dana_sosial = ?, dana_pengembangan = ?
              WHERE tahun = ?`,
        [cadangan, jasa_simpanan, jasa_transaksi, pengurus_pengawas, pegawai, dana_pendidikan, dana_sosial, dana_pengembangan, tahun],
        function(err) {
          if (err) {
            console.error('Error updating komponen SHU:', err);
            return res.status(500).json({ error: err.message });
          }
          console.log('Komponen SHU updated successfully, changes:', this.changes);
          
          // Verify the update
          db.get('SELECT * FROM komponen_shu WHERE tahun = ?', [tahun], (err, updatedRow) => {
            if (err) {
              console.error('Error verifying update:', err);
            } else {
              console.log('Verified updated data:', updatedRow);
            }
          });
          
          res.json({ message: 'Komponen SHU berhasil diperbarui', changes: this.changes });
        }
      );
    } else {
      // Insert new komponen
      console.log('Inserting new komponen for tahun:', tahun);
      db.run(`INSERT INTO komponen_shu (tahun, cadangan, jasa_simpanan, jasa_transaksi, pengurus_pengawas, pegawai, dana_pendidikan, dana_sosial, dana_pengembangan) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tahun, cadangan, jasa_simpanan, jasa_transaksi, pengurus_pengawas, pegawai, dana_pendidikan, dana_sosial, dana_pengembangan],
        function(err) {
          if (err) {
            console.error('Error inserting komponen SHU:', err);
            return res.status(500).json({ error: err.message });
          }
          console.log('Komponen SHU inserted successfully, lastID:', this.lastID);
          res.json({ message: 'Komponen SHU berhasil disimpan', id: this.lastID });
        }
      );
    }
  });
});

app.post('/api/shu/hitung/:tahun', authenticateToken, (req, res) => {
  const tahun = req.params.tahun;
  const { periode } = req.body; // Tambahkan parameter periode dari request body
  
  console.log(`Menghitung SHU untuk tahun: ${tahun}, periode: ${periode || 'tahunan'}`);
  
  let query, params, periodeText;
  
  if (periode === 'seluruh') {
    // SHU dari SELURUH TAHUN (akumulasi semua data)
    query = `SELECT 
            (SELECT COALESCE(SUM(jumlah_penjualan), 0) FROM transaksi_penjualan) +
            (SELECT COALESCE(SUM(jumlah), 0) FROM pendapatan_lain) -
            (SELECT COALESCE(SUM(hpp), 0) FROM transaksi_penjualan) -
            (SELECT COALESCE(SUM(jumlah), 0) FROM pengeluaran 
             WHERE kategori NOT IN ('Pembelian Barang', 'Pembelian Aset & Inventaris', 'Pembelian Aset')) as keuntungan_bersih,
            (SELECT COALESCE(SUM(jumlah_penjualan), 0) FROM transaksi_penjualan) as total_penjualan,
            (SELECT COALESCE(SUM(jumlah), 0) FROM pendapatan_lain) as total_pendapatan_lain,
            (SELECT COALESCE(SUM(hpp), 0) FROM transaksi_penjualan) as total_hpp,
            (SELECT COALESCE(SUM(jumlah), 0) FROM pengeluaran 
             WHERE kategori NOT IN ('Pembelian Barang', 'Pembelian Aset & Inventaris', 'Pembelian Aset')) as biaya_operasional`;
    params = [];
    periodeText = 'Seluruh Tahun';
    console.log('Menghitung SHU dari seluruh tahun (akumulasi semua data)');
  } else {
    // SHU berdasarkan tahun tertentu (default)
    query = `SELECT 
            (SELECT COALESCE(SUM(jumlah_penjualan), 0) FROM transaksi_penjualan WHERE strftime('%Y', tanggal_transaksi) = ?) +
            (SELECT COALESCE(SUM(jumlah), 0) FROM pendapatan_lain WHERE strftime('%Y', tanggal_transaksi) = ?) -
            (SELECT COALESCE(SUM(hpp), 0) FROM transaksi_penjualan WHERE strftime('%Y', tanggal_transaksi) = ?) -
            (SELECT COALESCE(SUM(jumlah), 0) FROM pengeluaran 
             WHERE strftime('%Y', tanggal_transaksi) = ? 
             AND kategori NOT IN ('Pembelian Barang', 'Pembelian Aset & Inventaris', 'Pembelian Aset')) as keuntungan_bersih,
            (SELECT COALESCE(SUM(jumlah_penjualan), 0) FROM transaksi_penjualan WHERE strftime('%Y', tanggal_transaksi) = ?) as total_penjualan,
            (SELECT COALESCE(SUM(jumlah), 0) FROM pendapatan_lain WHERE strftime('%Y', tanggal_transaksi) = ?) as total_pendapatan_lain,
            (SELECT COALESCE(SUM(hpp), 0) FROM transaksi_penjualan WHERE strftime('%Y', tanggal_transaksi) = ?) as total_hpp,
            (SELECT COALESCE(SUM(jumlah), 0) FROM pengeluaran 
             WHERE strftime('%Y', tanggal_transaksi) = ? 
             AND kategori NOT IN ('Pembelian Barang', 'Pembelian Aset & Inventaris', 'Pembelian Aset')) as biaya_operasional`;
    params = [tahun, tahun, tahun, tahun, tahun, tahun, tahun, tahun];
    periodeText = `Tahun ${tahun}`;
    console.log(`Menghitung SHU untuk tahun: ${tahun}`);
  }
  
  // Hitung SHU dengan formula yang benar:
  // Total Pendapatan = Penjualan + Pendapatan Lain
  // Laba Kotor = Total Pendapatan - HPP
  // SHU Tahun Berjalan = Laba Kotor - Biaya Operasional
  // Biaya Operasional = Pengeluaran TANPA Pembelian Barang dan Pembelian Aset
  db.get(query, params, (err, result) => {
      if (err) {
        console.error('Error calculating SHU:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const keuntunganBersih = result.keuntungan_bersih || 0;
      const totalPenjualan = result.total_penjualan || 0;
      const totalPendapatanLain = result.total_pendapatan_lain || 0;
      const totalHPP = result.total_hpp || 0;
      const biayaOperasional = result.biaya_operasional || 0;
      const totalPendapatan = totalPenjualan + totalPendapatanLain;
      const labaKotor = totalPendapatan - totalHPP;
      
      console.log('SHU Calculation Results:');
      console.log(`- Total Penjualan: ${totalPenjualan}`);
      console.log(`- Total Pendapatan Lain: ${totalPendapatanLain}`);
      console.log(`- Total Pendapatan: ${totalPendapatan}`);
      console.log(`- Total HPP: ${totalHPP}`);
      console.log(`- Laba Kotor: ${labaKotor}`);
      console.log(`- Biaya Operasional: ${biayaOperasional}`);
      console.log(`- SHU (Keuntungan Bersih): ${keuntunganBersih}`);
      
      // Get komponen SHU
      db.get('SELECT * FROM komponen_shu WHERE tahun = ?', [tahun], (err, komponen) => {
        if (err || !komponen) return res.status(500).json({ error: 'Komponen SHU belum diatur' });
        
        const shuJasaSimpanan = keuntunganBersih * (komponen.jasa_simpanan / 100);
        const shuJasaTransaksi = keuntunganBersih * (komponen.jasa_transaksi / 100);
        
        // Hitung total simpanan dan partisipasi per anggota
        let partisipasiQuery, partisipasiParams;
        if (periode === 'seluruh') {
          partisipasiQuery = `SELECT a.id, a.nama_lengkap,
                (SELECT COALESCE(SUM(jumlah), 0) FROM simpanan_pokok WHERE anggota_id = a.id) +
                (SELECT COALESCE(SUM(jumlah), 0) FROM simpanan_wajib WHERE anggota_id = a.id) +
                (SELECT COALESCE(SUM(jumlah), 0) FROM simpanan_khusus WHERE anggota_id = a.id) as total_simpanan,
                (SELECT COALESCE(SUM(jumlah_transaksi), 0) FROM partisipasi_anggota WHERE anggota_id = a.id) as total_partisipasi
                FROM anggota a WHERE a.status = 'aktif'`;
          partisipasiParams = [];
        } else {
          partisipasiQuery = `SELECT a.id, a.nama_lengkap,
                (SELECT COALESCE(SUM(jumlah), 0) FROM simpanan_pokok WHERE anggota_id = a.id) +
                (SELECT COALESCE(SUM(jumlah), 0) FROM simpanan_wajib WHERE anggota_id = a.id) +
                (SELECT COALESCE(SUM(jumlah), 0) FROM simpanan_khusus WHERE anggota_id = a.id) as total_simpanan,
                (SELECT COALESCE(SUM(jumlah_transaksi), 0) FROM partisipasi_anggota WHERE anggota_id = a.id AND strftime('%Y', tanggal_transaksi) = ?) as total_partisipasi
                FROM anggota a WHERE a.status = 'aktif'`;
          partisipasiParams = [tahun];
        }
        
        db.all(partisipasiQuery, partisipasiParams, (err, anggotaList) => {
          if (err) return res.status(500).json({ error: err.message });
          
          const totalSimpananSemua = anggotaList.reduce((sum, a) => sum + a.total_simpanan, 0);
          const totalPartisipasiSemua = anggotaList.reduce((sum, a) => sum + a.total_partisipasi, 0);
          
          // Hitung SHU per anggota
          anggotaList.forEach(anggota => {
            const indeksSimpanan = totalSimpananSemua > 0 ? anggota.total_simpanan / totalSimpananSemua : 0;
            const indeksPartisipasi = totalPartisipasiSemua > 0 ? anggota.total_partisipasi / totalPartisipasiSemua : 0;
            
            const shuSimpanan = shuJasaSimpanan * indeksSimpanan;
            const shuTransaksi = shuJasaTransaksi * indeksPartisipasi;
            const totalShu = shuSimpanan + shuTransaksi;
            
            db.run(`INSERT OR REPLACE INTO shu_anggota (anggota_id, tahun, shu_simpanan, shu_transaksi, total_shu) VALUES (?, ?, ?, ?, ?)`,
              [anggota.id, tahun, shuSimpanan, shuTransaksi, totalShu]);
          });
          
          res.json({ 
            message: `SHU ${periodeText} berhasil dihitung`, 
            keuntunganBersih: keuntunganBersih,
            totalAnggota: anggotaList.length,
            totalPendapatan: totalPendapatan,
            totalPenjualan: totalPenjualan,
            totalPendapatanLain: totalPendapatanLain,
            totalHPP: totalHPP,
            labaKotor: labaKotor,
            biayaOperasional: biayaOperasional,
            periode: periodeText,
            tahun: tahun
          });
        });
      });
    });
});

app.get('/api/shu/anggota/:tahun', authenticateToken, (req, res) => {
  const tahun = req.params.tahun;
  db.all(`SELECT sa.*, a.nama_lengkap, a.nomor_anggota,
          COALESCE(
            (SELECT SUM(jumlah) FROM simpanan_pokok WHERE anggota_id = a.id), 0
          ) + COALESCE(
            (SELECT SUM(jumlah) FROM simpanan_wajib WHERE anggota_id = a.id), 0
          ) + COALESCE(
            (SELECT SUM(jumlah) FROM simpanan_khusus WHERE anggota_id = a.id), 0
          ) as total_simpanan,
          COALESCE(
            (SELECT SUM(jumlah_transaksi) FROM partisipasi_anggota WHERE anggota_id = a.id AND strftime('%Y', tanggal_transaksi) = ?), 0
          ) as total_transaksi
          FROM shu_anggota sa 
          JOIN anggota a ON sa.anggota_id = a.id 
          WHERE sa.tahun = ? 
          ORDER BY a.nomor_anggota ASC`, [tahun, tahun], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/shu/reset/:tahun', authenticateToken, (req, res) => {
  const tahun = req.params.tahun;
  
  db.run('DELETE FROM shu_anggota WHERE tahun = ?', [tahun], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      message: `SHU tahun ${tahun} berhasil direset`, 
      deleted: this.changes 
    });
  });
});

// ===== USER MANAGEMENT =====
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, nama_lengkap, role, hak_akses, foto, status, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', authenticateToken, upload.single('foto'), (req, res) => {
  const { username, password, nama_lengkap, role, hak_akses } = req.body;
  const foto = req.file ? req.file.filename : null;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (username, password, nama_lengkap, role, hak_akses, foto) VALUES (?, ?, ?, ?, ?, ?)',
    [username, hashedPassword, nama_lengkap, role, hak_akses, foto],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User berhasil ditambahkan', id: this.lastID });
    }
  );
});

app.put('/api/users/:id', authenticateToken, upload.single('foto'), (req, res) => {
  const { id } = req.params;
  const { username, password, nama_lengkap, role, hak_akses, status } = req.body;
  const foto = req.file ? req.file.filename : null;
  
  let query = 'UPDATE users SET username = ?, nama_lengkap = ?, role = ?, hak_akses = ?, status = ?';
  let params = [username, nama_lengkap, role, hak_akses, status];
  
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += ', password = ?';
    params.push(hashedPassword);
  }
  
  if (foto) {
    query += ', foto = ?';
    params.push(foto);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User berhasil diupdate' });
  });
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User berhasil dihapus' });
  });
});

// ===== LAPORAN =====
app.get('/api/laporan/simpanan', authenticateToken, (req, res) => {
  const { periode, tahun, bulan, tanggal } = req.query;
  
  // Jika tidak ada parameter tahun, gunakan tahun berjalan
  const tahunFilter = tahun || new Date().getFullYear();
  
  let dateFilter = '';
  
  if (periode === 'harian' && tanggal) {
    dateFilter = `AND tanggal_transaksi = '${tanggal}'`;
  } else if (periode === 'bulanan' && tahun && bulan) {
    dateFilter = `AND strftime('%Y-%m', tanggal_transaksi) = '${tahun}-${bulan}'`;
  } else if (periode === 'tahunan' && tahun) {
    // Untuk laporan tahunan, gunakan filter berdasarkan tanggal transaksi
    dateFilter = `AND strftime('%Y', tanggal_transaksi) = '${tahun}'`;
  }
    
    db.all(`SELECT 
            'Simpanan Pokok' as jenis,
            SUM(jumlah) as total,
            COUNT(*) as jumlah_transaksi
            FROM simpanan_pokok WHERE 1=1 ${dateFilter}
            UNION ALL
            SELECT 
            'Simpanan Wajib' as jenis,
            SUM(jumlah) as total,
            COUNT(*) as jumlah_transaksi
            FROM simpanan_wajib WHERE 1=1 ${dateFilter}
            UNION ALL
            SELECT 
            'Simpanan Khusus' as jenis,
            SUM(jumlah) as total,
            COUNT(*) as jumlah_transaksi
            FROM simpanan_khusus WHERE 1=1 ${dateFilter}
            UNION ALL
            SELECT 
            'Simpanan Sukarela' as jenis,
            SUM(CASE WHEN jenis = 'Setoran' THEN jumlah ELSE -jumlah END) as total,
            COUNT(*) as jumlah_transaksi
            FROM simpanan_sukarela WHERE 1=1 ${dateFilter}`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
});

// ===== USER PROFILE ENDPOINTS =====

// Upload foto profil
app.post('/api/users/upload-photo', authenticateToken, upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
  }
  
  const fotoUrl = `/uploads/${req.file.filename}`;
  const userId = req.user.id;
  
  db.run('UPDATE users SET foto = ? WHERE id = ?', [fotoUrl, userId], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    
    res.json({ 
      success: true, 
      message: 'Foto profil berhasil diupdate',
      foto: fotoUrl
    });
  });
});

// Ganti password
app.post('/api/users/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Password lama dan baru harus diisi' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
  }
  
  // Get current user
  db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    // Verify old password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Password lama tidak sesuai' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      
      res.json({ 
        success: true, 
        message: 'Password berhasil diubah'
      });
    });
  });
});

// Upload logo koperasi (untuk sidebar)
app.post('/api/koperasi/upload-logo', authenticateToken, upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
  }
  
  const logoUrl = `/uploads/${req.file.filename}`;
  
  db.run('UPDATE koperasi_info SET logo = ? WHERE id = 1', [logoUrl], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    
    res.json({ 
      success: true, 
      message: 'Logo koperasi berhasil diupdate',
      logo: logoUrl
    });
  });
});

// Get logo koperasi
app.get('/api/koperasi/logo', (req, res) => {
  db.get('SELECT logo FROM koperasi_info WHERE id = 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ logo: row?.logo || null });
  });
});

// ===== PENGUMUMAN ROUTES =====
app.get('/api/pengumuman', authenticateToken, (req, res) => {
  db.all('SELECT * FROM pengumuman ORDER BY urutan ASC, created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/pengumuman/aktif', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.all(`SELECT * FROM pengumuman 
          WHERE status = 'aktif' 
          AND (tanggal_mulai IS NULL OR tanggal_mulai <= ?)
          AND (tanggal_selesai IS NULL OR tanggal_selesai >= ?)
          ORDER BY urutan ASC, created_at DESC`, 
    [today, today], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/pengumuman', authenticateToken, upload.single('gambar'), (req, res) => {
  const { judul, konten, tipe, status, urutan, tanggal_mulai, tanggal_selesai } = req.body;
  const gambar = req.file ? req.file.filename : null;
  
  db.run(`INSERT INTO pengumuman (judul, konten, gambar, tipe, status, urutan, tanggal_mulai, tanggal_selesai) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [judul, konten, gambar, tipe, status, urutan || 0, tanggal_mulai, tanggal_selesai],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Pengumuman berhasil ditambahkan', id: this.lastID });
    }
  );
});

app.put('/api/pengumuman/:id', authenticateToken, upload.single('gambar'), (req, res) => {
  const { id } = req.params;
  const { judul, konten, tipe, status, urutan, tanggal_mulai, tanggal_selesai } = req.body;
  const gambar = req.file ? req.file.filename : null;
  
  let query = 'UPDATE pengumuman SET judul = ?, konten = ?, tipe = ?, status = ?, urutan = ?, tanggal_mulai = ?, tanggal_selesai = ?, updated_at = CURRENT_TIMESTAMP';
  let params = [judul, konten, tipe, status, urutan, tanggal_mulai, tanggal_selesai];
  
  if (gambar) {
    query += ', gambar = ?';
    params.push(gambar);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pengumuman berhasil diupdate' });
  });
});

app.delete('/api/pengumuman/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM pengumuman WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pengumuman berhasil dihapus' });
  });
});

// ===== ARTIKEL ROUTES =====
// Get all artikel (admin)
app.get('/api/artikel', authenticateToken, (req, res) => {
  db.all('SELECT * FROM artikel ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get published artikel (public)
app.get('/api/artikel/published', (req, res) => {
  const limit = req.query.limit || 10;
  db.all(`SELECT id, judul, slug, ringkasan, gambar_utama, kategori, penulis, views, tanggal_publikasi, created_at 
          FROM artikel 
          WHERE status = 'published' 
          ORDER BY tanggal_publikasi DESC 
          LIMIT ?`, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get artikel by slug (public)
app.get('/api/artikel/slug/:slug', (req, res) => {
  db.get('SELECT * FROM artikel WHERE slug = ? AND status = "published"', [req.params.slug], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    
    // Increment views
    db.run('UPDATE artikel SET views = views + 1 WHERE id = ?', [row.id]);
    
    res.json(row);
  });
});

// Create artikel
app.post('/api/artikel', authenticateToken, upload.single('gambar_utama'), (req, res) => {
  const { judul, slug, konten, ringkasan, kategori, penulis, status, tanggal_publikasi } = req.body;
  const gambar_utama = req.file ? req.file.filename : null;
  
  db.run(`INSERT INTO artikel (judul, slug, konten, ringkasan, gambar_utama, kategori, penulis, status, tanggal_publikasi) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [judul, slug, konten, ringkasan, gambar_utama, kategori, penulis, status, tanggal_publikasi],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Artikel berhasil ditambahkan' });
    }
  );
});

// Update artikel
app.put('/api/artikel/:id', authenticateToken, upload.single('gambar_utama'), (req, res) => {
  const { id } = req.params;
  const { judul, slug, konten, ringkasan, kategori, penulis, status, tanggal_publikasi } = req.body;
  
  let query = `UPDATE artikel SET judul = ?, slug = ?, konten = ?, ringkasan = ?, kategori = ?, penulis = ?, status = ?, tanggal_publikasi = ?, updated_at = CURRENT_TIMESTAMP`;
  let params = [judul, slug, konten, ringkasan, kategori, penulis, status, tanggal_publikasi];
  
  if (req.file) {
    query += `, gambar_utama = ?`;
    params.push(req.file.filename);
  }
  
  query += ` WHERE id = ?`;
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Artikel berhasil diupdate' });
  });
});

// Delete artikel
app.delete('/api/artikel/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM artikel WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Artikel berhasil dihapus' });
  });
});

// ===== GALERI ROUTES =====
// Get all galeri (admin)
app.get('/api/galeri', authenticateToken, (req, res) => {
  db.all('SELECT * FROM galeri ORDER BY urutan ASC, created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get active galeri (public)
app.get('/api/galeri/aktif', (req, res) => {
  const limit = req.query.limit || 12;
  db.all(`SELECT * FROM galeri 
          WHERE status = 'aktif' 
          ORDER BY urutan ASC, tanggal_kegiatan DESC 
          LIMIT ?`, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create galeri
app.post('/api/galeri', authenticateToken, upload.single('gambar'), (req, res) => {
  const { judul, deskripsi, kategori, tanggal_kegiatan, status, urutan } = req.body;
  const gambar = req.file ? req.file.filename : null;
  
  db.run(`INSERT INTO galeri (judul, deskripsi, gambar, kategori, tanggal_kegiatan, status, urutan) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [judul, deskripsi, gambar, kategori, tanggal_kegiatan, status, urutan],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Galeri berhasil ditambahkan' });
    }
  );
});

// Update galeri
app.put('/api/galeri/:id', authenticateToken, upload.single('gambar'), (req, res) => {
  const { id } = req.params;
  const { judul, deskripsi, kategori, tanggal_kegiatan, status, urutan } = req.body;
  
  let query = `UPDATE galeri SET judul = ?, deskripsi = ?, kategori = ?, tanggal_kegiatan = ?, status = ?, urutan = ?, updated_at = CURRENT_TIMESTAMP`;
  let params = [judul, deskripsi, kategori, tanggal_kegiatan, status, urutan];
  
  if (req.file) {
    query += `, gambar = ?`;
    params.push(req.file.filename);
  }
  
  query += ` WHERE id = ?`;
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Galeri berhasil diupdate' });
  });
});

// Delete galeri
app.delete('/api/galeri/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM galeri WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Galeri berhasil dihapus' });
  });
});

// ===== PESAN KONTAK ROUTES =====
// Submit pesan kontak (public)
app.post('/api/kontak/submit', (req, res) => {
  const { nama, email, telepon, pesan } = req.body;
  
  if (!nama || !email || !pesan) {
    return res.status(400).json({ error: 'Nama, email, dan pesan harus diisi' });
  }
  
  db.run(`INSERT INTO pesan_kontak (nama, email, telepon, pesan) VALUES (?, ?, ?, ?)`,
    [nama, email, telepon, pesan],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        success: true, 
        message: 'Pesan berhasil dikirim. Terima kasih!',
        id: this.lastID 
      });
    }
  );
});

// Get all pesan kontak (admin)
app.get('/api/kontak', authenticateToken, (req, res) => {
  db.all('SELECT * FROM pesan_kontak ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get unread count (admin)
app.get('/api/kontak/unread/count', authenticateToken, (req, res) => {
  db.get('SELECT COUNT(*) as count FROM pesan_kontak WHERE status = "unread"', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row.count });
  });
});

// Mark as read (admin)
app.put('/api/kontak/:id/read', authenticateToken, (req, res) => {
  db.run('UPDATE pesan_kontak SET status = "read" WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pesan ditandai sudah dibaca' });
  });
});

// Delete pesan (admin)
app.delete('/api/kontak/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM pesan_kontak WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pesan berhasil dihapus' });
  });
});

// ===== ACTIVITY LOG =====
// Get activity log (admin only)
app.get('/api/activity-log', authenticateToken, (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  db.all(
    `SELECT * FROM activity_log 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get activity log count
app.get('/api/activity-log/count', authenticateToken, (req, res) => {
  db.get('SELECT COUNT(*) as total FROM activity_log', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ total: row.total });
  });
});

// Get recent activity (for dashboard)
app.get('/api/activity-log/recent', authenticateToken, (req, res) => {
  const { limit = 10 } = req.query;
  
  db.all(
    `SELECT * FROM activity_log 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [parseInt(limit)],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Global error handler for multer and other errors
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  
  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File terlalu besar. Maksimal 5MB per file.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Terlalu banyak file atau nama field tidak sesuai.'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Error upload file: ' + err.message
    });
  }
  
  // Other errors
  if (err.message) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Terjadi kesalahan pada server'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log('Login default: username=admin, password=admin123');
});


// ===== UPDATE & DELETE PARTISIPASI =====
app.put('/api/partisipasi/:id', authenticateToken, buktiUpload.single('bukti_partisipasi'), (req, res) => {
  const { id } = req.params;
  const { anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan } = req.body;
  const bukti_partisipasi = req.file ? req.file.filename : null;
  
  // Get anggota name for activity log
  db.get('SELECT nama_lengkap, nomor_anggota FROM anggota WHERE id = ?', [anggota_id], (err, anggota) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!anggota) return res.status(404).json({ error: 'Anggota tidak ditemukan' });
    
    // Get unit usaha name for activity log
    if (unit_usaha_id) {
      db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
        updatePartisipasi(unitUsaha ? unitUsaha.nama_usaha : null);
      });
    } else {
      updatePartisipasi(null);
    }
    
    function updatePartisipasi(unitUsahaName) {
      // Check if bukti_partisipasi column exists
      db.all("PRAGMA table_info(partisipasi_anggota)", [], (err, columns) => {
        const hasBuktiColumn = columns && columns.some(col => col.name === 'bukti_partisipasi');
        
        if (hasBuktiColumn && bukti_partisipasi) {
          // Update with bukti_partisipasi
          db.run('UPDATE partisipasi_anggota SET anggota_id = ?, unit_usaha_id = ?, jumlah_transaksi = ?, tanggal_transaksi = ?, keterangan = ?, bukti_partisipasi = ? WHERE id = ?',
            [anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan, bukti_partisipasi, id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              
              // Log activity
              const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
              const unitUsahaText = unitUsahaName ? ` di ${unitUsahaName}` : '';
              const description = `Mengupdate partisipasi ${anggota.nama_lengkap} (${anggota.nomor_anggota})${unitUsahaText} menjadi ${formatCurrency(jumlah_transaksi)}`;
              
              const ip = req.ip || req.connection.remoteAddress;
              const userAgent = req.get('user-agent') || '';
              
              db.run(
                `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, req.user.username, 'UPDATE', 'Partisipasi', description, ip, userAgent],
                (logErr) => {
                  if (logErr) console.error('Error logging activity:', logErr);
                }
              );
              
              res.json({ message: 'Partisipasi anggota berhasil diupdate', bukti_partisipasi });
            }
          );
        } else {
          // Update without bukti_partisipasi
          db.run('UPDATE partisipasi_anggota SET anggota_id = ?, unit_usaha_id = ?, jumlah_transaksi = ?, tanggal_transaksi = ?, keterangan = ? WHERE id = ?',
            [anggota_id, unit_usaha_id, jumlah_transaksi, tanggal_transaksi, keterangan, id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              
              // Log activity
              const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
              const unitUsahaText = unitUsahaName ? ` di ${unitUsahaName}` : '';
              const description = `Mengupdate partisipasi ${anggota.nama_lengkap} (${anggota.nomor_anggota})${unitUsahaText} menjadi ${formatCurrency(jumlah_transaksi)}`;
              
              const ip = req.ip || req.connection.remoteAddress;
              const userAgent = req.get('user-agent') || '';
              
              db.run(
                `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, req.user.username, 'UPDATE', 'Partisipasi', description, ip, userAgent],
                (logErr) => {
                  if (logErr) console.error('Error logging activity:', logErr);
                }
              );
              
              res.json({ message: 'Partisipasi anggota berhasil diupdate' });
            }
          );
        }
      });
    }
  });
});

app.delete('/api/partisipasi/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Get partisipasi data before delete for activity log
  db.get('SELECT pa.*, a.nama_lengkap, a.nomor_anggota, uu.nama_usaha FROM partisipasi_anggota pa JOIN anggota a ON pa.anggota_id = a.id LEFT JOIN unit_usaha uu ON pa.unit_usaha_id = uu.id WHERE pa.id = ?', [id], (err, partisipasi) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!partisipasi) return res.status(404).json({ error: 'Data partisipasi tidak ditemukan' });
    
    db.run('DELETE FROM partisipasi_anggota WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log activity
      const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
      const unitUsahaText = partisipasi.nama_usaha ? ` di ${partisipasi.nama_usaha}` : '';
      const description = `Menghapus partisipasi ${partisipasi.nama_lengkap} (${partisipasi.nomor_anggota})${unitUsahaText} sebesar ${formatCurrency(partisipasi.jumlah_transaksi)}`;
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';
      
      db.run(
        `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, req.user.username, 'DELETE', 'Partisipasi', description, ip, userAgent],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
      
      res.json({ message: 'Partisipasi anggota berhasil dihapus' });
    });
  });
});

// ===== UPDATE & DELETE PENJUALAN =====
app.put('/api/transaksi/penjualan/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { unit_usaha_id, tanggal_transaksi, jumlah_penjualan, hpp, keterangan } = req.body;
  const keuntungan = parseFloat(jumlah_penjualan) - parseFloat(hpp || 0);
  
  // Get unit usaha name for activity log
  if (unit_usaha_id) {
    db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
      updatePenjualan(unitUsaha ? unitUsaha.nama_usaha : null);
    });
  } else {
    updatePenjualan(null);
  }
  
  function updatePenjualan(unitUsahaName) {
    db.run('UPDATE transaksi_penjualan SET unit_usaha_id = ?, tanggal_transaksi = ?, jumlah_penjualan = ?, hpp = ?, keuntungan = ?, keterangan = ? WHERE id = ?',
      [unit_usaha_id, tanggal_transaksi, jumlah_penjualan, hpp, keuntungan, keterangan, id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          // Log activity
          const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
          const unitUsahaText = unitUsahaName ? ` dari ${unitUsahaName}` : '';
          const description = `Mengupdate penjualan${unitUsahaText} menjadi ${formatCurrency(jumlah_penjualan)} (Keuntungan: ${formatCurrency(keuntungan)})`;
          
          const ip = req.ip || req.connection.remoteAddress;
          const userAgent = req.get('user-agent') || '';
          
          db.run(
            `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, req.user.username, 'UPDATE', 'Penjualan', description, ip, userAgent],
            (logErr) => {
              if (logErr) console.error('Error logging activity:', logErr);
            }
          );
          
          res.json({ message: 'Transaksi penjualan berhasil diupdate' });
        }
      );
    }
});

app.delete('/api/transaksi/penjualan/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Get penjualan data before delete for activity log
  db.get('SELECT tp.*, uu.nama_usaha FROM transaksi_penjualan tp LEFT JOIN unit_usaha uu ON tp.unit_usaha_id = uu.id WHERE tp.id = ?', [id], (err, penjualan) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!penjualan) return res.status(404).json({ error: 'Data penjualan tidak ditemukan' });
    
    db.run('DELETE FROM transaksi_penjualan WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log activity
      const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
      const unitUsahaText = penjualan.nama_usaha ? ` dari ${penjualan.nama_usaha}` : '';
      const description = `Menghapus penjualan${unitUsahaText} sebesar ${formatCurrency(penjualan.jumlah_penjualan)}`;
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';
      
      db.run(
        `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, req.user.username, 'DELETE', 'Penjualan', description, ip, userAgent],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
      
      res.json({ message: 'Transaksi penjualan berhasil dihapus' });
    });
  });
});

// ===== UPDATE & DELETE PENGELUARAN =====
app.put('/api/transaksi/pengeluaran/:id', authenticateToken, buktiUpload.single('bukti_pengeluaran'), (req, res) => {
  const { id } = req.params;
  const { unit_usaha_id, kategori, qty, harga, jumlah, tanggal_transaksi, keterangan } = req.body;
  const bukti_pengeluaran = req.file ? req.file.filename : null;
  
  // Get unit usaha name for activity log
  if (unit_usaha_id) {
    db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
      updatePengeluaran(unitUsaha ? unitUsaha.nama_usaha : null);
    });
  } else {
    updatePengeluaran(null);
  }
  
  function updatePengeluaran(unitUsahaName) {
    // Check if bukti_pengeluaran column exists
    db.all("PRAGMA table_info(pengeluaran)", [], (err, columns) => {
      const hasBuktiColumn = columns && columns.some(col => col.name === 'bukti_pengeluaran');
      
      if (hasBuktiColumn && bukti_pengeluaran) {
        // Update with bukti_pengeluaran
        db.run('UPDATE pengeluaran SET unit_usaha_id = ?, kategori = ?, qty = ?, harga = ?, jumlah = ?, tanggal_transaksi = ?, keterangan = ?, bukti_pengeluaran = ? WHERE id = ?',
          [unit_usaha_id, kategori, qty, harga, jumlah, tanggal_transaksi, keterangan, bukti_pengeluaran, id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              
              // Log activity
              const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
              const unitUsahaText = unitUsahaName ? ` untuk ${unitUsahaName}` : '';
              const description = `Mengupdate pengeluaran ${kategori}${unitUsahaText} menjadi ${formatCurrency(jumlah)}`;
              
              const ip = req.ip || req.connection.remoteAddress;
              const userAgent = req.get('user-agent') || '';
              
              db.run(
                `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, req.user.username, 'UPDATE', 'Pengeluaran', description, ip, userAgent],
                (logErr) => {
                  if (logErr) console.error('Error logging activity:', logErr);
                }
              );
              
              res.json({ message: 'Pengeluaran berhasil diupdate', bukti_pengeluaran });
            }
          );
        } else {
          // Update without bukti_pengeluaran
          db.run('UPDATE pengeluaran SET unit_usaha_id = ?, kategori = ?, qty = ?, harga = ?, jumlah = ?, tanggal_transaksi = ?, keterangan = ? WHERE id = ?',
            [unit_usaha_id, kategori, qty, harga, jumlah, tanggal_transaksi, keterangan, id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              
              // Log activity
              const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
              const unitUsahaText = unitUsahaName ? ` untuk ${unitUsahaName}` : '';
              const description = `Mengupdate pengeluaran ${kategori}${unitUsahaText} menjadi ${formatCurrency(jumlah)}`;
              
              const ip = req.ip || req.connection.remoteAddress;
              const userAgent = req.get('user-agent') || '';
              
              db.run(
                `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, req.user.username, 'UPDATE', 'Pengeluaran', description, ip, userAgent],
                (logErr) => {
                  if (logErr) console.error('Error logging activity:', logErr);
                }
              );
              
              res.json({ message: 'Pengeluaran berhasil diupdate' });
            }
          );
        }
      });
    }
});

app.delete('/api/transaksi/pengeluaran/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Get pengeluaran data before delete for activity log
  db.get('SELECT p.*, uu.nama_usaha FROM pengeluaran p LEFT JOIN unit_usaha uu ON p.unit_usaha_id = uu.id WHERE p.id = ?', [id], (err, pengeluaran) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pengeluaran) return res.status(404).json({ error: 'Data pengeluaran tidak ditemukan' });
    
    db.run('DELETE FROM pengeluaran WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log activity
      const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
      const unitUsahaText = pengeluaran.nama_usaha ? ` untuk ${pengeluaran.nama_usaha}` : '';
      const description = `Menghapus pengeluaran ${pengeluaran.kategori}${unitUsahaText} sebesar ${formatCurrency(pengeluaran.jumlah)}`;
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';
      
      db.run(
        `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, req.user.username, 'DELETE', 'Pengeluaran', description, ip, userAgent],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
      
      res.json({ message: 'Pengeluaran berhasil dihapus' });
    });
  });
});

// ===== PENDAPATAN LAIN ROUTES =====
app.get('/api/transaksi/pendapatan-lain', authenticateToken, (req, res) => {
  db.all(`SELECT pl.*, uu.nama_usaha 
          FROM pendapatan_lain pl 
          LEFT JOIN unit_usaha uu ON pl.unit_usaha_id = uu.id 
          ORDER BY pl.tanggal_transaksi DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/transaksi/pendapatan-lain', authenticateToken, (req, res) => {
  const { unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan } = req.body;
  
  // Get unit usaha name for activity log
  if (unit_usaha_id) {
    db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
      insertPendapatanLain(unitUsaha ? unitUsaha.nama_usaha : null);
    });
  } else {
    insertPendapatanLain(null);
  }
  
  function insertPendapatanLain(unitUsahaName) {
    db.run('INSERT INTO pendapatan_lain (unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan) VALUES (?, ?, ?, ?, ?)',
      [unit_usaha_id || null, kategori, jumlah, tanggal_transaksi, keterangan],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          // Log activity
          const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
          const unitUsahaText = unitUsahaName ? ` dari ${unitUsahaName}` : '';
          const description = `Menambahkan pendapatan lain ${kategori}${unitUsahaText} sebesar ${formatCurrency(jumlah)}`;
          
          const ip = req.ip || req.connection.remoteAddress;
          const userAgent = req.get('user-agent') || '';
          
          db.run(
            `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, req.user.username, 'CREATE', 'Pendapatan Lain', description, ip, userAgent],
            (logErr) => {
              if (logErr) console.error('Error logging activity:', logErr);
            }
          );
          
          res.json({ message: 'Pendapatan lain berhasil ditambahkan', id: this.lastID });
        }
      );
    }
});

app.put('/api/transaksi/pendapatan-lain/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan } = req.body;
  
  // Get unit usaha name for activity log
  if (unit_usaha_id) {
    db.get('SELECT nama_usaha FROM unit_usaha WHERE id = ?', [unit_usaha_id], (err, unitUsaha) => {
      updatePendapatanLain(unitUsaha ? unitUsaha.nama_usaha : null);
    });
  } else {
    updatePendapatanLain(null);
  }
  
  function updatePendapatanLain(unitUsahaName) {
    db.run('UPDATE pendapatan_lain SET unit_usaha_id = ?, kategori = ?, jumlah = ?, tanggal_transaksi = ?, keterangan = ? WHERE id = ?',
      [unit_usaha_id, kategori, jumlah, tanggal_transaksi, keterangan, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log activity
        const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        const unitUsahaText = unitUsahaName ? ` dari ${unitUsahaName}` : '';
        const description = `Mengupdate pendapatan lain ${kategori}${unitUsahaText} menjadi ${formatCurrency(jumlah)}`;
        
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';
        
        db.run(
          `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [req.user.id, req.user.username, 'UPDATE', 'Pendapatan Lain', description, ip, userAgent],
          (logErr) => {
            if (logErr) console.error('Error logging activity:', logErr);
          }
        );
        
        res.json({ message: 'Pendapatan lain berhasil diupdate' });
      }
    );
  }
});

app.delete('/api/transaksi/pendapatan-lain/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Get pendapatan lain data before delete for activity log
  db.get('SELECT pl.*, uu.nama_usaha FROM pendapatan_lain pl LEFT JOIN unit_usaha uu ON pl.unit_usaha_id = uu.id WHERE pl.id = ?', [id], (err, pendapatan) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pendapatan) return res.status(404).json({ error: 'Data pendapatan lain tidak ditemukan' });
    
    db.run('DELETE FROM pendapatan_lain WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log activity
      const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
      const unitUsahaText = pendapatan.nama_usaha ? ` dari ${pendapatan.nama_usaha}` : '';
      const description = `Menghapus pendapatan lain ${pendapatan.kategori}${unitUsahaText} sebesar ${formatCurrency(pendapatan.jumlah)}`;
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';
      
      db.run(
        `INSERT INTO activity_log (user_id, username, action, module, description, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, req.user.username, 'DELETE', 'Pendapatan Lain', description, ip, userAgent],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
      
      res.json({ message: 'Pendapatan lain berhasil dihapus' });
    });
  });
});
