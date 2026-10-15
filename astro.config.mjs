import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
    site: 'https://julianhilgemann.com',
    integrations: [tailwind()],
    // The site is English-only now. GitHub Pages serves no server
    // redirects, so these are emitted as static pages that meta-refresh to
    // the target and carry a canonical link to it.
    redirects: {
        '/de': '/',
        '/de/about': '/about',
        '/de/projects': '/projects',
        '/de/services': '/services',
        '/de/page-engine': '/page-engine',
        '/de/hub': '/hub',
        // The language picker's only job was choosing a language.
        '/start': '/hub',
        // The Work page became About.
        '/work': '/about',
    },
});
