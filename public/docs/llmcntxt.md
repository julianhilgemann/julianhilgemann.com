This cheat sheet reflects the **2026 Industry Standard** for `llms.txt`.

As of 2026, `llms.txt` has evolved from a "nice-to-have" for developers into a critical **Answer Engine Optimization (AEO)** asset. It is the primary interface for AI agents (like Claude, ChatGPT, Cursor, and Windsurf) to ingest your content without the "noise" of HTML.

### **The Core Concept: Map vs. Territory**

You need **two** files at the root of your domain.

1. **`https://yoursite.com/llms.txt`** (The Map): A concise index for navigation.
2. **`https://yoursite.com/llms-full.txt`** (The Territory): Your entire documentation concatenated into one massive file.

---

### **Cheat Sheet: The Do's and Don'ts**

#### **DO: Structure & Formatting**

* **DO** place both files at the **root directory** (`/llms.txt`), not in a subdirectory.
* **DO** use standard **Markdown**. No JSON, no XML, no proprietary tags.
* **DO** start `llms.txt` with an `H1` title and a `> Blockquote` summary. This sets the "System Prompt" context for the agent immediately.
* **DO** group links under clear `H2` headings (e.g., `## Core Concepts`, `## API Reference`).
* **DO** add a 1-sentence description to every link in `llms.txt`.
* *Good:* `- [Authentication](...): Explains OAuth2 flows and how to rotate API keys.`
* *Why:* Agents use this "semantic scent" to decide if a link is worth spending tokens on.



#### **DO: Content Strategy**

* **DO** link to **Markdown source files** (`.md`) instead of HTML pages whenever possible.
* *Pro Tip:* If you can't host raw `.md`, create a "shadow" route (e.g., `/docs/intro.md`) that renders the content stripped of navbars, footers, and scripts.


* **DO** create an `llms-full.txt`.
* *Why:* Coding assistants (Cursor, Windsurf) and Power Users prefer to "ingest everything" in one shot rather than crawling links.


* **DO** include a "Last Updated" date in the header. Agents prioritize fresh data.

#### **DON'T: Common Pitfalls**

* **DON'T** simply copy-paste your `sitemap.xml`. A sitemap is a list of *URLs*; `llms.txt` is a list of *concepts*.
* **DON'T** exceed **10-20KB** for the `llms.txt` file. It must be lightweight enough for an agent to read "for free" before deciding where to go deep.
* **DON'T** link to pages behind authentication (Login walls). If the agent hits a 403, it will likely blacklist your domain for that session.
* **DON'T** use marketing fluff ("World-leading," "Stunning"). Use "semantic" language ("Low-latency," "ACID-compliant").

---

### **The "Gold Standard" Template (2026)**

**File:** `/llms.txt`

```markdown
# Stripe API Documentation

> The official reference for integrating Stripe payments, subscriptions, and financial infrastructure. 
> Updated: Feb 2026

## Core Integration
- [Quickstart Guide](/docs/quickstart.md): Get your first payment intent running in <5 minutes.
- [Authentication](/docs/auth.md): How to manage API keys and rolling secrets.
- [Error Handling](/docs/errors.md): A comprehensive list of HTTP 4xx/5xx codes and retry logic.

## Products
- [Billing](/docs/billing.md): Recurring revenue, invoicing, and subscription lifecycles.
- [Connect](/docs/connect.md): Multi-party payments and platform payouts.

## Full Context
- [Full Documentation](/llms-full.txt): All documentation combined into a single file for full-context ingestion.

```

---

### **Pro-Tip: The "llms-full.txt" Generator**

If you are using a static site generator (Next.js, Hugo, Astro), do not maintain `llms-full.txt` manually. Use a build script to concatenate your content.

**Logic for the script:**

1. Glob all `.md` or `.mdx` files.
2. Sort them logically (e.g., Intro -> Guides -> API).
3. Append the filename as an `H2` header before the content.
4. Write to `public/llms-full.txt`.

### **Verification Checklist**

1. **CURL Test:** Run `curl -I https://yoursite.com/llms.txt`. Ensure `Content-Type` is `text/plain` or `text/markdown`.
2. **Token Count:** Paste `llms.txt` into a tokenizer. Is it < 2,000 tokens? (Ideal).
3. **Agent Simulation:** Paste your `llms.txt` into ChatGPT/Claude and ask: *"Based on this file, where would I find info about [X]?"* If it hesitates, your descriptions are too vague.