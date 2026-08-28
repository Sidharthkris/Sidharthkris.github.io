/**
 * Every fact here traces to the CV, the LinkedIn profile, or a public
 * repository. Nothing is inferred.
 *
 * Deliberately absent: location and spoken languages. Only verified,
 * publicly reachable links are listed — email, LinkedIn, GitHub, CV.
 */

export const profile = {
  name: 'Sidharth Vijayan Krishnan',
  short: 'Sidharth',
  role: 'Software Engineer',
  discipline: 'Java backend & full-stack',
  email: 'sidharthvk80@gmail.com',
  github: 'https://github.com/Sidharthkris',
  githubHandle: 'Sidharthkris',
  linkedin: 'https://www.linkedin.com/in/sidharth-vijayan-krishnan',
  linkedinHandle: 'sidharth-vijayan-krishnan',
  site: 'https://sidharthkris.github.io/',
  cv: '/Sidharth_Vijayan_Krishnan_CV.pdf',
} as const;

/** The thesis, split so the display type can breathe. */
export const statement = [
  'Some systems must',
  'never break a rule.',
  'Others are nothing',
  'but rules.',
] as const;

export const deck =
  'I build Java and Spring Boot services where correctness is enforced in one ' +
  'place and proven by tests — and I spent a master’s modelling what a few ' +
  'hundred agents do when rules are all they have.';

export const sections = [
  { id: 'work',        label: 'Work' },
  { id: 'practice',    label: 'Practice' },
  { id: 'trajectory',  label: 'Trajectory' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'contact',     label: 'Contact' },
] as const;

export type Track = 'deterministic' | 'emergent';

export interface Project {
  id: string;
  n: string;
  title: string;
  kind: string;
  year: string;
  track: Track;
  featured: boolean;
  summary: string;
  role?: string;
  problem?: string;
  approach?: string;
  outcome?: string;
  facts?: { k: string; v: string }[];
  stack: string[];
  links?: { label: string; href: string }[];
  note?: string;
}

export const projects: Project[] = [
  {
    id: 'timetable', n: '01',
    title: 'Course Timetable Planner',
    kind: 'REST API and two independent clients',
    year: '2025', track: 'deterministic', featured: true,
    role: 'Sole author — API, both clients, tests, CI',
    summary:
      'A Spring Boot scheduling service with two clients on top of it: a ' +
      'server-rendered Thymeleaf UI and a React 19 single-page app. The second ' +
      'client exists to make a point — the API is the reusable part, not any ' +
      'one interface built over it.',
    problem:
      'Nothing stopped two courses claiming the same room, or one instructor ' +
      'being booked twice. A timetable is only worth anything if it can refuse ' +
      'the entries that would break it.',
    approach:
      'An overlap check runs before any write and returns 409 naming the exact ' +
      'entries it clashed with. Role permissions sit on the service layer under ' +
      '@PreAuthorize, so the REST API and both UIs share one enforcement path ' +
      'rather than three copies of the same rule.',
    outcome:
      'Coordinators get full CRUD, instructors get a read-only week, and a ' +
      'blocked write returns a structured 403 to the API and a proper error ' +
      'page in the browser. There is no controller to route around.',
    facts: [
      { k: 'Clients', v: 'Two, one API' },
      { k: 'Enforcement', v: 'Five services' },
      { k: 'Tests', v: 'Unit to full-stack' },
      { k: 'Deploy', v: 'Docker + Postgres' },
    ],
    stack: ['Java 17', 'Spring Boot 3', 'Spring Security', 'Spring Data JPA', 'Thymeleaf',
            'React 19', 'TypeScript', 'Vite', 'PostgreSQL', 'Docker', 'OpenAPI', 'JUnit 5',
            'Vitest', 'GitHub Actions'],
    links: [
      { label: 'API and Thymeleaf client', href: 'https://github.com/Sidharthkris/course-timetable-planner' },
      { label: 'React client', href: 'https://github.com/Sidharthkris/course-timetable-planner-frontend' },
    ],
  },
  {
    id: 'evacuation', n: '02',
    title: 'Emergency Evacuation Simulation',
    kind: 'Master’s thesis',
    year: '2025', track: 'emergent', featured: true,
    role: 'Model design, simulation, data pipeline',
    summary:
      'How much does the shape of a lecture hall change the time it takes to ' +
      'empty one? A NetLogo model of a few hundred agents with different ' +
      'mobility, familiarity and panic responses, swept across five hall ' +
      'architectures with varying exit configurations and blockages.',
    problem:
      'Evacuation is decided by architecture, psychology and crowd flow at ' +
      'once, and you cannot run the experiment on real people. The behaviour ' +
      'that matters is the behaviour nobody designed — it emerges.',
    approach:
      'Heterogeneous agents, each with their own movement speed, familiarity ' +
      'with the room and threshold for panic. BehaviorSpace drove the parameter ' +
      'sweep; Python pipelines processed the output into egress times, flow ' +
      'rates and bottleneck positions.',
    outcome:
      'A repeatable way to compare hall layouts before anything is built, and a ' +
      'dataset showing where queues form under each exit configuration.',
    facts: [
      { k: 'Agents', v: '200+ concurrent' },
      { k: 'Architectures', v: 'Five halls' },
      { k: 'Runs', v: '9,000+ automated' },
      { k: 'Measured', v: 'Egress, flow, blockage' },
    ],
    stack: ['NetLogo', 'BehaviorSpace', 'Python', 'Pandas', 'NumPy', 'Matplotlib', 'Agent-based modelling'],
    links: [{ label: 'Repository', href: 'https://github.com/Sidharthkris/emergency-evacuation-simulation' }],
  },
  {
    id: 'mapc', n: '03',
    title: 'Cognitive Agents for the MAPC',
    kind: 'Master’s project, agent-oriented programming',
    year: '2024', track: 'emergent', featured: false,
    summary:
      'A team of autonomous BDI agents solving an exploration and coordination ' +
      'problem on a dynamic hex grid, written in GOAL with Java tooling. No ' +
      'central controller: agents distribute tasks between themselves, share ' +
      'spatial knowledge over a communication protocol to assemble a collective ' +
      'map, and reason about pathfinding under time pressure through ' +
      'logic-based action rules.',
    stack: ['GOAL', 'Java', 'BDI architecture', 'Multi-agent systems', 'Decentralised coordination'],
    note: 'Academic coursework — no public repository',
  },
  {
    id: 'quiz', n: '04',
    title: 'Quiz Assessment Engine',
    kind: 'Object-oriented design study',
    year: '2025', track: 'deterministic', featured: false,
    summary:
      'An event-driven assessment engine built so that authoring, scoring and ' +
      'progress tracking never learn about each other — four GoF patterns doing ' +
      'real work rather than illustrating themselves. A Swing client sits on ' +
      'top with a live countdown, randomised selection from a self-validating ' +
      'question bank and a session leaderboard.',
    facts: [
      { k: 'Patterns', v: 'Factory, Builder, Strategy, Observer' },
      { k: 'Bank', v: '120+ self-validating questions' },
      { k: 'Persistence', v: 'Polymorphic JSON, Jackson' },
    ],
    stack: ['Java 17', 'Swing', 'Jackson', 'JUnit 5', 'Mockito', 'Maven'],
    links: [{ label: 'Repository', href: 'https://github.com/Sidharthkris/quiz-assessment-engine' }],
  },
  {
    id: 'exam', n: '05',
    title: 'Exam Result Processor',
    kind: 'Batch reporting pipeline',
    year: '2025', track: 'deterministic', featured: false,
    summary:
      'A command-line pipeline that ingests batch examination datasets and ' +
      'turns them into something a department can actually read: statistical ' +
      'distributions and grade boundaries computed with the Stream API, then ' +
      'exported as multi-sheet Excel workbooks and formatted PDF summaries.',
    stack: ['Java 17', 'Stream API', 'OpenCSV', 'Apache POI', 'Apache PDFBox', 'JUnit 5'],
    links: [{ label: 'Repository', href: 'https://github.com/Sidharthkris/exam-result-processor' }],
  },
];

export const archive = [
  { title: 'Pathfinding Visualizer',
    desc: 'Graph traversal drawn step by step on a live grid, no dependencies',
    meta: 'JavaScript · Canvas',
    href: 'https://github.com/Sidharthkris/pathfinding-visualizer' },
  { title: 'Total Control',
    desc: 'Context-based access control for Android — runtime permissions driven by location, network and time',
    meta: 'B.Tech · Android · PHP' },
  { title: 'Freelance Bruit',
    desc: 'Publishing platform for freelance journalists with a role-based editorial workflow',
    meta: 'B.Tech · ASP.NET · SQL Server' },
];

export interface Entry {
  from: string; to: string; role: string; org: string;
  kind: 'work' | 'study';
  points?: string[];
}

export const trajectory: Entry[] = [
  { from: '2021', to: '2025', kind: 'study',
    role: 'M.Sc. Computer Science', org: 'Technische Universität Clausthal',
    points: [
      'Specialised in agent-based modelling and multi-agent systems, closing with a thesis on evacuation dynamics in university lecture halls.',
      'Built the Course Timetable Planner and the Java work above alongside the degree.',
    ] },
  { from: '2018', to: '2019', kind: 'work',
    role: 'Test Automation Engineer', org: 'Rogersoft Technologies',
    points: [
      'Automated 150+ test cases with Selenium and TestNG, cutting regression testing time by 40%.',
      'Reached 85% automated coverage of core iOS and Android flows using Appium.',
      'Wired the suites into Jenkins, GitLab CI and GitHub Actions, bringing developer feedback from days to under two hours.',
      'Load-tested 5,000+ concurrent users in JMeter and resolved the three bottlenecks it exposed.',
    ] },
  { from: '2015', to: '2018', kind: 'work',
    role: 'Software Developer & Academic Coordinator', org: 'Matrix Engineering',
    points: [
      'Engineered Java applications with Core Java, JDBC and MySQL across the full SDLC, automating grading, attendance and student records.',
      'Built the backend logic and database workflows behind result generation and performance tracking.',
      'Coordinated academic operations across five departments — scheduling, curriculum design and reporting.',
      'Mentored student projects and taught Core Java, OOP, data structures, algorithms, SQL and Servlets/JSP.',
    ] },
  { from: '2015', to: '2015', kind: 'work',
    role: 'Full-Stack Developer', org: 'Verbicio Labs',
    points: [
      'Built responsive UI components in HTML5, CSS3 and JavaScript, improving cross-browser compatibility and engagement by 15%.',
      'Designed and optimised the relational schema holding 10,000+ user records.',
      'Resolved 30+ backend and frontend defects ahead of a stable production release.',
    ] },
  { from: '2011', to: '2015', kind: 'study',
    role: 'B.Tech Computer Science and Engineering',
    org: 'Mar Baselios Institute of Technology and Science' },
];

export const instruments = [
  { k: 'Backend', note: 'Where most of the work happens',
    v: 'Java 17 · Spring Boot 3 · Spring Security · Spring Data JPA · REST APIs · Thymeleaf · Maven' },
  { k: 'Frontend', note: 'Enough to own a feature end to end',
    v: 'React · TypeScript · Vite · React Router · Angular · HTML5 · CSS3' },
  { k: 'Data', note: '',
    v: 'PostgreSQL · MySQL · Microsoft SQL Server · JDBC · SQL schema design' },
  { k: 'Verification', note: 'Written with the feature, not after it',
    v: 'JUnit 5 · Mockito · TestNG · Selenium WebDriver · Appium · Vitest · React Testing Library · JMeter' },
  { k: 'Delivery', note: '',
    v: 'Docker · GitHub Actions · Jenkins · GitLab CI · Git · Linux' },
  { k: 'Simulation', note: 'The research half of the M.Sc.',
    v: 'NetLogo · BehaviorSpace · GOAL · BDI architectures · Multi-agent systems' },
  { k: 'Analysis', note: '',
    v: 'Python · Pandas · NumPy · Matplotlib · Jupyter' },
  { k: 'Practice', note: '',
    v: 'Agile · Scrum · TDD · BDD · Code review · Technical writing and mentoring' },
];

/** Only verified, publicly reachable destinations. */
export const links = [
  { k: 'Email',    v: profile.email,          href: `mailto:${profile.email}`, go: '→' },
  { k: 'LinkedIn', v: profile.linkedinHandle, href: profile.linkedin,          go: '↗', ext: true },
  { k: 'GitHub',   v: profile.githubHandle,   href: profile.github,            go: '↗', ext: true },
  { k: 'CV',       v: 'Two pages, PDF',       href: profile.cv,                go: '↓', dl: true },
];
