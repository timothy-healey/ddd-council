# Verb: boundaries

*Mode: design or critique · Lens: strategic · Reads: two+ contexts and their integration code.*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room teaches the relationship pattern it names and shows the
> architect/engineer friction over direction before settling; in `brief` it names
> the pattern, the direction, and the move.

## Purpose

Assess **bounded-context boundaries** and name the **relationship pattern** between
contexts. Where `map` draws the whole picture, `boundaries` zooms into a specific
seam: is this the right line, and what kind of relationship crosses it?

## The relationship patterns (name one per edge, with direction)

| Pattern | What it means |
|---|---|
| **Shared kernel** | Two contexts share a subset of the model; changes need joint agreement. High coupling — use sparingly. |
| **Customer–supplier** | Downstream depends on upstream; upstream accommodates downstream's needs. |
| **Conformist** | Downstream conforms to upstream's model with no translation (no power to negotiate). |
| **Anti-corruption layer (ACL)** | Downstream translates the upstream model at the boundary so foreign concepts don't leak in. |
| **Open-host service / published language** | Upstream offers a well-defined public protocol for many consumers. |
| **Partnership** | Two contexts succeed or fail together; coordinated planning. |
| **Separate ways** | No integration — deliberately disconnected. |

## Room framing

- **Architect** proposes the pattern and guards dependency direction (who is
  upstream, who absorbs change).
- **Engineer** verifies against the integration code — is there really a
  translation layer, or does the foreign model leak straight in?
- **Domain expert(s)** judge whether the boundary matches how the domains actually
  divide, and whether the power dynamic (who conforms to whom) is acceptable.
- **Operator** rules on intent and on any pattern the room can't settle.

## How it runs

1. Pick the seam (a pair, or a context against its neighbours).
2. **Design mode:** recommend the pattern that *should* govern the seam and why.
   **Critique mode:** read the integration code and name the pattern that *is* in
   force — citing the translation (or its absence). Use `reference/signals/A-context-boundary.md`
   §A (cohesion, language shift, separate persistence) and `reference/signals/B-strategic.md`
   §B (leaky boundary, accidental shared kernel, missing ACL, circular/chatty
   coupling) to read the seam from evidence.
3. Flag mismatches: a conformist relationship that should have an ACL; a shared
   kernel that's really just accidental table-sharing (→ escalate to `critique`);
   a missing published language for a context with many consumers.
4. Pause for the operator on direction/intent questions.

## Output

Append to `docs/context-map.md` (the edge annotations) and, for a deep seam
analysis, `docs/boundaries-<contexts>.md`: the pattern, direction, evidence (in
critique mode), the risk it carries, and the recommended move.

## Guardrails

- Every relationship has a **direction** — name who's upstream.
- A *shared kernel* is a deliberate, jointly-owned overlap — distinguish it from
  accidental coupling (that's a `critique` finding, not a chosen pattern).
- Prefer an ACL over conformist when the upstream model would corrupt the
  downstream language — protecting the language is a shared law.
