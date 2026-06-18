use crate::schema::orders;

pub fn mark_shipped(conn: &mut C) {
    diesel::update(orders::table.find(1)).set(orders::shipment_status.eq("Shipped")).execute(conn)
}
