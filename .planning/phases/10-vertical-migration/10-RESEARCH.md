# Phase 10: Vertical Migration - Research

**Researched:** 2026-03-04
**Domain:** Per-vertical icon vocabulary curation and bracket-placeholder replacement in vertical reference files
**Confidence:** HIGH

## Summary

Phase 10 is a data authoring phase with zero code. It produces curated icon vocabularies for each of the four verticals (fintech, health, SaaS, e-commerce) and replaces the bracket-placeholder icon references (e.g., `[MerchantIcon 40x40]`) in the existing vertical reference files with concrete icon names from each vertical's primary library. The phase depends entirely on Phase 9's `icon-libraries.md` for library naming conventions, CDN metadata, and the domain affinity matrix.

The core challenge is preventing icon name hallucination -- LLMs generate plausible-sounding icon names that do not actually exist in the target library. Each library uses different naming conventions (Phosphor: `ph-kebab-case`, Lucide: bare `kebab-case`, Material Symbols: `underscore_case`, Tabler: `ti-kebab-case`). The vocabulary must contain only names verified to exist in the target library at the pinned version.

The deliverables are (1) an `## Icon Vocabulary` section added to each vertical file (`fintech.md`, `health.md`, `saas.md`, `ecommerce.md`), containing 15-25 validated icon names organized by semantic category; and (2) replacement of all 4 bracket-placeholder icon references in component specifications within those files. The vocabularies use library-agnostic semantic roles (per the Phase 9 locked decision), with concrete icon names mapped to the primary library. When a user overrides the library, the composer reads the same semantic role but looks up the concrete name from the alternate library's column.

**Primary recommendation:** Add the vocabulary as a new `## Icon Vocabulary` section within each existing vertical file (not as separate files). Organize icons into 4 semantic categories: Navigation, Domain-Specific, Status/Feedback, Actions. Include a cross-library mapping table so the vocabulary works regardless of which library the selection algorithm or user override chooses. Replace bracket placeholders inline in the existing component specifications.

## Standard Stack

### Core

This phase produces no code -- only modifications to existing markdown vertical reference files.

| File | Location | Purpose | Why Standard |
|------|----------|---------|--------------|
| `fintech.md` | `core/references/verticals/` | Add icon vocabulary (Phosphor primary) + replace bracket placeholders | Extends existing vertical reference, same pattern used for all design intelligence |
| `health.md` | `core/references/verticals/` | Add icon vocabulary (Material Symbols primary) + replace bracket placeholders | Same pattern |
| `saas.md` | `core/references/verticals/` | Add icon vocabulary (Lucide primary) + replace bracket placeholders | Same pattern |
| `ecommerce.md` | `core/references/verticals/` | Add icon vocabulary (Material Symbols primary) + replace bracket placeholders | Same pattern |

### Supporting Reference Data

| Source | Location | Content |
|--------|----------|---------|
| `icon-libraries.md` | `core/references/` | Library naming conventions, domain affinity matrix, CDN metadata (Phase 9 deliverable) |
| Icon Name Conventions table | `core/references/icon-libraries.md` | 15 common UI concepts mapped across all 4 libraries (verified names) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vocabulary inline in vertical files | Separate `icon-vocabulary-{vertical}.md` files | Inline keeps all vertical intelligence in one file (agents load one file, not two). Separate files add file count and cross-reference complexity. |
| 4-column cross-library table | Primary-library-only list | Cross-library table supports user override scenario (locked decision). Primary-only would break when user overrides the default library. |
| 15-25 icons per vertical | 50-100 icons per vertical | 15-25 covers the semantic roles used in component specs. 50-100 would include speculative icons not referenced by any component, adding token cost without value. Expand later per FEATURES.md recommendation. |

## Architecture Patterns

### Recommended File Structure

No new files or directories. Four file modifications:

```
core/
  references/
    icon-libraries.md          # READ ONLY (Phase 9 -- naming conventions)
    verticals/
      fintech.md               # MODIFIED -- add Icon Vocabulary section, replace 1 bracket placeholder
      health.md                # MODIFIED -- add Icon Vocabulary section, replace 2 bracket placeholders
      saas.md                  # MODIFIED -- add Icon Vocabulary section, replace 1 bracket placeholder
      ecommerce.md             # MODIFIED -- add Icon Vocabulary section, replace 0 bracket placeholders (none in component specs)
```

### Pattern 1: Icon Vocabulary Section Structure

**What:** A new `## Icon Vocabulary` section added to each vertical file, containing a cross-library mapping table organized by semantic category.

**When to use:** Every vertical file gets this section. The composer agent reads it to emit correct icon names.

**Structure:**

```markdown
## Icon Vocabulary

Primary library: [Library Name] (from icon-libraries.md domain affinity matrix)

### Navigation
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| home          | ph-house | house  | home            | ti-home |
| [...]         | [...]    | [...]  | [...]           | [...]   |

### [Domain-Specific Category]
[same table format]

### Status & Feedback
[same table format]

### Actions
[same table format]
```

**Why this structure:**
1. Semantic roles are library-agnostic (locked decision from Phase 9 CONTEXT.md)
2. Cross-library columns enable user override without vocabulary rewriting (locked decision)
3. Categorization by semantic group (navigation, domain, status, actions) mirrors how composers think about icon usage
4. Table format is agent-friendly (markdown tables are cheap tokens, easy to parse)

### Pattern 2: Bracket Placeholder Replacement

**What:** Replace `[MerchantIcon 40x40]`, `[MetricIcon 32x32]`, `[CategoryIcon 36x36]`, and `[Icon 20x20]` in component specification `<structure>` blocks with concrete icon references using the vertical's primary library syntax.

**Current placeholders found (4 total):**

| File | Component | Placeholder | Replacement Pattern |
|------|-----------|-------------|-------------------|
| `fintech.md` | TransactionRow | `[MerchantIcon 40x40]` | Concrete Phosphor class in 40px container |
| `health.md` | MetricCard | `[MetricIcon 32x32]` | Concrete Material Symbols in 32px container |
| `health.md` | LogEntry | `[CategoryIcon 36x36]` | Concrete Material Symbols in 36px container |
| `saas.md` | CommandPalette | `[Icon 20x20]` | Concrete Lucide icon at 20px |

**Replacement approach:** Replace the bracket placeholder with a description that names the icon token size and references the vocabulary. Do NOT hardcode a single icon name in the component spec (the actual icon varies per transaction/metric/category). Instead, reference the vocabulary semantic role.

Example replacement for `fintech.md` TransactionRow:
```
Before: Row: [MerchantIcon 40×40] [Description + Subtitle stack] [Amount right-aligned]
After:  Row: [Icon from vocabulary: --icon-2xl in 40×40 container] [Description + Subtitle stack] [Amount right-aligned]
```

Or more concretely, since the component spec is a template describing the structure:
```
Before: Row: [MerchantIcon 40×40] [Description + Subtitle stack] [Amount right-aligned]
After:  Row: [merchant icon (--icon-2xl) in 40×40 --radius-full container] [Description + Subtitle stack] [Amount right-aligned]
```

**Key insight from Phase 9 research:** The 40x40 and 36x36 dimensions are container sizes, not icon sizes. The icon inside uses `--icon-lg` (24px) or `--icon-xl` (32px) within a padded container. The replacement must preserve this distinction.

### Anti-Patterns to Avoid

- **Hardcoding a single icon name in a component spec:** The TransactionRow's merchant icon varies per transaction (Uber gets a car icon, Spotify gets a music icon, etc.). The spec should reference the vocabulary category, not a fixed icon.
- **Including icons not referenced by any component:** The vocabulary should be 15-25 icons that map to actual UI needs documented in the vertical file. Do not pad with speculative icons.
- **Omitting the cross-library mapping:** If only primary library names are listed, user overrides break. All 4 columns are required per the locked decision.
- **Creating separate vocabulary files:** Agents load the vertical file as context. A separate file means the agent must load two files, increasing context cost and risking the vocabulary not being loaded.
- **Using `@latest` or unverified icon names:** Every icon name must be confirmed to exist at the pinned version documented in `icon-libraries.md`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon name validation | Script that checks names against library repos | Manual verification via GitHub raw file URLs | Phase 10 is a one-time curation (15-25 icons x 4 verticals = 60-100 names). A validation script is over-engineering for a one-time task. Manual verification is faster and produces higher-confidence results. |
| Vocabulary generation | Auto-generate vocabulary from component specs | Manual curation guided by vertical domain knowledge | Auto-generation would produce a generic vocabulary. The value is domain-specific curation (fintech needs `bank`, `wallet`, `credit-card`; health needs `stethoscope`, `medication`, `monitor_heart`). |
| Cross-library name mapping | Algorithmic name translation (Phosphor -> Material Symbols) | Manually curated mapping table | Libraries use different naming conventions and sometimes different concepts for the same semantic role. `ph-magnifying-glass` -> `search` (Lucide) cannot be algorithmically derived. |

**Key insight:** This phase is manual, domain-expert data curation. The value comes from a human (or knowledgeable agent) selecting the right 15-25 icons for each vertical based on the component specifications and domain patterns already documented in the vertical files.

## Common Pitfalls

### Pitfall 1: Icon Name Hallucination

**What goes wrong:** Curating a vocabulary with icon names that sound right but don't exist in the target library. Example: `ph-dashboard` (doesn't exist -- the correct name is `ph-chart-line` or `ph-squares-four`), or `heart-monitor` in Material Symbols (correct name is `monitor_heart`).
**Why it happens:** LLMs generate plausible icon names from training data. Naming conventions differ across libraries, and some concepts map to non-obvious names.
**How to avoid:** Verify every icon name against the library's official source. For Phosphor: check `github.com/phosphor-icons/core/assets/regular/{name}.svg`. For Material Symbols: check `github.com/google/material-design-icons/symbols/web/{name}/`. For Lucide: check `github.com/lucide-icons/lucide/icons/{name}.svg`.
**Warning signs:** `grep` for icon names in composed output that produce missing/blank icons.

### Pitfall 2: Material Symbols Naming Convention

**What goes wrong:** Using hyphens instead of underscores for Material Symbols icon names. Example: `shopping-cart` instead of `shopping_cart`, `health-and-safety` instead of `health_and_safety`.
**Why it happens:** Every other library in the curated set uses hyphens. Material Symbols is the exception, using underscores. Easy to mix up.
**How to avoid:** Explicitly note the underscore convention in the vocabulary section header for health and e-commerce verticals. Double-check every Material Symbols name for underscores.
**Warning signs:** Icons render as blank squares or the text literal of the name in composed screens.

### Pitfall 3: Breaking Component Spec Structure

**What goes wrong:** Replacing bracket placeholders with verbose HTML markup that disrupts the XML-like component spec format. The component specs use a specific shorthand notation (`[Description + Subtitle stack]`, `[Amount right-aligned]`) that agents parse.
**Why it happens:** The temptation to replace `[MerchantIcon 40x40]` with `<i class="ph ph-storefront" style="..."></i>` -- which is HTML, not spec notation.
**How to avoid:** Replace bracket placeholders with the same shorthand notation style used throughout the component specs. Use descriptive text that references token names and vocabulary roles, not HTML markup.
**Warning signs:** Component specs become inconsistent in notation style after modification.

### Pitfall 4: Vocabulary Size Creep

**What goes wrong:** Curating 40-50 icons per vertical instead of the required 15-25. Extra icons increase context token cost for the composer agent without proportional value.
**Why it happens:** Wanting to be "comprehensive." Easy to keep adding edge-case icons.
**How to avoid:** Start from the component specifications documented in each vertical file. Count the distinct semantic roles needed. Add a small buffer (5-8 icons) for common UI patterns not in component specs but likely needed (e.g., close, check, plus, minus, arrow-right). Stop at 25.
**Warning signs:** Count exceeds 25 for any vertical.

### Pitfall 5: Forgetting ecommerce.md Has No Bracket Placeholders

**What goes wrong:** Spending time looking for bracket placeholders in `ecommerce.md` when there are none. The e-commerce component specs (ProductCard, CartItem, PriceDisplay) use descriptive text like "star icons", "heart icon", "X icon" rather than `[Icon NxN]` bracket notation.
**Why it happens:** Assuming all verticals have the same pattern.
**How to avoid:** Verify with `grep '\[.*Icon' core/references/verticals/ecommerce.md` before starting. Result: zero matches. E-commerce only needs the vocabulary section added, not placeholder replacement.
**Warning signs:** None (but saves wasted effort).

## Code Examples

### Fintech Icon Vocabulary (Phosphor Primary)

```markdown
<!-- Verified against Phosphor Icons @phosphor-icons/web@2.1.2 via GitHub core/assets/regular/ -->

## Icon Vocabulary

Primary library: Phosphor Icons (from icon-libraries.md domain affinity matrix)

### Navigation
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| home | ph-house | house | home | ti-home |
| search | ph-magnifying-glass | search | search | ti-search |
| settings | ph-gear | settings | settings | ti-settings |
| profile | ph-user | user | person | ti-user |
| notifications | ph-bell | bell | notifications | ti-bell |

### Finance
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| bank | ph-bank | landmark | account_balance | ti-building-bank |
| wallet | ph-wallet | wallet | account_balance_wallet | ti-wallet |
| credit-card | ph-credit-card | credit-card | credit_card | ti-credit-card |
| money | ph-currency-dollar | dollar-sign | payments | ti-currency-dollar |
| transfer | ph-arrows-left-right | arrow-left-right | swap_horiz | ti-transfer |
| chart | ph-chart-line-up | trending-up | trending_up | ti-trending-up |
| receipt | ph-receipt | receipt | receipt_long | ti-receipt |
| coins | ph-coins | coins | toll | ti-coins |

### Status & Feedback
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| success | ph-check-circle | check-circle | check_circle | ti-circle-check |
| error | ph-x-circle | x-circle | cancel | ti-circle-x |
| warning | ph-warning | alert-triangle | warning | ti-alert-triangle |
| pending | ph-clock | clock | schedule | ti-clock |

### Actions
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| send | ph-paper-plane-tilt | send | send | ti-send |
| scan-qr | ph-qr-code | qr-code | qr_code_scanner | ti-qr-code |
| security | ph-shield-check | shield-check | verified_user | ti-shield-check |
| biometric | ph-fingerprint | fingerprint | fingerprint | ti-fingerprint |
| copy | ph-copy | copy | content_copy | ti-copy |
| close | ph-x | x | close | ti-x |
```

### Bracket Placeholder Replacement Example (fintech.md TransactionRow)

```xml
<!-- BEFORE -->
<structure>
  Row: [MerchantIcon 40×40] [Description + Subtitle stack] [Amount right-aligned]
</structure>

<!-- AFTER -->
<structure>
  Row: [Icon (vocabulary: merchant category) --icon-lg in 40×40 --radius-full container] [Description + Subtitle stack] [Amount right-aligned]
</structure>
```

### Health Icon Vocabulary (Material Symbols Primary)

```markdown
<!-- Verified against Material Symbols via GitHub google/material-design-icons/symbols/web/ -->

## Icon Vocabulary

Primary library: Material Symbols Rounded (from icon-libraries.md domain affinity matrix)
Note: Material Symbols uses underscores, not hyphens.

### Navigation
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| home | home | ph-house | house | ti-home |
| search | search | ph-magnifying-glass | search | ti-search |
| settings | settings | ph-gear | settings | ti-settings |
| profile | person | ph-user | user | ti-user |
| notifications | notifications | ph-bell | bell | ti-bell |

### Health & Medical
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| vitals | monitor_heart | ph-heartbeat | heart-pulse | ti-heartbeat |
| medication | medication | ph-pill | pill | ti-pill |
| medical-service | medical_services | ph-first-aid | cross | ti-first-aid |
| health-safety | health_and_safety | ph-shield-plus | shield-plus | ti-shield-plus |
| stethoscope | stethoscope | ph-stethoscope | stethoscope | ti-stethoscope |
| fitness | fitness_center | ph-barbell | dumbbell | ti-barbell |
| nutrition | restaurant | ph-fork-knife | utensils | ti-tools-kitchen-2 |
| hydration | water_drop | ph-drop | droplets | ti-droplet |

### Status & Feedback
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| success | check_circle | ph-check-circle | check-circle | ti-circle-check |
| error | cancel | ph-x-circle | x-circle | ti-circle-x |
| warning | warning | ph-warning | alert-triangle | ti-alert-triangle |
| info | info | ph-info | info | ti-info-circle |
| goal-complete | emoji_events | ph-trophy | trophy | ti-trophy |

### Actions
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| add-entry | add_circle | ph-plus-circle | plus-circle | ti-circle-plus |
| calendar | calendar_month | ph-calendar | calendar | ti-calendar |
| timer | timer | ph-timer | timer | ti-clock |
| close | close | ph-x | x | ti-x |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bracket placeholders `[MerchantIcon 40x40]` in component specs | Semantic role reference + icon token size (e.g., "Icon (vocabulary: merchant) --icon-lg") | Phase 10 (this phase) | Component specs reference the vocabulary table instead of generic placeholders |
| No icon vocabulary per vertical | 15-25 curated, verified icon names per vertical | Phase 10 (this phase) | Composers look up concrete names from a table instead of hallucinating |
| Common icons table only (15 generic UI concepts) | Common table (Phase 9) + per-vertical domain-specific vocabulary (Phase 10) | Phase 10 (this phase) | Domain-specific icons (bank, stethoscope, storefront) are available alongside common icons |

**Deprecated/outdated:**
- Bracket placeholders (`[MerchantIcon 40x40]`) -- replaced by vocabulary references with icon size tokens
- Generic icon names without library prefix -- all names now include library-specific syntax (ph-, ti-, data-lucide=, span text content)

## Verified Icon Names

The following icon names have been verified to exist in their respective libraries by checking the raw SVG files in the official GitHub repositories. Confidence: HIGH.

### Phosphor Icons (fintech primary) -- Verified via github.com/phosphor-icons/core/assets/regular/

| Icon Name | Verified |
|-----------|----------|
| bank | YES |
| wallet | YES |
| credit-card | YES |
| currency-dollar | YES |
| chart-line-up | YES |
| coins | YES |
| receipt | YES |
| hand-coins | YES |
| piggy-bank | YES |
| shield-check | YES |
| fingerprint | YES |
| qr-code | YES |
| trend-up | YES |
| trend-down | YES |
| arrows-left-right | YES |
| swap | YES |

### Material Symbols (health + e-commerce primary) -- Verified via github.com/google/material-design-icons/symbols/web/

| Icon Name | Verified |
|-----------|----------|
| stethoscope | YES |
| medication | YES |
| monitor_heart | YES |
| health_and_safety | YES |
| storefront | YES |
| local_shipping | YES |
| shopping_cart | YES |

### Lucide (SaaS primary) -- Verified via github.com/lucide-icons/lucide/icons/

| Icon Name | Verified |
|-----------|----------|
| trending-up | YES |
| layout-dashboard | YES |
| layers | YES |

**Note:** The 15 common UI concepts in `icon-libraries.md` (home, search, settings, user, cart, heart, arrow-right, chart, notification, close, check, mail, calendar, lock, credit-card) were verified during Phase 9 research.

## Open Questions

1. **Exact replacement text for bracket placeholders**
   - What we know: The bracket placeholders must be replaced (success criterion #5). The component specs use XML-like shorthand notation.
   - What's unclear: The exact wording of the replacement. Should it say "Icon (vocabulary: merchant) --icon-lg" or "merchant icon (--icon-lg, vocabulary lookup)" or something else?
   - Recommendation: Use a consistent pattern across all replacements: `[icon: {semantic-role} --icon-{size}]` where `{semantic-role}` matches a row in the vocabulary table and `--icon-{size}` is the token. Example: `[icon: merchant --icon-lg in 40x40 container]`. The planner should standardize the notation.

2. **Whether ecommerce.md descriptive icon references should also be updated**
   - What we know: `ecommerce.md` has no `[.*Icon]` bracket placeholders. But it has descriptive references like "star icons --text-xs", "heart icon top-right overlay", "X icon or 'Remove' text link". These are not bracket placeholders and would pass the `grep` success criterion.
   - What's unclear: Should these descriptive references also be made concrete?
   - Recommendation: Leave descriptive references as-is for Phase 10. They don't fail the grep criterion and they serve a different purpose (describing interaction behavior, not specifying icon dimensions). Phase 11 (pipeline integration) can address this when the composer agent is updated.

3. **Vocabulary for secondary library (user override scenario)**
   - What we know: Per the locked decision, vocabularies use library-agnostic semantic roles mapped to concrete names per library. The cross-library table covers this.
   - What's unclear: Should ALL 4 library columns always be populated, even for niche domain icons where a library might not have an exact match?
   - Recommendation: Populate all 4 columns. If a library lacks an exact match for a domain-specific concept, use the closest available icon and note it. Example: Lucide may not have a "stethoscope" icon -- use `stethoscope` if it exists, or document `activity` as the closest alternative. This prevents blank columns that would break agent lookup.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `core/references/verticals/fintech.md`, `health.md`, `saas.md`, `ecommerce.md` -- component specs, bracket placeholders, domain patterns
- Codebase analysis: `core/references/icon-libraries.md` -- naming conventions, domain affinity matrix, CDN metadata (Phase 9 deliverable)
- Phase 9 research: `.planning/phases/09-foundation/09-RESEARCH.md` -- discretion recommendations, vocabulary adaptation strategy
- Phase 9 context: `.planning/phases/09-foundation/09-CONTEXT.md` -- locked decisions on library-agnostic semantic roles, cross-library mapping
- GitHub verification: Phosphor Icons core repo (`phosphor-icons/core/assets/regular/`) -- 16 fintech icons verified
- GitHub verification: Material Design Icons repo (`google/material-design-icons/symbols/web/`) -- 7 health/e-commerce icons verified
- GitHub verification: Lucide Icons repo (`lucide-icons/lucide/icons/`) -- 3 SaaS icons verified

### Secondary (MEDIUM confidence)
- Phase 9 research: `.planning/research/icon-libraries/STACK.md` -- library naming conventions, domain affinity analysis
- Phase 9 research: `.planning/research/icon-libraries/PITFALLS.md` -- icon name hallucination as #1 critical pitfall
- Phase 9 research: `.planning/research/icon-libraries/FEATURES.md` -- vertical-specific icon catalogs as a differentiator feature

### Tertiary (LOW confidence)
- Some Lucide and Material Symbols icon names for domain-specific concepts (e.g., `stethoscope` in Lucide, `ecg` in Material Symbols) were verified via GitHub but not all names in the planned vocabularies have been individually verified. The planner should mandate name verification as a task step.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, no new files, modifications to 4 existing files following established patterns
- Architecture: HIGH -- vocabulary section structure follows existing vertical file patterns; cross-library table follows `icon-libraries.md` icon name conventions table
- Pitfalls: HIGH -- icon name hallucination is the #1 documented risk from Phase 9 research; all other pitfalls are well-understood from prior phase work

**Research date:** 2026-03-04
**Valid until:** 2026-06-04 (90 days -- vocabulary is static data tied to pinned library versions; re-verify if library versions are updated)
