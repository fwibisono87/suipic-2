// Core Entity Types

export enum EUserRole {
    ADMIN = 'admin',
    PHOTOGRAPHER = 'photographer',
    CLIENT = 'client'
}

export type TUser = {
    id: string;
    keycloakId: string;
    email: string;
    displayName: string;
    role: EUserRole;
    createdAt: string;
    updatedAt: string;
};

export type TPhotographer = TUser & {
    role: EUserRole.PHOTOGRAPHER;
};

export type TClient = TUser & {
    role: EUserRole.CLIENT;
    photographerId?: string;
};

export type TAlbum = {
    id: string;
    title: string;
    description?: string;
    ownerPhotographerId: string;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    clients?: { client: TClient }[];
    collaborators?: { photographer: TPhotographer }[];
    role?: 'owner' | 'collaborator';
};

export enum EImageStatus {
    PROCESSING = 'processing',
    READY = 'ready',
    FAILED = 'failed'
}

export type TImage = {
    id: string;
    filename: string;
    urlFull: string;
    urlThumb: string;
    status: EImageStatus;
    albumId: string;
    createdAt: string;
    feedback?: TFeedback[];
    // Metabolic data from EXIF
    make?: string;
    model?: string;
    lens?: string;
    iso?: number;
    shutter?: string;
    aperture?: string;
    focalLength?: string;
    capturedAt?: string;
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

export enum EFeedbackFlag {
    PICK = 'pick',
    REJECT = 'reject'
}

export type TFeedback = {
    imageId: string;
    clientUserId: string;
    flag?: EFeedbackFlag;
    rating?: number;
};

