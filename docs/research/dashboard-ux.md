# Jaagte Raho: frontend UX spec

Status: design spec for the React build. No code here.
Covers the fleet owner dashboard and the public "try it now" page for judges.

The product is warm and caring. Drivers aren't being watched. The UI should feel like a night-shift companion that keeps the owner informed, never like a surveillance console.
When you have to choose, pick less: fewer screens, fewer numbers, fewer colours.

---

## 0. What the backend gives us (and the limits that shape the UI)

| Need | Source | Notes |
|---|---|---|
| Driver list | `drivers` query | `lastLevel`, `lastCallAt`, `nextCallAt`, `lastAlertAt`, `active`, shift, owner. Demo drivers are hidden by default (`includeDemo: false`). |
| Driver detail | `driver(id)` with `calls(take: 20)` | Each call has `kind` (WELCOME / CHECK_IN / OWNER_ALERT), `status`, `level`, `score`, `reasons[]`, `summary`, `transcript`, `location`, `passenger`, `durationSec`, `recordingUrl`. |
| Activity feed | `recentCalls(take: 50)` | Calls from every driver, newest first. |
| Add / edit / delete | `createDriver`, `updateDriver`, `deleteDriver` | Creating a driver **rings them at once** with a welcome call. The UI must say so before saving. |
| Pause / resume | `updateDriver(id, { active })` | Only the fields sent are changed. |
| Call now | `callDriverNow(id)` | Returns the new `Call` (status `queued`). |
| Try-it page | `POST /demo/call {name, phone, language}` → `{callId}`; `GET /demo/calls/:id` | Returns `status, level, score, reasons, summary, transcript, completedAt`. No phone or recording. |

Facts the UI depends on:
- **Levels:** GREEN ≥ 80, AMBER 45–79, RED < 45, MISSED = didn't pick up. `level: null` with a reason like `call error` means **our** side failed, so don't count it against the driver.
- **Escalation:** AMBER, RED and MISSED all bring the next call forward to `RECALL_MINUTES` (10 by default). The owner gets a call on RED or on two MISSED in a row, with a 30-minute cooldown. An alert shows up as a call with `kind: OWNER_ALERT`, and `driver.lastAlertAt` is set.
- **Call status strings:** `queued` → Bolna's in-progress states (`initiated`, `ringing`, `in-progress`…) → a terminal state (`completed`, `no-answer`, `busy`, `failed`, `canceled`, `stopped`, `error`, `balance-low`), or our `dial-failed`. A call is finished once `completedAt` is set.
- **Transcript** is plain text with `assistant:` / `user:` lines. Render it as chat bubbles.
- **Languages:** hi Hindi, kn Kannada, ta Tamil, te Telugu, mr Marathi, bn Bengali, en English.
- **Phones** must be E.164 (`+919876543210`). **Shift times** are `HH:mm` in IST (`APP_TIMEZONE`). An end at or before the start means the shift wraps past midnight, e.g. 22:00 → 06:00.
- **Auth:** one shared `ADMIN_TOKEN` sent as a Bearer header. There's no login system, so the dashboard has a one-field "access key" screen (§3.0).
- **No push.** Live status means polling (§5.1).

> **Resolved:** `UpdateDriverInput` used to carry GraphQL defaults (`language = "hi"`, shift 22:00–06:00) that reset those fields on every partial update.
> The defaults now live only in the database, so `updateDriver(id, { active: false })` changes nothing else. The UI can send just the fields that changed.

---

## 1. Research: patterns worth borrowing

What to take from each product, and what to leave behind.

| Product | Borrow | Skip |
|---|---|---|
| **Linear** | A dense list that's still quiet: one line per item, status as a small glyph on the left, metadata greyed on the right. Keyboard-first on desktop. Optimistic updates, so actions feel instant. | The sidebar full of features. We have two views. |
| **Vercel** (deployments) | A live status dot next to the deploy, plus a relative time ("2m ago") that ticks. Only the item in progress animates. The detail page leads with the status and the log is secondary, which maps to score first and transcript second. | The monochrome-only palette. Status needs colour, but backed by shape. |
| **Stripe** (dashboard, payment detail) | A detail page with a vertical **event timeline** ("Payment succeeded · 10:42"). Microcopy that reads like a person wrote it. Stripe treats its error messages as UI. | Charts everywhere. Owners don't need a graph of alertness. |
| **Resend** (email logs) | A row with a status pill, and clicking it opens the full event and payload. Calm dark mode on near-black with soft borders, not pure black. | |
| **Better Stack / Instatus** (uptime and status pages) | A **summary line before the list**: "All systems operational", or the one that isn't. A row of small history bars per service. We use the same idea for each driver's last 8 calls. | Big "incident" red banners for small things. |
| **Samsara / Motive** (fleet telematics) | Sort by **who needs attention**, not alphabetically. The driver card shows last location and last event. A "call driver" button sits right on the alert. | Maps, tables full of KPIs and a "safety score" leaderboard. That would make us a surveillance tool. |
| **Apple Health / Fitbit sleep** | Gentle colour, plain-language verdicts ("You slept well") rather than raw numbers first. The number is there but secondary. | |
| **Ola / Uber driver apps, PhonePe** (Indian mobile UX) | Big tap targets, one main action pinned to the bottom of the screen, mixed Hindi and English that people really use, and `tel:` links everywhere. They work on a ₹10k Android over 4G. | |
| **Calm / Headspace** | A night palette that feels restful: deep indigo-black rather than a terminal look, soft rounded shapes, slow easing. | Illustrations and mascots. |

Patterns we're building on:
1. **The summary line comes first.** "All 6 drivers are awake" or "Ramesh ji needs a call".
2. **Sort by attention.** RED, then MISSED twice, then AMBER, then MISSED once, then GREEN, then paused or off shift.
3. **Status = glyph + word + colour**, never colour alone.
4. **History strip** with the last 8 check-ins as tiny marks.
5. **Detail = verdict → reasons → timeline → transcript**, in that order.
6. **The main action is always a phone call**, either a `tel:` link to the driver or "Call now" through the agent.

---

## 2. Users and jobs

### 2.1 Fleet owner / manager (primary)
- **Who:** runs 3–40 cabs or trucks. Often a former driver. Uses WhatsApp, PhonePe and YouTube every day, but not "dashboards". Reads Hindi and Hinglish comfortably; English UI words like "Settings" are fine, English sentences less so.
- **Where:** a phone, often in bed or at the depot, between 10 pm and 6 am, in a dark room. Sometimes a laptop in the office during the day for setup.
- **Their main fear:** a driver crashing because they fell asleep. **What they want:** "Tell me only when I need to act, and make acting one tap."

| Job | When | Success |
|---|---|---|
| "Is everyone okay right now?" | Glances at their phone at 2 am | Answered in under 3 s by the summary line, without scrolling. |
| "Someone's in trouble. What do I do?" | Just got the alert call from Jaagte Raho | Opens the app, the driver is on top, sees "Very sleepy · near Karnal · 2:14 am", taps **Call Ramesh ji**. |
| "What actually happened on that call?" | Next morning, or right after an alert | Reasons in plain words, then the transcript. |
| "Add a new driver" | Daytime, once per driver | Under a minute. Knows the driver will get a welcome call. |
| "This driver is off tonight" | Any time | One tap to pause and one to resume. Nothing gets deleted by accident. |

Design consequences: dark mode by default at night; Hindi toggle; text at least 16 px; tap targets at least 48 px; the alert must be unmistakable without being frightening; no jargon (no "execution", "webhook", "level").

### 2.2 Hackathon judge (secondary, one visit)
- **Who:** technical, scanning 30+ projects, on a laptop or phone, maybe outside India (an international number has to work).
- **What they need:** to "get it" in 30 s. The one line that does it: *"A caring voice calls night-shift drivers, listens for sleepiness, and wakes the owner if needed."* Then their own phone rings.
- **Success:** they hear a warm call in Hindi (or their chosen language) and, within seconds of hanging up, see their own score, the reasons and the transcript on screen. That moment is the demo.
- **Secondary:** a link to see the owner dashboard with sample data. That needs a read-only demo view, which is out of scope for v1, so the judge sees the dashboard in the video or slides instead.

---

## 3. Information architecture

```
/try             Public "try it now" landing (judges)   ← the root URL redirects here when no key is stored
/                Owner dashboard: driver list + summary
/drivers/new     Add driver (sheet on mobile, modal on desktop)
/drivers/:id     Driver detail
/drivers/:id/edit
/key             Enter access key (shown when there's no token or the API returns 401/403)
```

That's all. No settings page in v1: the language toggle and theme live in the header menu. No separate alerts page, because alerts appear in the summary and in each driver's timeline.

Header (every owner screen): wordmark **Jaagte Raho** · status summary (desktop) · `हिं / EN` toggle · ⋯ menu (Theme, Sign out).

### 3.0 Access key

Purpose: store `ADMIN_TOKEN` in `localStorage` once.

```
┌──────────────────────────────┐
│                              │
│   ☾  Jaagte Raho             │
│                              │
│   Enter your access key      │
│   ┌────────────────────────┐ │
│   │ ••••••••••••           │ │
│   └────────────────────────┘ │
│   [        Continue        ] │
│                              │
│   Just want to try it?       │
│   Get a call →  (/try)       │
└──────────────────────────────┘
```
- Validate by running `drivers`. On 401/403 show "That key didn't work. Check with whoever set up Jaagte Raho."
- Sign out clears the key.

### 3.1 Owner dashboard (`/`)

**Purpose:** answer "is everyone okay?" at a glance and put anyone who needs a call at the top.

**Data:** `drivers` (poll, §5.1). Optionally `recentCalls(take: 20)` for the desktop activity column.

**Derived driver state** (one function, used everywhere):

| State | Rule | Glyph | Label EN / हिं |
|---|---|---|---|
| `needs-call` | `lastLevel = RED`, or two MISSED in a row (or `lastAlertAt` in the last 30 min) | ▲ filled triangle | Needs a call / अभी कॉल करें |
| `drowsy` | `lastLevel = AMBER` | ◆ diamond | A bit tired / थोड़े थके हुए |
| `missed` | `lastLevel = MISSED` (once) | ◌ dashed ring | Didn't pick up / कॉल नहीं उठाया |
| `awake` | `lastLevel = GREEN` | ● filled dot | Awake / जागे हुए |
| `calling` | latest call is not finished (no `completedAt`) | ● pulsing ring | Calling… / कॉल चल रही है… |
| `waiting` | active, in shift, no check-in yet | ○ hollow | First call at 10:40 pm |
| `off-shift` | active, outside shift hours | ☾ moon | Off shift · starts 10 pm |
| `paused` | `active = false` | ‖ pause | Paused / रुका हुआ |

Sort order: needs-call → calling (if the previous state was bad) → missed → drowsy → awake → waiting → off-shift → paused. Within a group, oldest `lastCallAt` first.

"Two MISSED in a row" needs the last two check-ins. The list query should request `calls(take: 2)` per driver, plus `calls(take: 8)` for the history strip (one `calls(take: 8)` covers both).

**Summary line** (the most important element on the page):
- Everyone fine: **"All 6 drivers are awake."** Muted sub-line: "Next call 11:20 pm · Ramesh ji".
- One needs attention: **"Ramesh ji needs a call."** Sub-line: "Sounded very sleepy at 2:14 am · near Karnal". Button: **Call Ramesh ji** (`tel:`).
- Several: **"2 drivers need a call."** The list below shows them first.
- Nobody on shift: **"No one is on shift right now."** "Next shift starts 10:00 pm."
- Copy stays caring: "needs a call", never "violation", "failed", "alert triggered" or "risk".

**Driver row** (mobile card / desktop row):
- Glyph + status word (coloured), **name**, language chip (small, muted: `हिं`), last location ("near Karnal"), relative time of the last check-in ("12 min ago").
- Right side: next call time ("next 11:20 pm"), or "Calling…" with a pulse.
- History strip: the last 8 check-ins as 6 px marks, oldest on the left, same glyph shapes. MISSED is a hollow mark. Only CHECK_IN calls count.
- When the row needs attention, it gets a tinted background and an inline **Call {name}** button (`tel:` to `driver.phone`). Tapping anywhere else opens the detail page.

**Mobile layout (360–430 px)**
```
┌──────────────────────────────┐
│ ☾ Jaagte Raho      हिं/EN  ⋯ │
├──────────────────────────────┤
│                              │
│  Ramesh ji needs a call.     │
│  Sounded very sleepy · 2:14  │
│  am · near Karnal            │
│  [ 📞 Call Ramesh ji       ] │
│                              │
├──────────────────────────────┤
│ ▲ Very sleepy        2 min   │
│ Ramesh Kumar  हिं            │
│ near Karnal · next 2:24 am   │
│ ▴◌●●●●◆▲            [📞 Call]│
├──────────────────────────────┤
│ ◌ Didn't pick up     6 min   │
│ Suresh Yadav  हिं            │
│ NH48 · next 2:26 am          │
│ ●●●●●●●◌                     │
├──────────────────────────────┤
│ ● Awake             14 min   │
│ Lakshmi R  த                 │
│ Hosur toll · next 2:36 am    │
│ ●●●●●●●●                     │
├──────────────────────────────┤
│ ‖ Paused                     │
│ Imran Sheikh  हिं             │
├──────────────────────────────┤
│                              │
│        [ + Add driver ]      │  ← sticky bottom button
└──────────────────────────────┘
```

**Desktop layout (≥ 1024 px):** the summary goes in a band across the top. Below it, a list on the left (max 720 px) and a narrow **"Tonight"** activity column on the right: the latest 20 calls from `recentCalls` as one-liners ("2:14 am · Ramesh ji · Very sleepy · Manager called"). The list becomes one-line rows like Linear.
```
┌───────────────────────────────────────────────────────────────────────────┐
│ ☾ Jaagte Raho                                   हिं/EN   + Add driver   ⋯ │
├───────────────────────────────────────────────────────────────────────────┤
│  Ramesh ji needs a call.  Sounded very sleepy at 2:14 am · near Karnal    │
│                                                   [ 📞 Call Ramesh ji ]   │
├────────────────────────────────────────────────┬──────────────────────────┤
│ ▲ Very sleepy  Ramesh Kumar  हिं  near Karnal   │ TONIGHT                  │
│   ▴◌●●●●◆▲   2 min ago · next 2:24 am  [Call]  │ 2:14 ▲ Ramesh · v.sleepy │
│ ◌ No answer    Suresh Yadav  हिं  NH48          │ 2:14 ☎ Manager called    │
│   ●●●●●●●◌   6 min ago · next 2:26 am          │ 2:10 ◌ Suresh · no ans.  │
│ ● Awake        Lakshmi R     த   Hosur toll    │ 2:02 ● Lakshmi · awake   │
│   ●●●●●●●●  14 min ago · next 2:36 am          │ 1:58 ◆ Ramesh · tired    │
│ ☾ Off shift    Arjun Patel   मरा  starts 4 am    │ …                        │
│ ‖ Paused       Imran Sheikh  हिं                │                          │
└────────────────────────────────────────────────┴──────────────────────────┘
```

**States**
- **Loading (first load):** skeleton with three grey rows and a grey summary bar. No spinner. Later polls never show loading again.
- **Empty (no drivers):**
  ```
   ☾
   Your drivers will show up here.
   Add a driver and Jaagte Raho will call them every
   20–30 minutes on their night shift, just to chat
   and keep them company.
   [ + Add your first driver ]
  ```
- **Error (network):** keep the last data and show a thin bar above the list: "Can't reach Jaagte Raho. Showing info from 2:10 am. Retrying…". Never blank the list at night.
- **Error (401/403):** go to `/key`.
- **Stale data:** if the last successful fetch was more than 2 minutes ago, show the same bar.

### 3.2 Driver detail (`/drivers/:id`)

**Purpose:** what's going on with this driver, what happened on each call, and the controls (call, pause, edit).

**Data:** `driver(id) { …, calls(take: 20) { … } }`, polled.

**Order on the page:**
1. **Header:** back arrow, name, language chip, ⋯ menu (Edit, Delete).
2. **Verdict card:** a large glyph, the status word in its colour, and a one-sentence explanation from the latest check-in. Example: "Sounded very sleepy at 2:14 am", then the reasons as plain-language chips (see the mapping below), then "Score 35 / 100" in smaller muted mono. Location: "📍 near Karnal". Passenger: "👥 Had a passenger", shown when `passenger = true`, because that call ends early and has no score.
3. **Actions row:** **📞 Call {name}** (`tel:`, primary) · **Ring now via Jaagte Raho** (`callDriverNow`, secondary) · **Pause tonight / Resume** (toggle).
4. **Schedule line:** "Shift 10:00 pm – 6:00 am · Next call 2:24 am (sooner because the last call sounded tired)". When the next call is soon because of AMBER, RED or MISSED, say why.
5. **Owner line:** "If needed we'll call **Vikram ji** · +91 98xxx". If there's no owner phone, show it in amber: "No manager number. Add one so we can tell someone if {name} ji sounds very sleepy. [Add]".
6. **Timeline** (newest first): one entry per call.
   - CHECK_IN: glyph · time · status word · location · duration. Tap to expand: reasons, `summary`, transcript as chat bubbles, and an audio player if there's a `recordingUrl`.
   - OWNER_ALERT: ☎ icon, neutral blue-grey: "2:14 am · We called Vikram ji about Ramesh ji". Its status: "Vikram ji picked up" (completed) or "Vikram ji didn't pick up" (missed).
   - WELCOME: 👋 "Welcome call · Mon 6 pm".
   - Calls our side failed (`level` null with a status like error, balance-low or dial-failed): grey ⚠ "Our call didn't go through (not {name} ji's fault)".
   - In progress: pulsing "Calling now…".
   - Group by night ("Tonight", "Last night", "Mon 14 Oct"). A night runs from shift start to shift end, so 1 am belongs to the previous evening's group.

**Reason mapping** (backend strings → owner copy, EN / हिं):

| Backend reason | EN | हिं |
|---|---|---|
| went quiet during the call | Went quiet mid-call | बात करते-करते चुप हो गए |
| sounded sleepy | Sounded sleepy | आवाज़ में नींद थी |
| replies did not make sense | Answers didn't quite make sense | जवाब ठीक से समझ नहीं आए |
| got the check question wrong | Couldn't answer a simple question | आसान सवाल का जवाब नहीं दे पाए |
| very short replies | Very short replies | बहुत छोटे जवाब |
| picked up but never spoke | Picked up but didn't speak | फ़ोन उठाया पर कुछ बोले नहीं |
| did not pick up | Didn't pick up | फ़ोन नहीं उठाया |
| call <status> | Our call didn't go through | हमारी कॉल नहीं लग पाई |

Unknown strings are shown as they are. GREEN with no reasons reads "Sounded fresh and chatty" / "आवाज़ ताज़ा थी".

**Mobile layout**
```
┌──────────────────────────────┐
│ ←  Ramesh Kumar   हिं       ⋯ │
├──────────────────────────────┤
│  ▲  Very sleepy              │
│  Sounded very sleepy at      │
│  2:14 am                     │
│  [Went quiet] [Sleepy voice] │
│  📍 near Karnal   Score 35   │
├──────────────────────────────┤
│ [   📞 Call Ramesh ji      ] │
│ [ Ring now ]  [ ‖ Pause ]    │
├──────────────────────────────┤
│ Shift 10 pm – 6 am           │
│ Next call 2:24 am · sooner   │
│ because the last call        │
│ sounded tired                │
│ Manager: Vikram ji           │
├──────────────────────────────┤
│ TONIGHT                      │
│ ☎ 2:14  We called Vikram ji  │
│         · picked up          │
│ ▲ 2:14  Very sleepy · Karnal │
│   ┌ assistant: Namaste ...   │
│   │        user: haan ... ┐  │
│   └ Show full transcript     │
│ ◆ 1:58  A bit tired · Panipat│
│ ● 1:30  Awake · Sonipat  ›   │
│ ● 1:04  Awake · Murthal  ›   │
│ LAST NIGHT                   │
│ ● 5:40  Awake · …        ›   │
└──────────────────────────────┘
```
*Copy note:* don't use he/she for drivers. Write "sooner because the last call sounded tired".

**Desktop:** two columns. On the left (360 px, sticky): verdict, actions, schedule, owner. On the right: the timeline, with the transcript expanded inline.

**Transcript rendering:** split on lines. `assistant:` → left bubble labelled "Jaagte Raho", in the surface colour. `user:` → right bubble labelled with the driver's first name, in a slightly tinted surface. Keep the original script (Devanagari or Tamil), never transliterate. The font stack must cover every script (§4.2). Show a "Copy" icon.

**States**
- Loading: skeleton of the verdict card and three timeline rows.
- No calls yet: verdict card shows ○ "No calls yet. First call at 10:40 pm." Timeline: "We'll show each call here: how {name} ji sounded, where they were, and what was said."
- Driver not found (404): "This driver isn't here any more." [Back to drivers].
- `callDriverNow` running: the button becomes "Ringing {name} ji…" (disabled), and a "Calling now…" entry is added to the top of the timeline optimistically. If it fails: toast "Couldn't place the call. Try again in a minute."
- Poll every 5 s while any call on the page is unfinished, otherwise every 30 s (§5.1).

### 3.3 Add / edit driver (`/drivers/new`, `/drivers/:id/edit`)

**Purpose:** add a driver in under a minute and make clear they'll get a call straight away.

**Mobile:** full-height bottom sheet. **Desktop:** centred modal, 480 px. One column, labels above the fields.

```
┌──────────────────────────────┐
│ ✕  Add a driver              │
├──────────────────────────────┤
│ Driver's name                │
│ ┌──────────────────────────┐ │
│ │ Ramesh Kumar             │ │
│ └──────────────────────────┘ │
│ We'll call them "Ramesh ji"  │  ← live preview from the first name
│                              │
│ Driver's phone               │
│ ┌────┬─────────────────────┐ │
│ │ +91│ 98765 43210         │ │
│ └────┴─────────────────────┘ │
│                              │
│ Language for calls           │
│ (हिं) (ಕನ್ನಡ) (தமிழ்) (తెలుగు)    │  ← chips, native script
│ (मराठी) (বাংলা) (English)       │
│                              │
│ Night shift                  │
│ ┌─────────┐  to  ┌─────────┐ │
│ │ 10:00 pm│      │ 6:00 am │ │
│ └─────────┘      └─────────┘ │
│ 8 hours, ends next morning   │
│                              │
│ ── Who should we tell? ───── │
│ If they sound very sleepy or │
│ miss two calls, we'll call:  │
│ Manager's name (optional)    │
│ ┌──────────────────────────┐ │
│ │ Vikram                   │ │
│ └──────────────────────────┘ │
│ Manager's phone (optional)   │
│ ┌────┬─────────────────────┐ │
│ │ +91│                     │ │
│ └────┴─────────────────────┘ │
│                              │
│ ⓘ Ramesh ji will get a short │
│   welcome call right after   │
│   you save.                  │
│ [  Save and call Ramesh ji ] │
└──────────────────────────────┘
```

**Field rules**
- **Name:** required, 1–80 characters. The preview ("We'll call them Ramesh ji") reassures the owner about the tone.
- **Phone:** a country prefix (default `+91`, editable) and the number. Accept spaces and dashes, strip them, and send E.164. Inline error: "That number looks short. Indian mobiles have 10 digits."
- **Language:** a radio group shown as chips. Each label is in its own script, with the English name as `aria-label`. Default हिं.
- **Shift:** two native `<input type="time">` fields (fine on Android, no picker library). Defaults 22:00 → 06:00. A helper line works out the length and "ends next morning". Equal times: "Start and end can't be the same".
- **Manager:** optional, but if the phone is empty show a soft amber note: "Without a manager number, nobody gets a call if {name} ji sounds very sleepy." Allow saving anyway.
- **Primary button:** create: "Save and call {first name} ji". Edit: "Save changes" (no call happens on update).
- **Duplicate phone (409):** "This number is already added as {name}." Link to that driver if it's in the list.
- **Edit only:** a "Delete driver" text button at the very bottom in red text (§5.3).
- **Unsaved changes:** closing a dirty form asks "Discard changes?" (Keep editing / Discard).

### 3.4 Public "try it now" (`/try`)

**Purpose:** a judge understands the product in 30 s and hears it in 60.

**Structure:** one page, three stages that replace each other in the same card: **Form → Live call → Result**. Short explainer copy below the card.

**Stage A: form**
```
┌──────────────────────────────┐
│ ☾ Jaagte Raho                │
│                              │
│ A caring voice that keeps    │
│ night-shift drivers awake.   │
│                              │
│ Every 20–30 minutes it calls │
│ the driver for a short chat, │
│ listens for sleepiness, and  │
│ phones their manager if they │
│ need help.                   │
│                              │
│ ┌──────────────────────────┐ │
│ │ Try it on your phone     │ │
│ │                          │ │
│ │ Your name                │ │
│ │ [ Priya                ] │ │
│ │ Phone                    │ │
│ │ [+91][ 98765 43210     ] │ │
│ │ Language                 │ │
│ │ (हिं) (English) (தமிழ்) …  │ │
│ │                          │ │
│ │ [   📞 Call me now     ] │ │
│ │ Takes under a minute.    │ │
│ │ One call per number per  │ │
│ │ hour. We don't keep your │ │
│ │ number for anything else.│ │
│ └──────────────────────────┘ │
│                              │
│ Tip: answer like a tired     │
│ driver: go quiet, mumble,    │
│ and watch the score drop.    │
└──────────────────────────────┘
```
- Default language हिं (shows off the main case), with English one tap away for non-Hindi speakers.
- The tip line is the hook: it invites the judge to *play* sleepy, which demonstrates the scoring.
- Check the privacy line against what's really stored. The backend creates a demo driver row with the number, so if that stays the wording should be "used only for this demo".

**Stage B: live call** (after `POST /demo/call` returns `callId`; poll `GET /demo/calls/:id` every 2 s)
```
┌──────────────────────────────┐
│  ◉ ◉ ◉   (slow pulse)        │
│                              │
│  Calling +91 98••• ••210…    │
│                              │
│  ✓ Call placed               │
│  ● Ringing                   │  ← steps light up from status
│  ○ Talking                   │
│  ○ Scoring                   │
│                              │
│  Pick up and chat for a bit. │
│  The results appear here     │
│  when you hang up.           │
└──────────────────────────────┘
```
Mapping Bolna statuses to steps:

| Status | Step shown |
|---|---|
| `queued`, `initiated`, `scheduled` | Call placed |
| `ringing` | Ringing |
| `in-progress`, `call-disconnected` | Talking |
| terminal state but no `completedAt` / no `level` yet | Scoring… |
| `completedAt` set | → Result |

Unknown statuses keep the current step. The phone number is masked on screen. After 3 minutes without `completedAt`, show "Still waiting for the call to finish…" and a "Start over" link.

**Stage C: result**
```
┌──────────────────────────────┐
│  ● Awake           82 / 100  │   ← glyph + word big, score mono
│  You sounded fresh and       │
│  chatty. Your manager        │
│  wouldn't be called.         │
│                              │
│  What we noticed             │
│  · Very short replies        │
│                              │
│  What would happen next      │
│  Next call in 20 minutes.    │
│                              │
│  ▾ Transcript                │
│   Jaagte Raho: Namaste Priya │
│   ji! Kaise hain aap?        │
│            Priya: theek hoon │
│   …                          │
│                              │
│  [ Try again in an hour ]    │
│  How it works ↓              │
└──────────────────────────────┘
```
"What would happen next" turns the result into the product story:
- GREEN: "Next call in 20 minutes. Nobody is disturbed."
- AMBER: "We'd call back in 10 minutes to check again."
- RED: "We'd call your manager right now, and call you again in 10 minutes." Add a small illustration line: "☎ → Vikram ji: 'Priya ji sounded very tired…'"
- MISSED: "If you missed a second call, we'd let your manager know."
- `level` null (our failure): "Our call didn't go through. That's on us. Try again in a bit."

**Below the card: "How it works"** (three steps with glyphs, one line each):
1. ☎ **We call every 20–30 min** on their shift, in their language.
2. ◆ **We listen** for silence, a sleepy voice and confused answers.
3. ▲ **We call the manager** if they sound very sleepy or miss two calls.

Footer: "Built for the Bolna buildathon · Voice by Bolna". If there's a video, link it.

**Errors (shown inline under the button, form stays filled):**

| API response | Copy |
|---|---|
| 400 phone format | "Enter the number with country code, like +91 98765 43210." |
| 429 per number | "We already called this number in the last hour. Try another number, or come back soon." |
| 429 daily cap | "The demo has been busy today and we've hit our call limit. Please try tomorrow, or watch the video." |
| 409 registered driver | "This number belongs to a registered driver, so we can't use it for the demo." |
| network / 5xx | "Couldn't place the call. Please try again." |
| GET 404 | "We lost track of that call. Start over?" |

Desktop: the hero copy on the left (max 480 px) and the card on the right, vertically centred. A single column under 900 px.

---

## 4. Visual language

**Concept: "night road, warm lamp."** Deep indigo-black at night, a warm paper white by day, one warm accent, and status colours that are muted until they need to shout.

### 4.1 Colour tokens

Theme: follow `prefers-color-scheme`, with a manual override in the ⋯ menu. **On the dashboard, if the user hasn't chosen, use dark between 7 pm and 7 am IST** (owners mostly look at night). The try page follows the system.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FAF8F4` | `#0E1117` | Page |
| `--surface` | `#FFFFFF` | `#161A22` | Cards, rows |
| `--surface-2` | `#F2EFE9` | `#1D222C` | Driver bubble, hover, skeleton |
| `--border` | `#E6E1D8` | `#262C38` | 1 px hairlines only |
| `--text` | `#1B1A17` | `#ECE9E3` | Primary text |
| `--text-muted` | `#6B665E` | `#9A9690` | Metadata (≥ 4.5:1 on bg) |
| `--accent` | `#C2611F` (lamp amber-orange) | `#E89A5B` | Primary buttons, links, focus ring |
| `--accent-ink` | `#FFFFFF` | `#1B1206` | Text on the accent |
| `--info` | `#3E5C8A` | `#8FA9D6` | Owner-alert entries, "calling" |

Status colours. Each has an **ink** (glyph and text) and a **tint** (row and chip background). Ink on tint and ink on surface both meet ≥ 4.5:1 (check with a contrast tool during the build):

| Status | Light ink / tint | Dark ink / tint | Glyph |
|---|---|---|---|
| Awake (GREEN) | `#0F7A5C` / `#E3F3EC` | `#4FD1A5` / `#0F2A22` | ● filled circle |
| A bit tired (AMBER) | `#8A5A00` / `#FBEFD5` | `#F4BF4F` / `#2E2410` | ◆ filled diamond |
| Needs a call (RED) | `#B3261E` / `#FCE7E4` | `#FF8A7A` / `#3A1614` | ▲ filled triangle |
| Didn't pick up (MISSED) | `#5F5A73` / `#EEEDF3` | `#B5B0C8` / `#23222C` | ◌ dashed ring |
| Paused / off shift | `--text-muted` / none | same | ‖ / ☾ |

Why these:
- Green leans **blue-teal** and red leans **orange-red**, so they separate in luminance and hue under deuteranopia and protanopia. They're never the only signal: **shape** (circle, diamond, triangle, ring) and the **word** always go with them. That's the colour-blind-safe rule: in grayscale the screen must still make sense.
- MISSED is a muted violet-grey, not red: no answer isn't proof of danger, and two in a row escalate to the RED treatment ("Needs a call").
- RED is used **only** for needs-call. Nothing else in the app is red, delete included (§5.3), so red always means one thing.

### 4.2 Typography
- **Family:** `Mukta` (Google Fonts). It's designed for both Devanagari and Latin, so mixed Hindi and English lines look like one voice, and it's humane rather than techy. Weights 400 / 500 / 700 only.
- **Fallback for other scripts** (transcripts and language chips): `"Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Bengali"`, then `system-ui`. Load them with `unicode-range` so they only download when needed.
- **Numbers:** `font-variant-numeric: tabular-nums` for times and scores. Phone numbers and scores use `"IBM Plex Mono"` 500 at 0.9em so they're easy to read back aloud on the phone.
- **Scale (mobile / desktop):** summary line 24/28 px 700 · page title 20/22 700 · body 16/16 400 (never smaller on mobile) · metadata 14/14 400 muted · tiny label 12/12 500 uppercase tracking 0.06em (timeline group headers only).
- **Line height:** 1.5 for body. Devanagari needs it, because the matras clip below 1.4.

### 4.3 Spacing, shape, layout
- 4 px base. Use 4, 8, 12, 16, 24, 32, 48. Mobile gutter 16 px; desktop content max 1120 px.
- Radius: 12 px cards, 999 px chips and pills, 10 px buttons and inputs. Rows inside a card are square with hairline dividers.
- **No shadows** in dark mode. Light mode: one soft shadow on modals and sheets only (`0 8px 24px rgb(0 0 0 / 0.08)`). Everything else is hairline borders.
- Tap targets ≥ 48 px. The primary button is full width on mobile, 48 px tall.

### 4.4 Iconography
- **Lucide** icons, 1.5 px stroke, 20 px: phone, phone-call, pause, play, map-pin, users, chevron-right, more-horizontal, plus, x, copy, moon.
- The status glyphs are **custom SVG shapes** (circle, diamond, triangle, dashed ring), not icons, so they stay crisp at 6 px in the history strip and readable at 32 px in the verdict card.
- No emoji in the shipped UI. The emoji in the wireframes above stand in for Lucide icons.
- **Wordmark:** "Jaagte Raho" in Mukta 700 with a small crescent moon (☾) in `--accent`. That's the only "brand" flourish.

### 4.5 Motion
- **Default: still.** Only things that are *live* move.
- "Calling…" glyph: a ring that pulses slowly (2 s ease-in-out, scale 1 → 1.6, fading out), like breathing, not blinking.
- A status change on a row: the tint cross-fades over 400 ms, and the row slides to its new sorted position over 250 ms (FLIP).
- Try-page stage changes: cross-fade plus an 8 px rise, 300 ms. The score counts up from 0 to the value over 800 ms, once.
- Sheets and modals: 220 ms slide/fade, `cubic-bezier(.2,.8,.2,1)`.
- Respect `prefers-reduced-motion`: no pulse (use a static ring with "Calling…" text), no count-up, no slides.

### 4.6 What keeps it from looking generic
- No gradients, no glassmorphism, no purple-to-blue hero, no sparkle "AI" icons, no stat cards with big "+12%".
- Warm paper and indigo night instead of default Tailwind grays.
- Write sentences, not dashboards: "Ramesh ji needs a call", not "1 Critical Alert".
- Use "ji" and the first name everywhere the owner reads about a driver.
- Mixed Hindi and English copy written by a person, not machine-translated. The हिं strings in this doc are a starting point: have a native speaker read them once.

---

## 5. Interaction details

### 5.1 Polling and freshness
- **Dashboard:** poll `drivers` every **15 s** while the tab is visible. Switch to **5 s** while any driver is `calling` or the latest call is less than 60 s old. Pause when `document.hidden`, and refetch at once on `visibilitychange` and `focus` (the owner unlocking their phone at 2 am must see fresh data immediately).
- **Driver detail:** 5 s while a call is unfinished, otherwise 30 s.
- **Try page:** 2 s from `callId` until `completedAt`, then stop. Hard stop at 5 min.
- Relative times ("12 min ago") update every 30 s on a local timer, with no refetch.
- Keep the previous data while refetching (stale-while-revalidate). Never show a spinner on a poll. Show "Updated 2:14 am" in muted text in the footer or header so the owner can trust the data.
- Use one fetch helper with exponential backoff on network failure (5 → 10 → 30 → 60 s) and the stale bar described in §3.1.

### 5.2 How an alert is surfaced
The owner's real alarm is the **phone call** from the owner-alert agent. The app's job is to make the next step obvious, not to compete with that call.
1. **Summary line** switches to "{name} ji needs a call." with the reason and place, and a primary **Call {name} ji** `tel:` button. This is the single biggest change on the screen.
2. The **row** moves to the top (animated), gets the RED tint, the ▲ glyph and an inline Call button.
3. **Tab title** becomes `(1) Ramesh ji needs a call · Jaagte Raho`, and the favicon gets a small red ▲ badge, for desktop tabs left in the background.
4. **No sound and no browser notifications in v1.** The owner-alert phone call already does that job. Browser push is a later idea, once there's a service worker.
5. **Detail page:** the timeline shows "☎ We called Vikram ji at 2:14 am · picked up / didn't pick up". If the manager didn't pick up, show an amber line: "Vikram ji didn't pick up. Please call Ramesh ji yourself if you can."
6. **When it clears:** the next GREEN check-in returns the row to normal automatically, and the summary line goes back to "All drivers are awake". Nothing to dismiss: v1 has no acknowledge button, because there's no backend field for it.
7. **Wording stays calm**: "needs a call", "sounded very sleepy", never "DANGER" or "ALERT". The alert colour does the urgency; the words stay kind, matching the agent's voice.

### 5.3 Confirmations and destructive actions
| Action | Confirmation | Notes |
|---|---|---|
| **Delete driver** | Modal: "Remove {name} ji? Their call history will be removed too. This can't be undone." Buttons: [Keep driver] (default focus) / [Remove]. | The button uses `--text` on `--surface-2` with the word "Remove", **not** red (red is reserved for needs-call). Offer "Pause instead?" as a text link in the modal, since that's usually what the owner wants. |
| **Pause** | None. Do it at once and show an undo toast: "Paused Ramesh ji. No calls until you resume. [Undo]" for 6 s. | Undo resends `active: true`. |
| **Resume** | None. Toast: "Resumed. Next call in about 20 min, during the shift." | |
| **Ring now** (`callDriverNow`) | Confirm with a small popover, not a modal: "Ring Ramesh ji now? It's a short friendly chat." [Ring now]. | It phones a real person who may be driving, so a single mistaken tap shouldn't ring them. Disable the button while a call is in progress. |
| **Save new driver** | No extra dialog. The button text "Save and call {name} ji" plus the info line is the confirmation. | |
| **Discard unsaved form** | "Discard changes?" | |
| **Sign out** | None. | |

Optimistic UI for pause/resume (flip the row at once and revert with an error toast on failure). Not for delete: wait for the server, then navigate to `/` with the toast "Removed {name} ji".

### 5.4 Language toggle (हिं / EN)
- Changes **UI copy only**, not transcripts. Stored in `localStorage`. The default comes from `navigator.language` (`hi*` → हिं, otherwise EN).
- All strings live in one flat dictionary per language. Keep the copy short so Hindi doesn't overflow (Hindi runs about 20% longer).
- Times are always in the 12-hour "2:14 am" format in both languages. That's how people say them in India.

### 5.5 Accessibility basics (non-negotiable)
- Every status has a text label exposed to screen readers (`aria-label="Ramesh Kumar, needs a call, sounded very sleepy 2 minutes ago"`). The history strip has an `aria-label` summary ("Last 8 calls: 6 awake, 1 tired, 1 very sleepy").
- Visible focus ring: 2 px `--accent` with a 2 px offset.
- Polling updates use `aria-live="polite"` on the summary line only, not on each row.
- Contrast ≥ 4.5:1 for all text, ≥ 3:1 for glyphs and borders that carry meaning.
- Everything works at 200% zoom and at 320 px width.

---

## 6. Build notes for the frontend session
- Stack hint (the build session decides): Vite + React, a tiny GraphQL fetch (no Apollo needed for six operations), CSS variables for the tokens above.
- One `deriveState(driver)` function (§3.1 table) drives the glyph, word, colour and sort, so all screens agree.
- One `<StatusGlyph level size>` component and one `<StatusPill>` for every status in the app.
- Copy lives in `strings.ts` (`en`, `hi`), including the reason mapping in §3.2.

## 7. Out of scope for v1 (noted, not designed)
Map view · read-only judge view of a sample fleet · browser push notifications · acknowledge/resolve alerts · per-owner logins · analytics charts · CSV export · bulk import.
