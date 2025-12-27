import { describe, expect, it } from 'bun:test';
import { userService } from './user';

describe('userService', () => {
    it('should create a photographer profile', async () => {
        const keycloakId = crypto.randomUUID();
        const email = `test-photo-${Date.now()}@example.com`;
        
        const profile = await userService.createProfile({
            keycloakId,
            email,
            role: 'photographer'
        });

        expect(profile).toBeDefined();
        if (!profile) return;
        expect(profile.keycloakId).toBe(keycloakId);
        expect(profile.email).toBe(email);
        expect(profile.role).toBe('photographer');
    });

    it('should create a client profile linked to a photographer', async () => {
        // Create photographer first
        const pKey = crypto.randomUUID();
        const photo = await userService.createProfile({
            keycloakId: pKey,
            email: `p-${Date.now()}@example.com`,
            role: 'photographer'
        });
        if (!photo) throw new Error('Failed to create photographer');

        const clientKey = crypto.randomUUID();
        const client = await userService.createProfile({
            keycloakId: clientKey,
            email: `c-${Date.now()}@example.com`,
            role: 'client',
            photographerId: photo.id
        });

        expect(client).toBeDefined();
        expect(client!.photographerId).toBe(photo.id);
    });

    it('should get profile by keycloak id', async () => {
         const key = crypto.randomUUID();
         const email = `findme-${Date.now()}@example.com`;
         await userService.createProfile({ keycloakId: key, email, role: 'photographer' });

         const found = await userService.getProfileByKeycloakId(key);
         expect(found).toBeDefined();
         expect(found!.email).toBe(email);
    });

    it('should list photographers', async () => {
        const photographers = await userService.listPhotographers();
        expect(Array.isArray(photographers)).toBe(true);
        // We just created some, so length should be > 0
        expect(photographers.length).toBeGreaterThan(0);
        expect(photographers.every(p => p.role === 'photographer')).toBe(true);
    });

    it('should list clients for a photographer', async () => {
        const p = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `p-list-${Date.now()}@ex.com`,
            role: 'photographer'
        });
        if (!p) throw new Error('No photo');

        await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `c-list-${Date.now()}@ex.com`,
            role: 'client',
            photographerId: p.id
        });

        const clients = await userService.listClientsForPhotographer(p.id);
        expect(clients.length).toBeGreaterThanOrEqual(1);
        expect(clients[0].photographerId).toBe(p.id);
    });

    it('should list all users', async () => {
        const users = await userService.listAllUsers();
        expect(users.length).toBeGreaterThan(0);
    });

    it('should update user status', async () => {
        const user = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `status-${Date.now()}@ex.com`,
            role: 'client'
        });
        if (!user) throw new Error("no user");

        const updated = await userService.setUserStatus(user.id, false);
        expect(updated.isActive).toBe(false);

        const updated2 = await userService.setUserStatus(user.id, true);
        expect(updated2.isActive).toBe(true);
    });
});
