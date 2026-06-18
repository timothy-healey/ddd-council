# Verb: events

*Mode: both (design ↔ critique) · Lens: tactical · Reads: one bounded context's code +
`DOMAIN.md` (and the `aggregate` artifact when present).*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room reasons each transition aloud and teaches why it is (or isn't) a domain
> event; in `brief` it states the per-root map and writes the artifact.

**The event surfacer.** `aggregate` names the roots and the transitions they undergo; this
verb assesses which of those transitions publish a **domain event** — the named business
moment (`Shipped`, `Cancelled`, `Refunded`) that announces a meaningful state change. It
lands the §D *missing domain events* signal and cites the §C *CRUD masking intent* smell.
This is the last vertebra of the tactical spine.

## Mode — critique by default, design from intent

Runs in **both** modes (SKILL.md → *Lens*, design-vs-critique axis):

- **Critique (default):** read the context's real event surface and assess what it
  *actually* publishes — every claim cites a `file:symbol`.
- **Design (`--design`, or when no code yet expresses events):** propose the events that
  *should* exist from operator intent — especially apt here, since events are often absent.
  The proposed events are flagged as recommendations, not cited.

## Input & scope

Tactical lens — **narrow and deep** (see `reference/tactical.md`).

- `events <context>` — assess the events published across **all** aggregate roots in the
  context.
- `events <context>/<Root>` — zoom to one root's published events.

**Prefer the `aggregate` artifact for the roots.** If `docs/aggregate-<context-slug>-<date>.md`
exists, its **roots** are the starting set. The artifact carries no transitions list (only
root · invariant · consistency boundary · composition), so **derive the state transitions
from code** — the artifact's invariant enforcement sites and consistency boundary point at
where the state changes, which is where a published event is expected. If no artifact, derive
both roots and transitions from code. A prior `aggregate` run is **not** required.

**Domain-significant only.** Assess meaningful business moments, not every field write. In a
context with no event mechanism at all, do not flag every mutation as a missing event —
surface the transitions the operator confirms are domain moments.

**Prerequisite.** The context must be named and bounded. If the boundary is still fuzzy, drop
back to `boundaries`/`map` first — *strategic before tactical* is a shared law.

**Fallbacks:**
- No `DOMAIN.md` → offer `init` first.
- Target context isn't bounded / isn't in `DOMAIN.md` → redirect to `boundaries`.

## Signals

Work from `reference/signals.md`:

- **§D — missing domain events** (this verb owns it): a domain-significant state transition
  that emits no event.
- **§C — CRUD masking intent** (cited here, not duplicated): a generic setter / `updateStatus`
  where a named domain operation + event belongs.

**Discriminator:** §C fires when a named operation exists but is **misnamed** (the event is
there, wearing a CRUD name); §D fires when **no event is emitted at all**. Where one CRUD
call is both (a misnamed setter that also publishes nothing), cite **both**.

Each finding traces to its signal id and cites a code location. The other §D signals belong
to other verbs; don't raise them here.

## The model — the positive result

Even with zero findings, this verb produces a model: one block **per aggregate root**, cited
to code (critique) or flagged as proposed (design):

- **Root** — the aggregate root whose events this block assesses (`file:symbol`).
- **Published events** — for each: the **event name**, the **state transition / business
  moment** it signals, **where it's raised** (`file:symbol`), and whether it's a **named
  event vs a CRUD flip**.
- **Unvoiced transitions** — domain-significant transitions the root undergoes that publish
  **no** event. These seed the *missing domain events* finding.

Each entry carries its **rationale** — the code evidence behind the call.

## How it runs

1. **Acquire** the roots and their transitions — take the **roots** from the `aggregate`
   artifact if present, else derive them; **derive the transitions from code** either way
   (the artifact's enforcement sites + consistency boundary are hints, not a transitions
   list). Then read the event surface at DDD altitude — where events are raised/published,
   what names they carry, which transitions announce nothing.
2. **Build the per-root map** — for each root: its published events (name, moment, raise
   site, named-vs-CRUD) and its unvoiced domain-significant transitions.
3. **Flag missing domain events (§D)** — a business moment that emits nothing; severity by
   blast radius (how much downstream is blind to it); a citation. The fix may be a *refactor*
   (a named operation already exists — make it raise the event) or a genuine *addition* (no
   such operation yet) — name which, per *refactor before you add*.
4. **Flag CRUD masking intent (§C)** — a generic setter / `updateStatus` where a domain verb
   belongs; cite the §C entry; apply the discriminator (name present but wrong → §C; nothing
   emitted → §D; both → cite both).
5. **Pause** for the operator on each genuine fork ("is this transition a business moment
   others should hear about?") — intent is canon.

In **design mode**, steps 2–4 propose the events that *should* exist from intent (flagged)
rather than deriving and citing them.

## Output & loop

Write `docs/events-<context-slug>-<date>.md` — same snapshot-not-ledger rule as `critique`
(same target + date overwrites). Frontmatter carries a stable artifact `id`. The file has two
parts:

- **Model** — the per-root published-events map above.
- **Findings** — §D/§C anti-patterns as `### F<n> [severity] <signalId> — <title>` with a
  `status` field, using the `Finding` shape in `cli/src/finding.mjs` — identical to
  `critique`. Findings **round-trip through `remediate`**
  (`open | resolved | deferred | escalated`).

## The seams

- **Back to `aggregate`.** `aggregate` names the roots, the consistency boundary, and the
  invariant enforcement sites — the latter two point at where state changes, but the artifact
  carries no transitions list. This verb takes the roots from the artifact when present and
  **derives the transitions from code**, then checks which announce a domain event and which
  fall silent.
- **To `boundaries` (strategic).** An event that crosses a context line becomes an
  **integration contract** — who consumes it, is its shape a stable published surface. That
  is `boundaries`' job. `events` notes the seam and stays tactical.
- **End of the tactical spine.** `events` is the last vertebra; after it the §D catalog has
  no stubs left.

## Room framing

- **Engineer leads** — for each transition: what changes, does it publish, is the name a real
  domain verb or a CRUD flip? Calls out a status set that should be a named event.
- **Architect** guards the altitude — events *within* the context; an event crossing a
  context line is an integration contract for `boundaries`; no messaging-infra / delivery /
  event-sourcing concerns.
- **Domain expert(s)** confirm a transition is a real business moment worth announcing — not
  every field write is an event.
- **Operator** is canon — on which moments matter and on apply/defer.

## Guardrails

- Cite or cut — in critique mode every block and every finding points at code.
- Map every root — a root left without an event verdict is a gap, not a blank.
- Domain-significant only — surface business moments, not every setter.
- Refactor before you add — make an existing operation raise the event where one exists;
  propose a net-new event only when no operation carries the moment yet.
- Stay at DDD altitude — which moments are named and announced, not how events are
  transported; cross-context contracts are `boundaries`.
- The operator rules on intent; the room recommends, flagged.
