import { db } from '../db';
import { images } from '../db/schema';
import { eq, lt, and } from 'drizzle-orm';

export const cleanupService = {
    /**
     * Cleans up images that have been stuck in 'processing' state for too long.
     * @param olderThanMinutes - Threshold in minutes to consider a job "stuck"
     */
    async cleanupStuckProcessing(olderThanMinutes: number = 60) {
        const thresholdDate = new Date(Date.now() - olderThanMinutes * 60 * 1000);

        // Find stuck images
        const stuckImages = await db.query.images.findMany({
            where: and(
                eq(images.status, 'processing'),
                lt(images.createdAt, thresholdDate)
            )
        });

        if (stuckImages.length === 0) {
            return { deletedCount: 0, message: 'No stuck images found' };
        }

        // Delete them from DB
        // In a real production system, we might want to try to delete from S3 too if partial upload occurred,
        // but for now we assume they didn't fully make it or we just clean the DB row.
        const ids = stuckImages.map(img => img.id);
        
        // Batch delete is safer done individually or via 'inArray' if supported effectively,
        // but let's loop for safety in this simple implementation or use inArray if we imported it.
        // We'll use a loop for now to be explicit.
        
        let deletedCount = 0;
        for (const img of stuckImages) {
            await db.delete(images).where(eq(images.id, img.id));
            deletedCount++;
        }

        return {
            deletedCount,
            message: `Cleaned up ${deletedCount} stuck processing images`
        };
    }
};
