import mongoose from 'mongoose';

async function mine() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const db = mongoose.connection.db;

    const allRaw = await db.collection('rawdatas').find({}).toArray();
    const userMap = new Map();

    console.log('⛏️ جاري التنقيب في 72 سجلاً خاماً...');

    // 1. استخراج الإحصائيات العامة أولاً
    const getGlobal = (k: string) => allRaw.find(d => d.key === k)?.value;
    const globalStats = {
        total_pioneers_count: getGlobal('total_pioneers'),
        total_payments: getGlobal('total_successful_payments'),
        app_transactions: getGlobal('total_app_transactions')
    };

    // 2. معالجة كل سجل لربطه بالمستخدم المناسب
    allRaw.forEach(item => {
        if (!item.key.includes(':')) return; // تخطي المفاتيح العامة
        
        const [prefix, uid] = item.key.split(':');
        if (!userMap.has(uid)) {
            userMap.set(uid, { uid, username: 'N/A', wallet: 'Not Linked', reputation: 0, vip: false, payouts: [] });
        }

        const user = userMap.get(uid);
        let val = item.value;

        // فك تشفير البيانات إذا كانت نص JSON
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
            try { val = JSON.parse(val); } catch(e) {}
        }

        if (prefix === 'reputation_v2' || prefix === 'reputation') {
            user.reputation = Array.isArray(val) ? val[0] : (val?.score || val || 0);
            if (val?.username) user.username = val.username;
            if (val?.wallet) user.wallet = val.wallet;
        } 
        else if (prefix === 'vip_status' || prefix === 'vip') {
            user.vip = (val === 'active' || !!val);
        }
        else if (prefix === 'payout_history') {
            user.payouts = Array.isArray(val) ? val : [val];
        }
    });

    // 3. محاولة أخيرة لجلب الأسماء من القوائم الكبيرة (pioneers)
    const pioneersList = getGlobal('pioneers') || getGlobal('registered_pioneers');
    if (Array.isArray(pioneersList)) {
        pioneersList.forEach((p: any) => {
            let pData = p;
            if (typeof p === 'string') try { pData = JSON.parse(p); } catch(e) {}
            
            const pUid = pData.uid || pData.id;
            if (pUid && userMap.has(pUid)) {
                const u = userMap.get(pUid);
                if (u.username === 'N/A') u.username = pData.username || pData.name || 'N/A';
                if (u.wallet === 'Not Linked') u.wallet = pData.wallet || pData.address || 'Not Linked';
            }
        });
    }

    // 4. حفظ النتائج في مجموعات نظيفة
    const finalUsers = Array.from(userMap.values());
    
    await db.collection('final_users_v3').deleteMany({});
    await db.collection('final_users_v3').insertMany(finalUsers);
    
    await db.collection('global_stats').deleteMany({});
    await db.collection('global_stats').insertOne({ ...globalStats, updatedAt: new Date() });

    console.log(`✅ تم دمج وتطهير بيانات ${finalUsers.length} مستخدم.`);
    console.log(`📊 الإحصائيات العامة:`, globalStats);
    process.exit(0);
}
mine();
