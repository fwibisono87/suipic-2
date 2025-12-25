// Core Entity Types
export type TUserRole = 'admin' | 'photographer' | 'client';

export type TUser = {
    id: string;
    keycloakId: string;
    email: string;
    displayName: string;
    role: TUserRole;
    createdAt: string;
    updatedAt: string;
};

export type TPhotographer = TUser & {
    role: 'photographer';
};

export type TClient = TUser & {
    role: 'client';
    photographerId?: string;
};

export type TAlbum = {
    id: string;
    title: string;
    description?: string;
    ownerPhotographerId: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    clients?: { client: TClient }[];
};

export type TImage = {
    id: string;
    filename: string;
    urlFull: string;
    urlThumb: string;
    status: 'processing' | 'ready' | 'failed';
    albumId: string;
    createdAt: string;
    feedback?: TFeedback[];
};

export type TComment = {
    id: string;
    authorUserId: string;
    albumId?: string;
    imageId?: string;
    body: string;
    parentCommentId?: string;
    createdAt: string;
    deletedAt?: string;
};

export type TFeedback = {
    imageId: string;
    clientUserId: string;
    flag?: 'pick' | 'reject';
    rating?: number;
};

