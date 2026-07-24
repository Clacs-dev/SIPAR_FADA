import prisma from '../config/database';

interface HistoryUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface HistoryInput {
  module: string;
  resourceId: string;
  action: string;
  statusFrom?: string | null;
  statusTo?: string | null;
  user?: HistoryUser;
  comment?: string;
  metadata?: any;
  oldValue?: any;
  newValue?: any;
}

function stringify(value: any) {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function parse(value?: string | null, fallback: any = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export class HistoryService {
  static async record(input: HistoryInput) {
    return prisma.documentHistory.create({
      data: {
        module: input.module,
        resourceId: input.resourceId,
        action: input.action,
        statusFrom: input.statusFrom || undefined,
        statusTo: input.statusTo || undefined,
        userId: input.user?.id,
        userName: input.user?.name,
        userEmail: input.user?.email,
        userRole: input.user?.role,
        comment: input.comment,
        metadata: stringify(input.metadata || {}) || '{}',
        oldValue: stringify(input.oldValue),
        newValue: stringify(input.newValue),
      }
    });
  }

  static async list(module: string, resourceId: string) {
    const history = await prisma.documentHistory.findMany({
      where: { module, resourceId },
      orderBy: { createdAt: 'asc' },
    });

    return history.map((item) => ({
      id: item.id,
      module: item.module,
      resourceId: item.resourceId,
      action: item.action,
      statusFrom: item.statusFrom,
      statusTo: item.statusTo,
      userId: item.userId,
      userName: item.userName,
      userEmail: item.userEmail,
      userRole: item.userRole,
      comment: item.comment,
      metadata: parse(item.metadata),
      oldValue: parse(item.oldValue, null),
      newValue: parse(item.newValue, null),
      createdAt: item.createdAt.toISOString(),
      created_at: item.createdAt.toISOString(),
    }));
  }
}
