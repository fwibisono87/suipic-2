import { pgTable, uuid, varchar, timestamp, boolean, integer, jsonb, pgEnum, primaryKey } from 'drizzle-orm/pg-core';

// Enums
export const EUserRole = pgEnum('user_role', ['admin', 'photographer', 'client']);
export type TUserRole = 'admin' | 'photographer' | 'client';
export const EImageStatus = pgEnum('image_status', ['processing', 'ready', 'failed']);
export const EFeedbackFlag = pgEnum('feedback_flag', ['pick', 'reject']);

// Tables
export const userProfiles = pgTable('user_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    keycloakId: uuid('keycloak_id').notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    role: EUserRole('role').notNull(),
    photographerId: uuid('photographer_id').references((): any => userProfiles.id),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    modifiedAt: timestamp('modified_at').notNull().defaultNow(),
});

export const albums = pgTable('albums', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 1000 }),
    ownerPhotographerId: uuid('owner_photographer_id').notNull().references(() => userProfiles.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    modifiedAt: timestamp('modified_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
});

export const albumPhotographers = pgTable('album_photographers', {
    albumId: uuid('album_id').notNull().references(() => albums.id),
    photographerId: uuid('photographer_id').notNull().references(() => userProfiles.id),
}, (t) => ({
    pk: primaryKey({ columns: [t.albumId, t.photographerId] }),
}));

export const albumClients = pgTable('album_clients', {
    albumId: uuid('album_id').notNull().references(() => albums.id),
    clientId: uuid('client_id').notNull().references(() => userProfiles.id),
}, (t) => ({
    pk: primaryKey({ columns: [t.albumId, t.clientId] }),
}));

export const images = pgTable('images', {
    id: uuid('id').primaryKey().defaultRandom(),
    albumId: uuid('album_id').notNull().references(() => albums.id),
    uploaderPhotographerId: uuid('uploader_photographer_id').notNull().references(() => userProfiles.id),
    filename: varchar('filename', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }),
    description: varchar('description', { length: 1000 }),
    status: EImageStatus('status').notNull().default('processing'),
    storageKeyFull: varchar('storage_key_full', { length: 511 }),
    storageKeyThumb: varchar('storage_key_thumb', { length: 511 }),
    
    // Metadata
    make: varchar('make', { length: 255 }),
    model: varchar('model', { length: 255 }),
    lens: varchar('lens', { length: 255 }),
    iso: integer('iso'),
    shutter: varchar('shutter', { length: 255 }),
    aperture: varchar('aperture', { length: 255 }),
    focalLength: varchar('focal_length', { length: 255 }),
    capturedAt: timestamp('captured_at'),
    metadataJson: jsonb('metadata_json').default({}),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    modifiedAt: timestamp('modified_at').notNull().defaultNow(),
});

export const comments = pgTable('comments', {
    id: uuid('id').primaryKey().defaultRandom(),
    authorUserId: uuid('author_user_id').notNull().references(() => userProfiles.id),
    albumId: uuid('album_id').references(() => albums.id),
    imageId: uuid('image_id').references(() => images.id),
    body: varchar('body', { length: 2000 }).notNull(),
    parentCommentId: uuid('parent_comment_id'), // Self-reference handled at app level or can add reference
    createdAt: timestamp('created_at').notNull().defaultNow(),
    modifiedAt: timestamp('modified_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
});

export const imageFeedback = pgTable('image_feedback', {
    imageId: uuid('image_id').notNull().references(() => images.id),
    clientUserId: uuid('client_user_id').notNull().references(() => userProfiles.id),
    flag: EFeedbackFlag('flag'),
    rating: integer('rating'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    modifiedAt: timestamp('modified_at').notNull().defaultNow(),
}, (t) => ({
    pk: primaryKey({ columns: [t.imageId, t.clientUserId] }),
}));


import { relations } from 'drizzle-orm';

// Relations
export const albumsRelations = relations(albums, ({ many, one }) => ({
    owner: one(userProfiles, {
        fields: [albums.ownerPhotographerId],
        references: [userProfiles.id],
    }),
    images: many(images),
    comments: many(comments),
    clients: many(albumClients),
    collaborators: many(albumPhotographers),
}));

export const albumPhotographersRelations = relations(albumPhotographers, ({ one }) => ({
    album: one(albums, {
        fields: [albumPhotographers.albumId],
        references: [albums.id],
    }),
    photographer: one(userProfiles, {
        fields: [albumPhotographers.photographerId],
        references: [userProfiles.id],
    }),
}));

export const albumClientsRelations = relations(albumClients, ({ one }) => ({
    album: one(albums, {
        fields: [albumClients.albumId],
        references: [albums.id],
    }),
    client: one(userProfiles, {
        fields: [albumClients.clientId],
        references: [userProfiles.id],
    }),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
    album: one(albums, {
        fields: [images.albumId],
        references: [albums.id],
    }),
    feedback: many(imageFeedback),
    comments: many(comments),
}));

export const imageFeedbackRelations = relations(imageFeedback, ({ one }) => ({
    image: one(images, {
        fields: [imageFeedback.imageId],
        references: [images.id],
    }),
    client: one(userProfiles, {
        fields: [imageFeedback.clientUserId],
        references: [userProfiles.id],
    }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
    author: one(userProfiles, {
        fields: [comments.authorUserId],
        references: [userProfiles.id],
    }),
    album: one(albums, {
        fields: [comments.albumId],
        references: [albums.id],
    }),
    image: one(images, {
        fields: [comments.imageId],
        references: [images.id],
    }),
}));

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({ // Optional but good for completeness
    ownedAlbums: many(albums),
}));

// Types
export type TUserProfile = typeof userProfiles.$inferSelect;
export type TNewUserProfile = typeof userProfiles.$inferInsert;

export type TAlbum = typeof albums.$inferSelect;
export type TNewAlbum = typeof albums.$inferInsert;

export type TImage = typeof images.$inferSelect;
export type TNewImage = typeof images.$inferInsert;

export type TComment = typeof comments.$inferSelect;
export type TNewComment = typeof comments.$inferInsert;

export type TImageFeedback = typeof imageFeedback.$inferSelect;
export type TNewImageFeedback = typeof imageFeedback.$inferInsert;
