import { fetchWithAuth } from '$lib/services/auth';
import type { TFeedback, EFeedbackFlag } from '$lib/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const feedbackService = {
    async upsertFeedback(imageId: string, data: { flag?: EFeedbackFlag; rating?: number }): Promise<TFeedback> {
        const response = await fetchWithAuth(`${API_URL}/api/feedback/images/${imageId}`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to submit feedback');
        return response.json();
    },

    async getFeedbackForImage(imageId: string): Promise<TFeedback | null> {
        const response = await fetchWithAuth(`${API_URL}/api/feedback/images/${imageId}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to fetch feedback');
        }
        return response.json();
    }
};
