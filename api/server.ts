import 'dotenv/config.js';
import express from 'express';    
import cors from 'cors';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// بيانات وهمية مؤقتة (تمثل الـ 2216 مستخدم) للتأكد من عمل الواجهة
const mockUsers = [
  { uid: "pioneer_1", totalReputationScore: 95, reputationLevel: 5, walletAddress: "0x123...abc" },
  { uid: "pioneer_2", totalReputationScore: 82, reputationLevel: 4, walletAddress: "0x456...def" }
];

// 🚀 مسار الـ API الذي ستقرأ منه الواجهة
app.get('/api/v3/reputation', (req, res) => {
  res.json({ 
    count: mockUsers.length, 
    status: 'success', 
    data: mockUsers,
    note: "Running in Lite Mode (No DB)" 
  });
});

app.get('/health', (req, res) => res.send('OK - Lite Mode Active'));

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Lite API Server ready at http://0.0.0.0:${PORT}`);
});
