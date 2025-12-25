<script lang="ts">
	import {
		LayoutDashboard,
		Users,
		Image as ImageIcon,
		Camera,
        Heart,
        Star,
        MessageSquare
	} from "lucide-svelte";
	import { useDashboard } from "$lib/composables/useDashboard";

	const { statsQuery, activityQuery, metrics } = useDashboard();
</script>

<div class="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
	<header
		class="flex flex-col md:flex-row md:items-end justify-between gap-6"
	>
		<div>
			<h1 class="text-4xl lg:text-5xl font-black tracking-tighter">
				Dashboard
			</h1>
			<p class="text-lg opacity-60 font-medium italic mt-2">
				Overview of your photography workspace
			</p>
		</div>
		<div class="flex gap-3">
			<a
				href="/albums"
				class="btn btn-primary rounded-2xl font-bold shadow-lg shadow-primary/20"
			>
				<Camera class="w-5 h-5 mr-2" />
				Quick Upload
			</a>
		</div>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<div class="stats shadow-xl border border-base-300 rounded-3xl bg-base-100 p-2">
			<div class="stat">
				<div class="stat-figure text-primary">
					<ImageIcon class="w-8 h-8 opacity-20" />
				</div>
				<div class="stat-title font-bold uppercase tracking-widest text-xs opacity-50">Albums</div>
				<div class="stat-value text-3xl font-black mt-1">
                    {#if statsQuery.isLoading}<span class="loading loading-dots loading-sm"></span>
                    {:else}{metrics.totalAlbums}{/if}
                </div>
			</div>
		</div>

		<div class="stats shadow-xl border border-base-300 rounded-3xl bg-base-100 p-2">
			<div class="stat">
				<div class="stat-figure text-secondary">
					<Users class="w-8 h-8 opacity-20" />
				</div>
				<div class="stat-title font-bold uppercase tracking-widest text-xs opacity-50">Clients</div>
				<div class="stat-value text-3xl font-black mt-1">
                    {#if statsQuery.isLoading}<span class="loading loading-dots loading-sm"></span>
                    {:else}{metrics.totalClients}{/if}
                </div>
			</div>
		</div>

        <div class="stats shadow-xl border border-base-300 rounded-3xl bg-base-100 p-2">
			<div class="stat">
				<div class="stat-figure text-accent">
					<Heart class="w-8 h-8 opacity-20" />
				</div>
				<div class="stat-title font-bold uppercase tracking-widest text-xs opacity-50">Total Picks</div>
				<div class="stat-value text-3xl font-black mt-1">
                    {#if statsQuery.isLoading}<span class="loading loading-dots loading-sm"></span>
                    {:else}{metrics.totalPicks}{/if}
                </div>
			</div>
		</div>

        <div class="stats shadow-xl border border-base-300 rounded-3xl bg-base-100 p-2">
			<div class="stat">
				<div class="stat-figure text-warning">
					<Star class="w-8 h-8 opacity-20 border-warning" />
				</div>
				<div class="stat-title font-bold uppercase tracking-widest text-xs opacity-50">Avg Rating</div>
				<div class="stat-value text-3xl font-black mt-1">
                    {#if statsQuery.isLoading}<span class="loading loading-dots loading-sm"></span>
                    {:else}{metrics.avgRating}{/if}
                </div>
			</div>
		</div>
	</div>

	<section
		class="bg-base-100 rounded-[2.5rem] border border-base-300 shadow-2xl p-10 mt-12 overflow-hidden relative"
	>
		<div
			class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"
		></div>
		<div class="flex items-center justify-between mb-8 relative">
			<h2 class="text-2xl font-black tracking-tight italic">
				Recent Activity
			</h2>
			<a
				href="/albums"
				class="btn btn-sm btn-ghost rounded-xl font-bold italic"
				>See All</a
			>
		</div>

		<div class="space-y-6 relative">
		<div class="space-y-4 relative">
			{#if activityQuery.isLoading}
				<div class="flex justify-center p-8">
					<span class="loading loading-spinner text-primary"></span>
				</div>
			{:else}
				{#each (activityQuery.data ?? []) as item}
					<div class="flex items-start gap-4 p-4 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors">
                        <div class="mt-1">
                            {#if item.type === 'comment'}
                                <div class="bg-blue-500/10 text-blue-500 p-2 rounded-lg">
                                    <MessageSquare class="w-5 h-5" />
                                </div>
                            {:else}
                                <div class="bg-pink-500/10 text-pink-500 p-2 rounded-lg">
                                    <Heart class="w-5 h-5" />
                                </div>
                            {/if}
                        </div>
                        <div class="flex-1">
                             {#if item.type === 'comment'}
                                <p class="font-bold text-sm">New Comment</p>
                                <p class="text-sm opacity-70 line-clamp-2">"{item.data.body}"</p>
                             {:else}
                                <p class="font-bold text-sm">Feedback Received</p>
                                <p class="text-sm opacity-70">
                                    Client marked <b>{item.imageFilename || 'Image'}</b> as <span class="badge badge-sm badge-neutral">{item.data.flag}</span>
                                    {#if item.data.rating} with {item.data.rating} stars{/if}
                                </p>
                             {/if}
                             <p class="text-xs opacity-40 mt-1">{new Date(item.date).toLocaleString()}</p>
                        </div>
                    </div>
				{/each}

				{#if (activityQuery.data || []).length === 0}
					<div class="text-center py-8 opacity-50 italic">
						No recent activity.
					</div>
				{/if}
			{/if}
		</div>
		</div>
	</section>
</div>
