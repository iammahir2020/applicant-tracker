# Interview question bank — mid-level fullstack

Answers here are the compressed version — the two or three sentences you'd actually say out loud. Not essays. If your spoken answer runs past 45 seconds without the interviewer interrupting, you're lecturing.

Questions marked **[repo]** have direct evidence in the applicant tracker build. Point at the file. That's the whole reason for building it.

## How to drill this

Cover the answer, say yours out loud, uncover, compare. Out loud matters — the gap between "I know this" and "I can say this" is where interviews are lost.

Answer shape for anything open-ended: **claim, reason, evidence, limit.** "Use a BFF here. One consumer means you can shape the payload without cross-team negotiation. I did it on my tracker — the board query needed data from two services. It's the wrong call if you've got four clients with similar needs; then you're maintaining four backends."

That last clause — the limit — is what separates mid from junior. Juniors state rules. Mid-level people state trade-offs.

---

## JavaScript

**Event loop — walk me through it.**
Call stack runs sync code. When it's empty, microtasks (promises, queueMicrotask) drain completely, then one macrotask (timers, I/O callbacks). Repeat. Microtasks starve macrotasks if you keep queueing them.

**`setTimeout(fn, 0)` vs `Promise.resolve().then(fn)` — which runs first?**
The promise. Microtask queue drains before the next macrotask.

**Closures — what and when.**
A function keeping a reference to its defining scope after that scope returns. Used for private state, memoization, and every React hook you've written.

**`==` vs `===`.**
`==` coerces. Only defensible use is `x == null` to catch null and undefined together.

**`this` — the four binding rules.**
Default (global/undefined in strict), implicit (method call, left of the dot), explicit (call/apply/bind), new. Arrow functions have none of it — they take `this` lexically.

**Prototypal inheritance.**
Objects link to other objects via `[[Prototype]]`. Property lookup walks the chain. `class` is syntax over this.

**`var` vs `let` vs `const`.**
`var` is function-scoped and hoisted-initialized-undefined. `let`/`const` are block-scoped with a temporal dead zone. `const` binds, doesn't freeze — the object contents stay mutable.

**Deep vs shallow copy.**
Spread and `Object.assign` are one level. `structuredClone` for deep. This is why your React state updates break when you mutate a nested object.

**Debounce vs throttle.**
Debounce waits for quiet then fires once — search input. Throttle fires at most once per interval — scroll handler.

**Event delegation.**
One listener on a parent, use `event.target` to find what was hit. Fewer listeners, works for dynamically added children.

**`Promise.all` vs `allSettled` vs `race` vs `any`.**
All: rejects on first failure. AllSettled: waits for everything, returns status per item. Race: first to settle, either way. Any: first to fulfil.

**How do you cancel an in-flight request?**
`AbortController`, pass the signal to fetch. **[repo]** — you use this for BFF timeouts.

**Generators / async iterators — what for?**
Streaming and pagination without holding everything in memory. Know they exist; you won't be pushed hard here at mid level.

---

## TypeScript

**What does `strict: true` actually turn on?**
Mainly `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`. The one that changes your life is strictNullChecks — null and undefined stop being assignable to everything.

**`interface` vs `type`.**
Interfaces merge declarations and are conventional for object shapes. Types do unions, intersections, mapped and conditional types. Pick one for consistency; the difference rarely matters.

**`any` vs `unknown`.**
`any` disables checking and spreads. `unknown` forces you to narrow before use. Parse external data into `unknown`, validate with zod, get a real type out. **[repo]**

**Structural typing — what breaks because of it?**
Two unrelated types with the same shape are interchangeable. Bites you when `UserId` and `OrderId` are both `string`. Fix with branded types if it matters.

**Discriminated unions — show me one.**
A shared literal field the compiler narrows on. Your `Result<T, E>` with `{ ok: true, value }` / `{ ok: false, error }`. **[repo]**

**Generics with constraints — why constrain?**
`<T extends { id: string }>` lets you touch `.id` inside. Unconstrained `T` gives you nothing to work with. Your DataLoader wrapper needs this. **[repo]**

**`satisfies` vs a type annotation.**
Annotation widens to the declared type. `satisfies` checks conformance but keeps the narrower inferred type. Use it for config objects where you want literal types preserved.

**Utility types you've used.**
`Pick`, `Omit`, `Partial`, `Required`, `Record`, `ReturnType`, `Awaited`. Name the actual use, not the list.

**Type vs runtime — where's the boundary?**
Types vanish at compile time. Anything crossing a network or file boundary needs runtime validation. This is the whole argument for zod at the edge.

**Declaration merging, decorators, `namespace` — do I need these?**
Not at mid level. Know they exist.

---

## React

**Why does a component re-render?**
State changed, props changed, parent re-rendered, or context value changed. Not because an object "mutated" — React compares references.

**What does the dependency array actually do?**
`Object.is` comparison against the previous render's array. Miss a dep and you close over stale values. Include an inline object or function and it changes every render.

**`useMemo` vs `useCallback` vs `React.memo`.**
Memo a value, memo a function, skip re-rendering a component when props are reference-equal. All three are useless if you're recreating props inline anyway. Default to not using them; add when you've measured.

**`useEffect` — when should you not use it?**
Deriving state from props (compute during render), responding to a user event (do it in the handler), transforming data for display. Most effects in most codebases shouldn't exist.

**Cleanup function — why?**
Cancels subscriptions and in-flight work. Runs before the next effect and on unmount. Skip it and you get memory leaks and state updates on unmounted components.

**`useState` vs `useReducer`.**
Reducer when the next state depends on the previous in non-trivial ways, or when several values change together. Also easier to test — it's a pure function.

**Why does state look stale inside a `setTimeout`?**
Closure captured the value at that render. Use the updater form `setX(prev => …)` or a ref.

**Keys in lists — what breaks without stable ones?**
React reconciles by position instead of identity. Reordering carries the wrong state into the wrong row. Index keys break the moment the list reorders.

**Controlled vs uncontrolled inputs.**
Controlled: value in React state, re-render per keystroke. Uncontrolled: DOM owns it, read via ref. Controlled by default; uncontrolled for large forms and file inputs.

**Context — what's the cost?**
Every consumer re-renders when the value changes, regardless of which field they read. Split contexts or memoize the value.

**How do you handle server state?**
Not with `useState` and `useEffect`. Apollo, React Query, or similar — they own caching, deduping, invalidation, and retries. Your tracker uses Apollo cache normalization. **[repo]**

**Optimistic updates — how do you roll back?**
Write the expected result to the cache immediately, keep the previous value, restore on error. **[repo]** — the `moveStage` mutation.

**Error boundaries — what do they catch?**
Render-phase errors in children. Not event handlers, not async code, not the boundary's own render.

**`useLayoutEffect` vs `useEffect`.**
Layout runs synchronously after DOM mutation, before paint. Use only when you're measuring the DOM and would otherwise flash.

**Suspense and concurrent rendering — one-line version.**
Suspense lets a component say "not ready" and show a fallback. Concurrent rendering lets React interrupt and resume work so urgent updates aren't blocked.

**How would you debug a slow list?**
Profiler first, don't guess. Usual causes: unmemoized props, unnecessary re-renders from context, rendering thousands of rows without virtualization.

---

## Node.js

**Node is single-threaded — so how does it handle concurrency?**
One JS thread, but I/O is delegated to libuv's thread pool and the OS. The thread is free while I/O is pending. CPU work does block it — that's the actual limitation.

**What do you do about CPU-heavy work?**
Worker threads, a separate service, or a queue. Not on the request path.

**`cluster` vs worker threads.**
Cluster forks processes to use multiple cores for request handling. Workers are threads sharing memory for CPU tasks.

**Streams — why care?**
Constant memory over arbitrary size, and backpressure. A file upload proxied through a stream doesn't buffer 2GB in RAM.

**Graceful shutdown — what does it involve?**
Catch SIGTERM, stop accepting new connections, finish in-flight requests, close DB pool and queue consumers, exit. With a hard timeout so you can't hang forever. **[repo]**

**Where does config come from?**
Environment, validated at boot with zod, fail fast on a bad value. Never read `process.env` scattered through the code.

**How do you trace a request across services?**
Correlation ID generated at the edge, propagated in a header, attached to every log line. **[repo]**

**Structured logging — why not `console.log`?**
JSON logs are queryable. pino, with levels, redaction of secrets, and the correlation ID in every entry.

**Middleware — what's the model?**
Ordered functions with access to request, response, and `next`. Order matters: logging early, auth before handlers, error handler last.

**How do you handle errors in async route handlers?**
Framework-dependent. Express needs the wrapper or v5; Fastify handles rejected promises. Map domain errors to status codes in one place, not per route.

**Memory leak in Node — how do you find it?**
Heap snapshots over time, compare retained objects. Usual suspects: unbounded caches, listeners never removed, closures held by long-lived arrays.

---

## REST and API design

**What actually makes an API RESTful?**
Resources as nouns, HTTP verbs for actions, stateless requests, meaningful status codes. Nobody in industry implements the full constraint set including HATEOAS, and saying so honestly is fine.

**Idempotency — which methods, and why do you care?**
GET, PUT, DELETE are idempotent; POST isn't. It's what decides whether a retry is safe. **[repo]** — your retry logic only retries idempotent calls.

**How do you make a POST idempotent?**
Client-supplied idempotency key, stored server-side, return the original result on replay. Payments do this.

**PUT vs PATCH.**
PUT replaces the whole resource, PATCH applies a partial change.

**Status codes you should never fumble.**
400 malformed, 401 not authenticated, 403 authenticated but not allowed, 404 not found, 409 conflict, 422 semantically invalid, 429 rate limited, 500 you broke it, 502/503/504 upstream problems.

**Pagination — offset or cursor?**
Offset is simple and drifts when rows are inserted mid-scroll; it also degrades on deep pages. Cursor is stable and scales, but you can't jump to page 40.

**How do you version an API?**
URL path is ugly and obvious and works. Header versioning is cleaner and harder to debug. The better answer is to version rarely and add fields additively.

**Rate limiting — where and how?**
At the edge. Token bucket for burst tolerance. Return 429 with `Retry-After`.

**Idempotent retries plus at-least-once delivery — what's the risk?**
Duplicate processing. You need dedup by message ID or a naturally idempotent handler.

---

## GraphQL

**Why GraphQL over REST here?**
One round trip for a screen that needs data from two services, client picks the fields, schema is the contract and types generate from it. Not a universal win — caching is harder and file upload is awkward.

**The N+1 problem — cause and fix.**
A field resolver runs per parent item, so 30 applications means 30 company fetches. DataLoader batches within a tick and dedupes by key. **[repo]** — cause it first, then fix it, so you can describe the before.

**Why must DataLoader be per-request?**
It caches. A shared loader would leak one user's data into another user's response and serve stale reads.

**How does a resolver chain work?**
Each resolver gets parent, args, context, info. Parent is whatever the field above returned. Default resolver just reads the property.

**Why can a GraphQL response be 200 with errors?**
Partial success is a first-class outcome. Failed fields go null, an `errors` array explains, the rest of the data still returns. **[repo]** — companies-svc down still renders the board.

**How do you do auth in GraphQL?**
Authenticate at the transport, put the user on context, authorize in resolvers or a schema directive. Not in the client.

**What stops a malicious query?**
Depth limiting, complexity scoring, timeouts, persisted queries in production. Introspection off in prod.

**Caching — what's harder than REST?**
One endpoint, POST, no URL to key on. You cache in the client's normalized store, per-resolver, or with persisted queries plus CDN.

**Schema design mistakes you'd flag in review.**
Nullable everything, exposing database columns one-to-one, mutations that return a bare boolean instead of the mutated object, no error type in the payload.

**Subscriptions — when?**
Genuine server-push. Polling is fine more often than people admit.

---

## BFF and architecture

**What is a BFF and why not just call the services directly?** **[repo]**
A backend owned by and shaped for one client. It aggregates, trims payloads, holds auth, and absorbs downstream failure. The frontend team changes it without cross-team negotiation. Direct calls push orchestration and secrets into the browser.

**BFF vs API gateway.**
Gateway is generic infrastructure — routing, auth, rate limiting, shared by everyone. BFF has business logic and is per-client. They coexist.

**When is a BFF the wrong call?**
Few clients with near-identical needs. Then you're maintaining duplicate backends for nothing. Also when nobody owns it — an unowned BFF becomes a second monolith.

**Where does the BFF end and the service begin?**
Services own domain rules and data. BFF owns presentation shape, aggregation, and client-specific concerns. If business logic drifts into the BFF, other clients get inconsistent behaviour.

**Why separate databases per service?** **[repo]**
Independent deploys and schema evolution, no coupling through shared tables. The cost is no joins and no cross-service transactions — you pay in aggregation code and eventual consistency. Be ready to say you felt that cost.

---

## Distributed systems

**What's the first thing you add to any network call?**
A timeout. The default of "wait forever" turns one slow dependency into a total outage as connections pile up.

**Retry strategy — the full answer.** **[repo]**
Exponential backoff with jitter, capped attempts, only on idempotent operations, only on retryable errors (timeouts, 502/503, not 400). Jitter matters because synchronized retries stampede the recovering service.

**Circuit breaker — the three states.** **[repo]**
Closed: traffic flows, failures counted. Open: fail fast without calling, protecting both sides. Half-open: let a probe through, close on success, re-open on failure. It stops you from queueing requests against a service that's already down.

**Retries and circuit breakers together — what's the danger?**
Retry amplification. Each layer multiplies load. Retry at one level, not every level.

**Graceful degradation — what does it look like?** **[repo]**
Board renders with `company: null` and a partial error when companies-svc is down. Core function survives, secondary data doesn't.

**Idempotency in message consumers.**
At-least-once delivery means duplicates. Dedup on message ID or make the handler naturally idempotent.

**What's a DLQ for?** **[repo]**
Messages that fail past `maxReceiveCount` go there instead of blocking the queue forever. You alarm on DLQ depth and replay after fixing.

**Visibility timeout — what breaks if it's wrong?**
Too short and another consumer picks up a message still being processed — duplicate work. Too long and a crashed consumer's message sits invisible.

**CAP — the practical version.**
Under a network partition you pick availability or consistency. Everything else is marketing. Most web systems pick AP and reconcile.

**Eventual consistency — how do you deal with it in the UI?**
Optimistic updates, read-your-writes via cache, or tell the user something is processing. Don't pretend it's synchronous.

**Saga / distributed transaction — one line.**
No two-phase commit across services. Local transactions plus compensating actions. Know the term.

**Idempotency key vs correlation ID vs trace ID.**
Idempotency key dedupes writes. Correlation ID ties logs for one request. Trace ID spans the whole distributed call graph.

---

## AWS

**SQS — standard vs FIFO.**
Standard: at-least-once, best-effort ordering, high throughput. FIFO: exactly-once processing within a group, ordered, lower throughput.

**SQS vs SNS vs EventBridge.**
SQS is a queue, one consumer group pulls. SNS is fan-out pub/sub. EventBridge is routing with content-based rules and schemas. You've used the last two. **[repo]**

**Lambda cold starts — what makes them worse?**
Large bundles, VPC attachment historically, heavy init. Mitigations: smaller package, provisioned concurrency, init outside the handler.

**When would you not use Lambda?**
Long-running work, steady high-volume traffic where EC2/Fargate is cheaper, workloads needing persistent connections.

**IAM — the model.**
Identity policies on principals, resource policies on resources. Deny wins. Roles over long-lived keys, always.

**Security group vs NACL.**
SG is stateful and instance-level. NACL is stateless and subnet-level. Return traffic needs an explicit rule on a NACL.

**RDS vs DynamoDB — how do you choose?**
Relational with ad-hoc queries and joins, or key-access patterns known up front with predictable scaling. DynamoDB punishes you for not knowing your access patterns.

**What goes in CloudWatch for a service you own?** **[repo]**
Structured logs, latency percentiles (p95/p99, not average), error rate, saturation signals. Alarms on the SLO, not on CPU.

**Why p99 and not average?**
Averages hide the tail. Your worst 1% of requests are somebody's every request.

---

## Testing

**Describe your test pyramid on this project.** **[repo]**
Many fast unit tests on pure logic, a middle layer of resolver and API integration tests with the network mocked, a thin layer of e2e on real user paths. Point at `docs/testing-strategy.md`.

**Vitest over Jest — why?**
Native ESM and TypeScript, reuses the Vite transform pipeline so config isn't duplicated, faster watch. Migration is mostly mechanical.

**Mock vs stub vs spy vs fake.**
Spy records calls. Stub returns canned values. Mock asserts on the interaction. Fake is a working lightweight implementation.

**What shouldn't you mock?**
The thing under test, and usually the database in integration tests — a real Postgres in Docker catches what an in-memory fake won't.

**Why MSW instead of mocking fetch?** **[repo]**
It intercepts at the network layer, so your code path stays real. The same handlers work in tests and in the browser.

**How do you test the retry logic without waiting?** **[repo]**
Fake timers. `vi.useFakeTimers()` and advance them.

**Flaky tests — how do you deal with them?**
Find the cause: shared state, real timing, test order dependence, network. Quarantine loudly, never silently retry into green. A retried-to-pass suite is a suite nobody trusts.

**Playwright auto-waiting — what does it remove?**
Explicit sleeps. Locators retry actionability checks until timeout. A fixed sleep is either too short (flaky) or too long (slow), never right.

**Playwright fixtures — what for?** **[repo]**
Reusable per-test setup with automatic teardown. Authenticated context is the classic one — log in once, reuse storage state.

**How do you keep e2e deterministic?**
Seed and reset data per spec, control time and randomness, isolate test users, don't depend on test execution order.

**Playwright vs Cypress — your actual opinion.** **[repo]**
Playwright for e2e: real cross-browser, parallelism, better trace tooling, less awkward async model. Cypress component testing is a nice fast visual loop. Running both usually means a migration in progress, not a choice.

**What do you test at the API layer vs the UI?**
Business rules, error codes, and edge cases at the API — cheaper and faster. UI e2e covers the few paths where the wiring itself is the risk.

**Coverage target?**
There isn't a right number. Gate against regression rather than chasing a figure; 100% coverage with weak assertions proves nothing.

**Test names — what makes a good one?**
It states the behaviour and the condition, so a failure tells you what broke without opening the file.

---

## CI/CD

**Walk me through your pipeline.** **[repo]**
lint → typecheck → unit → build → e2e against docker-compose → manual approval → deploy. Fast checks first so failures come back in a minute, not twenty. Two lanes on the tracker: Actions gates every PR on GitHub's runners, Buildkite carries the sharded Playwright run on a self-hosted agent.

**Why split e2e into its own step?**
It's slow and needs a running stack. Parallelize it, keep the fast feedback loop fast, and upload traces as artifacts on failure.

**Buildkite's model — what's distinctive?**
Hosted control plane, agents run in your infrastructure. Your source and secrets never leave your environment. That's the pitch, and it's the answer they want.

**Buildkite vs GitHub Actions — when would you pick each?** **[repo]**
Actions for zero infrastructure, free runners, and config living beside the code — it's the default until something forces you off it. Buildkite when you need the build to run inside your own network: agents on your hardware, so source and secrets never leave, and you size your own machines. That's the compliance argument, and it's why regulated shops pick it. I ran both on the tracker — Actions gates the PRs, Buildkite does the sharded e2e.

**GitHub Actions — the mental model.** **[repo]**
Workflows triggered by repo events, each a DAG of jobs, jobs sequenced with `needs:`, steps inside a job sharing a runner and workspace. Matrix for fanning a job across versions, `concurrency` with `cancel-in-progress` so a re-push doesn't run twice, artifacts to move files between jobs.

**How do you make a CI run faster?** **[repo]**
Cache the dependency install, shard the slow suite across parallel jobs, run fast checks first so failures come back in a minute, and cancel superseded runs. Measure a cold run against a warm one before claiming a cache helped.

**Actions security — what do you get wrong by default?**
Over-scoped `GITHUB_TOKEN` — set `permissions:` explicitly rather than leaving write-all. Pin third-party actions to a SHA, not a tag, because a tag can be moved under you. And `pull_request_target` runs with secrets against untrusted code, which is the classic foot-gun.

**Jenkins declarative vs scripted.**
Declarative is a structured `pipeline` block with validation and better tooling. Scripted is Groovy with full control and full rope.

**Where do secrets live?**
Secret manager, injected at runtime, scoped per environment, never in the repo and never echoed into logs. Rotate.

**Blue-green vs canary vs rolling.**
Blue-green: two full environments, flip traffic, instant rollback. Canary: small traffic slice first, watch metrics, ramp. Rolling: replace instances gradually, cheapest, slowest to roll back.

**How do you roll back?**
Redeploy the previous immutable artifact. Which means artifacts must be immutable and versioned, and migrations must be backward-compatible — that's the part people forget.

**Backward-compatible migrations — what's the pattern?**
Expand then contract. Add the new column, deploy code writing both, backfill, switch reads, remove the old column in a later release.

**What makes a build reproducible?**
Pinned dependencies via lockfile, pinned base images by digest, no `latest`, no network-dependent build steps.

**Trunk-based vs GitFlow.**
Trunk-based with short-lived branches and feature flags suits continuous delivery. GitFlow suits versioned releases. Long-lived branches mean painful merges either way.

---

## Incidents, on-call, RCA

**Walk me through an incident you handled.** **[repo]**
Use one of your three game-day incidents. Structure: what alerted, what you saw, what you ruled out, what you did to mitigate, when it recovered, what the root cause turned out to be, what changed afterward. Mitigate first, diagnose second — say that explicitly.

**Detection, mitigation, resolution — what's the difference?**
Detection is knowing. Mitigation is stopping user pain, often a rollback or a feature flag. Resolution is fixing the underlying cause, and it can wait until business hours.

**What makes a good alert?**
Actionable, tied to user impact, with a runbook link. Alerting on CPU pages you at 3am for nothing. Alerting on error-rate SLO burn pages you when users are actually hurting.

**What's an error budget?**
The allowed unreliability under your SLO. Budget left means ship. Budget burned means stop shipping features and fix reliability. It turns an argument into arithmetic.

**Blameless postmortem — why blameless?**
People hide information when they expect punishment, and hidden information means the same failure recurs. Blame the system that let a human error reach production.

**What goes in an RCA?** **[repo]**
Summary, user impact with numbers, timeline with timestamps, root cause, contributing factors, what went well, what didn't, action items with owners and dates. Unowned action items are decoration.

**Five whys — demo it.**
Use incident #3 from your game day. Do it live, don't recite a definition.

**What's a good on-call handover?**
Open incidents, anything degraded, recent deploys, known noisy alerts, anything you silenced and why.

**Your alarm didn't fire during an incident. What now?**
That's a finding, and it goes in the RCA as an action item. Missing detection is usually a bigger problem than the bug itself. **[repo]** — this happens in incident #3 by design; don't hide it, lead with it.

---

## Git, GitHub, Agile

**Merge vs rebase.**
Merge preserves history and adds a commit. Rebase rewrites for a linear history. Never rebase a branch other people are on.

**How do you find the commit that broke something?**
`git bisect`.

**Undo a commit already pushed to a shared branch.**
`git revert`. Reset rewrites history others have.

**What makes a good PR?**
Small, one concern, description explaining why not what, tests included, self-reviewed first. If it needs a synchronous walkthrough to be reviewable, it's too big.

**Branch protection — what do you turn on?**
Required review, required status checks, no force push to main, linear history if you want it.

**Scrum ceremonies and what they're for.**
Planning commits to the sprint, standup surfaces blockers, review shows working software, retro changes how the team works. Standup is not a status report to a manager.

**Story points — why not hours?**
Relative complexity, so the estimate survives being done by a different person. Velocity emerges rather than being negotiated.

**What's in your definition of done?**
Merged, tested, reviewed, deployed to staging, docs updated, acceptance criteria met. Whatever the team agreed — the point is that it's written down.

**How do you handle a story that's too big mid-sprint?**
Raise it same day, split it, move the remainder. Don't quietly carry it over.

---

## Behavioural

Prepare three stories in advance. Each should be two minutes spoken, with a number in it somewhere.

**A hard technical problem you solved.**
Your N+1 and the resilience layer both work. Include the measurement — requests before and after.

**A time you disagreed with a decision.**
Real one, and end with what you did after the decision went against you.

**A mistake you made.**
Own it flatly, then the systemic fix. "I shipped a bug" is weak. "I shipped a bug because nothing in CI would have caught it, so I added the test that would have" is the answer.

**Why are you leaving your current role?**
"My position was eliminated in a layoff in July." Flat, no apology, no over-explaining, move on. Don't editorialize about the company. If they push, one sentence on scope of the layoff and then redirect to what you've built since.

**What have you been doing since?**
This is the good question and you have a good answer — a fullstack build covering Node, GraphQL BFF, testing and CI, plus the AWS event-driven build before it. Say that you used the notice period to close the gaps between frontend and fullstack.

**Where do you see yourself in three years.**
Something specific and true. Vague ambition reads as unprepared.

**Questions to ask them.**
How does on-call work here. What does the deploy pipeline look like and how long from merge to production. What's the test strategy. What broke most recently and what changed after. These signal seniority and get you real information about whether the place is functional.

---

## Console runtime and micro-frontends

The L3 scope says "Console Runtime." Expect at least one question here and prepare for it properly, because most candidates won't.

**What is a console runtime?**
A host shell that loads feature modules owned by different teams into one application. It owns auth, layout, routing, telemetry, and the shared dependency versions. Modules own their own features and deploy independently.

**Why split a console that way instead of one app?** **[repo]**
Independent team ownership and independent deploy cadence — a team ships their module without a coordinated release. Failure isolation, so one module's error boundary doesn't blank the console. And a shared shell so it still feels like one product.

**What does it cost?**
Version skew on shared dependencies (two React copies is the classic disaster), harder end-to-end type safety across the boundary, slower initial load if you're not careful with the shared chunk, and a shell that becomes a bottleneck the moment product logic starts accreting in it.

**Module Federation — one line.**
Webpack/Rspack feature for loading remote modules at runtime with shared dependency negotiation. Know what it does. Alternatives are build-time composition, or runtime import of independently deployed bundles.

**How do modules share state?**
They mostly shouldn't. The shell exposes a narrow contract — auth, user, feature flags, navigation. Anything wider and you've recoupled the teams you just decoupled.

**How do you keep the console feeling like one product?**
A shared design system as a versioned package, layout owned by the shell, and a contract test in CI that fails if a module violates it.

**How do you version the shell-to-module contract?**
Additive changes only, deprecate before removing, and give modules a window to migrate. Same discipline as an API, because it is one.

**One module is slow / broken. What does the user see?**
Error boundary per module, so the rest of the console works. That's a design decision you should have made deliberately, not discovered.

**How do you test across modules?**
Unit and component tests inside the module. Contract tests on the shell boundary. A small number of Playwright specs against the assembled console, because that's the only place integration failures surface.

---

## Production bug triage

Required line in the JD. Have a procedure, not a vibe.

**Walk me through triaging a production bug.** **[repo]**
Reproduce first — if I can't, that's finding number one and I go to logs and the user's exact context. Scope it: how many users, which paths, since when, correlate against recent deploys. Classify severity on user impact. Localize using the correlation ID across shell, BFF and downstream. Then mitigate before fixing — rollback or feature flag if it's severe — and write the ticket with repro steps, expected, actual, scope, and evidence.

**You can't reproduce it. Now what?**
Logs for that correlation ID, the user's browser and auth state, feature flag values, whether it's one tenant or many. Non-reproducible usually means a state or timing dependency you haven't identified yet, so look for concurrency and caching.

**How do you decide severity?**
User impact and blast radius, not how annoying the bug is to fix. Money, data loss, and blocked core workflows are top. A cosmetic issue on a rarely-used screen isn't a page.

**Is it the frontend or the backend?**
Network tab and the correlation ID answer it in a minute. If the BFF returned correct data and the UI shows wrong data, it's yours. This is the payoff for structured logging.

**When do you fix forward vs roll back?**
Roll back by default when the cause isn't obvious and impact is live. Fix forward when the rollback is riskier than the bug — usually because of a migration.

---

## Framing yourself for L3

This is an individual-contributor role. Don't perform seniority you weren't hired for — it reads as mismatched.

**What they're screening for:** you can take a feature from design through test to deploy without hand-holding, you write tests as part of the work rather than after, you can be trusted in a rotation, and you're straightforward in a code review.

**Adjust these instincts:**

- When asked about a project, lead with what you built and the decisions you made, not team dynamics.
- Mentoring the two interns at Penta is a good story, but frame it as ownership and communication, not management. L3 doesn't want a manager.
- "Full ownership" in the JD means end to end on a feature, including its tests, its deploy, and its bugs at 2am. Say something that shows you get that.
- Backlog refinement and standups are listed — you're expected to participate meaningfully, which means raising blockers early and pushing back on underspecified stories. Have an example.

**Code review questions to expect.**
What do you look for in a review. How do you give critical feedback. How do you respond to it. What do you do when a reviewer is wrong. Short honest answers; this is a temperament check.

**Technical writing is a listed responsibility.**
Your ADRs, RCAs, runbook, testing strategy and triage doc are all evidence. Mention that the repo has them. Most candidates have a README.

---

## What to do the day before an interview

Reread your own ADRs and RCAs, not this file. The strongest thing you have is specific decisions you made and can defend. Generic answers are what everyone else brings.
