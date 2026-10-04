export function throwDbError(action, error) {
  const err = new Error(`DB ${action} failed: ${error.message}`);
  err.code = error.code;
  throw err;
}