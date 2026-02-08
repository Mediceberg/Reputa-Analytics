import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'reputa-v3';

// تعريف Schemas
const usersSchema = new mongoose.Schema({}, { strict: false });
const statsSchema = new mongoose.Schema({}, { strict: false });

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
  });
}

export async function GET(request: NextRequest) {
  try {
    // الاتصال بـ MongoDB
    await connectDB();

    // الحصول على المجموعات
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // جلب جميع المستخدمين مرتبين تنازلياً حسب السكور
    const users = await db
      .collection('final_users_v3')
      .find({})
      .sort({ reputation_score: -1 })
      .toArray();

    // جلب الإحصائيات العامة
    const globalStats = await db
      .collection('global_stats')
      .findOne({});

    // حساب إحصائيات إضافية
    const totalUsers = users.length;
    const averageReputation = totalUsers > 0
      ? Math.round(
          users.reduce((sum: number, user: any) => sum + (user.reputation_score || 0), 0) / totalUsers
        )
      : 0;

    // تصنيف المستخدمين حسب مستوى السكور
    const scoreDistribution = {
      high: users.filter((u: any) => u.reputation_score > 80).length,
      medium: users.filter((u: any) => u.reputation_score >= 40 && u.reputation_score <= 80).length,
      low: users.filter((u: any) => u.reputation_score < 40).length,
    };

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalPioneers: globalStats?.total_pioneers_count || 0,
          totalPayments: globalStats?.total_payments || 0,
          totalTransactions: globalStats?.app_transactions || 0,
          averageReputation,
          totalUsers,
        },
        scoreDistribution,
        users: users.map((user: any) => ({
          id: user._id || Math.random(),
          uid: user.uid || user._id,
          username: user.username || user.name || 'Unknown',
          reputation_score: user.reputation_score || 0,
          wallet_address: user.wallet_address || user.walletAddress || 'N/A',
          vip_status: user.vip_status || false,
          joined_date: user.joined_date || user.createdAt || new Date().toISOString(),
          app_score: user.app_score || 0,
          email: user.email || 'N/A',
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in admin dashboard API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
