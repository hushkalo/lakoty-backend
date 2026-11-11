const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Minimal self-contained login page shown during the MCP OAuth authorization step. */
export function renderLoginPage(params: {
  action: string;
  request: string;
  clientName: string;
  email?: string;
  error?: string;
}): string {
  const error = params.error
    ? `<p class="error">${escapeHtml(params.error)}</p>`
    : "";
  return `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lakotiy Admin — вхід</title>
<style>
  :root { color-scheme: light dark; --bg: #f5f5f5; --card: #fff; --text: #111; --muted: #666; --border: #d4d4d4; --accent: #111; --accent-text: #fff; --error: #c62828; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f0f0f; --card: #1a1a1a; --text: #f2f2f2; --muted: #a0a0a0; --border: #333; --accent: #f2f2f2; --accent-text: #111; --error: #ff6b6b; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text); font: 16px/1.4 system-ui, -apple-system, sans-serif; }
  form { width: 100%; max-width: 360px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  p { margin: 0 0 20px; color: var(--muted); font-size: 14px; }
  label { display: block; margin-bottom: 4px; font-size: 14px; }
  input { width: 100%; margin-bottom: 16px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: inherit; font: inherit; }
  button { width: 100%; padding: 11px; border: 0; border-radius: 8px; background: var(--accent); color: var(--accent-text); font: inherit; font-weight: 600; cursor: pointer; }
  .error { color: var(--error); margin-bottom: 16px; }
</style>
</head>
<body>
<form method="post" action="${escapeHtml(params.action)}">
  <h1>Lakotiy Admin</h1>
  <p><strong>${escapeHtml(params.clientName)}</strong> запитує доступ до адмінки магазину: перегляд і зміну товарів, категорій та партнерів.</p>
  ${error}
  <input type="hidden" name="request" value="${escapeHtml(params.request)}">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="username" required value="${escapeHtml(params.email ?? "")}">
  <label for="password">Пароль</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Увійти та дозволити</button>
</form>
</body>
</html>`;
}
