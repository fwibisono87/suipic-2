import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientService } from './clientService';

global.fetch = vi.fn();

describe('clientService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.setItem('auth_token', 'test-photographer-token');
    });

    describe('getClients', () => {
        it('should fetch clients with auth header', async () => {
            const mockClients = [{ id: '1', displayName: 'Client 1' }];
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockClients,
            });

            const result = await clientService.getClients();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/photographer/clients'),
                expect.objectContaining({
                     headers: {
                        Authorization: 'Bearer test-photographer-token'
                     }
                })
            );
            expect(result).toEqual(mockClients);
        });
    });
});
