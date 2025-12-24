import { db } from '../db';
import { albums, albumClients, userProfiles } from '../db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const albumService = {
    async createAlbum(data: {
        title: string;
        description?: string;
        ownerPhotographerId: string;
    }) {
        const [album] = await db.insert(albums).values({
            ...data,
            description: data.description ?? null,
        }).returning();
        return album;
    },

    async getAlbum(id: string) {
        return db.query.albums.findFirst({
            where: and(eq(albums.id, id), isNull(albums.deletedAt)),
            with: {
                // Return simple relation for now if needed, but strict check below is better
            }
        });
    },

    async getAlbumForPhotographer(id: string, photographerId: string) {
        return db.query.albums.findFirst({
            where: and(
                eq(albums.id, id), 
                eq(albums.ownerPhotographerId, photographerId),
                isNull(albums.deletedAt)
            )
        });
    },

    async updateAlbum(id: string, data: { title?: string; description?: string }) {
        const [updated] = await db.update(albums)
            .set({ ...data, modifiedAt: new Date() })
            .where(eq(albums.id, id))
            .returning();
        return updated;
    },

    async softDeleteAlbum(id: string) {
        const [deleted] = await db.update(albums)
            .set({ deletedAt: new Date() })
            .where(eq(albums.id, id))
            .returning();
        return deleted;
    },

    async addClientToAlbum(albumId: string, clientId: string) {
        // Verify client exists and is a client role? logic app level
        await db.insert(albumClients).values({
            albumId,
            clientId
        }).onConflictDoNothing(); // Idempotent
        return true;
    },
    
    async removeClientFromAlbum(albumId: string, clientId: string) {
        await db.delete(albumClients)
            .where(and(eq(albumClients.albumId, albumId), eq(albumClients.clientId, clientId)));
        return true;
    },

    async listAlbumsForPhotographer(photographerId: string) {
        return db.query.albums.findMany({
            where: and(eq(albums.ownerPhotographerId, photographerId), isNull(albums.deletedAt)),
            orderBy: (albums, { desc }) => [desc(albums.createdAt)]
        });
    },

    async listAlbumsForClient(clientId: string) {
        return db.select({
            id: albums.id,
            title: albums.title,
            description: albums.description,
            ownerPhotographerId: albums.ownerPhotographerId,
            createdAt: albums.createdAt,
            modifiedAt: albums.modifiedAt
        })
        .from(albums)
        .innerJoin(albumClients, eq(albums.id, albumClients.albumId))
        .where(and(eq(albumClients.clientId, clientId), isNull(albums.deletedAt)))
        // @ts-ignore
        .orderBy((t) => desc(t.createdAt)); 
    }
};
