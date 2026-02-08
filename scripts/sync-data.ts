import { createClient } from '@vercel/kv';
import mongoose from 'mongoose';

async function masterSync() {
    // الاتصال بـ MongoDB
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
    await mongoose.connect(process.env.MONGODB_URI);

    // الاتصال بـ Upstash KV
    const kv = createClient({ 
        url: process.env.KV_REST_API_URL!, 
        token: process.env.KV_REST_API_TOKEN! 
    });

    // تعريف موديل البيانات
    const userSchema = new mongoose.Schema({ 
        uid: String, 
        reputation: Object, 
        vip: Object, 
        payouts: Array, 
        lastSync: { type: Date, default: Date.now } 
    });
    const User = mongoose.models.UserV3 || mongoose.model('UserV3', userSchema);

    console.log('🔍 جاري فحص المفاتيح في Upstash...');
    const allKeys: string[] = [];
    for await (const key of kv.scanIterator()) { 
        allKeys.push(key); 
    }

    const uids = [...new Set(allKeys.filter(k => k.includes(':')).map(k => k.split(':')[1]))];
    console.log(`🚀 تم العثور على ${uids.length} مستخدم. جاري المزامنة...`);

    for (const uid of uids) {
        try {
            // محاولة جلب البيانات بكل الطرق (List أو String)
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
                { 
                    uid, 
                    reputation: repData, 
                    vip: vip,
                    payouts: Array.isArray(payouts) ? payouts : (payouts ? [payouts] : []),
                    lastSync: new Date() 
                },
                { upsert: true }
            );
            console.log(`✅ تم بنجاح: ${uid}`);
        } catch (err) {
            console.log(`⚠️ فشل مزامنة المستخدم ${uid}:`, err);
        }
    }

    console.log('✨ اكتملت المزامنة الشاملة لجميع البيانات!');
    process.exit(0);
}

masterSync().catch(err => {
    console.error("❌ خطأ فادح:", err);
    process.exit(1);
});
