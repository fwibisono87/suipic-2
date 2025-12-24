import { describe, expect, it, beforeAll } from 'bun:test';
import { imageService } from './image';
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
        expect(img.urlFull).toContain('http'); // local minio url
        expect(img.urlThumb).toContain('http');
    });
});
