# step.md — the build, broken down

The ordered spine of the Applicant Tracker build. Derived from `three-day-fullstack-sprint.md` (what to build) and `interview-question-bank.md` (why it matters), but re-cut into learning-sized steps rather than days.

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[-]` cut (with reason)

**Tiers:** every step is tagged **A**, **B**, or **C**. Depth is allocated by interview yield, measured against the `[repo]`-marked questions in `interview-question-bank.md`. See "Tiers" in `CLAUDE.md`.

- **Tier A** — the interrogation surface. Full teaching loop, explain-back, no shortcuts. ~28 of the 34 `[repo]` questions.
- **Tier B** — build it with minimal teaching, correctness-only review. **Depth on demand:** ask, and it becomes Tier A for that piece.
- **Tier C** — Claude writes it. Mahir owes a three-sentence narrative, not the syntax.

**Rules:** one step at a time. A step is done when every done-when box is ticked *and* — for Tier A and B — the concepts can be explained out loud. Steps can be reordered if it makes teaching sense — say why in `learn.md`.

---

## Current Position

- **Now:** Step 3 — GitHub Actions fast lane + branch protection (**Tier C** — Claude writes the workflow, Mahir sets branch protection)
- **Last done:** Step 2 — TypeScript strict baseline and tooling (2026-09-01)
- **Next:** Step 5 — The TypeScript you'll actually be asked about (**Tier A**)
- **Open threads:** Step 4 (docker-compose, Tier C) deferred until just before Step 7, which is the first step that needs a database. Placeholder `src/index.ts` files exist in all five packages purely so `tsc` has inputs — replace, don't add alongside. Repo is named `application-tracker` on GitHub while the project is `applicant-tracker`.

---

# Phase 0 — Foundations

### [x] Step 0 — Planning and ideation
Wrote the build plan and the interview question bank. Chose the domain, the architecture, and the CI approach. Dropped Jira and all sprint ceremony; added GitHub Actions alongside Buildkite. Set up `CLAUDE.md`, this file, and `learn.md`.
**Covers:** nothing technical yet — but the *reasoning* here is interview material. See `learn.md` Entry 0.

---

### [x] Step 1 — Repo, layout, git
**Tier:** retro-tagged **C** — this was plumbing and was taught far too deeply. It's what triggered the tier system.
**Concepts:** monorepo vs polyrepo and when each is right · npm workspaces · why the folder boundaries mirror the deploy boundaries.
**Build:** `git init`. Monorepo layout — `apps/web`, `services/bff`, `services/applications`, `services/companies`, `services/events-worker`, `infra/`, `docs/`, `docs/decisions/`. Root `package.json` with workspaces. `.gitignore`. GitHub repo, pushed.
**Done when:** clean `git log` with a first commit · workspaces resolve · repo is on GitHub.
**Answers:** nothing yet — foundation.
**What happened:** done 2026-09-01. Node moved 20 → 22 (20 is EOL); `.nvmrc`, `engines: >=22`, `.npmrc` with `engine-strict=true`. A `"name:"` typo in all six `package.json` files silently disabled every package name — npm fell back to directory names. Cost most of a session. See `learn.md` Entry 1.

### [x] Step 2 — TypeScript strict baseline and tooling
**Tier C** — Claude writes it. You owe the three-sentence narrative, not the syntax.
**Concepts:** what `strict: true` actually turns on (and which flag matters most) · `noUncheckedIndexedAccess` · structural typing · why a shared base tsconfig with per-package extends · ESLint flat config · why Prettier and ESLint stop fighting these days.
**Build:** base `tsconfig.json` with strict + `noUncheckedIndexedAccess`, extended per package. ESLint + Prettier. `npm run lint`, `npm run typecheck` at the root.
**Done when:** both scripts pass on an empty repo · you can say what strict mode changed without looking.
**Answers:** "what does `strict: true` turn on", "structural typing — what breaks", "`interface` vs `type`".
**What happened:** done 2026-09-01. Claude wrote `tsconfig.base.json`, five per-package tsconfigs, `eslint.config.mjs` (flat, type-aware via `projectService`), Prettier + `eslint-config-prettier`. TypeScript pinned to `~6.0.3` not 7.x because `typescript-eslint@8` peers on `typescript <6.1.0` — type-aware linting was judged worth one major of lag. Added a `no-restricted-imports` rule enforcing the service boundary. Verified with throwaway probe files that `noUncheckedIndexedAccess`, `no-floating-promises` and the boundary rule all actually fire.

### [ ] Step 3 — GitHub Actions fast lane + branch protection
**Tier C** — Claude writes it. You owe the three-sentence narrative, not the syntax.
**Concepts:** CI as a gate not a formality · workflows / jobs / steps and the `needs:` DAG · why fast checks run first · dependency caching · scoped `GITHUB_TOKEN`.
**Build:** `.github/workflows/ci.yml` on pull_request: checkout → setup-node with npm cache → install → lint → typecheck. Branch protection on `main` requiring it.
**Done when:** a deliberately-broken PR goes red and blocks merge · a good one goes green.
**Answers:** "GitHub Actions — the mental model", "how do you make a CI run faster".

### [ ] Step 4 — docker-compose: two Postgres instances + LocalStack
**Tier C** — Claude writes it. You owe the three-sentence narrative, not the syntax.
**Concepts:** why a database per service · what that costs you (no joins, no cross-service transactions) · containers vs images vs volumes · why pinning image digests matters for reproducibility · LocalStack for SQS.
**Build:** `infra/docker-compose.yml` — `postgres-applications`, `postgres-companies`, LocalStack with SQS. Health checks. Named volumes.
**Done when:** `docker compose up` gives you two databases you can `psql` into and a queue you can list. **ADR:** separate databases per service.
**Answers:** "why separate databases per service", "what makes a build reproducible".

---

# Phase 1 — TypeScript depth

### [ ] Step 5 — The TypeScript you'll actually be asked about
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** discriminated unions · building a `Result<T, E>` type · generics with constraints · `unknown` vs `any` and parsing at the boundary with zod · `satisfies` · the utility types worth knowing.
**Build:** a shared `packages/shared` (or `services/*/src/types`) with `Result<T,E>`, a couple of branded types, and your first zod schemas. No services yet — just the type foundations they'll use.
**Done when:** you've used `Result` in real code, not just declared it · you can explain why zod exists at all given TypeScript.
**Answers:** "discriminated unions — show me one", "generics with constraints — why constrain", "`any` vs `unknown`", "type vs runtime — where's the boundary", "`satisfies` vs annotation".

---

# Phase 2 — applications-svc (your first real Node service)

### [ ] Step 6 — Fastify skeleton, config, graceful shutdown
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** the Node event loop and what actually blocks it · why config is validated at boot and fails fast · SIGTERM and what "graceful" means (stop accepting, drain in-flight, close pools, hard timeout) · `/health` vs `/ready` and why they're different.
**Build:** Fastify + TS server. Zod-validated env config. Graceful shutdown. Health and readiness endpoints.
**Done when:** `docker stop` drains cleanly instead of dropping requests · you can explain the event loop unprompted.
**Answers:** "Node is single-threaded — how does it handle concurrency", "graceful shutdown — what does it involve", "where does config come from".

### [ ] Step 7 — Postgres schema, migrations, repository layer
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** why raw SQL and not an ORM here · connection pooling and pool exhaustion · parameterised queries and SQL injection · the repository pattern and what it's actually buying you · migrations as forward-only versioned files.
**Build:** `applications` and `stage_events` tables. A migration runner (or `node-pg-migrate`). `pg` pool. Repository layer with hand-written SQL.
**Done when:** migrations run from empty · the repository is the only place SQL lives.
**Answers:** "RDS vs DynamoDB — how do you choose" (partly), "backward-compatible migrations — what's the pattern".

### [ ] Step 8 — CRUD endpoints, validation, typed errors
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** the layered structure (route → handler → service → repository) and why each layer exists · validation at the edge · a typed error hierarchy mapped to status codes in *one* place · REST resource design · which status codes you must never fumble.
**Build:** CRUD on `/applications`. Zod at the edge. Domain error classes. One error-handling hook that maps them to HTTP.
**Done when:** a bad payload returns 400 with a useful body, a missing row returns 404, and neither is handled in a route file.
**Answers:** "what makes an API RESTful", "status codes you should never fumble", "how do you handle errors in async route handlers", "PUT vs PATCH".

### [ ] Step 9 — Structured logging and the correlation ID
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** why `console.log` doesn't survive production · structured JSON logs and queryability · the correlation ID: generated at the edge, propagated by header, on every log line · secret redaction · log levels that mean something.
**Build:** pino. Correlation ID middleware, generated or accepted from a header, attached to the request context and every log line.
**Done when:** one request produces log lines you can grep by a single ID.
**Answers:** "how do you trace a request across services", "structured logging — why not console.log". **This step is what makes the Day-3 triage exercise possible — don't skimp.**

### [ ] Step 10 — Stage transitions and publishing events
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** modelling a state machine in the domain layer · why the transition rules live in the service, not the route · writing an audit row and publishing an event in the same operation · at-least-once delivery and why consumers must be idempotent.
**Build:** `POST /applications/:id/stage` — validates the transition, writes a `stage_events` row, publishes to SQS (LocalStack).
**Done when:** an invalid transition is rejected with a clear error · a valid one leaves both a row and a message.
**Answers:** "idempotency in message consumers", "idempotent retries plus at-least-once — what's the risk".

---

# Phase 3 — companies-svc and the events worker

### [ ] Step 11 — companies-svc, with fault injection
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** the same shape again, faster — repetition is the point · deliberate fault injection as a testing tool · why you build the ability to break things *before* you need it.
**Build:** same layered structure, smaller. `companies` table. Plus `FAULT_LATENCY_MS` and `FAULT_ERROR_RATE` env controls.
**Done when:** you can make the service slow or failing with an env var, on demand.
**Answers:** foundation for the whole resilience and incident story.

### [ ] Step 12 — events-worker
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** queue consumers and the polling loop · visibility timeout and what breaks when it's wrong · dead letter queues and `maxReceiveCount` · dedup by message ID.
**Build:** SQS consumer reading stage events, writing an activity timeline. DLQ configured with a redrive policy.
**Done when:** a poisoned message lands in the DLQ instead of blocking the queue forever.
**Answers:** "what's a DLQ for", "visibility timeout — what breaks if it's wrong", "SQS standard vs FIFO".

---

# Phase 4 — The BFF (the centrepiece)

### [ ] Step 13 — GraphQL schema design, on paper first
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** schema as contract · designing for the *screen*, not the database table · nullability as a deliberate decision · schema design mistakes reviewers flag · why GraphQL here and where REST would have been fine.
**Build:** the SDL. `Application` with a `company: Company` field crossing a service boundary. `stageHistory`. Mutations for create, update, `moveStage`. No resolvers yet.
**Done when:** the schema requires aggregation the REST services can't do in one call — that's the whole point. **ADR:** why a BFF.
**Answers:** "why GraphQL over REST here", "schema design mistakes you'd flag", "what is a BFF and why not call the services directly", "BFF vs API gateway", "when is a BFF the wrong call".

### [ ] Step 14 — Apollo Server, resolvers, context
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** the resolver chain — parent, args, context, info · the default resolver · what belongs in context and what doesn't · auth at the transport, authorisation in resolvers.
**Build:** Apollo Server wired to both REST services. Resolvers. Per-request context carrying user and correlation ID.
**Done when:** the board query returns real aggregated data from two services.
**Answers:** "how does a resolver chain work", "how do you do auth in GraphQL".

### [ ] Step 15 — Cause the N+1, then fix it with DataLoader
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** why a per-item field resolver fans out · batching within a tick · caching and deduping by key · **why loaders must be per-request** (leak one user's data into another's response if not).
**Build:** load 30 applications, watch 30 requests hit companies-svc, count them. *Then* add DataLoader. Do it in that order.
**Done when:** you have the before and after request counts written down. Those numbers are the interview answer.
**Answers:** "the N+1 problem — cause and fix", "why must DataLoader be per-request". **Do not skip causing the problem first.**

### [ ] Step 16 — Errors, partial data, schema hygiene
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** why a GraphQL 200 can contain errors · partial success as a first-class outcome · `GraphQLError` with extensions · depth limiting and complexity · introspection off in production.
**Build:** error mapping with extensions. Nullable `company` so the board survives companies-svc being down. Depth limit. Introspection disabled outside dev.
**Done when:** kill companies-svc and the board query still returns applications, with an errors array explaining the gap.
**Answers:** "why can a GraphQL response be 200 with errors", "what stops a malicious query", "graceful degradation — what does it look like".

---

# Phase 5 — Resilience (your distributed systems evidence)

### [ ] Step 17 — Timeouts
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** why "wait forever" is the worst default · how one slow dependency becomes a total outage through connection pile-up · `AbortController` and signals · picking a timeout value you can defend.
**Build:** per-request timeout on the BFF's HTTP client to both services.
**Done when:** `FAULT_LATENCY_MS=30000` produces a fast, clean failure instead of a hang.
**Answers:** "what's the first thing you add to any network call", "how do you cancel an in-flight request".

### [ ] Step 18 — Retry with backoff and jitter
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** exponential backoff · **why jitter** (synchronised retries stampede a recovering service) · retrying only idempotent operations and only retryable errors · retry amplification when every layer retries.
**Build:** the retry wrapper. Capped attempts. Idempotent methods only.
**Done when:** you can explain why POST isn't retried, and what makes 503 retryable but 400 not.
**Answers:** "retry strategy — the full answer", "idempotency — which methods and why do you care", "retries and circuit breakers together — what's the danger".

### [ ] Step 19 — Circuit breaker
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** closed / open / half-open · what the breaker protects (both sides, not just yours) · choosing a threshold and a reset timeout you can defend · breaker vs retry — different problems.
**Build:** `opossum` around the companies-svc client.
**Done when:** `FAULT_ERROR_RATE=0.5` trips the breaker and you watch it recover through half-open. **ADR:** the threshold you picked and why.
**Answers:** "circuit breaker — the three states", "your threshold is X, defend it".

### [ ] Step 20 — Fallbacks, caching, and the fault drill
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** graceful degradation as a design decision, not an accident · what's core and what's secondary on each screen · a short in-memory cache and its staleness trade-off.
**Build:** fallback returning `company: null` plus a partial error. Small in-memory cache on company lookups.
**Done when:** with companies-svc fully down, the board renders. You've watched it happen.
**Answers:** "graceful degradation — what does it look like". This is the story you tell about distributed systems.

---

# Phase 6 — The web app

### [ ] Step 21 — Vite, React, Apollo Client, codegen
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** why Vite · Apollo Client's normalized cache · `graphql-codegen` for typed hooks — end-to-end type safety from Postgres to JSX · why server state doesn't belong in `useState` + `useEffect`.
**Build:** Vite + React + TS. Apollo Client. Codegen generating typed hooks from the BFF schema.
**Done when:** changing the schema breaks the frontend build. That's the feature.
**Answers:** "how do you handle server state".

### [ ] Step 22 — The three screens
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** when a component re-renders (and when it doesn't) · what the dependency array actually compares · when *not* to use `useEffect` · keys and list reconciliation · controlled vs uncontrolled inputs.
**Build:** pipeline board grouped by stage, application detail with timeline, create/edit form. Plain UI — resist decorating.
**Done when:** all three work against the real BFF, including the partial-data case from Step 20.
**Answers:** "why does a component re-render", "what does the dependency array do", "when should you not use useEffect", "keys in lists", "error boundaries — what do they catch".

### [ ] Step 23 — Apollo cache, optimistic updates, rollback
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** cache normalization by id · `cache.modify` after a mutation · optimistic UI and how rollback actually works · eventual consistency in the UI.
**Build:** optimistic `moveStage` — card moves instantly, rolls back visibly on error.
**Done when:** you force an error and watch the card snap back.
**Answers:** "optimistic updates — how do you roll back", "eventual consistency — how do you deal with it in the UI".

### [ ] Step 24 — The console runtime shell
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** host shell vs feature modules · what the shell owns (auth, layout, routing, client, error boundaries) and what it must not · `ModuleRegistry` as a contract · lazy loading with `React.lazy` + Suspense so one module can't take the console down · Module Federation (know it, don't build it) · the costs: version skew, weaker cross-boundary typing, the shell becoming a bottleneck.
**Build:** restructure `apps/web` into a shell plus `pipeline`, `application-detail`, `settings` modules. One shared contract file. Error boundary per module.
**Done when:** you can make one module throw and the rest of the console keeps working. **ADR:** why the console splits this way.
**Answers:** the entire "Console runtime and micro-frontends" section of the question bank. **This is the differentiator for this JD — most candidates won't have thought about it.**

---

# Phase 7 — Testing

### [ ] Step 25 — Vitest on pure logic
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** why Vitest over Jest (native ESM/TS, shares the Vite pipeline) · what makes a good test name · mock vs stub vs spy vs fake · **fake timers** — testing retry/backoff without actually waiting.
**Build:** unit tests on stage transition rules, the backoff calculator, the breaker wrapper. `vi.useFakeTimers()` on the retry tests.
**Done when:** the retry suite runs in milliseconds.
**Answers:** "Vitest over Jest — why", "how do you test retry logic without waiting", "mock vs stub vs spy vs fake", "test names — what makes a good one".

### [ ] Step 26 — Resolver integration tests with MSW
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** why MSW beats mocking `fetch` (intercepts at the network layer, your code path stays real) · what you should *not* mock · integration vs unit, and where the line is here.
**Build:** BFF resolver tests with the downstream services mocked via MSW. Cover the partial-data path.
**Done when:** a resolver test fails when you break the real resolver logic, not just the mock.
**Answers:** "why MSW instead of mocking fetch", "what shouldn't you mock", "what do you test at the API layer vs the UI".

### [ ] Step 27 — Component and hook tests
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** Testing Library's philosophy — query the way a user perceives, not by implementation · why `getByRole` over `getByTestId` · testing hooks · what not to test in a component.
**Build:** tests for the board, the form, one custom hook.
**Done when:** refactoring a component's internals doesn't break its tests. That's the signal you tested behaviour.

### [ ] Step 28 — Playwright
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** auto-waiting and why a fixed sleep is always wrong · locators · **fixtures** — reusable setup with teardown, and the authenticated-context pattern · deterministic seeding and reset between specs · the trace viewer.
**Build:** `playwright.config.ts` with `webServer`, projects, CI-only retries. A custom auth fixture. Four or five specs: create, move through stages, board reflects it, companies-svc down degrades gracefully. API contract tests via `request`.
**Done when:** the suite passes ten times in a row against a freshly reset stack.
**Answers:** "Playwright auto-waiting — what does it remove", "Playwright fixtures — what for", "how do you keep e2e deterministic", "flaky tests — how do you deal with them".

### [ ] Step 29 — One Cypress component test
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** the chainable command model · `cy.intercept` · Playwright vs Cypress as an actual opinion, not a preference.
**Build:** one component test. That's all.
**Done when:** you can compare the two tools honestly in thirty seconds.
**Answers:** "Playwright vs Cypress — your actual opinion".

### [ ] Step 30 — Testing strategy doc
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** the pyramid and why yours tilts the way it does · coverage as a regression gate rather than a number to chase · what runs on PR vs on merge.
**Build:** `docs/testing-strategy.md`. Half a page, no more.
**Done when:** it names a coverage policy you can defend and says which tests you'd delete first.
**Answers:** "describe your test pyramid", "coverage target", "which tests would you delete first".

---

# Phase 8 — CI/CD

### [ ] Step 31 — Extend the Actions workflow
**Tier C** — Claude writes it. You owe the three-sentence narrative, not the syntax.
**Concepts:** matrix builds and when they're worth the minutes · caching, measured cold vs warm · jobs with `services:` · artifact upload on failure only · `concurrency` with `cancel-in-progress` · environments with required reviewers · pinning actions to a SHA, not a tag.
**Build:** add build, a Playwright job with `needs:`, trace artifacts, concurrency, a gated deploy environment.
**Done when:** you have the cold-vs-warm cache numbers written down.
**Answers:** "how do you make a CI run faster", "Actions security — what do you get wrong by default".

### [ ] Step 32 — Buildkite pipeline
**Tier C** — Claude writes it. You owe the three-sentence narrative, not the syntax.
**Concepts:** hosted control plane, agents in your own infrastructure — and why regulated shops pick that · steps, `wait`, dependencies · block steps for manual approval · annotations · secrets on the agent.
**Build:** agent in Docker. `.buildkite/pipeline.yml`: lint → typecheck → unit → build → e2e → manual block → deploy.
**Done when:** a full pipeline runs green locally.
**Answers:** "Buildkite's model — what's distinctive", "Buildkite vs GitHub Actions — when would you pick each", "walk me through your pipeline".

### [ ] Step 33 — Sharding and diagnosing from the build page
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** sharding a slow suite deterministically · why e2e is split out · reading a failure from artifacts alone, which is the real workflow on a team.
**Build:** shard Playwright with `parallelism:`. Upload traces. Then break a test on purpose and diagnose it *from the build page only*, without running anything locally.
**Done when:** you found the cause without touching your local machine.
**Answers:** "your Playwright suite takes 12 minutes in CI — how do you fix that", "why split e2e into its own step".

---

# Phase 9 — AWS

### [ ] Step 34 — Deploy to EC2
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** what actually changes between local and a box · immutable, versioned artifacts and why rollback depends on them · blue-green vs canary vs rolling.
**Build:** one t3.small, Docker + compose, the whole stack running.
**Done when:** it's reachable and you can roll back to the previous image tag.
**Answers:** "how do you roll back", "blue-green vs canary vs rolling".

### [ ] Step 35 — Real SQS with a DLQ, and RDS or not
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** managed queue vs LocalStack · redrive policy, `maxReceiveCount`, visibility timeout in anger · RDS vs Postgres-in-compose as a cost/realism trade-off.
**Build:** real SQS + DLQ between applications-svc and events-worker. Decide on RDS. **ADR** either way.
**Done when:** you've deliberately poisoned a message and watched it land in the DLQ.
**Answers:** "SQS vs SNS vs EventBridge", "what's a DLQ for".

### [ ] Step 36 — CloudWatch and security groups
**Tier B** — shape and commands, correctness-only review. Ask and it becomes Tier A for that piece.
**Concepts:** alarming on SLOs, not on CPU · p95/p99 vs average and why the tail is what users feel · what makes an alert actionable · security groups vs NACLs · least privilege in practice.
**Build:** ship container logs. One custom metric (BFF p95). Two alarms (error rate, latency). Security group that isn't `0.0.0.0/0` on everything.
**Done when:** you triggered an alarm on purpose and it fired.
**Answers:** "what goes in CloudWatch for a service you own", "why p99 and not average", "what makes a good alert", "security group vs NACL", "IAM — the model".

---

# Phase 10 — Operations (the part nobody else has)

### [ ] Step 37 — Runbook and SLOs
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** what a runbook is for at 3am · SLIs vs SLOs vs SLAs · error budgets as arithmetic that ends arguments.
**Build:** `docs/runbook.md` — health checks, log locations, rollback, escalation. Two SLOs with error budgets.
**Done when:** someone else could follow it cold.
**Answers:** "what's an error budget", "what makes a good alert".

### [ ] Step 38 — Production bug triage
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** triage vs incident response — different skills · the loop: reproduce → scope → classify → localize → mitigate → ticket · severity by user impact and blast radius, not by how annoying the fix is · fix forward vs roll back.
**Build:** have Claude plant three bugs without telling you what they are — one data bug, one race condition, one that only appears under a specific auth state. Work each one and write it up in `docs/triage.md`.
**Done when:** three write-ups with repro steps, expected, actual, scope, and evidence. The correlation ID from Step 9 should be how you localize each one.
**Answers:** the entire "Production bug triage" section. **This is a required line in the JD and most candidates answer it as a vibe rather than a procedure.**

### [ ] Step 39 — Game day: three incidents, three RCAs
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** mitigate first, diagnose second · detection vs mitigation vs resolution · blameless postmortems and why hiding information is the real cost of blame · five whys, done properly.
**Build:** break it three times — `FAULT_ERROR_RATE=0.8` on companies-svc; exhaust the Postgres connection pool; deploy a resolver that throws on null. Treat each as a real incident with timestamps. Write three RCAs in `docs/incidents/`.
**Done when:** three RCAs with impact, timeline, root cause, contributing factors, and *owned* action items. Note honestly where an alarm should have fired and didn't — that's a finding, and you lead with it.
**Answers:** "walk me through an incident", "what goes in an RCA", "five whys — demo it", "your alarm didn't fire — now what".

### [ ] Step 40 — README and interview notes
**Tier A** — full loop: concept first, you write it, PR-grade review, explain-back.
**Concepts:** technical writing as a listed job responsibility · a README that works from a clean clone.
**Build:** README with the architecture diagram and a run-it-locally section that actually works. `docs/interview-notes.md`: for each JD line, the three sentences you'd say and the file you'd point at.
**Done when:** you cloned it fresh into a new directory and followed your own README without touching anything else.

---

## Final check — answer these out loud, no notes

- Why a BFF? When is it the wrong choice?
- Show me an N+1 in this repo and how DataLoader fixes it.
- Your circuit breaker threshold is X. Defend it.
- Which of your tests would you delete first, and why?
- Walk me through incident #2 from detection to resolution.
- Why did the alarm not fire in incident #3?
- Why does a console split into a shell plus feature modules? What does that cost?
- A user reports something broken. First five minutes — what do you do?
- Your Playwright suite takes 12 minutes in CI. How do you fix that?
- Why separate databases per service? What did that cost you?
- Why does this repo have two CI systems? Which would you delete on a real team?

If any answer is thin, that's the next thing to work on regardless of what this file says is next.
