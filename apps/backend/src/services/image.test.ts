import { describe, expect, it, beforeAll } from 'bun:test';
import { imageService } from './image';
import { storage } from './storage';
import { albumService } from './album';
import { userService } from './user';
import { db } from '../db';
import { images } from '../db/schema';
import { eq } from 'drizzle-orm';
import { join } from 'path';

describe('imageService', () => {
    let photographerId: string;
    let albumId: string;
    let testImageBuffer: Buffer;

    beforeAll(async () => {
        await storage.ensureBucket();

        // Setup Photographer
        const photographer = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `photo-img-test-${Date.now()}@test.com`,
            role: 'photographer'
        });
        if (!photographer) throw new Error('Failed to create photographer');
        photographerId = photographer.id;

        // Setup Album
        const album = await albumService.createAlbum({
            title: 'Image Test Album',
            ownerPhotographerId: photographerId
        });
        if (!album) throw new Error('Failed to create album');
        albumId = album.id;

        // use a real image buffer or create a dummy one that sharp accepts?
        // Sharp needs valid image data. 
        // We can create a simple SVG or fetch a tiny image if network allowed, or create simple buffer.
        // Let's create a minimal SVG buffer which sharp can handle
        const svgImage = `
        <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="150" height="150" fill="green" />
        </svg>
        `;
        testImageBuffer = Buffer.from(svgImage);
    });

    it('should upload and process an image', async () => {
        const image = await imageService.processAndStoreImage(albumId, photographerId, testImageBuffer, 'test.svg');
        
        expect(image).toBeDefined();
        if (!image) return;
        expect(image.status).toBe('ready'); // Should be ready since we are awaiting process
        expect(image.storageKeyFull).toContain('full.webp');
        expect(image.storageKeyThumb).toContain('thumb.webp');
        
        // Metadata not really extractable from simple SVG via exifr usually, but record should exist
        expect(image.filename).toBe('test.svg');
    });

    it('should list images with signed urls', async () => {
        const list = await imageService.getImagesForAlbum(albumId);
        expect(list.length).toBeGreaterThanOrEqual(1);
        
        const img = list[0];
        if (img.status !== 'ready') throw new Error('Image not ready');
        // @ts-ignore - inferred union issue
        expect(img.urlFull).toContain('http'); // local minio url
        // @ts-ignore
        expect(img.urlThumb).toContain('http');
    });

    it('should handle processing failure gracefully', async () => {
        // Pass invalid buffer to trigger sharp error
        const invalidBuffer = Buffer.from('not an image');
        
        try {
            await imageService.processAndStoreImage(albumId, photographerId, invalidBuffer, 'broken.jpg');
            // Should not reach here
            expect(true).toBe(false);
        } catch (e) {
            expect(e).toBeDefined();
        }

        // Verify status is 'failed' in DB
        const failedImg = await db.query.images.findFirst({
            where: and(
                eq(images.filename, 'broken.jpg'),
                eq(images.uploaderPhotographerId, photographerId)
            )
        });
        
        expect(failedImg).toBeDefined();
        expect(failedImg!.status).toBe('failed');
    });

    it('should get a single image', async () => {
        // Upload one first
        const image = await imageService.processAndStoreImage(albumId, photographerId, testImageBuffer, 'single.svg');
        if (!image) throw new Error('Image creation failed');

        const fetched = await imageService.getImage(image.id);
        expect(fetched).toBeDefined();
        expect(fetched!.id).toBe(image.id);
        // @ts-ignore
        expect(fetched.urlFull).toContain('http');
    });

    it('should return null for non-existent image', async () => {
        const fetched = await imageService.getImage(crypto.randomUUID());
        expect(fetched).toBeNull();
    });

    it('should return image without urls if not ready', async () => {
        // Manually insert processing image
        const [img] = await db.insert(images).values({
            albumId: albumId,
            uploaderPhotographerId: photographerId,
            filename: 'processing.jpg',
            status: 'processing'
        }).returning();

        const fetched = await imageService.getImage(img.id);
        expect(fetched).toBeDefined();
        expect(fetched!.status).toBe('processing');
        // @ts-ignore
        expect(fetched.urlFull).toBeUndefined();
    });
});
// Need to import 'and'
import { and } from 'drizzle-orm';
