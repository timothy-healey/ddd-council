## F. Distillation / subdomain smells

*Surfaced by `distill`. Council-only — subdomain classification is a strategic judgment the
engine can't make. Each finding names a subdomain and its owning context(s); in critique mode it
cites a code location. The core/supporting/generic call itself is the operator's (canon).*

- **Core fragmented** — one **core** subdomain is split across two or more contexts. *Cue:* the
  business's differentiating capability implemented in pieces under different context lines; heavy
  cross-context coupling on the thing that matters most. *Why:* focus and integration cost fall on
  the core, where they hurt most. *Confirm:* should these contexts consolidate around the core, or
  is the split deliberate? *(signalId: `core-fragmented`)*
- **Mixed-subdomain context** — one context holds more than one subdomain type (e.g. a core and a
  generic, or core and supporting). *Cue:* a single context whose modules serve clearly different
  strategic purposes — the differentiator and an off-the-shelf concern in one box. *Why:* the
  generic/supporting part dilutes the core and resists being bought or extracted. *Confirm:*
  extract or buy the non-core part? *(signalId: `mixed-subdomain-context`)*
- **Generic over-built** — a **generic** subdomain implemented with heavy custom code. *Cue:* a
  solved-problem area (auth, notifications, file storage) carrying significant bespoke
  implementation instead of a library/SaaS. *Why:* effort spent on the non-differentiating is
  effort stolen from the core. *Confirm:* replace with a library/SaaS? *(signalId:
  `generic-over-built`)*
- **Under-invested core** — the **core** subdomain is thin while effort pools in supporting/generic.
  *Cue:* the area named as the differentiator is small/simple, and the bulk of the code and
  complexity sits elsewhere. *Why:* investment is misallocated away from the differentiator.
  *Confirm:* is this really core, or is the effort signalling the true core elsewhere?
  *Discriminator vs* §D **anaemic domain model:** §D is one aggregate's missing behaviour (a
  getter/setter bag); this is the whole system's misallocated *investment* across subdomains.
  *(signalId: `under-invested-core`)*
- **Gold-plated supporting** — a **supporting** subdomain built to core-level investment. *Cue:* a
  necessary-but-not-differentiating area carrying disproportionate sophistication. *Why:*
  over-spend on the merely-necessary. *Confirm:* is it actually core (reclassify), or genuinely
  over-built? *(signalId: `gold-plated-supporting`)*
