import { db } from '../db';
import { userProfiles } from '../db/schema';
import type { UserRole } from '../db/schema';
import { eq } from 'drizzle-orm';

export const userService = {
    async createProfile(data: {
        keycloakId: string;
        email: string;
        displayName?: string;
        role: UserRole;
        photographerId?: string;
    }) {
        const { displayName, ...rest } = data;
        const [profile] = await db.insert(userProfiles).values({
            ...rest,
            displayName: displayName ?? data.email.split('@')[0],
        }).returning();
        return profile;
    },

    async getProfileByKeycloakId(keycloakId: string) {
        return db.query.userProfiles.findFirst({
            where: eq(userProfiles.keycloakId, keycloakId),
        });
    },

    async listPhotographers() {
        return db.query.userProfiles.findMany({
            where: eq(userProfiles.role, 'photographer'),
        });
    },

    async listClientsForPhotographer(photographerId: string) {
        return db.query.userProfiles.findMany({
            where: eq(userProfiles.photographerId, photographerId),
        });
    }
};
