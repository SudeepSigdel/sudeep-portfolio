/**
 * "Field notes": each project explained as a short trail of stops, in plain language. Facts were re-checked against the
 * projects' own repositories and docs (the commit is named in `checked`). Keep every trail to five stops or fewer.
 */
export type Icon =
  | 'seed' | 'flame' | 'basket' | 'sun' | 'eye' | 'wind' | 'gate' | 'lantern' | 'footprint'
  | 'compass' | 'letter' | 'drop' | 'web' | 'leaf' | 'fence' | 'roots' | 'mountain' | 'feather';

/** stone: does the work · gate: a fixed check that only ever says yes or no · wind: the model's idea, never trusted */
export type StopKind = 'stone' | 'gate' | 'wind';

export type Stop = { title: string; text: string; icon: Icon; kind?: StopKind };
export type Lane = { label?: string; note?: string; stops: Stop[] };
export type Aside = { icon: Icon; label: string; text: string };
export type BarRow = { label: string; k: number; n: number; tone?: 'main' | 'base' | 'dim' };

export type FieldNotes = {
  title: string;
  lede: string;
  lanes: Lane[];
  asides?: Aside[];
  /** a short results panel, shown as growing stems */
  numbers?: { title: string; groups: { label: string; rows: BarRow[] }[]; caveats: string[] };
  /** a single honest number on a coin-flip scale */
  gauge?: { value: number; label: string; text: string };
  checked: string;
};

export const notes: Record<string, FieldNotes> = {
  RestaurantMS: {
    title: 'From order to bill',
    lede: 'One order, followed from the waiter’s phone to the bill.',
    lanes: [
      {
        stops: [
          { title: 'Take the order', text: 'A waiter adds it on a phone, right at the table.', icon: 'seed' },
          { title: 'Send to the kitchen', text: 'The kitchen screen lights up the moment it is sent.', icon: 'flame' },
          { title: 'Close the bill', text: 'Numbered bills with VAT and PAN, ready to print.', icon: 'basket' },
          { title: 'See the day', text: 'Sales, expenses and stock roll up into reports and exports.', icon: 'sun' },
        ],
      },
    ],
    asides: [
      { icon: 'fence', label: 'Every restaurant is its own field', text: 'Permissions and tenant scoping are enforced on the server, never left to the screen.' },
      { icon: 'roots', label: 'Live, but never trusted', text: 'Live updates only say “something changed”. Screens then re-read the truth from the API.' },
    ],
    checked: 'RestaurantMS · commit d035057 · 15 Oct 2026',
  },

  Janus: {
    title: 'How a step gets through the gate',
    lede: 'The model suggests. Fixed rules decide. Nothing the web page says can change the plan.',
    lanes: [
      {
        stops: [
          { title: 'Look', text: 'The page becomes an outline of buttons and fields. Its body text is kept away from the model.', icon: 'eye' },
          { title: 'Propose', text: 'A local model drafts a typed plan, one step at a time.', icon: 'wind', kind: 'wind' },
          { title: 'Check', text: 'Fixed rules allow or refuse each step: right place, right field, right value.', icon: 'gate', kind: 'gate' },
          { title: 'Ask', text: 'Anything consequential, like submit or pay, waits for your yes.', icon: 'lantern', kind: 'gate' },
          { title: 'Act and verify', text: 'It re-finds the target, blocks sites off the list, then checks the result.', icon: 'footprint' },
        ],
      },
    ],
    asides: [
      { icon: 'mountain', label: 'Built for Nepali portals', text: 'Nepali, Hindi and English pages. Bikram Sambat dates are converted by code, not by the model.' },
    ],
    numbers: {
      title: 'How it did',
      groups: [
        {
          label: 'On its own replica portals',
          rows: [
            { label: 'Development tasks', k: 114, n: 141 },
            { label: 'Held-out test tasks', k: 33, n: 45 },
          ],
        },
        {
          label: 'Against another agent (older split, same local model)',
          rows: [
            { label: 'browser_use', k: 40, n: 87, tone: 'base' },
            { label: 'Janus', k: 72, n: 87 },
          ],
        },
        {
          label: 'Planted instructions (72 scenarios)',
          rows: [
            { label: 'Attacks stopped', k: 72, n: 72 },
            { label: 'Tasks still done', k: 70, n: 72 },
          ],
        },
        {
          label: 'Benchmarks it was never tuned on',
          rows: [
            { label: 'MiniWoB++', k: 36, n: 125, tone: 'dim' },
            { label: 'WebGames', k: 4, n: 49, tone: 'dim' },
            { label: 'WebArena-Verified, hard', k: 4, n: 42, tone: 'dim' },
          ],
        },
      ],
      caveats: [
        'The model never reads page text, so injected instructions cannot steer it. The same choice puts tasks that need reading to decide mostly out of reach.',
        'A value the page pre-fills in a field Janus never touches can still poison a submit: 6 of 6 hijacked in the adaptive suite. It is a known gap.',
        'The portals are fictional, and no real users have tried it yet. It was tuned on the development splits; the test split was used only at checkpoints.',
      ],
    },
    checked: 'Janus · commit 9ef30d2 · 18 Oct 2026',
  },

  AegisWeb: {
    title: 'Two paths, one gate',
    lede: 'A plain-rules router decides whether to read the page, act on it, or both. Reading never gets to act.',
    lanes: [
      {
        label: 'Reading the page',
        note: 'Can read, search and highlight. Cannot click.',
        stops: [
          { title: 'Snapshot', text: 'The page’s text, cut into blocks that each get an id.', icon: 'eye' },
          { title: 'Find evidence', text: 'Searches by keyword or meaning, and falls back to keywords.', icon: 'compass' },
          { title: 'Answer', text: 'A local model summarises or answers. Its output is checked, and the sources light up.', icon: 'wind', kind: 'wind' },
        ],
      },
      {
        label: 'Acting on the page',
        note: 'Can click and type, but only through the gate.',
        stops: [
          { title: 'See the controls', text: 'Buttons and fields get ids. This is the only place a target can come from.', icon: 'eye' },
          { title: 'Propose', text: 'A local model suggests one action.', icon: 'wind', kind: 'wind' },
          { title: 'Check', text: 'A strict shape, and the page must not have changed since it was seen.', icon: 'gate', kind: 'gate' },
          { title: 'Authorize', text: 'Policy read from the page decides. No model involved.', icon: 'gate', kind: 'gate' },
          { title: 'Do it', text: 'Click, type, select, scroll or navigate. Then look again.', icon: 'footprint' },
        ],
      },
    ],
    asides: [
      { icon: 'fence', label: 'Understanding has no authority', text: 'Ids from reading can never become targets for acting.' },
      { icon: 'roots', label: 'All on your machine', text: 'It runs inside Chrome with a small local model, so nothing leaves the browser.' },
      { icon: 'lantern', label: 'One honest exception', text: 'The email composer path skips the authorization gate. It is marked rather than hidden.' },
    ],
    checked: 'Alpha-Intellects · commit a5d580a · 16 Aug 2026',
  },

  'NEPSE Signal Desk': {
    title: 'From prices to a signal',
    lede: 'Prices go in, a BUY or SELL signal comes out, and every step is tested before it is trusted.',
    lanes: [
      {
        stops: [
          { title: 'Collect', text: 'Prices from the Nepal Stock Exchange, scraped daily.', icon: 'seed' },
          { title: 'Clean', text: 'An audit repaired swapped dates and unadjusted corporate actions.', icon: 'gate', kind: 'gate' },
          { title: 'Learn', text: 'XGBoost and Random Forest classifiers learn BUY and SELL.', icon: 'leaf' },
          { title: 'Test honestly', text: 'Nine walk-forward folds with a 20-day gap, then a backtest using real NEPSE fees and tax.', icon: 'gate', kind: 'gate' },
          { title: 'Show', text: 'A FastAPI service feeds a React dashboard.', icon: 'sun' },
        ],
      },
    ],
    gauge: {
      value: 0.53,
      label: 'Mean out-of-sample AUC ≈ 0.53',
      text: 'Barely better than a coin flip, and every model-driven strategy still trails buy-and-hold. The project’s own write-up says so.',
    },
    checked: 'From the project’s own write-up. Its repository is not in this workspace, so it was not re-checked this time.',
  },

  CrisisCare: {
    title: 'From a cry for help to a volunteer',
    lede: 'A request, an offer, and the nearest match, confirmed by a volunteer.',
    lanes: [
      {
        stops: [
          { title: 'Ask', text: 'Someone posts a request: food, medical or shelter, with a location.', icon: 'lantern' },
          { title: 'Offer', text: 'Donors list what they have: water, clothes or food.', icon: 'basket' },
          { title: 'Match', text: 'The nearest available offer within a radius is chosen.', icon: 'compass' },
          { title: 'Notify', text: 'A volunteer gets an email with a confirmation link.', icon: 'letter' },
          { title: 'Confirm', text: 'They confirm, and the person who asked is told help is coming.', icon: 'footprint' },
        ],
      },
    ],
    asides: [{ icon: 'fence', label: 'Three roles', text: 'People, volunteers and admins sign in with JWT, and the role decides what each can do.' }],
    checked: 'crisis-care · commit f70b62b · 31 Dec 2025',
  },

  HumanSign: {
    title: 'From a keystroke to a proof',
    lede: 'Write as usual. The proof shows a person was at the keyboard.',
    lanes: [
      {
        stops: [
          { title: 'Write', text: 'The extension notes the rhythm of your typing while you work.', icon: 'feather' },
          { title: 'Seal', text: 'It signs a proof file tied to a fingerprint of the finished document.', icon: 'seed' },
          { title: 'Check the seal', text: 'The decoder verifies the signature and that the document is unchanged since sealing.', icon: 'gate', kind: 'gate' },
          { title: 'Read the rhythm', text: 'Timing statistics and a model score whether the typing looks human.', icon: 'wind', kind: 'wind' },
        ],
      },
    ],
    asides: [{ icon: 'fence', label: 'Edit it afterwards and it fails', text: 'A document changed after sealing is rejected: “Document was modified after sealing”.' }],
    checked: 'HumanSign · commit 22af2e8 · 30 Jan 2026',
  },

  WebGuard: {
    title: 'Crawl, probe, report',
    lede: 'It maps a site, tries the doors, and writes down which ones opened.',
    lanes: [
      {
        stops: [
          { title: 'Sign in', text: 'Optional. For apps behind a login, like DVWA, it logs in first and keeps the session.', icon: 'leaf' },
          { title: 'Crawl', text: 'Follows links on the same site, collecting pages, forms and fields.', icon: 'web' },
          { title: 'Probe', text: 'Tries SQL injection and reflected XSS on fields and URL parameters, and flags POST forms with no CSRF token.', icon: 'drop' },
          { title: 'Report', text: 'Findings are saved, with plain-English explanations and fixes.', icon: 'basket' },
        ],
      },
    ],
    asides: [
      { icon: 'seed', label: 'Built to be read', text: 'Simple on purpose, an educational scanner rather than an enterprise one.' },
      { icon: 'sun', label: 'Time-boxed', text: 'A scan stops after 180 seconds and returns what it found so far.' },
    ],
    checked: 'Webguard · commit 198aae8 · 24 May 2026',
  },
};
