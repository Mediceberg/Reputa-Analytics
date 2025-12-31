export default async function handler(req, res) {
  const { paymentId } = req.body;
  const apiKey = process.env.VITE_PI_API_KEY;
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Approve Failed" });
  }
}
