import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { feedbackService } from '../services/feedbackService';

export function useFeedback(options: { imageId?: string | (() => string) } = {}) {
    const queryClient = useQueryClient();
    
    // Resolve value
    const getImageId = () => typeof options.imageId === 'function' ? options.imageId() : options.imageId;

    const feedbackQuery = createQuery(() => ({
        queryKey: ['feedback', getImageId()],
        queryFn: () => {
             const id = getImageId();
             return id ? feedbackService.getFeedbackForImage(id) : Promise.resolve(null);
        },
        enabled: !!getImageId()
    }));

    const feedbackMutation = createMutation(() => ({
        mutationFn: (vars: { imageId: string, data: { flag?: 'pick' | 'reject'; rating?: number } }) => 
            feedbackService.upsertFeedback(vars.imageId, vars.data),
        onSuccess: (data, vars) => {
            // Optimistically update or invalidate. 
            // Invaliding is safer for ensuring consistency.
            queryClient.setQueryData(['feedback', vars.imageId], data);
            queryClient.invalidateQueries({ queryKey: ['feedback', vars.imageId] });
        }
    }));

    return {
        feedbackQuery,
        feedbackMutation
    };
}
