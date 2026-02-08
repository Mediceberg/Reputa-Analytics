import mongoose from 'mongoose';

async function extract() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const db = mongoose.connection.db;

    console.log('🧹 تنظيف البيانات القديمة...');
    await db.collection('final_users_v3').deleteMany({});

    // 1. جلب القوائم التي تحتوي على الأسماء
    const lists = await db.collection('rawdatas').find({ 
        key: { $in: ['pioneers', 'registered_pioneers'] } 
    }).toArray();

    const userMap = new Map();

    console.log(`🔍 جاري معالجة ${lists.length} قوائم بيانات...`);

    lists.forEach(list => {
        if (Array.isArray(list.value)) {
            list.value.forEach((p: any) => {
                let pData = p;
                if (typeof p === 'string') {
                    try { pData = JSON.parse(p); } catch (e) { return; }
                }

                const name = pData.username || pData.name;
                if (name && name !== 'N/A') {
                    userMap.set(name, {
                        username: name,
                        wallet: pData.wallet || 'Pending',
                        timestamp: pData.timestamp || new Date(),
                        is_vip: false
                    });
                }
            });
        }
    });

    const finalUsers = Array.from(userMap.values());

    if (finalUsers.length > 0) {
        await db.collection('final_users_v3').insertMany(finalUsers);
        console.log(`✅ تم استخراج ${finalUsers.length} مستخدم بنجاح بأسماء ومحافظ حقيقية!`);
    }

    process.exit(0);
}
extract();
