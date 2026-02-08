import { createClient } from '@vercel/kv';
import mongoose from 'mongoose';

async function masterSync() {
    try {
        if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
        await mongoose.connect(process.env.MONGODB_URI);

        const kv = createClient({ 
            url: process.env.KV_REST_API_URL!, 
            token: process.env.KV_REST_API_TOKEN! 
        });

        const userSchema = new mongoose.Schema({ 
            uid: String, 
            reputation: Object, 
            vip: Object, 
            payouts: Array, 
            lastSync: { type: Date, default: Date.now } 
        });
        const User = mongoose.models.UserV3 || mongoose.model('UserV3', userSchema);

        console.log('🔍 Scanning keys...');
        const allKeys: string[] = [];
        for await (const key of kv.scanIterator()) { allKeys.push(key); }

        const uids = [...new Set(allKeys.filter(k => k.includes(':')).map(k => k.split(':')[1]))];
        console.log(`🚀 Found ${uids.length} users. Syncing...`);

        for (const uid of uids) {
            try {
                let repData: any = await kv.lrange(`reputation_v2:${uid}`, 0, -1).catch(() => null);
                if (!repData || (Array.isArray(repData) && repData.length === 0)) {
                    repData = await kv.get(`reputation_v2:${uid}`).catch(() => null);
                }
                if (!repData) {
                    repData = await kv.get(`reputation:${uid}`).catch(() => null);
                }
                const [vip, payouts] = await Promise.all([
                    kv.get(`vip_status:${uid}`).catch(() => null),
                    kv.get(`payout_history:${uid}`).catch(() => null)
                ]);

                await User.findOneAndUpdate(
                    { uid },
                    { uid, reputation: repData, vip, payouts: Array.isArray(payouts) ? payouts : (payouts ? [payouts] : []), lastSync: new Date() },
                    { upsert: true }
                );
                console.log(`✅ Synced: ${uid}`);
            } catch (e) { console.log(`⚠️ Error for ${uid}`); }
        }
        console.log('✨ DONE!');
        process.exit(0);
    } catch (err) {
        console.error("❌ Fatal Error:", err);
        process.exit(1);
    }
}
masterSync();
