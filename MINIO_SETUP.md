# MinIO File Storage Setup Guide

## Pendahuluan
Aplikasi ini menggunakan MinIO untuk menyimpan file undangan agenda. MinIO adalah object storage yang kompatibel dengan Amazon S3 API.

## Setup MinIO

### 1. Install MinIO dengan Docker (Recommended)

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio_data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

### 2. Akses MinIO Console

Buka browser dan akses: `http://localhost:9001`
- Username: `minioadmin`
- Password: `minioadmin`

### 3. Konfigurasi Environment Variables

Update file `.env` dengan konfigurasi MinIO:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=agenda-pimpinan-bucket
```

### 4. Jalankan Aplikasi

Saat aplikasi backend dijalankan, MinIO akan otomatis:
- Membuat bucket `agenda-pimpinan-bucket` jika belum ada
- Mengset bucket policy untuk public read access

```bash
npm run dev:backend
```

## File Upload API Endpoints

### 1. Upload File ke Agenda
**Endpoint:** `POST /api/agenda/:id/upload`
**Content-Type:** `multipart/form-data`
**Authorization:** Required (Bearer token)

**Form Data:**
- `file`: File yang akan diupload (PDF, Images, Word, Excel - Max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileName": "original-filename.pdf",
    "filePath": "agenda/2024/09/123/unique-filename.pdf",
    "fileSize": 1234567,
    "fileType": "application/pdf",
    "fileUrl": "http://localhost:9000/agenda-pimpinan-bucket/agenda/2024/09/123/unique-filename.pdf",
    "uploadedAt": "2024-09-30T12:34:56.789Z"
  }
}
```

### 2. Delete File dari Agenda
**Endpoint:** `DELETE /api/agenda/:id/file`
**Authorization:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### 3. Get Download URL
**Endpoint:** `GET /api/agenda/:id/download?expiry=3600`
**Authorization:** Required (Bearer token)

**Query Parameters:**
- `expiry`: URL expiration time in seconds (default: 3600 = 1 hour)

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "http://localhost:9000/agenda-pimpinan-bucket/...",
    "fileName": "document.pdf",
    "fileSize": 1234567,
    "fileType": "application/pdf"
  }
}
```

## Database Fields

Migration `005_add_file_storage_fields.sql` menambahkan field berikut ke tabel `agenda`:

| Field | Type | Description |
|-------|------|-------------|
| `file_name` | VARCHAR(255) | Nama file asli |
| `file_path` | VARCHAR(500) | MinIO object key/path |
| `file_size` | BIGINT | Ukuran file (bytes) |
| `file_type` | VARCHAR(100) | MIME type |
| `file_uploaded_at` | TIMESTAMP | Waktu upload |
| `file_bucket` | VARCHAR(100) | Nama bucket (default: agenda-pimpinan-bucket) |

## File Upload Flow

1. **Frontend**: User memilih file di AddAgendaForm
2. **Frontend**: Buat agenda terlebih dahulu (POST /api/agenda)
3. **Frontend**: Upload file menggunakan agenda ID (POST /api/agenda/:id/upload)
4. **Backend**: Terima file via multer middleware
5. **Backend**: Upload file ke MinIO
6. **Backend**: Update database dengan informasi file
7. **Frontend**: Tampilkan notifikasi sukses

## Allowed File Types

- PDF: `application/pdf`
- Images: `image/jpeg`, `image/png`, `image/gif`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Text: `text/plain`

**Max File Size:** 10MB

## Troubleshooting

### MinIO Connection Failed
```bash
❌ MinIO connection failed: connect ECONNREFUSED 127.0.0.1:9000
```
**Solution:** Pastikan MinIO container sudah running
```bash
docker ps | grep minio
```

### Bucket Creation Failed
**Solution:** Periksa MinIO credentials di environment variables

### File Upload Failed
**Solution:** 
1. Periksa file size (max 10MB)
2. Periksa file type (harus sesuai allowed types)
3. Periksa MinIO connection
4. Periksa logs di console

## Production Notes

Untuk production environment:
1. Gunakan credentials yang secure (bukan default minioadmin)
2. Enable SSL/TLS (`MINIO_USE_SSL=true`)
3. Gunakan domain untuk MinIO endpoint
4. Setup backup untuk MinIO data
5. Configure proper access policies
6. Monitor storage usage

## Resources

- MinIO Documentation: https://min.io/docs/minio/linux/index.html
- MinIO JavaScript SDK: https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html

