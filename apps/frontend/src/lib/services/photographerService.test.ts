import { describe, it, expect, vi, beforeEach } from 'vitest';
import { photographerService } from './photographerService';

global.fetch = vi.fn();

describe('photographerService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.setItem('auth_token', 'test-admin-token');
    });

    describe('getPhotographers', () => {
        it('should fetch photographers with auth header', async () => {
            const mockPhotographers = [{ id: '1', displayName: 'Photo 1' }];
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockPhotographers,
            });

            const result = await photographerService.getPhotographers();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/admin/photographers'),
                expect.objectContaining({
                    headers: {
                        Authorization: 'Bearer test-admin-token'
                    }
                })
            );
            expect(result).toEqual(mockPhotographers);
        });

        it('should throw error on failed fetch', async () => {
             (global.fetch as any).mockResolvedValue({
                ok: false,
                statusText: 'Forbidden'
            });

            await expect(photographerService.getPhotographers()).rejects.toThrow('Failed to fetch photographers');
        });
    });

    describe('createPhotographer', () => {
        it('should create photographer with correct data', async () => {
            const newPhotographer = { keycloakId: 'uuid', email: 'test@test.com', displayName: 'Test' };
            const mockResponse = { id: '1', ...newPhotographer };
            
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await photographerService.createPhotographer(newPhotographer);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/admin/photographers'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(newPhotographer),
                    headers: expect.objectContaining({
                         Authorization: 'Bearer test-admin-token',
                         'Content-Type': 'application/json'
                    })
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });
});
