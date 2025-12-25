import { describe, it, expect, vi, beforeEach } from 'vitest';
import { albumService } from './albumService';

global.fetch = vi.fn();

describe('albumService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.setItem('auth_token', 'test-photographer-token');
    });

    describe('getAlbums', () => {
        it('should fetch albums with auth header', async () => {
            const mockAlbums = [{ id: '1', title: 'Album 1' }];
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockAlbums,
            });

            const result = await albumService.getAlbums();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/photographer/albums'),
                expect.objectContaining({
                     headers: {
                        Authorization: 'Bearer test-photographer-token'
                     }
                })
            );
            expect(result).toEqual(mockAlbums);
        });
    });

    describe('createAlbum', () => {
        it('should create album', async () => {
            const newAlbum = { title: 'New Album' };
            const mockResponse = { id: '1', ...newAlbum };
            
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await albumService.createAlbum(newAlbum);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/photographer/albums'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(newAlbum)
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getAlbum', () => {
        it('should get album by id', async () => {
            const mockAlbum = { id: '1', title: 'Album 1' };
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockAlbum,
            });

            const result = await albumService.getAlbum('1');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/photographer/albums/1'),
                expect.objectContaining({
                     headers: expect.objectContaining({ Authorization: 'Bearer test-photographer-token' })
                })
            );
            expect(result).toEqual(mockAlbum);
        });

        it('should throw error on fail', async () => {
             (global.fetch as any).mockResolvedValue({ ok: false });
             await expect(albumService.getAlbum('1')).rejects.toThrow('Failed to fetch album');
        });
    });

    describe('updateAlbum', () => {
        it('should update album', async () => {
            const updateData = { title: 'Updated' };
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: '1', ...updateData }),
            });

            const result = await albumService.updateAlbum('1', updateData);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/photographer/albums/1'),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                })
            );
            expect(result.title).toBe('Updated');
        });

        it('should throw error on fail', async () => {
             (global.fetch as any).mockResolvedValue({ ok: false });
             await expect(albumService.updateAlbum('1', {})).rejects.toThrow('Failed to update album');
        });
    });

    describe('deleteAlbum', () => {
        it('should delete album', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            const result = await albumService.deleteAlbum('1');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/photographer/albums/1'),
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
            expect(result).toEqual({ success: true });
        });
        
        it('should throw error on fail', async () => {
             (global.fetch as any).mockResolvedValue({ ok: false });
             await expect(albumService.deleteAlbum('1')).rejects.toThrow('Failed to delete album');
        });
    });
});
