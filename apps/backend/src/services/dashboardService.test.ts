import { describe, expect, it, beforeAll } from 'bun:test';
import { dashboardService } from './dashboard';
import { userService } from './user';
import { albumService } from './album';
import { imageService } from './image';
import { feedbackService } from './feedback';
import { db } from '../db';
import { images } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('dashboardService', () => {
    let photographerId: string;
    let clientId: string;
    let albumId: string;
    let imageId: string;

    beforeAll(async () => {
        // 1. Setup Photographer
        const p = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `db-photo-${Date.now()}@test.com`,
            role: 'photographer'
        });
        if (!p) throw new Error('Photographer setup failed');
        photographerId = p.id;

        // 2. Setup Client
        const c = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `db-client-${Date.now()}@test.com`,
            role: 'client',
            photographerId: photographerId
        });
        if (!c) throw new Error('Client setup failed');
        clientId = c.id;

        // 3. Setup Album
        const album = await albumService.createAlbum({
            title: 'Stats Album',
            ownerPhotographerId: photographerId
        });
        if (!album) throw new Error('Album setup failed');
        albumId = album.id;
        
        // 4. Register Image (simulate)
        const dummyBuffer = Buffer.from('test');
        const img = await imageService.registerImage(albumId, photographerId, dummyBuffer, 'test.jpg');
        imageId = img.id;

        // Force status to ready so it might appeal to queries if they filtered by status (dashboard currently doesn't seem to enforce status, but good practice)
        await db.update(images).set({ status: 'ready' }).where(eq(images.id, imageId));

        // 5. Add Client to Album (Required for feedback)
        await albumService.addClientToAlbum(albumId, clientId);

        // 6. Add Feedback
        await feedbackService.upsertFeedback(imageId, clientId, {
            flag: 'pick',
            rating: 5
        });
    });

    it('should get photographer stats', async () => {
        const stats = await dashboardService.getPhotographerStats(photographerId);

        expect(stats.totalAlbums).toBeGreaterThanOrEqual(1);
        expect(stats.totalClients).toBeGreaterThanOrEqual(1);
        expect(stats.totalPicks).toBeGreaterThanOrEqual(1);
        expect(stats.avgRating).not.toBe(0); // Should be 5.0
    });

    it('should get recent activity', async () => {
        const activity = await dashboardService.getRecentActivity(photographerId);
        
        expect(Array.isArray(activity)).toBe(true);
        expect(activity.length).toBeGreaterThan(0);
        
        // Verify structure
        const item = activity[0];
        expect(item.type).toBeDefined(); // 'feedback' or 'comment'
        expect(item.date).toBeDefined();
    });
});
