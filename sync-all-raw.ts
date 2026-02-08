import { createClient } from '@vercel/kv';
import mongoose from 'mongoose';

async function syncEverything() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const kv = createClient({ 
            url: process.env.KV_REST_API_URL!, 
            token: process.env.KV_REST_API_TOKEN! 
        });

        // إنشاء موديل للبيانات الخام
        const RawData = mongoose.models.RawData || mongoose.model('RawData', new mongoose.Schema({
            key: { type: String, unique: true },
            value: Object,
            type: String,
            updatedAt: { type: Date, default: Date.now }
        }));

        console.log('📡 جاري سحب كافة المفاتيح من Upstash...');
        const allKeys: string[] = [];
        for await (const key of kv.scanIterator()) { allKeys.push(key); }

        console.log(`📦 تم العثور على ${allKeys.length} مفتاح إجمالي. جاري النقل...`);

        for (const key of allKeys) {
            try {
                // محاولة جلب القيمة ومعرفة نوعها
                let value: any;
                let type = 'string';

                // جرب كـ List أولاً
                const listVal = await kv.lrange(key, 0, -1).catch(() => null);
                if (listVal && listVal.length > 0) {
                    value = listVal;
                    type = 'list';
                } else {
                    value = await kv.get(key);
                    type = typeof value;
                }

                await RawData.findOneAndUpdate(
                    { key },
                    { key, value, type, updatedAt: new Date() },
                    { upsert: true }
                );
                console.log(`✅ نقل المفتاح: ${key} (${type})`);
            } catch (e) {
                console.log(`❌ فشل نقل: ${key}`);
            }
        }

        console.log('✨ انتهى! كل بيانات Upstash الآن في MongoDB في مجموعة upstash_raw');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
syncEverything();
