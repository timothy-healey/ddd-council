CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    shipment_status TEXT NOT NULL,
    total_cents BIGINT NOT NULL
);
