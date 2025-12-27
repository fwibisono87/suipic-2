<script lang="ts">
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
	import { browser } from "$app/environment";
	import {
		Camera,
		Image,
		LayoutDashboard,
		LogIn,
		Menu,
		User,
		Users,
	} from "lucide-svelte";
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 1000 * 60 * 5, // 5 minutes
			},
		},
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SuiPic | Photographer Portfolio & Client Proofing</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="drawer lg:drawer-open" data-theme="dark">
		<input id="main-drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content flex flex-col min-h-screen">
			<!-- Top Navbar -->
			<div class="navbar bg-base-100 border-b border-base-300 lg:hidden">
				<div class="flex-none">
					<label for="main-drawer" class="btn btn-square btn-ghost">
						<Menu class="w-6 h-6" />
					</label>
				</div>
				<div class="flex-1 px-2 mx-2 font-bold text-xl tracking-tight">
					<span class="text-primary">Sui</span>Pic
				</div>
				<div class="flex-none">
					<button class="btn btn-square btn-ghost">
						<User class="w-6 h-6" />
					</button>
				</div>
			</div>

			<!-- Main content -->
			<main class="flex-grow">
				{@render children()}
			</main>

			<!-- Footer (optional for MVP) -->
			<footer
				class="footer footer-center p-4 bg-base-100 text-base-content border-t border-base-300"
			>
				<div>
					<p>© 2025 SuiPic - Invite-only Photography CMS</p>
				</div>
			</footer>
		</div>

		<!-- Sidebar Drawer -->
		<div class="drawer-side z-50">
			<label for="main-drawer" class="drawer-overlay"></label>
			<aside
				class="bg-base-200 w-80 min-h-screen border-r border-base-300"
			>
				<div class="px-6 py-8 flex items-center gap-3">
					<div
						class="bg-primary text-primary-content p-2 rounded-xl shadow-lg ring-4 ring-primary/20"
					>
						<Camera class="w-8 h-8" />
					</div>
					<span class="text-2xl font-black tracking-tighter">
						<span class="text-primary">Sui</span>Pic
					</span>
				</div>

				<ul class="menu p-4 w-full text-base-content space-y-2">
					<li
						class="menu-title opacity-40 uppercase text-xs font-bold tracking-widest mt-4 px-4"
					>
						Navigation
					</li>
					<li>
						<a
							href="/"
							class="flex items-center gap-4 py-3 active:bg-primary"
						>
							<LayoutDashboard class="w-5 h-5" />
							<span>Landing</span>
						</a>
					</li>
					<li>
						<a href="/login" class="flex items-center gap-4 py-3">
							<LogIn class="w-5 h-5" />
							<span>Login</span>
						</a>
					</li>

					<li
						class="menu-title opacity-40 uppercase text-xs font-bold tracking-widest mt-8 px-4"
					>
						Workspace
					</li>
					<li>
						<a
							href="/albums"
							class="flex items-center gap-4 py-3 group"
						>
							<Image
								class="w-5 h-5 group-hover:text-primary transition-colors"
							/>
							<span>Albums</span>
						</a>
					</li>

					<li
						class="menu-title opacity-40 uppercase text-xs font-bold tracking-widest mt-8 px-4"
					>
						Admin
					</li>
					<li>
						<a
							href="/admin/photographers"
							class="flex items-center gap-4 py-3 group"
						>
							<Camera
								class="w-5 h-5 group-hover:text-primary transition-colors"
							/>
							<span>Photographers</span>
						</a>
					</li>
					<li>
						<a
							href="/admin/users"
							class="flex items-center gap-4 py-3 group"
						>
							<Users
								class="w-5 h-5 group-hover:text-primary transition-colors"
							/>
							<span>Users</span>
						</a>
					</li>
				</ul>

				<div class="absolute bottom-8 left-0 w-full px-6">
					<div
						class="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm flex items-center gap-4"
					>
						<div class="avatar placeholder">
							<div
								class="bg-neutral text-neutral-content rounded-full w-10"
							>
								<span>?</span>
							</div>
						</div>
						<div class="flex-1 overflow-hidden">
							<p class="text-sm font-bold truncate italic">
								Guest User
							</p>
							<p class="text-xs opacity-50 truncate">
								Sign in to begin
							</p>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</QueryClientProvider>

<style>
	:global(body) {
		@apply transition-colors duration-300;
	}
</style>
