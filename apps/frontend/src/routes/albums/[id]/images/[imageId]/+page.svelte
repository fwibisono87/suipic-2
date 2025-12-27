<script lang="ts">
    import { page } from "$app/stores";
    import { useComments } from "$lib/composables/useComments";
    import { useFeedback } from "$lib/composables/useFeedback";
    import { useImage } from "$lib/composables/useImage";
    import { useUser } from "$lib/composables/useUser";
    import FeedbackControls from "$lib/components/FeedbackControls.svelte";
    import CommentSection from "$lib/components/CommentSection.svelte";
    import ImageMetadata from "$lib/components/ImageMetadata.svelte";
    import { ChevronLeft, Info } from "lucide-svelte";
    
    const albumId = $page.params.id || "";
    const imageId = $page.params.imageId || "";

    const { userQuery } = useUser();
    const userRole = $derived(userQuery.data?.role);

    // Efficiently fetch single image
    const { imageQuery } = useImage({
        get albumId() {
            return albumId;
        },
        get imageId() {
            return imageId;
        },
        get role() {
             return userRole;
        }
    });

    const { commentsQuery } = useComments({
        get imageId() {
            return imageId;
        },
    });

    let image = $derived(imageQuery.data);
    let showMetadata = $state(false);
</script>

<div class="min-h-screen bg-base-100 pb-20">
    <!-- Header -->
    <header
        class="fixed top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-xl border-b border-base-200"
    >
        <div
            class="container mx-auto px-4 h-16 flex items-center justify-between"
        >
            <a
                href="/albums/{albumId}"
                class="btn btn-ghost btn-sm gap-2 opacity-60 hover:opacity-100"
            >
                <ChevronLeft class="w-4 h-4" /> Back to Album
            </a>
            <div class="font-bold opacity-50 text-sm hidden sm:block">
                {image?.filename || "Loading..."}
            </div>
            <div class="flex gap-2">
                <!-- Download button removed as per requirements -->
                <button 
                    class="btn btn-ghost btn-sm btn-circle" 
                    class:btn-active={showMetadata}
                    title="Info"
                    onclick={() => showMetadata = !showMetadata}
                >
                    <Info class="w-4 h-4" />
                </button>
            </div>
        </div>
    </header>

    <main
        class="container mx-auto px-4 pt-24 grid lg:grid-cols-[1fr_400px] gap-8"
    >
        <!-- Image Stage -->
        <div class="space-y-6">
            <div
                class="bg-base-200 aspect-[3/2] rounded-[2rem] overflow-hidden shadow-2xl relative border border-base-300 flex items-center justify-center group"
            >
                {#if image}
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img
                        src={image.urlFull ||
                            `https://via.placeholder.com/1200x800?text=${image.filename}`}
                        alt={image.filename}
                        class="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                {:else}
                    <span
                        class="loading loading-spinner loading-lg text-primary opacity-20"
                    ></span>
                {/if}

                <!-- Feedback Overlay (Bottom Center) -->
                <div
                    class="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0"
                >
                    <FeedbackControls {imageId} />
                </div>
            </div>
        </div>

        <!-- Sidebar (Comments & Details) -->
        <div class="space-y-8">
            <div class="bg-base-100 lg:sticky lg:top-24 space-y-8">
                
                {#if showMetadata && image}
                    <div class="animate-in slide-in-from-top-4 fade-in duration-300">
                         <ImageMetadata {image} />
                    </div>
                {/if}

                <!-- Mobile only controls if not strictly desktop -->
                <div class="lg:hidden flex justify-center">
                    <FeedbackControls {imageId} />
                </div>

                <div
                    class="border-t border-base-200 pt-8 lg:border-none lg:pt-0"
                >
                    {#if commentsQuery.isLoading}
                        <div class="flex justify-center p-12">
                            <span
                                class="loading loading-dots loading-md opacity-30"
                            ></span>
                        </div>
                    {:else if commentsQuery.isError}
                        <div class="alert alert-error">
                            Failed to load comments
                        </div>
                    {:else}
                        <CommentSection
                            {imageId}
                            comments={commentsQuery.data || []}
                        />
                    {/if}
                </div>
            </div>
        </div>
    </main>
</div>
