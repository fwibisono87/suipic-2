import { db } from '../db';
import { images } from '../db/schema';
import { storage, s3 } from './storage';
import { eq, and, sql, desc as d, asc as a } from 'drizzle-orm';
import sharp from 'sharp';
import exifr from 'exifr';

export const imageService = {
    async registerImage(
        albumId: string, 
        photographerId: string, 
        buffer: Buffer, 
        originalFilename: string
    ) {
        // 1. Initial DB Record (Processing)
        const [imageRecord] = await db.insert(images).values({
            albumId,
            uploaderPhotographerId: photographerId,
            filename: originalFilename,
            status: 'processing'
        }).returning();

        if (!imageRecord) throw new Error('Failed to create image record');

        // 2. Upload original to temp storage for worker
        const tempKey = `temp/${imageRecord.id}`;
        await storage.uploadFile(tempKey, buffer, 'application/octet-stream');

        return imageRecord;
    },

    async processImageJob(imageId: string) {
        const imageRecord = await db.query.images.findFirst({
            where: eq(images.id, imageId)
        });
        if (!imageRecord) throw new Error('Image not found');

        const tempKey = `temp/${imageRecord.id}`;
        
        const buffer = await storage.downloadFile(tempKey);

        try {
            const metadata = await exifr.parse(buffer).catch(() => ({}));

            // 3. Process Images
            const fullBuffer = await sharp(buffer)
                .rotate()
                .webp({ quality: 85 })
                .toBuffer();

            const thumbBuffer = await sharp(buffer)
                .rotate()
                .resize(300)
                .webp({ quality: 80 })
                .toBuffer();

            // 4. Upload to Storage
            const fullKey = `albums/${imageRecord.albumId}/${imageRecord.id}/full.webp`;
            const thumbKey = `albums/${imageRecord.albumId}/${imageRecord.id}/thumb.webp`;

            await Promise.all([
                storage.uploadFile(fullKey, fullBuffer, 'image/webp'),
                storage.uploadFile(thumbKey, thumbBuffer, 'image/webp')
            ]);

            // 5. Update DB Record (Ready)
            await db.update(images)
                .set({
                    status: 'ready',
                    storageKeyFull: fullKey,
                    storageKeyThumb: thumbKey,
                    make: metadata?.Make,
                    model: metadata?.Model,
                    lens: metadata?.LensModel,
                    iso: metadata?.ISO,
                    shutter: metadata?.ExposureTime ? String(metadata.ExposureTime) : undefined,
                    aperture: metadata?.FNumber ? String(metadata.FNumber) : undefined,
                    focalLength: metadata?.FocalLength ? String(metadata.FocalLength) : undefined,
                    capturedAt: metadata?.DateTimeOriginal,
                    metadataJson: metadata
                })
                .where(eq(images.id, imageRecord.id));

            // 6. Cleanup temp
            await storage.deleteFile(tempKey);

        } catch (error) {
            console.error('Image processing job failed:', error);
            await db.update(images)
                .set({ status: 'failed' })
                .where(eq(images.id, imageRecord.id));
            throw error;
        }
    },

    async processAndStoreImage(
        albumId: string, 
        photographerId: string, 
        buffer: Buffer, 
        originalFilename: string
    ) {
        // Compatibility method for existing calls: Register and then process immediately
        const image = await this.registerImage(albumId, photographerId, buffer, originalFilename);
        
        // Trigger processing immediately (awaiting it for now to satisfy tests that expect 'ready' state)
        // In a production worker setup, we might just enqueue it.
        await this.processImageJob(image.id);
        
        // Re-fetch to get updated status/keys if needed, or just return the registered one 
        // (but tests verify resulting state, so maybe we should return updated?)
        // The tests check the return value of this function for status='ready'.
        // So let's re-fetch or manually update object. Re-fetching is safer.
        const updated = await this.getImage(image.id);
        return updated || image;
    },

    async getImagesForAlbum(
        albumId: string, 
        options: { 
            clientUserId?: string, 
            flag?: 'pick' | 'reject', 
            minRating?: number,
            sortBy?: 'capturedAt' | 'createdAt' | 'rating' | 'picks' | 'comments',
            sortOrder?: 'asc' | 'desc',
            limit?: number,
            offset?: number
        } = {}
    ) {
        const { 
            clientUserId, 
            flag, 
            minRating, 
            sortBy = 'capturedAt', 
            sortOrder = 'desc',
            limit = 50,
            offset = 0
        } = options;

        const imageRecords = await db.query.images.findMany({
            where: (images, { eq, and }) => {
                const conditions = [eq(images.albumId, albumId)];
                return and(...conditions);
            },
            limit,
            offset,
            orderBy: (images, { desc, asc }) => {
                const order = sortOrder === 'desc' ? desc : asc;
                if (sortBy === 'capturedAt') return [order(images.capturedAt)];
                if (sortBy === 'createdAt') return [order(images.createdAt)];
                // Default fallback
                return [order(images.capturedAt)];
            },
            with: {
                feedback: clientUserId ? {
                    where: (fb, { eq }) => eq(fb.clientUserId, clientUserId)
                } : true,
                comments: true
            }
        });

        // Filter for client specific feedback/rating if needed (post-query for now as complex join filters in simple query builder are tricky)
        // If we page through DB, we might get fewer results than 'limit' if we filter here. 
        // Ideal is to filter in DB, but for MVP this is acceptable if dataset isn't massive or filter matches most.
        let filtered = imageRecords;
        if (clientUserId) {
            if (flag) {
                filtered = filtered.filter(img => img.feedback?.[0]?.flag === flag);
            }
            if (minRating) {
                filtered = filtered.filter(img => (img.feedback?.[0]?.rating || 0) >= minRating);
            }
        }

        const results = await Promise.all(filtered.map(async (img) => {
            if (img.status !== 'ready') return img;
            
            const [urlFull, urlThumb] = await Promise.all([
                img.storageKeyFull ? storage.getSignedUrl(img.storageKeyFull) : null,
                img.storageKeyThumb ? storage.getSignedUrl(img.storageKeyThumb) : null
            ]);

            return {
                ...img,
                urlFull,
                urlThumb
            };
        }));
        
        return results;
    },

    async getImage(imageId: string) {
        const image = await db.query.images.findFirst({
            where: eq(images.id, imageId),
            with: {
                feedback: true
            }
        });

        if (!image) return null;
        if (image.status !== 'ready') return image;

        const [urlFull, urlThumb] = await Promise.all([
            image.storageKeyFull ? storage.getSignedUrl(image.storageKeyFull) : null,
            image.storageKeyThumb ? storage.getSignedUrl(image.storageKeyThumb) : null
        ]);

        return {
            ...image,
            urlFull,
            urlThumb
        };
    }
};
