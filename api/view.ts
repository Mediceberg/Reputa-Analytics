import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  const ADMIN_PASSWORD = "med2026";
  const { password } = req.query; // جلب كلمة السر من الرابط أو النموذج

  // 1. تصميم صفحة تسجيل الدخول إذا كانت كلمة السر خاطئة أو مفقودة
  if (password !== ADMIN_PASSWORD) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .login-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 350px; text-align: center; }
          h2 { color: #1a73e8; margin-bottom: 1.5rem; }
          input { width: 100%; padding: 12px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 16px; }
          button { width: 100%; padding: 12px; background: #1a73e8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; }
          button:hover { background: #1557b0; }
          .error { color: red; font-size: 14px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="login-card">
          <h2>Admin Access</h2>
          ${password ? '<p class="error">Incorrect Password!</p>' : ''}
          <form method="GET">
            <input type="password" name="password" placeholder="Enter Admin Password" required>
            <button type="submit">Login to Dashboard</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }

  // 2. إذا كانت كلمة السر صحيحة، نعرض لوحة التحكم
  try {
    const rawData = await redis.lrange('pioneers', 0, -1);
    
    const cleanData = rawData.map((item: any) => {
      if (typeof item === 'object' && item !== null) return item;
      try { return JSON.parse(item); } catch (e) { return null; }
    }).filter(item => item !== null);

    const rows = cleanData.map((u: any) => `
      <tr>
        <td><strong>${u.username || 'Unknown'}</strong></td>
        <td class="wallet-cell ${u.wallet?.startsWith('G') ? 'real' : 'temp'}">${u.wallet || 'N/A'}</td>
        <td class="date-cell">${u.timestamp ? new Date(u.timestamp).toLocaleString('en-US') : 'N/A'}</td>
      </tr>
    `).join('');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pioneer Dashboard</title>
        <style>
          body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 1000px; margin: auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
          .header { background: #1e293b; color: white; padding: 25px; display: flex; justify-content: space-between; align-items: center; }
          .stats-bar { background: #f1f5f9; padding: 15px 25px; display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; }
          .stat-item { font-size: 14px; font-weight: 600; color: #64748b; }
          .stat-item span { color: #1e293b; font-size: 16px; margin-left: 5px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8fafc; text-align: left; padding: 15px 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; border-bottom: 2px solid #e2e8f0; }
          td { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .wallet-cell { font-family: 'Courier New', monospace; font-weight: bold; font-size: 13px; }
          .real { color: #10b981; }
          .temp { color: #ef4444; }
          .date-cell { color: #94a3b8; font-size: 12px; }
          tr:hover { background: #fbfcfe; }
          .logout { color: #cbd5e1; text-decoration: none; font-size: 13px; border: 1px solid #475569; padding: 5px 12px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0">🚀 Pioneer Insights</h2>
            <a href="/api/view" class="logout">Logout</a>
          </div>
          <div class="stats-bar">
            <div class="stat-item">Total Logs: <span>${cleanData.length}</span></div>
            <div class="stat-item">Real Wallets (G): <span style="color:#10b981">${cleanData.filter((u: any) => u.wallet?.startsWith('G')).length}</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Wallet Address</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send("Dashboard Error: " + error.message);
  }
}
