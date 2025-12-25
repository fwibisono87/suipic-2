import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithAuth, fetchCurrentUser } from './auth';

global.fetch = vi.fn();

describe('auth service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.clear();
    });

    describe('fetchWithAuth', () => {
        it('should include bearer token if available', async () => {
            localStorage.setItem('auth_token', 'my-token');
            (global.fetch as any).mockResolvedValue({ ok: true });

            await fetchWithAuth('/api/test');

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/test',
                expect.objectContaining({
                    headers: {
                        'Authorization': 'Bearer my-token'
                    }
                })
            );
        });

        it('should not include bearer token if missing', async () => {
            (global.fetch as any).mockResolvedValue({ ok: true });

            await fetchWithAuth('/api/test');

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/test',
                expect.objectContaining({
                    headers: {}
                })
            );
        });

        it('should merge custom headers', async () => {
            localStorage.setItem('auth_token', 'token');
            (global.fetch as any).mockResolvedValue({ ok: true });

            await fetchWithAuth('/api/test', {
                headers: { 'X-Custom': 'Value' }
            });

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/test',
                expect.objectContaining({
                    headers: {
                        'Authorization': 'Bearer token',
                        'X-Custom': 'Value'
                    }
                })
            );
        });

        it('should handle removeItem (coverage check)', () => {
            localStorage.setItem('test', 'val');
            localStorage.removeItem('test');
            expect(localStorage.getItem('test')).toBeNull();
        });
    });

    describe('fetchCurrentUser', () => {
        it('should fetch user successfully', async () => {
            const user = { id: '1', email: 'test@test.com' };
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => user
            });

            const result = await fetchCurrentUser();
            expect(result).toEqual(user);
        });

        it('should throw error on failure', async () => {
            (global.fetch as any).mockResolvedValue({ ok: false });
            await expect(fetchCurrentUser()).rejects.toThrow('Failed to fetch user');
        });
    });
});
