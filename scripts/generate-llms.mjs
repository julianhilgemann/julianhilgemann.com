import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '../src');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const PUBLIC_DIR = path.join(__dirname, '../public');
const DOCS_DIR = path.join(PUBLIC_DIR, 'docs');

// Hand-written reference doc that lives in public/docs but is NOT generated.
// Never delete or overwrite it during cleanup.
const PRESERVE_IN_DOCS = new Set(['llmcntxt.md']);

const SKIP_PAGES = new Set(['404']);

const PRICING_CONFIG = path.join(SRC_DIR, 'data', 'pricing-config.json');
// Pages whose real content lives in data rather than markup.
const ENRICHED_PAGES = new Set(['services', 'de/services']);

const SITE_TITLE = 'Julian Hilgemann — Power BI & Microsoft Fabric Decision Systems';
const SITE_SUMMARY =
    'Portfolio and technical documentation for Julian Hilgemann, an analytics engineer building production Power BI and Microsoft Fabric systems: semantic models, KPI and metric layers, forecasting, and decision interfaces. Published in English at / and in German at /de/.';

// Keyed by page path relative to src/pages, without the .astro extension.
// `group` controls which H2 the link lands under in llms.txt.
const PAGE_META = {
    index: {
        title: 'Home',
        group: 'en',
        desc: 'Landing page: positioning statement and summaries of current open-source data projects.',
    },
    about: {
        title: 'About',
        group: 'en',
        desc: 'Working philosophy and experience: multi-tenant Microsoft Fabric product work, semantic model scale, TMDL and Git-based workflow, and forecasting background.',
    },
    services: {
        title: 'Services & Pricing',
        group: 'en',
        desc: 'Service packages, deliverables, engineering and design standards, and the interactive pricing calculator.',
    },
    'page-engine': {
        title: 'Page Engine',
        group: 'en',
        desc: 'Technical architecture of the decision engine: signal ingestion, modeling, forecasting, and delivery layers.',
    },
    hub: {
        title: 'Link Hub',
        group: 'en',
        desc: 'Contact and profile links: GitHub, LinkedIn, and a downloadable vCard.',
    },
    start: {
        title: 'Language Select',
        group: 'en',
        desc: 'Entry gateway routing visitors to the English or German version of the site.',
    },
    'de/index': {
        title: 'Startseite',
        group: 'de',
        desc: 'German landing page: positioning statement and current open-source data projects.',
    },
    'de/about': {
        title: 'Über mich',
        group: 'de',
        desc: 'German about page: working philosophy, Microsoft Fabric product work, semantic model scale, and forecasting background.',
    },
    'de/services': {
        title: 'Leistungen & Preise',
        group: 'de',
        desc: 'German services page: packages, deliverables, delivery standards, and the pricing calculator.',
    },
    'de/page-engine': {
        title: 'Page Engine (DE)',
        group: 'de',
        desc: 'German version of the decision engine architecture breakdown.',
    },
    'de/hub': {
        title: 'Link Hub (DE)',
        group: 'de',
        desc: 'German contact and profile link hub.',
    },
    impressum: {
        title: 'Impressum',
        group: 'legal',
        desc: 'Legal notice under § 5 TMG: operator identity, address, and contact.',
    },
    datenschutz: {
        title: 'Privacy Policy',
        group: 'legal',
        desc: 'GDPR privacy policy: hosting, Google Analytics 4 consent handling, data categories, third-country transfers, and data subject rights.',
    },
    'cookie-einstellungen': {
        title: 'Cookie Settings',
        group: 'legal',
        desc: 'Cookie preference management.',
    },
    'de/impressum': { title: 'Impressum (DE)', group: 'legal', desc: 'German legal notice under § 5 TMG.' },
    'de/datenschutz': { title: 'Datenschutz (DE)', group: 'legal', desc: 'German GDPR privacy policy.' },
    'de/cookie-einstellungen': {
        title: 'Cookie-Einstellungen (DE)',
        group: 'legal',
        desc: 'German cookie preference management.',
    },
};

const GROUP_HEADINGS = [
    ['en', '## Core Pages (English)'],
    ['de', '## Core Pages (German)'],
    ['legal', '## Legal & Site Utilities'],
];

// Stable ordering: most semantically valuable first, so an agent reading
// top-down hits the substantive pages before the legal boilerplate.
const PAGE_ORDER = [
    'index',
    'about',
    'services',
    'page-engine',
    'hub',
    'start',
    'de/index',
    'de/about',
    'de/services',
    'de/page-engine',
    'de/hub',
    'impressum',
    'datenschutz',
    'cookie-einstellungen',
    'de/impressum',
    'de/datenschutz',
    'de/cookie-einstellungen',
];

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

/** Recursively collect .astro files, returning paths relative to `root`. */
async function getAstroFiles(root, sub = '') {
    const dir = path.join(root, sub);
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return [];
    }

    const found = [];
    for (const entry of entries) {
        const rel = sub ? path.join(sub, entry.name) : entry.name;
        if (entry.isDirectory()) {
            found.push(...(await getAstroFiles(root, rel)));
        } else if (entry.name.endsWith('.astro')) {
            found.push(rel);
        }
    }
    return found.sort();
}

/**
 * Remove every {...} expression, tracking nesting depth so that Astro/JSX
 * blocks containing their own braces (`{items.map(i => (<a>{i.name}</a>))}`)
 * are consumed whole instead of being cut at the first closing brace.
 */
function stripExpressions(text) {
    let out = '';
    let depth = 0;
    for (const ch of text) {
        if (ch === '{') {
            depth++;
        } else if (ch === '}') {
            if (depth > 0) depth--;
        } else if (depth === 0) {
            out += ch;
        }
    }
    return out;
}

const stripTags = (s) => s.replace(/<[^>]*>/g, '');
const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Build a tag matcher. The lookahead is essential: `<p[^>]*>` also matches
 * `<path>`, `<li…>` matches `<link>`, `<b…>` matches `<body>`. Without it a
 * lazy match runs from an SVG path across whatever follows to the first real
 * closing tag, swallowing headings into paragraphs.
 */
const openTag = (name) => `<${name}(?=[\\s/>])[^>]*>`;

/** Flatten an inline fragment to Markdown, collapsing source indentation. */
function inline(fragment) {
    let t = fragment;
    t = t.replace(
        new RegExp(`${openTag('(strong|b)')}([\\s\\S]*?)</\\1>`, 'gi'),
        (_, __, inner) => `**${collapse(stripTags(inner))}**`,
    );
    t = t.replace(
        new RegExp(`${openTag('(em|i)')}([\\s\\S]*?)</\\1>`, 'gi'),
        (_, __, inner) => `*${collapse(stripTags(inner))}*`,
    );
    t = t.replace(
        /<a(?=[\s/>])[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
        (_, href, inner) => `[${collapse(stripTags(inner))}](${href})`,
    );
    t = t.replace(/<br\s*\/?>/gi, ' ');
    return collapse(stripTags(t));
}

function cleanContent(content) {
    let text = content;

    // Order matters: frontmatter, comments and style/script blocks all contain
    // braces, so they must go before expression stripping runs.
    text = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    // Inline icon markup is pure noise once flattened to text.
    text = text.replace(/<svg[\s\S]*?<\/svg>/gi, '');
    text = text.replace(/^import\s+.*$/gm, '');

    text = stripExpressions(text);

    // Block-level tags to Markdown. [\s\S] rather than . so that tags spanning
    // multiple source lines still convert.
    text = text.replace(
        new RegExp(`${openTag('h([1-6])')}([\\s\\S]*?)</h\\1>`, 'gi'),
        (_, level, inner) => `\n\n${'#'.repeat(Number(level))} ${inline(inner)}\n\n`,
    );
    text = text.replace(new RegExp(`${openTag('li')}([\\s\\S]*?)</li>`, 'gi'), (_, inner) => `\n- ${inline(inner)}`);
    text = text.replace(
        new RegExp(`${openTag('blockquote')}([\\s\\S]*?)</blockquote>`, 'gi'),
        (_, inner) => `\n\n> ${inline(inner)}\n\n`,
    );
    text = text.replace(new RegExp(`${openTag('p')}([\\s\\S]*?)</p>`, 'gi'), (_, inner) => `\n\n${inline(inner)}\n\n`);

    // Line breaks sitting outside any block tag would otherwise be dropped
    // silently, running the words on either side together.
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = stripTags(text);

    // Leading whitespace inherited from the .astro source would otherwise be
    // read as Markdown code blocks.
    text = text.replace(/^[ \t]+/gm, '');
    text = text.replace(/[ \t]+$/gm, '');

    // Components driven entirely by client-side data leave behind empty heading
    // shells and decorative glyphs once the markup is flattened.
    text = text
        .split('\n')
        .filter((line) => !/^#{1,6}\s*$/.test(line) && !/^[\s\-—–·•|]+$/.test(line))
        .join('\n');

    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

/**
 * Recursively drop `_`-prefixed keys. These hold internal pricing rationale —
 * the day rate the fixed prices are derived from, the risk buffer, and the
 * lead-handling thresholds. None of it currently reaches the browser and none
 * of it may reach a published file.
 */
function stripInternal(value) {
    if (Array.isArray(value)) return value.map(stripInternal);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => !key.startsWith('_'))
                .map(([key, nested]) => [key, stripInternal(nested)]),
        );
    }
    return value;
}

/**
 * The pricing calculator renders from JSON at runtime, so flattening its markup
 * yields nothing. Rebuild the offering from the same config the UI reads, so
 * the services page stays answerable instead of being an empty shell.
 */
function renderPricing(rawConfig) {
    const config = stripInternal(rawConfig);
    const format = new Intl.NumberFormat('en-US');
    const money = (amount) => `${config.currency} ${format.format(amount)}`;
    const out = [];

    out.push('## Pricing model', '');
    out.push(
        `Fixed-price configurator. ${config.vatNote} Quote valid ${config.validityDays} days. ` +
            `Price list version ${config.priceListVersion}. Entry point: from ${money(config.display.headlineFromPrice)}.`,
        '',
    );

    out.push(`### ${config.base.label}`, '', `${money(config.base.price)}, mandatory.`, '');
    for (const line of config.base.includes ?? []) out.push(`- ${line}`);
    out.push('');

    out.push('### Quantity-based items', '');
    for (const item of config.quantityItems ?? []) {
        out.push(`**${item.label}** (per ${item.unit}, ${item.min}-${item.max}); volume tapering applies.`, '');
        for (const tier of item.tiers ?? []) out.push(`- ${tier.label}: ${money(tier.price)}`);
        out.push('');
    }

    out.push('### Scope options', '');
    for (const item of config.scopeItems ?? []) {
        out.push(`**${item.label}**${item.required ? ' (required)' : ''}`, '');
        for (const option of item.options ?? []) out.push(`- ${option.label}: ${money(option.price)}`);
        out.push('');
    }

    out.push('### Modules', '');
    for (const module of config.modules ?? []) {
        if (module.options) {
            out.push(`**${module.label}**`, '');
            for (const option of module.options) out.push(`- ${option.label}: ${money(option.price)}`);
        } else {
            const value = module.includedByDefault
                ? `included as standard (list value ${money(module.listValue)})`
                : money(module.price);
            out.push(`**${module.label}** — ${value}`, '');
            for (const line of module.includes ?? []) out.push(`- ${line}`);
        }
        out.push('');
    }

    if (config.multipliers?.factors?.length) {
        out.push(`### Complexity factors (combined cap ${config.multipliers.cap}x)`, '');
        for (const factor of config.multipliers.factors) {
            out.push(`- ${factor.label}: +${Math.round(factor.add * 100)}%`);
        }
        out.push('');
    }

    if (config.recurring?.options?.length) {
        out.push(`### Ongoing support (minimum ${config.recurring.minTermMonths} months)`, '');
        for (const option of config.recurring.options) {
            out.push(`- **${option.label}** — ${money(option.monthly)}/month: ${(option.includes ?? []).join('; ')}`);
        }
        out.push('');
    }

    if (config.hourly) {
        const blocks = (config.hourly.blocks ?? [])
            .filter((block) => block.hours > 0)
            .map(
                (block) =>
                    `${block.hours}h ${money(block.price)}${block.discount ? ` (${Math.round(block.discount * 100)}% off)` : ''}`,
            );
        out.push('### Custom work', '', `${config.hourly.label} at ${money(config.hourly.rate)}/hour.`, '');
        if (blocks.length) out.push(`Prepaid blocks: ${blocks.join(', ')}.`, '');
    }

    if (config.excluded?.length) {
        out.push('### Not included', '');
        for (const line of config.excluded) out.push(`- ${line}`);
        out.push('');
    }

    return out.join('\n').trim();
}

/** Absolute paths of components imported directly by a single .astro file. */
function directComponentImports(content, fromDir) {
    const importRe = /import\s+\w+\s+from\s+["']([^"']+\.astro)["']/g;
    const prefix = COMPONENTS_DIR + path.sep;
    const found = [];
    let match;
    while ((match = importRe.exec(content)) !== null) {
        const resolved = path.resolve(fromDir, match[1]);
        if (resolved.startsWith(prefix)) found.push(resolved);
    }
    return found;
}

/** All .astro files imported by `entries`, transitively (pages -> layouts -> components). */
async function collectReachable(entries) {
    const seen = new Set();
    const queue = [...entries];

    while (queue.length) {
        const file = queue.pop();
        if (seen.has(file)) continue;
        seen.add(file);

        const content = await fs.readFile(file, 'utf-8').catch(() => '');
        const importRe = /import\s+\w+\s+from\s+["']([^"']+\.astro)["']/g;
        let match;
        while ((match = importRe.exec(content)) !== null) {
            queue.push(path.resolve(path.dirname(file), match[1]));
        }
    }
    return seen;
}

/** Delete previously generated .md files, leaving hand-written ones intact. */
async function cleanDocs(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        const target = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await cleanDocs(target);
        } else if (entry.name.endsWith('.md') && !PRESERVE_IN_DOCS.has(entry.name)) {
            await fs.rm(target);
        }
    }
}

/**
 * Push headings down `levels` ranks. In llms-full.txt each section is already
 * introduced by an H2, so content keeping its own H1 would outrank its section
 * marker and break heading-based chunking.
 */
function demoteHeadings(markdown, levels) {
    return markdown.replace(/^(#{1,6}) /gm, (_, hashes) => `${'#'.repeat(Math.min(6, hashes.length + levels))} `);
}

function metaFor(slug) {
    return PAGE_META[slug] ?? { title: slug, group: 'en', desc: 'Site page.' };
}

async function main() {
    await ensureDir(DOCS_DIR);
    await cleanDocs(DOCS_DIR);

    const pageFiles = await getAstroFiles(PAGES_DIR);
    const pageSlugs = pageFiles
        .map((rel) => rel.replace(/\.astro$/, '').split(path.sep).join('/'))
        .filter((slug) => !SKIP_PAGES.has(slug));

    const ordered = [
        ...PAGE_ORDER.filter((slug) => pageSlugs.includes(slug)),
        ...pageSlugs.filter((slug) => !PAGE_ORDER.includes(slug)).sort(),
    ];

    const pricingConfig = JSON.parse(await fs.readFile(PRICING_CONFIG, 'utf-8'));
    const pricingMarkdown = renderPricing(pricingConfig);

    let fullContent = '# Pages\n\n';
    const inlined = new Set();

    console.log('Processing pages...');
    for (const slug of ordered) {
        const filePath = path.join(PAGES_DIR, `${slug}.astro`);
        const raw = await fs.readFile(filePath, 'utf-8');
        const parts = [cleanContent(raw)];

        // Several pages are pure component compositions with no markup of their
        // own. Inlining each page's own components keeps its .md substantive
        // rather than empty, which is the whole point of linking to it.
        for (const componentPath of directComponentImports(raw, path.dirname(filePath))) {
            inlined.add(componentPath);
            const componentRaw = await fs.readFile(componentPath, 'utf-8').catch(() => '');
            const componentText = cleanContent(componentRaw);
            if (componentText) parts.push(componentText);
        }

        if (ENRICHED_PAGES.has(slug)) parts.push(pricingMarkdown);

        const content = parts.filter(Boolean).join('\n\n');
        const { title } = metaFor(slug);
        // Most pages open with their own <h1>; don't stack a second one on top.
        const body = content.startsWith('# ') ? content : `# ${title}\n\n${content}`;

        const docPath = path.join(DOCS_DIR, `${slug}.md`);
        await ensureDir(path.dirname(docPath));
        await fs.writeFile(docPath, `${body}\n`);
        console.log(`Generated ${path.relative(PUBLIC_DIR, docPath)}`);

        fullContent += `## ${slug}\n\n${demoteHeadings(content, 2)}\n\n---\n\n`;
    }

    // Only components actually reachable from a page. Prevents orphaned
    // components from asserting stale facts in llms-full.txt. Anything already
    // inlined above is skipped so the file doesn't carry it twice — what's left
    // is the layout-level chrome (header, footer, modals).
    console.log('Processing components...');
    const reachable = await collectReachable(pageFiles.map((rel) => path.join(PAGES_DIR, rel)));
    const componentPrefix = COMPONENTS_DIR + path.sep;
    const components = [...reachable]
        .filter((file) => file.startsWith(componentPrefix) && !inlined.has(file))
        .map((file) => path.relative(COMPONENTS_DIR, file).replace(/\.astro$/, '').split(path.sep).join('/'))
        .sort();

    fullContent += '# Shared Components\n\n';
    for (const name of components) {
        const raw = await fs.readFile(path.join(COMPONENTS_DIR, `${name}.astro`), 'utf-8');
        const content = cleanContent(raw);
        if (!content) continue;
        fullContent += `## ${name}\n\n${demoteHeadings(content, 2)}\n\n---\n\n`;
    }
    console.log(`Included ${components.length} reachable component(s)`);

    await fs.writeFile(path.join(PUBLIC_DIR, 'llms-full.txt'), fullContent);
    console.log('Generated llms-full.txt');

    // llms.txt: the lightweight index. H1 title, blockquote summary with a
    // freshness date, grouped links each carrying a one-sentence description.
    const updated = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    let index = `# ${SITE_TITLE}\n\n> ${SITE_SUMMARY}\n> Updated: ${updated}\n`;

    for (const [group, heading] of GROUP_HEADINGS) {
        const links = ordered.filter((slug) => metaFor(slug).group === group);
        if (!links.length) continue;

        index += `\n${heading}\n`;
        for (const slug of links) {
            const { title, desc } = metaFor(slug);
            index += `- [${title}](/docs/${slug}.md): ${desc}\n`;
        }
    }

    index +=
        '\n## Full Context\n- [Full Documentation](/llms-full.txt): Every page and component combined into a single file for full-context ingestion.\n';

    await fs.writeFile(path.join(PUBLIC_DIR, 'llms.txt'), index);
    console.log('Generated llms.txt');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
