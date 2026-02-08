import mongoose from 'mongoose';

async function bridge() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const db = mongoose.connection.db;

    console.log('🔗 جاري البدء في ربط الأسماء والمحافظ لـ 2216 مستخدم...');

    // 1. جلب قائمة الـ Pioneers الخام من MongoDB
    const pioneersRaw = await db.collection('rawdatas').findOne({ 
        key: { $in: ['pioneers', 'registered_pioneers'] } 
    });

    if (!pioneersRaw || !Array.isArray(pioneersRaw.value)) {
        console.log('❌ لم يتم العثور على القائمة الكبيرة في rawdatas');
        process.exit(1);
    }

    console.log(`📦 تم العثور على ${pioneersRaw.value.length} سجل في القائمة. جاري المعالجة...`);

    const bulkOps = [];

    for (const item of pioneersRaw.value) {
        let pData = item;
        // فك تشفير النص إذا كان JSON String
        if (typeof item === 'string') {
            try { pData = JSON.parse(item); } catch (e) { continue; }
        }

        const uid = pData.uid || pData.id;
        const username = pData.username || pData.name;
        const wallet = pData.wallet || pData.address;

        if (uid) {
            bulkOps.push({
                updateOne: {
                    filter: { uid: uid },
                    update: { 
                        $set: { 
                            username: username || 'Unknown',
                            wallet: wallet || 'Not Linked'
                        }
                    },
                    upsert: true
                }
            });
        }
    }

    if (bulkOps.length > 0) {
        console.log('⏳ جاري تحديث قاعدة البيانات...');
        await db.collection('final_users_v3').bulkWrite(bulkOps);
    }

    console.log('✨ اكتملت العملية! الآن كل مستخدم مربوط باسمه ومحفظته.');
    process.exit(0);
}
bridge();
