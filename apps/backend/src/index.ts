import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { bootstrap } from './db/bootstrap'
import { storage } from './services/storage';
import { userService } from './services/user'
import { albumService } from './services/album'
import { imageService } from './services/image'
import { feedbackService } from './services/feedback';
import { commentService } from './services/comment';
import { cleanupService } from './services/cleanup';

import { comments } from './db/schema';
import { dashboardService } from './services/dashboard';

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
            .get('/users/me', (({ user }: { user: any }) => {
                return user;
            }) as any, {
                requireAuth: ['admin', 'photographer', 'client']
            })
            .group('/admin', (admin) => 
                admin
                    .post('/photographers', (async ({ body, user }: { body: { keycloakId: string; email: string; displayName?: string }, user: any }) => {
                        // 1. Create in Keycloak
                        // const keycloakId = await keycloakService.createPhotographer(body.email, body.displayName);
                        return userService.createProfile({
                            ...body,
                            role: 'photographer'
                        });
                    }) as any, {
                        requireAuth: ['admin'],
                        body: 'user.create'
                    })
                    .get('/photographers', (async ({ user }: { user: any }) => {
                        return userService.listPhotographers();
                    }) as any, {
                        requireAuth: ['admin']
                    })
                    .post('/maintenance/cleanup', async () => {
                        return cleanupService.cleanupStuckProcessing();
                    }, {
                        requireAuth: ['admin']
                    })
            )
            .group('/photographer', (photo) => 
                photo
                    .post('/clients', (async ({ body, user }: { body: { keycloakId: string; email: string; displayName?: string }, user: any }) => {
                        return userService.createProfile({
                            ...body,
                            role: 'client',
                            photographerId: user.id
                        });
                    }) as any, {
                        requireAuth: ['photographer'],
                        body: 'user.create'
                    })
                    .get('/clients', (async ({ user }: { user: any }) => {
                        return userService.listClientsForPhotographer(user.id);
                    }) as any, {
                        requireAuth: ['photographer']
                    })
                    // Album Routes
                    .post('/albums', async ({ body, user }: { body: { title: string, description?: string }, user: any }) => {
                        return albumService.createAlbum({
                            ...body,
                            ownerPhotographerId: user.id
                        });
                    }, {
                        requireAuth: ['photographer'],
                        body: 'album.create'
                    })
                    .get('/albums', async ({ user }: { user: any }) => {
                        return albumService.listAlbumsForPhotographer(user.id);
                    }, {
                        requireAuth: ['photographer']
                    })
                    .get('/albums/:id', (async ({ params: { id }, user, error }: { params: { id: string }, user: any, error: any }) => {
                        const album = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!album) return error(404, 'Album not found');
                        return album;
                    }) as any, {
                        requireAuth: ['photographer']
                    })
                    .patch('/albums/:id', (async ({ params: { id }, body, user, error }: { params: { id: string }, body: any, user: any, error: any }) => {
                        const album = await albumService.updateAlbum(id, user.id, body as any);
                        if (!album) return error(404, 'Album not found');
                        return album;
                    }) as any, {
                        requireAuth: ['photographer']
                    })
                    .put('/albums/:id', (async ({ params: { id }, body, user, error }: { params: { id: string }, body: any, user: any, error: any }) => {
                        const existing = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!existing) return error(404, 'Album not found');
                        
                        const album = await albumService.updateAlbum(id, user.id, body as any);
                        return album;
                    }) as any, {   requireAuth: ['photographer'],
                        body: 'album.update'
                    })
                    .delete('/albums/:id', (async ({ params: { id }, user, error }: { params: { id: string }, user: any, error: any }) => {
                        const deleted = await albumService.deleteAlbum(id, user.id);
                        if (!deleted) return error(404, 'Album not found');
                        return { success: true };
                    }) as any, { requireAuth: ['photographer']
                    })
                    .post('/albums/:id/clients', (async ({ params: { id }, body, user, error }: { params: { id: string }, body: { clientId: string }, user: any, error: any }) => {
                        const existing = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!existing) return error(404, 'Album not found');
                        // Validation of client ID/role could be here, but assume valid ID
                        await albumService.addClientToAlbum(id, body.clientId);
                        return { success: true };
                    }) as any, {
                        requireAuth: ['photographer'],
                        body: t.Object({ clientId: t.String() })
                    })
                    .delete('/albums/:id/clients/:clientId', async ({ params: { id, clientId }, user, error }: { params: { id: string, clientId: string }, user: any, error: any }) => {
                         const existing = await albumService.getAlbumForPhotographer(id, user.id);
                         if (!existing) return error(404, 'Album not found');
                         await albumService.removeClientFromAlbum(id, clientId);
                         return { success: true };
                    }) as any, {
                        requireAuth: ['photographer']
                    })
                    // Image Routes
                    .post('/albums/:id/images', (async ({ params: { id }, body: { file }, user, error, set }: { params: { id: string }, body: { file: File }, user: any, error: any, set: any }) => {
                         // 1. Verify access
                         const album = await albumService.getAlbumForPhotographer(id, user.id);
                         if (!album) return error(404, 'Album not found');
                         
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
                    }) as any, {
                        requireAuth: ['photographer'],
                        body: t.Object({
                            file: t.File()
                        })
                    })
                    .get('/albums/:id/images', (async ({ params: { id }, user, error }: { params: { id: string }, user: any, error: any }) => {
                        const existing = await albumService.getAlbumForPhotographer(id, user.id);
                        if (!existing) return error(404, 'Album not found');
                        
                        return imageService.getImagesForAlbum(id);
                    }) as any, {
                        requireAuth: ['photographer']
                    })
                    // Dashboard Routes
                    .get('/dashboard/stats', (async ({ user }: { user: any }) => {
                        return dashboardService.getPhotographerStats(user.id);
                    }) as any, {
                        requireAuth: ['photographer']
                    })
                    .get('/dashboard/activity', (async ({ user }: { user: any }) => {
                        return dashboardService.getRecentActivity(user.id);
                    }) as any, {
                        requireAuth: ['photographer']
                    })
            )
            // @ts-ignore
    .derive(({ cookie, jwt, headers }: { cookie: any, jwt: any, headers: any }) => authPlugin({ cookie, jwt, headers }))
    .get("/api/me", async ({ user }: { user: any }) => {
        if (!user) return { error: "Not logged in" };
        return {
            id: user.id || user.sub,
            email: user.email,
            role: user.realm_access?.roles.includes("app-admin") ? "admin" : "photographer"
        };
    })
            .group('/client', (client) => 
                client
                    .get('/albums', (async ({ user }: { user: any }) => {
                        return await albumService.listAlbumsForClient(user.id);
                    }) as any, {
                         requireAuth: ['client']
                    })
                    .get('/albums/:id/images', (async ({ params: { id }, user, error }: { params: { id: string }, user: any, error: any }) => {
                        const allowed = await albumService.getAlbumForClient(id, user.id);
                        
                        return imageService.getImagesForAlbum(id);
                    }) as any, {
                        requireAuth: ['client']
                    })
                    .get('/albums/:id/images/:imageId', (async ({ params: { id, imageId }, user, error }: { params: { id: string, imageId: string }, user: any, error: any }) => {
                        const allowed = await albumService.getAlbumForClient(id, user.id);
                        if (!allowed) return error(404, 'Album not found');

                        const image = await imageService.getImage(imageId);
                        
                        return image;
                    }) as any, {
                        requireAuth: ['client']
                    })
            )
            .group('/feedback', (app) => 
                app.post('/images/:id', (async ({ params: { id }, body, user }: { params: { id: string }, body: any, user: any }) => {
                    return feedbackService.upsertFeedback(id, user.id, body);
                }) as any, {
                    requireAuth: ['client'],
                    body: t.Object({
                        flag: t.Optional(t.Union([t.Literal('pick'), t.Literal('reject')])),
                        rating: t.Optional(t.Integer({ min: 1, max: 5 }))
                    })
                })
                .get('/images/:id', (async ({ params: { id }, user }: { params: { id: string }, user: any }) => {
                    return feedbackService.getFeedbackForImage(id, user.id);
                }) as any, {
                    requireAuth: ['client']
                })
            )
            .group('/comments', (app) =>
                app.post('/', (async ({ body, user }: { body: any, user: any }) => {
                     return commentService.createComment({
                         ...body,
                         authorUserId: user.id
                     });
                }) as any, {
                    requireAuth: ['client', 'photographer'],
                    body: t.Object({
                        albumId: t.Optional(t.String()),
                        imageId: t.Optional(t.String()),
                        body: t.String(),
                        parentCommentId: t.Optional(t.String())
                    })
                })
                .get('/images/:id', (async ({ params: { id } }: { params: { id: string } }) => {
                    return commentService.getCommentsForImage(id);
                }) as any, {
                    requireAuth: ['client', 'photographer']
                })
                .delete('/:id', (async ({ params: { id }, user }: { params: { id: string }, user: any }) => {
                    const isAdmin = user.roles.includes('app-admin');
                    const role = isAdmin ? 'admin' : 'user'; 
                    return commentService.softDeleteComment(id, user.id, role);
                }) as any, {
                     requireAuth: ['client', 'photographer', 'admin']
                })
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
    requireAuth: ['admin'],
    body: t.Object({
        file: t.File()
    })
});

await bootstrap();

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)