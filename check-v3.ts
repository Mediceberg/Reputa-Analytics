import mongoose from 'mongoose';
async function check() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const users = await mongoose.connection.db.collection('final_users_v3')
        .find({ username: { $ne: 'Unknown' } })
        .limit(10)
        .toArray();
    
    console.log('✅ عينة من المستخدمين الحقيقيين بعد الربط:');
    console.table(users.map(u => ({
        User: u.username,
        Wallet: u.wallet,
        VIP: u.is_vip ? 'YES' : 'NO'
    })));
    process.exit(0);
}
check();
