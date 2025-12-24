<script lang="ts">
    import {
        Image as ImageIcon,
        Plus,
        Filter,
        Search,
        MoreHorizontal,
    } from "lucide-svelte";
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
                class="btn btn-primary rounded-2xl font-bold shadow-lg shadow-primary/20"
            >
                <Plus class="w-5 h-5 mr-2" />
                Create New Album
            </button>
        </div>
    </header>

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

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each [1, 2, 3, 4, 5, 6] as i}
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
                        <div
                            class="badge badge-primary font-bold italic shadow-lg"
                        >
                            READY
                        </div>
                    </div>
                    <div
                        class="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <p
                            class="text-white text-xs font-bold italic tracking-widest uppercase"
                        >
                            142 Photos
                        </p>
                    </div>
                </figure>
                <div class="card-body p-8">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2
                                class="card-title text-xl font-black tracking-tight"
                            >
                                Client Showcase #{i}
                            </h2>
                            <p class="text-sm opacity-50 font-medium italic">
                                Created 3 days ago
                            </p>
                        </div>
                        <button
                            class="btn btn-square btn-ghost btn-sm rounded-xl"
                        >
                            <MoreHorizontal class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="flex items-center gap-3 mt-4">
                        <div
                            class="avatar-group -space-x-4 rtl:space-x-reverse"
                        >
                            <div class="avatar border-base-100 w-8">
                                <div
                                    class="bg-neutral text-neutral-content rounded-full"
                                >
                                    <span class="text-[10px]">JD</span>
                                </div>
                            </div>
                            <div class="avatar border-base-100 w-8">
                                <div
                                    class="bg-primary text-primary-content rounded-full"
                                >
                                    <span class="text-[10px]">+2</span>
                                </div>
                            </div>
                        </div>
                        <p
                            class="text-xs font-bold opacity-40 uppercase tracking-widest leading-none"
                        >
                            Shared with 3 clients
                        </p>
                    </div>

                    <div class="card-actions justify-end mt-6">
                        <button
                            class="btn btn-ghost btn-sm font-black italic hover:text-primary underline decoration-2 underline-offset-4"
                            >Manage</button
                        >
                        <button
                            class="btn btn-primary btn-sm rounded-xl font-black px-6"
                            >View Proofs</button
                        >
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
