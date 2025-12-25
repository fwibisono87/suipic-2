import { test, expect } from '@playwright/test';

test('Album Upload Flow', async ({ page }) => {
    // 1. Mock API responses
    await page.route('*/**/api/photographer/albums/test-album/images', async route => {
        const method = route.request().method();
        if (method === 'GET') {
            await route.fulfill({ json: [] });
        } else if (method === 'POST') {
            await route.fulfill({ 
                status: 202,
                json: { id: 'img-1', filename: 'photo.jpg', status: 'processing' }
            });
        }
    });

    // 2. Navigate to Album Page
    await page.goto('/albums/test-album');

    // 3. Verify Page Title
    await expect(page.locator('h1')).toContainText('Album Content');
    await expect(page.getByText('ID: test-album')).toBeVisible();

    // 4. Verify Upload UI
    await expect(page.getByText('Drop photos here')).toBeVisible();

    // 5. Simulate File Upload (Hidden Input)
    // Create a dummy file
    const buffer = Buffer.from('fake-image-content');
    
    // Set input files
    await page.locator('input[type="file"]').setInputFiles({
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        buffer
    });

    // 6. Verify "Start Upload" button appears
    await expect(page.getByRole('button', { name: 'Start Upload' })).toBeVisible();

    // 7. Click Upload
    await page.getByRole('button', { name: 'Start Upload' }).click();

    // 8. Verify Status List
    await expect(page.getByText('Upload Status')).toBeVisible();
    await expect(page.getByText('photo.jpg')).toBeVisible();
    
    // 9. Verify Success indicator (Check icon or "Done" text)
    await expect(page.getByText('Done')).toBeVisible();
});
