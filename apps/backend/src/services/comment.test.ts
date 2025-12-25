import { describe, expect, it, beforeAll } from 'bun:test';
import { commentService } from './comment';
import { userService } from './user';
import { albumService } from './album';
import { db } from '../db';
import { images, comments } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Comment Service', () => {
    let authorId: string;
    let otherUserId: string;
    let albumId: string;
    let imageId: string;

    beforeAll(async () => {
        // Setup author
        const author = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `comment-auth-${Date.now()}@test.com`,
            role: 'client'
        });
        if (!author) throw new Error('Failed to create author');
        authorId = author.id;

        // Setup other user
        const other = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `other-user-${Date.now()}@test.com`,
            role: 'client'
        });
        if (!other) throw new Error('Failed to create other user');
        otherUserId = other.id;

        // Setup album & image
        const photographer = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `photo-cmt-${Date.now()}@test.com`,
            role: 'photographer'
        });
        const album = await albumService.createAlbum({
            title: 'Comment Album',
            ownerPhotographerId: photographer!.id
        });
        albumId = album!.id;

        const [img] = await db.insert(images).values({
            albumId: albumId,
            uploaderPhotographerId: photographer!.id,
            filename: 'comment.jpg',
            status: 'ready'
        }).returning();
        imageId = img.id;
    });

    it('should create a comment', async () => {
        const [comment] = await commentService.createComment({
            authorUserId: authorId,
            imageId: imageId,
            body: 'First comment'
        });

        expect(comment).toBeDefined();
        expect(comment.body).toBe('First comment');
        expect(comment.authorUserId).toBe(authorId);
    });

    it('should get comments for image', async () => {
        // Create another comment
        await commentService.createComment({
            authorUserId: authorId,
            imageId: imageId,
            body: 'Second comment'
        });

        const list = await commentService.getCommentsForImage(imageId);
        expect(list.length).toBeGreaterThanOrEqual(2);
        // Check ordering (descending)
        expect(new Date(list[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(list[1].createdAt).getTime());
    });

    it('should soft delete a comment', async () => {
        const [comment] = await commentService.createComment({
            authorUserId: authorId,
            imageId: imageId,
            body: 'To be deleted'
        });

        const deleted = await commentService.softDeleteComment(comment.id, authorId, 'client');
        expect(deleted).toBeDefined();
        // The return type of update...returning() is an array
        expect(deleted![0].deletedAt).not.toBeNull();

        // Should not appear in list
        const list = await commentService.getCommentsForImage(imageId);
        const ids = list.map(c => c.id);
        expect(ids).not.toContain(comment.id);
    });

    it('should not allow unauthorized delete', async () => {
        const [comment] = await commentService.createComment({
            authorUserId: authorId,
            imageId: imageId,
            body: 'Cannot delete me'
        });

        const result = await commentService.softDeleteComment(comment.id, otherUserId, 'client').catch(e => e);
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unauthorized');
    });

    it('should allow admin to delete any comment', async () => {
        const [comment] = await commentService.createComment({
            authorUserId: authorId,
            imageId: imageId,
            body: 'Admin delete me'
        });

        // Admin (even if not author) should be able to delete
        // We simulate admin by passing 'admin' role, regardless of userId passed (usually admin's ID)
        const deleted = await commentService.softDeleteComment(comment.id, otherUserId, 'admin'); // user ID is irrelevant for admin
        expect(deleted).toBeDefined();
        expect(deleted![0].deletedAt).not.toBeNull();
    });
});
