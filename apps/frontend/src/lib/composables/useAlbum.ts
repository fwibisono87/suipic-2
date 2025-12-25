import { createQuery } from "@tanstack/svelte-query";
import { albumService } from "$lib/services/albumService";

export function useAlbum(albumId: string) {
    const albumQuery = createQuery(() => ({
        queryKey: ["album", albumId],
        queryFn: () => albumService.getAlbum(albumId),
        enabled: !!albumId,
    }));

    return {
        albumQuery,
    };
}
