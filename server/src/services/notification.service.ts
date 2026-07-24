import prisma from '../config/database';
import { emailService } from './email.service';
import logger from '../config/logger';

export interface SystemNotification {
  id: string;
  email: string;
  type: string;
  resourceId?: string;
  status?: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export class NotificationService {
  static async createNotification(
    email: string,
    type: string,
    message: string,
    resourceId?: string,
    metadata?: any
  ): Promise<SystemNotification> {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);

    const notification: SystemNotification = {
      id,
      email,
      type,
      message,
      resourceId,
      read: false,
      createdAt: new Date().toISOString(),
      metadata
    };

    try {
      await prisma.notification.create({
        data: {
          id,
          userId: user?.id,
          email,
          type,
          resourceId,
          message,
          read: false,
          metadata: JSON.stringify(metadata || {}),
        }
      });

      logger.info(`[NotificationService] Notificacao interna salva para ${email}: "${message}"`);

      await emailService.sendEmail({
        to: email,
        subject: `Notificacao SIPAR20: ${message.substring(0, 40)}`,
        html: `
          <h3>Nova Notificacao SIPAR20</h3>
          <p>${message}</p>
          <hr>
          <p style="font-size: 11px; color: #888;">
            Voce esta recebendo este e-mail automatico porque sua conta esta registrada no SIPAR20.
          </p>
        `
      }).catch(err => logger.error('Falha ao disparar e-mail de notificacao:', err));
    } catch (error) {
      logger.error('Erro no NotificationService.createNotification:', error);
    }

    return notification;
  }

  static async createStatusChangeNotification(
    email: string,
    type: string,
    resourceId: string,
    oldStatus: string,
    newStatus: string,
    metadata?: any
  ): Promise<SystemNotification> {
    const message = `A solicitacao (${type}) de ID ${resourceId} mudou de status de ${oldStatus} para ${newStatus}.`;
    return this.createNotification(email, 'status_change', message, resourceId, {
      ...metadata,
      oldStatus,
      newStatus
    });
  }

  static async createMeetingScheduledNotification(
    email: string,
    meetingDetails: {
      id: string;
      date: string;
      time: string;
      type: string;
      platform?: string;
      location?: string;
      link?: string;
      company?: string;
      reason?: string;
    }
  ): Promise<SystemNotification> {
    const message = `Reuniao marcada para dia ${meetingDetails.date} as ${meetingDetails.time}. Tipo: ${meetingDetails.type === 'online' ? 'Online (' + meetingDetails.platform + ')' : 'Presencial'}`;
    return this.createNotification(email, 'meeting_scheduled', message, meetingDetails.id, meetingDetails);
  }
}

export const notifications = NotificationService;
