import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { cleanupService } from './cleanup';
import { userService } from './user';
import { albumService } from './album';
import { db } from '../db';
import { images } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Cleanup Service', () => {
    let photographerId: string;
    let albumId: string;

    beforeAll(async () => {
        // Setup
         const photographer = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `photo-cleanup-${Date.now()}@test.com`,
            role: 'photographer'
        });
        photographerId = photographer!.id;

        const album = await albumService.createAlbum({
            title: 'Cleanup Album',
            ownerPhotographerId: photographerId
        });
        albumId = album!.id;
    });

    it('should cleanup stuck processing images', async () => {
        // Insert a 'stuck' image (processing state, created a long time ago)
        const oldDate = new Date(Date.now() - 120 * 60 * 1000); // 2 hours ago

        const [stuckImg] = await db.insert(images).values({
            albumId: albumId,
            uploaderPhotographerId: photographerId,
            filename: 'stuck.jpg',
            status: 'processing',
            createdAt: oldDate
        }).returning();

        // Insert a 'fresh' processing image (should not be cleaned)
        const freshDate = new Date();
        const [freshImg] = await db.insert(images).values({
             albumId: albumId,
            uploaderPhotographerId: photographerId,
            filename: 'fresh.jpg',
            status: 'processing',
            createdAt: freshDate
        }).returning();

        const result = await cleanupService.cleanupStuckProcessing(60); // 60 mins threshold
        expect(result.deletedCount).toBeGreaterThanOrEqual(1);

        // Verify stuck image is gone
        const checkStuck = await db.query.images.findFirst({
            where: eq(images.id, stuckImg.id)
        });
        expect(checkStuck).toBeUndefined();

        // Verify fresh image is still there
        const checkFresh = await db.query.images.findFirst({
            where: eq(images.id, freshImg.id)
        });
        expect(checkFresh).toBeDefined();
    });
});
