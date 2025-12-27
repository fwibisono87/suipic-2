import { db } from '../db';
import { comments } from '../db/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';

export const commentService = {
    async createComment(data: {
        authorUserId: string;
        albumId?: string;
        imageId?: string;
        body: string;
        parentCommentId?: string;
    }) {
        const hasAlbum = !!data.albumId;
        const hasImage = !!data.imageId;
        
        if ((hasAlbum && hasImage) || (!hasAlbum && !hasImage)) {
             throw new Error('Comment must be attached to EITHER an album OR an image (strictly one).');
        }

        // Validate parent comment existence if specified
        if (data.parentCommentId) {
            const parent = await db.query.comments.findFirst({
                where: eq(comments.id, data.parentCommentId)
            });
            if (!parent) throw new Error('Parent comment not found');
        }

        return db.insert(comments).values(data).returning();
    },

    async getCommentsForImage(imageId: string) {
        // Fetch all comments for image, ordered by creation
        // Frontend can handle reconstruction of threading tree
        return db.query.comments.findMany({
            where: and(
                eq(comments.imageId, imageId), 
                isNull(comments.deletedAt)
            ),
            orderBy: desc(comments.createdAt),
            with: {
                // In a real app we'd join user profile here
            }
        });
    },

    async getCommentsForAlbum(albumId: string) {
        return db.query.comments.findMany({
            where: and(
                eq(comments.albumId, albumId), 
                isNull(comments.deletedAt)
            ),
            orderBy: desc(comments.createdAt),
        });
    },

    async softDeleteComment(commentId: string, userId: string, userRole: string) {
        const comment = await db.query.comments.findFirst({
             where: eq(comments.id, commentId)
        });
        
        if (!comment) return null;
        if (comment.authorUserId !== userId && userRole !== 'admin') throw new Error('Unauthorized');

        return db.update(comments)
            .set({ deletedAt: new Date() })
            .where(eq(comments.id, commentId))
            .returning();
    }
};


