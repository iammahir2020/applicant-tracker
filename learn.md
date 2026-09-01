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

## Entry 1 — 2026-09-01 — Step 1 (monorepo skeleton), and re-planning how this gets taught

**Where we were.** Nothing built. Two planning documents, a spine (`step.md`), and a set of ground rules. Step 1 was the repo itself: git, folder layout, npm workspaces, pushed to GitHub.

**Concepts taught.**

*Monorepo vs polyrepo.* One repository holding all deployables, versus one repository each. The distinction people fumble is that a monorepo is not a monolith — a monolith is one deployed process, a monorepo is one place to keep source for many independently deployed processes. The value is atomicity: a change spanning two services is one PR, one review, one commit, with no window where the system is half-updated. The concrete version for this repo: change the GraphQL schema and the frontend types break **in CI, at compile time, before merge** — where in a polyrepo the same change breaks at runtime, in production, in the gap between two deploys. "Compile time instead of runtime" is the phrase worth keeping.

The costs, which is the half interviewers actually probe: no per-service versioning; CI naively runs everything on every change (solvable — it's why Turborepo and Nx exist); repo permissions are all-or-nothing; the repo only grows. And the big one — **nothing physically enforces the service boundaries.** In a polyrepo `services/applications` *cannot* import from `services/companies` because the code isn't on the machine. In a monorepo it's one autocompleted import away, it compiles, tests pass, and then the service is deployed alone and dies. Boundaries become a social agreement enforced by lint rules rather than a physical fact.

*npm workspaces.* A `workspaces` glob in the root `package.json`; one `npm install` at the root does three things — hoists every dependency into a single root `node_modules` (one copy of `fastify`, not four), symlinks each workspace into `node_modules/@tracker/*` so local packages import by name with no registry, and produces exactly one `package-lock.json` pinning the whole tree. The trade-off is *phantom dependencies*: a flat hoisted `node_modules` means a package can import something it never declared, which works locally and fails when that package is built alone in a container. That is the entire reason pnpm exists.

*Runtime pinning.* `.nvmrc` tells the machine which Node to use (and CI reads it via `node-version-file`). `engines` tells npm which Node the package claims to support — and by default it only *warns*; `engine-strict=true` in `.npmrc` makes it a hard failure.

**What he built.** `git init` on `main`. Layout: `apps/web`, `services/{bff,applications,companies,events-worker}`, `infra/`, `docs/decisions/`. Root `package.json` — private, `workspaces: ["apps/*", "services/*"]`, `type: module`, `engines.node: ">=22"`. Five workspace `package.json` files, all `private`, scoped `@tracker/*`. `.gitignore`, `.nvmrc` (22), `.npmrc` (`engine-strict=true`). Pushed to `github.com/iammahir2020/application-tracker`.

**Decisions made, and why.** npm workspaces over pnpm/Turborepo/Nx — same reasoning as no-ORM: don't adopt the tool that hides the mechanism before feeling the problem it solves. Scoped `@tracker/*` names to namespace against the public registry. `private: true` everywhere, since nothing here is ever published. `type: module` — ESM throughout. `packages/*` deliberately left out of the workspaces glob until Step 5 creates it. Node 20 → 22, because Node 20 reached end-of-life in April 2026 and shipping a portfolio repo pinned to an unsupported runtime is a bad look.

**What went wrong.** Two things, and the second one matters more.

The first: `"name:"` — a colon inside the quoted key — in all six `package.json` files. JSON has no schema, so this is valid JSON with a meaningless field called `name:` and no `name` at all. npm silently fell back to **directory names**, producing `node_modules/bff` instead of `node_modules/@tracker/bff`. No error, anywhere. The lockfile even *looked* right at the top (`"name": "applicant-tracker"`) — but that was the same directory-name fallback, coincidentally matching because the folder happens to be called that.

The second, which is the actual lesson: after fixing the five workspace files, the verification check (`ls -l node_modules/@tracker`) went **green while the root `package.json` was still broken**, because workspace symlink names come from each workspace's own `name` field and the root's name plays no part. Green check, plausible generated file, real defect underneath. It then got committed and pushed twice more before `npm pkg get name` returning `{}` settled it. The habit that failed wasn't typing — it was re-checking against actual output instead of against memory of what had been fixed. `npm pkg get name --workspaces` asks npm what it actually thinks, rather than reading what you meant to write.

**Review notes.** Layout, scoping, privacy flags and the workspaces glob were all correct first time. The `engines` field went on the root only, which is right — one runtime contract, stated once.

**The re-plan, and why.** After Step 1, Mahir called out that the teaching was going too deep into things that don't appear in day-to-day work or in interviews — npm internals, git's treatment of empty directories, POSIX trailing newlines. He was right, and the evidence was in his own question bank: of the 34 `[repo]`-marked questions, **none** are about npm, workspaces, `package.json`, or hoisting. A full session went into a directory skeleton that `step.md` itself labels "Answers: nothing yet — foundation."

The correction is not *less depth* — it's depth allocated by interview yield. Introduced a three-tier system, now recorded in `CLAUDE.md` and tagged onto every step in `step.md`:

- **Tier A** (5, 13–20, 23–24, 26, 28, 30, 37–40) — the interrogation surface, ~28 of the 34 `[repo]` questions. Full loop, he writes all of it, explain-back every time. These get *more* depth than before, not less.
- **Tier B** (6–12, 21–22, 25, 27, 29, 33–36) — shape and commands, correctness-only review, no explain-back. **Depth on demand**, at his request: he asks, and that piece gets the full Tier A treatment, then it drops back. He controls the dial.
- **Tier C** (2, 3, 4, 31, 32, plus Dockerfiles, codegen and lint config) — Claude writes them. But since "walk me through your pipeline", "Buildkite vs Actions" and "how do you make CI faster" are all `[repo]` questions, each Tier C artifact comes with a **three-sentence narrative he must be able to say out loud**. Claude writes the file; Mahir owns the answer.

Cut entirely: mechanism-of-the-tool teaching, the "what did people do before this existed" history padding, and all cosmetic review notes (Prettier's job from Step 2 on).

Two steps were unassigned in the original proposal and got resolved here: **Step 5 → Tier A**, because four `[repo]` TypeScript questions live in it and its `Result<T,E>` feeds both the DataLoader wrapper and the resilience layer; **Step 33 → Tier B**, built lightly but with the narrative owed.

**Interview questions this now answers.** "Why a monorepo, and what does it cost you?" — with the GraphQL-schema-breaks-frontend-types example and the boundary-enforcement cost. Nothing else; Step 1 is foundation by design, which is precisely what the re-plan is a reaction to.

**Still open.** Explain-back on question 2 ("what happens on disk during a workspace install") was answered honestly as "I don't know this in detail" and was reframed as a filesystem exercise — then overtaken by the re-plan, which cuts that material as low-yield. Not returning to it. `infra/` and `docs/decisions/` are empty so git isn't tracking them; they appear when they get contents. GitHub repo is `application-tracker` while the project is `applicant-tracker` — rename at some point or don't. Next: Step 2, Tier C — Claude writes the TypeScript, ESLint and Prettier configs; Mahir gets the strict-mode narrative and runs two commands.

---
## Entry 2 — 2026-09-01 — Step 2: TypeScript strict baseline and tooling (Tier C)

**Where we were.** Repo skeleton done and pushed. First step run under the new tier system, and the first Tier C step — Claude writes the config, Mahir owns the narrative rather than the syntax.

**What Claude wrote.** `tsconfig.base.json` at the root with the shared compiler options; five per-package `tsconfig.json` files that extend it and add only what differs (`types: ["node"]` and `rootDir`/`outDir` for services; DOM libs, `jsx: react-jsx` and `noEmit` for the web app). `eslint.config.mjs` — flat config, type-aware. `.prettierrc.json` and `.prettierignore`. Root scripts: `lint`, `lint:fix`, `typecheck`, `format`, `format:check`. Placeholder `src/index.ts` in each package so `tsc` has inputs; these get replaced from Step 6.

**The narrative he owes.** One base tsconfig extended by each package, so a compiler setting changes in one place rather than six. ESLint runs type-aware via `projectService`, which is what makes `no-floating-promises` possible at all — a linter with no type information cannot know an expression returns a promise. Prettier owns formatting and `eslint-config-prettier` sits last in the config chain switching off every stylistic ESLint rule, so the two never fight.

**Decisions made, and why.**

- **TypeScript pinned to `~6.0.3`, not the latest 7.0.2.** `npm view typescript-eslint peerDependencies` gives `typescript: '>=4.8.4 <6.1.0'`, and there is no typescript-eslint v9 on the registry yet. The choice was TS 7 with no type-aware linting, or TS 6 with a working one. Took TS 6: type-aware linting catches unhandled promises, which is the most common real Node bug, and that outweighs being one major ahead. Reverses as soon as typescript-eslint ships TS 7 support. Ordinary ecosystem-lag trade-off and a fine thing to be asked about.
- **`noUncheckedIndexedAccess` on**, which `strict` does *not* include. Without it `arr[5]` is typed `T` even when the array is empty — TypeScript is simply lying. With it you get `T | undefined` and have to handle the gap. Good answer to "what does strict mode not turn on?"
- **`exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `isolatedModules`, `moduleDetection: force`** — the last three are what `tsc --init` now recommends by default.
- **`no-restricted-imports` enforcing the service boundary.** In Step 1's explain-back the cost of a monorepo was identified as "nothing physically stops one service importing another." This turns that into a lint error: `services/*` and `apps/*` may not import each other's `@tracker/*` packages, nor reach across with a relative path. Worth pointing at directly — "I knew the boundary was only social, so I made CI enforce it."
- **No `declaration`/`declarationMap`.** These are private applications, not published libraries; emitting type declarations buys nothing.

**What went wrong.** The install command was given as `npm install -D -w .`, which fails with `No workspaces found: --workspace=.` — the repo root is not itself a workspace, so a root install just omits `-w` entirely.

**Verification, and why it mattered.** Both scripts passed first run — but the only files in the repo were `export {};` placeholders, so a green lint proved nothing. Exactly the failure mode from Step 1, where a passing check sat on top of a real defect. Wrote three throwaway probe files to confirm the config actually bites: an unchecked index access (typecheck error), a floating promise (`no-floating-promises`), and a cross-service import (`no-restricted-imports`). All three fired; probes deleted. **The general lesson, now twice in two steps: a check is worthless until you have watched it fail.**

**Interview questions this now answers.** "What does `strict: true` turn on, and what doesn't it?" — with `noUncheckedIndexedAccess` as the specific answer to the second half. "How do you keep ESLint and Prettier from fighting?" Partially: "how do you enforce architectural boundaries in a monorepo?"

**Still open.** Step 3 (GitHub Actions, Tier C) next, so that PRs are gated from here on. Step 4 (docker-compose) deferred until just before Step 7, the first step that needs a database. Then Step 5, the first Tier A step.

---
