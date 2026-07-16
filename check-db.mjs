import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL || 'postgresql://documenthub:documenthub_dev_2026@localhost:5432/documenthub');
try {
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  console.log('Tables:', tables.map(t => t.tablename).join(', '));
  const r = await sql`SELECT count(*) as cnt FROM users`;
  console.log('Users count:', r[0].cnt);
  const users = await sql`SELECT id, email, organization_id FROM users`;
  console.log('Users:', users);
  const domains = await sql`SELECT * FROM allowed_email_domains`;
  console.log('Allowed domains:', domains);
  const orgs = await sql`SELECT * FROM organizations`;
  console.log('Organizations:', orgs);
} catch(e) {
  console.error('Error:', e.message);
  console.error('Cause:', e.cause?.message);
} finally {
  await sql.end();
}

