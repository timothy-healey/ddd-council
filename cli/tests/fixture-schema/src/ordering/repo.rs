use crate::schema::{orders, widgets, bins, solo};

pub fn read_order(conn: &mut C) {
    orders::table.find(1).select(orders::shipment_status).first(conn)
}
pub fn read_widget(conn: &mut C) {
    widgets::table.find(1).select(widgets::name).first(conn)
}
pub fn write_bin(conn: &mut C) {
    diesel::update(bins::table.find(1)).set(bins::label.eq("x")).execute(conn)
}
pub fn touch_solo(conn: &mut C) {
    solo::table.find(1).select(solo::note).first(conn)
}
