import { describe, expect, it, beforeAll } from 'bun:test';
import { feedbackService } from './feedback';
import { userService } from './user';
import { albumService } from './album';
import { db } from '../db';
import { images, imageFeedback } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Feedback Service', () => {
    let clientId: string;
    let imageId: string;
    let photographerId: string;
    let albumId: string;

    beforeAll(async () => {
        // Setup photographer & client
        const photographer = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `photo-fb-${Date.now()}@test.com`,
            role: 'photographer'
        });
        photographerId = photographer!.id;

        const client = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `client-fb-${Date.now()}@test.com`,
            role: 'client'
        });
        clientId = client!.id;

        // Setup album & image
        const album = await albumService.createAlbum({
            title: 'Feedback Album',
            ownerPhotographerId: photographerId
        });
        albumId = album!.id;

        const [img] = await db.insert(images).values({
            albumId: album!.id,
            uploaderPhotographerId: photographerId,
            filename: 'feedback.jpg',
            status: 'ready'
        }).returning();
        imageId = img.id;
    });

    it('should deny feedback if client not assigned to album', async () => {
        expect(feedbackService.upsertFeedback(imageId, clientId, {
            flag: 'pick',
            rating: 5
        })).rejects.toThrow('Unauthorized');
    });

    it('should upsert feedback (insert) after assignment', async () => {
        // Assign client to album
        await albumService.addClientToAlbum(albumId, clientId);

        const [feedback] = await feedbackService.upsertFeedback(imageId, clientId, {
            flag: 'pick',
            rating: 5
        });

        expect(feedback).toBeDefined();
        expect(feedback.flag).toBe('pick');
        expect(feedback.rating).toBe(5);
    });

    it('should upsert feedback (update)', async () => {
        const [feedback] = await feedbackService.upsertFeedback(imageId, clientId, {
            flag: 'reject',
            rating: 1
        });

        expect(feedback).toBeDefined();
        expect(feedback.flag).toBe('reject');
        expect(feedback.rating).toBe(1);

        // Verify count is still 1
        const all = await db.query.imageFeedback.findMany({
            where: eq(imageFeedback.imageId, imageId)
        });
        expect(all.length).toBe(1);
    });

    it('should get feedback for image', async () => {
        const fetched = await feedbackService.getFeedbackForImage(imageId, clientId);
        expect(fetched).toBeDefined();
        expect(fetched!.rating).toBe(1);
    });
});
