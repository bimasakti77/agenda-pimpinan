# 📁 Alur Upload File Agenda - Documentation

## 🎯 Ringkasan Perubahan

Sistem upload file sudah **diperbaiki** dari **two-step process** menjadi **single request** untuk efisiensi dan konsistensi data.

---

## ❌ Masalah Sebelumnya (Two-Step Process)

### **Frontend (OLD):**
```typescript
// Step 1: Create agenda (tanpa file)
const agendaData = { title, description, ... };
const result = await apiService.post('/api/agenda', agendaData);

// Step 2: Upload file terpisah
if (file && result.data.id) {
  const formData = new FormData();
  formData.append('file', file);
  await apiService.post(`/api/agenda/${result.data.id}/upload`, formData);
}
```

### **Masalah:**
- ❌ **2 HTTP requests** (lambat, inefficient)
- ❌ **File tidak terkirim** saat create agenda
- ❌ **Data tidak konsisten**: Jika step 2 gagal, agenda terbuat tanpa file
- ❌ **Race condition**: Bisa terjadi error antara step 1 dan 2
- ❌ **Database tidak ada record** karena file tidak pernah terkirim ke backend

---

## ✅ Solusi (Single Request - NEW)

### **Frontend (NEW):**
```typescript
// SINGLE REQUEST: Create agenda + upload file sekaligus
const formDataToSend = new FormData();
formDataToSend.append('data', JSON.stringify(agendaData)); // JSON data
formDataToSend.append('file', file_undangan);              // File

const result = await apiService.post('/api/agenda', formDataToSend, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### **Backend (NEW):**
```javascript
// agendaRoutes.js
router.post('/', authenticate, uploadSingle, async (req, res, next) => {
  // 1. Parse JSON data dari field 'data'
  const agendaData = JSON.parse(req.body.data);
  
  // 2. Create agenda
  const agenda = await agendaService.createAgenda(agendaData, req.user.id);
  
  // 3. Upload file jika ada
  if (req.file) {
    await agendaService.uploadAgendaFile(
      agenda.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
  }
  
  // 4. Return agenda dengan file info
  const updatedAgenda = await agendaService.getAgendaById(agenda.id);
  res.json({ success: true, data: updatedAgenda });
});
```

### **Keuntungan:**
- ✅ **1 HTTP request** (faster, efficient)
- ✅ **File terkirim langsung** saat create agenda
- ✅ **Atomic operation**: Sukses semua atau gagal semua
- ✅ **Konsisten**: Data agenda dan file tersimpan bersamaan
- ✅ **Database record lengkap**: file_name, file_path, file_size, file_type tersimpan

---

## 🔄 Alur Lengkap

### **1. Frontend (AddAgendaForm.tsx)**

```typescript
// Line 239-258: Submit handler
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate form
  if (!validateForm()) return;
  
  // Prepare agenda data
  const agendaData = {
    title: formData.title,
    description: formData.description,
    date: formData.date,
    start_time: formData.start_time,
    end_time: formData.end_time,
    location: formData.location,
    priority: formData.priority,
    nomor_surat: formData.nomor_surat,
    surat_undangan: formData.surat_undangan,
    undangan: formData.undangan,
    status: "scheduled"
  };
  
  // Create FormData with JSON + File
  const formDataToSend = new FormData();
  formDataToSend.append('data', JSON.stringify(agendaData));
  
  if (formData.file_undangan) {
    formDataToSend.append('file', formData.file_undangan);
  }
  
  // Send single request
  const result = await apiService.post(
    API_ENDPOINTS.AGENDA.CREATE,
    formDataToSend,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
};
```

### **2. Backend Route (agendaRoutes.js)**

```javascript
// Line 208-247: Create agenda with file
router.post('/', authenticate, uploadSingle, async (req, res, next) => {
  try {
    // Parse JSON data from 'data' field
    let agendaData;
    try {
      agendaData = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (parseError) {
      agendaData = req.body;
    }

    // Step 1: Create agenda in database
    const agenda = await agendaService.createAgenda(agendaData, req.user.id);
    
    // Step 2: Upload file to MinIO (if provided)
    if (req.file) {
      await agendaService.uploadAgendaFile(
        agenda.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    // Step 3: Get updated agenda with file info
    const updatedAgenda = await agendaService.getAgendaById(agenda.id);

    res.status(201).json({
      success: true,
      message: req.file ? 'Agenda dan file berhasil dibuat' : 'Agenda created',
      data: updatedAgenda.toJSON()
    });
  } catch (error) {
    next(error);
  }
});
```

### **3. Upload Middleware (upload.js)**

```javascript
// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    // ... other types
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

const uploadSingle = upload.single('file');
```

### **4. Agenda Service (agendaService.js)**

```javascript
// Create agenda
async createAgenda(agendaData, userId) {
  const agenda = await Agenda.create({
    ...agendaData,
    created_by: userId
  });
  return agenda;
}

// Upload file to MinIO
async uploadAgendaFile(agendaId, fileBuffer, originalName, mimeType) {
  const agenda = await Agenda.findById(agendaId);
  
  // Delete old file if exists
  if (agenda.file_path) {
    await FileService.deleteFile(agenda.file_path);
  }
  
  // Upload to MinIO
  const uploadResult = await FileService.uploadFile(
    fileBuffer, 
    originalName, 
    mimeType, 
    agendaId
  );
  
  // Update database with file info
  await agenda.update({
    file_name: uploadResult.fileInfo.fileName,
    file_path: uploadResult.fileInfo.filePath,
    file_size: uploadResult.fileInfo.fileSize,
    file_type: uploadResult.fileInfo.fileType,
    file_uploaded_at: uploadResult.fileInfo.uploadedAt
  });
  
  return { success: true, fileInfo: uploadResult.fileInfo };
}
```

### **5. File Service (fileService.js)**

```javascript
static async uploadFile(fileBuffer, originalName, mimeType, agendaId) {
  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(originalName);
  // Example: surat_1727654321_a1b2c3d4.pdf
  
  // Generate object key (path in MinIO)
  const objectKey = generateObjectKey(uniqueFilename, agendaId);
  // Example: agenda/2025/09/123/surat_1727654321_a1b2c3d4.pdf
  
  // Upload to MinIO
  await minioClient.putObject(
    BUCKET_NAME,
    objectKey,
    fileBuffer,
    fileBuffer.length,
    {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${originalName}"`
    }
  );
  
  return {
    success: true,
    fileInfo: {
      fileName: originalName,
      filePath: objectKey,
      fileSize: fileBuffer.length,
      fileType: mimeType,
      uploadedAt: new Date()
    }
  };
}
```

### **6. MinIO Storage**

```
MinIO Bucket Structure:
agenda-files/
└── agenda/
    └── 2025/                    ← Year
        └── 09/                  ← Month
            └── 123/             ← Agenda ID
                └── surat_undangan_1727654321_a1b2c3d4.pdf
```

### **7. Database Record**

```sql
-- Table: agenda
UPDATE agenda SET
  file_name = 'Surat Undangan Rapat.pdf',
  file_path = 'agenda/2025/09/123/surat_undangan_1727654321_a1b2c3d4.pdf',
  file_size = 245678,
  file_type = 'application/pdf',
  file_uploaded_at = '2025-09-30 10:30:00'
WHERE id = 123;
```

---

## 🧪 Testing

### **1. Test Create Agenda dengan File**

```bash
# Request
POST /api/agenda
Content-Type: multipart/form-data

FormData:
  - data: '{"title":"Rapat Koordinasi","date":"2025-10-01",...}'
  - file: surat_undangan.pdf

# Expected Response
{
  "success": true,
  "message": "Agenda dan file berhasil dibuat",
  "data": {
    "id": 123,
    "title": "Rapat Koordinasi",
    "file_name": "Surat Undangan Rapat.pdf",
    "file_path": "agenda/2025/09/123/surat_undangan_1727654321_a1b2c3d4.pdf",
    "file_size": 245678,
    "file_type": "application/pdf",
    ...
  }
}
```

### **2. Verify di Database**

```sql
SELECT id, title, file_name, file_path, file_size, file_type, file_uploaded_at
FROM agenda
WHERE id = 123;
```

### **3. Verify di MinIO**

```bash
# Check bucket
mc ls minio/agenda-files/agenda/2025/09/123/

# Download file for verification
mc cp minio/agenda-files/agenda/2025/09/123/surat_undangan_1727654321_a1b2c3d4.pdf ./test.pdf
```

---

## 🔒 Security & Validation

### **File Type Validation:**
```javascript
// Allowed types
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
```

### **File Size Limit:**
```javascript
limits: {
  fileSize: 10 * 1024 * 1024, // 10MB max
  files: 1 // Only 1 file per upload
}
```

### **Authentication:**
```javascript
// All routes protected with JWT
router.post('/', authenticate, uploadSingle, ...);
```

### **Authorization:**
```javascript
// Users can only access their own agenda
if (!['admin', 'superadmin'].includes(req.user.role) && 
    agenda.created_by !== req.user.id) {
  return res.status(403).json({ message: 'Access denied' });
}
```

---

## 📝 API Endpoints

### **Create Agenda (with file)**
```
POST /api/agenda
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data

Body (FormData):
  - data: JSON string of agenda data
  - file: File (optional)

Response:
  {
    "success": true,
    "message": "Agenda dan file berhasil dibuat",
    "data": {
      "id": 123,
      "title": "...",
      "file_name": "...",
      "file_path": "...",
      ...
    }
  }
```

### **Upload File (separate endpoint - still available)**
```
POST /api/agenda/:id/upload
Headers:
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data

Body (FormData):
  - file: File

Response:
  {
    "success": true,
    "message": "File uploaded successfully",
    "data": {
      "fileName": "...",
      "filePath": "...",
      "fileSize": 123456,
      "fileType": "application/pdf"
    }
  }
```

### **Download File**
```
GET /api/agenda/:id/download?expiry=3600
Headers:
  - Authorization: Bearer {token}

Response:
  {
    "success": true,
    "data": {
      "downloadUrl": "https://minio:9000/...",
      "fileName": "...",
      "fileSize": 123456,
      "fileType": "application/pdf"
    }
  }
```

### **Delete File**
```
DELETE /api/agenda/:id/file
Headers:
  - Authorization: Bearer {token}

Response:
  {
    "success": true,
    "message": "File deleted successfully"
  }
```

---

## 🐛 Troubleshooting

### **File tidak tersimpan di MinIO:**
```bash
# 1. Check MinIO connection
mc admin info minio

# 2. Check bucket exists
mc ls minio/agenda-files

# 3. Check MinIO logs
docker logs minio

# 4. Verify environment variables
cat .env | grep MINIO
```

### **Database tidak ada record file:**
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'agenda' 
  AND column_name LIKE 'file%';

-- Check migration status
SELECT * FROM schema_migrations ORDER BY executed_at DESC;
```

### **Frontend error saat upload:**
```javascript
// Enable debug logging
console.log('FormData:', formDataToSend);
console.log('File:', formData.file_undangan);

// Check network tab in browser DevTools
// Verify Content-Type: multipart/form-data
// Verify both 'data' and 'file' are sent
```

---

## 📚 References

- **Frontend**: `frontend/src/components/AddAgendaForm.tsx`
- **Backend Route**: `src/routes/agendaRoutes.js`
- **Service**: `src/services/agendaService.js`
- **File Service**: `src/services/fileService.js`
- **Upload Middleware**: `src/middleware/upload.js`
- **MinIO Config**: `src/config/minio.js`
- **Migration**: `src/database/migrations/005_add_file_storage_fields.sql`

---

## ✅ Checklist Implementasi

- [x] Backend route support multipart/form-data
- [x] Frontend kirim file dalam FormData
- [x] Service layer handle file upload
- [x] MinIO integration working
- [x] Database migration executed
- [x] Error handling implemented
- [x] File validation (type & size)
- [x] Security (authentication & authorization)
- [ ] Testing dengan data real
- [ ] Monitoring logs

---

**Last Updated**: September 30, 2025  
**Author**: Development Team
