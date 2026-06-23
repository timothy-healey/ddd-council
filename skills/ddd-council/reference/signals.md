# Signals — detection catalog (index)

*The council's detection catalog. Shared across verbs. Every critique claim should
trace to a signal here, cited in code.*

This is the concrete answer to "what does the room actually look for?" It is also
the **rule spec for the `detect` engine** — each signal is written so it can be
checked mechanically. §B is mechanized today; §A, §C, and §D are council-only
until they are.

**Council ↔ Detector is a partnership.** The council authors this spec (upstream
of the engine here) *and* consumes the engine's findings (the engine is upstream
there) — so the two evolve together. Their contract surface is §B below plus the
`Finding` shape, defined canonically in `cli/src/finding.mjs`. Read by `critique`,
`boundaries`, and `language`; informs the repo scan in `map`.

Each entry: **what it looks like in code** (the cue) · **why it matters** ·
**confirm with the operator** (the judgment a machine can't make alone).

A signal is a *prompt to investigate*, not a verdict. Coupling can be deliberate;
a shared table can be a legitimate shared kernel. The room's job is to surface the
signal with evidence and let the operator rule on intent.

---

The catalog is split by section so a verb loads only the slice it cites.

- §A context-boundary → `signals/A-context-boundary.md`
- §B strategic anti-patterns → `signals/B-strategic.md`
- §C language smells → `signals/C-language.md`
- §D tactical signals → `signals/D-tactical.md`
- §E design-stage smells → `signals/E-design-stage.md`
- §F distillation/subdomain → `signals/F-distillation.md`
- §G coherence/synthesis → `signals/G-coherence.md`

## Using this catalog

- **Cite or cut.** A signal reported without a code location is not a finding.
- **Severity, not absolutes.** Rank by blast radius (how much breaks if this is
  wrong), not by how many rules tripped.
- **Intent is the operator's call.** Signals surface candidates; the operator rules
  on whether coupling/sharing was deliberate.
- **Same shape as the engine.** The finding shape is defined canonically in
  `cli/src/finding.mjs` (the `Finding` typedef): `signalId · severity · file ·
  line · message · suggestedMove`. Council and engine both emit it — cite that
  file rather than restating the fields, so the shared kernel can't drift.
