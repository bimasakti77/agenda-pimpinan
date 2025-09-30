const Minio = require('minio');

// MinIO configuration
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || (process.env.MINIO_USE_SSL === 'true' ? 443 : 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
};


// Create MinIO client
const minioClient = new Minio.Client(minioConfig);

// Test connection by listing buckets
minioClient.listBuckets((err, buckets) => {
    if (err) {
        console.error('❌ MinIO connection faileeed:', err);
    } else {
        console.log('✅ MinIO connection successful. Buckets:', buckets);
    }
});

// Default bucket name
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'agenda-pimpinan-bucket';

// Initialize MinIO (create bucket if not exists)
const initializeMinio = async () => {
  try {
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' created successfully`);
    } else {
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' already exists`);
    }
    
    // Set bucket policy to allow public read access for uploaded files
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    };
    
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`✅ MinIO bucket policy set for '${BUCKET_NAME}'`);
    
  } catch (error) {
    console.error('❌ MinIO initialization failed:', error.message);
    throw error;
  }
};

// Test MinIO connection
const testMinioConnection = async () => {
  try {
    await minioClient.bucketExists(BUCKET_NAME);
    console.log('✅ MinIO connection test successful');
    return true;
  } catch (error) {
    console.error('❌ MinIO connection test failed:', error.message);
    return false;
  }
};

module.exports = {
  minioClient,
  BUCKET_NAME,
  initializeMinio,
  testMinioConnection
};
