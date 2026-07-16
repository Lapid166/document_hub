import { db } from '../db/client';
import { auditLogs, securityEvents } from '../db/schema';

interface AuditParams {
	organizationId: string | null;
	userId?: string;
	action: string;
	resourceType?: string;
	resourceId?: string;
	details?: Record<string, unknown>;
	ipAddress?: string;
}

export async function auditLog(params: AuditParams) {
	await db.insert(auditLogs).values({
		organizationId: params.organizationId,
		userId: params.userId,
		action: params.action,
		resourceType: params.resourceType,
		resourceId: params.resourceId,
		detailsJson: params.details,
		ipAddress: params.ipAddress
	});
}

interface SecurityEventParams {
	organizationId?: string;
	eventType: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	details?: Record<string, unknown>;
}

export async function logSecurityEvent(params: SecurityEventParams) {
	await db.insert(securityEvents).values({
		organizationId: params.organizationId,
		eventType: params.eventType,
		severity: params.severity,
		detailsJson: params.details
	});
}
