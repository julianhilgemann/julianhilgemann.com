import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '../src');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const PUBLIC_DIR = path.join(__dirname, '../public');
const DOCS_DIR = path.join(PUBLIC_DIR, 'docs');

async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

function cleanContent(content) {
    let text = content;

    // Remove frontmatter
    text = text.replace(/^---[\s\S]*?---/, '');

    // Remove style and script blocks
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Remove import statements
    text = text.replace(/^import\s+.*$/gm, '');

    // Remove JSX artifacts (heuristics)
    // Remove logical blocks like {condition && ...} or {map(...)}
    // This is aggressive but necessary to remove code noise
    text = text.replace(/\{[^}]*?&&[^}]*?\}/g, ''); // Simple inline conditionals
    text = text.replace(/\{[^}]*?\.map\([^}]*?\)[^}]*?\}/g, ''); // Maps

    // Attempt to keep simple variables like {title} -> title
    text = text.replace(/\{([a-zA-Z0-9_.]+)\}/g, '$1');

    // Remove remaining brace blocks that look like code
    text = text.replace(/\{[\s\S]*?\}/g, '');

    // Convert common HTML tags to Markdown
    text = text
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<!--[\s\S]*?-->/g, ''); // Remove comments

    // Strip remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Remove likely leftover code artifacts
    text = text.replace(/^\s*[})\];]+\s*$/gm, '');

    // Remove multiple blank lines
    text = text.replace(/\n\s*\n/g, '\n\n').trim();

    return text;
}

async function processFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const filename = path.basename(filePath, '.astro');
        const cleanText = cleanContent(content);
        return { filename, content: cleanText };
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e);
        return null;
    }
}

async function getAstroFiles(dir) {
    try {
        const files = await fs.readdir(dir);
        return files.filter(file => file.endsWith('.astro')).map(file => path.join(dir, file));
    } catch (e) {
        return [];
    }
}

async function main() {
    await ensureDir(DOCS_DIR);

    let fullContent = '';

    // 1. Process Pages
    console.log('Processing pages...');
    const pageFiles = await getAstroFiles(PAGES_DIR);
    fullContent += '# Pages\n\n';

    for (const filePath of pageFiles) {
        if (path.basename(filePath) === '404.astro') continue;

        const result = await processFile(filePath);
        if (!result) continue;
        const { filename, content } = result;

        // Write individual doc
        const docPath = path.join(DOCS_DIR, `${filename}.md`);
        await fs.writeFile(docPath, `# ${filename}\n\n${content}`);
        console.log(`Generated ${docPath}`);

        // Append to full content
        fullContent += `## ${filename}\n\n${content}\n\n---\n\n`;
    }

    // 2. Process Components
    console.log('Processing components...');
    const componentFiles = await getAstroFiles(COMPONENTS_DIR);
    fullContent += '# Components\n\n';

    for (const filePath of componentFiles) {
        const result = await processFile(filePath);
        if (!result) continue;
        const { filename, content } = result;

        // Components basically just go into the full dump
        fullContent += `## ${filename}\n\n${content}\n\n---\n\n`;
    }

    // Write llms-full.txt
    const fullPath = path.join(PUBLIC_DIR, 'llms-full.txt');
    await fs.writeFile(fullPath, fullContent);
    console.log(`Generated ${fullPath}`);
}

main().catch(console.error);
