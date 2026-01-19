import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '30d'; // '7d', '30d', '90d', '1y', 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateQuery: any = {};
    const now = new Date();

    if (startDate && endDate) {
      // Custom date range
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Period-based date range
      switch (period) {
        case '7d':
          dateQuery.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case '30d':
          dateQuery.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case '90d':
          dateQuery.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
          break;
        case '1y':
          dateQuery.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
          break;
        case 'all':
        default:
          dateQuery = {}; // No date filter
          break;
      }
    }

    // Total activities
    const totalActivities = await (ActivityLog as any).countDocuments(dateQuery);

    // Action breakdown
    const actionBreakdown = await (ActivityLog as any).aggregate([
      { $match: dateQuery },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Entity type breakdown
    const entityTypeBreakdown = await (ActivityLog as any).aggregate([
      { $match: dateQuery },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Top performers (most active users)
    const topPerformers = await (ActivityLog as any).aggregate([
      { $match: dateQuery },
      { $group: { _id: '$performedBy', count: { $sum: 1 }, name: { $first: '$performedByName' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Daily activity trend (last 30 days)
    const dailyTrends = await getDailyTrends(dateQuery);

    // Hourly activity distribution (0-23 hours)
    const hourlyDistribution = await (ActivityLog as any).aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Most active entities (by entityType)
    const mostActiveEntities = await (ActivityLog as any).aggregate([
      { $match: { ...dateQuery, entityName: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { entityType: '$entityType', entityName: '$entityName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      summary: {
        totalActivities,
        period,
      },
      breakdowns: {
        byAction: actionBreakdown,
        byEntityType: entityTypeBreakdown,
      },
      trends: {
        daily: dailyTrends,
        hourly: hourlyDistribution,
      },
      topPerformers,
      mostActiveEntities,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function getDailyTrends(dateQuery: any) {
  const now = new Date();
  const days = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayQuery = {
      ...dateQuery,
      createdAt: {
        ...(dateQuery.createdAt || {}),
        $gte: date,
        $lt: nextDate,
      },
    };
    
    const count = await (ActivityLog as any).countDocuments(dayQuery);
    
    days.push({
      date: date.toISOString().split('T')[0],
      count,
    });
  }
  
  return days;
}

export const GET = requireAuth(handlerGET);
