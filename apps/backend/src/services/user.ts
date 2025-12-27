import { db } from '../db';
import { userProfiles } from '../db/schema';
import type { TUserRole } from '../db/schema';
import { eq } from 'drizzle-orm';

export const userService = {
    async createProfile(data: {
        keycloakId: string;
        email: string;
        displayName?: string;
        role: TUserRole;
        photographerId?: string;
    }) {
        const { displayName, ...rest } = data;
        const [profile] = await db.insert(userProfiles).values({
            keycloakId: data.keycloakId,
            email: data.email,
            role: data.role,
            photographerId: data.photographerId || null,
            displayName: data.displayName ?? data.email.split('@')[0],
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
    },

    async listAllUsers() {
        return db.query.userProfiles.findMany({
            orderBy: (userProfiles, { desc }) => [desc(userProfiles.createdAt)],
        });
    },

    async setUserStatus(id: string, isActive: boolean) {
        const [updated] = await db.update(userProfiles)
            .set({ isActive, modifiedAt: new Date() })
            .where(eq(userProfiles.id, id))
            .returning();
        return updated;
    }
};
