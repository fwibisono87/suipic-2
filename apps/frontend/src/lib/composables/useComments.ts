import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { commentService } from '../services/commentService';

export function useComments(options: { imageId?: string | (() => string) } = {}) {
    const queryClient = useQueryClient();
    
    const getImageId = () => typeof options.imageId === 'function' ? options.imageId() : options.imageId;

    const commentsQuery = createQuery(() => ({
        queryKey: ['comments', getImageId()],
        queryFn: () => {
            const id = getImageId();
            return id ? commentService.getCommentsForImage(id) : Promise.resolve([]);
        },
        enabled: !!getImageId()
    }));

    const createCommentMutation = createMutation(() => ({
        mutationFn: commentService.createComment,
        onSuccess: () => {
            const id = getImageId();
            if (id) {
                queryClient.invalidateQueries({ queryKey: ['comments', id] });
            }
        }
    }));

    const deleteCommentMutation = createMutation(() => ({
        mutationFn: commentService.deleteComment,
        onSuccess: () => {
            const id = getImageId();
            if (id) {
                queryClient.invalidateQueries({ queryKey: ['comments', id] });
            }
        }
    }));

    return {
        commentsQuery,
        createCommentMutation,
        deleteCommentMutation
    };
}
