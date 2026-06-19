pub async fn read_order(pool: &sqlx::PgPool) {
    sqlx::query!(r#"SELECT id, total_cents FROM orders WHERE id = $1"#, 1)
        .fetch_one(pool)
        .await
        .unwrap();
}
