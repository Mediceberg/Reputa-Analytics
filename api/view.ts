import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  const ADMIN_SECRET = "med2026";
  const { key } = req.query;

  if (key !== ADMIN_SECRET) {
    return res.status(401).send("<h1 style='color:red; text-align:center;'>Access Denied</h1>");
  }

  try {
    const rawData = await redis.lrange('pioneers', 0, -1);
    
    // معالجة البيانات مع تجنب أي خطأ قد يؤدي لسقوط السيرفر
    const data = rawData.map((item: any) => {
      if (typeof item === 'object' && item !== null) return item;
      try {
        return JSON.parse(item);
      } catch (e) {
        return { username: "Data Error", wallet: String(item), timestamp: new Date().toISOString() };
      }
    });

    const rows = data.map((u: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;"><b>${u.username || 'Unknown'}</b></td>
        <td style="padding: 10px; font-family: monospace; font-size: 12px; color: ${u.wallet?.startsWith('G') ? 'green' : 'red'};">
          ${u.wallet || 'N/A'}
        </td>
        <td style="padding: 10px; font-size: 11px; color: #666;">
          ${u.timestamp ? u.timestamp.split('T')[0] : 'N/A'}
        </td>
      </tr>
    `).join('');

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; margin: 0; background: #f0f2f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #007bff; color: white; padding: 10px; text-align: left; }
          .header { text-align: center; border-bottom: 2px solid #007bff; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h2>Pioneers Dashboard</h2></div>
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
    // في حالة حدوث خطأ، أظهر رسالة واضحة بدلاً من كراش السيرفر
    return res.status(200).send("<h1>Error Loading Table</h1><p>" + error.message + "</p>");
  }
}
