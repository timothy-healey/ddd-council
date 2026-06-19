//! shared schema — owned by no context (defines ledger, mixedcols, priced).
diesel::table! {
    ledger (id) {
        id -> BigInt,
        entry_a -> Text,
        entry_b -> Text,
    }
}

diesel::table! {
    mixedcols (id) {
        id -> BigInt,
        col_x -> Text,
    }
}

diesel::table! {
    priced (id) {
        id -> BigInt,
        amount -> BigInt,
        note -> Text,
    }
}
