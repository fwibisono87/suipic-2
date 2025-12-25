import { describe, expect, it, beforeAll } from 'bun:test';
import { albumService } from './album';
import { userService } from './user';
import { db } from '../db';
import { albums, albumPhotographers } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('albumService', () => {
    let photographerId: string;
    let clientId: string;

    beforeAll(async () => {
        // Setup a photographer and client
        const photographer = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `photo-${Date.now()}@test.com`,
            role: 'photographer'
        });
        if (!photographer) throw new Error('Failed to create photographer');
        photographerId = photographer.id;

        const client = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `client-${Date.now()}@test.com`,
            role: 'client'
        });
        if (!client) throw new Error('Failed to create client');
        clientId = client.id;
    });

    it('should create an album', async () => {
        const album = await albumService.createAlbum({
            title: 'Test Album',
            description: 'A test album',
            ownerPhotographerId: photographerId
        });

        expect(album).toBeDefined();
        if (!album) return;
        expect(album.title).toBe('Test Album');
        expect(album.ownerPhotographerId).toBe(photographerId);
    });

    it('should get an album by id', async () => {
        const created = await albumService.createAlbum({
            title: 'Fetch Me',
            ownerPhotographerId: photographerId
        });
        if (!created) throw new Error('Failed to create album');

        const fetched = await albumService.getAlbum(created.id);
        expect(fetched).toBeDefined();
        if (!fetched) return;
        expect(fetched.id).toBe(created.id);
    });

    it('should get album for photographer (ownership check)', async () => {
        const created = await albumService.createAlbum({
            title: 'My Album',
            ownerPhotographerId: photographerId
        });
        if (!created) throw new Error('Failed to create album');

        // Should find it with correct ID and owner
        const found = await albumService.getAlbumForPhotographer(created.id, photographerId);
        expect(found).toBeDefined();
        if (!found) return;
        expect(found.id).toBe(created.id);

        // Should NOT find it with other user ID
        const notFound = await albumService.getAlbumForPhotographer(created.id, clientId); // clientId acts as another user
        expect(notFound).toBeUndefined();
    });

    it('should update an album', async () => {
        const created = await albumService.createAlbum({
            title: 'Update Me',
            ownerPhotographerId: photographerId
        });
        if (!created) throw new Error('Failed to create album');

        const updated = await albumService.updateAlbum(created.id, photographerId, {
            title: 'Updated Title'
        });

        expect(updated.title).toBe('Updated Title');
    });

    it('should soft delete an album', async () => {
        const created = await albumService.createAlbum({
            title: 'Delete Me',
            ownerPhotographerId: photographerId
        });
        if (!created) throw new Error('Failed to create album');

        await albumService.deleteAlbum(created.id, photographerId);

        const fetched = await albumService.getAlbum(created.id);
        expect(fetched).toBeUndefined(); // specifically undefined because of isNull(deletedAt) check
    });

    it('should add a client to an album', async () => {
         const album = await albumService.createAlbum({
            title: 'Shared Album',
            ownerPhotographerId: photographerId
        });
        if (!album) throw new Error('Failed to create album');

        const result = await albumService.addClientToAlbum(album.id, clientId);
        expect(result).toBe(true);
        // idempotency check
        const result2 = await albumService.addClientToAlbum(album.id, clientId);
        expect(result2).toBe(true);
    });
    
     it('should remove a client from an album', async () => {
         const album = await albumService.createAlbum({
            title: 'Unshared Album',
            ownerPhotographerId: photographerId
        });
        if (!album) throw new Error('Failed to create album');
        await albumService.addClientToAlbum(album.id, clientId);

        const result = await albumService.removeClientFromAlbum(album.id, clientId);
        expect(result).toBe(true);
    });

    it('should list albums for a photographer', async () => {
        const list = await albumService.listAlbumsForPhotographer(photographerId);
        expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it('should list albums for a client', async () => {
        const album = await albumService.createAlbum({
           title: 'Client Album',
           ownerPhotographerId: photographerId
       });
       await albumService.addClientToAlbum(album.id, clientId);
       if (!album) throw new Error('Album not created');

       const list = await albumService.listAlbumsForClient(clientId);
       expect(list.length).toBeGreaterThanOrEqual(1);
       if (!album) throw new Error('Album not created');
       expect(list.some(a => a.id === album.id)).toBe(true);
   });

   it('should get album for photographer (collaborator check)', async () => {
       // Create another photographer
       const collaborator = await userService.createProfile({
           keycloakId: crypto.randomUUID(),
           email: `collab-${Date.now()}@test.com`,
           role: 'photographer'
       });
       const collabId = collaborator!.id;

       const album = await albumService.createAlbum({
           title: 'Collab Album',
           ownerPhotographerId: photographerId
       });

       // Manually add as collaborator
       await db.insert(albumPhotographers).values({
           albumId: album.id,
           photographerId: collabId
       });

       // Should find it
       const found = await albumService.getAlbumForPhotographer(album.id, collabId);
       expect(found).toBeDefined();
       expect(found!.id).toBe(album.id);
   });

   it('should get album for client', async () => {
       const album = await albumService.createAlbum({
           title: 'Client View Album',
           ownerPhotographerId: photographerId
       });
       await albumService.addClientToAlbum(album.id, clientId);

       const found = await albumService.getAlbumForClient(album.id, clientId);
       expect(found).toBeDefined();
       expect(found!.id).toBe(album.id);
       
       // Unauthorized client
       const other = await userService.createProfile({
            keycloakId: crypto.randomUUID(),
            email: `other-client-${Date.now()}@test.com`,
            role: 'client'
       });
       const notFound = await albumService.getAlbumForClient(album.id, other!.id);
       expect(notFound).toBeNull();
   });
});
