// Canonicalize a SQL table identifier: strip quoting (backticks / brackets /
// double-quotes) and any schema prefix, returning the bare table name.
// Shared by the SQLx query classifier (lang/rust/sqlx.mjs) and the .sql schema
// source (lang/sql.mjs). Tolerant: returns the input's last dotted segment.
export function bareTableName(tok) {
  const unq = (tok ?? '').replace(/[`"\[\]]/g, '');
  const parts = unq.split('.');
  return parts[parts.length - 1];
}
