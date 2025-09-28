# Logging Configuration Guide

## Overview
Aplikasi ini menggunakan sistem logging yang dapat dikontrol melalui environment variable `LOG_LEVEL`.

## Log Levels

### 1. `error` - Error Only
- **Hanya menampilkan error** (status code 4xx dan 5xx)
- **Cocok untuk production** yang ingin logging minimal
- **Contoh output:**
```bash
[0] GET /api/agenda 404 15.123 ms - 1234
[0] POST /api/agenda 500 45.789 ms - 567
```

### 2. `warn` - Warnings and Errors
- **Menampilkan warning dan error** (status code 3xx, 4xx, 5xx)
- **Cocok untuk production** yang ingin monitoring masalah
- **Contoh output:**
```bash
[0] GET /api/agenda 301 12.345 ms - 890
[0] GET /api/agenda 404 15.123 ms - 1234
[0] POST /api/agenda 500 45.789 ms - 567
```

### 3. `info` - All Requests (Default Production)
- **Menampilkan semua request** dengan informasi dasar
- **Default untuk production**
- **Contoh output:**
```bash
[0] GET /api/agenda 200 25.456 ms - 15420
[0] POST /api/agenda 201 45.789 ms - 1234
[0] DELETE /api/agenda/61 200 30.123 ms - 567
```

### 4. `debug` - Detailed Information (Default Development)
- **Menampilkan semua request** dengan informasi detail
- **Default untuk development**
- **Contoh output:**
```bash
[0] GET /api/agenda 200 25.456 ms - 15420
[0] GET /api/pegawai/search?q=John&limit=20 200 15.123 ms - 2130
[0] POST /api/agenda 201 45.789 ms - 1234
```

## Configuration

### Environment Variables
```bash
# .env file
LOG_LEVEL=debug    # error, warn, info, debug
NODE_ENV=development
```

### Development Setup
```bash
# .env untuk development
LOG_LEVEL=debug
NODE_ENV=development
```

### Production Setup
```bash
# .env untuk production
LOG_LEVEL=error
NODE_ENV=production
```

### Staging Setup
```bash
# .env untuk staging
LOG_LEVEL=warn
NODE_ENV=production
```

## Usage Examples

### 1. Development dengan Logging Minimal
```bash
# Set LOG_LEVEL=error di .env
LOG_LEVEL=error
```
**Hasil:** Hanya error yang ditampilkan, request normal tidak muncul.

### 2. Production dengan Monitoring
```bash
# Set LOG_LEVEL=warn di .env
LOG_LEVEL=warn
```
**Hasil:** Hanya warning dan error yang ditampilkan.

### 3. Debugging Production Issues
```bash
# Set LOG_LEVEL=debug di .env
LOG_LEVEL=debug
```
**Hasil:** Semua request ditampilkan dengan detail.

## Performance Impact

| Log Level | Performance Impact | Use Case |
|-----------|-------------------|----------|
| `error`   | Minimal          | Production |
| `warn`    | Low              | Staging |
| `info`    | Medium           | Production Monitoring |
| `debug`   | High             | Development |

## Best Practices

1. **Development:** Gunakan `LOG_LEVEL=debug`
2. **Staging:** Gunakan `LOG_LEVEL=warn`
3. **Production:** Gunakan `LOG_LEVEL=error` atau `LOG_LEVEL=info`
4. **Debugging:** Sementara set `LOG_LEVEL=debug` untuk troubleshooting

## Monitoring

Untuk monitoring yang lebih advanced, pertimbangkan menggunakan:
- **PM2** dengan log rotation
- **Winston** untuk structured logging
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Cloud logging** (AWS CloudWatch, Google Cloud Logging)
