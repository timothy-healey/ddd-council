# Verb: language

*Mode: design or critique · Lens: usually strategic (cross-context) or scoped to one context · Reads: a context (+ its code).*

## Purpose

Build or refine the **ubiquitous language** for a context — every term defined
once, ambiguous terms split and renamed — and, in critique mode, flag where the
**code's names diverge** from the agreed language.

## Mode

- **design** — workshop the language from intent and the domain expert's vocabulary.
- **critique** — read the code and report term drift: a concept with two names, one
  name for two concepts, a type whose name lies about what it does.

## Room framing

- **Domain expert(s)** lead — they own the field's real vocabulary, rules, and the
  exceptions that break naive names. Different experts = different context languages.
- **Architect** watches for a word that means two things across contexts (a boundary
  signal) vs within one context (a bug).
- **Engineer** ties each term to the type it should be in code.
- **Operator** settles which name wins when the room can't.

## How it runs

1. For each candidate term, capture **one meaning**. When a word carries two,
   **split it and name both** (a *Source* is not only a *Book*).
2. In critique mode, grep the code for each term and its synonyms; record every
   place the name diverges, with citations. Work from `reference/signals.md` §C
   (one concept/two names, one name/two concepts, technical names for domain
   concepts, CRUD masking intent, primitive obsession).
3. Mark each term **settled** vs **emerging** — half-formed concepts can be captured
   without pretending they're final.
4. Group terms **by context** as contexts firm up — the same word may legitimately
   differ across two contexts; say so explicitly.

## Output — `docs/ubiquitous-language.md`

Append, never overwrite. For each term: name · definition (one sentence) · context
· settled|emerging · (critique mode) code locations where the name diverges.

## Guardrails

- One meaning per term per context. Two meanings → split.
- The language lives in the code: a term agreed here should be the type name there.
- Operator confusion means the term is wrong — workshop a plainer name, don't
  re-explain the jargon.
- Awkward language is a signal the *model* is wrong, not just the label — escalate
  to `boundaries` / `map` when a naming fight is really a boundary fight.
