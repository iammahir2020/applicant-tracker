# learn.md — the build, chronologically

A detailed record of this project from ideation to deployment: what was taught, what was built, what was decided and why, and what went wrong along the way.

Read this before an interview. `step.md` tells you *what* was done; this tells you *why*, which is what you'll actually be asked about.

One entry per working session, appended, newest at the bottom.

---

## Entry 0 — 2026-09-01 — Ideation, planning, and the ground rules

**Where we were.** Nothing built. Two planning documents existed: a technical build plan and an interview question bank, both written against a specific mid-level (L3) fullstack job description.

**The idea, and why this project.** The gap to close is backend: Node as a real backend, TypeScript under strict mode, REST and GraphQL side by side, the whole testing column, and CI/CD and ops. React was already strong; an earlier AWS build had covered event-driven architecture. So the centre of gravity here is a **Node/TypeScript BFF**, not an AWS-managed one — deliberately different muscle from the previous build.

Domain chosen: **tracking job applications**. Two reasons, both practical. The requirements are obvious, so no time burns on product decisions. And it gets dogfooded during an actual job search, which means real bugs get found — which is what makes the incident and triage exercises honest rather than theatrical.

**Architecture decided.**

```
web (React + Vite + TS + Apollo Client)
        │  GraphQL
        ▼
bff (Node + TS + Apollo Server)          ← the piece that matters
        │  REST                    │  REST
        ▼                          ▼
applications-svc              companies-svc
   (Postgres)                   (Postgres)
        │
        │ publishes events → SQS → events-worker → activity timeline
```

The domain is kept deliberately small — three tables, three screens — so the interesting work is in the *layers*, not in features. That's a decision worth being able to defend: a bigger domain would have produced more code and less learning.

**Decisions made, and why:**

- **Separate Postgres database per service.** Independent deploys and schema evolution, no coupling through shared tables. The cost is real and gets paid later: no joins, no cross-service transactions, aggregation moves into the BFF. Being able to say "I felt that cost" is the point.
- **Raw SQL, no ORM.** An ORM hides exactly the things interviewers ask about — connection pooling, query shape, N+1.
- **Jira and all sprint ceremony removed.** Originally the plan had a Jira board, a 15–20 story backlog, sprints, standup notes and a retro. Cut entirely — this is a solo learning build and the ceremony was overhead without a team to coordinate. What's kept is the part that's technically load-bearing: short-lived branches and PRs into `main`, because CI checks attach to PRs and because a clean git history is something an interviewer actually scrolls through.
- **GitHub Actions added alongside Buildkite.** Buildkite is named in the JD and keeps the deep block, but its free tier runs the agent on your own machine — so nothing gates a PR while the laptop is off, and a visitor to the repo sees no green checks. Actions runs on GitHub's runners for free and fixes exactly that. The two lanes split by role: **Actions gates PRs, Buildkite carries the sharded e2e and the self-hosted-agent depth.** This also produces a genuine interview answer to "why would a company pick Buildkite over Actions?" — hosted control plane, agents inside your own network, so source and secrets never leave your environment. That's the compliance argument.
- **Jenkins dropped to optional.** Not in this JD, and now third in line behind both other CI systems.

**Ground rules set for how this gets built.** Written into `CLAUDE.md`: Mahir writes the code, Claude teaches. Claude gives commands and instructions; Mahir runs them. Concept before code, every time — what it is, why here, what the industry standard is, and what the trade-off costs. Current documentation gets pulled via Context7 rather than recalled from memory. Feedback is blunt. Development proceeds one step at a time.

Three pieces are explicitly off-limits for Claude to write, because they're what gets interrogated hardest: **the BFF resolvers, the resilience layer, and the Playwright fixtures.**

**What was produced.** `CLAUDE.md` (operating instructions), `step.md` (40 steps across 11 phases), `learn.md` (this file). The two planning documents were updated to remove Jira and add GitHub Actions.

**Interview questions this already answers.** "Why a BFF?", "Why separate databases per service?", "Why does this repo have two CI systems?", "Buildkite vs GitHub Actions." All of them are decision questions rather than code questions — which is a useful thing to notice early. The strongest interview material in this project will be the decisions, not the syntax.

**Still open.** Nothing built yet. Next: Step 1 — `git init`, monorepo layout, GitHub repo.

---
