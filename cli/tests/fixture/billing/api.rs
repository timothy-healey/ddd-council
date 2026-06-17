// Public surface of the Billing context.
use crate::scheduling::api::Slot; // billing -> scheduling (public; completes the cycle)

pub struct Invoice;

pub fn invoice_for(_slot: Slot) -> Invoice {
    Invoice
}
