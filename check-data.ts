import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const db = mongoose.connection.db;

        console.log('--- 📊 ملخص البيانات في MongoDB ---');

        // 1. فحص الإحصائيات العامة
        const stats = await db.collection('global_stats').findOne({});
        console.log('\n🔹 الإحصائيات العامة (Global Stats):');
        console.table(stats);

        // 2. فحص عينة من المستخدمين المنظمين
        const users = await db.collection('final_users_v3').find({}).limit(5).toArray();
        console.log('\n🔹 عينة من المستخدمين (Users Sample):');
        console.table(users.map(u => ({
            Username: u.username,
            Wallet: u.wallet !== 'Not Linked' ? '✅ Linked' : '❌ Empty',
            Reputation: u.reputation,
            VIP: u.vip ? '⭐ Active' : 'Standard'
        })));

        // 3. فحص التعليقات
        const feedbackCount = await db.collection('rawdatas').findOne({ key: 'feedbacks' });
        console.log(`\n🔹 عدد التعليقات الموجودة: ${Array.isArray(feedbackCount?.value) ? feedbackCount.value.length : 0}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
