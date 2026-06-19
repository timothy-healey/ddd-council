use crate::schema::{ledger, mixedcols, priced};

// ledger: fulfilment resolves entry_b only -> disjoint from ordering's entry_a.
pub fn read_ledger_b(conn: &mut C) {
    ledger::table.find(1).select(ledger::entry_b).first(conn)
}
// mixedcols: fulfilment touches the table with NO column resolved (bare delete)
// -> forces UNKNOWN, the evidence gate.
pub fn purge_mixed(conn: &mut C) {
    diesel::delete(mixedcols::table.find(1)).execute(conn)
}
// priced: fulfilment resolves note only -> disjoint from ordering's amount,
// but priced has a declared owner so it stays ineligible.
pub fn read_priced(conn: &mut C) {
    priced::table.find(1).select(priced::note).first(conn)
}
