import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminActionLog } from '../models/AdminActionLog';

/**
 * Audit logging middleware for admin actions
 * Logs all admin operations to the database for accountability
 */

interface AuditLogOptions {
  actionType: string;
  resourceType?: string;
  captureBody?: boolean;
  captureResponse?: boolean;
}

export const createAuditLogger = (options: AuditLogOptions) => {
  const { actionType, resourceType, captureBody = true, captureResponse = false } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    
    if (!user) {
      return; // Skip if no user (shouldn't happen after auth middleware)
    }

    const startTime = Date.now();
    
    // Capture request data
    const requestData: any = {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    if (captureBody && request.body) {
      requestData.body = sanitizeBody(request.body);
    }

    if (request.params) {
      requestData.params = request.params;
    }

    if (request.query) {
      requestData.query = request.query;
    }

    // Store original send function
    const originalSend = reply.send.bind(reply);

    // Override send to capture response
    reply.send = function(payload: any) {
      const duration = Date.now() - startTime;
      
      // Create audit log entry
      const auditData: any = {
        adminId: user.id,
        actionType,
        resourceType: resourceType || extractResourceType(request),
        resourceId: extractResourceId(request),
        metadata: {
          ...requestData,
          duration,
          statusCode: reply.statusCode,
        },
      };

      // Capture response if needed
      if (captureResponse && payload) {
        try {
          const responseData = typeof payload === 'string' ? JSON.parse(payload) : payload;
          auditData.metadata.response = sanitizeResponse(responseData);
        } catch (error) {
          // Ignore parse errors
        }
      }

      // Save audit log asynchronously (don't block response)
      AdminActionLog.create(auditData).catch(error => {
        console.error('Failed to create audit log:', error);
      });

      return originalSend(payload);
    };
  };
};

// Helper functions
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function sanitizeResponse(response: any): any {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const sanitized = { ...response };
  
  // Remove sensitive fields from response
  const sensitiveFields = ['password', 'token', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
    if (sanitized.data && sanitized.data[field]) {
      delete sanitized.data[field];
    }
  });

  return sanitized;
}

function extractResourceType(request: FastifyRequest): string {
  const path = request.routerPath || request.url;
  
  if (path.includes('/users')) return 'USER';
  if (path.includes('/settings')) return 'SETTINGS';
  if (path.includes('/outpasses')) return 'OUTPASS';
  if (path.includes('/hostels')) return 'HOSTEL';
  if (path.includes('/audit-logs')) return 'AUDIT_LOG';
  
  return 'UNKNOWN';
}

function extractResourceId(request: FastifyRequest): string | undefined {
  const params = request.params as any;
  return params?.id;
}

// Predefined audit loggers for common actions
export const auditUserAction = createAuditLogger({
  actionType: 'USER_MANAGEMENT',
  resourceType: 'USER',
  captureBody: true,
});

export const auditSettingsAction = createAuditLogger({
  actionType: 'SETTINGS_UPDATE',
  resourceType: 'SETTINGS',
  captureBody: true,
});

export const auditOverrideAction = createAuditLogger({
  actionType: 'OVERRIDE',
  captureBody: true,
  captureResponse: true,
});

export const auditDeleteAction = createAuditLogger({
  actionType: 'DELETE',
  captureBody: false,
  captureResponse: true,
});

// 