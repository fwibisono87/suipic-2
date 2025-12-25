<script lang="ts">
    import {
        MessageSquare,
        Send,
        Trash2,
        CornerDownRight,
    } from "lucide-svelte";
    import { useComments } from "$lib/composables/useComments";
    import type { TComment } from "$lib/types";
    // Remove self-import to avoid recursion issues in Svelte (though supported, safer to handle via manual recursion or flat list)
    // Actually Svelte 5 snippets or recursive components work fine.

    let { imageId, comments = [] } = $props<{
        imageId: string;
        comments: TComment[];
    }>();

    const { createCommentMutation, deleteCommentMutation } = useComments({
        get imageId() {
            return imageId;
        },
    });

    let newComment = $state("");
    let replyToId = $state<string | undefined>(undefined);

    // Sort comments to ensure chronological order for display
    // const sortedComments = $derived([...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    // Actually, commentService returns them effectively.

    // We build a tree for threading display from the flat list returned by the API.

    function buildTree(items: TComment[]) {
        const map = new Map<string, TComment & { children: TComment[] }>();
        const roots: (TComment & { children: TComment[] })[] = [];

        items.forEach((item) => {
            map.set(item.id, { ...item, children: [] });
        });

        items.forEach((item) => {
            if (item.parentCommentId && map.has(item.parentCommentId)) {
                map.get(item.parentCommentId)!.children.push(map.get(item.id)!);
            } else {
                // If parent not found (deleted?) or is root
                roots.push(map.get(item.id)!);
            }
        });

        return roots;
    }

    const commentTree = $derived(buildTree(comments));

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await createCommentMutation.mutateAsync({
                imageId,
                body: newComment,
                parentCommentId: replyToId,
            });
            newComment = "";
            replyToId = undefined;
        } catch (err) {
            console.error(err);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete comment?")) return;
        try {
            await deleteCommentMutation.mutateAsync(id);
        } catch (err) {
            console.error(err);
        }
    }
</script>

<div class="space-y-6">
    <div class="flex items-center gap-2 mb-4">
        <MessageSquare class="w-5 h-5 opacity-50" />
        <h3 class="font-bold text-lg">Comments ({comments.length})</h3>
    </div>

    <!-- Scrollable Area -->
    <div class="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {#each commentTree as root (root.id)}
            <div
                class="group animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
                <!-- Root Comment -->
                <div class="bg-base-200/50 p-4 rounded-2xl space-y-2">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-2">
                            <div class="avatar placeholder">
                                <div
                                    class="bg-neutral text-neutral-content rounded-full w-8"
                                >
                                    <span class="text-xs">UI</span>
                                </div>
                            </div>
                            <span class="font-bold text-sm opacity-70"
                                >User</span
                            >
                            <span class="text-xs opacity-40"
                                >{new Date(
                                    root.createdAt,
                                ).toLocaleDateString()}</span
                            >
                        </div>
                        <!-- Show delete only if author (mock check) -->
                        <button
                            onclick={() => handleDelete(root.id)}
                            class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 class="w-4 h-4 text-error" />
                        </button>
                    </div>
                    <p class="text-sm leading-relaxed pl-10">{root.body}</p>
                    <div class="flex justify-end">
                        <button
                            onclick={() =>
                                (replyToId =
                                    replyToId === root.id
                                        ? undefined
                                        : root.id)}
                            class="btn btn-xs btn-ghost gap-1 opacity-50 hover:opacity-100"
                        >
                            <CornerDownRight class="w-3 h-3" /> Reply
                        </button>
                    </div>
                </div>

                <!-- Replies -->
                {#if root.children.length > 0}
                    <div
                        class="ml-8 mt-2 space-y-2 border-l-2 border-base-300 pl-4"
                    >
                        {#each root.children as child (child.id)}
                            <div
                                class="bg-base-100 p-3 rounded-xl border border-base-200"
                            >
                                <div
                                    class="flex justify-between items-start mb-1"
                                >
                                    <span class="font-bold text-xs opacity-70"
                                        >User</span
                                    >
                                    <button
                                        onclick={() => handleDelete(child.id)}
                                        class="btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100"
                                    >
                                        <Trash2 class="w-3 h-3 text-error" />
                                    </button>
                                </div>
                                <p class="text-sm opacity-80">{child.body}</p>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Reply Input -->
                {#if replyToId === root.id}
                    <div
                        class="ml-8 mt-2 animate-in fade-in slide-in-from-top-1"
                    >
                        <form onsubmit={handleSubmit} class="flex gap-2">
                            <input
                                bind:value={newComment}
                                type="text"
                                placeholder="Write a reply..."
                                class="input input-sm input-bordered flex-1 rounded-xl"
                            />
                            <button
                                type="submit"
                                class="btn btn-sm btn-primary btn-circle"
                            >
                                <Send class="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                {/if}
            </div>
        {/each}

        {#if comments.length === 0}
            <div
                class="text-center py-10 opacity-40 italic bg-base-200/30 rounded-3xl border border-dashed border-base-300"
            >
                No comments yet. Be the first to start the conversation!
            </div>
        {/if}
    </div>

    <!-- Main Input -->
    {#if !replyToId}
        <form onsubmit={handleSubmit} class="relative">
            <input
                bind:value={newComment}
                type="text"
                placeholder="Add a comment on this photo..."
                class="input input-lg input-bordered w-full rounded-2xl pr-14 shadow-sm focus:shadow-lg transition-shadow"
            />
            <button
                type="submit"
                disabled={!newComment.trim() || createCommentMutation.isPending}
                class="absolute right-2 top-2 btn btn-primary btn-circle shadow-lg shadow-primary/30"
            >
                {#if createCommentMutation.isPending}
                    <span class="loading loading-spinner loading-xs"></span>
                {:else}
                    <Send class="w-5 h-5 relative left-0.5" />
                {/if}
            </button>
        </form>
    {/if}
</div>
