import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import me from "@/assets/me-abdul-cutout.png";
import { Button } from "@/components/ui/button";
import { jsonLd, pageMeta, person, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () => ({
    ...pageMeta({
      title: "Abdul Rahman (Panther) — building with AI, telling the story",
      description: "Abdul Rahman, known as Panther, is a CS student from Raichur, India, building AI apps and sharing the journey in public.",
      path: "/",
    }),
    scripts: [
      jsonLd({
        "@graph": [
          person,
          { "@type": "WebSite", ...(SITE_URL ? { "@id": `${SITE_URL}/#website`, url: SITE_URL } : {}), name: "Abdul Rahman", publisher: { "@id": SITE_URL ? `${SITE_URL}/#person` : "#person" } },
          { "@type": "ProfilePage", ...(SITE_URL ? { url: SITE_URL } : {}), name: "Abdul Rahman (Panther) — the story of a builder, still in progress", mainEntity: { "@id": SITE_URL ? `${SITE_URL}/#person` : "#person" } },
        ],
      }),
    ],
  }),
  component: Portfolio,
});

const EMAIL = "rahmann292006@gmail.com";
const LINKS = {
  linkedin: "https://www.linkedin.com/in/abdul-rahman-75366b343/",
  github: "https://github.com/rahmann292006-netizen",
  x: "https://x.com/rahman_aibuilds",
};
// The cursor's comment bubble stays quiet until something has a reason to
// speak: a moment in the story, or hovering something that has a comment.
type CursorComment = { id: string; text: string; fade: boolean };
// Only one bubble speaks at a time: "figure-open" tells every other bubble
// (objects, the cutout, the cursor/phone comment) to go quiet.
const quietOthers = (id: number) => window.dispatchEvent(new CustomEvent<number>("figure-open", { detail: id }));
const say = (id: string, text: string, fade = true) => {
  quietOthers(-1);
  window.dispatchEvent(new CustomEvent<CursorComment>("cursor-comment", { detail: { id, text, fade } }));
};

// The image opens the live site; the arrow opens the code.
const projects: { number: string; title: string; tags: string[]; blurb: string; live?: string; code: string }[] = [
  { number: "01", title: "Fitzy", tags: ["AI", "App"], blurb: "an AI-powered fitness and wellness app, built with Flutter and Firebase.", code: "https://github.com/rahmann292006-netizen/Fitzy-AI-Fitness-App" },
  { number: "02", title: "AI Engineer Journey", tags: ["Open source", "Experiments"], blurb: "my path to AI engineer, documented in public: notes, projects and mistakes.", code: "https://github.com/rahmann292006-netizen/AI-Engineer-Journey" },
  { number: "03", title: "WeatherGPT", tags: ["AI", "Agents"], blurb: "a weather assistant you can talk to.", code: "https://github.com/rahmann292006-netizen/WeatherGPT" },
  { number: "04", title: "VANTACODES", tags: ["App", "Experiments"], blurb: "a code playground for rapid prototyping and sharing.", code: "https://github.com/rahmann292006-netizen/VANTACODES" },
  { number: "05", title: "MJ Fitness", tags: ["AI", "App"], blurb: "personalized fitness tracking with AI-driven insights.", code: "https://github.com/rahmann292006-netizen/MJ-Fitness" },
];

// The story canvas is CANVAS_VW wide and slides CANVAS_TRAVEL_VW across the
// scroll. Everything on it is placed in vw/vh, and the SVG uses a viewBox of
// (CANVAS_VW * 10) x 1000, so one vw is 10 units and one vh is 10 units.
const CANVAS_VW = 570;
const CANVAS_TRAVEL_VW = 470;

// Place something on the canvas by its vw/vh coordinates.
const at = (x: number, y: number) => ({ left: `${x}vw`, top: `${y}vh` });

// A waypoint for the thread, in vw/vh. `loop` ties a little loop-de-loop at
// that point (radius in vh; negative loops downward).
type Waypoint = [x: number, y: number, loop?: number];

// Horizontal units are ~1.8x wider on screen than vertical ones, so loops are
// narrowed to stay round rather than squashed.
const LOOP_ASPECT = 1.8;

// Where the thread finally ends: at the "see the work" button.
const BUTTON_X = 537;
const BUTTON_Y = 59;

// The big loop the habit is tied around, near the end of the story.
const LOOP_X = 474;
const LOOP_Y = 70;
const LOOP_R = 17;

// The thread is a Catmull-Rom curve through the waypoints (plus the extra
// points each loop adds), written out as cubic Béziers in viewBox units.
type Segment = [x0: number, y0: number, c1x: number, c1y: number, c2x: number, c2y: number, x1: number, y1: number];

// `scale` maps waypoint units to path units (vw/vh → viewBox is 10; pixels
// are 1), and `aspect` squeezes loops to stay round on a stretched canvas.
function threadSegments(waypoints: Waypoint[], scale = 10, aspect = LOOP_ASPECT): Segment[] {
  const pts: [number, number][] = [];
  for (const [wx, wy, loop] of waypoints) {
    const x = wx * scale;
    const y = wy * scale;
    pts.push([x, y]);
    if (loop) {
      const r = loop * scale;
      const rx = Math.abs(r) / aspect;
      pts.push([x + rx, y - r], [x, y - 2 * r], [x - rx, y - r], [x + rx * 0.5, y + r * 0.15]);
    }
  }
  const segments: Segment[] = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    segments.push([p1[0], p1[1], p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]]);
  }
  return segments;
}

function threadPath(waypoints: Waypoint[]) {
  return segmentsPath(threadSegments(waypoints));
}

function segmentsPath(segments: Segment[]) {
  const f = (n: number) => n.toFixed(1);
  let d = `M${segments[0]?.[0] ?? 0} ${segments[0]?.[1] ?? 0}`;
  for (const [, , c1x, c1y, c2x, c2y, x1, y1] of segments) d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x1)} ${f(y1)}`;
  return d;
}

// Points along the thread, evaluated straight from the Bézier maths, with the
// running arc length at each one. This replaces thousands of browser
// getPointAtLength calls, which froze the page for seconds on load.
type ThreadSamples = { xs: Float32Array; ys: Float32Array; lengths: Float32Array; total: number };

function sampleSegments(segments: Segment[], perSegment = 48): ThreadSamples {
  const n = segments.length * perSegment + 1;
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);
  const lengths = new Float32Array(n);
  let k = 0;
  let total = 0;
  segments.forEach(([x0, y0, c1x, c1y, c2x, c2y, x1, y1], index) => {
    for (let step = index === 0 ? 0 : 1; step <= perSegment; step += 1) {
      const t = step / perSegment;
      const u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1;
      const y = u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1;
      if (k > 0) total += Math.hypot(x - xs[k - 1]!, y - ys[k - 1]!);
      xs[k] = x;
      ys[k] = y;
      lengths[k] = total;
      k += 1;
    }
  });
  return { xs, ys, lengths, total };
}

// The thread leaves the tangle and loops wildly between the rabbit holes,
// smooths out through the few things that have my heart, runs straight along
// the timeline, and simply stops before the work.
const THREAD_WAYPOINTS: Waypoint[] = [
  [56.9, 19.9], [80, 58], [98, 50], [110, 44, 8], [120, 66], [132, 68], [142, 66, -6],
  [151, 56], [156, 40], [164, 29], [171, 33], [174.5, 35.6], [181, 42], [186, 62], [198, 68],
  [205, 68], [216, 50], [229, 34], [233, 50], [250, 58], [262, 70], [272, 88], [292, 54],
  [304, 48], [322, 51], [340, 52], [358, 50], [376, 46], [394, 43], [410, 46],
  [422, 60], [440, 70], [458, 71], [LOOP_X, LOOP_Y, LOOP_R], [496, 76], [514, 78], [528, 70], [BUTTON_X, BUTTON_Y],
];
const THREAD = threadPath(THREAD_WAYPOINTS);

// Sampled once, the first time anything needs points along the thread.
let threadSamples: ThreadSamples | null = null;
const getThreadSamples = () => (threadSamples ??= sampleSegments(threadSegments(THREAD_WAYPOINTS)));

// A compact, intentional loop that turns curiosity into a path forward.
// Its final point stays fixed so the hand-drawn thread still picks it up cleanly.
const TANGLE = "M344 293 L332 305 L344 317 M371 293 L383 305 L371 317 M360 290 L352 321 M396 320 l2 4 4 1 -4 2 -2 4 -2 -4 -4 -2 4 -1 Z M476 284 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z M399 349 Q407 332 429 333 L447 343 L461 346 Q466 349 466 358 L463 363 L394 362 Z M424 342 L444 343 L451 350 L420 350 Z M406 362 A7 7 0 1 0 420 362 A7 7 0 1 0 406 362 M442 362 A7 7 0 1 0 456 362 A7 7 0 1 0 442 362 M486 299 L520 299 L520 333 L486 333 Z M492 305 L498 305 M508 305 L514 305 M492 327 L498 327 M508 327 L514 327 M498 310 L511 316 L498 323 Z M388 306 C400 297 410 291 422 291 M464 352 C476 355 480 369 492 372 C510 376 521 359 512 347 C505 337 489 343 493 353 C497 362 508 357 504 351 M532 336 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 M540 340 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 M556 224 L569 199 L545 207 M521 346 C534 331 535 314 548 301 C558 290 561 273 569 199";

function Portfolio() {
  const storyRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const listeners = useRef(new Set<(progress: number) => void>());
  const [noteRevealed, setNoteRevealed] = useState(false);
  const [scrollReady, setScrollReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // The header floats over the story, but gets the page colour from the work
  // section on, so the links don't sit on top of project images.
  const [solidHeader, setSolidHeader] = useState(false);
  useEffect(() => {
    const check = () => {
      const work = document.getElementById("work");
      if (work) setSolidHeader(window.scrollY >= work.offsetTop - 80);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  const [filter, setFilter] = useState("All");

  // First the mind arrives, then its note, and only then does scrolling take over.
  useEffect(() => {
    const root = document.documentElement;
    // Climbing back out of the rabbit hole lands straight on the work, no intro.
    if (window.location.hash === "#work") {
      setNoteRevealed(true);
      setScrollReady(true);
      requestAnimationFrame(() => document.getElementById("work")?.scrollIntoView({ behavior: "instant" }));
      return;
    }
    root.style.overflow = "hidden";
    window.scrollTo(0, 0);
    let greet = 0;
    const unlock = () => {
      root.style.overflow = "";
      setNoteRevealed(true);
      setScrollReady(true);
      window.clearTimeout(greet);
      greet = window.setTimeout(() => say("intro", "hey, panther here."), 1800);
      window.clearTimeout(noteTimer);
      window.clearTimeout(unlockTimer);
      skipEvents.forEach((name) => window.removeEventListener(name, unlock));
    };
    const noteTimer = window.setTimeout(() => setNoteRevealed(true), 2200);
    const unlockTimer = window.setTimeout(unlock, 2600);
    // Anyone who tries to scroll early skips the rest of the intro.
    const skipEvents = ["wheel", "touchmove", "keydown"] as const;
    skipEvents.forEach((name) => window.addEventListener(name, unlock, { passive: true }));
    return () => {
      window.clearTimeout(greet);
      window.clearTimeout(noteTimer);
      window.clearTimeout(unlockTimer);
      skipEvents.forEach((name) => window.removeEventListener(name, unlock));
      root.style.overflow = "";
    };
  }, []);

  // One animation-frame loop runs the whole story. It eases toward the scroll
  // position, so wheel steps become a glide, and then moves the canvas, draws
  // the thread and reveals whatever the thread has reached — all directly on
  // the DOM, without asking React to re-render the page every frame.
  useEffect(() => {
    let frame = 0;
    let current = -1;
    const spoken = new Set<string>();
    const tick = () => {
      const section = storyRef.current;
      const canvas = canvasRef.current;
      if (section) {
        const distance = section.offsetHeight - window.innerHeight;
        const target = Math.min(1, Math.max(0, (window.scrollY - section.offsetTop) / Math.max(distance, 1)));
        const next = current < 0 || Math.abs(target - current) < 0.00005 ? target : current + (target - current) * SCROLL_EASE;
        if (next !== current) {
          current = next;
          if (canvas && window.innerWidth >= 768) {
            canvas.style.transform = `translate3d(-${current * CANVAS_TRAVEL_VW}vw,0,0)`;
            const tip = current * CANVAS_TRAVEL_VW + TIP_SCREEN_ANCHOR * 100;
            const edge = current * CANVAS_TRAVEL_VW + 100 - REVEAL_INSET;
            canvas.querySelectorAll<HTMLElement>("[data-at]").forEach((el) => {
              // Most things reveal as they enter the screen; "thread" ones wait
              // for the thread itself (the loop's steps, the story comments).
              const shown = (el.dataset["mode"] === "thread" ? tip : edge) >= Number(el.dataset["at"]);
              el.toggleAttribute("data-shown", shown);
              // Story comments are said once, the first time the thread arrives.
              const line = el.dataset["say"];
              if (shown && line && !spoken.has(line)) {
                spoken.add(line);
                say(`story:${line}`, line);
              }
            });
          }
          listeners.current.forEach((listen) => listen(current));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const subscribe = (listen: (progress: number) => void) => {
    listeners.current.add(listen);
    return () => {
      listeners.current.delete(listen);
    };
  };

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <main>
      <header className={cn("fixed inset-x-0 top-0 z-50 grid grid-cols-[minmax(0,1fr)_auto] items-center px-5 py-5 transition-opacity duration-700 sm:px-8 sm:py-7", solidHeader ? "bg-background" : "bg-transparent", scrollReady ? "opacity-100" : "pointer-events-none animate-reveal [animation-delay:2.6s]")}>
        <button aria-label="Back to introduction" onClick={() => go("brain")} className="w-fit bg-transparent font-serif text-3xl font-medium">
          Panther
        </button>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Main navigation">
          <button onClick={() => go("brain")} className="story-link bg-transparent">brain</button>
          <button onClick={() => go("work")} className="story-link bg-transparent">work</button>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="story-link" data-cursor="the professional version.">linkedin</a>
          <button onClick={() => go("hi")} className="story-link bg-transparent" data-cursor="say hello?">let's talk</button>
        </nav>
        <button className="relative h-10 w-10 md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>
          <span className={cn("absolute left-1/2 top-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-foreground transition-all duration-300", menuOpen ? "rotate-45" : "-translate-y-[5px]")} />
          <span className={cn("absolute left-1/2 top-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-foreground transition-all duration-300", menuOpen ? "-rotate-45" : "translate-y-[4px]")} />
        </button>
        {menuOpen && (
          <nav className="absolute inset-x-4 top-16 grid gap-1 border border-border bg-background p-3 text-lg shadow-xl md:hidden">
            <button onClick={() => go("brain")} className="p-3 text-left">brain</button>
            <button onClick={() => go("work")} className="p-3 text-left">work</button>
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="p-3">linkedin</a>
            <button onClick={() => go("hi")} className="p-3 text-left">let's talk</button>
          </nav>
        )}
      </header>

      <section id="brain" ref={storyRef} className="relative md:h-[720vh]">
        <div className="sticky top-0 hidden h-screen overflow-hidden md:block">
          <div ref={canvasRef} className="relative h-full will-change-transform max-md:hidden" style={{ width: `${CANVAS_VW}vw` }}>
            <StringLine subscribe={subscribe} />
            <div className="absolute inset-0 z-10">
              <IntroScene contentRevealed={noteRevealed} noteRevealed={noteRevealed} />
              <TinkerScene />
              <HeartScene />
              <TimelineScene />
              <ApparentlyScene />
              <EnoughScene onWork={() => go("work")} />
            </div>
          </div>
        </div>
        <MobileStory ready={noteRevealed} onWork={() => go("work")} />
      </section>

      <Works filter={filter} setFilter={setFilter} />
      <OhHi />
      <CuriousCursor visible={scrollReady} />
      <PhoneComment />
    </main>
  );
}

// While scrolling, the string's tip is anchored to ~55% of the viewport width,
// so the freshly drawn thread always stays on screen instead of lagging behind.
const TIP_SCREEN_ANCHOR = 0.55;
// How quickly the story catches up with the scrollbar each frame (0–1).
const SCROLL_EASE = 0.085;
// Content sharpens in as it enters from the right edge: it's revealed once
// its x is this far (vw) inside the screen, so it's clear by the time you read it.
const REVEAL_INSET = 4;

type Subscribe = (listen: (progress: number) => void) => () => void;

function StringLine({ subscribe }: { subscribe: Subscribe }) {
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const tip = tipRef.current;
    if (!path || !tip) return;
    const { xs, ys, lengths, total } = getThreadSamples();
    const count = xs.length - 1;

    const draw = (progress: number) => {
    // Where the tip should sit: viewport's left edge (in viewBox units) plus
    // 55% of the visible width (1000 units).
    // Over the last stretch the tip runs ahead of its anchor, so the thread
    // reaches the button at the very end instead of stopping mid-screen.
    const catchUp = Math.max(0, (progress - 0.9) / 0.1) * 150;
    const targetX = progress * CANVAS_TRAVEL_VW * 10 + TIP_SCREEN_ANCHOR * 1000 + catchUp;
    let i = 0;
    while (i < count && (xs[i] ?? 0) < targetX) i += 1;
    const length = lengths[i] ?? total;

    path.style.strokeDashoffset = `${1 - length / total}`;
    tip.setAttribute("cx", `${xs[i]}`);
    tip.setAttribute("cy", `${ys[i]}`);
    tip.style.opacity = length <= 0 || length >= total * 0.999 ? "0" : "1";
    };
    draw(0);
    return subscribe(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${CANVAS_VW * 10} 1000`} preserveAspectRatio="none">
      <path ref={pathRef} pathLength="1" style={{ strokeDashoffset: 1 }} d={THREAD} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" />
      <path d={TANGLE} transform="translate(1 -.7)" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".2" />
      <path className="animate-draw-string" style={{ animationDuration: "2.6s" }} pathLength="1" strokeDasharray="1" d={TANGLE} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle ref={tipRef} r="9" cx="569" cy="199" style={{ opacity: 0 }} className="fill-foreground" />
    </svg>
  );
}

function IntroScene({ contentRevealed, noteRevealed }: { contentRevealed: boolean; noteRevealed: boolean }) {
  return (
    <div className="absolute left-0 top-0 h-full w-screen">
      <div className={cn("absolute bottom-10 left-8 transition-all duration-700 sm:bottom-8", contentRevealed ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>
        <p className="text-4xl font-semibold leading-[0.95] sm:text-5xl">the story of<br />a builder,<br /><span className="font-serif italic">still in progress.</span></p>
      </div>
      <div className={cn("absolute left-[62%] top-28 flex max-w-56 origin-bottom-left items-start gap-2 text-sm text-muted-foreground transition-all duration-500", noteRevealed ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>
        <svg aria-hidden="true" viewBox="0 0 40 30" className="mt-1 h-6 w-8 shrink-0"><path d="M38 4 C24 6 12 14 4 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M4 24 L13 22 M4 24 L7 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <span>my head, drawn badly on purpose.<br /><span className="font-hand text-base">ideas → code → cars → projects → curiosity.</span></span>
      </div>
      <div className={cn("absolute bottom-8 right-8 hidden text-right transition-all delay-150 duration-700 sm:block", contentRevealed ? "opacity-100" : "animate-reveal [animation-delay:2.35s]")}>
        <p className="mb-4 text-sm">welcome in. look around.</p>
        <Button asChild variant="paper" className="mr-2"><a href="#work">view work</a></Button>
        <Button asChild variant="ink"><a href="#hi" data-cursor="i don't bite.">let's talk</a></Button>
      </div>
    </div>
  );
}

// A piece of text pinned to the canvas.
// `at` is the canvas x (in vw) the thread must reach before a `.reveal` note shows.
function Note({ x, y, className, at: revealAt, children }: { x: number; y: number; className?: string; at?: number; children: ReactNode }) {
  return <div className={cn("absolute", className)} style={at(x, y)} data-at={revealAt}>{children}</div>;
}

// A few obsessions — a quiet line in the middle, the objects
// scattered around it, and the thread looping between them.
function TinkerScene() {
  return (
    <div>
      <span hidden data-mode="thread" data-at={112} data-say="buckle up. detours ahead." />
      <Note x={120} y={42} className="reveal w-[38vw] text-center" at={122}>
        <p className="text-lg text-muted-foreground">outside the code, there's this.</p>
        <h2 className="whitespace-nowrap font-serif text-6xl leading-tight">a few obsessions</h2>
        <p className="mt-2 text-lg text-muted-foreground">none of them are optional.</p>
      </Note>
      <Object kind="car" alt="a small hand-drawn car" label="drive â†’ build â†’ repeat." style={at(106, 19)} size="xs" delay="0s" />
      <Object kind="camera" alt="a hand-drawn film camera" label="stories worth telling." style={at(104, 60)} size="xs" delay=".6s" />
      <Object kind="dumbbell" alt="a hand-drawn dumbbell" label="stronger, one rep at a time." style={at(150, 68)} size="xs" delay="1.5s" />
      <Note x={106} y={30} className="reveal -rotate-3 font-hand text-sm" at={108}>drive â†’ build â†’ repeat</Note>
    </div>
  );
}

// Points on the thread between two x positions, as (x, y) pairs in vw/vh.
function sampleThread(from: number, to: number) {
  const { xs: allX, ys: allY } = getThreadSamples();
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < allX.length; i += 1) {
    const x = allX[i]! / 10;
    if (x >= from - 1 && x <= to + 1) {
      xs.push(x);
      ys.push(allY[i]! / 10);
    }
  }
  return { xs, ys };
}

const heart = [
  {
    kind: "road" as const,
    alt: "a hand-drawn winding road",
    x: 200,
    y: 56,
    title: "business came first.",
    body: "i like building things that solve real problems for real companies.",
    label: "the startup is still brewing."
  },

  {
    kind: "film" as const,
    alt: "a hand-drawn film frame",
    x: 224,
    y: 22,
    title: "then, stories.",
    body: "making videos, explaining things, building a channel from scratch.",
    label: "lights, camera, commit."
  },

  {
    kind: "nodes" as const,
    alt: "hand-drawn connected nodes",
    x: 260,
    y: 60,
    title: "and now, generative AI.",
    body: "the thing i'm betting the next few years on.",
    label: "still learning how it thinks."
  },
];

// but few things have my heart — each one an object with a big line and a
// quiet one beside it, and the thread running calmly between the objects.
function HeartScene() {
  return (
    <div>
      <span hidden data-mode="thread" data-at={184} data-say="okay, the soft part." />
      <Note x={181} y={18} className="reveal w-[22rem]" at={182}><h2 className="font-serif text-6xl leading-none">but few things have my heart.</h2></Note>
      {heart.map((h, index) => (
        <Note key={h.title} x={h.x} y={h.y} className="reveal flex items-center gap-5" at={h.x + 2}>
          <Figure kind={h.kind} alt={h.alt} label={h.label} delay={`${index * 0.5}s`} size="xs" />
          <div className="w-64">
            <p className="font-serif text-4xl leading-tight">{h.title}</p>
            <p className="mt-2 text-muted-foreground">{h.body}</p>
          </div>
        </Note>
      ))}
    </div>
  );
}

// One beat per year, told like a story: a short line that moves it forward,
// and the detail underneath for anyone who wants it.
const timeline = [
  { year: "2024", title: "college.", line: "Computer Science Engineering.\nSMVIT, Raichur.\nfiguring out what I actually wanted to build.", doodle: "notebook" as const },
  { year: "2025", title: "the foundations.", line: "Python, statistics, linear algebra.\nlearning how machines actually think.\nless theory, more curiosity.", doodle: "code" as const },
  { year: "2026", title: "building in public.", line: "AI, GenAI, agents, and real projects.\nlearning by shipping instead of waiting to be ready.", doodle: "laptop" as const },
  { year: "2026", title: "building things.", line: "Fitzy, WeatherGPT, MJ Fitness,\nVANTACODES and more.", doodle: "dumbbell" as const },
  { year: "2027", title: "going deeper.", line: "Agentic AI, GenAI engineering,\nDSA, systems and serious projects.", doodle: "nodes" as const },
  { year: "2028", title: "the plan.", line: "AI / Generative AI Engineer.\nBuild products. Ship ideas.\nKeep learning. Keep moving.", doodle: "globe" as const },
];
const TIMELINE_FROM = 304;
const TIMELINE_STEP = 18;
const STEM = 11;

// The thread curves gently through the years. Each year hangs off it on a thin
// stem — alternating above and below — and only appears once the thread
// arrives. Underneath, what all of it keeps adding up to.
function TimelineScene() {
  const [ys, setYs] = useState<number[] | null>(null);

  // Hang each stem from exactly where the thread passes.
  useEffect(() => {
    const { xs, ys: samples } = sampleThread(TIMELINE_FROM - 2, TIMELINE_FROM + TIMELINE_STEP * timeline.length);
    setYs(timeline.map((_, index) => {
      const x = TIMELINE_FROM + index * TIMELINE_STEP;
      let k = 0;
      while (k < xs.length - 1 && (xs[k + 1] ?? 0) < x) k += 1;
      return samples[k] ?? 50;
    }));
  }, []);

  return (
    <div>
      <span hidden data-mode="thread" data-at={306} data-say="the short version. very short." />
      {ys && timeline.map((stop, index) => {
        const x = TIMELINE_FROM + index * TIMELINE_STEP;
        const y = ys[index] ?? 50;
        const up = index % 2 === 1;
        return (
          <div key={stop.year + stop.title} className="reveal" data-at={x}>
            <span aria-hidden="true" className="absolute w-px bg-foreground/50" style={{ left: `${x}vw`, top: `${up ? y - STEM : y}vh`, height: `${STEM}vh` }} />
            <span aria-hidden="true" className={cn("story-checkpoint absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2", index % 3 === 1 && "story-checkpoint-diamond", index % 3 === 2 && "story-checkpoint-ring")} style={{ left: `calc(${x}vw + 0.5px)`, top: `${up ? y - STEM : y + STEM}vh` }} />
            <Note x={x} y={up ? y - STEM - 2 : y + STEM + 2} className={cn("w-[16vw] max-w-60 -translate-x-1/2 text-center leading-snug", up && "-translate-y-full")}>
              <StoryDoodle kind={stop.doodle} className="mx-auto mb-2 h-8 w-10" />
              <p className="font-serif text-[clamp(0.95rem,1.7vw,1.5rem)] leading-none">{stop.title}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-snug text-muted-foreground">{stop.line}</p>
              <p className="mt-2 font-hand text-sm text-muted-foreground/80">{stop.year} <span className="font-sans text-[0.6rem] tracking-[0.16em]">/ CHECKPOINT {String(index + 1).padStart(2, "0")}</span></p>
            </Note>
          </div>
        );
      })}
      {/* Each phrase fades in as the thread passes over it, like the years. */}
      <Note x={302} y={84} className="reveal" at={302}><p className="whitespace-nowrap font-serif text-5xl">somehow, <span className="text-muted-foreground">i keep ending up...</span></p></Note>
      <Note x={346} y={84} className="reveal" at={346}><p className="whitespace-nowrap font-serif text-5xl"><span className="text-muted-foreground">taking</span> ownership.</p></Note>
      <Note x={380} y={83} className="reveal w-[25rem] text-lg leading-snug" at={380}>
        <p>most things i got curious about, i ended up building.</p>
        <p className="text-muted-foreground">most things i built, i ended up looking after.</p>
      </Note>
    </div>
  );
}

// The habit that keeps repeating, told as a cycle: the thread ties one big
// loop beside the line, and the four steps sit around it in the order the
// thread draws them — bottom, right, top, left — with "repeat." in the middle.
const LOOP_RX = LOOP_R / LOOP_ASPECT;
const habit = [
  { step: "notice it.", x: LOOP_X, y: LOOP_Y, place: "below" },
  { step: "understand it.", x: LOOP_X + LOOP_RX, y: LOOP_Y - LOOP_R, place: "right" },
  { step: "build it.", x: LOOP_X, y: LOOP_Y - 2 * LOOP_R, place: "above" },
  { step: "hand it over.", x: LOOP_X - LOOP_RX, y: LOOP_Y - LOOP_R, place: "left" },
] as const;

const habitLabel = {
  below: "-translate-x-1/2 translate-y-4",
  right: "translate-x-5 -translate-y-1/2",
  above: "-translate-x-1/2 -translate-y-[calc(100%+1rem)]",
  left: "-translate-x-[calc(100%+1.25rem)] -translate-y-1/2",
};

function ApparentlyScene() {
  // The loop is drawn in one go once the thread reaches it, so its steps
  // arrive one after another, in drawing order.
  const looped = LOOP_X + LOOP_RX + 1;
  return (
    <div>
      <span hidden data-mode="thread" data-at={looped} data-say="yes, it's a loop. i'm aware." />
      <Note x={428} y={22} className="reveal w-[32rem]" at={428}>
        <p className="font-serif text-6xl leading-[1.05]">apparently, <span className="text-muted-foreground">i don't know how to leave things alone.</span></p>
      </Note>
      {habit.map(({ step, x, y, place }, index) => (
        <div key={step} className="reveal" data-mode="thread" data-at={looped} style={{ "--reveal-delay": `${index * 0.25}s` } as CSSProperties}>
          <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" style={at(x, y)} />
          <p className={cn("absolute whitespace-nowrap text-lg", habitLabel[place])} style={at(x, y)}>{step}</p>
        </div>
      ))}
      <p className="reveal absolute -translate-x-1/2 -translate-y-1/2 font-serif text-4xl italic" data-mode="thread" data-at={looped} style={{ ...at(LOOP_X, LOOP_Y - LOOP_R), "--reveal-delay": "1s" } as CSSProperties}>repeat.</p>
    </div>
  );
}

// The thread stops. Whitespace. Then the turn into the work.
function EnoughScene({ onWork }: { onWork: () => void }) {
  // The button is pinned to the thread's end point (its left edge, halfway
  // down), so the thread meets it on every screen size; the words sit above.
  return (
    <>
      <span hidden data-mode="thread" data-at={BUTTON_X - 8} data-say="go on. it's the good part." />
      <Note x={BUTTON_X + 4.6} y={BUTTON_Y - 6} className="reveal w-[46vw] -translate-x-1/2 -translate-y-full text-center" at={BUTTON_X - 14}>
        <p className="text-lg text-muted-foreground">enough autobiography.</p>
        <h2 className="mt-3 font-serif text-6xl">let's look at what came out of it.</h2>
      </Note>
      <div className="absolute -translate-y-1/2" style={at(BUTTON_X, BUTTON_Y)}>
        <Button variant="ink" onClick={onWork} data-cursor="show me the work ↓">see the work <ArrowDown className="ml-2 h-4 w-4" /></Button>
      </div>
    </>
  );
}

const figureSizes = { fill: "h-full w-full", xs: "h-10 w-10 sm:h-12 sm:w-12", sm: "h-36 w-36 lg:h-44 lg:w-44", md: "h-44 w-44 lg:h-56 lg:w-56", lg: "h-52 w-52 lg:h-64 lg:w-64" };

type StoryDoodleKind = "notebook" | "code" | "laptop" | "car" | "camera" | "dumbbell" | "nodes" | "globe" | "film" | "spotlight" | "road" | "arrow";

const doodlePaths: Record<StoryDoodleKind, string[]> = {
  notebook: ["M28 17 Q57 12 91 18 L91 80 Q61 73 28 81 Z", "M36 16 L36 79", "M45 31 Q61 28 79 32", "M45 43 Q61 40 79 44", "M45 55 Q59 52 73 56", "M45 67 Q58 64 72 68"],
  code: ["M43 32 L29 49 L43 66", "M77 32 L91 49 L77 66", "M66 27 L54 72", "M39 80 Q59 84 81 79"],
  laptop: ["M31 20 Q31 16 36 16 L87 18 Q92 18 91 23 L88 59 L29 58 Z", "M48 33 L42 40 L50 47", "M67 32 L74 40 L66 47", "M27 63 Q58 69 94 63 L102 73 Q70 79 18 74 Z"],
  car: ["M15 60 Q19 53 30 51 L43 36 Q49 32 70 34 L86 48 L101 51 Q107 54 108 63 L106 69 L14 69 Z", "M39 49 L46 39 Q51 35 68 37 L81 49 Z", "M28 67 A9 9 0 1 0 46 67 A9 9 0 1 0 28 67", "M78 67 A9 9 0 1 0 96 67 A9 9 0 1 0 78 67", "M17 58 Q20 56 24 57", "M94 55 L102 57"],
  camera: ["M20 36 Q20 32 25 32 L39 32 L45 24 L67 25 L73 33 L95 34 Q100 35 100 40 L99 70 Q98 74 94 74 L25 72 Q20 72 20 67 Z", "M45 52 A14 14 0 1 0 73 52 A14 14 0 1 0 45 52", "M82 42 L90 42", "M29 27 L37 27"],
  dumbbell: ["M21 40 L31 40 L31 32 Q32 29 36 29 L43 30 Q46 31 46 35 L46 44 L76 45 L76 35 Q76 31 80 30 L87 30 Q91 31 91 35 L91 45 L101 45 L101 61 L91 61 L91 69 Q90 73 86 73 L80 73 Q76 72 76 68 L76 61 L46 60 L46 68 Q45 72 41 72 L35 71 Q31 70 31 66 L31 60 L21 60 Z", "M13 50 Q58 46 108 52"],
  nodes: ["M29 57 L53 32 L81 47 L66 74 Z", "M29 57 L80 47", "M53 32 L66 74", "M23 57 A6 6 0 1 0 35 57 A6 6 0 1 0 23 57", "M47 32 A6 6 0 1 0 59 32 A6 6 0 1 0 47 32", "M75 47 A6 6 0 1 0 87 47 A6 6 0 1 0 75 47", "M60 74 A6 6 0 1 0 72 74 A6 6 0 1 0 60 74"],
  globe: ["M76 28 A29 29 0 1 0 76 74 A29 29 0 1 0 76 28", "M49 30 Q69 51 49 72", "M76 28 Q55 51 76 74", "M48 43 Q62 49 78 43", "M48 59 Q63 54 78 59", "M78 51 L93 47 L103 51"],
  film: ["M24 25 L96 25 L96 76 L24 76 Z", "M35 25 L35 76", "M85 25 L85 76", "M42 40 L77 39", "M42 51 L77 50", "M42 62 L77 61", "M28 31 L32 31 M28 43 L32 43 M28 56 L32 56 M28 68 L32 68", "M88 31 L92 31 M88 43 L92 43 M88 56 L92 56 M88 68 L92 68"],
  spotlight: ["M36 24 L81 30 L70 59 L27 52 Z", "M32 54 L72 61 L66 69 L35 65 Z", "M52 67 L49 84", "M40 85 Q54 81 68 86", "M85 29 L101 23", "M89 41 L108 41", "M82 53 L99 61"],
  road: ["M19 80 Q37 62 29 48 Q20 32 43 17", "M102 81 Q82 63 91 48 Q101 31 77 17", "M60 75 L60 66", "M60 55 L60 48", "M60 36 L60 29", "M60 19 L60 14"],
  arrow: ["M24 70 Q35 43 57 48 Q77 53 92 26", "M77 27 L92 26 L89 42", "M27 26 L30 29 M20 39 L24 41 M44 18 L45 22"],
};

// Each sketch uses one confident pen stroke and a faint, slightly offset pass.
function StoryDoodle({ kind, className, style }: { kind: StoryDoodleKind; className?: string; style?: CSSProperties }) {
  const paths = doodlePaths[kind];
  return (
    <svg aria-hidden="true" viewBox="0 0 120 100" className={cn("overflow-visible text-foreground", className)} style={style} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(1.2 -0.8)" opacity=".22" strokeWidth="1.2">{paths.map((d, index) => <path key={`echo-${index}`} d={d} />)}</g>
      <g strokeWidth="2.2">{paths.map((d, index) => <path key={index} d={d} />)}</g>
    </svg>
  );
}

// Each hand-drawn object keeps its own little confession. It types on hover,
// leans with the pointer, and floats gently as the thread brings it into view.
function Figure({ kind, alt, label, className, delay, size = "md", still = false, hang = false, labelBelow = false, labelStyle }: { kind: StoryDoodleKind; alt: string; label?: string | undefined; className?: string; delay?: string; size?: keyof typeof figureSizes | undefined; still?: boolean; hang?: boolean; labelBelow?: boolean | undefined; labelStyle?: CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  const [typed, setTyped] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // On phones, objects near an edge open their bubble toward the middle of
  // the screen instead of centred, so the words never run off-screen.
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const hideTimer = useRef(0);

  const open = (el: HTMLElement) => {
    quietOthers(id.current);
    setHovered(true);
    if (window.innerWidth >= 768) return;
    const r = el.getBoundingClientRect();
    const middle = r.left + r.width / 2;
    setAlign(middle < 140 ? "left" : middle > window.innerWidth - 140 ? "right" : "center");
  };

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // Only one confession at a time: opening this one closes any other.
  const id = useRef(Math.random());
  useEffect(() => {
    const close = (e: Event) => {
      if ((e as CustomEvent<number>).detail !== id.current) setHovered(false);
    };
    window.addEventListener("figure-open", close);
    return () => window.removeEventListener("figure-open", close);
  }, []);

  // A tap anywhere else closes the confession.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hovered) return;
    const away = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !rootRef.current?.contains(e.target as Node)) setHovered(false);
    };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [hovered]);

  useEffect(() => {
    if (!hovered || !label) {
      setTyped("");
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(label.slice(0, index));
      if (index >= label.length) window.clearInterval(timer);
    }, 26);
    return () => window.clearInterval(timer);
  }, [hovered, label]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt}
      className={cn("relative shrink-0", figureSizes[size], className)}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") open(e.currentTarget);
      }}
      // A tap opens the confession and keeps it up for a moment; a touch
      // "leaves" as soon as the finger lifts, so it can't rely on hover.
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        open(e.currentTarget);
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setHovered(false), 2500);
      }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") return;
        setHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
    >
      <svg aria-hidden="true" viewBox="0 0 100 12" className="pointer-events-none absolute bottom-[5%] left-1/2 h-2 w-1/2 -translate-x-1/2 text-foreground/30 transition-all duration-500" style={{ scale: hovered ? 0.82 : 1 }}><path d="M4 7 Q48 1 96 7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
      <div className={cn("h-full w-full", hang ? "animate-hang" : !still && "animate-float-object")} style={{ animationDelay: delay }}>
        <StoryDoodle kind={kind} className="h-full w-full select-none transition-transform duration-500" style={{ transform: `rotate(${tilt.x * 2.2}deg) scale(${hovered ? 1.08 : 1})`, transformOrigin: "center", transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }} />
      </div>
      {label && (
        <div
          aria-hidden="true"
          style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)", ...labelStyle }}
          className={cn(
            "pointer-events-none absolute z-40 w-max max-w-[min(16rem,calc(100vw-2rem))] whitespace-pre-line",
            align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
            labelBelow ? "top-[calc(100%+4px)] rounded-[5px_18px_18px_18px]" : align === "right" ? "bottom-[calc(100%+4px)] rounded-[18px_18px_5px_18px]" : "bottom-[calc(100%+4px)] rounded-[18px_18px_18px_5px]",
            " border border-cursor-border bg-cursor px-4 py-2 text-sm text-cursor-foreground shadow-lg transition-all duration-300",
            hovered ? "translate-y-0 scale-100 opacity-100" : cn(labelBelow ? "-translate-y-3" : "translate-y-3", "scale-90 opacity-0"),
          )}
        >
          {typed}
          <span className="animate-pulse">|</span>
        </div>
      )}
    </div>
  );
}

function Object({ kind, alt, label, style, delay, size, labelBelow }: { kind: StoryDoodleKind; alt: string; label?: string | undefined; style: CSSProperties; delay: string; size?: keyof typeof figureSizes; labelBelow?: boolean }) {
  return <div className="absolute" style={style}><Figure kind={kind} alt={alt} label={label} delay={delay} size={size} labelBelow={labelBelow} /></div>;
}

// ---------------------------------------------------------------------------
// Mobile: the same story told vertically. The thread falls from the tangle and
// weaves down the page between the objects, the years hang off it on little
// stems, and it ties the habit loop before ending at the work button. Anchor
// points are read from the laid-out page, so the thread fits any phone.

// Radius (px) of the habit loop on mobile.
const MOBILE_LOOP = 70;

// An object pinned in a mobile block, with the thread passing through its middle.
function MobileObject({ kind, alt, label, style, delay }: { kind: StoryDoodleKind; alt: string; label: string; style: CSSProperties; delay: string }) {
  return (
    <div className="absolute h-36 w-36" style={style}>
      <Figure kind={kind} alt={alt} label={label} size="xs" className="mx-auto mt-10" delay={delay} />
      <span data-anchor className="absolute left-1/2 top-1/2" />
    </div>
  );
}

// An invisible point the thread must pass through, placed within its block.
function Anchor({ x, y, loop }: { x: string; y: number | string; loop?: number }) {
  return <span data-anchor={loop ?? ""} className="absolute" style={{ left: x, top: y }} />;
}

function MobileStory({ ready, onWork }: { ready: boolean; onWork: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tangleRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);
  const samplesRef = useRef<ThreadSamples | null>(null);
  const [geo, setGeo] = useState<{ d: string; w: number; h: number } | null>(null);

  // Trace the thread through every anchor, starting at the tangle's loose end.
  useEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      const svg = tangleRef.current;
      if (!root || !svg || root.offsetParent === null) return;
      const r = root.getBoundingClientRect();
      const t = svg.getBoundingClientRect();
      // The tangle's viewBox is 550×600 from (250,100), scaled to fit and
      // centred; its loose end is at (569,199).
      const k = Math.min(t.width / 550, t.height / 600);
      const points: Waypoint[] = [[t.left - r.left + (t.width - 550 * k) / 2 + 319 * k, t.top - r.top + (t.height - 600 * k) / 2 + 99 * k]];
      root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((el) => {
        const a = el.getBoundingClientRect();
        const loop = Number(el.dataset["anchor"]);
        points.push(loop ? [a.left - r.left, a.top - r.top, loop] : [a.left - r.left, a.top - r.top]);
      });
      const segments = threadSegments(points, 1, 1);
      samplesRef.current = sampleSegments(segments, 24);
      setGeo({ d: segmentsPath(segments), w: r.width, h: r.height });
    };
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Draw the thread down to ~70% of the screen as you scroll, like a pen
  // following your thumb; scrolling back up rewinds it.
  useEffect(() => {
    if (!geo) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const root = rootRef.current;
      const path = pathRef.current;
      const tip = tipRef.current;
      const samples = samplesRef.current;
      if (!root || !path || !tip || !samples) return;
      const { xs, ys, lengths, total } = samples;
      // Nothing leaves the tangle until you scroll; then the thread grows with
      // the scroll until it catches up with ~70% down the screen.
      const top = root.getBoundingClientRect().top;
      const reach = Math.min(window.innerHeight * 0.7 - top, (ys[0] ?? 0) + Math.max(0, -top) * 1.4);
      let i = 0;
      while (i < xs.length - 1 && (ys[i] ?? 0) < reach) i += 1;
      const length = lengths[i] ?? 0;
      path.style.strokeDashoffset = `${1 - length / total}`;
      tip.setAttribute("cx", `${xs[i]}`);
      tip.setAttribute("cy", `${ys[i]}`);
      tip.style.opacity = length > 0 && length < total * 0.999 ? "1" : "0";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [geo]);

  // Things sharpen in as they scroll into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.setAttribute("data-shown", "");
        io.unobserve(e.target);
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.15 },
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    // Story comments, said once each as their moment scrolls up the screen.
    const talk = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const line = (e.target as HTMLElement).dataset["say"];
        if (!e.isIntersecting || !line) return;
        say(`story:${line}`, line);
        talk.unobserve(e.target);
      }),
      { rootMargin: "0px 0px -40% 0px" },
    );
    root.querySelectorAll("[data-say]").forEach((el) => talk.observe(el));
    return () => {
      io.disconnect();
      talk.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative overflow-hidden md:hidden">
      {geo && (
        <svg aria-hidden="true" className={cn("pointer-events-none absolute left-0 top-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`}>
          <path ref={pathRef} d={geo.d} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle ref={tipRef} r="4.5" cx="0" cy="0" style={{ opacity: 0 }} className="fill-foreground" />
        </svg>
      )}

      {/* the story of a builder, still in progress */}
      <div className="relative h-[132svh]">
        <svg ref={tangleRef} aria-hidden="true" viewBox="250 100 550 600" className="absolute inset-x-0 top-[27svh] h-[50svh] w-full overflow-visible">
          <path d={TANGLE} transform="translate(1 -.7)" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".2" />
          <path className="animate-draw-string" style={{ animationDuration: "2.6s" }} pathLength="1" strokeDasharray="1" d={TANGLE} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <div className={cn("absolute right-5 top-[17svh] flex w-44 items-start gap-1.5 text-[0.8rem] leading-snug text-muted-foreground", ready ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>
          <svg aria-hidden="true" viewBox="0 0 40 30" className="mt-4 h-5 w-7 shrink-0"><path d="M38 4 C24 6 12 14 4 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M4 24 L13 22 M4 24 L7 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span>my head, drawn badly on purpose.<br /><span className="font-hand text-base">ideas → code → cars → projects → curiosity.</span></span>
        </div>
        <p className={cn("absolute left-5 top-[90svh] text-[2.6rem] font-semibold leading-[0.95]", ready ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>the story of<br />a builder,<br /><span className="font-serif italic">still in progress.</span></p>
        <Anchor x="86%" y="66svh" />
        <Anchor x="93%" y="122svh" />
      </div>

      {/* outside the code — objects spread out on alternating sides */}
      <div className="relative h-[1500px]">
        <span data-say="buckle up. detours ahead." className="absolute left-0 top-0 h-px w-px" />
        <MobileObject kind="car" alt="a small hand-drawn car" label="drive â†’ build â†’ repeat." style={{ left: "3%", top: 20 }} delay="0s" />
        <p className="reveal absolute right-6 top-[260px] -rotate-3 font-hand text-sm">drive â†’ build â†’ repeat</p>
        <Anchor x="95%" y={400} />
        <div className="reveal absolute inset-x-0 top-[420px] mx-auto max-w-[17rem] text-center">
          <p className="text-muted-foreground">outside the code, there&apos;s this.</p>
          <h2 className="mt-1 whitespace-nowrap font-serif text-[2.1rem] leading-tight">a few obsessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">none of them are optional.</p>
        </div>
        <Anchor x="95%" y={590} />
        <MobileObject kind="camera" alt="a hand-drawn film camera" label="stories worth telling." style={{ left: "4%", top: 630 }} delay=".8s" />
        <MobileObject kind="dumbbell" alt="a hand-drawn dumbbell" label="stronger, one rep at a time." style={{ left: "6%", top: 1010 }} delay="1.6s" />
      </div>

      {/* but few things have my heart — object above its words, alternating sides */}
      <div className="relative px-5 pt-6">
        <span data-say="okay, the soft part." className="absolute left-0 top-0 h-px w-px" />
        <Anchor x="5%" y={0} />
        <Anchor x="5%" y={110} />
        <h2 className="reveal text-center font-serif text-[2.4rem] leading-none">but few things<br />have my heart.</h2>
        {heart.map((h, index) => {
          const right = index % 2 === 1;
          return (
            <div key={h.title} className={cn("reveal relative mt-10 w-[66%]", right && "ml-auto text-right")}>
              <div className={cn("relative h-36 w-36", right && "ml-auto")}>
                <Figure kind={h.kind} alt={h.alt} label={h.label} size="xs" className="mx-auto mt-10" delay={`${index * 0.5}s`} />
                <span data-anchor className="absolute left-1/2 top-1/2" />
              </div>
              <p className="font-serif text-2xl leading-tight">{h.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{h.body}</p>
              {/* leave along the outer edge, below the words */}
              <Anchor x={right ? "calc(100% + 0.25rem)" : "-0.25rem"} y="calc(100% + 0.75rem)" />
            </div>
          );
        })}
      </div>

      {/* somehow, i keep ending up... — the years hang off the thread */}
      <div className="relative mt-20 px-5">
        <span data-say="the short version. very short." className="absolute left-0 top-20 h-px w-px" />
        <Anchor x="6%" y={-20} />
        <p className="reveal mx-auto max-w-[18rem] text-center font-serif text-[2rem] leading-tight">somehow,<br /><span className="text-muted-foreground">i keep ending up...</span></p>
        <ol className="relative mt-10 pl-9">
          {timeline.map((stop, index) => (
            <li key={stop.year + stop.title} className="reveal relative pb-7">
              <span data-anchor className="absolute -left-[1.1rem] top-[0.7rem]" />
              <span aria-hidden="true" className="absolute -left-[1.1rem] top-[0.7rem] h-px w-3 bg-foreground/50" />
              <span aria-hidden="true" className={cn("story-checkpoint absolute left-[-0.4rem] top-[0.55rem] h-2.5 w-2.5", index % 3 === 1 && "story-checkpoint-diamond", index % 3 === 2 && "story-checkpoint-ring")} />
              <StoryDoodle kind={stop.doodle} className="mb-2 h-8 w-10" />
              <p className="font-serif text-2xl leading-none">{stop.title}</p>
              <p className="whitespace-pre-line text-sm leading-snug text-muted-foreground">{stop.line}</p>
              <p className="mt-2 font-hand text-base text-muted-foreground/80">{stop.year} <span className="font-sans text-[0.6rem] tracking-[0.16em]">/ CHECKPOINT {String(index + 1).padStart(2, "0")}</span></p>
            </li>
          ))}
        </ol>
        <Anchor x="6%" y="100%" />
      </div>
      <div className="relative px-5 pt-4">
        <p className="reveal text-center font-serif text-[2rem]"><span className="text-muted-foreground">...taking</span> ownership.</p>
        <div className="reveal mx-auto mt-3 max-w-[19rem] text-center text-sm leading-snug">
          <p>most things i got curious about, i ended up building.</p>
          <p className="text-muted-foreground">most things i built, i ended up looking after.</p>
        </div>
        <Anchor x="5%" y="calc(100% + 1rem)" />
      </div>

      {/* apparently, i don't know how to leave things alone — tied in a loop */}
      <div className="relative mt-16 px-5">
        <Anchor x="89%" y={-24} />
        <Anchor x="90%" y={150} />
        <p className="reveal font-serif text-[2.3rem] leading-[1.05]">apparently, <span className="text-muted-foreground">i don't know how to leave things alone.</span></p>
        <div className="reveal relative mt-4 h-[270px]">
          <span data-say="yes, it's a loop. i'm aware." className="absolute left-0 top-1/2 h-px w-px" />
          <Anchor x="86%" y={205} />
          <Anchor x="50%" y={230} loop={MOBILE_LOOP} />
          <span className="absolute -translate-x-1/2 translate-y-3 whitespace-nowrap text-sm" style={{ left: "50%", top: 230 }}>notice it.</span>
          <span className="absolute -translate-y-1/2 whitespace-nowrap text-sm" style={{ left: `calc(50% + ${MOBILE_LOOP + 10}px)`, top: 230 - MOBILE_LOOP }}>understand it.</span>
          <span className="absolute -translate-x-1/2 -translate-y-[calc(100%+0.6rem)] whitespace-nowrap text-sm" style={{ left: "50%", top: 230 - 2 * MOBILE_LOOP }}>build it.</span>
          <span className="absolute -translate-x-[calc(100%+0.6rem)] -translate-y-1/2 whitespace-nowrap text-sm" style={{ left: `calc(50% - ${MOBILE_LOOP}px)`, top: 230 - MOBILE_LOOP }}>hand it over.</span>
          <span className="absolute -translate-x-1/2 -translate-y-1/2 font-serif text-2xl italic" style={{ left: "50%", top: 230 - MOBILE_LOOP }}>repeat.</span>
        </div>
      </div>

      {/* enough autobiography — the thread ends at the button */}
      <div className="relative px-5 pb-24 pt-14 text-center">
        <span data-say="go on. it's the good part." className="absolute left-0 top-10 h-px w-px" />
        <Anchor x="94%" y={40} />
        <p className="reveal text-sm text-muted-foreground">enough autobiography.</p>
        <h2 className="reveal mt-2 font-serif text-[2.3rem] leading-tight">let's look at what<br />came out of it.</h2>
        <div className="relative mt-7 inline-block">
          <span data-anchor className="absolute left-[calc(100%+2.75rem)] top-[-0.25rem]" />
          <span data-anchor className="absolute left-full top-1/2" />
          <Button variant="ink" onClick={onWork}>see the work <ArrowDown className="ml-2 h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function Works({ filter, setFilter }: { filter: string; setFilter: (filter: string) => void }) {
  const filtered = filter === "All" ? projects : projects.filter((project) => project.tags.includes(filter));
  return (
    <section id="work" className="relative min-h-screen border-t border-foreground bg-background px-5 pb-24 pt-28 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" aria-hidden="true"><p className="translate-y-[-38%] whitespace-nowrap text-[26vw] font-semibold leading-none text-muted">WORKS</p></div>
      <div className="relative mx-auto grid max-w-[1500px] gap-16 pt-[18vw] lg:grid-cols-[minmax(280px,0.65fr)_minmax(0,1.35fr)]">
        <aside className="h-fit lg:sticky lg:top-28">
          <p className="text-sm text-muted-foreground">selected work / 2022—now</p>
          <h2 className="mt-4 max-w-md font-serif text-5xl leading-none sm:text-6xl">a few things,<br /><em>chosen on purpose.</em></h2>
          <p className="mt-8 max-w-sm text-muted-foreground">AI, privacy, and open source, built end to end.</p>
          <p className="mb-3 mt-10 text-sm">show me</p>
          <div className="flex flex-wrap gap-2">
            {["All", "AI", "App", "Open source"].map((item) => <Button key={item} variant="filter" data-active={filter === item} onClick={() => setFilter(item)} data-cursor={`filter: ${item.toLowerCase()}`}>{item}</Button>)}
          </div>
        </aside>
        <div className="grid gap-20">
          {filtered.map((project) => (
            <article key={project.title} className="group">
              {project.live ? (
                <a href={project.live} target="_blank" rel="noreferrer" className="grid aspect-[4/3] place-items-center overflow-hidden border border-border bg-muted" data-cursor="open live project ↗">
                  <span className="font-serif text-5xl">{project.title}</span>
                </a>
              ) : (
                <div className="grid aspect-[4/3] place-items-center overflow-hidden border border-border bg-muted" aria-label={`${project.title} preview image not supplied`}>
                  <span className="font-serif text-5xl">{project.title}</span>
                </div>
              )}
              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5">
                <div className="min-w-0"><p className="text-xs text-muted-foreground">{project.number} / {project.tags.join(" · ")}</p><h3 className="mt-1 font-serif text-4xl">{project.title}</h3><p className="mt-2 max-w-xl text-muted-foreground">{project.blurb}</p></div>
                <Button asChild variant="paper" size="icon"><a href={project.code} target="_blank" rel="noreferrer" aria-label={`${project.title} on GitHub`} data-cursor="read the code ↗"><ArrowUpRight className="h-5 w-5" /></a></Button>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p className="py-24 text-muted-foreground">That shelf is being rearranged. Try another filter.</p>}
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-10">
            <p className="font-serif text-3xl">interested? <span className="text-muted-foreground">there's more.</span></p>
            
          </div>
        </div>
      </div>
    </section>
  );
}

// Where the closing thread ends — her raised hand — in vw/vh of the section's
// first screen. The photo is pinned so that hand lands exactly on this point.
const HAND_X = 78;
const HAND_Y = 20;
// The supplied portrait has crossed arms, so the thread meets the top-center
// of the portrait where the old raised hand used to sit.
const CUTOUT_ANCHOR_X = 0.47;
const CUTOUT_ANCHOR_Y = 0.07;

// What I say as people keep playing with the cutout — one line per stretch,
// getting less patient, until it's time to just talk.
const meLines = [
  "hey, you found me.",
  "easy, easy.",
  "okay, that tickles.",
  "you're enjoying this, aren't you?",
  "i'm a student, not a rubber band.",
  `okay, enough. let's connect? ↓ ${EMAIL}`,
];

// My cutout, pinned by the raised hand. Hover and it pops forward and says
// hi; grab and drag to stretch it like rubber from that hand, and it springs
// back on release. Every stretch gets a new (less patient) line.
function MeCutout({ visible, phone = false, imgRef }: { visible: boolean; phone?: boolean; imgRef?: RefObject<HTMLImageElement | null> }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [pull, setPull] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [stretches, setStretches] = useState(0);
  const [typed, setTyped] = useState("");

  // Stretch along the pull, squeezing the other way so it feels like rubber.
  const stretch = Math.min(1.8, Math.max(0.6, 1 + pull.y / 400));
  const squeeze = 1 / Math.sqrt(stretch);
  const lean = Math.max(-25, Math.min(25, pull.x / 12));

  const pulledHard = dragging && (stretch > 1.5 || stretch < 0.7 || Math.abs(lean) > 20);
  const line = pulledHard ? "ow. that's not how bodies work." : meLines[Math.min(stretches, meLines.length - 1)]!;
  const talking = hovered || dragging;
  useEffect(() => {
    if (talking) quietOthers(-2);
  }, [talking]);

  // Type each new line out, like the other objects' confessions.
  useEffect(() => {
    if (!talking) {
      setTyped("");
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(line.slice(0, index));
      if (index >= line.length) window.clearInterval(timer);
    }, 26);
    return () => window.clearInterval(timer);
  }, [talking, line]);

  const letGo = () => {
    if (start.current && (Math.abs(pull.x) > 20 || Math.abs(pull.y) > 20)) setStretches((n) => n + 1);
    start.current = null;
    setDragging(false);
    setPull({ x: 0, y: 0 });
  };

  return (
    <>
      <div
        aria-live="polite"
        style={phone ? { left: "-0.5rem", top: "22%", transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" } : { left: `${HAND_X - 4}vw`, top: `${HAND_Y + 16}vh`, transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
        className={cn(
          "absolute z-30 w-max max-w-[16rem] -translate-x-full whitespace-pre-line rounded-[18px_18px_5px_18px] border border-cursor-border bg-cursor px-4 py-2 text-sm text-cursor-foreground shadow-lg transition-[opacity,scale] duration-300",
          phone && "max-w-[calc(42vw-1.5rem)]",
          talking ? "scale-100 opacity-100" : "scale-90 opacity-0",
        )}
      >
        {typed}
        <span className="animate-pulse">|</span>
      </div>
      <img
        ref={imgRef}
        src={me}
        alt="Abdul Rahman standing with his arms crossed"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        data-cursor=""
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start.current = { x: e.clientX, y: e.clientY };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          setPull({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
        }}
        onPointerUp={letGo}
        onPointerCancel={letGo}
        className={cn(
          phone ? "relative z-10 block h-auto w-full touch-none select-none" : "pointer-events-auto absolute z-20 h-[76vh] w-auto max-w-none touch-none select-none",
          dragging ? "cursor-grabbing" : "cursor-grab",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{
          ...(phone ? {} : { left: `${HAND_X}vw`, top: `${HAND_Y}vh`, translate: `${-CUTOUT_ANCHOR_X * 100}% ${-CUTOUT_ANCHOR_Y * 100}%` }),
          transformOrigin: `${CUTOUT_ANCHOR_X * 100}% ${CUTOUT_ANCHOR_Y * 100}%`,
          transform: `skewX(${-lean}deg) scale(${(hovered && !dragging ? 1.04 : 1) * squeeze}, ${(hovered && !dragging ? 1.04 : 1) * stretch})`,
          filter: talking ? "drop-shadow(0 24px 30px rgb(0 0 0 / 0.22))" : "drop-shadow(0 6px 10px rgb(0 0 0 / 0.08))",
          // Follow the finger instantly while dragging; wobble back when let go.
          transition: dragging ? "filter .3s" : "transform .9s cubic-bezier(.2,2.2,.4,.8), filter .3s, opacity .4s",
        }}
      />
    </>
  );
}

// A handwritten margin note, like scribbles on the page.
function Scribble({ className, rotate = -10, children }: { className?: string; rotate?: number; children: ReactNode }) {
  return (
    <p className={cn("font-hand text-[1.05rem] leading-[1.3] tracking-[0.08em] text-foreground/75", className)} style={{ rotate: `${rotate}deg` }}>
      {children}
    </p>
  );
}

// A small hand-drawn arrow. `d` is the stroke; the head is drawn at its end.
function ScribbleArrow({ d, head, className, style }: { d: string; head: string; className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 60" className={cn("absolute h-10 w-10 overflow-visible text-foreground/70", className)} style={style}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d={head} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const pill = "inline-flex items-center justify-between gap-10 rounded-xl px-5 text-[1.05rem] transition-colors";

// 10 — the end. "oh, hi. i'm abdul." — and the thread leaves the "hi." and
// waves its way across into my raised hand. Margin notes scribbled around it.
function OhHi() {
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const hiRef = useRef<HTMLSpanElement>(null);
  // Only the two moments that change the layout go through React: the words
  // arriving, and the thread reaching my hand.
  const [stage, setStage] = useState({ seen: false, reached: false });
  const [thread, setThread] = useState("");
  const seen = stage.seen;
  // Phones: the thread runs down the page from "oh, hi." into my raised hand.
  const phoneImgRef = useRef<HTMLImageElement>(null);
  const phonePathRef = useRef<SVGPathElement>(null);
  const [phoneThread, setPhoneThread] = useState<{ d: string; y0: number; y1: number; w: number; h: number } | null>(null);
  const [phoneReached, setPhoneReached] = useState(false);

  // The thread starts right after "oh, hi." — wherever the type lands on this
  // screen — so measure it, then wave through to the hand.
  useEffect(() => {
    const measure = () => {
      const hi = hiRef.current;
      const section = ref.current;
      if (!hi || !section) return;
      const r = hi.getBoundingClientRect();
      const q = section.getBoundingClientRect();
      const sx = ((r.right - q.left) / window.innerWidth) * 100 + 0.8;
      const sy = ((r.top - q.top + r.height * 0.55) / window.innerHeight) * 100;
      // On phones, trace it in pixels: out of the "hi.", down the right edge,
      // and hook into the hand (41% across, 2% down the cutout).
      const img = phoneImgRef.current;
      if (window.innerWidth < 768 && img) {
        const m = img.getBoundingClientRect();
        const w = q.width;
        const start: Waypoint = [r.right - q.left + 6, r.top - q.top + r.height * 0.55];
        const hand: Waypoint = [m.left - q.left + m.width * CUTOUT_ANCHOR_X, m.top - q.top + m.height * CUTOUT_ANCHOR_Y];
        const d = segmentsPath(threadSegments([start, [w * 0.9, start[1] + 36], [w * 0.95, (start[1] + hand[1]) / 2], [hand[0] + 44, hand[1] - 80], hand], 1, 1));
        setPhoneThread({ d, y0: start[1], y1: hand[1], w, h: q.height });
      }
      const crest = Math.max(sx + 6, 31);
      setThread(threadPath([[sx, sy], [crest, sy - 4], [crest + 14, 36], [59, 51.5], [68, 38], [72.5, HAND_Y + 3], [HAND_X - 2.5, HAND_Y + 0.2], [HAND_X, HAND_Y]]));
    };
    measure();
    void document.fonts?.ready.then(measure);
    // The cutout has no height until it loads, so trace again once it has.
    const photo = phoneImgRef.current;
    photo?.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    return () => {
      photo?.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!phoneThread) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const node = ref.current;
      const path = phonePathRef.current;
      if (!node || !path) return;
      const top = node.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.72 - (top + phoneThread.y0)) / Math.max(1, phoneThread.y1 - phoneThread.y0)));
      path.style.strokeDashoffset = `${1 - p}`;
      setPhoneReached(p >= 0.98);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [phoneThread]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Arrive and the thread travels toward my hand; scroll back up and it
    // retraces its way out. It animates on its own rather than sticking to
    // the scrollbar, easing toward wherever it should be.
    let frame = 0;
    let current = 0;
    let greeted = false;
    const tick = () => {
      const { top } = node.getBoundingClientRect();
      const target = top < window.innerHeight * 0.45 ? 1 : 0;
      const gap = target - current;
      current = Math.abs(gap) < 0.002 ? target : current + gap * 0.045 + Math.sign(gap) * 0.004;
      current = Math.min(1, Math.max(0, current));
      if (pathRef.current) pathRef.current.style.strokeDashoffset = `${1 - current}`;
      const next = { seen: current > 0.3, reached: current >= 0.98 };
      if (next.reached && !greeted) {
        greeted = true;
        say("hi", "you made it all the way here? hi.");
      }
      setStage((s) => (s.seen === next.seen && s.reached === next.reached ? s : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Fade and sharpen something in, merged with its own classes and style.
  const arrive = (on: boolean, delay: string, className: string, style?: CSSProperties) => ({
    className: cn(className, "transition-all duration-700", on ? "translate-y-0 opacity-100 blur-0" : "translate-y-3 opacity-0 blur-sm"),
    style: { ...style, transitionDelay: on ? delay : "0s" },
  });

  return (
    <section id="hi" ref={ref} className="relative min-h-screen overflow-hidden border-t border-border px-5 pb-10 pt-28 sm:px-8 md:h-screen md:min-h-[720px] md:px-[4.5vw] md:pb-0 md:pt-[23vh]">
      {phoneThread && (
        <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0 md:hidden" width={phoneThread.w} height={phoneThread.h} viewBox={`0 0 ${phoneThread.w} ${phoneThread.h}`}>
          <path ref={phonePathRef} d={phoneThread.d} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-screen md:block">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path ref={pathRef} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 }} d={thread} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {/* little sparks where the thread meets the peace sign */}
        <svg viewBox="0 0 40 40" className={cn("absolute h-14 w-14 transition-all duration-500", stage.reached ? "scale-100 opacity-100" : "scale-50 opacity-0")} style={{ left: `calc(${HAND_X}vw + 0.4rem)`, top: `calc(${HAND_Y}vh - 3.4rem)` }}>
          <path d="M9 4 L11 15 M23 7 L18 17 M33 17 L23 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <MeCutout visible={stage.reached} />
        <div {...arrive(stage.reached, ".3s", "absolute z-30", { left: `${HAND_X + 9.5}vw`, top: "32vh" })}>
          <Scribble className="w-36" rotate={-14}>same guy...<br />just more<br />ideas now.</Scribble>
          <ScribbleArrow className="-left-2 top-24" d="M30 4 C32 20 22 32 6 36" head="M6 36 L16 29 M6 36 L15 42" />
        </div>
        <div {...arrive(stage.reached, ".6s", "absolute z-30", { left: `${HAND_X + 9.5}vw`, top: "65vh" })}>
          <Scribble className="w-36" rotate={-14}>still figuring<br />this out...<br />and probably<br />always will.</Scribble>
          <ScribbleArrow className="-left-12 top-10" d="M40 18 C30 30 18 32 6 30" head="M6 30 L15 24 M6 30 L14 37" />
        </div>
      </div>

      <div {...arrive(seen, "0s", "relative md:max-w-[58vw]")}>
        <div className="relative w-fit">
          <Scribble className="absolute -left-1 -top-14 hidden md:block" rotate={-12}>who made this?</Scribble>
          <ScribbleArrow className="-left-8 -top-7 hidden md:block" d="M26 4 C12 10 6 22 10 36" head="M10 36 L4 27 M10 36 L16 29" />
          <h2 className="font-serif text-[clamp(3.5rem,6.6vw,7.5rem)] leading-[0.9] tracking-[-0.01em]">
            <span ref={hiRef}>oh, hi.</span>
            <br />
            i'm <em>abdul</em>.
          </h2>
        </div>
        <p className="mt-4 text-[clamp(1.05rem,1.25vw,1.35rem)] leading-[1.2] text-muted-foreground">still curious.<br />still building.<br />still opening tabs.</p>
        <p className="mt-7 font-serif text-[clamp(1.75rem,2.75vw,3rem)] leading-[1.08]">let's build something<br />the internet <em>hasn't seen yet</em>.</p>
        <div className="relative mt-7 flex w-fit flex-col items-start gap-3">
          <a href={`mailto:${EMAIL}`} className={cn(pill, "min-w-64 bg-foreground py-3 text-background hover:bg-foreground/85")} data-cursor="send the interesting idea.">{EMAIL} <ArrowUpRight className="h-4 w-4" /></a>
          <div className="flex flex-wrap gap-3">
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className={cn(pill, "border border-foreground/50 py-2.5 hover:bg-foreground/5 max-md:bg-background")} data-cursor="the professional version.">linkedin <ArrowUpRight className="h-4 w-4" /></a>
            <a href={LINKS.github} target="_blank" rel="noreferrer" className={cn(pill, "border border-foreground/50 py-2.5 hover:bg-foreground/5 max-md:bg-background")} data-cursor="where the rabbit holes live.">github <ArrowUpRight className="h-4 w-4" /></a>
            <a href={LINKS.x} target="_blank" rel="noreferrer" className={cn(pill, "border border-foreground/50 py-2.5 hover:bg-foreground/5 max-md:bg-background")} data-cursor="unfiltered thoughts.">x <ArrowUpRight className="h-4 w-4" /></a>
          </div>
          {/* the film camera sits just past the buttons, with a fun fact beside it */}
          <div className="absolute bottom-[-1.75rem] left-[calc(100%+5vw)] hidden items-end gap-1 md:flex">
            <div className="relative mb-24">
              <Scribble className="w-36" rotate={-10}>fun fact:<br />I wanted to be<br />an actor.</Scribble>
              <ScribbleArrow className="-right-8 top-[4.5rem]" d="M4 8 C8 22 18 30 34 30" head="M34 30 L25 24 M34 30 L26 37" />
              <p className="mt-2 max-w-36 text-xs leading-snug text-muted-foreground">still chasing the spotlight.<br />just through code for now.</p>
            </div>
            <Figure kind="spotlight" alt="a hand-drawn spotlight" label="still chasing the spotlight." size="xs" />
          </div>
        </div>
        <div className="relative ml-auto mt-16 w-[58%] md:hidden">
          <MeCutout phone visible={phoneReached} imgRef={phoneImgRef} />
          {/* the film camera, with its fun fact above it */}
          <div className="absolute bottom-[1%] right-[66%] flex w-40 flex-col items-center">
            <Scribble className="mb-1 w-36 text-center" rotate={-8}>fun fact:<br />I wanted to be<br />an actor.</Scribble>
            <p className="mb-2 max-w-36 text-center text-xs leading-snug text-muted-foreground">still chasing the spotlight.<br />just through code for now.</p>
            <Figure kind="spotlight" alt="a hand-drawn spotlight" label="still chasing the spotlight." size="xs" />
          </div>
        </div>
      </div>

      <button onClick={() => document.getElementById("brain")?.scrollIntoView({ behavior: "smooth" })} className="story-link mt-10 block bg-transparent text-xs text-muted-foreground/70 md:absolute md:bottom-5 md:right-8 md:mt-0" data-cursor="rewind ↑">© 2026 abdul · back to top ↑</button>
    </section>
  );
}

// Phones have no cursor, so the story's comments pop up as a little chat
// bubble in the bottom corner instead — typed out, then gone.
function PhoneComment() {
  const [comment, setComment] = useState<CursorComment | null>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const onComment = (event: Event) => {
      const next = (event as CustomEvent<CursorComment>).detail;
      if (next.id !== "hover" && window.innerWidth < 768) setComment(next);
    };
    const hush = (e: Event) => {
      if ((e as CustomEvent<number>).detail !== -1) setComment(null);
    };
    window.addEventListener("figure-open", hush);
    window.addEventListener("cursor-comment", onComment);
    return () => window.removeEventListener("figure-open", hush);
      window.removeEventListener("cursor-comment", onComment);
  }, []);

  useEffect(() => {
    setTyped("");
    if (!comment) return;
    let index = 0;
    let fade = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(comment.text.slice(0, index));
      if (index >= comment.text.length) {
        window.clearInterval(timer);
        fade = window.setTimeout(() => setComment((c) => (c === comment ? null : c)), 3800);
      }
    }, 32);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fade);
    };
  }, [comment]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-5 left-4 z-[90] md:hidden">
      <div
        className={cn(
          "origin-bottom-left whitespace-nowrap rounded-[24px_24px_24px_2px] border-2 border-cursor-border bg-cursor px-4 py-2 text-sm font-medium text-cursor-foreground transition-[opacity,scale] duration-300 [filter:drop-shadow(4px_4px_5px_rgb(46_144_250/0.16))]",
          comment ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
      >
        {typed || " "}
      </div>
    </div>
  );
}

// The cursor's comment bubble. It trails the pointer with a touch of easing
// and says nothing by default — it only speaks when the story or the thing
// under the pointer has something to say, types it out, and fades away.
function CuriousCursor({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [comment, setComment] = useState<CursorComment | null>(null);
  const [typed, setTyped] = useState("");
  const [moved, setMoved] = useState(false);
  // Re-places the bubble without the pointer moving (e.g. as text types out).
  const reposition = useRef(() => {});

  useEffect(() => {
    const target = { x: -200, y: -200 };
    const pos = { x: -200, y: -200 };
    let frame = 0;
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.28;
      pos.y += (target.y - pos.y) * 0.28;
      const el = ref.current;
      if (el) {
        // Near the right or bottom edge, the bubble flips to the other side of
        // the pointer so it never runs off screen.
        const bubble = el.firstElementChild as HTMLElement | null;
        const w = bubble?.offsetWidth ?? 0;
        const h = bubble?.offsetHeight ?? 0;
        const left = pos.x + 14 + w > window.innerWidth - 8;
        const up = pos.y + 16 + h > window.innerHeight - 8;
        const x = left ? pos.x - 14 - w : pos.x + 14;
        const y = up ? pos.y - 16 - h : pos.y + 16;
        el.style.transform = `translate3d(${Math.max(8, x)}px, ${Math.max(8, y)}px, 0)`;
        // the sharp corner always points back at the cursor
        if (bubble) {
          const r = ["24px", "24px", "24px", "24px"];
          r[up ? (left ? 2 : 3) : left ? 1 : 0] = "2px";
          bubble.style.borderRadius = r.join(" ");
          bubble.style.transformOrigin = `${up ? "bottom" : "top"} ${left ? "right" : "left"}`;
        }
      }
      frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    reposition.current = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      // The first move puts the bubble right at the pointer, no glide in.
      if (target.x === -200) {
        pos.x = event.clientX;
        pos.y = event.clientY;
      }
      target.x = event.clientX;
      target.y = event.clientY;
      setMoved(true);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    // Hovering something with a comment says it; moving off it goes quiet.
    let hoverText = "";
    const over = (event: PointerEvent) => {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-cursor]") : null;
      const text = el?.dataset["cursor"] ?? "";
      if (text === hoverText) return;
      hoverText = text;
      if (text) setComment({ id: "hover", text, fade: false });
      else setComment((c) => (c?.id === "hover" ? null : c));
    };
    const onComment = (event: Event) => setComment((event as CustomEvent<CursorComment>).detail);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    const hush = (e: Event) => {
      if ((e as CustomEvent<number>).detail !== -1) setComment(null);
    };
    window.addEventListener("figure-open", hush);
    window.addEventListener("cursor-comment", onComment);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("figure-open", hush);
      window.removeEventListener("cursor-comment", onComment);
    };
  }, []);

  // Type the comment out, then let story comments fade after a few seconds.
  // The bubble grows as it types, so keep checking it still fits on screen.
  useEffect(() => {
    reposition.current();
  }, [typed]);

  useEffect(() => {
    setTyped("");
    if (!comment) return;
    let index = 0;
    let fade = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(comment.text.slice(0, index));
      if (index >= comment.text.length) {
        window.clearInterval(timer);
        if (comment.fade) fade = window.setTimeout(() => setComment((c) => (c === comment ? null : c)), 4500);
      }
    }, 32);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fade);
    };
  }, [comment]);

  const showing = visible && moved && comment !== null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden will-change-transform motion-reduce:hidden lg:block"
      style={{ transform: "translate3d(-200px, -200px, 0)" }}
    >
      <div
        className={cn(
          "origin-top-left whitespace-nowrap rounded-[2px_24px_24px_24px] border-2 border-cursor-border bg-cursor px-4 py-2 text-sm font-medium text-cursor-foreground transition-[opacity,scale] duration-300 [filter:drop-shadow(4px_4px_5px_rgb(46_144_250/0.16))]",
          showing ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
      >
        {typed || " "}
      </div>
    </div>
  );
}
