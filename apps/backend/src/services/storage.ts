import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.S3_REGION || 'us-east-1';
const ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const BUCKET = process.env.S3_BUCKET || 'suipic';

export const s3 = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
    forcePathStyle: true, // Needed for MinIO
});

export const storage = {
    async uploadFile(key: string, body: Buffer | Uint8Array | Blob | string, mimeType: string) {
        // Ensure body is in a format S3 accepts. If it's a File object from an API request,
        // it might need conversion depending on the framework's behavior.
        // Assuming body acts like a Buffer or Uint8Array here.
        
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: mimeType,
        });
        
        return s3.send(command);
    },

    async deleteFile(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });
        return s3.send(command);
    },

    async getSignedUrl(key: string, expiresIn = 3600) {
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });
        return getSignedUrl(s3, command, { expiresIn });
    },
    
    // Helper to ensure bucket exists (useful for dev/bootstrap)
    async ensureBucket() {
        try {
            await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                console.log(`Creating bucket: ${BUCKET}`);
                await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
            } else {
                throw error;
            }
        }
    }
};
