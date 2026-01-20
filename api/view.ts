import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  const ADMIN_PASSWORD = "med2026";
  const { password, page = "1" } = req.query; 
  const ITEMS_PER_PAGE = 40;
  const currentPage = parseInt(page);

  // 1. واجهة تسجيل الدخول
  if (password !== ADMIN_PASSWORD) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login</title>
        <style>
          body { font-family: 'Inter', sans-serif; background: #0f172a; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: #fff; }
          .login-box { background: #1e293b; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 100%; max-width: 380px; text-align: center; border: 1px solid #334155; }
          h2 { margin-bottom: 24px; color: #38bdf8; }
          input { width: 100%; padding: 14px; margin-bottom: 16px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: white; outline: none; box-sizing: border-box; }
          button { width: 100%; padding: 14px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="login-box">
          <h2>🛡️ Security Wall</h2>
          <form method="GET">
            <input type="password" name="password" placeholder="Admin Password" required autofocus>
            <button type="submit">Authenticate</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // 2. جلب البيانات (Pioneers + Feedbacks)
    const rawPioneers = await redis.lrange('pioneers', 0, -1);
    const rawFeedbacks = await redis.lrange('feedbacks', 0, -1);

    // معالجة بيانات الرواد (منع التكرار وحساب المرات)
    const pioneerMap = new Map();
    rawPioneers.forEach((item: any) => {
      try {
        const p = typeof item === 'string' ? JSON.parse(item) : item;
        const key = p.username || p.wallet;
        if (pioneerMap.has(key)) {
          const existing = pioneerMap.get(key);
          existing.count += 1;
          if (new Date(p.timestamp) > new Date(existing.timestamp)) {
            existing.timestamp = p.timestamp; // تحديث لآخر ظهور
          }
        } else {
          pioneerMap.set(key, { ...p, count: 1 });
        }
      } catch (e) {}
    });

    const allPioneers = Array.from(pioneerMap.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // معالجة التعليقات
    const feedbacks = rawFeedbacks.map((f: any) => typeof f === 'string' ? JSON.parse(f) : f);

    // 3. نظام الصفحات (Pagination)
    const totalItems = allPioneers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPioneers = allPioneers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const rows = paginatedPioneers.map((u: any) => `
      <tr>
        <td class="user-cell">
            ${u.username || 'Anonymous'} 
            <span class="visit-badge">${u.count}x Visits</span>
        </td>
        <td class="wallet-cell">
          <span class="status-dot ${u.wallet?.startsWith('G') ? 'active' : 'inactive'}"></span>
          <code>${u.wallet || 'N/A'}</code>
        </td>
        <td class="date-cell">${new Date(u.timestamp).toLocaleString()}</td>
      </tr>
    `).join('');

    // صفوف التعليقات
    const feedbackRows = feedbacks.slice(0, 10).map((f: any) => `
      <div class="feedback-item">
        <strong>@${f.username}:</strong> <span>${f.text}</span>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">${new Date(f.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Pioneer Admin Console</title>
        <style>
          :root { --bg: #f8fafc; --primary: #0f172a; --accent: #38bdf8; --border: #e2e8f0; }
          body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; padding: 20px; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--primary); padding: 20px; border-radius: 12px; color: white; }
          
          .grid-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { background: white; padding: 15px; border-radius: 12px; border: 1px solid var(--border); }
          .stat-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .stat-value { font-size: 20px; font-weight: 800; }

          .table-wrapper { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 12px 20px; text-align: left; font-size: 12px; color: #475569; }
          td { padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          
          .visit-badge { background: #f1f5f9; color: #6366f1; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 800; margin-left: 8px; }
          .feedback-panel { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 20px; height: fit-content; }
          .feedback-item { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
          
          .pagination { margin-top: 20px; display: flex; gap: 10px; align-items: center; justify-content: center; }
          .pg-btn { padding: 8px 16px; background: white; border: 1px solid var(--border); border-radius: 6px; text-decoration: none; color: var(--primary); font-size: 12px; font-weight: 600; }
          .pg-btn.active { background: var(--accent); border-color: var(--accent); color: white; }
          
          .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; }
          .active { background: #10b981; } .inactive { background: #ef4444; }
          code { font-family: monospace; color: #475569; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1 style="margin:0; font-size: 18px;">🚀 Pioneer Live Console</h1>
            <div style="font-size: 12px;">Total Pioneers: ${totalItems}</div>
          </header>

          <div class="grid-layout">
            <div class="main-content">
              <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Unique Users</div><div class="stat-value">${totalItems}</div></div>
                <div class="stat-card"><div class="stat-label">Verified (G)</div><div class="stat-value" style="color:#10b981">${allPioneers.filter(u => u.wallet?.startsWith('G')).length}</div></div>
                <div class="stat-card"><div class="stat-label">Feedbacks</div><div class="stat-value" style="color:#6366f1">${feedbacks.length}</div></div>
              </div>

              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr><th>User & Activity</th><th>Wallet</th><th>Last Seen</th></tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>

              <div class="pagination">
                ${currentPage > 1 ? `<a href="?password=${password}&page=${currentPage - 1}" class="pg-btn">Previous</a>` : ''}
                <span class="pg-btn active">Page ${currentPage} of ${totalPages}</span>
                ${currentPage < totalPages ? `<a href="?password=${password}&page=${currentPage + 1}" class="pg-btn">Next</a>` : ''}
              </div>
            </div>

            <div class="feedback-panel">
              <h3 style="margin-top:0; font-size: 14px; text-transform: uppercase; color: #64748b;">Latest Feedback</h3>
              ${feedbackRows || '<p style="color:#94a3b8; font-size:12px;">No feedback yet.</p>'}
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send("Error: " + error.message);
  }
}
