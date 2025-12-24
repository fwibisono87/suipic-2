import { CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { s3, storage } from './services/storage';

const BUCKET = process.env.S3_BUCKET || 'suipic';

async function main() {
    console.log(`🔌 Connecting to S3 at ${process.env.S3_ENDPOINT}...`);

    try {
        // 1. Check/Create Bucket
        try {
            await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
            console.log(`✅ Bucket '${BUCKET}' exists.`);
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                console.log(`⚠️ Bucket '${BUCKET}' not found. Creating...`);
                await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
                console.log(`✅ Bucket '${BUCKET}' created.`);
            } else {
                throw error;
            }
        }

        // 2. Test Upload
        const key = `test-${Date.now()}.txt`;
        const content = 'Hello from SuiPic S3 Test!';
        console.log(`📤 Uploading test file: ${key}`);
        await storage.uploadFile(key, content, 'text/plain');
        console.log('✅ Upload successful.');

        // 3. Test Signed URL
        const url = await storage.getSignedUrl(key);
        console.log(`🔑 Signed URL generated: ${url}`);
        
        // 4. Cleanup (Optional, keep for verification if needed)
        // await storage.deleteFile(key);
        // console.log('🗑️ Test file deleted.');

    } catch (err) {
        console.error('❌ S3 Test Failed:', err);
        process.exit(1);
    }
}

main();
