import { appendWithTemplate } from './google-sheets';
import { SHEET_TEMPLATES, TemplateKey } from './google-sheets-templates';

/**
 * Helper functions for each feature to save data to Google Sheets with templates
 */

export async function saveWithdrawItemToSheet(data: any) {
  try {
    await appendWithTemplate('WithdrawItems', {
      itemName: data.itemName,
      quantity: data.quantity,
      unit: data.unit || 'ชิ้น',
      withdrawnByName: data.withdrawnByName,
      notes: data.notes || '',
      status: data.status || 'pending',
      approvedByName: data.approvedByName || '',
      approvedAt: data.approvedAt ? new Date(data.approvedAt).toLocaleString('th-TH') : '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save withdraw item to sheet:', error);
    return false;
  }
}

export async function saveTimeTrackingToSheet(data: any) {
  try {
    await appendWithTemplate('TimeTracking', {
      caregiverName: data.caregiverName,
      caredForPerson: data.caredForPerson || '',
      startTime: data.startTime,
      endTime: data.endTime || '',
      duration: data.duration || '',
      recordedByName: data.recordedByName,
      notes: data.notes || '',
      status: data.status || 'active',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save time tracking to sheet:', error);
    return false;
  }
}

export async function saveCaseRecordToSheet(data: any) {
  try {
    await appendWithTemplate('CaseRecord', {
      caseNumber: data.caseNumber,
      caseDate: data.caseDate ? new Date(data.caseDate).toLocaleDateString('th-TH') : '',
      incidentDate: data.incidentDate ? new Date(data.incidentDate).toLocaleDateString('th-TH') : '',
      incidentLocation: data.incidentLocation || '',
      suspectName: data.suspectName || '',
      suspectId: data.suspectId || '',
      victimName: data.victimName || '',
      victimId: data.victimId || '',
      caseType: data.caseType,
      caseCategory: data.caseCategory || 'criminal',
      description: data.description,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      assignedOfficerName: data.assignedOfficerName || '',
      investigatingOfficerNames: data.investigatingOfficerNames || '',
      recordedByName: data.recordedByName,
      closedDate: data.closedDate ? new Date(data.closedDate).toLocaleDateString('th-TH') : '',
      closedByName: data.closedByName || '',
      closureReason: data.closureReason || '',
      notes: data.notes || '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save case record to sheet:', error);
    return false;
  }
}

export async function saveBlacklistToSheet(data: any) {
  try {
    await appendWithTemplate('Blacklist', {
      name: data.name,
      reason: data.reason,
      category: data.category || 'other',
      severity: data.severity || 'medium',
      addedByName: data.addedByName,
      isActive: data.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน',
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toLocaleString('th-TH') : '',
      notes: data.notes || '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save blacklist to sheet:', error);
    return false;
  }
}

export async function saveDisciplineToSheet(data: any) {
  try {
    await appendWithTemplate('Discipline', {
      officerName: data.officerName,
      officerId: data.officerId?.toString() || '',
      violation: data.violation,
      violationDate: data.violationDate ? new Date(data.violationDate).toLocaleDateString('th-TH') : '',
      penalty: data.penalty,
      penaltyType: data.penaltyType || 'other',
      penaltyAmount: data.penaltyAmount || '',
      issuedByName: data.issuedByName,
      status: data.status || 'pending',
      appealReason: data.appealReason || '',
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt).toLocaleString('th-TH') : '',
      notes: data.notes || '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save discipline to sheet:', error);
    return false;
  }
}

export async function saveSuggestionToSheet(data: any) {
  try {
    await appendWithTemplate('Suggestions', {
      title: data.title,
      content: data.content,
      category: data.category || 'other',
      submittedByName: data.submittedByName,
      status: data.status || 'pending',
      reviewedByName: data.reviewedByName || '',
      reviewNotes: data.reviewNotes || '',
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt).toLocaleString('th-TH') : '',
      likesCount: data.likesCount || 0,
      isAnonymous: data.isAnonymous ? 'ใช่' : 'ไม่',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save suggestion to sheet:', error);
    return false;
  }
}

export async function saveLeaveToSheet(data: any) {
  try {
    await appendWithTemplate('Leave', {
      leaveDate: data.leaveDate ? new Date(data.leaveDate).toLocaleDateString('th-TH') : '',
      leaveType: data.leaveType || 'other',
      reason: data.reason,
      startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('th-TH') : '',
      endDate: data.endDate ? new Date(data.endDate).toLocaleDateString('th-TH') : '',
      duration: data.duration || 0,
      requestedByName: data.requestedByName,
      status: data.status || 'pending',
      reviewedByName: data.reviewedByName || '',
      reviewNotes: data.reviewNotes || '',
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt).toLocaleString('th-TH') : '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save leave to sheet:', error);
    return false;
  }
}

export async function saveCashToSheet(data: any) {
  try {
    await appendWithTemplate('Cash', {
      gameName: data.gameName,
      description: data.description,
      imageUrl: data.imageUrl || '',
      category: data.category || 'normal',
      reportedByName: data.reportedByName,
      date: data.date ? new Date(data.date).toLocaleDateString('th-TH') : '',
      status: data.status || 'pending',
      confirmedByName: data.confirmedByName || '',
      confirmedAt: data.confirmedAt ? new Date(data.confirmedAt).toLocaleString('th-TH') : '',
      notes: data.notes || '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save cash to sheet:', error);
    return false;
  }
}

export async function saveBonusToSheet(data: any) {
  try {
    await appendWithTemplate('Bonus', {
      amount: data.amount,
      reason: data.reason,
      bonusType: data.bonusType || 'other',
      recipientName: data.recipientName,
      recipientId: data.recipientId?.toString() || '',
      reportedByName: data.reportedByName,
      date: data.date ? new Date(data.date).toLocaleDateString('th-TH') : '',
      status: data.status || 'pending',
      approvedByName: data.approvedByName || '',
      approvedAt: data.approvedAt ? new Date(data.approvedAt).toLocaleString('th-TH') : '',
      paidAt: data.paidAt ? new Date(data.paidAt).toLocaleString('th-TH') : '',
      notes: data.notes || '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save bonus to sheet:', error);
    return false;
  }
}

export async function saveNotificationToSheet(data: any) {
  try {
    await appendWithTemplate('Notifications', {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      recipientName: data.recipientName || '',
      relatedTo: data.relatedTo || '',
      relatedId: data.relatedId?.toString() || '',
      isRead: data.isRead ? 'ใช่' : 'ไม่',
      readAt: data.readAt ? new Date(data.readAt).toLocaleString('th-TH') : '',
      priority: data.priority || 'medium',
      actionUrl: data.actionUrl || '',
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toLocaleString('th-TH') : '',
      _id: data._id?.toString() || '',
    });
    return true;
  } catch (error) {
    console.error('Failed to save notification to sheet:', error);
    return false;
  }
}

/**
 * Initialize all sheet templates
 */
export async function initializeAllTemplates(): Promise<void> {
  try {
    const { initializeSheetTemplate } = await import('./google-sheets');
    
    for (const [key, template] of Object.entries(SHEET_TEMPLATES)) {
      try {
        await initializeSheetTemplate(template.sheetName, template.headers);
        console.log(`✓ Initialized template: ${template.sheetName}`);
      } catch (error) {
        console.error(`✗ Failed to initialize template ${key}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to initialize all templates:', error);
    throw error;
  }
}
