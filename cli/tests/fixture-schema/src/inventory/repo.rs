use crate::schema::{widgets, bins};

diesel::table! {
    widgets (id) {
        id -> BigInt,
        name -> Text,
    }
}

diesel::table! {
    bins (id) {
        id -> BigInt,
        label -> Text,
    }
}

pub fn write_widget(conn: &mut C) {
    diesel::update(widgets::table.find(1)).set(widgets::name.eq("y")).execute(conn)
}
pub fn read_bin(conn: &mut C) {
    bins::table.find(1).select(bins::label).first(conn)
}
