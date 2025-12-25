import { db } from '../db';
import { imageFeedback, images, albumClients } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const feedbackService = {
    async upsertFeedback(imageId: string, clientUserId: string, data: { flag?: 'pick' | 'reject'; rating?: number }) {
        // Authorization: Verify client has access to the album containing this image
        const image = await db.query.images.findFirst({
            where: eq(images.id, imageId),
            with: {
                album: {
                    with: {
                        clients: {
                            where: eq(albumClients.clientId, clientUserId)
                        }
                    }
                }
            }
        });

        if (!image) throw new Error('Image not found');
        
        // If the clients array is empty, it means this user is not assigned to the album
        if (!image.album?.clients || image.album.clients.length === 0) {
            throw new Error('Unauthorized: You do not have access to this album');
        }

        // Check if feedback exists
        const existing = await db.query.imageFeedback.findFirst({
            where: and(
                eq(imageFeedback.imageId, imageId),
                eq(imageFeedback.clientUserId, clientUserId)
            )
        });

        if (existing) {
            return db.update(imageFeedback)
                .set({
                    ...data,
                    modifiedAt: new Date()
                })
                .where(and(
                    eq(imageFeedback.imageId, imageId),
                    eq(imageFeedback.clientUserId, clientUserId)
                ))
                .returning();
        } else {
            return db.insert(imageFeedback).values({
                imageId,
                clientUserId,
                flag: data.flag as 'pick' | 'reject' | null | undefined, // Cast needed due to pgEnum type inference quirks sometimes
                rating: data.rating
            }).returning();
        }
    },

    async getFeedbackForImage(imageId: string, clientUserId: string) {
        return db.query.imageFeedback.findFirst({
            where: and(
                eq(imageFeedback.imageId, imageId),
                eq(imageFeedback.clientUserId, clientUserId)
            )
        });
    }
};
