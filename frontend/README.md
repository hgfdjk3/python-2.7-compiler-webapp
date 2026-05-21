# Atom — Design System & UI Reference

A dark-mode-first, Mantine-based React application with a cohesive design language built on the **Zinc** color palette, **Geist** typography, and `motion/react` animations.

---

## Stack

| Layer | Library |
|---|---|
| UI Framework | [Mantine v9](https://mantine.dev) |
| Animations | [motion/react](https://motion.dev) (`motion` package) |
| Icons | [@tabler/icons-react](https://tabler-icons.io) |
| Routing | react-router-dom v7 |
| Charts | recharts |
| Fonts | Geist / Geist Mono (via `geist` package) |

---

## Design Tokens

### Color Palette

The app uses a **full Tailwind-style color palette** registered in `src/theme.ts`. All colors are available as `var(--mantine-color-{name}-{shade})`.

| Scale | Usage |
|---|---|
| `zinc` | **Primary neutral** — all surfaces, borders, text (dark: zinc-9/8 bg, zinc-1 text) |
| `slate` / `gray` | Alternative neutrals |
| `violet` | Developer Hub, primary accent, badges |
| `teal` | Active/success states, enabled badges |
| `red` | Destructive, errors |
| `orange` / `amber` | Warnings, auth badges |

**Primary color is `zinc`** — `primaryShade: { light: 8, dark: 0 }`.

### Typography

```
fontFamily: "Geist"
fontFamilyMonospace: "Geist Mono"
```

| Token | Size |
|---|---|
| `xs` | 12px |
| `sm` | 14px |
| `md` | 16px |
| `lg` | 18px |
| `xl` | 20px |
| `2xl–5xl` | 24px – 48px |

**Page titles**: `fw={800}` with `letterSpacing: '-0.5px'` to `-1.5px`  
**Section labels**: `size="xs" fw={700} tt="uppercase" c="dimmed"` with `letterSpacing: '0.6px'`

### Spacing

```
4xs=2px  3xs=4px  2xs=8px  xs=10px  sm=12px  md=16px
lg=20px  xl=24px  2xl=28px  3xl=32px  4xl=40px
```

### Border Radius

```
xs=6px  sm=8px  md=12px  lg=16px  xl=24px
defaultRadius: "sm"
```

### Shadows

Subtle layered shadows (`xs` → `xxl`). Cards typically use `shadow="sm"` or `shadow="xl"`.

---

## Theme-Aware Surfaces

Always use CSS custom properties for adaptive light/dark surfaces:

```css
/* Body background */
background-color: var(--mantine-color-body);

/* Border */
border: 1px solid var(--mantine-color-default-border);

/* Hover state */
background-color: var(--mantine-color-default-hover);

/* Light/dark explicit override */
background-color: light-dark(var(--mantine-color-zinc-0), var(--mantine-color-zinc-9));
```

---

## Agent Brand Color System

Each agent in `AgentInfo` carries a `brandColor: string` (hex). This single value drives all brand-specific visual accents using **CSS custom properties + `color-mix()`**:

```tsx
// Pass brand color to DOM via CSS custom property
style={{ '--agent-brand-color': agent.brandColor } as React.CSSProperties}
```

```css
/* Tinted overlay */
background: color-mix(in srgb, var(--agent-brand-color) 12%, transparent);

/* Hover glow border */
box-shadow: 0 0 0 1px color-mix(in srgb, var(--agent-brand-color) 50%, transparent);

/* Icon tint on hover */
color: var(--agent-brand-color) !important;
background-color: color-mix(in srgb, var(--agent-brand-color) 15%, transparent) !important;
```

> **Note:** Some brand colors are white (`#fff`) or near-black (`#171717`). Components that render charts or colored glows must normalize these to a fallback (e.g. `#818cf8` violet).

---

## Component Patterns

### Cards (`AgentCard`)
- Mantine `<Card withBorder shadow="sm" radius="md">`  
- `::before` — diagonal brand-tinted gradient overlay (always visible at low opacity)  
- `::after` — radial top-right glow (intensifies on hover)  
- Hover: colored `box-shadow` ring replaces border  
- Icon: `ThemeIcon` turns brand-colored with a `drop-shadow` on hover

### Modals (`AgentModal`)
- `radius="xl" padding=0 centered` — zero-padding for full-bleed hero  
- Hero section: radial `brandColor@12%` gradient top-left  
- Icon: 64px with an animated **aura** (`motion.div` breathing scale/opacity loop), inner zinc-9 bg  
- Action button: `linear-gradient(135deg, brandColor, mix(brandColor, black 30%))` when enabling  
- Content animates in staggered with `motion.div` at delays 0.1–0.4s

### Row Lists
- Clean `border-bottom` dividers, no card wrappers  
- First child gets `border-top` to close the list  
- Hover: `opacity: 0.75` or subtle `translateX`  
- Expand/collapse via Mantine `<Collapse opened={state}>`

### Charts (`ActivityChart`, `AgentUsageChart`)
- recharts `<AreaChart>` inside `<ResponsiveContainer>`  
- Gradient fill via `<linearGradient>` defs: `brandColor@20-30%` → transparent  
- Axis colors: `rgba(255,255,255,0.25)` dark / `rgba(0,0,0,0.3)` light  
- Grid: `rgba(255,255,255,0.04)` dark — horizontal only, `strokeDasharray="3 3"`  
- Custom tooltip: zinc-9 bg, default border, `box-shadow`

---

## Animation Conventions

All animations use `motion/react` (imported as `from 'motion/react'`).

| Use case | Pattern |
|---|---|
| Page/section entrance | `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}` |
| List item stagger | `delay: index * 0.04` on each child |
| Slide-in from left | `initial={{ opacity: 0, x: -8 }}` |
| Shared layout pill | `<motion.div layoutId="unique-id">` with `spring bounce=0.2` |
| Breathing aura | `animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }} repeat: Infinity` |
| Spring transitions | `type: 'spring', stiffness: 300, damping: 24` |
| Standard ease | `duration: 0.25–0.35, ease: 'easeOut'` |

---

## CSS Architecture

- **Complex component styles** → own `.css` file co-located with the component
- **Simple inline styles** → Mantine `style={{}}` prop
- **Mantine CSS variables** used exclusively for colors, spacing, radius — no hardcoded values
- **No TailwindCSS** — all styling via Mantine + vanilla CSS
- **`color-mix(in srgb, ...)`** for all brand-tinted opacities instead of `rgba`

---

## File Structure

```
src/
├── components/
│   ├── Agents/          # AgentCard, AgentModal, AgentMarketplace
│   ├── Developers/      # DevSubHeader, AgentRow, AgentUsageChart
│   ├── Dashboard/       # ActivityChart
│   ├── Layout/          # Sidebar, ProjectLayout
│   ├── HomeOverview/    # Dashboard home
│   └── ...
├── pages/
│   ├── Home.page.tsx
│   ├── Agents.page.tsx       # /agents — Connectors Marketplace
│   ├── Developers.page.tsx   # /developers — Hub landing
│   ├── DevelopersDocs.page.tsx        # /developers/docs
│   ├── DevelopersConnections.page.tsx # /developers/connections
│   └── ...
├── utils/
│   └── agentUtils.tsx   # AgentInfo type, AGENTS_DIRECTORY, TOOLS_DIRECTORY
└── theme.ts             # Full Mantine theme with all color scales
```

---

## AgentInfo Shape

```ts
interface AgentInfo {
  id: string;
  name: string;
  description: string;
  developer: string;
  developerWebsite?: string;
  developerSupport?: string;
  category: string;       // e.g. "Development & Code", "Database & Storage"
  brandColor: string;     // hex — drives all visual accents
  icon: React.ReactNode;  // Tabler icon at size=24 stroke=1.5
  sourcesAdded: string[]; // e.g. ["Repositories", "Pull Requests"]
  toolsEnabled: string[]; // e.g. ["Create Issue", "Trigger Workflow"]
}
```

---

## Component Rules

- Export as arrow function: `export const Foo: React.FC<FooProps> = ({ ... }) => ...`
- Interface defined and destructured in the same component file
- Complex styling → own `.css` file
- Use `motion/react` (not `framer-motion`)
- Use `<Collapse opened={bool}>` (not `in=`)

---

## Scripts

```bash
yarn dev          # Start dev server
yarn build        # Type-check + build
yarn typecheck    # tsc --noEmit
yarn lint         # oxlint + stylelint
```
