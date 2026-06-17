// Application service (unassigned to a context) — wires everything together.
use crate::scheduling::api::Slot;
use crate::billing::api::Invoice; // contributes to billing::api fan-in
use crate::notifications::api::Notifier; // chatty: this file touches 3 contexts

pub fn run(_s: Slot, _i: Invoice, _n: Notifier) {}
