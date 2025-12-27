import { db } from '../db';
import { albums, userProfiles, imageFeedback, images, comments } from '../db/schema';
import { eq, sql, desc, inArray } from 'drizzle-orm';

export const dashboardService = {
    async getPhotographerStats(photographerId: string) {
        // 1. Total Albums
        const [albumCountRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(albums)
            .where(eq(albums.ownerPhotographerId, photographerId));

        // 2. Total Clients
        const [clientCountRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(userProfiles)
            .where(eq(userProfiles.photographerId, photographerId));

        // 3. Feedback Stats
        const pAlbums = await db.query.albums.findMany({
            where: eq(albums.ownerPhotographerId, photographerId),
            with: {
                images: {
                    with: {
                        feedback: true
                    }
                }
            }
        });

        let totalPicks = 0;
        let totalRatings = 0;
        let ratingCount = 0;

        for (const alb of pAlbums) {
            for (const img of alb.images) {
                for (const fb of img.feedback) {
                    if (fb.flag === 'pick') totalPicks++;
                    if (fb.rating) {
                        totalRatings += fb.rating;
                        ratingCount++;
                    }
                }
            }
        }

        const avgRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(1) : '0.0';

        return {
            totalAlbums: Number(albumCountRes?.count ?? 0),
            totalClients: Number(clientCountRes?.count ?? 0),
            totalPicks,
            avgRating: Number(avgRating)
        };
    },

    async getRecentActivity(photographerId: string, limit = 5) {
        // Fetch recent feedback and comments across all albums owned by photographer
        // We'll simplisticly fetch recent items and sort in memory for MVP 
        // or we can do a union query if we want to be fancy.
        // Let's do in-memory merge of top 10 from each source for simplicity.
        
        const pAlbums = await db.query.albums.findMany({
            where: eq(albums.ownerPhotographerId, photographerId),
            columns: { id: true }
        });
        
        const albumIds = pAlbums.map(a => a.id);
        
        if (albumIds.length === 0) return [];

        // Get recent comments
        const recentComments = await db.query.comments.findMany({
            where: inArray(comments.albumId, albumIds),
            orderBy: desc(comments.createdAt),
            limit: limit
        });

        // Get recent feedback (join image -> album filters is harder directly in 'findMany' on feedback table without relations set up reversely perfectly)
        // We can query images with feedback where albumId in albumIds
        const recentFeedbackImages = await db.query.images.findMany({
            where: inArray(images.albumId, albumIds),
            with: {
                feedback: true 
            },
            // heuristic limitation
        });
        
        // Flatten feedback
        const allFeedback: any[] = [];
        for (const img of recentFeedbackImages) {
            for (const fb of img.feedback) {
                allFeedback.push({
                    type: 'feedback',
                    date: fb.modifiedAt,
                    data: fb,
                    imageFilename: img.filename
                });
            }
        }

        const allComments = recentComments.map(c => ({
            type: 'comment',
            date: c.createdAt,
            data: c
        }));

        // Merge and sort
        const activity = [...allFeedback, ...allComments]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);

        return activity;
    }
};
