//! shared schema — owned by no context.
diesel::table! {
    orders (id) {
        id -> BigInt,
        shipment_status -> Text,
        total_cents -> BigInt,
    }
}

diesel::table! {
    solo (id) {
        id -> BigInt,
        note -> Text,
    }
}
