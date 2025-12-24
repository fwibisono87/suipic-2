import { describe, expect, it, beforeAll } from 'bun:test';
import { userService } from './user';
import { db } from '../db';
import { userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('userService', () => {
    const testKeycloakId = '00000000-0000-0000-0000-000000000001';
    const testEmail = 'test@suipic.test';

    beforeAll(async () => {
        // Cleanup test data if it exists
        const clientEmail = 'client@suipic.test';
        await db.delete(userProfiles).where(eq(userProfiles.email, clientEmail));
        await db.delete(userProfiles).where(eq(userProfiles.email, testEmail));
    });

    it('should create a photographer profile', async () => {
        const profile = await userService.createProfile({
            keycloakId: testKeycloakId,
            email: testEmail,
            displayName: 'Test Photographer',
            role: 'photographer'
        });

        expect(profile).toBeDefined();
        if (!profile) return;
        expect(profile.email).toBe(testEmail);
        expect(profile.role).toBe('photographer');
        expect(profile.displayName).toBe('Test Photographer');
    });

    it('should find a profile by keycloakId', async () => {
        const profile = await userService.getProfileByKeycloakId(testKeycloakId);
        expect(profile).toBeDefined();
        expect(profile?.email).toBe(testEmail);
    });

    it('should list photographers', async () => {
        const photographers = await userService.listPhotographers();
        expect(photographers.length).toBeGreaterThan(0);
        expect(photographers.some(p => p.email === testEmail)).toBe(true);
    });

    it('should create a client for a photographer', async () => {
        const photographer = await userService.getProfileByKeycloakId(testKeycloakId);
        expect(photographer).toBeDefined();

        const clientEmail = 'client@suipic.test';
        await db.delete(userProfiles).where(eq(userProfiles.email, clientEmail));

        const client = await userService.createProfile({
            keycloakId: '00000000-0000-0000-0000-000000000002',
            email: clientEmail,
            role: 'client',
            photographerId: photographer!.id
        });

        expect(client).toBeDefined();
        if (!client) return;
        expect(client.role).toBe('client');
        expect(client.photographerId).toBe(photographer!.id);
    });

    it('should list clients for a photographer', async () => {
        const photographer = await userService.getProfileByKeycloakId(testKeycloakId);
        expect(photographer).toBeDefined();

        const clients = await userService.listClientsForPhotographer(photographer!.id);
        expect(clients.length).toBeGreaterThan(0);
        expect(clients[0].role).toBe('client');
    });
});
