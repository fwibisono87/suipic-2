<script lang="ts">
    import {
        Image as ImageIcon,
        Plus,
        Filter,
        Search,
        MoreHorizontal,
        ShieldAlert,
    } from "lucide-svelte";
    import { useAlbums } from "$lib/composables/useAlbums";

    const { albumsQuery, createAlbumMutation } = useAlbums();

    let isModalOpen = $state(false);
    let title = $state("");
    let description = $state("");

    function openModal() {
        isModalOpen = true;
        title = "";
        description = "";
    }

    async function handleCreate(e: Event) {
        e.preventDefault();
        try {
            await createAlbumMutation.mutateAsync({ title, description });
            isModalOpen = false;
        } catch (err) {
            console.error("Failed to create album", err);
        }
    }
</script>

<div class="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
    <header
        class="flex flex-col md:flex-row md:items-end justify-between gap-6"
    >
        <div>
            <h1 class="text-4xl lg:text-5xl font-black tracking-tighter">
                Albums
            </h1>
            <p class="text-lg opacity-60 font-medium italic mt-2">
                Manage your client image galleries
            </p>
        </div>
        <div class="flex gap-3">
            <button
                onclick={openModal}
                class="btn btn-primary rounded-2xl font-bold shadow-lg shadow-primary/20"
            >
                <Plus class="w-5 h-5 mr-2" />
                Create New Album
            </button>
        </div>
    </header>

    <!-- Filter Bar (Visual only for now) -->
    <div
        class="flex flex-col sm:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm"
    >
        <div class="relative w-full sm:max-w-xs">
            <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-40"
            >
                <Search class="w-4 h-4" />
            </div>
            <input
                type="text"
                placeholder="Search albums..."
                class="input input-sm input-bordered w-full pl-10 rounded-xl"
            />
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
            <button
                class="btn btn-sm btn-outline rounded-xl flex-1 sm:flex-none"
            >
                <Filter class="w-4 h-4 mr-2" />
                Filter
            </button>
            <select
                class="select select-sm select-bordered rounded-xl flex-1 sm:flex-none"
            >
                <option disabled selected>Sort by</option>
                <option>Newest</option>
                <option>Name</option>
                <option>Status</option>
            </select>
        </div>
    </div>

    <!-- Album Grid -->
    {#if albumsQuery.isLoading}
        <div class="flex justify-center p-20">
            <span class="loading loading-spinner loading-lg text-primary"
            ></span>
        </div>
    {:else if albumsQuery.isError}
        <div class="alert alert-error rounded-2xl">
            <ShieldAlert class="w-6 h-6" />
            <span>Error loading albums. Please try again.</span>
        </div>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each albumsQuery.data || [] as album (album.id)}
                <div
                    class="card bg-base-100 shadow-xl border border-base-300 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                >
                    <figure class="relative h-56 bg-base-300 overflow-hidden">
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        ></div>
                        <ImageIcon
                            class="w-12 h-12 opacity-10 absolute inset-0 m-auto group-hover:scale-110 transition-transform"
                        />
                        <div class="absolute top-4 right-4 z-20">
                            <!-- Status badge - placeholder logic -->
                            <div
                                class="badge badge-primary font-bold italic shadow-lg"
                            >
                                ACTIVE
                            </div>
                        </div>
                    </figure>
                    <div class="card-body p-8">
                        <div class="flex justify-between items-start">
                            <div>
                                <h2
                                    class="card-title text-xl font-black tracking-tight"
                                >
                                    {album.title}
                                </h2>
                                <p
                                    class="text-sm opacity-50 font-medium italic"
                                >
                                    Created {new Date(
                                        album.createdAt,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                class="btn btn-square btn-ghost btn-sm rounded-xl"
                            >
                                <MoreHorizontal class="w-5 h-5" />
                            </button>
                        </div>

                        <div class="flex items-center gap-3 mt-4">
                            <!-- Placeholder for shared clients -->
                            <p
                                class="text-xs font-bold opacity-40 uppercase tracking-widest leading-none"
                            >
                                {album.description || "No description"}
                            </p>
                        </div>

                        <div class="card-actions justify-end mt-6">
                            <a
                                href="/albums/{album.id}"
                                class="btn btn-primary btn-sm rounded-xl font-black px-6"
                                >Manage</a
                            >
                        </div>
                    </div>
                </div>
            {/each}

            {#if (albumsQuery.data || []).length === 0}
                <div class="col-span-full py-12 text-center opacity-50 italic">
                    You haven't created any albums yet.
                </div>
            {/if}
        </div>
    {/if}
</div>

<!-- Create Modal -->
{#if isModalOpen}
    <div class="modal modal-open">
        <div class="modal-box rounded-3xl p-8">
            <button
                onclick={() => (isModalOpen = false)}
                class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                >✕</button
            >
            <h3 class="font-bold text-2xl mb-6">Create New Album</h3>
            <form onsubmit={handleCreate} class="space-y-4">
                <div class="form-control">
                    <label class="label font-bold" for="title"
                        >Album Title</label
                    >
                    <input
                        id="title"
                        type="text"
                        bind:value={title}
                        placeholder="e.g. Smith Wedding"
                        class="input input-bordered rounded-xl w-full"
                        required
                    />
                </div>
                <div class="form-control">
                    <label class="label font-bold" for="desc">Description</label
                    >
                    <textarea
                        id="desc"
                        bind:value={description}
                        placeholder="Optional details..."
                        class="textarea textarea-bordered rounded-xl w-full"
                    ></textarea>
                </div>
                <div class="modal-action mt-8">
                    <button
                        type="button"
                        onclick={() => (isModalOpen = false)}
                        class="btn btn-ghost rounded-xl">Cancel</button
                    >
                    <button
                        type="submit"
                        class="btn btn-primary rounded-xl px-8"
                        disabled={createAlbumMutation.isPending}
                    >
                        {#if createAlbumMutation.isPending}<span
                                class="loading loading-spinner loading-xs"
                            ></span>{/if}
                        Create Album
                    </button>
                </div>
            </form>
        </div>
        <button
            class="modal-backdrop cursor-default"
            type="button"
            onclick={() => (isModalOpen = false)}>Close</button
        >
    </div>
{/if}
