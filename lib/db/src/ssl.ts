/**
 * Decides whether the Postgres connection should use SSL.
 *
 * - DATABASE_SSL=true  → force SSL (rejectUnauthorized:false, accepts managed certs)
 * - DATABASE_SSL=false → force no SSL
 * - otherwise auto: no SSL for local / Railway-private hosts, SSL for public/managed
 *   hosts (Railway public proxy, Supabase, Neon, etc. require SSL).
 */
export function dbSsl(): false | { rejectUnauthorized: false } {
  const flag = process.env.DATABASE_SSL?.toLowerCase();
  if (flag === "true") return { rejectUnauthorized: false };
  if (flag === "false") return false;

  const url = process.env.DATABASE_URL ?? "";
  const isLocalOrPrivate =
    /localhost|127\.0\.0\.1|\[::1\]|\.railway\.internal|host\.docker\.internal/.test(url);
  return isLocalOrPrivate ? false : { rejectUnauthorized: false };
}
