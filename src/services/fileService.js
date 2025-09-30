const { minioClient, BUCKET_NAME } = require('../config/minio');
const { generateUniqueFilename, generateObjectKey } = require('../middleware/upload');

class FileService {
  /**
   * Upload file to MinIO
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} mimeType - File MIME type
   * @param {number} agendaId - Agenda ID
   * @returns {Object} File information
   */
  static async uploadFile(fileBuffer, originalName, mimeType, agendaId) {
    try {
      // Generate unique filename and object key
      const uniqueFilename = generateUniqueFilename(originalName);
      const objectKey = generateObjectKey(uniqueFilename, agendaId);
      
      // Upload file to MinIO
      const uploadResult = await minioClient.putObject(
        BUCKET_NAME,
        objectKey,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${originalName}"`
        }
      );
      
      // Get file size
      const fileSize = fileBuffer.length;
      
      // Generate file URL (public access)
      const fileUrl = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}/${BUCKET_NAME}/${objectKey}`;
      
      return {
        success: true,
        fileInfo: {
          fileName: originalName,
          filePath: objectKey,
          fileSize: fileSize,
          fileType: mimeType,
          fileUrl: fileUrl,
          bucketName: BUCKET_NAME,
          uploadedAt: new Date()
        }
      };
      
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  /**
   * Delete file from MinIO
   * @param {string} filePath - MinIO object key/path
   * @returns {Object} Deletion result
   */
  static async deleteFile(filePath) {
    try {
      if (!filePath) {
        return { success: true, message: 'No file to delete' };
      }
      
      await minioClient.removeObject(BUCKET_NAME, filePath);
      
      return {
        success: true,
        message: 'File deleted successfully'
      };
      
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
  
  /**
   * Get file info from MinIO
   * @param {string} filePath - MinIO object key/path
   * @returns {Object} File information
   */
  static async getFileInfo(filePath) {
    try {
      if (!filePath) {
        return null;
      }
      
      const stat = await minioClient.statObject(BUCKET_NAME, filePath);
      
      return {
        fileName: stat.metaData['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || 'unknown',
        fileSize: stat.size,
        fileType: stat.metaData['content-type'],
        lastModified: stat.lastModified,
        etag: stat.etag
      };
      
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }
  
  /**
   * Generate presigned URL for file download
   * @param {string} filePath - MinIO object key/path
   * @param {string} bucketName - MinIO bucket name (optional, defaults to BUCKET_NAME)
   * @param {number} expiry - URL expiry time in seconds (default: 1 hour)
   * @returns {string} Presigned URL
   */
  static async getPresignedUrl(filePath, bucketName = BUCKET_NAME, expiry = 3600) {
    try {
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      const presignedUrl = await minioClient.presignedGetObject(bucketName, filePath, expiry);
      return presignedUrl;
      
    } catch (error) {
      console.error('Generate presigned URL error:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }
  
  /**
   * List files in a specific agenda folder
   * @param {number} agendaId - Agenda ID
   * @returns {Array} List of files
   */
  static async listAgendaFiles(agendaId) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const prefix = `agenda/${year}/${month}/${agendaId}/`;
      
      const objectsList = [];
      const stream = minioClient.listObjects(BUCKET_NAME, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          objectsList.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag
          });
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
        
        stream.on('end', () => {
          resolve(objectsList);
        });
      });
      
    } catch (error) {
      console.error('List agenda files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
  
  /**
   * Check if file exists in MinIO
   * @param {string} filePath - MinIO object key/path
   * @returns {boolean} File existence
   */
  static async fileExists(filePath) {
    try {
      if (!filePath) {
        return false;
      }
      
      await minioClient.statObject(BUCKET_NAME, filePath);
      return true;
      
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}

module.exports = FileService;

