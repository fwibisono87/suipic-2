<script lang="ts">
    import { page } from "$app/stores";
    import {
        Upload,
        X,
        Check,
        Loader2,
        Image as ImageIcon,
        Heart,
        Star,
        XCircle,
        Filter,
        ArrowUpDown
    } from "lucide-svelte";
    import { useImages } from "$lib/composables/useImages";
    import { useAlbum } from "$lib/composables/useAlbum";

    let albumId = $state($page.params.id);

    // Composables
    const { imagesQuery, uploadMutation } = useImages(albumId || "");
    const { albumQuery } = useAlbum(albumId || "");

    // Filter & Sort State
    let selectedClientId = $state<string>("all");
    let selectedFlag = $state<string>("all"); // all, pick, reject, none
    let sortOrder = $state<string>("date-desc"); // date-desc, date-asc, rating-desc, picks-desc

    // Computed: Filtered Images
    let filteredImages = $derived.by(() => {
        if (!imagesQuery.data) return [];
        
        let result = [...imagesQuery.data];

        // 1. Filter by Client (If selected, only considers feedback from that client)
        // Note: Currently feedbacks are per-image. If we select a client, we might want to see images
        // where THAT client has set a flag/rating? Or just strict filtering?
        // SRS says: "Filter images by selected client". Usually implies "Feedback from Client X".
        // But for "Global" view, do we hide images that Client X hasn't touched?
        // Let's assume we filter based on if the client has ANY feedback/flag match if flag filter is active,
        // or just show all images but focus stats on that client? 
        // For MVP: If Client selected, we focus on THEIR feedback for the stats/icons.
        // But SRS says "Filter images". So maybe hide images they explicitly Rejected?
        // Let's implement: Client Selection purely filters the *Feedback* view, and maybe filters images if combined with Flag.
        
        if (selectedFlag !== 'all') {
            result = result.filter(img => {
                const feedbacks = img.feedback || [];
                // If a client is selected, look only at their feedback
                const relevantFeedbacks = selectedClientId !== 'all' 
                    ? feedbacks.filter(f => f.clientUserId === selectedClientId)
                    : feedbacks;

                if (selectedFlag === 'pick') return relevantFeedbacks.some(f => f.flag === 'pick');
                if (selectedFlag === 'reject') return relevantFeedbacks.some(f => f.flag === 'reject');
                if (selectedFlag === 'none') return relevantFeedbacks.length === 0 || !relevantFeedbacks.some(f => f.flag);
                return true;
            });
        }

        // 2. Sort
        result.sort((a, b) => {
            const getRating = (img: typeof a) => {
                 const feedbacks = img.feedback || [];
                 const relevant = selectedClientId !== 'all' ? feedbacks.filter(f => f.clientUserId === selectedClientId) : feedbacks;
                 if (!relevant.length) return 0;
                 return relevant.reduce((acc, curr) => acc + (curr.rating || 0), 0) / relevant.length;
            };

            const getPicks = (img: typeof a) => {
                 const feedbacks = img.feedback || [];
                 const relevant = selectedClientId !== 'all' ? feedbacks.filter(f => f.clientUserId === selectedClientId) : feedbacks;
                 return relevant.filter(f => f.flag === 'pick').length;
            };

            if (sortOrder === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortOrder === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortOrder === 'rating-desc') return getRating(b) - getRating(a);
            if (sortOrder === 'picks-desc') return getPicks(b) - getPicks(a);
            return 0;
        });

        return result;
    });

    // Computed Stats
    let stats = $derived.by(() => {
        const imgs = imagesQuery.data || [];
        // Flatten feedback based on client selection
        const relevantFeedbacks = imgs.flatMap(i => i.feedback || []).filter(f => selectedClientId === 'all' || f.clientUserId === selectedClientId);
        
        return {
            totalPicks: relevantFeedbacks.filter(f => f.flag === 'pick').length,
            totalRejects: relevantFeedbacks.filter(f => f.flag === 'reject').length,
            avgRating: relevantFeedbacks.filter(f => f.rating).length > 0
                ? (relevantFeedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0) / relevantFeedbacks.filter(f => f.rating).length).toFixed(1)
                : 'N/A'
        };
    });


    let files = $state<FileList | null>(null);
    let uploadProgress = $state<Record<string, number>>({});
    let uploadStatus = $state<Record<string, "pending" | "success" | "error">>(
        {},
    );

    async function handleUpload() {
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            uploadStatus[file.name] = "pending";
            uploadProgress[file.name] = 0;

            try {
                await uploadMutation.mutateAsync(file);
                uploadStatus[file.name] = "success";
                uploadProgress[file.name] = 100;
            } catch (e) {
                uploadStatus[file.name] = "error";
                console.error(e);
            }
        }

        files = null; // Clear selection
    }

    function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        files = target.files;
    }
</script>

<div class="p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="text-sm breadcrumbs opacity-50 font-bold mb-2">
                <ul>
                    <li><a href="/albums">Albums</a></li>
                    <li>Album Details</li>
                </ul>
            </div>
            <h1 class="text-4xl font-black tracking-tighter">
                {albumQuery.data?.title || 'Loading...'}
            </h1>
            <p class="text-lg opacity-60 font-medium italic mt-2">
                 {albumQuery.data?.description || `ID: ${albumId}`}
            </p>
        </div>
    </div>


    <!-- Stats & Filters Toolbar -->
    <div class="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <!-- Stats -->
        <div class="flex gap-4 text-sm font-bold">
            <div class="flex items-center gap-2 text-primary">
                <Heart class="w-4 h-4 fill-current" />
                <span>{stats.totalPicks} Picks</span>
            </div>
             <div class="flex items-center gap-2 text-error">
                <XCircle class="w-4 h-4" />
                <span>{stats.totalRejects} Rejects</span>
            </div>
             <div class="flex items-center gap-2 text-warning">
                <Star class="w-4 h-4 fill-current" />
                <span>{stats.avgRating} Avg</span>
            </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-2">
             <!-- Client Filter -->
             <div class="join">
                <button class="join-item btn btn-sm btn-ghost px-2 pointer-events-none">
                     <Filter class="w-4 h-4" />
                </button>
                <select class="select select-bordered select-sm join-item" bind:value={selectedClientId}>
                    <option value="all">All Clients</option>
                    {#if albumQuery.data?.clients}
                        {#each albumQuery.data.clients as c}
                            <option value={c.client.id}>{c.client.displayName}</option>
                        {/each}
                    {/if}
                </select>
            </div>

            <!-- Flag Filter -->
            <select class="select select-bordered select-sm" bind:value={selectedFlag}>
                <option value="all">Check All</option>
                <option value="pick">Picks Only</option>
                <option value="reject">Rejects Only</option>
                <option value="none">Unflagged</option>
            </select>

            <!-- Sort -->
             <div class="join">
                <button class="join-item btn btn-sm btn-ghost px-2 pointer-events-none">
                     <ArrowUpDown class="w-4 h-4" />
                </button>
                <select class="select select-bordered select-sm join-item" bind:value={sortOrder}>
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="rating-desc">Highest Rated</option>
                    <option value="picks-desc">Most Picks</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Upload Section -->
    <div
        class="bg-base-100 border-2 border-dashed border-base-300 rounded-[2rem] p-10 text-center hover:border-primary/50 transition-colors group relative overflow-hidden"
    >
        <input
            type="file"
            multiple
            accept="image/*"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onchange={handleFileSelect}
            disabled={uploadMutation.isPending}
        />

        <div class="space-y-4 relative z-0 pointer-events-none">
            <div
                class="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500"
            >
                {#if uploadMutation.isPending}
                    <Loader2 class="w-8 h-8 animate-spin text-primary" />
                {:else}
                    <Upload
                        class="w-8 h-8 opacity-40 group-hover:text-primary transition-colors"
                    />
                {/if}
            </div>
            <div>
                <h3 class="text-xl font-bold tracking-tight">
                    {uploadMutation.isPending
                        ? "Uploading..."
                        : "Drop photos here"}
                </h3>
                <p class="text-sm opacity-50 font-medium italic mt-1">
                    {#if files && files.length > 0}
                        {files.length} files selected
                    {:else}
                        or click to browse
                    {/if}
                </p>
            </div>
        </div>
    </div>

    {#if files && !uploadMutation.isPending}
        <div class="flex justify-end animate-in fade-in slide-in-from-bottom-4">
            <button
                class="btn btn-primary rounded-xl font-bold px-8 shadow-xl shadow-primary/20"
                onclick={handleUpload}
            >
                Start Upload
            </button>
        </div>
    {/if}

    <!-- Progress List -->
    {#if Object.keys(uploadStatus).length > 0}
        <div
            class="space-y-2 bg-base-100 p-6 rounded-2xl border border-base-300"
        >
            <h3
                class="font-bold text-sm uppercase opacity-50 tracking-widest mb-4"
            >
                Upload Status
            </h3>
            {#each Object.entries(uploadStatus) as [name, status]}
                <div
                    class="flex items-center justify-between text-sm p-3 bg-base-200/50 rounded-xl"
                >
                    <span class="truncate max-w-xs font-medium">{name}</span>
                    <div class="flex items-center gap-2">
                        {#if status === "pending"}
                            <span class="loading loading-spinner loading-xs"
                            ></span>
                        {:else if status === "success"}
                            <span
                                class="text-primary flex items-center gap-1 font-bold text-xs bg-primary/10 px-2 py-1 rounded-lg"
                            >
                                <Check class="w-3 h-3" /> Done
                            </span>
                        {:else}
                            <span
                                class="text-error flex items-center gap-1 font-bold text-xs bg-error/10 px-2 py-1 rounded-lg"
                            >
                                <X class="w-3 h-3" /> Error
                            </span>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Gallery Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#if imagesQuery.isLoading}
            {#each Array(4) as _}
                <div
                    class="aspect-square bg-base-200 rounded-2xl animate-pulse"
                ></div>
            {/each}
        {:else if imagesQuery.isError}
            <div class="col-span-full py-20 text-center opacity-50 text-error">
                <p class="font-bold">Failed to load images</p>
            </div>
        {:else if filteredImages.length === 0}
             <div class="col-span-full py-20 text-center opacity-50">
                <ImageIcon class="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p class="font-bold text-lg">No photos match filter</p>
            </div>
        {:else}
            {#each filteredImages as img}
                <a
                    href="/albums/{albumId}/images/{img.id}"
                    class="group relative aspect-square bg-base-200 rounded-2xl overflow-hidden border border-base-300 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                    {#if img.urlThumb}
                        <img
                            src={img.urlThumb}
                            alt={img.filename}
                            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                        />
                    {:else}
                        <div
                            class="w-full h-full flex items-center justify-center bg-base-300"
                        >
                            <ImageIcon class="w-8 h-8 opacity-20" />
                        </div>
                    {/if}

                    <!-- Feedback Overlays -->
                    {#if img.feedback?.length}
                        <div class="absolute top-2 right-2 flex gap-1">
                            <!-- Show filtering context aware feedback if possible, or all -->
                            {#if img.feedback.some(f => (selectedClientId === 'all' || f.clientUserId === selectedClientId) && f.flag === 'pick')}
                                <div class="bg-primary text-primary-content p-1.5 rounded-full shadow-lg">
                                    <Heart class="w-3 h-3 fill-current" />
                                </div>
                            {/if}
                             {#if img.feedback.some(f => (selectedClientId === 'all' || f.clientUserId === selectedClientId) && f.flag === 'reject')}
                                <div class="bg-error text-error-content p-1.5 rounded-full shadow-lg">
                                    <XCircle class="w-3 h-3" />
                                </div>
                            {/if}
                             {#if img.feedback.some(f => (selectedClientId === 'all' || f.clientUserId === selectedClientId) && f.rating)}
                                <div class="bg-warning text-warning-content px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 text-[10px] font-bold">
                                    <Star class="w-3 h-3 fill-current" />
                                    {Math.max(...img.feedback.filter(f => selectedClientId === 'all' || f.clientUserId === selectedClientId).map(f => f.rating || 0))}
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <div
                        class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                        <p class="text-white text-xs font-bold truncate">
                            {img.filename}
                        </p>
                        <p
                            class="text-white/60 text-[10px] font-mono mt-0.5 uppercase tracking-wider"
                        >
                            {img.status}
                        </p>
                    </div>
                </a>
            {/each}
        {/if}
    </div>
</div>
