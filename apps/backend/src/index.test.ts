import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';

describe('SuiPic API', () => {
    it('should return health status', async () => {
        const app = new Elysia().get('/health', () => ({ status: 'ok' }));
        const response = await app.handle(
            new Request('http://localhost/health')
        ).then(res => res.json());

        expect(response).toEqual({ status: 'ok' });
    });
});
