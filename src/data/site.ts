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

export type Project = {
  index: string;
  title: string;
  kicker: string;
  summary: string;
  detail?: string;
  stack: string[];
  /** A small joke under the kicker. */
  quip?: string;
  href?: string;
  hrefLabel?: string;
};

export const featured: Project[] = [
  {
    index: '01',
    title: 'RestaurantMS',
    kicker: 'Technest Innovation · internship · in production',
    quip: 'Where “one more momo” becomes a row in a database.',
    summary:
      'Multi-tenant restaurant and lodge management: orders, kitchen, billing, reservations, payroll and reporting, mobile-first for waiters on the floor and desktop-first for managers.',
    detail:
      'A team product that I have worked on since joining as an intern in August. Permissions and tenant scoping are enforced on the server, and live updates are sent as invalidation signals over WebSockets so the client always re-reads from the API. A mobile client (Expo) was started in October.',
    stack: ['Django', 'DRF', 'Channels', 'PostgreSQL', 'Redis', 'Next.js', 'Docker'],
  },
  {
    index: '02',
    title: 'Janus',
    kicker: 'Safety-first browser agent · in development',
    quip: 'A browser agent with trust issues, on purpose.',
    summary:
      'A browser agent for Nepali, Hindi and English portals. A local model proposes a typed plan; deterministic code validates and authorizes every step before anything touches the page, and risky steps wait for your approval.',
    detail:
      'On fictional replica portals it completes 114 of 141 development runs and 33 of 45 on a held-out split. On the older split it did 72 of 87 against a baseline’s 40, in about 13 seconds a task instead of about five minutes. Against 72 planted-instruction scenarios from WASP, no attack worked. It is weak where a task needs reading the page to decide (36 of 125 on MiniWoB++, 4 of 49 on WebGames), and a poisoned pre-filled field is a known gap, published alongside the good results.',
    stack: ['Python', 'Playwright', 'Ollama', 'uv'],
    href: 'https://github.com/SudeepSigdel/Janus',
    hrefLabel: 'github.com/SudeepSigdel/Janus',
  },
  {
    index: '03',
    title: 'AegisWeb',
    kicker: 'In-browser AI agent · Codefest Chitwan 2026 · team project',
    quip: 'Its model has no authority. Relatable.',
    summary:
      'A zero-trust browser agent that runs locally in Chrome. Page understanding and browser actions are separate pipelines; each proposed action is validated, re-checked against a fresh page snapshot and authorized before it runs.',
    detail:
      'Built with a team at a hackathon. My part: the local model adapter and the Qwen3-4B WebLLM setup, DOM snapshot extraction, the browser controller and the shared action contracts. Latency and adversarial benchmarks are planned, not done.',
    stack: ['TypeScript', 'React', 'WebLLM', 'Chrome MV3'],
    href: 'https://github.com/Codefest-chitwan-2026/Alpha-Intellects',
    hrefLabel: 'github.com/Codefest-chitwan-2026/Alpha-Intellects',
  },
];

export const earlier: Project[] = [
  {
    index: '04',
    title: 'NEPSE Signal Desk',
    kicker: 'Final year project · live',
    quip: 'Predicts the market about as well as I once predicted load-shedding.',
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
    kicker: '36-hour hackathon · CSITAN 2024 · revived',
    quip: '36 hours, one backend, and a sleep schedule best not discussed.',
    summary:
      'Backend for a disaster relief platform that matches people who need help with nearby donated resources. Requests and offers carry locations, the nearest available match is chosen by distance, and volunteers confirm by email. Built solo in 36 hours at the CSITAN hackathon.',
    detail:
      'Revisited after the hackathon: the README notes that some hackathon-era modules were deprecated, so they were removed and errors fixed, including duplicate emails and user roles.',
    stack: ['FastAPI', 'SQLModel', 'PostgreSQL', 'JWT', 'Mailjet'],
    href: 'https://crisis-care-vxqw.vercel.app',
    hrefLabel: 'crisis-care-vxqw.vercel.app',
  },
  {
    index: '06',
    title: 'WebGuard',
    kicker: 'Security tool',
    quip: 'Politely breaks into your website so nobody impolite does.',
    summary:
      'A beginner-friendly web vulnerability scanner. It crawls a site, tests forms and URL parameters for SQL injection and reflected XSS, and flags POST forms that carry no CSRF token. It can log in first, to scan apps like DVWA, and stops a scan after 180 seconds with partial results.',
    stack: ['FastAPI', 'SQLModel', 'PostgreSQL'],
  },
  {
    index: '07',
    title: 'HumanSign',
    kicker: 'Hult Prize · early 2026 · team project',
    quip: 'Proof a human typed this. Typos included.',
    summary:
      'A Chrome extension that records how you type while you write, then seals the document with a signed proof. A FastAPI decoder checks the signature, confirms the document has not changed since it was sealed, and scores whether the typing rhythm looks human.',
    stack: ['Python', 'FastAPI', 'Chrome MV3', 'JWS signatures'],
    href: 'https://github.com/b0sc/humanSign',
    hrefLabel: 'github.com/b0sc/humanSign',
  },
];

export const stack: { label: string; items: string[] }[] = [
  { label: 'Backend', items: ['FastAPI', 'Django / DRF', 'REST', 'WebSockets', 'JWT / OAuth2', 'RBAC'] },
  { label: 'Data', items: ['PostgreSQL', 'SQLAlchemy', 'Alembic', 'MySQL', 'Redis'] },
  { label: 'ML', items: ['XGBoost', 'scikit-learn', 'pandas', 'NumPy', 'SHAP'] },
  { label: 'Tooling', items: ['Docker', 'Git', 'Linux', 'Postman', 'GitHub Actions'] },
  { label: 'Languages', items: ['Python', 'TypeScript', 'C', 'C++', 'C#', 'Java'] },
];
