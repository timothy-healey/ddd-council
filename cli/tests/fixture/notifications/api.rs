// Public surface of the Notifications context.
use crate::billing::api::Invoice; // public use of Billing (contributes to billing::api fan-in)

pub struct Notifier;

pub fn notify(_invoice: Invoice) {}
