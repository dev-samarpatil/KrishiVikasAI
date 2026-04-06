
# 04 — UI/UX Style Guide
**Tailwind CSS · Inter Font · Component Specs**

> **CRITICAL VIBE CODER INSTRUCTION:** > **STRICT REQUIREMENT:** Use **Node.js v22+**, **Next.js 15**, **React 19**, and **Tailwind CSS 3.4+**. Do NOT use legacy Next.js 14 or older React syntax. Ensure all interactive elements have haptic feedback (if supported) and touch targets are a minimum of 44x44px.

This file defines every visual detail of the Krishi Vikas AI frontend. 
A working demo has been built and validated — implement exactly what is described here.

## Design Philosophy
* **Mobile-first PWA** — 375px wide Android phones are the primary target
* **Voice-first** — the pulsing FAB is the hero interaction, always visible
* **Low-literacy friendly** — icons do the heavy lifting, text is minimal and bold
* **Native app feel** — fixed shell, only inner content scrolls, haptic feedback on every tap
* **Outdoor readable** — High contrast colors, no soft grays that vanish in sunlight, 12px minimum font

## Brand
### Logo
* File: `public/logo.png` (leaf + K + arrow motif, provided)
* Usage in TopBar: `<Image src="/logo.png" width={30} height={30} className="rounded-lg" alt="logo" />`
* PWA icons: resize to `icon-192.png` and `icon-512.png` (use squoosh.app)

### Typography
* **Font family:** Inter (import from Google Fonts or `next/font/google`)
* **Brand name:** `font-extrabold text-xl tracking-tight text-green-900`
* **Brand AI:** `font-extrabold text-xl text-blue-700`
* **Tagline:** `text-[10px] tracking-widest text-gray-600 uppercase font-semibold`
* **Headings:** `font-bold text-base text-gray-900`
* **Body:** `text-sm text-gray-700 leading-relaxed`
* **Min font size:** NEVER below `text-xs` (12px) — farmers read at a distance. 

## Colour System
| Token | Hex | Tailwind class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary green** | `#2E7D32` | `green-700` / `green-800` | Branding, buttons, active tab, FAB |
| **Dark green** | `#1B5E20` | `green-900` | Brand text, strong headings |
| **Light green** | `#F0FDF4` | `green-50` | Card backgrounds, scan hero |
| **Green border** | `#C8E6C9` | `green-200` | Card borders on green surfaces |
| **App background**| `#F9FAFB` | `gray-50` | Entire app background (reduces glare) |
| **Card white** | `#FFFFFF` | `white` | All cards |
| **Card border** | `#E5E7EB` | `gray-200` | Default card borders (darkened for sunlight) |
| **Alert red** | `#EF4444` | `red-500` | Outbreak alerts, urgent |
| **Alert amber** | `#D97706` | `amber-600` | Climate warnings, moderate (darkened for visibility) |
| **Weather blue** | `#0284C7` | `sky-600` | Weather widget background |
| **Map navy** | `#1E293B` | `slate-800` | Map toggle pill background |
| **Gray text** | `#4B5563` | `gray-600` | Descriptions, secondary text (darkened for outdoor reading) |

---

## Global App Shell

### TopBar (fixed, always visible)
```jsx
<header className="fixed top-0 z-50 w-full bg-gray-50 shadow-sm border-b border-gray-200 px-3 py-2.5 flex justify-between items-center">
  {/* LEFT: Logo + Brand */}
  <div className="flex items-center gap-2">
    <Image src="/logo.png" width={30} height={30} className="rounded-lg" alt="logo" />
    <div>
      <div className="text-xl font-extrabold tracking-tight leading-none">
        <span className="text-green-900">Krishi Vikas </span>
        <span className="text-blue-700">AI</span>
      </div>
      <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5 font-bold">
        Empowering Farmers
      </div>
    </div>
  </div>

  {/* RIGHT: Language pill */}
  <button
    onClick={() => setLangModalOpen(true)}
    className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-full px-3 py-2 shadow-sm active:scale-[0.96] transition-all min-h-[44px]"
  >
    <GlobeIcon className="w-4 h-4 text-gray-600" />
    <span className="text-sm font-bold text-gray-800">{currentLangNative}</span>
    <ChevronDownIcon className="w-4 h-4 text-gray-600" />
  </button>
</header>
```

### BottomNav (fixed, always visible)
```jsx
<nav className="fixed bottom-0 z-20 w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 py-2 flex justify-around pb-safe">
  {tabs.map(tab => (
    <button key={tab.id} onClick={() => router.push(tab.path)}
      className="flex flex-col items-center gap-1 px-3 py-2 active:scale-[0.93] transition-all min-w-[60px]">
      <tab.Icon className={cn("w-6 h-6", isActive(tab) ? "stroke-green-700" : "stroke-gray-500")} strokeWidth={isActive(tab) ? 2.5 : 2} />
      <span className={cn("text-xs font-medium", isActive(tab) ? "text-green-700 font-bold" : "text-gray-500")}>
        {tab.label}
      </span>
    </button>
  ))}
</nav>
```

### Voice FAB (floating, always visible)
```jsx
<button
  onClick={handleFABTap}
  className="fixed bottom-24 right-4 z-30 h-16 w-16 rounded-full bg-green-600
             border-4 border-white shadow-xl flex items-center justify-center
             animate-pulse active:scale-95 transition-all"
  style={{ animationDuration: '2.5s' }}
>
  <MicrophoneIcon className="w-8 h-8 text-white" strokeWidth={2} />
</button>
```
*On tap:* `navigator.vibrate(50)` — always fire this for native feel.

---

## Screen 1 — Home

### ScanHeroCard (most important element)
```jsx
<button
  onClick={handleScan}
  className="mx-3 mt-3 bg-green-50 border-2 border-green-300 rounded-3xl
             p-6 w-[calc(100%-24px)] flex flex-col items-center
             active:scale-[0.98] transition-all shadow-sm"
>
  <div className="w-20 h-20 bg-green-100 rounded-2xl border-2 border-green-300
                  flex items-center justify-center mb-4">
    <CameraIcon className="w-10 h-10 text-green-700" strokeWidth={2.5} />
  </div>
  <div className="text-xl font-bold text-green-900">Scan Your Crop</div>
  <div className="text-sm font-medium text-green-700 mt-1">Tap to get instant AI diagnosis</div>
  
  <div className="flex gap-2 mt-4 flex-wrap justify-center">
    {['Disease check', 'Deficiencies', 'Treatment plan'].map(tag => (
      <span key={tag} className="text-xs bg-white text-green-800 px-3 py-1.5
                                 rounded-full border border-green-200 font-bold shadow-sm">
        {tag}
      </span>
    ))}
  </div>
</button>
```

---

## Interaction Rules (Apply Everywhere)
1. **Every tappable card:** `active:scale-[0.98] transition-all duration-100`
2. **Every button:** `active:scale-[0.96] transition-all duration-100`
3. **Every FAB tap:** `navigator.vibrate(50)`
4. **Any loading state:** `animate-pulse` gray skeleton — NEVER blank white
5. **Image uploads:** compress to <200KB via Canvas before sending
6. **Minimum touch target:** 44×44px for all buttons and tabs (Apple/Google accessibility standard)
7. **Language persistence:** `localStorage` key `kv_language`
8. **Bottom sheets:** slide up, never navigate to a new page
9. **Error states:** friendly card message, never raw error text

---

## PWA Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})
module.exports = withPWA({})
```

---

## First Antigravity Prompt (Paste This to Start)

```text
/* VIBE CODER: STRICT REQUIREMENT - Use Python 3.14+, Node.js v22+, Next.js 15, and the absolute latest versions of all SDKs (@google/generative-ai, sarvamai, groq, etc.). Do not use legacy syntax. */

Read docs/01_system_architecture.md, docs/02_gemini_vision_logic.md, 
docs/03_data_mapping_rules.md, and docs/04_ui_ux_style_guide.md fully 
before writing any code.

Build Krishi Vikas AI — a Next.js 15 PWA with Tailwind CSS and 
a FastAPI (Python 3.14+) backend. 

There is NO CNN model. All crop image analysis is done by 
Gemini 1.5 Flash vision API using Pydantic structured outputs (see 02_gemini_vision_logic.md).

The 4 JSON data files are already in the data/ folder:
- data/soil_types.json
- data/schemes.json
- data/kvk_directory.json
- data/crop_calendar.json
Load them at FastAPI startup using lifespan events as described in 03_data_mapping_rules.md.

The logo is at frontend/public/logo.png.
API keys are in backend/.env and frontend/.env.local.

Start by scaffolding the complete project folder structure 
from 01_system_architecture.md, installing all dependencies, 
and running both frontend and backend successfully. 
Then show me they work.
```
```

