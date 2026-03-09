# Education Design Intelligence

## Core Design Principle
**Clarity enables learning.** Users are studying, progressing, and achieving -- the UI must feel structured, encouraging, and never overwhelming. Great education design creates a sense of forward momentum: every element guides the learner to the next step, celebrates progress, and reduces the cognitive load of the content itself so the student can focus on what they're learning, not how to use the tool.

## Navigation Patterns

### Standard Models
- **Mobile:** Bottom tab bar, 5 items. Home/Dashboard, Courses, Assignments/Tasks, Progress/Grades, Profile. Primary action surfaces are course detail and active lesson views.
- **Desktop:** Persistent left sidebar, 260px expanded, 64px collapsed. Grouped: Dashboard, My Courses, Calendar, Assignments, Grades/Progress, Resources, Settings. Top bar for search + notifications + profile. Course detail view uses in-page sidebar for module navigation.
- **Action surfaces:** Module accordion or vertical stepper for lesson navigation within a course. Slide-over panels for assignment submission. Full-screen mode for video lessons and quizzes.

### Vertical-Specific Rules
- Current course or active lesson: accessible within 1 tap from dashboard -- "Continue Learning" hero card
- Progress indicators: visible on every course card and within course navigation -- never hide completion state
- Calendar/due dates: prominent placement, color-coded by urgency (overdue, due today, upcoming)
- Search: scoped to course content by default (lessons, resources, discussions), expandable to full catalog
- Breadcrumb navigation: Course > Module > Lesson -- always visible during lesson view

## Color System

### Palette A: Deep Teal (Knowledge)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #F0FDFA | #042F2E | Subtle backgrounds, completed states |
| primary-100 | #CCFBF1 | #134E4A | Hover states on light surfaces |
| primary-200 | #99F6E4 | #115E59 | Borders, focus rings |
| primary-300 | #5EEAD4 | #0F766E | Icons, decorative accents |
| primary-400 | #2DD4BF | #0D9488 | Secondary actions, links |
| primary-500 | #0D9488 | #2DD4BF | Primary actions, brand (HSL 175 84% 32%) |
| primary-600 | #0F766E | #5EEAD4 | Hover on primary buttons |
| primary-700 | #115E59 | #99F6E4 | Active/pressed state |
| primary-800 | #134E4A | #CCFBF1 | Text on light backgrounds |
| primary-900 | #042F2E | #F0FDFA | Headings on light backgrounds |
| surface-primary | #FFFFFF | #0F1413 | Main background |
| surface-secondary | #F8FDFB | #1A2422 | Cards, sidebar |
| surface-tertiary | #F0F7F5 | #253533 | Nested elements, input backgrounds |
| text-primary | #1A2420 | #F0F7F5 | Body text (14.8:1 AAA) |
| text-secondary | #5B706A | #8FA8A2 | Supporting text (5.3:1 AA) |

### Palette B: Warm Amber (Achievement)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #D97706 | #FBBF24 | Brand accent, achievement badges, highlights |
| surface-primary | #FFFFFF | #0F0D08 | Main background |
| surface-secondary | #FFFBF0 | #1C1A12 | Cards, panels |
| text-primary | #1C1A0E | #FFFBF0 | Body text (15.6:1 AAA) |
| text-secondary | #78705A | #A89E82 | Supporting text (5.0:1 AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | Education Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Lesson completed, quiz passed, assignment submitted |
| Error | #DC2626 | #F87171 | Quiz failed, assignment overdue, submission error |
| Warning | #D97706 | #FBBF24 | Due soon (24-48h), incomplete prerequisite, low grade |
| Info | #2563EB | #60A5FA | New content available, instructor announcement, resource added |

### Color Anti-Patterns
- Never use red for grades below passing without context -- pair with "needs improvement" messaging, not just a failing number
- Never use saturated backgrounds behind reading content -- extended reading requires neutral surfaces
- Never use more than 2 status colors simultaneously on a progress indicator -- simplify to completed/current/upcoming
- Never use gray for progress bars -- even 0% progress should use a faint primary tint to indicate the path ahead

## Typography

### Pairing A: Outfit + Source Sans 3
- **Display:** Outfit 700 at -0.02em -- clean geometric with slight warmth, modern and approachable (Google Fonts)
- **Body:** Source Sans 3 400/500 at 0em -- optimized for UI readability, excellent for extended reading at 14-16px (Google Fonts)

### Pairing B: Fraunces + Nunito
- **Display:** Fraunces 700 at -0.01em -- warm optical authority with soft wonky details, feels academic yet friendly (Google Fonts)
- **Body:** Nunito 400/500 at 0em -- rounded terminals create approachable warmth for younger audiences (Google Fonts)

### Data & Mono
- JetBrains Mono 500 or Fira Code 500 with `font-variant-numeric: tabular-nums` for code snippets in technical courses, grade displays, and progress percentages

### Type Scale
| Token | Size | Line Height | Education Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Timestamps, badge labels, "X of Y lessons complete" |
| text-sm | 0.875rem (14px) | 1.45 | Module labels, instructor name, enrollment count, metadata |
| text-base | 1rem (16px) | 1.5 | Lesson content body, descriptions, discussion posts |
| text-lg | 1.125rem (18px) | 1.45 | Module headings, card titles, quiz question text |
| text-xl | 1.25rem (20px) | 1.35 | Course title, section headers, page titles |
| text-2xl | 1.5rem (24px) | 1.3 | Dashboard greeting, feature headers |
| text-3xl | 1.875rem (30px) | 1.2 | Hero course title, completion celebration |

### Typography Rules
- Progress percentages and grades: --font-mono with tabular-nums for consistent alignment
- Course duration and timestamps: --text-xs --text-secondary, human-readable format ("2h 30m" not "150 min")
- Quiz question text: --text-lg minimum for readability during assessment pressure
- Instructor credentials: --text-sm --weight-medium, separate line from name

### Typography Anti-Patterns
- Never use decorative/script fonts for lesson content -- undermines content credibility
- Never use light font weights (300 or below) for body text in lessons -- extended reading demands 400+
- Never set line height below 1.4 for content paragraphs -- education content requires generous leading
- Never use all-uppercase for course titles -- reduces scanability when browsing catalog

## Spacing & Density

### Recommended Density: Comfortable
Learning interfaces need breathing room. Dense layouts increase cognitive load and discourage sustained engagement. Generous spacing supports focus and reduces overwhelm for learners of all levels.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Card internal padding | 20px | --space-5 |
| Course card gap | 16-20px | --space-4 to --space-5 |
| Module list item height | 56px | -- |
| Module list item padding | 12px 16px | --space-3 --space-4 |
| Section gap | 32px | --space-8 |
| Form field gap | 16px | --space-4 |
| Button padding | 12px 24px | --space-3 --space-6 |
| Touch target minimum | 48x48px | -- |
| Sidebar width (expanded) | 260px | -- |

## Component Specifications

### CourseCard
```xml
<component name="CourseCard" category="data-display">
  <description>Course listing card displaying key enrollment information. Primary browsing element in catalog and dashboard views.</description>
  <structure>
    Image: course thumbnail, 16:9 aspect ratio, --radius-lg top corners
    Category badge: overlay on image top-left, --text-xs --weight-medium, --radius-sm, semi-transparent bg
    Body: [Title --text-lg --weight-semibold --text-primary, max 2 lines] [Instructor --text-sm --text-secondary with small avatar 24x24] [Progress bar: full width, 4px height, --radius-full, primary-500 fill]
    Footer: [Enrollment count --text-xs --text-secondary] [Duration --text-xs --text-secondary] [Rating stars --text-xs]
    Progress label: --text-xs --weight-medium, "X% complete" right-aligned above bar
  </structure>
  <dimensions>
    width: 100% of grid column (280-320px typical), border-radius: --radius-lg
    image-height: 160px, body-padding: --space-4, footer-padding: --space-3 --space-4
    progress-bar: height 4px, --radius-full, --surface-tertiary track
  </dimensions>
  <states>
    default: --surface-secondary background, --shadow-sm
    hover: --shadow-md, translateY(-2px) 200ms ease-out
    enrolled: progress bar visible, "Continue" CTA replaces "Enroll"
    completed: --color-success checkmark badge on image, "Completed" label
    new: "NEW" badge on image top-right, --color-info bg
  </states>
</component>
```

### LessonProgress
```xml
<component name="LessonProgress" category="navigation">
  <description>Vertical stepper/timeline showing module and lesson completion status. Primary in-course navigation and progress visualization.</description>
  <structure>
    Module group: [Module title --text-sm --weight-semibold] [Vertical line connecting lessons]
    Lesson item: [Status circle 24x24: empty/current/complete] [Vertical connector line 2px] [Lesson title --text-sm] [Duration --text-xs --text-secondary] [Type icon: video/text/quiz]
    Status circle: empty=--border-secondary outline, current=--primary-500 filled with pulse, complete=--color-success with check icon
    Connector line: --border-secondary (incomplete), --color-success (completed segment)
    Current lesson: highlighted row with --primary-50 background
  </structure>
  <dimensions>
    item-height: 48px, circle-size: 24x24px, connector-width: 2px
    indent: 36px from circle center to text
    module-gap: --space-6 between modules
    lesson-gap: 0 (continuous timeline)
    padding: --space-3 --space-4 per item
  </dimensions>
  <states>
    locked: circle grayed out, title --text-secondary, lock icon, tooltip "Complete previous lesson first"
    available: circle outline --border-primary, title --text-primary
    current: circle filled --primary-500 with subtle pulse, --primary-50 row background
    completed: circle --color-success with check, connector below turns --color-success
    quiz-result: circle shows score badge (e.g., "8/10"), color-coded by pass/fail
  </states>
</component>
```

### QuizQuestion
```xml
<component name="QuizQuestion" category="interaction">
  <description>Assessment question with answer options, submission, and result feedback. Core learning validation component.</description>
  <structure>
    Header: [Question number --text-xs --weight-medium --text-secondary "Question X of Y"] [Progress bar: thin, shows position in quiz]
    Question text: --text-lg --weight-medium --text-primary, supports markdown and inline code
    Options: [Radio/Checkbox 20x20] [Option text --text-base] -- vertical stack, 1 option per row
    Option row: full-width tap target, --radius-md, --space-3 padding
    Submit button: --primary-500 bg, full width or right-aligned, disabled until selection made
    Result feedback: [Correct/Incorrect banner with icon] [Explanation text --text-sm --text-secondary]
  </structure>
  <dimensions>
    question-padding: --space-6, option-gap: --space-2
    option-row-padding: --space-3 --space-4, min-height: 48px
    radio/checkbox: 20x20px, --border-primary, --radius-full (radio) or --radius-sm (checkbox)
    submit-button: padding --space-3 --space-6, --radius-md
  </dimensions>
  <states>
    unanswered: options neutral, submit disabled (--surface-tertiary bg)
    selected: chosen option has --primary-50 bg, --primary-500 border, radio/checkbox filled
    submitted-correct: option bg --color-success at 10% opacity, check icon, explanation appears with --color-success left border
    submitted-incorrect: chosen option bg --color-error at 10% opacity, x icon, correct answer highlighted in --color-success, explanation appears
    reviewing: all options visible with correct/incorrect indicators, no submit button
  </states>
</component>
```

## Interaction Patterns

### Core Flows
1. **Enrolling in a course:** Browse catalog or search → Course detail page (description, syllabus, instructor bio, reviews) → "Enroll" button → Confirmation with expected time commitment → Redirect to first lesson with welcome message.
2. **Completing a lesson:** Open lesson from LessonProgress stepper → Consume content (video player with playback controls, or text with scroll progress) → Mark complete (auto on video end, manual for text) → Next lesson auto-advances or shows completion card.
3. **Taking a quiz:** Start quiz from lesson flow → One question at a time (or scrollable list) → Select answer(s) → Submit → Immediate feedback with explanation → Final score summary with pass/fail status and retry option.

### States
**Loading:** Skeleton screens with shimmer (left-to-right, 1.5s cycle). Course catalog shows 6 skeleton cards in grid. Lesson content shows title skeleton + paragraph block skeletons. Video player shows --surface-tertiary rectangle with centered play icon placeholder.
**Empty:** No courses enrolled: "Browse our catalog to find your first course" with category cards and "Popular Courses" section. No assignments pending: "You're all caught up! No pending assignments" with subtle celebration illustration. No progress yet: "Start your first lesson to begin tracking progress."
**Error:** Content load failure: "We couldn't load this lesson. Your progress is saved -- try refreshing." Quiz submission error: "Your answers are saved. We'll submit when reconnected." Network error: "You're offline. Previously downloaded lessons are still available."

### Motion
**Appropriate:** Progress bar fill animation (400ms ease-out), lesson completion checkmark (300ms), quiz answer feedback slide-in (200ms), course card hover lift (200ms), stepper step transition (250ms), confetti burst on course completion (600ms, once).
**Inappropriate:** Bouncy animations during quiz-taking (distracting during assessment), slow page transitions between lessons (breaks flow), auto-playing celebration on every lesson (celebration fatigue), parallax effects on content pages (motion sickness risk during extended study).

## Accessibility Specifics
- Video lessons: closed captions required, transcript available as text alternative, adjustable playback speed
- Quiz interactions: full keyboard navigation (Tab between options, Space/Enter to select, Enter to submit)
- Progress indicators: screen reader announces "Lesson 3 of 12 complete, 25% progress" not just visual bar
- Color-coded grades: always include text label (e.g., "Pass - 85%"), never rely on green/red alone
- Content readability: minimum 16px body text for lesson content, 1.5 line height for paragraphs
- Focus management: after quiz submission, focus moves to result feedback for screen reader announcement

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 4px | Badges, chips, inline elements -- crisp but approachable |
| radius-md | 8px | Buttons, inputs, option rows -- structured and clean |
| radius-lg | 12px | Course cards, content containers -- friendly and modern |
| radius-xl | 16px | Modals, bottom sheets, video player -- welcoming for learning context |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle card elevation, stepper container |
| shadow-md | 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05) | Course cards, dropdown menus, quiz container |
| shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04) | Modals, video player overlay, completion celebration card |

<!-- Icon names verified against: Lucide v0.400+, Phosphor Icons v2.1+, Material Symbols, Tabler Icons v3.0+ -->

## Icon Vocabulary

Primary library: Material Symbols Rounded (from icon-libraries.md domain affinity matrix)

### Navigation
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| home | house | ph-house | home | ti-home |
| search | search | ph-magnifying-glass | search | ti-search |
| settings | settings | ph-gear | settings | ti-settings |
| profile | user | ph-user | person | ti-user |
| notifications | bell | ph-bell | notifications | ti-bell |

### Education & Learning
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| course | book-open | ph-book-open | menu_book | ti-book |
| lesson | play-circle | ph-play-circle | play_circle | ti-player-play |
| quiz | help-circle | ph-question | quiz | ti-help |
| assignment | clipboard-list | ph-clipboard-text | assignment | ti-clipboard-list |
| grade | award | ph-trophy | grade | ti-award |
| certificate | file-badge | ph-certificate | workspace_premium | ti-certificate |
| calendar | calendar | ph-calendar | calendar_today | ti-calendar |
| download | download | ph-download-simple | download | ti-download |

### Status & Feedback
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| complete | check-circle | ph-check-circle | check_circle | ti-circle-check |
| incomplete | circle | ph-circle | radio_button_unchecked | ti-circle |
| locked | lock | ph-lock | lock | ti-lock |
| warning | alert-triangle | ph-warning | warning | ti-alert-triangle |
| progress | loader | ph-spinner | progress_activity | ti-loader |

### Actions
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| enroll | user-plus | ph-user-plus | person_add | ti-user-plus |
| submit | send | ph-paper-plane-tilt | send | ti-send |
| retry | refresh-cw | ph-arrows-clockwise | refresh | ti-refresh |
| bookmark | bookmark | ph-bookmark-simple | bookmark | ti-bookmark |
| share | share-2 | ph-share-network | share | ti-share |
| close | x | ph-x | close | ti-x |

## Education-Specific Additions
- **Progress-first dashboard:** Dashboard hero shows "Continue Learning" card with current course, next lesson title, and progress ring. Below: upcoming assignments with due dates, recent grades, recommended courses.
- **Micro-celebrations:** Brief animations on milestone completion: lesson done (checkmark + progress increment), module done (progress ring fills a segment), course done (confetti + certificate preview). Keep celebrations under 1 second to avoid disrupting flow.
- **Offline learning support:** Downloaded content indicator on course cards (cloud-check icon). Progress syncs when reconnected. Downloaded lessons available in dedicated "Offline" tab.
- **Instructor presence:** Small avatar + name on every piece of content. "Ask Instructor" floating action in lesson view. Response time indicator on instructor profile ("Usually responds within 2h").
- **Adaptive difficulty indicators:** Visual hint on quiz/assignment difficulty (1-3 filled circles). Estimated completion time displayed before starting. "Review recommended" suggestion based on past quiz performance.
- **Discussion threads:** Per-lesson discussion accessible via tab below content. Instructor responses highlighted with badge. Upvote system for peer answers. Pin important threads.
