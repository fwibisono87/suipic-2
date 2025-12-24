import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { bootstrap } from './db/bootstrap'
import { storage } from './services/storage';
import { userService } from './services/user'
import { albumService } from './services/album'
import { imageService } from './services/image'

import { authPlugin } from './auth'

const app = new Elysia()
    .use(cors())
    .use(swagger())
    .model({
        'user.create': t.Object({
            keycloakId: t.String({ format: 'uuid' }),
            email: t.String({ format: 'email' }),
            displayName: t.Optional(t.String()),
        }),
        'album.create': t.Object({
            title: t.String({ minLength: 1 }),
            description: t.Optional(t.String())
        }),
        'album.update': t.Object({
            title: t.Optional(t.String({ minLength: 1 })),
            description: t.Optional(t.String())
        })
    })
    .use(authPlugin)
    .get('/', () => 'SuiPic API')
    .get('/health', () => ({ status: 'ok' }))
    .group('/api', (app) =>
        app
            .get('/protected', () => 'Access Granted', {
                requireAuth: ['admin', 'photographer', 'client'],
            })
            .group('/admin', (admin) => 
                admin
                    .post('/photographers', async ({ body }) => {
                        return userService.createProfile({
                            ...body,
                            role: 'photographer'
                        });
                    }, {
                        requireAuth: ['admin'],
                        body: 'user.create'
                    })
                    .get('/photographers', async () => {
                        return userService.listPhotographers();
                    }, {
                        requireAuth: ['admin']
                    })
            )
            .group('/photographer', (photo) => 
                photo
                    .post('/clients', async ({ body, user }) => {
                        return userService.createProfile({
                            ...body,
                            role: 'client',
                            photographerId: user.id
                        });
                    }, {
                        requireAuth: ['photographer'],
                        body: 'user.create'
                    })
                    .get('/clients', async ({ user }) => {
                        return userService.listClientsForPhotographer(user.id);
                    }, {
                        requireAuth: ['photographer']
                    })
                    // Album Routes
                    .post('/albums', async ({ body, user }) => {
                        return albumService.createAlbum({
                            ...body,
                            ownerPhotographerId: user.id
                        });
                    }, {
                        requireAuth: ['photographer'],
                        body: 'album.create'
                    })
                    .get('/albums', async ({ user }) => {
                        return albumService.listAlbumsForPhotographer(user.id);
                    }, {
                        requireAuth: ['photographer']
                    })
                    .get('/albums/:id', async ({ params: { id }, user, error }) => {
                        const album = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!album) return error(404, 'Album not found');
                        return album;
                    }, {
                        requireAuth: ['photographer']
                    })
                    .put('/albums/:id', async ({ params: { id }, body, user, error }) => {
                        const existing = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!existing) return error(404, 'Album not found');
                        return albumService.updateAlbum(id, body);
                    }, {
                        requireAuth: ['photographer'],
                        body: 'album.update'
                    })
                    .delete('/albums/:id', async ({ params: { id }, user, error }) => {
                        const existing = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!existing) return error(404, 'Album not found');
                        return albumService.softDeleteAlbum(id);
                    }, {
                        requireAuth: ['photographer']
                    })
                    .post('/albums/:id/clients', async ({ params: { id }, body, user, error }) => {
                        const existing = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!existing) return error(404, 'Album not found');
                        // Validation of client ID/role could be here, but assume valid ID
                        await albumService.addClientToAlbum(id, body.clientId);
                        return { success: true };
                    }, {
                        requireAuth: ['photographer'],
                        body: t.Object({ clientId: t.String() })
                    })
                    .delete('/albums/:id/clients/:clientId', async ({ params: { id, clientId }, user, error }) => {
                         const existing = await albumService.getAlbumForPhotographer(id, user.id);
                         if (!existing) return error(404, 'Album not found');
                         await albumService.removeClientFromAlbum(id, clientId);
                         return { success: true };
                    }, {
                        requireAuth: ['photographer']
                    })
                    // Image Routes
                    .post('/albums/:id/images', async ({ params: { id }, body, user, error, set }) => {
                         const existing = await albumService.getAlbumForPhotographer(id, user.id);
                         if (!existing) return error(404, 'Album not found');
                         
                         const file = body.file as File;
                         if (!file) return error(400, 'No file uploaded');

                         // Convert to buffer for processing
                         const arrayBuffer = await file.arrayBuffer();
                         const buffer = Buffer.from(arrayBuffer);

                         // Process 
                         try {
                            const image = await imageService.processAndStoreImage(id, user.id, buffer, file.name);
                            set.status = 202; // Accepted
                            return image;
                         } catch (e) {
                            return error(500, 'Image processing failed');
                         }
                    }, {
                        requireAuth: ['photographer'],
                        body: t.Object({
                            file: t.File()
                        })
                    })
                    .get('/albums/:id/images', async ({ params: { id }, user, error }) => {
                        const existing = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!existing) return error(404, 'Album not found');
                        
                        return imageService.getImagesForAlbum(id);
                    }, {
                        requireAuth: ['photographer']
                    })
            )
            .group('/client', (client) =>
                client
                    .get('/albums', async ({ user }) => {
                        return albumService.listAlbumsForClient(user.id);
                    }, {
                        requireAuth: ['client']
                    })
            )
    )
    .listen(4000)

// Temporary Upload Test Route
app.post('/test/upload', async ({ body, set }) => {
    const file = body.file as File;
    if (!file) {
        set.status = 400;
        return 'No file uploaded';
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = `uploads/${Date.now()}-${file.name}`;
    
    try {
        await storage.uploadFile(key, buffer, file.type);
        const url = await storage.getSignedUrl(key);
        return { success: true, key, url };
    } catch (err) {
        set.status = 500;
        return { success: false, error: String(err) };
    }
}, {
    body: t.Object({
        file: t.File()
    })
});

await bootstrap();

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)