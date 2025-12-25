import { db } from '../db';
import { albums, albumClients, userProfiles, albumPhotographers } from '../db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

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
        const album = await db.query.albums.findFirst({
            where: and(
                eq(albums.id, id), 
                isNull(albums.deletedAt)
            ),
            with: {
                clients: {
                    with: {
                        client: true
                    }
                }
            }
        });

        if (!album) return undefined;

        // 1. Owner check
        if (album.ownerPhotographerId === photographerId) return album;

        // 2. Collaborator check
        const [collaboration] = await db.select({ empty: sql`1` })
            .from(albumPhotographers)
            .where(and(
                eq(albumPhotographers.albumId, id),
                eq(albumPhotographers.photographerId, photographerId)
            ));
        
        if (collaboration) return album;

        return undefined;
    },

    async updateAlbum(id: string, photographerId: string, data: { title?: string; description?: string }) {
        const [updated] = await db.update(albums)
            .set({ ...data, modifiedAt: new Date() })
            .where(and(eq(albums.id, id), eq(albums.ownerPhotographerId, photographerId)))
            .returning();
        return updated;
    },

    async deleteAlbum(id: string, photographerId: string) {
        const [deleted] = await db.update(albums)
            .set({ deletedAt: new Date() })
            .where(and(eq(albums.id, id), eq(albums.ownerPhotographerId, photographerId)))
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
    },

    async getAlbumForClient(albumId: string, clientId: string) {
        // Verify via join
        const result = await db.select({ id: albums.id })
            .from(albums)
            .innerJoin(albumClients, eq(albums.id, albumClients.albumId))
            .where(and(
                eq(albums.id, albumId), 
                eq(albumClients.clientId, clientId),
                isNull(albums.deletedAt)
            ))
            .limit(1);
        
        return result[0] || null;
    }
};
