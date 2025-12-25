import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedbackService } from './feedbackService';

global.fetch = vi.fn();

describe('feedbackService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.setItem('auth_token', 'token');
    });

    it('should upsert feedback', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ id: '1', flag: 'pick' })
        });

        const result = await feedbackService.upsertFeedback('img-1', { flag: 'pick' });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/feedback/images/img-1'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ flag: 'pick' })
            })
        );
        expect(result).toEqual({ id: '1', flag: 'pick' });
    });
    it('should throw error on upsert failure', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false });
        await expect(feedbackService.upsertFeedback('img-1', { flag: 'pick' })).rejects.toThrow('Failed to submit feedback');
    });

    describe('getFeedbackForImage', () => {
        it('should get feedback', async () => {
            const mockFeedback = { id: '1', flag: 'pick' };
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockFeedback,
            });

            const result = await feedbackService.getFeedbackForImage('img-1');
            expect(result).toEqual(mockFeedback);
        });

        it('should return null on 404', async () => {
            (global.fetch as any).mockResolvedValue({ ok: false, status: 404 });
            const result = await feedbackService.getFeedbackForImage('img-1');
            expect(result).toBeNull();
        });

        it('should throw error on other failures', async () => {
            (global.fetch as any).mockResolvedValue({ ok: false, status: 500 });
            await expect(feedbackService.getFeedbackForImage('img-1')).rejects.toThrow('Failed to fetch feedback');
        });
    });
});
