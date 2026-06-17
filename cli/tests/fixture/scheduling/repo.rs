// Persistence for Scheduling.
use crate::billing::repo::PgRepo; // LEAK: reaches into Billing's internals (repo, not api)
use crate::billing::api::Invoice; // public use of Billing (contributes to billing::api fan-in)

pub struct SchedRepo {
    _billing: PgRepo,
}

pub fn latest() -> Option<Invoice> {
    None
}
