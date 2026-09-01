# Three-day build: Applicant Tracker

Goal: one repo that gives you an honest, defensible answer to every line in that JD, and a project you actually use during your own job search.

## Why this project

You already have the AWS BFF build (AppSync + DynamoDB + EventBridge + SQS/DLQ). That covers the AWS and distributed-systems column. The gaps are Node.js as a real backend, TypeScript under strict mode, REST + GraphQL side by side, the whole testing column, and the entire CI/CD and ops column. So this build puts a **Node/TypeScript BFF** at the centre, not an AWS-managed one — different muscle from last time.

Domain: tracking job applications. Two reasons. You know the requirements without thinking, so no time burns on product decisions. And you'll dogfood it, which means you'll find real bugs, which is what makes the RCA exercise honest.

## Honest expectation setting

Three days gets you to "I built this, here's the code, here's why" on every item. It does not get you to production depth on Buildkite, GitHub Actions, or on-call. Say it that way in interviews. "I set up a Buildkite pipeline for a personal project — here's the pipeline.yml and here's why I split the e2e step out" beats a vague claim, and nobody expects a mid-level candidate to have run a real rotation if they haven't.

The two items you cannot fake and should spend real time on: the BFF design rationale, and the test pyramid decisions. Those get probed hardest.

## Tuned for the L3 role

The JD narrows things usefully. Changes from the original plan:

**Jenkins drops out, GitHub Actions takes its slot.** The L3 description names Buildkite and only Buildkite, so Buildkite keeps the deep block. But Buildkite's free tier runs the agent on your own machine, which means nothing gates a PR while your laptop is off and a visitor to your repo sees no green checks. Actions runs on GitHub's runners for free and fixes exactly that — so it goes in on Day 0 and gets extended on Day 3 in the slot Jenkins used to hold. Keep a `Jenkinsfile` only if everything else is done. See Day 3 Blocks A and B.

**Cypress drops to one spec.** It's listed under Desired, alongside AWS — which you already have. Playwright and Vitest are the named requirements. Spend the time there.

**"Console Runtime" is the word to pay attention to.** Paired with "scalable UI apps" and BFF, that almost certainly means a host shell — a console application that loads feature modules owned by different teams, with shared auth, shared layout, shared routing. Micro-frontend territory. Nobody else applying will have thought about this, so build a light version of it. That's the freed 1.5 hours, spent on Day 2.

**On-call and RCA are participation, not leadership.** You don't need an incident-command story. You need to have been in a rotation, triaged a production bug, and written up what happened. The game day covers exactly that scope — don't inflate it into something it wasn't.

**"Triage production bugs" is a required line.** Treat triage as its own skill on Day 3, separate from the incident drill. See Day 3 Block E.

Your years line up. 3–5 required, you're at 3+ with React strong. The gaps the JD screens for are Node, TypeScript depth, BFF, and the test-in-pipeline habit. That's what this build is.

## Architecture

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

Four Node services, one React app, one docker-compose. Deliberately small domain so the interesting work is in the layers, not the features.

Data model, all of it:

- `applications` — company_id, role_title, stage (applied/screen/assessment/onsite/offer/rejected), applied_at, source, notes
- `stage_events` — application_id, from_stage, to_stage, occurred_at
- `companies` — name, website, location, size, remote_policy

Screens: pipeline board grouped by stage, application detail with timeline, create/edit form. That's it. Resist adding more.

---

## Day 0 — setup (1.5 hours, do it the night before)

Do this before Day 1 so you start Day 1 writing code.

1. GitHub repo, monorepo layout: `apps/web`, `services/bff`, `services/applications`, `services/companies`, `services/events-worker`, `infra/`, `docs/`.
2. Work on short-lived branches and PR into `main`. Not ceremony — the CI checks attach to PRs, and a linear history of small commits is what you'll scroll through in an interview.
3. **GitHub Actions fast lane (20m).** `.github/workflows/ci.yml`, triggered on pull request: checkout, setup-node with `cache: npm`, install, then lint → typecheck → unit. Thirty lines. Do it now rather than Day 3, because it makes every PR across all three days genuinely gated and visibly green, and green checks in the repo are evidence an interviewer sees without you talking. You'll extend it on Day 3.
4. Branch protection on `main`: require PR, and require the Actions job from step 3 as a status check. The rule now actually does something.
5. `docker-compose.yml` with two Postgres instances (one per service — separate databases is a distributed-systems point you'll be asked to defend) and LocalStack or a real SQS queue.

Also start a `docs/decisions/` folder. One short ADR per non-obvious choice, written when you make it. Five or six by the end. These are gold in interviews because they prove you had reasons.

---

## Day 1 — TypeScript, Node, REST, GraphQL BFF

### Block A — TypeScript that survives an interview (1.5h)

Don't do a TypeScript course. Set `strict: true` plus `noUncheckedIndexedAccess`, then learn these five things by hitting them in your own code:

- structural typing and why `interface` vs `type` mostly doesn't matter
- discriminated unions for your `Result<T, E>` return type — build one, use it everywhere in the services
- generics with constraints (`<T extends { id: string }>`) — you'll need this for the DataLoader wrapper
- `unknown` vs `any`, and parsing at the boundary with zod so `unknown` becomes typed
- `satisfies`, and utility types you'll genuinely use: `Pick`, `Omit`, `Partial`, `Record`, `ReturnType`

Interview questions this covers: "what does strict mode change", "how do you type an API response you don't control", "when have you used a generic".

### Block B — applications-svc (2.5h)

Node + TypeScript + Fastify (or Express, doesn't matter, pick one and know why). Plain `pg`, hand-written SQL, no ORM. You're learning SQL anyway and an ORM hides exactly what interviewers ask about.

Build: layered structure (route → handler → service → repository), zod validation at the edge, a typed error hierarchy, error-handling middleware that maps domain errors to status codes, request logging with a correlation ID (pino), `/health` and `/ready`.

Endpoints: CRUD on applications, `POST /applications/:id/stage` which writes a `stage_events` row and publishes an event.

The Node concepts to nail while doing it: event loop and why a sync loop blocks everything, promises vs callbacks, streams (skim), `process.env` config with validation at boot, graceful shutdown on SIGTERM. Write the graceful shutdown — it comes up constantly and takes ten minutes.

### Block C — companies-svc (1h)

Same shape, smaller. One extra thing: env-controlled fault injection. `FAULT_LATENCY_MS` and `FAULT_ERROR_RATE`. You'll use these on Day 3 for the incident drill, and on Day 1 to test your resilience code.

### Block D — the BFF (4h) ← the centrepiece

Apollo Server, TypeScript, GraphQL schema-first.

Schema design first, on paper. `Application` with a `company: Company` field that resolves through the other service. `stageHistory: [StageEvent!]!`. Mutations for create, update, `moveStage`. Deliberately model something the REST services don't return in one call, so the BFF has real aggregation work.

Then:

- resolvers, and the resolver chain — parent/args/context/info
- **DataLoader**. Load the board with 30 applications and watch it fire 30 requests to companies-svc. Then fix it. Do it in that order — the N+1 problem lands when you've caused it.
- context: auth token in, user out, per-request loader instances (know why loaders must be per-request)
- errors: `GraphQLError` with extensions, partial data with nullable fields, why a GraphQL 200 can contain errors
- schema hygiene: depth limiting, disable introspection in prod

The BFF question you will be asked: *why a BFF instead of the frontend calling the services directly, or instead of one shared API?* Have the answer ready — one consumer, one team owning both sides, tailored payload shape, no coordination cost when the web app's needs change, and it's the place to put auth, aggregation, and downstream failure handling. Write it as an ADR.

### Block E — resilience (2h)

This is your distributed-systems evidence. In the BFF's HTTP client to the downstream services:

- per-request timeout (and know why no timeout is the worst default)
- retry with exponential backoff **and jitter**, only on idempotent calls — be able to say why POST isn't retried
- circuit breaker (`opossum`) — closed/open/half-open, and what threshold you picked
- fallback: companies-svc down → return the application with `company: null` and a partial error, board still renders
- a short in-memory cache on company lookups

Turn on `FAULT_ERROR_RATE=0.5` and watch the breaker trip. That's the story you tell.

---

## Day 2 — React, then the whole testing column

### Block A — web app (3h)

React 18 + Vite + TS + Apollo Client. Three screens. Keep the UI plain.

The parts worth care:

- `graphql-codegen` generating typed hooks from your schema. End-to-end type safety from Postgres to JSX is a strong thing to demo.
- Apollo cache: normalization, `cache.modify` after a mutation, optimistic UI on `moveStage` with rollback on error
- loading and error states that actually handle the partial-data case from Block E
- one custom hook, one context, one `useMemo` you can justify — expect "when does React re-render" and "what does the dependency array actually do"

### Block B — Vitest (2h)

Unit and integration tests, run with `--coverage`.

- pure logic: stage transition rules, the retry/backoff calculator, the circuit breaker wrapper
- BFF resolvers with the HTTP layer mocked via MSW
- React components and hooks with Testing Library
- learn the API properly: `describe/it`, `vi.fn`, `vi.mock`, `vi.useFakeTimers` (use it on the retry test), setup files, `happy-dom` vs `jsdom`

Know why Vitest over Jest: native ESM and TS, shares the Vite config and transform pipeline, watch mode is fast. That's the question.

### Block C — Playwright (2.5h)

Full-stack e2e against docker-compose.

- `playwright.config.ts` with projects, `webServer`, `baseURL`, retries in CI only
- page object or fixtures for auth — write a custom fixture, it's what separates people who've used it from people who've read about it
- locators and auto-waiting; never use a fixed sleep and be able to explain why
- API testing with `request` — hit the GraphQL endpoint directly for a few contract tests
- trace viewer, screenshots and video on failure, `--ui` mode
- seed/reset the database between specs, deterministically

Four or five specs is enough: create an application, move it through stages, board reflects the change, companies-svc failure degrades gracefully.

### Block D — console runtime shell (1.5h) ← added for this JD

Restructure `apps/web` as a host shell plus feature modules. Small change, big talking point.

- **Shell** owns: auth, the layout chrome, the router, the Apollo client, an error boundary per module, a `ModuleRegistry` that features register into (route path, nav label, lazy component).
- **Feature modules**: `pipeline`, `application-detail`, `settings`. Each is a self-contained folder exporting a registration object. The shell knows nothing about their internals.
- Lazy-load each module with `React.lazy` + Suspense, so a module failing to load doesn't take the console down.
- One shared contract file the modules import — types, auth hook, design primitives. Nothing else crosses the boundary.

Read up on Module Federation for twenty minutes so you can talk about it, but don't implement it. The point you're making in an interview is that you understand **why** a console splits this way: independent team ownership, independent deploy, failure isolation, and a shared shell so it doesn't look like five different apps stitched together. Then name the costs — version skew on shared dependencies, harder end-to-end typing, and the shell becoming a bottleneck if it accretes logic.

Write it as an ADR. It's the question that'll separate you from every other candidate for a role with "Console Runtime" in the scope.

### Block E — Cypress (30m)

Desired, not required. One component test, enough to have a real opinion: Playwright for e2e (cross-browser, parallelism, trace viewer), Cypress component testing as a fast visual loop, and running both usually means a migration in progress rather than a deliberate choice. Learn `cy.intercept` and the chainable command model, then move on.

### Block F — test strategy doc (30m)

`docs/testing-strategy.md`. What's unit, what's integration, what's e2e, why the pyramid tilts that way here, what your coverage gate is and why you didn't set it to 100%, which tests run on PR vs on merge. Half a page. This gets you further than another twenty tests.

---

## Day 3 — CI/CD, AWS, incidents, process

You're running two pipelines by the end of the day, and the split is deliberate: Actions is the lane that actually gates your PRs, Buildkite is the lane with the depth the JD asks about. Being able to explain why you'd use each is worth more than either one alone.

### Block A — Buildkite (3h) ← named in the JD, do it properly

Free tier, agent running locally in Docker.

`.buildkite/pipeline.yml`:
```
lint → typecheck → unit (Vitest) → build → e2e (Playwright, docker-compose) → deploy (manual block step)
```

Learn: agents and queues (the control plane is hosted, the agents run in your infrastructure — understand the security argument, it's the thing Buildkite is picked for), steps and dependencies, `wait`, `parallelism:` to shard the Playwright suite, artifact upload for traces and reports, annotations that surface a test summary on the build page, block steps for manual approval, secrets living on the agent.

Two things to go beyond the tutorial on, because the JD says "within continuous delivery pipelines":

- shard Playwright across parallel agents and make the shards deterministic
- make a test fail on purpose, then use the uploaded trace to diagnose it from the build page alone, without running anything locally. That's the actual workflow on a real team.

### Block B — GitHub Actions (45m) ← the lane that gates your PRs

Extend the Day 0 workflow into something you'd actually defend in review. Actions is the CI system you're most likely to meet outside this one JD, so this is reference work as much as it is interview prep.

Add to `ci.yml`:

- **matrix** across two Node versions, and know when a matrix is worth the runner minutes and when it's just burning them
- **caching** — `actions/cache` or `setup-node`'s built-in npm cache. Time a cold run against a warm one so you have the number.
- a second job for **Playwright**, `needs:` the unit job, with `services:` Postgres or docker-compose, uploading traces via `actions/upload-artifact` on failure only
- **concurrency** with `cancel-in-progress` so pushing twice doesn't run two builds
- an **environment** with a required reviewer on the deploy job — the Actions equivalent of Buildkite's block step
- secrets via repository secrets and `GITHUB_TOKEN` permissions scoped down, never `write-all`

Two things to be able to say out loud, because they're the interesting half:

- **Buildkite vs Actions.** Actions: zero infrastructure, deeply wired into the repo, free runners, and the config lives beside the code — but you're on GitHub's runners and GitHub's availability, and matrix-heavy workflows get expensive on private repos. Buildkite: hosted control plane, agents in *your* infrastructure, so source and secrets never leave your environment and you size your own build machines. That last point is the compliance argument, and it's why regulated shops pick it.
- **What's genuinely the same.** Both are YAML DAGs of steps with artifacts, caching, parallelism, and manual gates. Once you've built one you're mostly learning vocabulary, not concepts — say that, it reads as perspective rather than tool loyalty.

### Block C — Jenkins (optional, only if everything else is done)

Not in the L3 JD, and now third in line. If you somehow have the slack, write a declarative `Jenkinsfile` mirroring the same stages and run it once in Docker — enough to say you've written one and can compare the model. Skip without guilt.

### Block D — AWS deploy (2.5h)

You have an unfinished EC2 item from the last build. Finish it here.

- one t3.small, Docker + compose, the whole stack on it
- RDS Postgres, or Postgres in compose if budget is tight — decide and write the ADR
- real SQS queue with a DLQ between applications-svc and events-worker; redrive policy, `maxReceiveCount`, visibility timeout. Know why the DLQ exists.
- CloudWatch: ship container logs, one custom metric (BFF p95 latency), two alarms (error rate, latency)
- security group that isn't 0.0.0.0/0 on everything

### Block E — production bug triage (1h) ← required line in the JD

Different skill from incident response. An incident is "the system is down." Triage is "a user says something is wrong and you have to decide what it is, how bad, and who owns it."

Have Claude plant three bugs in your repo without telling you what they are — one data bug, one race condition, one that only shows under a specific auth state. For each, work the loop and write it down:

1. Reproduce. If you can't reproduce it, that's the first finding.
2. Scope it. How many users, which paths, since when. Correlate with deploys.
3. Classify severity, and be able to defend the classification.
4. Localize it — shell, BFF, or downstream service? Your correlation ID is how you answer this in one query, which is the payoff for adding it on Day 1.
5. Mitigate or fix, then write the bug ticket properly: repro steps, expected, actual, scope, evidence.

`docs/triage.md` with the three write-ups. "Walk me through how you triage a production bug" is close to guaranteed in this interview, and most candidates answer it as a vibe rather than a procedure.

### Block F — the game day (2.5h) ← the differentiator

Write `docs/runbook.md` first: how to check health, where the logs are, how to roll back, who to escalate to. Then define two SLOs (p95 GraphQL latency, error rate) with error budgets.

Then break it, three times, and treat each as a real incident:

1. `FAULT_ERROR_RATE=0.8` on companies-svc
2. exhaust the Postgres connection pool
3. deploy a resolver that throws on null

For each: note the detection time, the alarm that fired (or didn't — that's a finding), what you saw first, what you did, when it recovered. Then write an RCA in `docs/incidents/`. Real format: summary, impact, timeline with timestamps, root cause, contributing factors, what stopped it, action items with owners. Five whys on at least one.

Three RCAs in a repo is a genuinely uncommon thing for a mid-level candidate to have. It answers the incident-response, on-call, and RCA line items with evidence instead of a claim.

### Block G — wrap (1h)

README with the architecture diagram and a "run it locally" section that actually works from a clean clone. Then write yourself `docs/interview-notes.md`: for each JD line, the three sentences you'd say and the file you'd point at.

---

## How to work with Claude on this

You write every line. The pattern that works:

- Before a block: "explain the concept and the shape of the solution, no code." Get the mental model.
- Write it yourself. Get stuck for ten minutes before asking.
- When stuck: paste the error and your code, ask what's wrong and why, not for a fix.
- After a block: paste what you wrote, ask for a review as a senior would give it.
- End every block by explaining it back out loud. If you can't, you didn't learn it — that's the signal to spend another twenty minutes rather than moving on.

Don't let Claude Code write the BFF resolvers, the resilience layer, or the Playwright fixtures. Those three are what you'll be interrogated on.

## If you fall behind

Cut in this order:
1. Jenkins → gone, it isn't in this JD
2. Buildkite depth → if the local agent fights you, stop. You already have working CI in Actions from Day 0, so commit the `pipeline.yml` you got to, and be honest in the interview that you built the pipeline but ran it against a local agent. That is a far better position than an empty CI story.
3. Cypress → skip the test, keep the opinion
4. EC2/RDS → stay local, keep SQS via LocalStack (AWS is Desired, not Required)
5. events-worker → publish events, log them, skip the timeline UI
6. the third feature module in the shell → two is enough to demonstrate the pattern

Never cut: the BFF resilience layer, Playwright running in CI (either lane), the triage exercise, the game day and RCAs. Every one of those maps to a line the JD calls Required, and almost no other candidate at this level will have them.

## Self-check before you call it done

Answer these out loud without notes:

- Why a BFF? When is it the wrong choice?
- Show me an N+1 in this repo and how DataLoader fixes it.
- Your circuit breaker threshold is X. Defend it.
- Which of your tests would you delete first, and why?
- Walk me through incident #2 from detection to resolution.
- Why did the alarm not fire in incident #3?
- Why does a console split into a shell plus feature modules? What does that cost?
- A user reports something broken. First five minutes — what do you do?
- Your Playwright suite takes 12 minutes in CI. How do you fix that?
- Why does this repo have two CI systems? Which would you delete on a real team?
- Why separate databases per service? What did that cost you?
