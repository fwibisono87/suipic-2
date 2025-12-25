import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
	},
	testDir: '.',
    testMatch: '**/*.e2e.ts', // Only run files ending in .e2e.ts
    use: {
        baseURL: 'http://localhost:3000'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        }
    ]
});
