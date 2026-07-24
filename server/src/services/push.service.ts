import webpush, { PushSubscription as WebPushSubscription } from 'web-push';
import prisma from '../config/database';
import logger from '../config/logger';

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  data?: any;
}

function configured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configureWebPush() {
  if (!configured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@sipar20.local',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return true;
}

function toWebPushSubscription(record: any): WebPushSubscription {
  return {
    endpoint: record.endpoint,
    keys: {
      auth: record.auth,
      p256dh: record.p256dh,
    }
  };
}

export class PushService {
  static getStatus() {
    return {
      configured: configured(),
      publicKey: process.env.VAPID_PUBLIC_KEY || '',
    };
  }

  static async saveSubscription(userId: string, subscription: any, userAgent?: string) {
    const endpoint = subscription.endpoint;
    const auth = subscription.keys?.auth;
    const p256dh = subscription.keys?.p256dh;

    if (!endpoint || !auth || !p256dh) {
      throw new Error('Subscription push invalida');
    }

    return prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        auth,
        p256dh,
        userAgent,
        active: true,
      },
      create: {
        userId,
        endpoint,
        auth,
        p256dh,
        userAgent,
      }
    });
  }

  static async sendToSubscriptions(records: any[], payload: PushPayload) {
    if (!configureWebPush()) {
      logger.warn('[PushService] VAPID nao configurado. Push real ignorado.');
      return { sent: 0, failed: 0, configured: false };
    }

    let sent = 0;
    let failed = 0;
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      url: payload.url || '/',
      data: payload.data || {},
    });

    for (const record of records) {
      try {
        await webpush.sendNotification(toWebPushSubscription(record), body);
        sent += 1;
      } catch (error: any) {
        failed += 1;
        logger.error('[PushService] Falha ao enviar push:', error);
        if ([404, 410].includes(error?.statusCode)) {
          await prisma.pushSubscription.update({
            where: { id: record.id },
            data: { active: false },
          }).catch(() => {});
        }
      }
    }

    return { sent, failed, configured: true };
  }

  static async sendToUser(userId: string, payload: PushPayload) {
    const records = await prisma.pushSubscription.findMany({ where: { userId, active: true } });
    return this.sendToSubscriptions(records, payload);
  }

  static async sendToRole(role: string, payload: PushPayload) {
    const users = await prisma.user.findMany({ where: { role, status: 'active' }, select: { id: true } });
    const records = await prisma.pushSubscription.findMany({
      where: { userId: { in: users.map((user) => user.id) }, active: true }
    });
    return this.sendToSubscriptions(records, payload);
  }

  static async broadcast(payload: PushPayload) {
    const records = await prisma.pushSubscription.findMany({ where: { active: true } });
    return this.sendToSubscriptions(records, payload);
  }
}
