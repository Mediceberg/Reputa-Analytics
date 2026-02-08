import mongoose from 'mongoose';

async function rebuild() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const db = mongoose.connection.db;

    console.log('🏗️ جاري بناء قاعدة البيانات الموحدة لـ 2216 مستخدم...');

    // 1. جلب القائمة الكبيرة
    const rawPioneers = await db.collection('rawdatas').findOne({ key: 'pioneers' });
    const pioneers = rawPioneers?.value || [];

    // 2. جلب كل بيانات الـ VIP والسمعة للربط
    const allRaw = await db.collection('rawdatas').find({}).toArray();
    
    const bulkOps = pioneers.map((p: any) => {
        // تنظيف البيانات
        const username = p.username || 'Unknown';
        const wallet = p.wallet || 'Pending';
        
        // البحث عن أي بيانات مرتبطة بهذا المستخدم في المفاتيح الأخرى
        // ملاحظة: قد نربط هنا بناءً على الـ username إذا لم يتوفر UID
        const relatedData = allRaw.find(r => r.key.includes(username));
        const vipData = allRaw.find(r => r.key.startsWith('vip_status:') && r.key.includes(username));

        return {
            updateOne: {
                filter: { username: username },
                update: {
                    $set: {
                        username,
                        wallet,
                        lastSeen: p.timestamp,
                        is_vip: !!vipData,
                        reputation_score: relatedData ? 100 : 0, // قيمة افتراضية للموجودين
                        source: 'pioneers_list'
                    }
                },
                upsert: true
            }
        };
    });

    if (bulkOps.length > 0) {
        console.log(`⏳ جاري معالجة ${bulkOps.length} سجل...`);
        await db.collection('final_users_v3').bulkWrite(bulkOps);
    }

    console.log('✨ تم بنجاح! قاعدة البيانات الآن تحتوي على كافة الأسماء والمحافظ.');
    process.exit(0);
}
rebuild();
