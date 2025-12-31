export default async function handler(req, res) {
  const { address } = req.query;
  try {
    const response = await fetch(`https://horizon-testnet.pi-blockchain.net/accounts/${address}`);
    if (!response.ok) return res.status(404).json({ error: "Not Found" });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}
