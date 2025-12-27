<script lang="ts">
    import { page } from "$app/stores";
    import { useAlbumMembership } from "$lib/composables/useAlbumMembership";
    import { useAlbum } from "$lib/composables/useAlbum";
    import {
        User,
        Users,
        Trash2,
        Plus,
        ArrowLeft,
        Shield,
    } from "lucide-svelte";

    let albumId = $state($page.params.id);
    const { albumQuery } = useAlbum(albumId);
    const {
        addClientMutation,
        removeClientMutation,
        addCollaboratorMutation,
        removeCollaboratorMutation,
        clientsQuery,
        photographersQuery,
    } = useAlbumMembership(albumId);

    // Filter out already added ones
    let availableClients = $derived(
        (clientsQuery.data || []).filter(
            (c) =>
                !albumQuery.data?.clients?.some(
                    (ac: any) => ac.client.id === c.id,
                ),
        ),
    );

    let availablePhotographers = $derived(
        (photographersQuery.data || []).filter(
            (p) =>
                p.id !== albumQuery.data?.ownerPhotographerId &&
                !albumQuery.data?.collaborators?.some(
                    (col: any) => col.photographer.id === p.id,
                ),
        ),
    );

    async function addClient(clientId: string) {
        try {
            await addClientMutation.mutateAsync(clientId);
        } catch (e) {
            console.error(e);
        }
    }

    async function removeClient(clientId: string) {
        try {
            await removeClientMutation.mutateAsync(clientId);
        } catch (e) {
            console.error(e);
        }
    }

    async function addCollaborator(photographerId: string) {
        try {
            await addCollaboratorMutation.mutateAsync(photographerId);
        } catch (e) {
            console.error(e);
        }
    }

    async function removeCollaborator(photographerId: string) {
        try {
            await removeCollaboratorMutation.mutateAsync(photographerId);
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div class="p-8 lg:p-12 max-w-5xl mx-auto space-y-12">
    <header>
        <a
            href="/albums/{albumId}"
            class="btn btn-ghost btn-sm rounded-xl mb-4 -ml-2"
        >
            <ArrowLeft class="w-4 h-4 mr-2" /> Back to Album
        </a>
        <h1 class="text-4xl font-black tracking-tighter">Manage Membership</h1>
        <p class="text-lg opacity-60 font-medium italic mt-2">
            {albumQuery.data?.title || "Loading..."}
        </p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Clients Section -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <div class="bg-primary/10 text-primary p-3 rounded-2xl">
                    <Users class="w-6 h-6" />
                </div>
                <h2 class="text-2xl font-bold">Clients</h2>
            </div>

            <div
                class="bg-base-100 border border-base-300 rounded-[2rem] overflow-hidden shadow-sm"
            >
                <div class="p-6 border-b border-base-200">
                    <h3
                        class="font-bold text-sm uppercase opacity-50 tracking-widest"
                    >
                        Added Clients
                    </h3>
                </div>
                <div class="divide-y divide-base-100">
                    {#each albumQuery.data?.clients || [] as ac (ac.client.id)}
                        <div
                            class="p-6 flex items-center justify-between hover:bg-base-200/50 transition-colors"
                        >
                            <div class="flex items-center gap-4">
                                <div class="avatar placeholder">
                                    <div
                                        class="bg-neutral text-neutral-content rounded-full w-10"
                                    >
                                        <span
                                            >{ac.client.displayName
                                                ?.charAt(0)
                                                .toUpperCase()}</span
                                        >
                                    </div>
                                </div>
                                <div>
                                    <div class="font-bold">
                                        {ac.client.displayName}
                                    </div>
                                    <div class="text-sm opacity-50">
                                        {ac.client.email}
                                    </div>
                                </div>
                            </div>
                            <button
                                onclick={() => removeClient(ac.client.id)}
                                class="btn btn-circle btn-ghost text-error"
                                disabled={removeClientMutation.isPending}
                            >
                                <Trash2 class="w-5 h-5" />
                            </button>
                        </div>
                    {/each}
                    {#if (albumQuery.data?.clients || []).length === 0}
                        <div class="p-10 text-center opacity-30 italic">
                            No clients added yet
                        </div>
                    {/if}
                </div>

                <div class="p-6 bg-base-200/30 border-t border-base-200">
                    <h3
                        class="font-bold text-xs uppercase opacity-50 tracking-widest mb-4"
                    >
                        Add Client
                    </h3>
                    <div class="flex flex-col gap-2">
                        {#each availableClients as c}
                            <button
                                onclick={() => addClient(c.id)}
                                class="btn btn-ghost justify-between rounded-xl hover:bg-primary/10 hover:text-primary transition-all group"
                                disabled={addClientMutation.isPending}
                            >
                                <span class="truncate"
                                    >{c.displayName} ({c.email})</span
                                >
                                <Plus
                                    class="w-4 h-4 opacity-0 group-hover:opacity-100"
                                />
                            </button>
                        {:else}
                            <div class="text-xs opacity-50 italic">
                                No more clients available
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </section>

        <!-- Collaborators Section -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <div class="bg-secondary/10 text-secondary p-3 rounded-2xl">
                    <Shield class="w-6 h-6" />
                </div>
                <h2 class="text-2xl font-bold">Collaborators</h2>
            </div>

            <div
                class="bg-base-100 border border-base-300 rounded-[2rem] overflow-hidden shadow-sm"
            >
                <div class="p-6 border-b border-base-200">
                    <h3
                        class="font-bold text-sm uppercase opacity-50 tracking-widest"
                    >
                        Added Photographers
                    </h3>
                </div>
                <div class="divide-y divide-base-100">
                    {#each albumQuery.data?.collaborators || [] as col (col.photographer.id)}
                        <div
                            class="p-6 flex items-center justify-between hover:bg-base-200/50 transition-colors"
                        >
                            <div class="flex items-center gap-4">
                                <div class="avatar placeholder">
                                    <div
                                        class="bg-neutral text-neutral-content rounded-full w-10"
                                    >
                                        <span
                                            >{col.photographer.displayName
                                                ?.charAt(0)
                                                .toUpperCase()}</span
                                        >
                                    </div>
                                </div>
                                <div>
                                    <div class="font-bold">
                                        {col.photographer.displayName}
                                    </div>
                                    <div class="text-sm opacity-50">
                                        {col.photographer.email}
                                    </div>
                                </div>
                            </div>
                            <button
                                onclick={() =>
                                    removeCollaborator(col.photographer.id)}
                                class="btn btn-circle btn-ghost text-error"
                                disabled={removeCollaboratorMutation.isPending}
                            >
                                <Trash2 class="w-5 h-5" />
                            </button>
                        </div>
                    {/each}
                    {#if (albumQuery.data?.collaborators || []).length === 0}
                        <div class="p-10 text-center opacity-30 italic">
                            No collaborators added yet
                        </div>
                    {/if}
                </div>

                <div class="p-6 bg-base-200/30 border-t border-base-200">
                    <h3
                        class="font-bold text-xs uppercase opacity-50 tracking-widest mb-4"
                    >
                        Add Collaborator
                    </h3>
                    <div class="flex flex-col gap-2">
                        {#each availablePhotographers as p}
                            <button
                                onclick={() => addCollaborator(p.id)}
                                class="btn btn-ghost justify-between rounded-xl hover:bg-secondary/10 hover:text-secondary transition-all group"
                                disabled={addCollaboratorMutation.isPending}
                            >
                                <span class="truncate">{p.displayName}</span>
                                <Plus
                                    class="w-4 h-4 opacity-0 group-hover:opacity-100"
                                />
                            </button>
                        {:else}
                            <div class="text-xs opacity-50 italic">
                                No more photographers available
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </section>
    </div>
</div>
