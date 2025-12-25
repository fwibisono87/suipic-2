import { db } from '../db';
import { images } from '../db/schema';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import exifr from 'exifr';

export const imageService = {
    async processAndStoreImage(
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

        try {
            // 2. Extract Metadata
            const metadata = await exifr.parse(buffer).catch(() => ({}));

            // 3. Process Images
            // Full optimized WebP (quality 85)
            const fullBuffer = await sharp(buffer)
                .rotate() // Auto-rotate based on EXIF
                .webp({ quality: 85 })
                .toBuffer();

            // Thumbnail WebP (300px width)
            const thumbBuffer = await sharp(buffer)
                .rotate()
                .resize(300)
                .webp({ quality: 80 })
                .toBuffer();

            // 4. Upload to Storage
            const fullKey = `albums/${albumId}/${imageRecord.id}/full.webp`;
            const thumbKey = `albums/${albumId}/${imageRecord.id}/thumb.webp`;

            await Promise.all([
                storage.uploadFile(fullKey, fullBuffer, 'image/webp'),
                storage.uploadFile(thumbKey, thumbBuffer, 'image/webp')
            ]);

            // 5. Update DB Record (Ready)
            const [updated] = await db.update(images)
                .set({
                    status: 'ready',
                    storageKeyFull: fullKey,
                    storageKeyThumb: thumbKey,
                    // Metadata map
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
                .where(eq(images.id, imageRecord.id))
                .returning();

            return updated;

        } catch (error) {
            console.error('Image processing failed:', error);
            // Update status to failed
            await db.update(images)
                .set({ status: 'failed' })
                .where(eq(images.id, imageRecord.id));
            throw error;
        }
    },

    async getImagesForAlbum(albumId: string) {
        const imageRecords = await db.query.images.findMany({
            where: eq(images.albumId, albumId),
            orderBy: (images, { desc }) => [desc(images.capturedAt), desc(images.createdAt)],
            with: {
                feedback: true
            }
        });

        // Generate Pre-signed URLs for each ready image
        return Promise.all(imageRecords.map(async (img) => {
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
