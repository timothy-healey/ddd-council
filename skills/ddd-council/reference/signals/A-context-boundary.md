## A. Context-boundary signals (where are the lines?)

Positive cues that a bounded context exists — used by `map` and `critique` to
cluster modules into contexts.

- **Cohesion cluster** — a set of modules that import each other heavily but the
  rest of the repo lightly. *Cue:* dense internal edges, sparse external ones.
  *Why:* high-cohesion/low-coupling clusters are candidate contexts. *Confirm:*
  does this cluster correspond to a real area of the business? *(signalId: `cohesion-cluster`)*
- **Language shift** — the vocabulary changes between two areas (one says
  `Appointment`, another says `Booking` for the same thing; or the same word means
  different things). *Cue:* term boundaries in type/file names. *Why:* a language
  shift is the surest sign of a context boundary. *Confirm:* are these genuinely
  different concepts, or drift? *(signalId: `language-shift`)*
- **Separate persistence** — a module owns its own tables/store and others don't
  touch them directly. *Cue:* table ownership, schema namespacing. *Why:* data
  ownership tends to track context ownership. *Confirm:* intentional? *(signalId: `separate-persistence`)*
- **Independent change cadence** — areas that deploy / version / change on different
  rhythms. *Cue:* commit history clustering, separate release units. *Why:* what
  changes together belongs together. *Confirm:* with the operator's roadmap. *(signalId: `independent-change-cadence`)*
