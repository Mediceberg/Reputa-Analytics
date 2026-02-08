import mongoose from 'mongoose';

async function deepClean() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const db = mongoose.connection.db;

    const allRaw = await db.collection('rawdatas').find({}).toArray();
    
    // خريطة لتخزين بيانات المستخدمين المجمعة
    const userMap = new Map();

    console.log('🧹 جاري تحليل 72 مفتاحاً واستخراج التفاصيل...');

    allRaw.forEach(item => {
        const parts = item.key.split(':');
        const uid = parts[1] || item.key;
        
        if (!userMap.has(uid)) {
            userMap.set(uid, { uid, username: 'N/A', wallet: 'Not Linked', score: 0, vip: false });
        }

        const user = userMap.get(uid);
        let val = item.value;
        
        // محاولة فك التشفير إذا كانت القيمة نص JSON
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
            try { val = JSON.parse(val); } catch(e) {}
        }

        if (item.key.startsWith('reputation_v2:')) {
            user.score = Array.isArray(val) ? val[0] : (val?.score || val?.reputation || 0);
            if (val?.username) user.username = val.username;
            if (val?.wallet) user.wallet = val.wallet;
        } 
        else if (item.key.startsWith('vip_status:')) {
            user.vip = true;
        }
        else if (item.key === 'registered_pioneers' || item.key === 'pioneers') {
            // إذا كانت البيانات قائمة ضخمة، نمر عليها لربط الأسماء بالـ UIDs
            if (Array.isArray(val)) {
                val.forEach((p: any) => {
                    const pUid = p.uid || p.id;
                    if (pUid) {
                        const existing = userMap.get(pUid) || { uid: pUid };
                        userMap.set(pUid, { 
                            ...existing, 
                            username: p.username || p.name || existing.username,
                            wallet: p.wallet || p.address || existing.wallet
                        });
                    }
                });
            }
        }
    });

    const finalDocs = Array.from(userMap.values()).filter(u => u.uid.length > 5); // استبعاد المفاتيح العامة

    if (finalDocs.length > 0) {
        await db.collection('final_users').deleteMany({});
        await db.collection('final_users').insertMany(finalDocs);
        console.log(`✅ تم بنجاح دمج وتنظيف بيانات ${finalDocs.length} مستخدم.`);
    }

    process.exit(0);
}
deepClean();
