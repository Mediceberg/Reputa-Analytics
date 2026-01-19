import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  const ADMIN_PASSWORD = "med2026";
  const { password } = req.query; // يتم استقبال الباسورد من الفورم

  // 1. واجهة تسجيل الدخول (تظهر إذا لم يتم إدخال الباسورد الصحيح)
  if (password !== ADMIN_PASSWORD) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background: #0f172a; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: #fff; }
          .login-box { background: #1e293b; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 100%; max-width: 380px; text-align: center; border: 1px solid #334155; }
          h2 { margin-bottom: 24px; font-weight: 600; letter-spacing: -0.025em; color: #38bdf8; }
          input { width: 100%; padding: 14px; margin-bottom: 16px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: white; font-size: 16px; outline: none; transition: 0.3s; }
          input:focus { border-color: #38bdf8; ring: 2px #38bdf8; }
          button { width: 100%; padding: 14px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 700; transition: 0.2s; }
          button:hover { background: #7dd3fc; transform: translateY(-1px); }
          .error { color: #f87171; background: #450a0a; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px; border: 1px solid #7f1d1d; }
        </style>
      </head>
      <body>
        <div class="login-box">
          <h2>🛡️ Security Wall</h2>
          ${password ? '<div class="error">Access Denied: Invalid Password</div>' : ''}
          <form method="GET">
            <input type="password" name="password" placeholder="Admin Password" required autofocus>
            <button type="submit">Authenticate</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }

  // 2. واجهة لوحة التحكم الاحترافية (تظهر بعد تسجيل الدخول بنجاح)
  try {
    const rawData = await redis.lrange('pioneers', 0, -1);
    const cleanData = rawData.map((item: any) => {
      if (typeof item === 'object' && item !== null) return item;
      try { return JSON.parse(item); } catch (e) { return null; }
    }).filter(item => item !== null);

    const rows = cleanData.map((u: any) => `
      <tr>
        <td class="user-cell">${u.username || 'Anonymous'}</td>
        <td class="wallet-cell">
          <span class="status-dot ${u.wallet?.startsWith('G') ? 'active' : 'inactive'}"></span>
          <code>${u.wallet || 'N/A'}</code>
        </td>
        <td class="date-cell">${u.timestamp ? new Date(u.timestamp).toLocaleString('en-GB', { hour12: true }) : 'N/A'}</td>
      </tr>
    `).join('');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pioneer Admin | Monitoring</title>
        <style>
          :root { --bg: #f8fafc; --card: #ffffff; --primary: #0f172a; --accent: #38bdf8; --border: #e2e8f0; }
          body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; padding: 20px; color: var(--primary); }
          .container { max-width: 1100px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: var(--primary); padding: 20px 30px; border-radius: 12px; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: var(--card); padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
          .stat-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-value { font-size: 24px; font-weight: 800; margin-top: 5px; color: var(--primary); }
          .table-wrapper { background: var(--card); border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #f1f5f9; padding: 16px 20px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid var(--border); }
          td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
          tr:hover { background: #f8fafc; }
          .user-cell { font-weight: 600; color: #1e293b; }
          .wallet-cell { display: flex; align-items: center; gap: 10px; }
          code { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: #334155; border: 1px solid #e2e8f0; }
          .status-dot { width: 8px; height: 8px; border-radius: 50%; }
          .active { background: #10b981; box-shadow: 0 0 8px #10b981; }
          .inactive { background: #ef4444; }
          .date-cell { color: #94a3b8; font-family: tabular-nums; }
          .btn-logout { background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; transition: 0.2s; }
          .btn-logout:hover { background: #ef4444; color: white; border-color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1 style="margin:0; font-size: 20px;">🚀 Pioneer Live Console</h1>
            <a href="/api/view" class="btn-logout">Sign Out</a>
          </header>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Connections</div>
              <div class="stat-value">${cleanData.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Verified Wallets (G)</div>
              <div class="stat-value" style="color:#10b981">${cleanData.filter((u: any) => u.wallet?.startsWith('G')).length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Pending/Other</div>
              <div class="stat-value" style="color:#ef4444">${cleanData.filter((u: any) => !u.wallet?.startsWith('G')).length}</div>
            </div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Target User</th>
                  <th>Wallet Identifier</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send("Dashboard Failure: " + error.message);
  }
}
