/**
 * All calculator copy, EN + DE.
 *
 * `items[*].includes` absorbs the deliverable bullets that previously lived in
 * IncludedGrid.astro — they now sit against the line item they actually
 * describe, where they double as the "what this includes" detail the spec
 * requires. `alwaysIncluded` carries the cross-cutting standards that don't
 * belong to any single line item.
 */

export type Lang = "en" | "de";

export interface ItemCopy {
    label: string;
    /** Compact label used inside the bar legend where space is tight. */
    short: string;
    includes: string[];
}

export interface LocaleStrings {
    intro: {
        heading: string;
        headingAccent: string;
        body: string[];
        kicker: string;
    };
    sections: Record<"foundation" | "output" | "dataLayer" | "extras", { title: string; hint: string }>;
    controls: {
        sourcesLabel: string;
        sourcesHint: string;
        pagesLabel: string;
        pagesHint: string;
        semanticModelLabel: string;
        semanticModelHint: string;
        transformLabel: string;
        transformHint: string;
        designLabel: string;
        onboardingLabel: string;
        customWorkLabel: string;
        customWorkHint: string;
        complexityLabel: string;
        complexityHint: string;
        reset: string;
        decrease: string;
        increase: string;
    };
    chart: {
        heading: string;
        legendHeading: string;
        freeHeading: string;
        taperNote: (qty: number, unit: string, unitPrice: string, pct: number) => string;
        hoursNote: (hours: number) => string;
        shareOfTotal: string;
    };
    result: {
        totalLabel: string;
        estimateBadge: string;
        oneTime: string;
        disclaimer: string;
        validity: (days: number) => string;
        vat: string;
        excludedHeading: string;
        excluded: string[];
        ongoing: string;
        versionLabel: (version: string) => string;
        softThreshold: string;
        hardThreshold: string;
    };
    warnings: Record<"pagesPerSource" | "advancedNoSources" | "pagesOnCompactModel", string>;
    cta: {
        primary: string;
        primarySub: string;
        copy: string;
        copied: string;
        mailSubject: string;
        mailIntro: string;
    };
    alwaysIncluded: {
        heading: string;
        sub: string;
        groups: { title: string; items: string[] }[];
    };
    items: Record<string, ItemCopy>;
    units: { source: string; sources: string; page: string; pages: string; group: string; groups: string };
}

const en: LocaleStrings = {
    intro: {
        heading: "Most companies have data.",
        headingAccent: "Few have decision systems.",
        body: [
            "Teams still argue about numbers, export to Excel, or quietly ignore the dashboard. What's missing isn't data or tooling — it's the decision layer: clear metrics, shared logic, and interfaces built around how people actually decide.",
            "That layer has a price, and most of it sits below the report surface. Configure a realistic scope below and see exactly where the money goes.",
        ],
        kicker: "Every line item is a deliverable, not a line on an invoice.",
    },
    sections: {
        foundation: { title: "1 · Foundation", hint: "What are we connecting?" },
        output: { title: "2 · Output", hint: "How many report pages, and what kind?" },
        dataLayer: { title: "3 · Data layer", hint: "What has to happen to the data first?" },
        extras: { title: "4 · Extras", hint: "Design, enablement, and headroom." },
    },
    controls: {
        sourcesLabel: "Data connections",
        sourcesHint: "Count each system you need data from. Volume discount applies from the 4th source.",
        pagesLabel: "Report pages",
        pagesHint: "Volume discount applies from the 6th page.",
        semanticModelLabel: "Semantic model",
        semanticModelHint: "Required — every report sits on a model. This is where trust in the numbers is built.",
        transformLabel: "Upstream data transformation",
        transformHint: "Only needed if the data isn't already clean and structured.",
        designLabel: "Design system & theming",
        onboardingLabel: "Onboarding & enablement",
        customWorkLabel: "Prepaid custom work",
        customWorkHint: "Headroom for anything this calculator can't model. Not affected by the complexity uplift.",
        complexityLabel: "Complexity factors",
        complexityHint: "These change every line item, so they scale the whole build rather than adding a fixed fee.",
        reset: "Reset to minimum scope",
        decrease: "Decrease",
        increase: "Increase",
    },
    chart: {
        heading: "Where the money goes",
        legendHeading: "Cost breakdown",
        freeHeading: "Included at no cost",
        taperNote: (qty, unit, unitPrice, pct) =>
            `${qty} × ${unitPrice} per ${unit}, volume-adjusted −${pct}%`,
        hoursNote: (hours) => `${hours} prepaid hours`,
        shareOfTotal: "of total",
    },
    result: {
        totalLabel: "Estimated one-time investment",
        estimateBadge: "Estimate",
        oneTime: "One-time build",
        disclaimer:
            "This is an indicative estimate, not a binding quote. Final scope and price are confirmed after a discovery session.",
        validity: (days) => `Indicative, valid ${days} days, subject to discovery.`,
        vat: "All prices net, plus VAT.",
        excludedHeading: "Not included",
        excluded: [
            "Microsoft Fabric capacity (F-SKU) and Power BI licences — billed by Microsoft directly to you",
            "Third-party data source subscription costs",
            "Travel, if on-site work is requested",
        ],
        ongoing: "Ongoing support and managed service quoted separately.",
        versionLabel: (version) => `Price list ${version}`,
        softThreshold:
            "At this scope the range widens — worth scoping properly before either of us commits to a number.",
        hardThreshold:
            "This is a programme, not a project. The number above is a starting point; let's scope it properly.",
    },
    warnings: {
        pagesPerSource:
            "That's a lot of pages on a single source. Usually a sign either the page count is inflated or a source is missing.",
        advancedNoSources:
            "Advanced transformation with one source is unusual — that scope normally implies several systems being reconciled.",
        pagesOnCompactModel:
            "A compact model rarely carries this many pages. Expect the model tier to move up during discovery.",
    },
    cta: {
        primary: "Send this scope to me",
        primarySub: "Opens your mail client with the configuration filled in. No form, no gate.",
        copy: "Copy summary",
        copied: "Copied",
        mailSubject: "Project scope enquiry",
        mailIntro: "Hi Julian,\n\nI configured the following scope on your site and would like to discuss it.\n",
    },
    alwaysIncluded: {
        heading: "Included in every engagement",
        sub: "Standards that apply regardless of the configuration above — they're not line items because they're not optional.",
        groups: [
            {
                title: "Governance & quality",
                items: [
                    "Row-level security implementation where data privacy requires it",
                    "Standardised naming conventions and structures for clean internal handover",
                    "Versioned delivery with clear change traceability (dev/test/prod)",
                ],
            },
            {
                title: "Process & transparency",
                items: [
                    "Definition of Done agreed up front — zero ambiguity on scope",
                    "Documentation and recorded walkthroughs for long-term ownership",
                    "Structured review cycles for stakeholder alignment at every milestone",
                ],
            },
        ],
    },
    units: { source: "source", sources: "sources", page: "page", pages: "pages", group: "group", groups: "groups" },
    items: {
        foundation: {
            label: "Foundation & Fabric workspace setup",
            short: "Foundation",
            includes: [
                "Workspace and capacity configuration",
                "Dev / test / prod environments and deployment pipeline",
                "Git integration, naming and governance conventions",
                "Kickoff and requirements session",
            ],
        },
        "sources.A": {
            label: "Standard connector",
            short: "Standard connectors",
            includes: [
                "SQL, SharePoint, Excel/CSV or a common SaaS connector",
                "Refresh schedule and gateway configuration",
                "Connection documented and credentialed for handover",
            ],
        },
        "sources.B": {
            label: "Custom REST API",
            short: "REST API connections",
            includes: [
                "OAuth or token handling, pagination, rate-limit backoff",
                "Custom Power Query / notebook ingestion logic",
                "Failure handling and retry behaviour",
            ],
        },
        "sources.C": {
            label: "Legacy / undocumented source",
            short: "Legacy sources",
            includes: [
                "Reverse-engineering an undocumented or file-based source",
                "Schema discovery and stabilisation against unreliable structure",
                "Data quality checks to flag discrepancies before they surface in the report",
            ],
        },
        "pages.A": {
            label: "Standard page",
            short: "Standard pages",
            includes: [
                "Visuals built on the existing semantic model",
                "IBCS-aligned layout optimised for fast cognition",
                "Consistent spacing, typography and hierarchy",
            ],
        },
        "pages.B": {
            label: "Interactive page",
            short: "Interactive pages",
            includes: [
                "Drill-through, bookmarks, what-if parameters, dynamic measures",
                "Figma wireframing before any DAX is written",
                "Mobile-ready layout for decision-makers on the move",
            ],
        },
        "pages.C": {
            label: "Advanced page",
            short: "Advanced pages",
            includes: [
                "Custom visuals and complex layout work",
                "Heavy DAX with performance tuning",
                "Bespoke interaction design for analytical workflows",
            ],
        },
        "semanticModel.compact": {
            label: "Compact semantic model",
            short: "Semantic model (compact)",
            includes: [
                "Up to ~5 tables, star schema, standard measures",
                "Audit-ready DAX — every number traceable to source",
                "Performance-tuned for instant load",
            ],
        },
        "semanticModel.standard": {
            label: "Standard semantic model",
            short: "Semantic model (standard)",
            includes: [
                "Up to ~15 tables, time intelligence, calculation groups",
                "Kimball-style star schema with conformed dimensions",
                "Audit-ready DAX and built-in data quality validation",
            ],
        },
        "semanticModel.complex": {
            label: "Complex semantic model",
            short: "Semantic model (complex)",
            includes: [
                "Multi-fact architecture with advanced DAX patterns",
                "Reconciliation logic across systems",
                "Full documentation and performance tuning at scale",
            ],
        },
        "analyticsEngineering.none": {
            label: "No upstream transformation",
            short: "No transformation",
            includes: ["Your data is already clean and structured — nothing to do here."],
        },
        "analyticsEngineering.light": {
            label: "Light transformation",
            short: "Transformation (light)",
            includes: [
                "Cleaning and conformed dimensions",
                "A handful of views or notebooks",
                "Basic scheduling",
            ],
        },
        "analyticsEngineering.standard": {
            label: "Standard transformation",
            short: "Transformation (standard)",
            includes: [
                "Medallion lakehouse architecture",
                "Incremental loads and historization",
                "Orchestration and monitoring hooks",
            ],
        },
        "analyticsEngineering.advanced": {
            label: "Advanced transformation",
            short: "Transformation (advanced)",
            includes: [
                "SCD2 historization and reconciliation logic",
                "Multi-currency / IFRS-style calculation layers",
                "Full lineage and auditability",
            ],
        },
        "designSystem.none": {
            label: "Default theme",
            short: "Default theme",
            includes: ["Clean default theming, no custom brand work."],
        },
        "designSystem.branded": {
            label: "Branded theme",
            short: "Branded theme",
            includes: [
                "Theme file with your colours, fonts and logo",
                "Page templates for consistent layout",
                "Modern UI patterns applied throughout",
            ],
        },
        "designSystem.full": {
            label: "Full design system",
            short: "Design system",
            includes: [
                "Tokenized theme file, reusable across future reports",
                "Component and layout library",
                "Documentation so your team can extend it without me",
            ],
        },
        "onboarding.handover": {
            label: "Handover",
            short: "Handover",
            includes: [
                "Recorded walkthrough of the finished solution",
                "Written documentation for long-term ownership",
            ],
        },
        "onboarding.training": {
            label: "Team training",
            short: "Team training",
            includes: [
                "Live 2h session per audience group",
                "Training materials you keep",
                "Priced per group, not per head",
            ],
        },
        "customWork.h10": {
            label: "10h prepaid block",
            short: "Custom work (10h)",
            includes: ["10 hours at the published rate", "Use for changes, extra analysis or ad-hoc requests"],
        },
        "customWork.h25": {
            label: "25h prepaid block",
            short: "Custom work (25h)",
            includes: ["25 hours with a 5% volume discount", "Use for changes, extra analysis or ad-hoc requests"],
        },
        "customWork.h50": {
            label: "50h prepaid block",
            short: "Custom work (50h)",
            includes: ["50 hours with a 10% volume discount", "Use for changes, extra analysis or ad-hoc requests"],
        },
        uplift: {
            label: "Complexity uplift",
            short: "Complexity uplift",
            includes: [
                "Multi-tenant, row-level security and multi-language each affect every line item",
                "Applied to delivery effort only — prepaid hours are excluded",
                "Capped at +60% regardless of how many factors apply",
            ],
        },
        aiReadiness: {
            label: "AI readiness",
            short: "AI readiness",
            includes: [
                "Metadata layer: semantic descriptions, business glossary, model documentation",
                "Agentic enablement: skill files, curated query patterns, agent-consumable model contracts",
                "LLM-ready models, fully compatible with Copilot and agent tooling",
            ],
        },
    },
};

const de: LocaleStrings = {
    intro: {
        heading: "Die meisten Unternehmen haben Daten.",
        headingAccent: "Nur wenige haben ein Entscheidungssystem.",
        body: [
            "Teams diskutieren weiterhin über Zahlen, exportieren nach Excel oder ignorieren das Dashboard stillschweigend. Was fehlt, sind nicht Daten oder Tools — es ist die Entscheidungsebene: klare Metriken, eine gemeinsame Logik und Interfaces, die zu realen Arbeitsabläufen passen.",
            "Diese Ebene hat ihren Preis, und der größte Teil davon liegt unterhalb der Berichtsoberfläche. Konfigurieren Sie unten einen realistischen Umfang und sehen Sie genau, wofür das Budget verwendet wird.",
        ],
        kicker: "Jede Position ist ein Deliverable — keine Rechnungszeile.",
    },
    sections: {
        foundation: { title: "1 · Fundament", hint: "Welche Systeme werden angebunden?" },
        output: { title: "2 · Output", hint: "Wie viele Berichtsseiten, und welcher Art?" },
        dataLayer: { title: "3 · Datenebene", hint: "Was muss vorher mit den Daten passieren?" },
        extras: { title: "4 · Extras", hint: "Design, Enablement und Spielraum." },
    },
    controls: {
        sourcesLabel: "Datenanbindungen",
        sourcesHint: "Zählen Sie jedes System, aus dem Daten benötigt werden. Mengenrabatt ab der 4. Quelle.",
        pagesLabel: "Berichtsseiten",
        pagesHint: "Mengenrabatt ab der 6. Seite.",
        semanticModelLabel: "Semantisches Modell",
        semanticModelHint:
            "Erforderlich — jeder Bericht basiert auf einem Modell. Hier entsteht das Vertrauen in die Zahlen.",
        transformLabel: "Vorgelagerte Datentransformation",
        transformHint: "Nur nötig, wenn die Daten nicht bereits sauber und strukturiert vorliegen.",
        designLabel: "Designsystem & Theming",
        onboardingLabel: "Onboarding & Enablement",
        customWorkLabel: "Vorab gebuchtes Stundenkontingent",
        customWorkHint:
            "Spielraum für alles, was dieser Rechner nicht abbilden kann. Vom Komplexitätsaufschlag ausgenommen.",
        complexityLabel: "Komplexitätsfaktoren",
        complexityHint:
            "Diese Faktoren betreffen jede einzelne Position und skalieren daher das gesamte Projekt statt einer Pauschale.",
        reset: "Auf Mindestumfang zurücksetzen",
        decrease: "Verringern",
        increase: "Erhöhen",
    },
    chart: {
        heading: "Wofür das Budget verwendet wird",
        legendHeading: "Kostenaufschlüsselung",
        freeHeading: "Ohne Aufpreis enthalten",
        taperNote: (qty, unit, unitPrice, pct) =>
            `${qty} × ${unitPrice} pro ${unit}, mengenbereinigt −${pct} %`,
        hoursNote: (hours) => `${hours} Stunden Kontingent`,
        shareOfTotal: "der Gesamtsumme",
    },
    result: {
        totalLabel: "Geschätzte einmalige Investition",
        estimateBadge: "Schätzung",
        oneTime: "Einmalige Umsetzung",
        disclaimer:
            "Dies ist eine indikative Schätzung, kein verbindliches Angebot. Finaler Umfang und Preis werden nach einem Discovery-Termin bestätigt.",
        validity: (days) => `Indikativ, ${days} Tage gültig, vorbehaltlich Discovery.`,
        vat: "Alle Preise netto, zzgl. USt.",
        excludedHeading: "Nicht enthalten",
        excluded: [
            "Microsoft Fabric Kapazität (F-SKU) und Power BI Lizenzen — werden von Microsoft direkt abgerechnet",
            "Abonnementkosten für Drittanbieter-Datenquellen",
            "Reisekosten, falls Arbeiten vor Ort gewünscht sind",
        ],
        ongoing: "Laufender Support und Managed Service werden separat angeboten.",
        versionLabel: (version) => `Preisliste ${version}`,
        softThreshold:
            "In dieser Größenordnung wird die Spanne breiter — es lohnt sich, den Umfang sauber zu schneiden, bevor sich eine Seite auf eine Zahl festlegt.",
        hardThreshold:
            "Das ist ein Programm, kein Projekt. Die Zahl oben ist ein Ausgangspunkt — lassen Sie uns den Umfang gemeinsam schärfen.",
    },
    warnings: {
        pagesPerSource:
            "Das sind viele Seiten für eine einzelne Datenquelle. Meist ist entweder die Seitenzahl zu hoch angesetzt oder eine Quelle fehlt.",
        advancedNoSources:
            "Advanced-Transformation bei nur einer Quelle ist ungewöhnlich — dieser Umfang setzt normalerweise mehrere abzugleichende Systeme voraus.",
        pagesOnCompactModel:
            "Ein kompaktes Modell trägt selten so viele Seiten. Die Modellstufe wird sich im Discovery vermutlich nach oben bewegen.",
    },
    cta: {
        primary: "Diesen Umfang an mich senden",
        primarySub: "Öffnet Ihr E-Mail-Programm mit der fertigen Konfiguration. Kein Formular, keine Hürde.",
        copy: "Zusammenfassung kopieren",
        copied: "Kopiert",
        mailSubject: "Projektanfrage — Umfang",
        mailIntro:
            "Hallo Julian,\n\nich habe auf Ihrer Website folgenden Umfang konfiguriert und würde ihn gern besprechen.\n",
    },
    alwaysIncluded: {
        heading: "In jedem Projekt enthalten",
        sub: "Standards, die unabhängig von der Konfiguration oben gelten — sie sind keine Positionen, weil sie nicht optional sind.",
        groups: [
            {
                title: "Governance & Qualität",
                items: [
                    "Row-Level Security, wo der Datenschutz es erfordert",
                    "Einheitliche Namens- und Strukturkonventionen für eine saubere interne Übergabe",
                    "Versionierte Auslieferung mit nachvollziehbaren Änderungen (Dev/Test/Prod)",
                ],
            },
            {
                title: "Prozess & Transparenz",
                items: [
                    "Definition of Done vorab abgestimmt — keine Unklarheit über den Umfang",
                    "Dokumentation und aufgezeichnete Walkthroughs für langfristige Eigenverantwortung",
                    "Strukturierte Review-Zyklen für Stakeholder-Alignment an jedem Meilenstein",
                ],
            },
        ],
    },
    units: {
        source: "Quelle",
        sources: "Quellen",
        page: "Seite",
        pages: "Seiten",
        group: "Gruppe",
        groups: "Gruppen",
    },
    items: {
        foundation: {
            label: "Fundament & Fabric-Workspace-Setup",
            short: "Fundament",
            includes: [
                "Workspace- und Kapazitätskonfiguration",
                "Dev-/Test-/Prod-Umgebungen und Deployment-Pipeline",
                "Git-Integration, Namens- und Governance-Konventionen",
                "Kickoff- und Anforderungsworkshop",
            ],
        },
        "sources.A": {
            label: "Standard-Konnektor",
            short: "Standard-Konnektoren",
            includes: [
                "SQL, SharePoint, Excel/CSV oder gängiger SaaS-Konnektor",
                "Aktualisierungsplan und Gateway-Konfiguration",
                "Verbindung dokumentiert und übergabefertig",
            ],
        },
        "sources.B": {
            label: "Individuelle REST-API",
            short: "REST-API-Anbindungen",
            includes: [
                "OAuth- bzw. Token-Handling, Pagination, Rate-Limit-Backoff",
                "Individuelle Power-Query-/Notebook-Ingestion",
                "Fehlerbehandlung und Retry-Verhalten",
            ],
        },
        "sources.C": {
            label: "Legacy / undokumentierte Quelle",
            short: "Legacy-Quellen",
            includes: [
                "Reverse Engineering einer undokumentierten oder dateibasierten Quelle",
                "Schema-Analyse und Stabilisierung bei unzuverlässiger Struktur",
                "Datenqualitätsprüfungen, bevor Abweichungen im Bericht sichtbar werden",
            ],
        },
        "pages.A": {
            label: "Standardseite",
            short: "Standardseiten",
            includes: [
                "Visuals auf Basis des bestehenden semantischen Modells",
                "IBCS-orientiertes Layout für schnelle Erfassbarkeit",
                "Konsistente Abstände, Typografie und Hierarchie",
            ],
        },
        "pages.B": {
            label: "Interaktive Seite",
            short: "Interaktive Seiten",
            includes: [
                "Drill-through, Lesezeichen, What-if-Parameter, dynamische Measures",
                "Figma-Wireframing, bevor die erste DAX-Zeile entsteht",
                "Mobiloptimiertes Layout für Entscheider unterwegs",
            ],
        },
        "pages.C": {
            label: "Advanced-Seite",
            short: "Advanced-Seiten",
            includes: [
                "Custom Visuals und komplexe Layoutarbeit",
                "Aufwändiges DAX inklusive Performance-Tuning",
                "Maßgeschneidertes Interaktionsdesign für analytische Workflows",
            ],
        },
        "semanticModel.compact": {
            label: "Kompaktes semantisches Modell",
            short: "Semantisches Modell (kompakt)",
            includes: [
                "Bis ca. 5 Tabellen, Star Schema, Standard-Measures",
                "Prüfsicheres DAX — jede Zahl bis zur Quelle nachvollziehbar",
                "Performance-optimiert für sofortige Ladezeiten",
            ],
        },
        "semanticModel.standard": {
            label: "Standard-Modell",
            short: "Semantisches Modell (Standard)",
            includes: [
                "Bis ca. 15 Tabellen, Zeitintelligenz, Berechnungsgruppen",
                "Star Schema nach Kimball mit konformen Dimensionen",
                "Prüfsicheres DAX und integrierte Datenqualitätsprüfung",
            ],
        },
        "semanticModel.complex": {
            label: "Komplexes Modell",
            short: "Semantisches Modell (komplex)",
            includes: [
                "Multi-Fact-Architektur mit fortgeschrittenen DAX-Mustern",
                "Abstimmungslogik über mehrere Systeme hinweg",
                "Vollständige Dokumentation und Performance-Tuning im Maßstab",
            ],
        },
        "analyticsEngineering.none": {
            label: "Keine vorgelagerte Transformation",
            short: "Keine Transformation",
            includes: ["Ihre Daten liegen bereits sauber und strukturiert vor — hier fällt nichts an."],
        },
        "analyticsEngineering.light": {
            label: "Light-Transformation",
            short: "Transformation (Light)",
            includes: [
                "Bereinigung und konforme Dimensionen",
                "Einige Views oder Notebooks",
                "Grundlegende Zeitplanung",
            ],
        },
        "analyticsEngineering.standard": {
            label: "Standard-Transformation",
            short: "Transformation (Standard)",
            includes: [
                "Medallion-Lakehouse-Architektur",
                "Inkrementelle Ladevorgänge und Historisierung",
                "Orchestrierung und Monitoring-Hooks",
            ],
        },
        "analyticsEngineering.advanced": {
            label: "Advanced-Transformation",
            short: "Transformation (Advanced)",
            includes: [
                "SCD2-Historisierung und Abstimmungslogik",
                "Mehrwährungs- / IFRS-nahe Berechnungsebenen",
                "Vollständige Lineage und Auditierbarkeit",
            ],
        },
        "designSystem.none": {
            label: "Standard-Theme",
            short: "Standard-Theme",
            includes: ["Sauberes Standard-Theming, keine individuelle Markenarbeit."],
        },
        "designSystem.branded": {
            label: "Branded Theme",
            short: "Branded Theme",
            includes: [
                "Theme-Datei mit Ihren Farben, Schriften und Logo",
                "Seitenvorlagen für ein konsistentes Layout",
                "Moderne UI-Patterns durchgängig angewendet",
            ],
        },
        "designSystem.full": {
            label: "Vollständiges Designsystem",
            short: "Designsystem",
            includes: [
                "Tokenisierte Theme-Datei, wiederverwendbar für künftige Berichte",
                "Komponenten- und Layout-Bibliothek",
                "Dokumentation, damit Ihr Team es ohne mich erweitern kann",
            ],
        },
        "onboarding.handover": {
            label: "Übergabe",
            short: "Übergabe",
            includes: [
                "Aufgezeichneter Walkthrough der fertigen Lösung",
                "Schriftliche Dokumentation für langfristige Eigenverantwortung",
            ],
        },
        "onboarding.training": {
            label: "Team-Schulung",
            short: "Team-Schulung",
            includes: [
                "Live-Session von 2 Stunden je Zielgruppe",
                "Schulungsunterlagen zum Behalten",
                "Preis pro Gruppe, nicht pro Kopf",
            ],
        },
        "customWork.h10": {
            label: "10-Stunden-Kontingent",
            short: "Individuelle Arbeit (10 Std.)",
            includes: ["10 Stunden zum veröffentlichten Satz", "Für Änderungen, Zusatzanalysen oder Ad-hoc-Anfragen"],
        },
        "customWork.h25": {
            label: "25-Stunden-Kontingent",
            short: "Individuelle Arbeit (25 Std.)",
            includes: ["25 Stunden mit 5 % Mengenrabatt", "Für Änderungen, Zusatzanalysen oder Ad-hoc-Anfragen"],
        },
        "customWork.h50": {
            label: "50-Stunden-Kontingent",
            short: "Individuelle Arbeit (50 Std.)",
            includes: ["50 Stunden mit 10 % Mengenrabatt", "Für Änderungen, Zusatzanalysen oder Ad-hoc-Anfragen"],
        },
        uplift: {
            label: "Komplexitätsaufschlag",
            short: "Komplexitätsaufschlag",
            includes: [
                "Mandantenfähigkeit, Row-Level Security und Mehrsprachigkeit betreffen jede Position",
                "Gilt nur für den Umsetzungsaufwand — Stundenkontingente sind ausgenommen",
                "Auf +60 % begrenzt, unabhängig von der Anzahl der Faktoren",
            ],
        },
        aiReadiness: {
            label: "AI Readiness",
            short: "AI Readiness",
            includes: [
                "Metadatenebene: semantische Beschreibungen, Business-Glossar, Modelldokumentation",
                "Agentic Enablement: Skill-Dateien, kuratierte Query-Patterns, agentenlesbare Modellverträge",
                "LLM-fähige Modelle, vollständig kompatibel mit Copilot und Agent-Tooling",
            ],
        },
    },
};

export const strings: Record<Lang, LocaleStrings> = { en, de };
