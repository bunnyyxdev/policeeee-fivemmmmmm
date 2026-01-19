import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyTokenServer } from '@/lib/auth';
import Leave from '@/models/Leave';
import Discipline from '@/models/Discipline';
import WithdrawItem from '@/models/WithdrawItem';
import TimeTracking from '@/models/TimeTracking';
import CaseRecord from '@/models/CaseRecord';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyTokenServer(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Get counts from different collections
    const [
      leaveCount,
      disciplineCount,
      withdrawItemsCount,
      timeTrackingCount,
      caseRecordCount,
      pendingLeaves,
      pendingDisciplines,
      recentWithdraws,
      caseRecordJokpoonCount,
      recentCaseRecords,
    ] = await Promise.all([
      // Total leave records
      (Leave as any).countDocuments(),
      
      // Total discipline records
      (Discipline as any).countDocuments(),
      
      // Total withdraw items
      (WithdrawItem as any).countDocuments(),
      
      // Total time tracking records
      (TimeTracking as any).countDocuments(),
      
      // Total case records
      (CaseRecord as any).countDocuments(),
      
      // Pending leaves (for admin/stats)
      (Leave as any).countDocuments({ status: 'pending' }),
      
      // Pending disciplines
      (Discipline as any).countDocuments({ status: 'pending' }),
      
      // Recent withdraws (last 7 days)
      (WithdrawItem as any).countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // Case records with crimeType "จกปูน"
      (CaseRecord as any).countDocuments({ crimeType: 'จกปูน' }),
      
      // Recent case records (last 7 days)
      (CaseRecord as any).countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
    ]);

    return NextResponse.json({
      leave: leaveCount,
      discipline: disciplineCount,
      withdrawItems: withdrawItemsCount,
      timeTracking: timeTrackingCount,
      caseRecords: caseRecordCount,
      pendingLeaves,
      pendingDisciplines,
      recentWithdraws,
      caseRecordJokpoon: caseRecordJokpoonCount,
      recentCaseRecords,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get data for charts (last 6 months)
async function getChartData() {
  await connectDB();
  
  // Get last 6 months
  const months = [];
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push({
      month: date.getMonth(),
      year: date.getFullYear(),
      label: `${monthNames[date.getMonth()]} ${date.getFullYear() + 543}`,
      startDate: new Date(date.getFullYear(), date.getMonth(), 1),
      endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  // Get discipline data by month
  const disciplineData = await Promise.all(
    months.map(async (m) => {
      const count = await (Discipline as any).countDocuments({
        createdAt: {
          $gte: m.startDate,
          $lte: m.endDate,
        },
      });
      return { month: m.label, count };
    })
  );

  // Get leave data by month
  const leaveData = await Promise.all(
    months.map(async (m) => {
      const count = await (Leave as any).countDocuments({
        createdAt: {
          $gte: m.startDate,
          $lte: m.endDate,
        },
      });
      return { month: m.label, count };
    })
  );

  // Get withdraw items by month
  const withdrawData = await Promise.all(
    months.map(async (m) => {
      const count = await (WithdrawItem as any).countDocuments({
        createdAt: {
          $gte: m.startDate,
          $lte: m.endDate,
        },
      });
      return { month: m.label, count };
    })
  );

  // Get time tracking by month
  const timeTrackingData = await Promise.all(
    months.map(async (m) => {
      const count = await (TimeTracking as any).countDocuments({
        createdAt: {
          $gte: m.startDate,
          $lte: m.endDate,
        },
      });
      return { month: m.label, count };
    })
  );

  return {
    discipline: disciplineData,
    leave: leaveData,
    withdrawItems: withdrawData,
    timeTracking: timeTrackingData,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyTokenServer(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const chartData = await getChartData();
    
    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Dashboard charts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
