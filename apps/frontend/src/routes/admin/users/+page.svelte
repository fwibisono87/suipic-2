<script lang="ts">
    import { useUsers } from "$lib/composables/useUsers";
    import { Users, Mail, Shield, CheckCircle2, XCircle } from "lucide-svelte";

    const { usersQuery, setUserStatusMutation } = useUsers();

    async function toggleStatus(user: any) {
        try {
            await setUserStatusMutation.mutateAsync({
                id: user.id,
                isActive: !user.isActive,
            });
        } catch (err) {
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
                User Management
            </h1>
            <p class="text-lg opacity-60 font-medium italic mt-2">
                Monitor and manage all system users
            </p>
        </div>
    </header>

    {#if usersQuery.isLoading}
        <div class="flex justify-center p-12">
            <span class="loading loading-spinner loading-lg text-primary"
            ></span>
        </div>
    {:else if usersQuery.isError}
        <div class="alert alert-error rounded-2xl">
            <Shield class="w-6 h-6" />
            <span>Error loading users. Verify you are an admin.</span>
        </div>
    {:else}
        <div
            class="overflow-x-auto bg-base-100 shadow-xl border border-base-300 rounded-[2rem]"
        >
            <table class="table table-zebra">
                <thead>
                    <tr class="text-lg">
                        <th>User</th>
                        <th>Role</th>
                        <th>Created At</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {#each usersQuery.data || [] as user (user.id)}
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="avatar placeholder">
                                        <div
                                            class="bg-neutral text-neutral-content rounded-full w-10"
                                        >
                                            <span
                                                >{user.displayName
                                                    ?.charAt(0)
                                                    .toUpperCase() || "U"}</span
                                            >
                                        </div>
                                    </div>
                                    <div>
                                        <div class="font-bold">
                                            {user.displayName || "Unnamed"}
                                        </div>
                                        <div class="text-sm opacity-50">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div
                                    class="badge badge-outline uppercase text-xs font-bold tracking-widest px-3 py-2"
                                >
                                    {user.role}
                                </div>
                            </td>
                            <td class="opacity-70">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                                {#if user.isActive}
                                    <div
                                        class="flex items-center gap-1 text-success font-bold text-sm"
                                    >
                                        <CheckCircle2 class="w-4 h-4" />
                                        Active
                                    </div>
                                {:else}
                                    <div
                                        class="flex items-center gap-1 text-error font-bold text-sm"
                                    >
                                        <XCircle class="w-4 h-4" />
                                        Disabled
                                    </div>
                                {/if}
                            </td>
                            <td>
                                <button
                                    onclick={() => toggleStatus(user)}
                                    class="btn btn-sm btn-ghost rounded-xl {user.isActive
                                        ? 'text-error hover:bg-error/10'
                                        : 'text-success hover:bg-success/10'}"
                                    disabled={setUserStatusMutation.isPending}
                                >
                                    {user.isActive ? "Disable" : "Enable"}
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
