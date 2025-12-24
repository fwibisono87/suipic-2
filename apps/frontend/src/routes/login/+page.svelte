<script lang="ts">
	import { Lock, Mail, ArrowRight } from 'lucide-svelte';
</script>

<div class="min-h-[calc(100vh-64px-56px)] flex items-center justify-center p-6 bg-base-200/50">
	<div class="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 rounded-3xl overflow-hidden animate-slide">
		<div class="bg-primary p-12 text-center text-primary-content relative overflow-hidden">
			<!-- Decoration -->
			<div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
			
			<div class="bg-white/20 p-4 rounded-2xl w-fit mx-auto backdrop-blur-md mb-6 ring-1 ring-white/30">
				<Lock class="w-10 h-10" />
			</div>
			<h2 class="text-3xl font-black tracking-tighter">Sign In</h2>
			<p class="opacity-80 font-medium italic">Welcome to the inner circle</p>
		</div>

		<div class="card-body p-10 gap-6">
			<div class="form-control">
				<label class="label" for="email">
					<span class="label-text font-bold uppercase tracking-widest text-xs opacity-50">Email Address</span>
				</label>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-40">
						<Mail class="w-5 h-5" />
					</div>
					<input id="email" type="email" placeholder="photographer@suipic.test" class="input input-bordered w-full pl-12 rounded-2xl focus:input-primary transition-all font-medium" />
				</div>
			</div>

			<div class="form-control">
				<div class="flex justify-between items-end mb-2">
					<label class="label-text font-bold uppercase tracking-widest text-xs opacity-50" for="password">Password</label>
					<button type="button" class="text-xs font-bold text-primary hover:underline italic">Help?</button>
				</div>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-40">
						<Lock class="w-5 h-5" />
					</div>
					<input id="password" type="password" placeholder="••••••••" class="input input-bordered w-full pl-12 rounded-2xl focus:input-primary transition-all font-medium" />
				</div>
			</div>

			<div class="mt-4">
				<button class="btn btn-primary btn-block rounded-2xl font-black group h-14">
					AUTHENTICATE
					<ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
				</button>
			</div>

			<div class="divider text-xs font-bold opacity-30 italic">OIDC MANAGED</div>

			<p class="text-center text-xs italic font-medium opacity-60 leading-relaxed px-4">
				This instance of SuiPic is secured by Keycloak. 
				Authentication follows the OpenID Connect standard.
			</p>
		</div>
	</div>
</div>

<style>
	@keyframes slide {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-slide {
		animation: slide 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
