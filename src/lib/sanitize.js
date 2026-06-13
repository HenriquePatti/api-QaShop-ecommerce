/**
 * Strip sensitive fields from outbound payloads.
 * The `password` hash MUST never reach the client.
 */
export function sanitizeUser(user) {
  if (!user) return user;
  const { password: _password, ...safe } = user;
  return safe;
}
