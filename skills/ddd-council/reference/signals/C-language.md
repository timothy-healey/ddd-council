## C. Ubiquitous-language smells (the names lie)

- **One concept, two names** — the same thing called different things in different
  places. *Cue:* `User` / `Member` / `Account` used interchangeably. *Why:* readers
  can't trust names; merges hide bugs. *Confirm:* which name wins (operator/expert)? *(signalId: `one-concept-two-names`)*
- **One name, two concepts** — a single term carrying two meanings. *Cue:* `Order`
  meaning both the cart and the fulfilment record. *Why:* the model is conflating
  things; usually a hidden boundary. *Confirm:* split and rename both. *(signalId: `one-name-two-concepts`)*
- **Technical name for a domain concept** — `Manager`, `Helper`, `Processor`,
  `Data`, `Info`, `Util` standing in for a real domain word. *Cue:* those suffixes on
  classes that hold domain logic. *Why:* the real concept is unnamed; the language
  isn't in the code. *Confirm:* what does the domain expert call this? *(signalId: `technical-name`)*
- **CRUD masking intent** — `updateStatus(x)` where the domain action is
  `cancel()` / `ship()` / `refund()`. *Cue:* generic setters/status flips in place of
  named domain operations. *Why:* the domain's real behaviour and its events are
  invisible. *Confirm:* what are the named operations and the events they emit? *(signalId: `crud-masking-intent`)*
- **Primitive obsession at the boundary** — domain concepts passed as bare
  strings/ints/maps. *Cue:* `string email`, `int money`, untyped dicts crossing
  context lines. *Why:* no place for the concept's rules to live; invariants scatter.
  *Confirm:* which primitives are really value objects? *(Bridges into tactical.)* *(signalId: `primitive-obsession`)*
