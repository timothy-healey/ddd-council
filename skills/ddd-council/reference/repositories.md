# Verb: repositories

*Mode: both (design ↔ critique) · Lens: tactical · Reads: one bounded context's code +
`DOMAIN.md` (and the `aggregate` artifact when present).*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room reasons each root's persistence aloud and teaches why one repository
> per aggregate root holds; in `brief` it states the per-root map and writes the artifact.

**The persistence assessor.** `aggregate` draws the boundary and names the root; this verb
checks how that root **persists**. DDD's rule: **one repository per aggregate root**,
dealing in *whole aggregates* — not one repository per entity, and not with domain
decisions smeared into the application/service layer. It lands the §D *repository-per-entity*
and *domain logic in the application/service layer (persistence seam)* signals.

## Mode — critique by default, design from intent

Runs in **both** modes (SKILL.md → *Lens*, design-vs-critique axis):

- **Critique (default):** read the context's real persistence and assess what it
  *actually* implements — every claim cites a `file:symbol`.
- **Design (`--design`, or when no code yet expresses persistence):** propose how each root
  *should* persist from operator intent. The proposed shape is flagged as a recommendation,
  not cited.

## Input & scope

Tactical lens — **narrow and deep** (see `reference/tactical.md`).

- `repositories <context>` — assess persistence across **all** aggregate roots in the
  context.
- `repositories <context>/<Root>` — zoom to one root's repository.

**Prefer the `aggregate` artifact.** If `docs/aggregate-<context-slug>-<date>.md` exists,
its roots are the repositories to expect (one per root), and its *inside-vs-referenced*
composition defines what a *whole aggregate* is — the unit a repository should load and
save. If it doesn't exist, derive both from code. A prior `aggregate` run is **not**
required.

**Read persistence at DDD altitude only.** Identify the repository interface, its keying,
and whether it returns/saves whole aggregates. Do **not** audit SQL correctness, query
performance, indexing, or N+1 — those are off-altitude for DDD.

**Prerequisite.** The context must be named and bounded. If the boundary is still fuzzy,
drop back to `boundaries`/`map` first — *strategic before tactical* is a shared law.

**Fallbacks:**
- No `DOMAIN.md` → offer `init` first.
- Target context isn't bounded / isn't in `DOMAIN.md` → redirect to `boundaries`.

## Signals

Work from `reference/signals.md`:

- **§D — repository-per-entity** (this verb owns it): a repository keyed to a child entity
  or value object instead of the aggregate root, or fragment persistence bypassing the root.
- **§D — domain logic in the application/service layer (persistence seam)** (this verb owns
  it): a domain decision encoded in service orchestration or query logic. Apply the
  discriminator — a data-class root + `*Service` is *anaemic domain model* (owned by
  `aggregate`), not this; this signal needs a query- or orchestration-embedded rule. Where
  the same code trips both, cite anaemic-model.

Each finding traces to its signal id and cites a code location. The other §D signals belong
to other verbs; don't raise them here.

## The model — the positive result

Even with zero findings, this verb produces a model: one block **per aggregate root**,
cited to code (critique) or flagged as proposed (design):

- **Root** — the aggregate root whose persistence this block assesses (`file:symbol`).
- **Repository** — the repository that persists it (`file:symbol`); or **none** (persistence
  is ad-hoc / inline) or **multiple** (more than one access path). Both *none* and
  *multiple* are findings, not blanks.
- **Access surface** — the finders / save / delete it exposes (the collection-like interface
  onto the root).
- **Deals in whole aggregates?** — does it load/save the root with its inside-composition as
  one unit, or persist fragments?
- **Keyed one-per-root?** — one repository per root (correct) vs scattered across children.

Each entry carries its **rationale** — the code evidence behind the call. A root whose
persistence contradicts the rule is the seed of a finding.

## How it runs

1. **Acquire** the roots and their composition — read the `aggregate` artifact if present
   (roots + inside-vs-referenced); else derive from code. Then read the persistence layer at
   DDD altitude: the repository interfaces, what they expose, how they key, whether they
   load/save whole aggregates.
2. **Build the per-root map** — for each root: its repository (or none/multiple), access
   surface, whole-aggregate handling, keying.
3. **Flag repository-per-entity (§D)** — a repository keyed to a child / value object, or
   fragment persistence bypassing the root; severity (blast radius) and a citation. The fix
   is a *refactor* — fold the child access into the root's repository.
4. **Flag domain logic in the application/service layer — persistence seam (§D)** — domain
   decisions in service orchestration or query logic; apply the discriminator (a setter-bag
   root + `*Service` is anaemic-model, not this); where it coincides, cite anaemic-model.
   The fix is a *refactor* — move the decision onto the aggregate.
5. **Pause** for the operator on each genuine fork ("is this service orchestration or leaked
   domain logic?", "is this child meant to be its own root?") — intent is canon.

In **design mode**, steps 2–4 propose the persistence shape from intent (flagged) rather
than deriving and citing it.

## Output & loop

Write `docs/repositories-<context-slug>-<date>.md` — same snapshot-not-ledger rule as
`critique` (same target + date overwrites). Frontmatter carries a stable artifact `id`. The
file has two parts:

- **Model** — the per-root repository map above.
- **Findings** — §D anti-patterns as `### F<n> [severity] <signalId> — <title>` with a
  `status` field, using the `Finding` shape in `cli/src/finding.mjs` — identical to
  `critique`. Findings **round-trip through `remediate`**
  (`open | resolved | deferred | escalated`).

## The seams

- **Back to `aggregate` / `entities`.** `aggregate` names the roots and the
  inside-composition; `entities`/`value-objects` says which types are *inside* a root (so a
  repository for one of them is a per-entity finding). This verb checks each root has **one**
  repository dealing in the **whole** aggregate. It consumes the `aggregate` artifact when
  present.
- **Forward to `events`.** The domain events an aggregate publishes are the next verb; this
  verb owns persistence shape only.
- **To the detector (Track B), not yet built.** This verb does **no** schema/migration
  parsing and does **not** detect the accidental-shared-table kernel — that's the engine's
  mechanized job. When Track B ships, `repositories` consumes its shared-table findings the
  way `critique` consumes engine findings, through the shared `Finding` shape.

## Room framing

- **Engineer leads** — for each root: what persists it, is it one repository, does it return
  and save the whole aggregate, what logic leaked into the service or the query? Calls out a
  per-entity repository and a fragment save.
- **Architect** guards the altitude — persistence *shape* (one root, one repository; whole
  aggregates), not query tuning; persistence is this verb, events are `events`.
- **Domain expert(s)** confirm a rule embedded in a service or query is real domain logic
  (belongs on the model) vs incidental application plumbing.
- **Operator** is canon — on each fork and on apply/defer.

## Guardrails

- Cite or cut — in critique mode every block and every finding points at code.
- Map every root — a root left without a persistence verdict is a gap, not a blank.
- Refactor before you add — folding child access into the root's repository, or moving a
  rule onto the aggregate, is a refactor; propose a new repository only when a root genuinely
  lacks one.
- Stay at DDD altitude — persistence shape, not SQL/performance; events are a later verb.
- The operator rules on intent; the room recommends, flagged.
