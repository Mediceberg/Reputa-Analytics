import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  const ADMIN_SECRET = "med2026";
  const { key } = req.query;

  if (key !== ADMIN_SECRET) {
    return res.status(401).send("<h1 style='color:red; text-align:center;'>Direct access not allowed.</h1>");
  }

  try {
    const rawData = await redis.lrange('pioneers', 0, -1);
    
    // معالجة البيانات مع تخطي السجلات المعطوبة تماماً
    const cleanData = rawData.map((item: any) => {
      if (typeof item === 'object' && item !== null) return item;
      try {
        return JSON.parse(item);
      } catch (e) {
        console.error("Skipping corrupted record:", item);
        return null; // سنضع علامة على البيانات الفاشلة
      }
    }).filter(item => item !== null); // حذف أي سجل تسبب في خطأ

    const rows = cleanData.map((u: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; font-weight:bold;">${u.username || 'Unknown'}</td>
        <td style="padding: 12px; font-family: monospace; color: ${u.wallet?.startsWith('G') ? '#27ae60' : '#e74c3c'};">
          ${u.wallet || 'N/A'}
        </td>
        <td style="padding: 12px; color: #666; font-size: 0.85em;">
          ${u.timestamp ? new Date(u.timestamp).toLocaleString() : 'N/A'}
        </td>
      </tr>
    `).join('');

    const html = `
      <html>
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; background: #f4f7f9; padding: 10px; }
          .container { max-width: 800px; margin: auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #2c3e50; color: white; padding: 15px; text-align: left; }
          .stats { padding: 10px; background: #e8f4fd; text-align: center; font-weight: bold; color: #2980b9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="stats">إجمالي السجلات الصالحة: ${cleanData.length}</div>
          <table>
            <thead><tr><th>User</th><th>Wallet</th><th>Date</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (error: any) {
    return res.status(500).send("Critical System Error: " + error.message);
  }
}
