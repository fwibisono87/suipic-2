import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageService } from './imageService';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('imageService', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        // localStorage is mocked globally in setupTests, verify clearing if needed
        (localStorage.clear as any).mockClear();
    });

    it('getImages should fetch images with token', async () => {
        localStorage.setItem('auth_token', 'test-token');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: '1', filename: 'test.jpg' }]
        });

        const result = await imageService.getImages('album-1');

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/photographer/albums/album-1/images',
            expect.objectContaining({
                headers: { 'Authorization': 'Bearer test-token' }
            })
        );
        expect(result).toEqual([{ id: '1', filename: 'test.jpg' }]);
    });

    it('getImages should throw error on failure', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });
        await expect(imageService.getImages('album-1')).rejects.toThrow('Failed to fetch images');
    });

    it('uploadImage should upload file via FormData', async () => {
        localStorage.setItem('auth_token', 'test-token');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: '1', status: 'processing' })
        });

        const file = new File(['content'], 'test.png', { type: 'image/png' });
        const result = await imageService.uploadImage('album-1', file);

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/photographer/albums/album-1/images',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Authorization': 'Bearer test-token' },
                body: expect.any(FormData)
            })
        );
        expect(result).toEqual({ id: '1', status: 'processing' });
    });
    describe('getImage', () => {
        it('should fetch single image for photographer', async () => {
            const mockImage = { id: 'img-1', filename: 'test.jpg' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockImage
            });

            const result = await imageService.getImage('album-1', 'img-1');
            expect(result).toEqual(mockImage);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:4000/api/photographer/albums/album-1/images/img-1',
                expect.anything()
            );
        });

        it('should fetch single image for client', async () => {
            const mockImage = { id: 'img-1', filename: 'test.jpg' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockImage
            });

            const result = await imageService.getImage('album-1', 'img-1', 'client');
            expect(result).toEqual(mockImage);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:4000/api/client/albums/album-1/images/img-1',
                expect.anything()
            );
        });

        it('should throw error on failure', async () => {
            mockFetch.mockResolvedValueOnce({ ok: false });
            await expect(imageService.getImage('album-1', 'img-1')).rejects.toThrow('Failed to fetch image');
        });
    });

    it('uploadImage should throw error on failure', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });
        const file = new File([''], 'test.png');
        await expect(imageService.uploadImage('album-1', file)).rejects.toThrow('Failed to upload image');
    });

    it('getImages should use client path if role is client', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
        await imageService.getImages('album-1', 'client');
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/client/albums/album-1/images',
            expect.anything()
        );
    });
});
