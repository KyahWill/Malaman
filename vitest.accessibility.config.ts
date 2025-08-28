import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.accessibility.{test,spec}.{js,ts}'],
		environment: 'happy-dom',
		setupFiles: ['./src/test/setup.ts', './src/test/accessibility-setup.ts'],
		globals: true,
		testTimeout: 10000, // Accessibility tests may take longer
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: true
			}
		}
	}
});