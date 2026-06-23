## G. Synthesis / coherence smells

*Surfaced by `model`. Council-only — a whole-system judgment the engine can't make. §G fires
**only on cross-artifact contradiction**, never on mere absence (absence is `model`'s coverage
report). Every §G finding names the two slices (per-verb artifacts) in conflict; in critique mode
it also cites a code location. §G never re-runs code detection the Detection engine
(`accidental-shared-kernel`) or `critique` owns — it reads the disagreement between what two slices
already recorded.*

- **Unacknowledged term collision** — a term carries two distinct meanings across contexts with no
  translation or relationship named for it. *Cue:* the same word load-bearing in two contexts'
  language notes (or `DOMAIN.md`) with different definitions, and no `boundaries` relationship
  (ACL / translation) naming the seam. *Why:* the "one model per bounded context" law permits the
  word to differ across contexts — but only when the seam is acknowledged; an unacknowledged
  collision is a latent integration bug. *Confirm:* genuinely two concepts (name the translation),
  or one concept that drifted (unify the term)? **§G1 reports the collision and defers the fix —
  unification is `language`'s call, naming the translation is `boundaries`' call; `model` does not
  adjudicate the term.** *(signalId: `unacknowledged-term-collision`)*
- **Orphan in map** — the context map or a named relationship references a context or aggregate that
  no tactical artifact models. *Cue:* a node/edge in `docs/context-map.md` with no matching
  `aggregate-*.md` (or other slice) behind it. *Why:* the strategic picture claims a part the spine
  never modelled — the map is aspirational, or a slice is missing in a way that matters to the
  relationship. *Confirm:* model the referenced part, or correct the map? *(signalId: `orphan-in-map`)*
- **Slice contradiction** — one slice contradicts another. *Cue:* `context-map.md` declares two
  contexts *separate* (or conformist / customer-supplier) while a `repositories`/`aggregate` slice
  *already records* one persisting through the other's table or reaching past its surface. *Why:*
  the declared relationship disagrees with what another slice captured — the map is wrong or the
  slice is. *Confirm:* redraw the relationship, or fix the coupling? *Note:* `model` reads the
  contradiction **between artifacts**; finding the cross-table write itself is the Detection
  engine's job (`accidental-shared-kernel`) and `critique`'s — `model` consumes what they recorded.
  *(signalId: `slice-contradiction`)*
