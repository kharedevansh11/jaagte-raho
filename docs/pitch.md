# Jaagte Raho: pitch

> **A caring voice that keeps night-shift drivers awake, and calls for help before they fall asleep at the wheel.**

---

## The 30-second version

Every night, lakhs of cab and truck drivers in India drive tired, alone and on deadline. Nobody knows they're nodding off until it's too late.

Jaagte Raho phones the driver every 20–30 minutes during their night shift. It has a short, warm chat in their own language: "Kahan pahunche? Khana khaya?" While they talk, it listens for sleepiness: silence, slurred or confused answers, losing the thread. If a driver sounds very sleepy, or misses two calls, it immediately phones their fleet manager.

No app, no camera, no hardware. It works on any phone that can take a call.

---

## The problem

**The story to open with.** It's 2 am on the Bengaluru–Chennai highway. Ramesh has been driving since 8 pm and has two more hours to go. His eyes close for three seconds. At 80 km/h, that's 65 metres with nobody driving.

- India has some of the highest road deaths in the world: about **1.7 lakh deaths in 2022** (MoRTH, *Road Accidents in India 2022*) **[verify the exact figure before quoting]**.
- Drowsy driving is a known, under-reported cause, because after a crash nobody can prove the driver dozed off. **[Find one credible Indian or WHO source on fatigue's share before quoting a percentage.]**
- Long-haul truckers, outstation cabs, airport night runs and office night-shift cabs all drive while the rest of the country sleeps.
- **Nobody is watching.** The fleet owner is asleep. The driver won't admit he's tired, because stopping costs him money.

**Why today's options fail:**

| Option | Why it doesn't reach most drivers |
|---|---|
| In-cab fatigue cameras (DMS) | Expensive hardware plus installation per vehicle. Small fleets don't buy them. |
| Smartphone apps | The driver has to install one, open it and keep it running, and look at a screen while driving. |
| The owner calling manually | Doesn't scale past 2–3 drivers, and doesn't happen at 3 am. |

---

## The solution

**Jaagte Raho is a voice co-passenger.**

1. **We call.** Every 20–30 minutes during the shift, the driver's phone rings. A warm voice in Hindi, Kannada, Tamil or their own language asks how they are.
2. **We chat like a friend who remembers.** "Pichli baar aap Karnal ke paas the, ab kahan pahunche?" Each call asks one easy, everyday question that never repeats in a night. No tests, no maths, nothing that makes a driver feel watched.
3. **We listen.** Every call gets an alertness score. Going silent mid-call, slurred or confused answers and very short replies all bring it down.
4. **We act.**
   - *A bit tired:* a gentle nudge ("agle dhabe pe ek chai le lijiye") and a call back in 10 minutes instead of 20.
   - *Very sleepy, or two missed calls:* we phone the fleet manager right away, politely, with the driver's name and last known location.

**The owner gets a dashboard**, mobile-first and dark at night: who's awake, who needs a call, an alertness trend through the night, and every conversation transcript.

---

## Why voice is the right interface

- **Hands-free and eyes-free.** It's the only interface that's safe while driving.
- **It works on any phone,** including the ₹1,500 feature phones many drivers still carry. No app, no data plan, no literacy needed.
- **It's in their language.** Indian-language voice AI (Bolna, Sarvam, Deepgram) only recently became good enough and cheap enough to make this work.
- **Talking keeps you awake.** A conversation engages the brain more than an alarm. The check-in is part of the product, not just a sensor.
- **It's caring, not surveillance.** Drivers get a friendly voice at 3 am instead of a camera pointed at their face.

---

## What's built (live and working)

- **Two voice agents on Bolna:** a warm, polite check-in agent (female voice, "aap" and "ji", never "malik"), and a calm owner-alert agent.
- **Alertness scoring** from each call: Bolna's extractions plus silence detection, mapped to Awake / A bit tired / Needs a call / Didn't pick up.
- **Escalation engine:** calls back sooner when the driver sounds tired, phones the manager on very sleepy or two missed calls, and won't call the manager twice within 30 minutes.
- **Calls with memory:** each call knows the time of night, how the last call went and where they were, and asks a question that never repeats in a night.
- **Reliable by design:** Bolna's webhooks go into a **BullMQ job queue**, and owner alerts are retried automatically if a call fails to go through.
- **Owner dashboard** (React, mobile-first, Hindi and English, auto dark mode at night) and a **public "try it now" page** where anyone can enter their number and get a call.
- **Stack:** NestJS + GraphQL + Prisma, BullMQ on Redis, React + Vite, and Bolna (Deepgram STT, GPT-4.1 mini, Sarvam/ElevenLabs TTS, Indian telephony).

---

## The 2-minute demo (video script)

| Time | What's on screen | What you say |
|---|---|---|
| 0:00–0:15 | Night highway footage, or a dark screen with a ticking clock | "It's 2 am. Ramesh has been driving for six hours. His eyes close for three seconds. At 80 km/h, that's 65 metres with nobody driving." |
| 0:15–0:30 | Title card: Jaagte Raho | "Jaagte Raho is a caring voice that keeps night-shift drivers awake, and calls for help before they fall asleep." |
| 0:30–0:55 | Phone rings on speaker. A **normal** check-in in Hindi, with subtitles | "Every 20 minutes, it calls. A short, friendly chat in his language." Let the call play: greeting, "kahan pahunche?", "khane mein kya khaya?" |
| 0:55–1:00 | Dashboard: the row turns green, Awake, score 95 | "Behind the scenes, every call gets an alertness score." |
| 1:00–1:25 | Second call. You answer **slowly, mumble, then go silent** | "But when he starts drifting off…" Let the silence hang and the agent ask "aap line pe hain?" |
| 1:25–1:40 | Dashboard turns red: "Ramesh ji needs a call". **The second phone rings** | "…his fleet manager gets a call, right away." Play the polite alert: "Ramesh ji ki awaaz bahut thaki hui lag rahi thi, last location Karnal…" |
| 1:40–1:52 | Dashboard: the night's chart and the transcript | "Owners see the whole night at a glance: who's awake, who needs a call, and every conversation." |
| 1:52–2:00 | The try-it page and your URL | "No app. No camera. Any phone. Try it yourself: enter your number, and we'll call you." |

**Filming tips**
- Before recording, set `CALL_INTERVAL_MINUTES=1` and `RECALL_MINUTES=1` so the whole night plays out in a few minutes.
- Show the dashboard in dark mode. It's the night-time story.
- Add subtitles for every Hindi line; the judges may not speak Hindi.
- Leave in one real, slightly imperfect moment. It proves it's live.

---

## Business model

**Who pays:** the fleet owner, not the driver.

| Customer | Why they buy |
|---|---|
| Truck fleet owners (5–100 trucks) | One accident costs the truck, the cargo and a life. Insurance and downtime run far beyond any monthly fee. |
| Cab fleet operators (Ola/Uber attached fleets, outstation cabs) | Night airport runs and outstation trips. The driver's safety is also the passenger's safety. |
| Office transport vendors (IT/BPO night-shift cabs) | Companies already take night-cab safety seriously, and an incident is a serious reputational and legal risk. |
| Later: insurers | Fewer claims. They could offer a lower premium to fleets that use Jaagte Raho. |

**Pricing to test:** a monthly fee per vehicle, starting with a free pilot for the first few fleets.

**Unit economics (honest version):**
- Bolna lists about **$0.06 per minute** of call time.
- An 8-hour shift with a 45-second call every 20 minutes is 24 calls, about 18 minutes, roughly **$1.1 a night per driver**.
- That's too high to start at, so the levers are:
  - **Adaptive frequency:** call every 30–40 minutes while the driver is clearly awake, and every 10 when they're tired. That roughly halves the minutes.
  - **Shorter calls:** about 30 seconds when everything's fine.
  - **Volume pricing** with the voice platform and telephony provider.
- **Target:** under ₹1,000 a month in voice cost per active night vehicle, priced at ₹1,500–2,500 a month per vehicle **[validate with pilot customers]**.

---

## Go-to-market

1. **Pilot:** 3–5 small fleets in one corridor (for example Bengaluru–Chennai or Delhi–Jaipur). Free for a month, in exchange for feedback and a testimonial.
2. **Prove it:** missed or sleepy calls caught, manager response time, and driver feedback ("didi ki call se neend bhaag jaati hai").
3. **Expand:** fleet-owner associations, transport unions, and office-transport vendors who already have to show safety measures for night cabs.

---

## Roadmap

- **Next:** adaptive call frequency, drivers calling *us* when they feel sleepy (inbound), WhatsApp alerts for owners, and call recordings in the dashboard.
- **Then:** voice-based fatigue signals (reply delay and speech rate from the audio, not just the words), route and shift planning hints, and fleet-wide weekly reports.
- **Later:** partnerships with insurers, and integrations with fleet GPS/telematics providers.

---

## Why now, and why us

- **Why now:** Indian-language voice AI crossed the quality and cost line in the last year. A natural Hindi phone conversation used to need a human; now it costs cents.
- **Why us:** *(write 2–3 lines about yourself: why you care about this problem, any personal connection to drivers or fleets, and what you shipped in two weeks.)*

---

## Tough questions, and answers

| Question | Answer |
|---|---|
| "Won't drivers find the calls annoying?" | They're under 45 seconds, friendly, in their language, and they never repeat the same question. With a passenger in the car they end in 10 seconds. Drivers can be paused any time. We're designing it to be the voice that keeps you company, not a nag. |
| "Can you really tell sleepiness from a phone call?" | Today we use what the conversation reveals: going silent, confused or very short answers, and missed calls. That catches the dangerous cases. Next we add audio signals such as reply delay and speech rate. |
| "What about false alarms?" | Tired means a gentle nudge and a sooner call, not an alarm. Only very sleepy or two missed calls reach the manager, and at most once per 30 minutes. |
| "Privacy?" | Drivers hear what happens on the first (welcome) call. We store transcripts for the owner and never sell data. We don't track location; we only use what the driver says. |
| "Isn't calling a driver while driving dangerous?" | Drivers already take calls on Bluetooth or speaker. A short, structured chat is safer than the silence that puts them to sleep. |
| "Why won't Ola/Uber build this?" | They might, for their own apps. Most trucks and independent fleets sit outside those apps, and that's who we serve, on any phone. |
| "How does this become a big company?" | Every night-time commercial vehicle in India is a potential customer, and the same engine works for long-haul trucking worldwide. Safety is a budget line that insurers and enterprises already pay for. |

---

## Closing line

> "Truck drivers keep India moving while the rest of us sleep. Jaagte Raho makes sure someone is looking out for them. **Jaagte raho.**"
