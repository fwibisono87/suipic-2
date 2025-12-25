import { describe, expect, it, beforeAll } from 'bun:test';
import { dashboardService } from './dashboard';
import { userService } from './user';
import { albumService } from './album';
import { db } from '../db';
import { images, imageFeedback, comments, userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Dashboard Service', () => {
    let photographerId: string;
    let clientId: string;
    let albumId: string;

    beforeAll(async () => {
        // Setup photographer
        const photographer = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `photo-dash-${Date.now()}@test.com`,
            role: 'photographer'
        });
        if (!photographer) throw new Error('Failed to create photographer');
        photographerId = photographer.id;

        // Setup client
        const client = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `client-dash-${Date.now()}@test.com`,
            role: 'client'
        });
        if (!client) throw new Error('Failed to create client');
        clientId = client.id;
    });

    it('should get photographer stats', async () => {
        // Create an album
        const album = await albumService.createAlbum({
            title: 'Stats Album',
            ownerPhotographerId: photographerId
        });
        if (!album) throw new Error('Failed to create album');
        albumId = album.id;

        // Add client to photographer (indirectly via album sharing effectively? 
        // Logic in dashboard service counts "clients" from userProfiles where photographerId matches.
        // Wait, looking at dashboard.ts line 17: .where(eq(userProfiles.photographerId, photographerId));
        // We need to associate client to photographer.
        // Let's check schema. userProfiles has photographerId field.
        await db.update(userProfiles)
            .set({ photographerId: photographerId })
            .where(eq(userProfiles.id, clientId));

        // Add some images and feedback
        const [img] = await db.insert(images).values({
            albumId: album.id,
            uploaderPhotographerId: photographerId,
            filename: 'stats.jpg',
            status: 'ready'
        }).returning();

        await db.insert(imageFeedback).values({
            imageId: img.id,
            clientUserId: clientId,
            flag: 'pick',
            rating: 5
        });

        const stats = await dashboardService.getPhotographerStats(photographerId);
        
        expect(stats.totalAlbums).toBe(1);
        expect(stats.totalClients).toBe(1); // Since we linked 1 client
        expect(stats.totalPicks).toBe(1);
        expect(stats.avgRating).toBe(5);
    });

    it('should get recent activity', async () => {
       // Create another image
       const [img] = await db.insert(images).values({
            albumId: albumId,
            uploaderPhotographerId: photographerId,
            filename: 'activity.jpg',
            status: 'ready'
        }).returning();

       // Add a comment
       await db.insert(comments).values({
           authorUserId: clientId,
           albumId: albumId,
           imageId: img.id,
           body: 'Nice shot!'
       });

       // Add feedback
       await db.insert(imageFeedback).values({
           imageId: img.id,
           clientUserId: clientId,
           flag: 'pick'
       });

       const activity = await dashboardService.getRecentActivity(photographerId, 10);
       
       expect(activity.length).toBeGreaterThanOrEqual(2);
       const types = activity.map(a => a.type);
       expect(types).toContain('comment');
       expect(types).toContain('feedback');
    });
});
