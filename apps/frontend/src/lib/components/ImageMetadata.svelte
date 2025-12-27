<script lang="ts">
    import type { TImage } from "$lib/types";

    export let image: TImage;

    // Helper to format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Unknown";
        return new Date(dateStr).toLocaleString();
    };
</script>

<div class="metadata-panel p-4 bg-base-200 rounded-lg text-sm">
    <h3 class="font-semibold mb-2">Image Info</h3>

    <div class="grid grid-cols-2 gap-2">
        <div class="text-base-content/50">Camera:</div>
        <div>{image.make || ""} {image.model || "Unknown"}</div>

        <div class="text-base-content/50">Lens:</div>
        <div>{image.lens || "Unknown"}</div>

        <div class="text-base-content/50">Settings:</div>
        <div>
            {#if image.focalLength}
                {image.focalLength}
            {/if}
            {#if image.aperture}
                {image.aperture}
            {/if}
            {#if image.shutter}
                {image.shutter}s
            {/if}
            {#if image.iso}
                ISO{image.iso}
            {/if}
        </div>

        <div class="text-base-content/50">Captured:</div>
        <div>{formatDate(image.capturedAt)}</div>

        <div class="text-base-content/50">Filename:</div>
        <div class="truncate" title={image.filename}>{image.filename}</div>
    </div>
</div>
