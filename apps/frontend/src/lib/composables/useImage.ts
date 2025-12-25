import { createQuery } from '@tanstack/svelte-query';
import { imageService } from '../services/imageService';
import type { TImage, TUserRole } from '../types';

export function useImage(
    options: { 
        albumId: string | (() => string); 
        imageId: string | (() => string);
        role?: TUserRole;
    }
) {
    const getAlbumId = () => typeof options.albumId === 'function' ? options.albumId() : options.albumId;
    const getImageId = () => typeof options.imageId === 'function' ? options.imageId() : options.imageId;
    const role = options.role || 'photographer';

    const imageQuery = createQuery(() => ({
        queryKey: ['image', getAlbumId(), getImageId(), role],
        queryFn: () => {
            const aId = getAlbumId();
            const iId = getImageId();
            if (aId && iId) {
                return imageService.getImage(aId, iId, role);
            }
            return Promise.resolve(null);
        },
        enabled: !!getAlbumId() && !!getImageId()
    }));

    return {
        imageQuery
    };
}
