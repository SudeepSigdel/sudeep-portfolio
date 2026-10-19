import { meadowBridge } from '../meadow/bridge';
import { createSoundtrack, type AudioConfig, type SoundState } from './audio';

type Config = {
  timing: { wordsPerMinute: number; introSeconds: number; chapterPauseSeconds: number; outroSeconds: number };
  audio: AudioConfig;
  words: number;
};

type State = 'closed' | 'opening' | 'title' | 'crawl' | 'end' | 'reading' | 'closing';

const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b);

/**
 * The story overlay. The meadow scene lifts into a starfield (see meadow/bridge.ts), the page fades away, the title card
 * appears, and the text crawls up a tilted plane (CSS 3D). Everything that starts is undone on exit: timers, the animation
 * frame, key and resize listeners, the audio element, the inert and scroll-lock state of the page.
 */
export function initStory(root: HTMLElement) {
  const cfg: Config = JSON.parse(root.dataset.config ?? '{}');
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const stage = $('[data-stage]');
  const scroller = $('[data-scroller]');
  const gaps = Array.from(root.querySelectorAll<HTMLElement>('[data-gap]'));
  const endCard = $('[data-end]');
  const progress = $('[data-progress]');
  const status = $('[data-status]');
  const btnExit = $<HTMLButtonElement>('[data-exit]');
  const btnPause = $<HTMLButtonElement>('[data-pause]');
  const btnSkip = $<HTMLButtonElement>('[data-skip]');
  const btnSound = $<HTMLButtonElement>('[data-sound]');
  const btnBack = $<HTMLButtonElement>('[data-back]');
  const btnReturn = $<HTMLButtonElement>('[data-return]');
  const btnWork = $<HTMLAnchorElement>('[data-work]');
  const openers = Array.from(document.querySelectorAll<HTMLElement>('[data-story-open]'));
  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  let state: State = 'closed';
  let run = 0;
  let trigger: HTMLElement | null = null;
  let afterClose: (() => void) | null = null;
  const timers = new Map<number, () => void>();

  // ---- helpers ---------------------------------------------------------------------------------------------------
  /** Resolves true after `ms`, or false at once if the story is cancelled (exit/skip) in the meantime. */
  const wait = (ms: number, id: number) =>
    new Promise<boolean>((resolve) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        resolve(id === run);
      }, ms);
      timers.set(t, () => resolve(false));
    });
  function cancelRun() {
    run++;
    timers.forEach((resolve, t) => {
      clearTimeout(t);
      resolve();
    });
    timers.clear();
  }
  const say = (msg: string) => {
    status.textContent = '';
    window.setTimeout(() => (status.textContent = msg), 50);
  };
  const pageEls = () => Array.from(document.querySelectorAll<HTMLElement>('header.hero, main, footer, nav[data-nav], a.skip'));

  // ---- sound -----------------------------------------------------------------------------------------------------
  const sound = createSoundtrack(cfg.audio, (s: SoundState, message?: string) => {
    const label = { none: 'Sound: none', off: 'Sound: off', on: 'Sound: on', error: 'Sound: unavailable' }[s];
    btnSound.textContent = label;
    btnSound.disabled = s === 'none' || s === 'error';
    btnSound.title = s === 'none' ? 'No soundtrack is set up yet' : s === 'error' ? 'The soundtrack could not be loaded' : '';
    btnSound.classList.toggle('is-on', s === 'on');
    if (message) say(message);
  });
  btnSound.addEventListener('click', () => sound.toggle());

  // ---- the crawl -------------------------------------------------------------------------------------------------
  let raf = 0;
  let last = 0;
  let pos = 0; // pixels travelled
  let speed = 20; // pixels per second
  let planeH = 0;
  let endPos = 1;
  let paused = false;

  /** Measure the text, work out the speed from the reading pace, and size the pauses so they last the configured seconds. */
  function layout(keepFraction: boolean) {
    const frac = keepFraction && endPos > 0 ? pos / endPos : 0;
    planeH = stage.clientHeight;
    gaps.forEach((g) => (g.style.height = '0px'));
    const textPx = scroller.scrollHeight;
    const seconds = Math.max((cfg.words / cfg.timing.wordsPerMinute) * 60, 1);
    speed = clamp(textPx / seconds, 6, 80);
    const t = cfg.timing;
    for (const g of gaps) {
      const kind = g.dataset.gap;
      const s = kind === 'intro' ? t.introSeconds : kind === 'outro' ? t.outroSeconds : t.chapterPauseSeconds;
      g.style.height = `${Math.round(s * speed)}px`;
    }
    endPos = scroller.scrollHeight + planeH * 0.3;
    pos = frac * endPos;
    apply();
  }

  function apply() {
    scroller.style.transform = `translate3d(0, ${(planeH - pos).toFixed(2)}px, 0)`;
    progress.style.transform = `scaleX(${clamp(pos / endPos, 0, 1).toFixed(4)})`;
  }

  function tick(now: number) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.5);
    last = now;
    if (paused || document.hidden) return;
    pos += speed * dt;
    apply();
    if (pos >= endPos) showEnd();
  }

  function startCrawl() {
    layout(false);
    paused = false;
    syncPause();
    state = 'crawl';
    root.classList.add('is-crawling');
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function syncPause() {
    btnPause.textContent = paused ? 'Autoplay: off' : 'Autoplay: on';
    btnPause.setAttribute('aria-pressed', String(!paused));
    root.classList.toggle('is-paused', paused);
  }
  btnPause.addEventListener('click', () => {
    if (state !== 'crawl') return;
    paused = !paused;
    syncPause();
    say(paused ? 'Autoplay off. Scroll to read at your own pace.' : 'Autoplay on.');
  });

  /** Manual scrolling: wheel, touch drag and keys move the text; any of them switches autoplay off until it is turned back on. */
  function nudge(dy: number) {
    if (state === 'end' && dy < 0) backToStory();
    if (state !== 'crawl') return;
    if (!paused) {
      paused = true;
      syncPause();
    }
    pos = clamp(pos + dy, 0, endPos);
    apply();
    if (pos >= endPos) showEnd();
  }
  stage.addEventListener(
    'wheel',
    (e) => {
      if (state !== 'crawl' && state !== 'end') return;
      e.preventDefault();
      nudge(e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY);
    },
    { passive: false },
  );
  let touchY = 0;
  stage.addEventListener('touchstart', (e) => (touchY = e.touches[0].clientY), { passive: true });
  stage.addEventListener(
    'touchmove',
    (e) => {
      if (state !== 'crawl' && state !== 'end') return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      nudge((touchY - y) * 1.3);
      touchY = y;
    },
    { passive: false },
  );

  /** From the closing card, scrolling up (or the button) brings the text back, with autoplay off so it stays put. */
  function backToStory() {
    if (state !== 'end') return;
    state = 'crawl';
    paused = true;
    syncPause();
    pos = Math.max(endPos - planeH * 0.5, 0);
    apply();
    endCard.classList.remove('show');
    endCard.hidden = true;
    root.classList.remove('is-ended');
    root.classList.add('is-crawling');
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    stage.focus({ preventScroll: true });
    say('Back in the story. Scroll to keep reading.');
  }
  btnBack.addEventListener('click', backToStory);

  function showEnd() {
    if (state === 'end' || state === 'closing' || state === 'closed') return;
    cancelRun();
    cancelAnimationFrame(raf);
    state = 'end';
    pos = endPos;
    apply();
    root.classList.remove('is-crawling', 'is-paused', 'show-title');
    root.classList.add('is-ended');
    endCard.hidden = false;
    requestAnimationFrame(() => endCard.classList.add('show'));
    say('End of the story.');
    btnReturn.focus({ preventScroll: true });
  }
  btnSkip.addEventListener('click', () => {
    if (state === 'opening' || state === 'title' || state === 'crawl') showEnd();
  });

  // ---- open ------------------------------------------------------------------------------------------------------
  async function open(from: HTMLElement | null) {
    if (state !== 'closed') return;
    state = 'opening';
    trigger = from;
    const id = ++run;
    const reduced = reduce.matches;
    const scrollbar = window.innerWidth - html.clientWidth;

    html.classList.add('story-anim', 'story-open', 'story-lock');
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    pageEls().forEach((el) => el.setAttribute('inert', ''));
    root.hidden = false;
    root.classList.toggle('is-reduced', reduced);
    root.classList.toggle('no-gl', !meadowBridge.api);
    document.addEventListener('keydown', onKey);
    sound.enter();
    say('Opening the story.');

    // the camera lifts from the meadow into the stars (or, without WebGL, a plain dark backdrop fades in)
    const space = meadowBridge.api ? meadowBridge.api.setSpace(true, { instant: reduced }) : Promise.resolve();
    requestAnimationFrame(() => root.classList.add('is-open'));
    btnExit.focus({ preventScroll: true });

    if (reduced) {
      // a readable, still version: the same text, scrolling normally, no crawl and no perspective
      state = 'reading';
      layoutReading();
      return;
    }

    window.addEventListener('resize', onResize);
    if (!(await wait(2300, id))) return;
    state = 'title';
    root.classList.add('show-title');
    if (!(await wait(5200, id))) return;
    root.classList.remove('show-title');
    await space;
    if (id !== run) return;
    if (!(await wait(1100, id))) return;
    startCrawl();
  }

  function layoutReading() {
    gaps.forEach((g) => (g.style.height = '0px'));
    scroller.style.transform = '';
    progress.style.transform = 'scaleX(0)';
    stage.scrollTop = 0;
    const onScroll = () => {
      const max = stage.scrollHeight - stage.clientHeight;
      progress.style.transform = `scaleX(${max > 0 ? clamp(stage.scrollTop / max, 0, 1) : 1})`;
    };
    stage.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => stage.removeEventListener('scroll', onScroll));
  }
  const cleanups: (() => void)[] = [];

  // ---- close -----------------------------------------------------------------------------------------------------
  async function close() {
    if (state === 'closed' || state === 'closing') return;
    state = 'closing';
    cancelRun();
    cancelAnimationFrame(raf);
    const reduced = reduce.matches;
    window.removeEventListener('resize', onResize);
    root.classList.add('is-closing');
    root.classList.remove('is-open', 'show-title', 'is-crawling');
    void sound.leave();
    say('Returning to the meadow.');

    const space = meadowBridge.api ? meadowBridge.api.setSpace(false, { instant: reduced }) : Promise.resolve();
    // the page comes back while the camera is still settling
    window.setTimeout(() => html.classList.remove('story-open'), reduced ? 0 : 1300);
    await space;
    await new Promise<void>((r) => window.setTimeout(r, reduced ? 0 : 900));

    html.classList.remove('story-open', 'story-anim', 'story-lock');
    document.body.style.paddingRight = '';
    pageEls().forEach((el) => el.removeAttribute('inert'));
    document.removeEventListener('keydown', onKey);
    cleanups.splice(0).forEach((f) => f());
    root.hidden = true;
    root.className = 'story';
    endCard.hidden = true;
    endCard.classList.remove('show');
    scroller.style.transform = '';
    progress.style.transform = 'scaleX(0)';
    pos = 0;
    paused = false;
    syncPause();
    state = 'closed';
    const after = afterClose;
    afterClose = null;
    if (after) after();
    else trigger?.focus({ preventScroll: true });
    trigger = null;
  }

  // ---- input -----------------------------------------------------------------------------------------------------
  function onKey(e: KeyboardEvent) {
    if (state === 'closed') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      void close();
      return;
    }
    if (e.key === 'Tab') {
      const items = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]')).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!items.length) return;
      const first = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'BUTTON' || tag === 'A') return; // let the focused control handle Space/Enter itself
    const page = stage.clientHeight * 0.6;
    const moves: Record<string, number> = { ArrowDown: 60, ArrowUp: -60, PageDown: page, PageUp: -page };
    if ((state === 'crawl' || state === 'end') && e.key in moves) {
      e.preventDefault();
      nudge(moves[e.key]);
    } else if ((e.key === ' ' || e.key === 'k') && state === 'crawl') {
      e.preventDefault();
      btnPause.click();
    } else if (e.key === 'm' || e.key === 'M') {
      if (!btnSound.disabled) btnSound.click();
    }
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (state === 'crawl' || state === 'title' || state === 'opening') layout(state === 'crawl');
    }, 150);
  }

  // ---- wiring ----------------------------------------------------------------------------------------------------
  btnExit.addEventListener('click', () => void close());
  btnReturn.addEventListener('click', () => void close());
  btnWork.addEventListener('click', (e) => {
    e.preventDefault();
    afterClose = () => document.querySelector('#work')?.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
    void close();
  });
  openers.forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      void open(el);
    }),
  );
  // a window that loses focus or is resized below the story while closed needs nothing: all listeners above are scoped to open
}
