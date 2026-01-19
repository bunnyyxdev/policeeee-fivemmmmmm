import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CaseRecord from '@/models/CaseRecord';
import User from '@/models/User';
import { requireAuthWithParams, handleApiError } from '@/lib/api-helpers';
import { logActivity } from '@/lib/activity-log';
import { getClientIP, parseUserAgent } from '@/lib/ip-utils';
import { saveCaseRecordToSheet } from '@/lib/google-sheets-helpers';

async function handler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const caseId = params.id;

    if (request.method === 'GET') {
      const caseRecord = await (CaseRecord as any).findById(caseId).lean();

      if (!caseRecord) {
        return NextResponse.json({ error: 'Case record not found' }, { status: 404 });
      }

      // All authenticated users can view any case record
      // No permission check needed for viewing

      return NextResponse.json({
        success: true,
        data: caseRecord,
      });
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await request.json();
      const caseRecord = await (CaseRecord as any).findById(caseId);

      if (!caseRecord) {
        return NextResponse.json({ error: 'Case record not found' }, { status: 404 });
      }

      // Check permission - admin or recorded by can update
      if (user.role !== 'admin' && caseRecord.recordedBy.toString() !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Update fields
      const updateFields: any = {};
      if (body.caseDate !== undefined) updateFields.caseDate = new Date(body.caseDate);
      if (body.incidentDate !== undefined) updateFields.incidentDate = body.incidentDate ? new Date(body.incidentDate) : null;
      if (body.incidentLocation !== undefined) updateFields.incidentLocation = body.incidentLocation;
      if (body.suspectName !== undefined) updateFields.suspectName = body.suspectName;
      if (body.suspectId !== undefined) updateFields.suspectId = body.suspectId;
      if (body.suspectAge !== undefined) updateFields.suspectAge = body.suspectAge;
      if (body.suspectAddress !== undefined) updateFields.suspectAddress = body.suspectAddress;
      if (body.suspectPhone !== undefined) updateFields.suspectPhone = body.suspectPhone;
      if (body.victimName !== undefined) updateFields.victimName = body.victimName;
      if (body.victimId !== undefined) updateFields.victimId = body.victimId;
      if (body.victimAge !== undefined) updateFields.victimAge = body.victimAge;
      if (body.victimAddress !== undefined) updateFields.victimAddress = body.victimAddress;
      if (body.victimPhone !== undefined) updateFields.victimPhone = body.victimPhone;
      if (body.caseType !== undefined) updateFields.caseType = body.caseType;
      if (body.caseCategory !== undefined) updateFields.caseCategory = body.caseCategory;
      if (body.description !== undefined) updateFields.description = body.description;
      if (body.status !== undefined) updateFields.status = body.status;
      if (body.priority !== undefined) updateFields.priority = body.priority;
      if (body.assignedOfficer !== undefined) updateFields.assignedOfficer = body.assignedOfficer;
      if (body.assignedOfficerName !== undefined) updateFields.assignedOfficerName = body.assignedOfficerName;
      if (body.investigatingOfficers !== undefined) updateFields.investigatingOfficers = body.investigatingOfficers;
      if (body.investigatingOfficerNames !== undefined) updateFields.investigatingOfficerNames = body.investigatingOfficerNames;
      if (body.documents !== undefined) updateFields.documents = body.documents;
      if (body.images !== undefined) updateFields.images = body.images;
      if (body.arrestName !== undefined) updateFields.arrestName = body.arrestName;
      if (body.arrestIdCard !== undefined) updateFields.arrestIdCard = body.arrestIdCard;
      if (body.crimeType !== undefined) updateFields.crimeType = body.crimeType;
      if (body.fineAmount !== undefined) updateFields.fineAmount = body.fineAmount ? Number(body.fineAmount) : null;
      if (body.jailTime !== undefined) updateFields.jailTime = body.jailTime;
      if (body.arrestImages !== undefined) updateFields.arrestImages = body.arrestImages;
      if (body.notes !== undefined) updateFields.notes = body.notes;

      // Handle case closure
      if (body.status === 'closed' || body.status === 'dismissed') {
        if (!caseRecord.closedDate) {
          updateFields.closedDate = new Date();
          updateFields.closedBy = user.userId;
          const userDoc = await (User as any).findById(user.userId);
          updateFields.closedByName = userDoc?.name || user.name || 'Unknown';
          updateFields.closureReason = body.closureReason || '';
        }
      }

      Object.assign(caseRecord, updateFields);
      await caseRecord.save();

      // Log activity
      const ipAddress = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      await logActivity({
        action: 'update',
        entityType: 'CaseRecord',
        entityId: caseRecord._id.toString(),
        entityName: caseRecord.caseNumber,
        performedBy: user.userId,
        performedByName: user.name || 'Unknown',
        ipAddress,
        userAgent,
      });

      // Backup to Google Sheets
      try {
        await saveCaseRecordToSheet({
          caseNumber: caseRecord.caseNumber,
          caseDate: caseRecord.caseDate,
          incidentDate: caseRecord.incidentDate,
          incidentLocation: caseRecord.incidentLocation,
          suspectName: caseRecord.suspectName,
          suspectId: caseRecord.suspectId,
          victimName: caseRecord.victimName,
          victimId: caseRecord.victimId,
          caseType: caseRecord.caseType,
          caseCategory: caseRecord.caseCategory,
          description: caseRecord.description,
          status: caseRecord.status,
          priority: caseRecord.priority,
          assignedOfficerName: caseRecord.assignedOfficerName,
          investigatingOfficerNames: caseRecord.investigatingOfficerNames?.join(', ') || '',
          recordedByName: caseRecord.recordedByName,
          closedDate: caseRecord.closedDate,
          closedByName: caseRecord.closedByName,
          closureReason: caseRecord.closureReason,
          notes: caseRecord.notes,
          _id: caseRecord._id.toString(),
        });
      } catch (error) {
        console.error('Failed to save case record to Google Sheets:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'อัปเดตคดีสำเร็จ',
        data: caseRecord,
      });
    }

    if (request.method === 'DELETE') {
      const caseRecord = await (CaseRecord as any).findById(caseId);

      if (!caseRecord) {
        return NextResponse.json({ error: 'Case record not found' }, { status: 404 });
      }

      // Only admin can delete
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Log activity
      const ipAddress = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      await logActivity({
        action: 'delete',
        entityType: 'CaseRecord',
        entityId: caseRecord._id.toString(),
        entityName: caseRecord.caseNumber,
        performedBy: user.userId,
        performedByName: user.name || 'Unknown',
        ipAddress,
        userAgent,
      });

      await (CaseRecord as any).findByIdAndDelete(caseId);

      return NextResponse.json({
        success: true,
        message: 'ลบคดีสำเร็จ',
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuthWithParams(handler);
export const PUT = requireAuthWithParams(handler);
export const PATCH = requireAuthWithParams(handler);
export const DELETE = requireAuthWithParams(handler);
