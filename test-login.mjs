import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

async function main() {
  const sql = postgres('postgresql://documenthub:documenthub_dev_2026@localhost:5432/documenthub');

  try {
    const [user] = await sql`
      SELECT id, email, display_name, is_active, organization_id, password_hash, must_change_password
      FROM users WHERE email = ${'admin@documenthub.local'.toLowerCase()} LIMIT 1
    `;

    if (!user) {
      console.log('FAIL: User not found');
      return;
    }
    console.log('OK: User found:', user.email);
    console.log('OK: org_id:', user.organization_id);
    console.log('OK: is_active:', user.is_active);

    if (!user.is_active) {
      console.log('FAIL: User inactive');
      return;
    }

    const valid = await bcrypt.compare('Admin@123456', user.password_hash);
    console.log('OK: password valid:', valid);

    if (valid) {
      console.log('ALL CHECKS PASSED');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
