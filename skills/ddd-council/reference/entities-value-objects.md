# Verb: entities / value-objects

*Mode: both (design ↔ critique) · Lens: tactical · Reads: one bounded context's code +
`DOMAIN.md` (and the `aggregate` artifact when present).*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room reasons each type aloud and teaches why it falls on the identity or
> the value side; in `brief` it states the two lists and writes the artifact.

> **One verb, two names.** `entities` and `value-objects` are the same playbook — two
> doors onto one question. Either invocation classifies an aggregate's composition along
> the identity-vs-value axis and emits both lists.

**The composition sorter.** `aggregate` draws the boundary and names what is held inside
vs referenced by id; this verb sorts those insides along the one axis DDD turns on inside
an aggregate — **identity vs value**. Is a type an **entity** (defined by identity and
lifecycle) or a **value object** (defined wholly by its attributes)? It lands the §D
*entity/value-object misclassification* signal and surfaces the §C *primitive obsession at
the boundary* smell.

## Mode — critique by default, design from intent

Runs in **both** modes (SKILL.md → *Lens*, design-vs-critique axis):

- **Critique (default):** read the context's real types and classify the ones it
  *actually* implements — every claim cites a `file:symbol`.
- **Design (`--design`, or when no code yet expresses the types):** propose how the types
  *should* classify from operator intent. The proposed classification is flagged as a
  recommendation, not cited.

## Input & scope

Tactical lens — **narrow and deep** (see `reference/tactical.md`).

- `entities <context>` — classify the types across **all** aggregates in the context.
- `entities <context>/<Root>` — zoom to one aggregate's composition.
  (`value-objects …` is identical — the same playbook.)

**Prefer the `aggregate` artifact.** If `docs/aggregate-<context-slug>-<date>.md` exists,
its *inside-vs-referenced* composition list is the starting set of types to classify — the
seam handoff `aggregate` provides. If it doesn't exist, derive the composition from code.
A prior `aggregate` run is **not** required.

**Prerequisite.** The context must be named and bounded. If the boundary is still fuzzy,
drop back to `boundaries`/`map` first — *strategic before tactical* is a shared law.

**Fallbacks:**
- No `DOMAIN.md` → offer `init` first.
- Target context isn't bounded / isn't in `DOMAIN.md` → redirect to `boundaries`.

## Signals

Work from `reference/signals.md`:

- **§D — entity/value-object misclassification** (this verb owns it): a type on the wrong
  side of the identity-vs-value axis.
- **§C — primitive obsession at the boundary** (cited here, not duplicated): a domain
  concept passed as a bare primitive where a value object should carry its rules.

Each finding traces to its signal id and cites a code location. The other §D signals
belong to later verbs; don't raise them here.

## The model — the positive result

Even with zero findings, this verb produces a model: every type in the aggregate's
composition sorted into **two lists**, cited to code (critique) or flagged as proposed
(design):

- **Entities** — identity + lifecycle; equality by id. *Cue:* has an id used for
  lookup/equality; mutated in place; persists across changes to its fields.
- **Value objects** — defined wholly by their attributes; equality by value; ideally
  immutable. *Cue:* no id; replaced wholesale rather than mutated; compared by fields.

Each entry carries its **classification rationale** — the code evidence that put it on
this side of the axis. A type whose evidence is genuinely mixed is the seed of a
misclassification finding.

## How it runs

1. **Acquire** the composition — read the `aggregate` artifact's inside-vs-referenced list
   if present; else derive it from the context's code (the types, their fields, how they
   are compared, mutated, persisted).
2. **Classify each type** — entity or value object — with the code evidence as rationale.
   The engineer proposes from the code; the domain expert checks the call matches how the
   business treats the thing.
3. **Flag misclassification (§D)** — where the evidence contradicts the modeling (an
   entity with no real identity, a value object with needless identity/lifecycle); each
   with severity (blast radius) and a citation. The fix is a *pure refactor* — reshape the
   type (drop the unused id and compare by value, or the reverse).
4. **Flag primitive obsession (§C)** — bare primitives standing in for value objects at
   the boundary. Frame the extraction as **consolidation**: the value object collapses
   validation already scattered across call sites, so it is a refactor — flag it as a
   genuine *addition* only when the rules exist nowhere yet.
5. **Pause** for the operator on each genuine fork ("does the business track this one
   individually?") — intent is canon.

In **design mode**, steps 2–4 propose the classification from intent (flagged) rather than
deriving and citing it.

## Output & loop

Write `docs/entities-<context-slug>-<date>.md` — same snapshot-not-ledger rule as
`critique` (same target + date overwrites). Frontmatter carries a stable artifact `id`.
The file has two parts:

- **Model** — the two classified lists above.
- **Findings** — §D/§C anti-patterns as `### F<n> [severity] <signalId> — <title>` with a
  `status` field, using the `Finding` shape in `cli/src/finding.mjs` — identical to
  `critique`. Findings **round-trip through `remediate`**
  (`open | resolved | deferred | escalated`).

## The seams

- **Back to `aggregate`.** `aggregate` draws the boundary and names what's inside vs
  referenced by id; this verb sorts that composition along the identity-vs-value axis. It
  consumes the `aggregate` artifact's composition when present.
- **Forward to `repositories` / `events`.** Those classify *other* facets of the same
  aggregate — persistence (one repository per root) and published domain events. This verb
  owns the identity-vs-value axis only; it assesses neither persistence nor events.

## Room framing

- **Engineer leads** — for each type: identity or value? how is it compared, mutated,
  persisted? Calls out an id that earns nothing and a primitive that should be a type.
- **Architect** guards the altitude — identity-vs-value only; persistence is
  `repositories`, events are `events`.
- **Domain expert(s)** confirm the classification matches how the business treats the
  thing — tracked individually (entity) or cared about only by value (value object).
- **Operator** is canon — on each classification fork and on apply/defer.

## Guardrails

- Cite or cut — in critique mode every classification and every finding points at code.
- Classify the whole composition — a type left unsorted is a gap, not a blank.
- Refactor before you add — a value object that consolidates scattered validation is a
  refactor; flag a genuine addition only when the rules exist nowhere yet.
- Stay on the identity-vs-value axis — persistence and events are later verbs.
- The operator rules on intent; the room recommends, flagged.
