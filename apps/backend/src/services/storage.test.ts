import { describe, expect, it, beforeAll, spyOn, mock } from 'bun:test';
import { storage, s3 } from './storage';

describe('Storage Service', () => {
    it('is defined', () => {
        expect(storage).toBeDefined();
    });

    it('should ensure bucket exists (idempotent)', async () => {
        // This runs against the real MinIO container
        await storage.ensureBucket();
        // Run again to verify idempotency (should not throw)
        await storage.ensureBucket();
        expect(true).toBe(true);
    });

    it('should create bucket if missing (404)', async () => {
        const sendSpy = spyOn(s3, 'send');
        
        let callCount = 0;
        sendSpy.mockImplementation(async (command: any) => {
            callCount++;
            // First call: HeadBucket -> throws 404
            if (callCount === 1) {
                const err: any = new Error('NotFound');
                err.name = 'NotFound';
                err.$metadata = { httpStatusCode: 404 };
                throw err;
            }
            // Second call: CreateBucket -> success
            return {};
        });

        await storage.ensureBucket();
        
        // Should have called createBucket
        expect(callCount).toBe(2);
        
        sendSpy.mockRestore();
    });

    it('should throw non-404 errors in ensureBucket', async () => {
        const sendSpy = spyOn(s3, 'send');
        // Mock implementation to throw generic error
        sendSpy.mockImplementationOnce(() => {
            throw new Error('Generic AWS Error');
        });

        // Should throw
        try {
            await storage.ensureBucket();
            expect(false).toBe(true); // Fail if no throw
        } catch (e: any) {
            expect(e.message).toBe('Generic AWS Error');
        }

        sendSpy.mockRestore();
    });

    it('should upload and delete a file', async () => {
        const key = `test-del-${Date.now()}.txt`;
        const content = Buffer.from('delete-me');
        
        // Upload
        const uploadRes = await storage.uploadFile(key, content, 'text/plain');
        expect(uploadRes).toBeDefined();

        // Check signed url works (verifies existence implicitly)
        const url = await storage.getSignedUrl(key);
        expect(url).toContain('http');

        // Delete
        const delRes = await storage.deleteFile(key);
        expect(delRes).toBeDefined();
    });
});
