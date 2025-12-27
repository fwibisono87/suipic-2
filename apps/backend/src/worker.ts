import { db } from './db';
import { images } from './db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { imageService } from './services/image';
import { storage } from './services/storage';

async function processNextImage() {
    // Find one image stuck in 'processing' that hasn't been picked up yet
    // In a real system we might use a 'locked_at' column or a proper queue
    const [image] = await db.select()
        .from(images)
        .where(eq(images.status, 'processing'))
        .limit(1);

    if (!image) return false;

    console.log(`Processing image ${image.id} (${image.filename})...`);

    try {
        // Here we need the actual file buffer. 
        // Since we are decoupling, the API must have stored the original somewhere,
        // or we need to change the flow to: 
        // 1. API uploads original to a 'temp' prefix in MinIO.
        // 2. Worker downloads original, processes it, uploads derivatives.
        // 3. Worker deletes original.

        // For MVP simplicity and because I don't want to change the storage layout too much yet,
        // I'll assume the imageService.processJob method (to be created) will handle this.
        // Wait, if the worker is a separate process, it doesn't have the buffer from the API request.
        
        // REVISED PLAN:
        // API: upload original to MinIO at `temp/{id}` -> Create DB row (status=processing)
        // Worker: pick up row -> download from `temp/{id}` -> process -> upload derivatives -> delete `temp/{id}` -> update DB (status=ready)

        await imageService.processImageJob(image.id);
        console.log(`Finished processing image ${image.id}`);
        return true;
    } catch (error) {
        console.error(`Failed to process image ${image.id}:`, error);
        await db.update(images)
            .set({ status: 'failed' })
            .where(eq(images.id, image.id));
        return true; // We processed it (even if it failed), move to next
    }
}

async function startWorker() {
    console.log('Image processing worker started');
    await storage.ensureBucket();
    
    while (true) {
        const found = await processNextImage();
        if (!found) {
            // Wait a bit before polling again
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

startWorker().catch(err => {
    console.error('Worker crashed:', err);
    process.exit(1);
});
