pub async fn mark_shipped(pool: &sqlx::PgPool) {
    sqlx::query!(r#"UPDATE orders SET shipment_status = $1 WHERE id = $2"#, "Shipped", 1)
        .execute(pool)
        .await
        .unwrap();
}
