<script lang="ts">
    import { Heart, Star, X } from "lucide-svelte";
    import { useFeedback } from "$lib/composables/useFeedback";

    // Props
    let { imageId } = $props<{ imageId: string }>();

    // Pass a getter function for interactivity if imageId changes
    const { feedbackMutation, feedbackQuery } = useFeedback({
        get imageId() {
            return imageId;
        },
    });

    const currentUserFeedback = $derived(feedbackQuery.data);

    async function setFlag(flag: "pick" | "reject" | undefined) {
        try {
            // Optimistic update logic could go here, but for now we wait
            await feedbackMutation.mutateAsync({
                imageId,
                data: {
                    flag: flag === currentUserFeedback?.flag ? undefined : flag,
                },
            });
        } catch (e) {
            console.error(e);
        }
    }

    async function setRating(rating: number) {
        try {
            await feedbackMutation.mutateAsync({
                imageId,
                data: {
                    rating:
                        rating === currentUserFeedback?.rating
                            ? undefined
                            : rating,
                },
            });
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div
    class="flex items-center gap-6 bg-base-100/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-base-200"
>
    <!-- Flags -->
    <div class="flex gap-2">
        <button
            onclick={() => setFlag("pick")}
            class="btn btn-circle btn-sm transition-all duration-300 {currentUserFeedback?.flag ===
            'pick'
                ? 'btn-success scale-110 shadow-success/40 shadow-lg'
                : 'btn-ghost opacity-50 hover:opacity-100'}"
            aria-label="Pick"
        >
            <Heart
                class="w-5 h-5 {currentUserFeedback?.flag === 'pick'
                    ? 'fill-current'
                    : ''}"
            />
        </button>
        <button
            onclick={() => setFlag("reject")}
            class="btn btn-circle btn-sm transition-all duration-300 {currentUserFeedback?.flag ===
            'reject'
                ? 'btn-error scale-110 shadow-error/40 shadow-lg'
                : 'btn-ghost opacity-50 hover:opacity-100'}"
            aria-label="Reject"
        >
            <X class="w-5 h-5" />
        </button>
    </div>

    <div class="w-px h-8 bg-base-300"></div>

    <!-- Rating -->
    <div class="flex gap-1">
        {#each [1, 2, 3, 4, 5] as star}
            <button
                onclick={() => setRating(star)}
                class="btn btn-ghost btn-xs btn-circle hover:scale-125 transition-transform"
                class:text-warning={currentUserFeedback?.rating &&
                    currentUserFeedback.rating >= star}
                class:opacity-30={!currentUserFeedback?.rating ||
                    currentUserFeedback.rating < star}
            >
                <Star
                    class="w-4 h-4 {currentUserFeedback?.rating &&
                    currentUserFeedback.rating >= star
                        ? 'fill-current'
                        : ''}"
                />
            </button>
        {/each}
    </div>
</div>
