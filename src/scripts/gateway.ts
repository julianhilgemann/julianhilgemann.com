/**
 * Gateway pages (/start, /hub, /de/hub). Same vocabulary as the homepage:
 * the hero's node network behind glass, a masked-line intro, spotlight cards.
 *
 * Hooks:
 *   [data-network]         wrapper that sizes the canvas and takes the pointer
 *   [data-network-canvas]  node network (NetworkBackdrop.astro)
 *   [data-greeting]        /start headline; [data-greeting-word] rolls between
 *                          data-greeting-en and data-greeting-de
 *   [data-lang-card]       language option ("en" | "de"); the one matching the
 *                          browser language is outlined, hovering it pins the greeting
 *   (load intro: [data-page-title], [data-intro-fade], [data-intro-stagger] via playIntro)
 */
import { gsap, reducedMotion, initPageMotion, playIntro } from "./motion";
import { initHeroNetwork } from "./hero-network";

type Lang = "en" | "de";

const wrap = document.querySelector<HTMLElement>("[data-network]");
const canvas = wrap?.querySelector<HTMLCanvasElement>("[data-network-canvas]");
if (wrap && canvas) initHeroNetwork(wrap, canvas, reducedMotion);

suggestLanguage();

if (initPageMotion()) {
    playIntro((tl) => greeting(tl));
}

/** Outline the option matching the browser language — the likely choice. */
function suggestLanguage() {
    const preferred = (navigator.languages?.[0] ?? navigator.language ?? "en").toLowerCase();
    const lang: Lang = preferred.startsWith("de") ? "de" : "en";
    document.querySelectorAll<HTMLElement>("[data-lang-card]").forEach((card) => {
        card.classList.toggle("is-suggested", card.dataset.langCard === lang);
    });
}

function greeting(tl: gsap.core.Timeline) {
    const heading = document.querySelector<HTMLElement>("[data-greeting]");
    const word = heading?.querySelector<HTMLElement>("[data-greeting-word]");
    if (!heading || !word) return;
    const words: Record<Lang, string> = {
        en: heading.dataset.greetingEn ?? word.textContent ?? "",
        de: heading.dataset.greetingDe ?? word.textContent ?? "",
    };

    // Rise in exactly like a masked headline line; the mask is in the markup.
    gsap.set(heading, { autoAlpha: 1 });
    tl.from(word, { yPercent: 110, duration: 1.15, ease: "expo.out" }, 0);

    let current: Lang = "en";
    let pinned: Lang | null = null;
    // Kill the whole previous roll, not just its tweens: its pending text
    // swap would otherwise land after a newer one.
    let roll: gsap.core.Timeline | null = null;
    const show = (lang: Lang) => {
        if (lang === current) return;
        current = lang;
        roll?.kill();
        roll = gsap
            .timeline()
            .to(word, { yPercent: -110, duration: 0.35, ease: "power2.in" })
            .add(() => (word.textContent = words[lang]))
            .fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.out" });
    };

    // Alternate between the two greetings, starting from the markup's English.
    const other = (lang: Lang): Lang => (lang === "en" ? "de" : "en");
    let next: Lang = "de";
    const tick = () => {
        if (!pinned) {
            show(next);
            next = other(next);
        }
        gsap.delayedCall(2.6, tick);
    };
    gsap.delayedCall(2.4, tick);

    // Pointing at (or tabbing to) a language answers in that language.
    document.querySelectorAll<HTMLElement>("[data-lang-card]").forEach((card) => {
        const lang = card.dataset.langCard as Lang;
        const pin = () => {
            pinned = lang;
            show(lang);
            next = other(lang);
        };
        const unpin = () => (pinned = null);
        card.addEventListener("pointerenter", pin);
        card.addEventListener("focus", pin);
        card.addEventListener("pointerleave", unpin);
        card.addEventListener("blur", unpin);
    });
}
