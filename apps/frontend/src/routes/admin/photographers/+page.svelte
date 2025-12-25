<script lang="ts">
    import { usePhotographers } from "$lib/composables/usePhotographers";
    import { Plus, User, Mail, Shield } from "lucide-svelte";

    const { photographersQuery, createPhotographerMutation } =
        usePhotographers();

    // Form State
    let isModalOpen = $state(false);
    let email = $state("");
    let displayName = $state("");
    let keycloakId = $state("");
    let formError = $state("");

    function openModal() {
        isModalOpen = true;
        formError = "";
        // Reset form
        email = "";
        displayName = "";
        keycloakId = crypto.randomUUID(); // Auto-generate for now as we don't have real Keycloak integration in UI yet
    }

    function closeModal() {
        isModalOpen = false;
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        formError = "";

        try {
            await createPhotographerMutation.mutateAsync({
                email,
                displayName,
                keycloakId,
            });
            closeModal();
        } catch (err) {
            formError = "Failed to create photographer. Please try again.";
            console.error(err);
        }
    }
</script>

<div class="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
    <header
        class="flex flex-col md:flex-row md:items-end justify-between gap-6"
    >
        <div>
            <h1 class="text-4xl lg:text-5xl font-black tracking-tighter">
                Photographers
            </h1>
            <p class="text-lg opacity-60 font-medium italic mt-2">
                Manage your photographer accounts
            </p>
        </div>
        <div class="flex gap-3">
            <button
                onclick={openModal}
                class="btn btn-primary rounded-2xl font-bold shadow-lg shadow-primary/20"
            >
                <Plus class="w-5 h-5 mr-2" />
                Add Photographer
            </button>
        </div>
    </header>

    {#if photographersQuery.isLoading}
        <div class="flex justify-center p-12">
            <span class="loading loading-spinner loading-lg text-primary"
            ></span>
        </div>
    {:else if photographersQuery.isError}
        <div class="alert alert-error rounded-2xl">
            <Shield class="w-6 h-6" />
            <span>Error loading photographers. verify you are an admin.</span>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each photographersQuery.data || [] as photographer (photographer.id)}
                <div
                    class="card bg-base-100 shadow-xl border border-base-300 rounded-[2rem] hover:shadow-2xl transition-all duration-300"
                >
                    <div class="card-body">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="avatar placeholder">
                                <div
                                    class="bg-neutral text-neutral-content rounded-full w-12"
                                >
                                    <span class="text-xl font-bold"
                                        >{photographer.displayName
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}</span
                                    >
                                </div>
                            </div>
                            <div>
                                <h2 class="card-title font-bold text-lg">
                                    {photographer.displayName || "Unnamed"}
                                </h2>
                                <div
                                    class="badge badge-sm badge-ghost font-mono"
                                >
                                    ID: {photographer.id.slice(0, 8)}...
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2 mt-2">
                            <div
                                class="flex items-center gap-2 text-sm opacity-70"
                            >
                                <Mail class="w-4 h-4" />
                                <span>{photographer.email}</span>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm opacity-70"
                            >
                                <User class="w-4 h-4" />
                                <span
                                    class="uppercase text-xs font-bold tracking-widest"
                                    >{photographer.role}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            {/each}

            {#if (photographersQuery.data || []).length === 0}
                <div class="col-span-full text-center py-12 opacity-50 italic">
                    No photographers found. Create one to get started.
                </div>
            {/if}
        </div>
    {/if}
</div>

<!-- Modal -->
{#if isModalOpen}
    <div class="modal modal-open">
        <div class="modal-box rounded-3xl p-8">
            <button
                onclick={closeModal}
                class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                >✕</button
            >
            <h3 class="font-bold text-2xl mb-6">Add New Photographer</h3>

            <form onsubmit={handleSubmit} class="space-y-4">
                <div class="form-control">
                    <label class="label font-bold" for="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        bind:value={email}
                        placeholder="photographer@example.com"
                        class="input input-bordered rounded-xl w-full"
                        required
                    />
                </div>

                <div class="form-control">
                    <label class="label font-bold" for="displayName"
                        >Display Name</label
                    >
                    <input
                        id="displayName"
                        type="text"
                        bind:value={displayName}
                        placeholder="John Doe"
                        class="input input-bordered rounded-xl w-full"
                    />
                </div>

                <!-- Hidden Keycloak ID for now -->
                <input type="hidden" bind:value={keycloakId} />

                {#if formError}
                    <div class="alert alert-error text-sm rounded-xl">
                        <span>{formError}</span>
                    </div>
                {/if}

                <div class="modal-action mt-8">
                    <button
                        type="button"
                        onclick={closeModal}
                        class="btn btn-ghost rounded-xl">Cancel</button
                    >
                    <button
                        type="submit"
                        class="btn btn-primary rounded-xl px-8"
                        disabled={createPhotographerMutation.isPending}
                    >
                        {#if createPhotographerMutation.isPending}
                            <span class="loading loading-spinner loading-xs"
                            ></span>
                        {/if}
                        Create Account
                    </button>
                </div>
            </form>
        </div>
        <button
            class="modal-backdrop cursor-default"
            type="button"
            onclick={closeModal}>Close</button
        >
    </div>
{/if}
