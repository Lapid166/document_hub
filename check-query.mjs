import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
try {
  const r = await sql`select "id", "organization_id", "email", "password_hash", "display_name", "avatar_url", "bio", "is_active", "must_change_password", "last_login_at", "created_at", "updated_at" from "users" where "users"."email" = ${'admin@documenthub.local'} limit ${1}`;
  console.log('Result:', r);
} catch(e) {
  console.error('Error:', e.message);
  console.error('Code:', e.code);
  console.error('Cause:', e.cause?.message);
} finally {
  await sql.end();
}
