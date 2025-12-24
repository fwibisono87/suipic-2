<script lang="ts">
    import {
        ArrowRight,
        Camera,
        CheckCircle,
        ShieldCheck,
        Zap,
    } from "lucide-svelte";
</script>

<div class="hero min-h-[calc(100vh-64px)] bg-base-200 overflow-hidden relative">
    <!-- Decorative blobs -->
    <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"
    ></div>
    <div
        class="absolute top-1/2 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 1s"
    ></div>

    <div
        class="hero-content text-center flex-col lg:flex-row-reverse max-w-7xl gap-12 lg:gap-20"
    >
        <div class="relative group">
            <div
                class="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"
            ></div>
            <div
                class="relative bg-base-100 p-2 rounded-2xl shadow-2xl border border-base-300 max-w-md lg:max-w-xl"
            >
                <img
                    src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=1200"
                    alt="Photographer workflow"
                    class="rounded-xl"
                />
                <div
                    class="absolute -bottom-6 -right-6 lg:-right-10 bg-base-100 p-4 rounded-xl shadow-xl border border-base-300 hidden md:flex items-center gap-4 animate-bounce"
                >
                    <div class="bg-success/20 text-success p-2 rounded-full">
                        <CheckCircle class="w-6 h-6" />
                    </div>
                    <div class="text-left leading-none">
                        <p class="font-bold">Client Review</p>
                        <p class="text-xs opacity-60 italic">
                            9 photos selected
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="lg:text-left flex-1">
            <div
                class="badge badge-outline badge-primary mb-6 font-bold py-3 px-4 italic animate-slide"
            >
                INVITE ONLY CMS
            </div>
            <h1
                class="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] lg:leading-[0.85] mb-8"
            >
                Elevate Your <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"
                    >Workflow</span
                ><br />
                with Streamlined Proofing
            </h1>
            <p
                class="py-6 text-lg lg:text-xl opacity-80 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
            >
                The elite hub for professional photographers. Share rushes,
                collect feedback, and finalize picks with a secure,
                high-performance interface.
            </p>

            <div
                class="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start"
            >
                <a
                    href="/login"
                    class="btn btn-primary btn-lg rounded-2xl group shadow-lg shadow-primary/20"
                >
                    Access Workspace
                    <ArrowRight
                        class="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    />
                </a>
                <button
                    class="btn btn-outline btn-lg rounded-2xl border-2 italic"
                >
                    Request Invitation
                </button>
            </div>

            <div
                class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 border-t border-base-300 pt-12"
            >
                <div class="flex items-center gap-3">
                    <Zap class="w-5 h-5 text-secondary" />
                    <span
                        class="text-sm font-bold italic tracking-tight uppercase opacity-70"
                        >WebP Optimized</span
                    >
                </div>
                <div class="flex items-center gap-3">
                    <ShieldCheck class="w-5 h-5 text-secondary" />
                    <span
                        class="text-sm font-bold italic tracking-tight uppercase opacity-70"
                        >Keycloak IAM</span
                    >
                </div>
                <div class="flex items-center gap-3">
                    <Camera class="w-5 h-5 text-secondary" />
                    <span
                        class="text-sm font-bold italic tracking-tight uppercase opacity-70"
                        >Full Metadata</span
                    >
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    @keyframes slide {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-slide {
        animation: slide 0.6s ease-out forwards;
    }
</style>
