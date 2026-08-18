export interface TemplateNode {
  text: string;
  desc?: string;
  icon?: string;
  color: string;
  x: number;
  y: number;
  subs?: Array<{
    text: string;
    desc?: string;
    subs?: string[];
  }>;
}

export interface StarterTemplate {
  id: string;
  name: string;
  category: "Architecture & AI" | "Product & Engineering" | "Strategy & Planning" | "Design & UX";
  badge: string;
  description: string;
  nodeCount: number;
  color: string;
  accentHex: string;
  previewTree: {
    root: string;
    branches: Array<{ name: string; color: string; subtopics: string[] }>;
  };
  rootNode: {
    text: string;
    desc: string;
    icon: string;
    color: string;
  };
  branches: TemplateNode[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    category: "Strategy & Planning",
    badge: "Minimal",
    description: "A clean, distraction-free central idea to build out custom thoughts freely.",
    nodeCount: 1,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    accentHex: "#0084ff",
    previewTree: {
      root: "Central Idea",
      branches: [],
    },
    rootNode: {
      text: "Central Idea",
      desc: "Start exploring your core concept",
      icon: "💡",
      color: "#0084ff",
    },
    branches: [],
  },
  {
    id: "system-architecture",
    name: "Distributed Cloud Architecture",
    category: "Architecture & AI",
    badge: "High-Tech",
    description: "Full-stack cloud topology: Edge caching, API gateway, microservices, and persistence.",
    nodeCount: 17,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",
    accentHex: "#06b6d4",
    previewTree: {
      root: "Cloud Platform",
      branches: [
        { name: "Edge & Clients", color: "#06b6d4", subtopics: ["Next.js SSR", "Mobile SDKs", "CDN Edge Cache"] },
        { name: "API Gateway", color: "#6366f1", subtopics: ["JWT Verification", "Rate Limiter", "GraphQL Mesh"] },
        { name: "Core Services", color: "#9333ea", subtopics: ["Auth Engine", "Billing & Subscriptions", "Async Event Bus"] },
        { name: "Data Tier", color: "#10b981", subtopics: ["PostgreSQL Cluster", "Redis L2 Cache", "S3 Storage"] },
      ],
    },
    rootNode: {
      text: "Cloud Platform Architecture",
      desc: "Scalable distributed microservices system topology",
      icon: "⚡",
      color: "#06b6d4",
    },
    branches: [
      {
        text: "Edge & Client Tier",
        desc: "Front-end layer and CDN edge nodes",
        icon: "🌐",
        color: "#06b6d4",
        x: 320,
        y: -110,
        subs: [
          { text: "Next.js 15 SSR App" },
          { text: "Mobile & Desktop SDKs" },
          { text: "Cloudflare Edge Caching" },
        ],
      },
      {
        text: "API Gateway & Security",
        desc: "Request routing and policy enforcement",
        icon: "🛡️",
        color: "#6366f1",
        x: 320,
        y: 110,
        subs: [
          { text: "JWT & OAuth2 Tokens" },
          { text: "Dynamic Rate Limiting" },
          { text: "Federated GraphQL Mesh" },
        ],
      },
      {
        text: "Core Microservices",
        desc: "Decoupled backend business logic",
        icon: "⚙️",
        color: "#9333ea",
        x: -320,
        y: -110,
        subs: [
          { text: "Authentication Engine" },
          { text: "Billing & Invoicing" },
          { text: "Kafka Async Event Bus" },
        ],
      },
      {
        text: "Persistence & Data Tier",
        desc: "Primary databases and distributed caching",
        icon: "🗄️",
        color: "#10b981",
        x: -320,
        y: 110,
        subs: [
          { text: "PostgreSQL Primary Cluster" },
          { text: "Redis In-Memory Cache" },
          { text: "S3 Compatible Object Store" },
        ],
      },
    ],
  },
  {
    id: "ai-pipeline",
    name: "AI & LLM Agent Infrastructure",
    category: "Architecture & AI",
    badge: "AI & Data",
    description: "Production LLM pipeline: ETL ingestion, hybrid vector retrieval, agent tool execution, and telemetry.",
    nodeCount: 16,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
    accentHex: "#a855f7",
    previewTree: {
      root: "LLM Agent System",
      branches: [
        { name: "ETL & Ingestion", color: "#a855f7", subtopics: ["Docling Parsers", "Context Chunking", "Embedding Engine"] },
        { name: "Knowledge Store", color: "#ec4899", subtopics: ["Hybrid Vector DB", "Reranker Model", "Metadata Filters"] },
        { name: "Agentic Loop", color: "#0084ff", subtopics: ["Planner / ReAct", "Tool Call Registry", "Short/Long Memory"] },
        { name: "Eval & Telemetry", color: "#f59e0b", subtopics: ["Token Cost Alerts", "Latency Tracing", "Safety Guardrails"] },
      ],
    },
    rootNode: {
      text: "LLM Agent System Architecture",
      desc: "Enterprise autonomous agent & retrieval pipeline",
      icon: "🧠",
      color: "#a855f7",
    },
    branches: [
      {
        text: "ETL & Ingestion Pipeline",
        desc: "Document parsing and vectorization",
        icon: "📥",
        color: "#a855f7",
        x: 320,
        y: -110,
        subs: [
          { text: "Unstructured Document Parsers" },
          { text: "Semantic Context Chunking" },
          { text: "Vector Embedding Generation" },
        ],
      },
      {
        text: "Knowledge Store & RAG",
        desc: "Hybrid retrieval and reranking engine",
        icon: "🔍",
        color: "#ec4899",
        x: 320,
        y: 110,
        subs: [
          { text: "Hybrid Vector + BM25 Index" },
          { text: "Cross-Encoder Reranker" },
          { text: "Metadata & Multi-Tenant Isolation" },
        ],
      },
      {
        text: "Agentic Orchestrator",
        desc: "Tool execution and multi-step planning",
        icon: "🤖",
        color: "#0084ff",
        x: -320,
        y: -110,
        subs: [
          { text: "ReAct Task Planner" },
          { text: "External Tool Call Registry" },
          { text: "Session & Working Memory" },
        ],
      },
      {
        text: "Observability & Guardrails",
        desc: "Performance, safety, and evaluation metrics",
        icon: "📊",
        color: "#f59e0b",
        x: -320,
        y: 110,
        subs: [
          { text: "Token Cost & Quota Tracking" },
          { text: "OpenTelemetry Trace Spans" },
          { text: "Output Safety Guardrails" },
        ],
      },
    ],
  },
  {
    id: "engineering-roadmap",
    name: "Engineering Sprint & Tech Spec",
    category: "Product & Engineering",
    badge: "Roadmap",
    description: "Phased engineering execution plan: Foundation, Real-Time Sync, Security, and Polish.",
    nodeCount: 16,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    accentHex: "#10b981",
    previewTree: {
      root: "Q3 Tech Roadmap",
      branches: [
        { name: "Sprint 1: Core Infra", color: "#10b981", subtopics: ["Prisma DB Migration", "CI/CD Pipeline", "Docker Staging"] },
        { name: "Sprint 2: Sync Engine", color: "#06b6d4", subtopics: ["WebSocket Hub", "CRDT State Sync", "Offline Persistence"] },
        { name: "Sprint 3: Enterprise", color: "#6366f1", subtopics: ["SAML SSO Provider", "Role-based ACL", "Audit Log Stream"] },
        { name: "Sprint 4: Performance", color: "#f59e0b", subtopics: ["LCP < 800ms", "Zero-Lag Panning", "Bundle Code Splitting"] },
      ],
    },
    rootNode: {
      text: "Q3 Engineering Roadmap",
      desc: "Technical delivery milestones & sprint tracks",
      icon: "🎯",
      color: "#10b981",
    },
    branches: [
      {
        text: "Sprint 1: Core Infrastructure",
        desc: "Database foundations and build pipelines",
        icon: "🧱",
        color: "#10b981",
        x: 320,
        y: -110,
        subs: [
          { text: "Zero-Downtime DB Migrations" },
          { text: "Automated Testing Pipeline" },
          { text: "Preview Deploy Environments" },
        ],
      },
      {
        text: "Sprint 2: Realtime Engine",
        desc: "State replication and conflict-free sync",
        icon: "⚡",
        color: "#06b6d4",
        x: 320,
        y: 110,
        subs: [
          { text: "WebSocket Presence Hub" },
          { text: "CRDT State Synchronization" },
          { text: "IndexedDB Local Cache" },
        ],
      },
      {
        text: "Sprint 3: Enterprise Security",
        desc: "Compliance, authentication, and audit logs",
        icon: "🔒",
        color: "#6366f1",
        x: -320,
        y: -110,
        subs: [
          { text: "SAML 2.0 / Okta SSO" },
          { text: "Granular Role-Based Permissions" },
          { text: "Immutable Audit Log Stream" },
        ],
      },
      {
        text: "Sprint 4: Performance Polish",
        desc: "Canvas frame rate and load time optimization",
        icon: "🚀",
        color: "#f59e0b",
        x: -320,
        y: 110,
        subs: [
          { text: "60 FPS Canvas Render Loop" },
          { text: "Sub-second Cold Start LCP" },
          { text: "Dynamic Code Tree-Shaking" },
        ],
      },
    ],
  },
  {
    id: "product-growth",
    name: "Product-Led Growth & GTM Strategy",
    category: "Product & Engineering",
    badge: "Strategy",
    description: "Growth loops: Self-serve onboarding, developer demand gen, enterprise security, and retention.",
    nodeCount: 16,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    accentHex: "#f59e0b",
    previewTree: {
      root: "Growth Strategy",
      branches: [
        { name: "Self-Serve PLG", color: "#f59e0b", subtopics: ["1-Click Workspace", "Interactive Demo", "Team Viral Invites"] },
        { name: "Inbound Demand", color: "#ec4899", subtopics: ["Technical SEO Hub", "API Documentation", "Community Showcase"] },
        { name: "Enterprise Sales", color: "#0084ff", subtopics: ["SOC2 Compliance", "Custom SLA Plans", "Dedicated CSM"] },
        { name: "Retention & Health", color: "#10b981", subtopics: ["WAU/MAU Metrics", "NPS Surveys", "Churn Early Warning"] },
      ],
    },
    rootNode: {
      text: "Product-Led Growth & GTM Strategy",
      desc: "Full-funnel customer acquisition, expansion, and retention",
      icon: "📈",
      color: "#f59e0b",
    },
    branches: [
      {
        text: "Self-Serve PLG Funnel",
        desc: "Frictionless time-to-value onboarding",
        icon: "🚀",
        color: "#f59e0b",
        x: 320,
        y: -110,
        subs: [
          { text: "Instant 1-Click Workspace Setup" },
          { text: "Interactive Template Playground" },
          { text: "Team Invite Viral Loops" },
        ],
      },
      {
        text: "Inbound & Developer Demand",
        desc: "Content marketing and open developer docs",
        icon: "📣",
        color: "#ec4899",
        x: 320,
        y: 110,
        subs: [
          { text: "Deep Technical Guides & SEO" },
          { text: "Comprehensive REST API Docs" },
          { text: "Community Template Showcase" },
        ],
      },
      {
        text: "Enterprise Expansion",
        desc: "High-contract enterprise closing requirements",
        icon: "💼",
        color: "#0084ff",
        x: -320,
        y: -110,
        subs: [
          { text: "SOC2 Type II & GDPR Ready" },
          { text: "Guaranteed 99.99% SLA" },
          { text: "Dedicated Solutions Architect" },
        ],
      },
      {
        text: "Retention & Product Health",
        desc: "Engagement signals and customer advocacy",
        icon: "❤️",
        color: "#10b981",
        x: -320,
        y: 110,
        subs: [
          { text: "Weekly Active User Benchmarks" },
          { text: "In-App CSAT & NPS Feedback" },
          { text: "Automated Churn Risk Triggers" },
        ],
      },
    ],
  },
  {
    id: "consultation-process",
    name: "Consultation & Discovery Process",
    category: "Strategy & Planning",
    badge: "Process",
    description: "Structured client transformation: Current State Audit, Gap Analysis, Target Architecture, and Rollout.",
    nodeCount: 16,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    accentHex: "#0084ff",
    previewTree: {
      root: "Client Consultation",
      branches: [
        { name: "Current State", color: "#0084ff", subtopics: ["Legacy Infrastructure", "Process Bottlenecks", "TCO Cost Breakdown"] },
        { name: "Desired Outcomes", color: "#10b981", subtopics: ["5x Throughput Scale", "40% OpEx Reduction", "99.99% Service Uptime"] },
        { name: "Target Design", color: "#9333ea", subtopics: ["Event-Driven Cloud", "Automated Testing", "Zero-Trust IAM"] },
        { name: "Execution Plan", color: "#f59e0b", subtopics: ["Proof-of-Concept", "Pilot Group Rollout", "Global Migration"] },
      ],
    },
    rootNode: {
      text: "Enterprise Client Consultation",
      desc: "Comprehensive digital transformation discovery and execution framework",
      icon: "🤝",
      color: "#0084ff",
    },
    branches: [
      {
        text: "Current State Audit",
        desc: "Baseline technical and operational assessment",
        icon: "📋",
        color: "#0084ff",
        x: 320,
        y: -110,
        subs: [
          { text: "Legacy Infrastructure Inventory" },
          { text: "Workflow Bottlenecks & Friction" },
          { text: "Total Cost of Ownership (TCO)" },
        ],
      },
      {
        text: "Desired Outcomes & KPIs",
        desc: "Target metrics and success criteria",
        icon: "🏆",
        color: "#10b981",
        x: 320,
        y: 110,
        subs: [
          { text: "5x Processing Throughput" },
          { text: "40% Operational Cost Reduction" },
          { text: "99.99% Production Uptime" },
        ],
      },
      {
        text: "Target Architecture",
        desc: "Modernized technical blueprint",
        icon: "📐",
        color: "#9333ea",
        x: -320,
        y: -110,
        subs: [
          { text: "Event-Driven Cloud Services" },
          { text: "Automated CI/CD Delivery" },
          { text: "Zero-Trust Security & IAM" },
        ],
      },
      {
        text: "Phased Execution Plan",
        desc: "Milestone rollout strategy with risk mitigations",
        icon: "🗓️",
        color: "#f59e0b",
        x: -320,
        y: 110,
        subs: [
          { text: "Proof of Concept Validation" },
          { text: "Pilot Team Migration" },
          { text: "Full Production Cutover" },
        ],
      },
    ],
  },
  {
    id: "design-system",
    name: "Design System & UX Spec",
    category: "Design & UX",
    badge: "Design",
    description: "Design tokens, accessible primitives, canvas interaction patterns, and WCAG compliance.",
    nodeCount: 16,
    color: "text-pink-500 bg-pink-500/10 border-pink-500/30",
    accentHex: "#ec4899",
    previewTree: {
      root: "Design System 3.0",
      branches: [
        { name: "Tokens & Basics", color: "#ec4899", subtopics: ["Color Swatches (HSL)", "Font Pairings (Inter/Outfit)", "4pt Spacing Scale"] },
        { name: "Core Primitives", color: "#6366f1", subtopics: ["Buttons & Toolbars", "Dialogs & Modals", "Dropdown Menus"] },
        { name: "Canvas UI Patterns", color: "#06b6d4", subtopics: ["Infinite Panning", "Resize Pointer Handles", "Radial Branch Curves"] },
        { name: "Accessibility (A11y)", color: "#10b981", subtopics: ["WCAG 2.1 AAA Contrast", "Keyboard Traps & Focus", "Screen Reader ARIA"] },
      ],
    },
    rootNode: {
      text: "Design System 3.0",
      desc: "Component primitives, tokens, and UX interaction guidelines",
      icon: "🎨",
      color: "#ec4899",
    },
    branches: [
      {
        text: "Design Tokens & Foundations",
        desc: "Atomic visual variables and scale definitions",
        icon: "💎",
        color: "#ec4899",
        x: 320,
        y: -110,
        subs: [
          { text: "Curated HSL Color Tokens" },
          { text: "Modern Typography Scales" },
          { text: "4pt Layout Grid & Spacing" },
        ],
      },
      {
        text: "Component Primitives",
        desc: "Reusable, unstyled accessible UI blocks",
        icon: "🧩",
        color: "#6366f1",
        x: 320,
        y: 110,
        subs: [
          { text: "Contextual Floating Toolbars" },
          { text: "Accessible Dialog & Modals" },
          { text: "Dropdowns & Menu Selectors" },
        ],
      },
      {
        text: "Canvas Interaction Patterns",
        desc: "Direct manipulation and gesture UX",
        icon: "✨",
        color: "#06b6d4",
        x: -320,
        y: -110,
        subs: [
          { text: "Smooth Infinite Panning & Zoom" },
          { text: "Corner Resize Pointer Capture" },
          { text: "Organic Spline Branch Connectors" },
        ],
      },
      {
        text: "Accessibility & A11y",
        desc: "Inclusive standards and keyboard operability",
        icon: "♿",
        color: "#10b981",
        x: -320,
        y: 110,
        subs: [
          { text: "WCAG 2.1 AAA Contrast Ratios" },
          { text: "Keyboard Tab/Enter Navigation" },
          { text: "Full Screen Reader ARIA Semantics" },
        ],
      },
    ],
  },
];

export function getTemplateById(id: string): StarterTemplate {
  return STARTER_TEMPLATES.find((t) => t.id === id) || STARTER_TEMPLATES[0];
}
