import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commentService } from './commentService';

global.fetch = vi.fn();

describe('commentService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.setItem('auth_token', 'token');
    });

    it('should create comment', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ id: '1', body: 'Nice!' })
        });

        await commentService.createComment({ imageId: 'img-1', body: 'Nice!' });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/comments'),
            expect.objectContaining({ 
                method: 'POST',
                 body: JSON.stringify({ imageId: 'img-1', body: 'Nice!' })
            })
        );
    });

    it('should throw error on createComment failure', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false });
        await expect(commentService.createComment({ imageId: 'img-1', body: 'Hi' })).rejects.toThrow('Failed to post comment');
    });

    it('should get comments for image', async () => {
         const comments = [{ id: '1', body: 'Hi' }];
         (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => comments
        });

        const result = await commentService.getCommentsForImage('img-1');
        expect(result).toEqual(comments);
    });

    it('should throw error on getCommentsForImage failure', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false });
        await expect(commentService.getCommentsForImage('img-1')).rejects.toThrow('Failed to fetch comments');
    });

    describe('deleteComment', () => {
        it('should delete comment', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            });

            const result = await commentService.deleteComment('1');
            expect(result).toEqual({ success: true });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/comments/1'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });

        it('should throw error on delete failure', async () => {
            (global.fetch as any).mockResolvedValue({ ok: false });
            await expect(commentService.deleteComment('1')).rejects.toThrow('Failed to delete comment');
        });
    });
});
