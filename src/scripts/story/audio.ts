export type AudioConfig = { src: string; volume: number; fadeInSeconds: number; fadeOutSeconds: number; credit?: string };

/** none: no track configured · off: muted · on: playing · error: the track could not be loaded */
export type SoundState = 'none' | 'off' | 'on' | 'error';

const KEY = 'story:sound';

const read = () => {
  try {
    return sessionStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
};
const save = (on: boolean) => {
  try {
    sessionStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* private mode: the preference just does not persist */
  }
};

/**
 * The soundtrack. It never starts by itself: only `turnOn` (the sound button, or a re-entry after the visitor had already
 * chosen sound this session) plays anything. Muting is immediate; fades are used for starting and for leaving.
 * The audio element exists only while the story is open.
 */
export function createSoundtrack(cfg: AudioConfig, onChange: (state: SoundState, message?: string) => void) {
  let el: HTMLAudioElement | null = null;
  let state: SoundState = cfg.src ? 'off' : 'none';
  let ramp = 0;
  let seq = 0;

  const set = (s: SoundState, message?: string) => {
    state = s;
    onChange(s, message);
  };

  function fadeTo(target: number, seconds: number) {
    cancelAnimationFrame(ramp);
    const a = el;
    if (!a) return Promise.resolve();
    const from = a.volume;
    const t0 = performance.now();
    return new Promise<void>((resolve) => {
      const step = (now: number) => {
        const k = seconds <= 0 ? 1 : Math.min((now - t0) / (seconds * 1000), 1);
        a.volume = Math.min(Math.max(from + (target - from) * k, 0), 1);
        if (k < 1) ramp = requestAnimationFrame(step);
        else resolve();
      };
      ramp = requestAnimationFrame(step);
    });
  }

  function release() {
    cancelAnimationFrame(ramp);
    if (!el) return;
    el.pause();
    el.removeAttribute('src');
    el.load();
    el = null;
  }

  async function turnOn() {
    if (!cfg.src || state === 'error') return;
    const mine = ++seq;
    try {
      if (!el) {
        const a = new Audio();
        a.loop = true;
        a.preload = 'auto';
        a.volume = 0;
        a.addEventListener('error', () => {
          if (el !== a) return;
          release();
          set('error', 'The soundtrack could not be loaded. Continuing in silence.');
        });
        a.src = cfg.src;
        el = a;
      }
      el.muted = false;
      await el.play();
      if (mine !== seq) return; // muted again while it was starting
      set('on');
      save(true);
      void fadeTo(cfg.volume, cfg.fadeInSeconds);
    } catch (e) {
      if (mine !== seq) return;
      const blocked = e instanceof DOMException && e.name === 'NotAllowedError';
      if (blocked) {
        release();
        set('off', 'The browser blocked the sound. Press Sound to try again.');
      } else {
        release();
        set('error', 'The soundtrack could not be played. Continuing in silence.');
      }
    }
  }

  /** Immediate: the volume drops to nothing in this frame and the track pauses. */
  function turnOff() {
    seq++;
    cancelAnimationFrame(ramp);
    if (el) {
      el.volume = 0;
      el.muted = true;
      el.pause();
    }
    if (state !== 'none' && state !== 'error') set('off');
    save(false);
  }

  return {
    get state() {
      return state;
    },
    toggle() {
      if (state === 'on') turnOff();
      else void turnOn();
    },
    /** Entering the story: only resumes sound the visitor already asked for this session. */
    enter() {
      if (cfg.src && state !== 'error' && read()) void turnOn();
      else onChange(state);
    },
    /** Leaving: fade out, then let go of the audio element. The preference is kept. */
    async leave() {
      seq++;
      if (el && state === 'on') await fadeTo(0, cfg.fadeOutSeconds);
      release();
      if (state === 'on') state = 'off'; // the element is gone; entering again restores it from the saved preference
    },
  };
}
