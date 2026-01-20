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

  if (password !== ADMIN_PASSWORD) {
    return res.status(200).send(`<html><body style="background:#0f172a;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><form method="GET"><input type="password" name="password" placeholder="Password" style="padding:10px;border-radius:5px;border:none;"><button type="submit" style="padding:10px 20px;margin-left:10px;background:#38bdf8;border:none;border-radius:5px;cursor:pointer;">Login</button></form></body></html>`);
  }

  try {
    const rawPioneers = await redis.lrange('pioneers', 0, -1);
    const rawFeedbacks = await redis.lrange('feedbacks', 0, -1);

    const pioneerMap = new Map();
    rawPioneers.forEach((item: any) => {
      try {
        const p = typeof item === 'string' ? JSON.parse(item) : item;
        const username = p.username || 'Anonymous';
        if (!pioneerMap.has(username)) {
          pioneerMap.set(username, { username, wallets: new Set(p.wallet ? [p.wallet] : []), timestamps: [p.timestamp], count: 1 });
        } else {
          const existing = pioneerMap.get(username);
          existing.count += 1;
          existing.timestamps.push(p.timestamp);
          if (p.wallet) existing.wallets.add(p.wallet);
          existing.timestamps.sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        }
      } catch (e) {}
    });

    const allPioneers = Array.from(pioneerMap.values()).sort((a: any, b: any) => new Date(b.timestamps[0]).getTime() - new Date(a.timestamps[0]).getTime());
    const totalItems = allPioneers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginatedPioneers = allPioneers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const rows = paginatedPioneers.map((u: any) => {
      const walletArray = Array.from(u.wallets);
      const primaryWallet = walletArray.find((w: any) => w.startsWith('G')) || walletArray[0] || 'N/A';
      
      // تحويل البيانات لنصوص ليتم قراءتها بواسطة الـ JavaScript المنبثق
      const walletsJson = JSON.stringify(walletArray);
      const timesJson = JSON.stringify(u.timestamps.map((t:any) => new Date(t).toLocaleString()));

      return `
      <tr>
        <td class="user-cell">
            <div class="user-info">
              <span class="name">${u.username}</span>
              <span class="visit-badge" onclick='showModal("${u.username}", ${walletsJson}, ${timesJson})'>${u.count}x Visits (View History)</span>
            </div>
        </td>
        <td class="wallet-cell">
          <span class="status-dot ${primaryWallet.startsWith('G') ? 'active' : 'inactive'}"></span>
          <code>${primaryWallet}</code>
          ${walletArray.length > 1 ? `<span class="multi-tag" onclick='showModal("${u.username}", ${walletsJson}, ${timesJson})'>+${walletArray.length - 1} More</span>` : ''}
        </td>
        <td class="date-cell">
          <div class="last-seen">Last: ${new Date(u.timestamps[0]).toLocaleString()}</div>
        </td>
      </tr>
    `}).join('');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Pioneer Admin Console</title>
        <style>
          :root { --bg: #f8fafc; --primary: #0f172a; --accent: #38bdf8; --border: #e2e8f0; }
          body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; padding: 20px; }
          .container { max-width: 1240px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--primary); padding: 20px; border-radius: 12px; color: white; }
          .grid-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
          .table-wrapper { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 14px 20px; text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; }
          td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .user-info .name { font-weight: 700; color: var(--primary); display: block; }
          .visit-badge { font-size: 10px; color: #6366f1; background: #eef2ff; padding: 2px 8px; border-radius: 6px; cursor: pointer; font-weight: 800; }
          .multi-tag { font-size: 10px; color: #ef4444; background: #fee2e2; padding: 2px 6px; border-radius: 4px; cursor: pointer; margin-left: 5px; font-weight: 800; }
          .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
          .active { background: #10b981; } .inactive { background: #ef4444; }
          code { background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; }
          
          /* Modal Styles */
          #modal { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); z-index: 1000; justify-content: center; align-items: center; }
          .modal-content { background: white; width: 90%; max-width: 500px; border-radius: 16px; padding: 25px; max-height: 80vh; overflow-y: auto; position: relative; }
          .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
          .close-btn { cursor: pointer; font-size: 24px; color: #94a3b8; }
          .wallet-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
          .copy-btn { background: var(--accent); color: var(--primary); border: none; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; }
          .time-item { font-size: 11px; color: #64748b; padding: 5px 0; border-bottom: 1px dashed #eee; }
          
          .feedback-panel { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 20px; }
          .pagination { margin-top: 20px; text-align: center; }
          .pg-btn { padding: 10px 20px; background: white; border: 1px solid var(--border); border-radius: 8px; text-decoration: none; color: var(--primary); font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1 style="margin:0; font-size: 20px;">🛡️ Pioneer Intelligence Console</h1>
            <div>Total Unique: ${totalItems}</div>
          </header>

          <div class="grid-layout">
            <div class="main-content">
              <div class="table-wrapper">
                <table>
                  <thead><tr><th>Pioneer</th><th>Wallet Identity</th><th>Activity</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
              <div class="pagination">
                 ${currentPage > 1 ? `<a href="?password=${password}&page=${currentPage - 1}" class="pg-btn">Previous</a>` : ''}
                 <span class="pg-btn" style="background:var(--primary); color:white;">Page ${currentPage}</span>
                 ${currentPage < totalPages ? `<a href="?password=${password}&page=${currentPage + 1}" class="pg-btn">Next</a>` : ''}
              </div>
            </div>

            <div class="feedback-panel">
              <h3 style="margin-top:0; font-size: 14px; color: #64748b; border-bottom: 2px solid var(--accent); padding-bottom: 10px;">LATEST FEEDBACK</h3>
              ${rawFeedbacks.slice(0, 10).map((f: any) => {
                const data = typeof f === 'string' ? JSON.parse(f) : f;
                return `<div style="font-size:12px; padding:10px 0; border-bottom:1px solid #f1f5f9;"><b>@${data.username}:</b> ${data.text}</div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div id="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modalTitle" style="margin:0; font-size:16px;">Details</h3>
              <span class="close-btn" onclick="closeModal()">&times;</span>
            </div>
            <div id="modalBody"></div>
          </div>
        </div>

        <script>
          function showModal(username, wallets, times) {
            const modal = document.getElementById('modal');
            const body = document.getElementById('modalBody');
            document.getElementById('modalTitle').innerText = "History for " + username;
            
            let html = '<h4 style="font-size:12px; color:#64748b;">RECOGNIZED WALLETS</h4>';
            wallets.forEach(w => {
              html += \`
                <div class="wallet-item">
                  <code style="font-size:11px; word-break:break-all;">\${w}</code>
                  <button class="copy-btn" onclick="copyText('\${w}')">COPY</button>
                </div>\`;
            });

            html += '<h4 style="font-size:12px; color:#64748b; margin-top:20px;">VISIT TIMELINE</h4>';
            times.forEach(t => {
              html += \`<div class="time-item">Visited on: \${t}</div>\`;
            });

            body.innerHTML = html;
            modal.style.display = 'flex';
          }

          function closeModal() {
            document.getElementById('modal').style.display = 'none';
          }

          function copyText(text) {
            navigator.clipboard.writeText(text);
            alert('Wallet copied to clipboard!');
          }

          window.onclick = function(event) {
            if (event.target == document.getElementById('modal')) closeModal();
          }
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send("Error: " + error.message);
  }
}
