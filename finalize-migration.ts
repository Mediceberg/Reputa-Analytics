import mongoose from 'mongoose';

async function finalize() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const db = mongoose.connection.db;

        // 1. استخراج التعليقات (Feedbacks) ووضعها في مجموعة مستقلة
        const feedbackRaw = await db.collection('rawdatas').findOne({ key: 'feedbacks' });
        if (feedbackRaw && Array.isArray(feedbackRaw.value)) {
            const feedbackDocs = feedbackRaw.value.map(f => ({
                content: typeof f === 'string' ? f : JSON.stringify(f),
                createdAt: new Date()
            }));
            await db.collection('all_feedbacks').deleteMany({}); // تنظيف قديم
            await db.collection('all_feedbacks').insertMany(feedbackDocs);
            console.log(`✅ تم نقل ${feedbackDocs.length} تعليق إلى مجموعة all_feedbacks`);
        }

        // 2. استخراج اليوزر وربط المحفظة والسمعة
        const rawUsers = await db.collection('rawdatas').find({ key: { $regex: /^reputation_v2:/ } }).toArray();
        const finalUsers = [];

        for (const raw of rawUsers) {
            const uid = raw.key.split(':')[1];
            const val = raw.value;

            // محاولة ذكية لاستخراج البيانات من الـ Object أو الـ Array
            const username = val?.username || (Array.isArray(val) ? val[1] : null) || 'N/A';
            const wallet = val?.wallet || val?.address || (Array.isArray(val) ? val[2] : null) || 'Not Linked';
            const score = Array.isArray(val) ? val[0] : (val?.score || 0);

            // البحث عن حالة الـ VIP في البيانات الخام الأخرى
            const vipRaw = await db.collection('rawdatas').findOne({ key: `vip_status:${uid}` });

            finalUsers.push({
                uid,
                username,
                wallet,
                reputation_score: score,
                is_vip: !!vipRaw,
                last_updated: new Date()
            });
        }

        if (finalUsers.length > 0) {
            await db.collection('final_users').deleteMany({});
            await db.collection('final_users').insertMany(finalUsers);
            console.log(`✅ تم تنظيم ${finalUsers.length} مستخدم في مجموعة final_users بالأسماء والمحافظ`);
        }

        // 3. تحديث الإحصائيات العامة
        const totalPioneers = await db.collection('rawdatas').findOne({ key: 'total_pioneers' });
        console.log(`📊 إجمالي المستخدمين في النظام: ${totalPioneers?.value || 'غير محدد'}`);

        console.log('✨ المزامنة النهائية اكتملت! الآن كل شيء منظم في MongoDB.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
finalize();
