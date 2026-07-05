import { defineConfig } from 'vitest/config';

// Standalone config: the unit tests target framework-agnostic TS modules
// (e.g. the DSLR agent client), so we skip the app's Vite plugins and run in a
// plain Node environment.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['resources/js/**/*.test.ts'],
    },
});
