import { db } from '../db';
import { images } from '../db/schema';
import { eq, lt, and } from 'drizzle-orm';
import { storage } from './storage';

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

        // Delete them from DB and S3
        let deletedCount = 0;
        for (const img of stuckImages) {
            // Delete from Storage if keys exist
            if (img.storageKeyFull) {
                try {
                    await storage.deleteFile(img.storageKeyFull);
                } catch (e) {
                    console.error(`Failed to delete storageKeyFull: ${img.storageKeyFull}`, e);
                }
            }
            if (img.storageKeyThumb) {
                try {
                    await storage.deleteFile(img.storageKeyThumb);
                } catch (e) {
                    console.error(`Failed to delete storageKeyThumb: ${img.storageKeyThumb}`, e);
                }
            }

            // Cleanup temp file if it exists
            const tempKey = `temp/${img.id}`;
            try {
                await storage.deleteFile(tempKey);
            } catch (e) {
                // Ignore errors if temp file doesn't exist (already processed or never uploaded)
                // AccessDenied or NotFound might happen, we just log debug ideally.
                // console.debug(`Failed to delete tempKey: ${tempKey}`, e);
            }

            // Delete from DB
            await db.delete(images).where(eq(images.id, img.id));
            deletedCount++;
        }

        return {
            deletedCount,
            message: `Cleaned up ${deletedCount} stuck processing images and their storage objects`
        };
    }
};
