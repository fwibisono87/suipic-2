import { describe, expect, it, beforeAll } from 'bun:test';
import { cleanupService } from './cleanup';
import { userService } from './user';
import { albumService } from './album';
import { db } from '../db';
import { images } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('cleanupService', () => {
    let photographerId: string;
    let albumId: string;

    beforeAll(async () => {
        const p = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `cleanup-${Date.now()}@test.com`,
            role: 'photographer'
        });
        if (!p) throw new Error('Photographer setup failed');
        photographerId = p.id;

        const album = await albumService.createAlbum({
            title: 'Cleanup Album',
            ownerPhotographerId: photographerId
        });
        if (!album) throw new Error('Album setup failed');
        albumId = album.id;
    });

    it('should cleanup stuck images', async () => {
        // 1. Create a "stuck" image (old createdAt)
        const oldDate = new Date(Date.now() - 120 * 60 * 1000); // 2 hours ago

        const [stuckImg] = await db.insert(images).values({
            albumId,
            uploaderPhotographerId: photographerId,
            filename: 'stuck.jpg',
            status: 'processing',
            createdAt: oldDate // forcing old date
        }).returning();

        // 2. Create a "fresh" image (processing but new)
        const [freshImg] = await db.insert(images).values({
            albumId,
            uploaderPhotographerId: photographerId,
            filename: 'fresh.jpg',
            status: 'processing',
            // createdAt: default now
        }).returning();

        // 3. Run cleanup (olderThan 60 mins)
        const result = await cleanupService.cleanupStuckProcessing(60);

        // 4. Verify
        expect(result.deletedCount).toBeGreaterThanOrEqual(1);

        // Stuck image should be gone
        const checkStuck = await db.query.images.findFirst({
            where: eq(images.id, stuckImg.id)
        });
        expect(checkStuck).toBeUndefined();

        // Fresh image should still be there
        const checkFresh = await db.query.images.findFirst({
            where: eq(images.id, freshImg.id)
        });
        expect(checkFresh).toBeDefined();
    });
});
