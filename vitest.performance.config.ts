import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.performance.{test,spec}.{js,ts}'],
		environment: 'happy-dom',
		setupFiles: ['./src/test/setup.ts'],
		globals: true,
		testTimeout: 30000, // Performance tests may take longer
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: true
			}
		}
	}
});