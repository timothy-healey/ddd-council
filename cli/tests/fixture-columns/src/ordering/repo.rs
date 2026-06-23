use crate::schema::{ledger, mixedcols, priced};

// ledger: ordering resolves entry_a only (disjoint from fulfilment's entry_b).
pub fn write_ledger_a(conn: &mut C) {
    diesel::update(ledger::table.find(1)).set(ledger::entry_a.eq("x")).execute(conn)
}
// mixedcols: ordering resolves col_x (a clean read).
pub fn read_mixed(conn: &mut C) {
    mixedcols::table.find(1).select(mixedcols::col_x).first(conn)
}
// priced: ordering writes amount (declared owner = ordering).
pub fn write_priced(conn: &mut C) {
    diesel::update(priced::table.find(1)).set(priced::amount.eq(5)).execute(conn)
}
