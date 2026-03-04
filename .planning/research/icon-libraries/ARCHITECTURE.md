# Architecture Patterns: Icon Library Integration

**Domain:** Icon library integration for AI design engineering system (Motif)
**Researched:** 2026-03-04

## Recommended Architecture

The icon integration is a data-driven selection system, not a complex runtime. It consists of three layers:

```
[Reference Data] -> [Architect Agent Selection] -> [Composed Output]
     (static)         (design-time decision)       (HTML + CSS)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Icon Library Registry** (`icon-libraries.json` or similar) | Stores CDN URLs, version pins, class prefixes, domain affinities, and icon name catalogs per library | Architect agent reads this at design time |
| **Architect Agent (enhanced)** | Selects library based on vertical + brand personality, emits CDN link in token-showcase.html, adds icon tokens to tokens.css | Reads registry, writes to design system files |
| **Composer Agent (enhanced)** | Uses concrete icon names from selected library when composing screens | Reads COMPONENT-SPECS.md (which now includes icon library + names) |
| **Icon Tokens** (in tokens.css) | CSS custom properties for icon sizing, colors, and library-specific axes | Referenced by all composed HTML |

### Data Flow

```
1. User runs /motif:system (architect agent)
2. Architect reads vertical from design brief
3. Architect reads icon-libraries.json registry
4. Architect selects primary library based on:
   a. Vertical -> domain affinity lookup
   b. Brand personality tokens -> personality override
5. Architect adds to tokens.css:
   - --icon-library: 'phosphor'
   - --icon-size-* tokens
   - --color-icon-* tokens
   - (Material Symbols only) --icon-fill, --icon-weight, etc.
6. Architect adds CDN <link> to token-showcase.html <head>
7. Architect documents selected library + key icon names in COMPONENT-SPECS.md
8. Composer agent reads COMPONENT-SPECS.md
9. Composer uses correct icon class syntax when composing screens
```

## Patterns to Follow

### Pattern 1: Static Registry with Version Pinning

**What:** Store all icon library metadata in a single JSON file that agents read.
**When:** Always. This is the core data structure.
**Example:**

```json
{
  "libraries": {
    "phosphor": {
      "name": "Phosphor Icons",
      "version": "2.1.2",
      "cdn": {
        "regular": "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css",
        "thin": "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/thin/style.css",
        "light": "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/light/style.css",
        "bold": "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css",
        "fill": "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css",
        "duotone": "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/duotone/style.css",
        "all": "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2"
      },
      "syntax": "<i class=\"{weight} ph-{name}\"></i>",
      "weightClasses": {
        "regular": "ph",
        "thin": "ph-thin",
        "light": "ph-light",
        "bold": "ph-bold",
        "fill": "ph-fill",
        "duotone": "ph-duotone"
      },
      "defaultWeight": "regular",
      "domainAffinity": {
        "fintech": "primary",
        "saas": "secondary",
        "ecommerce": "secondary",
        "health": "tertiary"
      }
    },
    "lucide": {
      "name": "Lucide",
      "version": "0.576.0",
      "cdn": {
        "js": "https://unpkg.com/lucide@0.576.0",
        "font": "https://unpkg.com/lucide-static@0.576.0/font/lucide.css"
      },
      "syntax": "<i data-lucide=\"{name}\"></i>",
      "initScript": "lucide.createIcons();",
      "domainAffinity": {
        "saas": "primary",
        "health": "secondary",
        "fintech": "secondary",
        "ecommerce": "tertiary"
      }
    },
    "material-symbols": {
      "name": "Material Symbols",
      "version": "latest (Google Fonts)",
      "cdn": {
        "outlined": "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined",
        "rounded": "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded",
        "sharp": "https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp"
      },
      "syntax": "<span class=\"material-symbols-{style}\">{name}</span>",
      "defaultStyle": "outlined",
      "variableAxes": ["FILL", "wght", "GRAD", "opsz"],
      "domainAffinity": {
        "health": "primary",
        "ecommerce": "primary",
        "saas": "secondary",
        "fintech": "tertiary"
      }
    },
    "tabler": {
      "name": "Tabler Icons",
      "version": "3.36.1",
      "cdn": {
        "webfont": "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css"
      },
      "syntax": "<i class=\"ti ti-{name}\"></i>",
      "domainAffinity": {
        "saas": "secondary",
        "ecommerce": "secondary",
        "fintech": "secondary",
        "health": "tertiary"
      }
    }
  }
}
```

### Pattern 2: Icon Name Catalogs by Semantic Category

**What:** Organize icon names by UI function (navigation, actions, status, data) rather than alphabetically.
**When:** When providing reference data to the composer agent.
**Why:** Agents need to find "the right icon for a delete button" not "browse all 1,248 icons alphabetically."

```json
{
  "catalogs": {
    "navigation": {
      "phosphor": ["ph-house", "ph-arrow-left", "ph-arrow-right", "ph-caret-down", "ph-list", "ph-x"],
      "lucide": ["house", "arrow-left", "arrow-right", "chevron-down", "menu", "x"],
      "material-symbols": ["home", "arrow_back", "arrow_forward", "expand_more", "menu", "close"],
      "tabler": ["ti-home", "ti-arrow-left", "ti-arrow-right", "ti-chevron-down", "ti-menu-2", "ti-x"]
    },
    "actions": {
      "phosphor": ["ph-plus", "ph-trash", "ph-pencil", "ph-download", "ph-upload", "ph-share"],
      "lucide": ["plus", "trash-2", "pencil", "download", "upload", "share-2"],
      "material-symbols": ["add", "delete", "edit", "download", "upload", "share"],
      "tabler": ["ti-plus", "ti-trash", "ti-pencil", "ti-download", "ti-upload", "ti-share"]
    },
    "status": {
      "phosphor": ["ph-check-circle", "ph-warning", "ph-x-circle", "ph-info"],
      "lucide": ["check-circle-2", "alert-triangle", "x-circle", "info"],
      "material-symbols": ["check_circle", "warning", "cancel", "info"],
      "tabler": ["ti-circle-check", "ti-alert-triangle", "ti-circle-x", "ti-info-circle"]
    }
  }
}
```

### Pattern 3: COMPONENT-SPECS.md Icon Section

**What:** The architect adds an icon specification section to COMPONENT-SPECS.md documenting the selected library and common icon mappings.
**When:** During design system generation (/motif:system).

```markdown
## Icon System

**Library:** Phosphor Icons v2.1.2
**Weight:** Regular (ph) + Fill (ph-fill) for active states
**CDN:** `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css" />`

### Icon Usage

| UI Element | Icon | Markup |
|------------|------|--------|
| Navigation home | house | `<i class="ph ph-house"></i>` |
| Search | magnifying-glass | `<i class="ph ph-magnifying-glass"></i>` |
| User menu | user-circle | `<i class="ph ph-user-circle"></i>` |
| Settings | gear | `<i class="ph ph-gear"></i>` |
| Notifications | bell | `<i class="ph ph-bell"></i>` |
| Close/dismiss | x | `<i class="ph ph-x"></i>` |
| Success state | check-circle (fill) | `<i class="ph-fill ph-check-circle"></i>` |
| Error state | warning-circle (fill) | `<i class="ph-fill ph-warning-circle"></i>` |
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using `@latest` in CDN URLs
**What:** Pointing CDN links to `@latest` instead of pinned versions.
**Why bad:** Icons may be renamed or removed between versions. A composed screen that worked yesterday breaks today because `@latest` resolved to a new version.
**Instead:** Always pin: `@phosphor-icons/web@2.1.2`, not `@phosphor-icons/web@latest`.

### Anti-Pattern 2: Mixing Icon Libraries in One Design System
**What:** Using Phosphor for navigation and Lucide for actions in the same design.
**Why bad:** Inconsistent stroke width, visual weight, and naming conventions. The design looks disjointed.
**Instead:** One library per design system. Use the secondary library only if the primary lacks a critical icon, and document the exception.

### Anti-Pattern 3: Inline SVG Emission
**What:** Having the composer agent emit raw `<svg>` markup instead of CSS class references.
**Why bad:** Bloats HTML, makes icons hard to identify in code review, breaks if the icon data is wrong.
**Instead:** Always use CSS class syntax: `<i class="ph ph-house"></i>`.

### Anti-Pattern 4: Hardcoding CDN URLs in Agent Prompts
**What:** Embedding CDN URLs directly in the agent's system prompt or instruction files.
**Why bad:** When a library releases a new version, every prompt file must be updated.
**Instead:** Store CDN URLs in the registry JSON file. Agents read the registry at runtime.

### Anti-Pattern 5: Loading All Weights
**What:** Loading Phosphor's `@2.1.2` script tag (~3MB all weights) when only Regular is needed.
**Why bad:** 3MB of icon fonts for a showcase page is excessive.
**Instead:** Load individual weight CSS files. If using Regular + Fill, that is two CSS files (~1MB total).

---
*Architecture patterns for: Motif icon library integration*
*Researched: 2026-03-04*
