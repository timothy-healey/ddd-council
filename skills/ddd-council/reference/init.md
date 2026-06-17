# Verb: init

*Mode: setup · Writes `DOMAIN.md` at the project root.*

## Purpose

Establish the context every other verb reads first. `init` interviews the operator
and writes `DOMAIN.md` — the map of *intent* against which the code's *reality*
is later compared.

## How it runs

Conversational, not a form dump. Ask in small batches (≈3 questions at a time),
offer recommendations where you can infer from the repo, and let the operator
answer briefly. If a repo is present, **scan it first** (see SKILL.md → Context
acquisition) and propose answers from what you find, rather than asking cold.

1. **Product** — one line: what it is, who it's for, the problem it solves.
2. **Stack** — language(s) and framework(s). (This is what a future `detect`
   engine must target, so be specific.)
3. **Known bounded contexts** — propose a first cut from the repo's top-level
   structure; let the operator correct names and responsibilities.
4. **Domain experts** — the roster (see below). Ask who the real-world authorities
   are for each context. At least one.
5. **Default lens** — three axes: strategic or tactical, design or critique, and
   **workshop or brief** (the *register* — does the operator want a collaborative,
   teaching working session, or just the conclusion and the artifact?). Default to
   `strategic` + `critique` + `workshop` if unsure — most first sessions want to
   understand the existing system *and* learn the discipline while doing it. Tell
   the operator they can flip register per invocation with `--brief` / `--workshop`.
6. **Focus** — which context/module is currently in play, if any.

## The domain-expert roster

The most important and most-skipped part. For each expert, capture:

- **Handle** — what the room calls them (e.g. *Clinician*, *Billing specialist*).
- **Speaks for** — the context/subdomain they're the authority on.
- **Role / background** — who they are in the real world.
- **Vocabulary & rules** — the terms, rules, and exceptions they bring (a few
  bullets are enough to seed the voice).

Encourage **more than one** where the domain spans distinct fields — the friction
between experts is a feature. If the operator only knows the domain casually, say
so in the expert entry (`confidence: casual`) so the room leans harder on
operator pauses.

## Output — `DOMAIN.md`

Write to the project root. Append/update; never clobber existing operator content.

```markdown
# DOMAIN.md

## Product
<one line>

## Stack
<languages / frameworks>

## Bounded contexts
- **<Name>** — <one-line responsibility>
- ...

## Domain experts
- **<Handle>** — speaks for *<context>* · <role/background>
  - vocabulary & rules: <terms, rules, exceptions>
- ...

## Lens
default: <strategic|tactical> · <design|critique> · <workshop|brief>

## Focus
<context/module currently in play, or "—">

## Ubiquitous language
See `docs/ubiquitous-language.md`.
```

## Guardrails

- Don't invent contexts or expert knowledge — propose from the repo, confirm with
  the operator, mark anything inferred.
- Keep it short. `DOMAIN.md` is a living seed, not a spec; it grows as verbs run.
