import prisma from '../config/database';
import { BusinessRulesService } from './business-rules.service';

interface WorkflowUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface DecisionInput {
  module: string;
  resourceId: string;
  statusFrom?: string;
  statusTo: string;
  user?: WorkflowUser;
  comment?: string;
  metadata?: any;
}

const IMMUTABLE_STATUS = new Set([
  'aprovado',
  'pago',
  'fechado',
  'fechada',
  'cancelado',
  'cancelada',
  'arquivado',
  'arquivada',
  'ativo',
]);

const APPROVAL_STATUSES = new Set(['aprovado', 'rejeitado', 'aceite', 'validado']);

function stringify(value: any) {
  if (value === undefined) return '{}';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export class WorkflowService {
  static isImmutable(status?: string | null) {
    return status ? IMMUTABLE_STATUS.has(status) : false;
  }

  static isImmutableForModule(module: string, status?: string | null) {
    const rules = BusinessRulesService.getRules(module);
    if (rules) return BusinessRulesService.isTerminal(module, status);
    return this.isImmutable(status);
  }

  static isApprovalDecision(status: string) {
    return APPROVAL_STATUSES.has(status);
  }

  static async registerDecision(input: DecisionInput) {
    if (!this.isApprovalDecision(input.statusTo)) return null;

    const status = input.statusTo === 'rejeitado' ? 'rejected' : 'approved';
    const decision = input.statusTo === 'rejeitado' ? 'reject' : 'approve';

    const workflow = await prisma.approvalWorkflow.create({
      data: {
        module: input.module,
        resourceId: input.resourceId,
        status,
        currentLevel: 1,
        totalLevels: 1,
        requestedById: input.user?.id,
        requestedByName: input.user?.name,
        completedAt: new Date(),
        metadata: stringify(input.metadata || { statusFrom: input.statusFrom, statusTo: input.statusTo }),
        steps: {
          create: {
            level: 1,
            status,
            approverId: input.user?.id,
            approverName: input.user?.name,
            approverEmail: input.user?.email,
            approverRole: input.user?.role,
            decision,
            comment: input.comment,
            decidedAt: new Date(),
            metadata: stringify(input.metadata || {}),
          }
        }
      },
      include: { steps: true },
    });

    return workflow;
  }

  static async list(module: string, resourceId: string) {
    return prisma.approvalWorkflow.findMany({
      where: { module, resourceId },
      include: { steps: { orderBy: { level: 'asc' } } },
      orderBy: { requestedAt: 'desc' },
    });
  }
}
