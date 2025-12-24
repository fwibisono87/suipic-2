<script lang="ts">
	import { LayoutDashboard, Users, Image as ImageIcon, Camera } from 'lucide-svelte';
</script>

<div class="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
	<header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
		<div>
			<h1 class="text-4xl lg:text-5xl font-black tracking-tighter">Dashboard</h1>
			<p class="text-lg opacity-60 font-medium italic mt-2">Overview of your photography workspace</p>
		</div>
		<div class="flex gap-3">
			<button class="btn btn-primary rounded-2xl font-bold shadow-lg shadow-primary/20">
				<Camera class="w-5 h-5 mr-2" />
				Quick Upload
			</button>
		</div>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<div class="stats shadow-xl border border-base-300 rounded-3xl bg-base-100 p-4">
			<div class="stat">
				<div class="stat-figure text-primary">
					<ImageIcon class="w-8 h-8" />
				</div>
				<div class="stat-title font-bold uppercase tracking-widest text-xs opacity-50">Active Albums</div>
				<div class="stat-value text-4xl font-black tracking-tighter mt-1">12</div>
				<div class="stat-desc font-medium mt-1">4 pending feedback</div>
			</div>
		</div>

		<div class="stats shadow-xl border border-base-300 rounded-3xl bg-base-100 p-4">
			<div class="stat">
				<div class="stat-figure text-secondary">
					<Users class="w-8 h-8" />
				</div>
				<div class="stat-title font-bold uppercase tracking-widest text-xs opacity-50">Total Clients</div>
				<div class="stat-value text-4xl font-black tracking-tighter mt-1">28</div>
				<div class="stat-desc font-medium mt-1">2 newly joined</div>
			</div>
		</div>

		<div class="stats shadow-xl border border-base-300 rounded-3xl bg-base-100 p-4">
			<div class="stat">
				<div class="stat-figure text-accent">
					<LayoutDashboard class="w-8 h-8" />
				</div>
				<div class="stat-title font-bold uppercase tracking-widest text-xs opacity-50">Storage Used</div>
				<div class="stat-value text-4xl font-black tracking-tighter mt-1">4.2GB</div>
				<div class="stat-desc font-medium mt-1">42% of 10GB tier</div>
			</div>
		</div>
	</div>

	<section class="bg-base-100 rounded-[2.5rem] border border-base-300 shadow-2xl p-10 mt-12 overflow-hidden relative">
		<div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
		<div class="flex items-center justify-between mb-8 relative">
			<h2 class="text-2xl font-black tracking-tight italic">Recent Activity</h2>
			<button class="btn btn-sm btn-ghost rounded-xl font-bold italic">See All</button>
		</div>

		<div class="space-y-6 relative">
			{#each [1, 2, 3] as i}
				<div class="flex items-center gap-6 p-4 rounded-2xl hover:bg-base-200 transition-colors group cursor-pointer border border-transparent hover:border-base-300">
					<div class="bg-base-300 rounded-xl w-16 h-16 flex-shrink-0 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
						<ImageIcon class="w-6 h-6 opacity-30" />
					</div>
					<div class="flex-1">
						<h3 class="font-bold tracking-tight">Album "Summer Wedding 2025"</h3>
						<p class="text-sm opacity-60">Client <span class="font-bold text-primary">John Doe</span> added 3 comments</p>
					</div>
					<div class="text-right hidden sm:block">
						<p class="text-xs font-bold uppercase tracking-widest opacity-40">2 hours ago</p>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
