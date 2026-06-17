// Public surface of the Scheduling context.
use crate::billing::api::Invoice; // scheduling -> billing (public; forms a cycle)

pub struct Slot;

pub fn book(_invoice: Invoice) -> Slot {
    Slot
}
