export const site = {
  name: 'Sudeep Sigdel',
  title: 'Sudeep Sigdel — Backend Engineer',
  description:
    'Sudeep Sigdel is a backend engineer in Nepal building APIs, ML-backed systems and safety-first browser agents.',
  url: 'https://sudeepsigdel.com.np',
  email: 'sudeepsigdel123@gmail.com',
  github: 'https://github.com/SudeepSigdel',
  linkedin: 'https://www.linkedin.com/in/sudeepsigdel/',
  cv: '/Sudeep_Sigdel_CV.pdf',
};

/**
 * A generated figure from src/assets/projects/<key>.svg (see scripts/assets/). Real structure,
 * measured results or screenshots only: never mock-ups.
 */
export type ProjectFigure = {
  key: string;
  label: string;
  caption: string;
};

export type Project = {
  index: string;
  title: string;
  kicker: string;
  summary: string;
  detail?: string;
  stack: string[];
  href?: string;
  hrefLabel?: string;
  figures?: ProjectFigure[];
};

export const featured: Project[] = [
  {
    index: '01',
    title: 'RestaurantMS',
    kicker: 'Technest Innovation · internship · in production',
    summary:
      'Multi-tenant restaurant and lodge management: orders, kitchen, billing, reservations, payroll and reporting, mobile-first for waiters on the floor and desktop-first for managers.',
    detail:
      'A team product that I have worked on since joining as an intern in August. Permissions and tenant scoping are enforced on the server, and live updates are sent as invalidation signals over WebSockets so the client always re-reads from the API.',
    stack: ['Django', 'DRF', 'Channels', 'PostgreSQL', 'Redis', 'Next.js', 'Docker'],
    figures: [
      {
        key: 'restaurantms/architecture',
        label: 'Architecture',
        caption: 'Structure only, drawn from the repository’s own docs, settings and Compose files.',
      },
    ],
  },
  {
    index: '02',
    title: 'Janus',
    kicker: 'Safety-first browser agent · in development',
    summary:
      'A browser agent for Nepali, Hindi and bilingual portals. A local model proposes a typed plan; deterministic code validates and authorizes every step before anything touches the page.',
    detail:
      'Measured against an open baseline on fictional replica sites: 72 of 87 development runs against the baseline’s 40, and 24 of 36 on a held-out split for an earlier version. A security suite also finds it can be hijacked through pre-filled form fields, and that result is published alongside the good ones.',
    stack: ['Python', 'Playwright', 'Ollama', 'uv'],
    href: 'https://github.com/SudeepSigdel/Janus',
    hrefLabel: 'github.com/SudeepSigdel/Janus',
    figures: [
      {
        key: 'janus/architecture',
        label: 'Architecture',
        caption: 'The agent loop, from the Mermaid diagram in the repository’s docs, with module paths checked against the source.',
      },
      {
        key: 'janus/results-by-site',
        label: 'Results by site',
        caption: 'Development split v1 and the held-out split. Janus was tuned on the development split; the baseline was not.',
      },
      {
        key: 'janus/q5-injection',
        label: 'Security results',
        caption: 'Adaptive injection suite: attack success by category, including the 6 of 6 value-poisoning gap.',
      },
    ],
  },
  {
    index: '03',
    title: 'AegisWeb',
    kicker: 'In-browser AI agent · team project',
    summary:
      'A zero-trust browser agent that runs locally in Chrome. Page understanding and browser actions are separate pipelines; each proposed action is validated, re-checked against a fresh page snapshot and authorized before it runs.',
    detail:
      'Built with a team at a hackathon. My part: the local model adapter and the Qwen3-4B WebLLM setup, DOM snapshot extraction, the browser controller and the shared action contracts. Latency and adversarial benchmarks are planned, not done.',
    stack: ['TypeScript', 'React', 'WebLLM', 'Chrome MV3'],
    href: 'https://github.com/Codefest-chitwan-2026/Alpha-Intellects',
    hrefLabel: 'github.com/Codefest-chitwan-2026/Alpha-Intellects',
    figures: [
      {
        key: 'aegisweb/architecture',
        label: 'Architecture',
        caption: 'Drawn from the source tree. One exception to the authorization gate, the mail-composer path, is marked on the diagram.',
      },
    ],
  },
];

export const earlier: Project[] = [
  {
    index: '04',
    title: 'NEPSE Signal Desk',
    kicker: 'Final year project · live',
    summary:
      'A signal platform for the Nepal Stock Exchange: daily-scraped prices, XGBoost and Random Forest BUY and SELL classifiers evaluated with nine-fold walk-forward validation and a 20-day embargo, served through FastAPI to a React dashboard.',
    detail:
      'Since its first version it gained a paper-trading engine that applies NEPSE’s real fees and tax, an event-driven backtester with trading agents, and a price-data audit that repaired swapped dates and unadjusted corporate actions. Its own write-up is candid: mean out-of-sample AUC is about 0.53, and every model-driven strategy still trails buy-and-hold.',
    stack: ['FastAPI', 'XGBoost', 'scikit-learn', 'React', 'PostgreSQL', 'Redis', 'Docker'],
    href: 'https://fyp.sudeepsigdel.com.np',
    hrefLabel: 'fyp.sudeepsigdel.com.np',
  },
  {
    index: '05',
    title: 'CrisisCare',
    kicker: '36-hour hackathon',
    summary:
      'Backend for a real-time disaster relief coordination platform connecting citizens, volunteers and administrators. Built solo.',
    stack: ['FastAPI', 'PostgreSQL', 'WebSockets', 'JWT'],
    href: 'https://crisis-care-vxqw.vercel.app',
    hrefLabel: 'crisis-care-vxqw.vercel.app',
  },
  {
    index: '06',
    title: 'WebGuard',
    kicker: 'Security tool',
    summary:
      'Web vulnerability scanner that crawls a site and tests forms and URL parameters for SQL injection, reflected XSS and missing CSRF protection.',
    stack: ['FastAPI', 'SQLModel', 'PostgreSQL'],
  },
];

export const stack: { label: string; items: string[] }[] = [
  { label: 'Backend', items: ['FastAPI', 'Django / DRF', 'REST', 'WebSockets', 'JWT / OAuth2', 'RBAC'] },
  { label: 'Data', items: ['PostgreSQL', 'SQLAlchemy', 'Alembic', 'MySQL', 'Redis'] },
  { label: 'ML', items: ['XGBoost', 'scikit-learn', 'pandas', 'NumPy', 'SHAP'] },
  { label: 'Tooling', items: ['Docker', 'Git', 'Linux', 'Postman', 'GitHub Actions'] },
  { label: 'Languages', items: ['Python', 'TypeScript', 'C', 'C++', 'C#', 'Java'] },
];
