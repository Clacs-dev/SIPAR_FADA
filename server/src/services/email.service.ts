import logger from '../config/logger';
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Serviço de e-mail integrado para notificações transacionais
 */
export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (this.transporter) return this.transporter;

    const gmailUser = process.env.GMAIL_USER || process.env.GOOGLE_SMTP_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GOOGLE_SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || (gmailUser && gmailPass ? 'smtp.gmail.com' : undefined);
    const smtpPort = parseInt(process.env.SMTP_PORT || (smtpHost === 'smtp.gmail.com' ? '465' : '587'));
    const smtpUser = process.env.SMTP_USER || gmailUser;
    const smtpPass = process.env.SMTP_PASS || gmailPass;

    if (smtpHost && smtpUser && smtpPass) {
      logger.info('[EmailService] Inicializando Nodemailer via SMTP...');
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    } else {
      logger.warn('[EmailService] Configuracoes de SMTP ausentes. E-mails serao impressos apenas nos logs do sistema em desenvolvimento.');
    }

    return this.transporter;
  }

  /**
   * Envia um e-mail transacional
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    const fromAddress = options.from || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'sipar20@sistema.com';
    
    try {
      const transporter = this.getTransporter();
      
      if (transporter) {
        await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        logger.info(`[EmailService] E-mail enviado com sucesso para ${options.to}`);
        return true;
      } else {
        // Fallback: imprimir nos logs do sistema
        logger.info('[EmailService] FALLBACK SIMULADO - CONTEUDO DO E-MAIL:');
        logger.info(`   De: ${fromAddress}`);
        logger.info(`   Para: ${options.to}`);
        logger.info(`   Assunto: ${options.subject}`);
        logger.info(`   Corpo HTML (Resumo): ${options.html.substring(0, 300)}...`);
        return true;
      }
    } catch (error) {
      logger.error(`[EmailService] Erro ao enviar e-mail para ${options.to}:`, error);
      // Retornar true no ambiente de dev mesmo com falha para não travar os fluxos de aprovação
      return process.env.NODE_ENV === 'development';
    }
  }

  static getStatus() {
    const gmailUser = process.env.GMAIL_USER || process.env.GOOGLE_SMTP_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GOOGLE_SMTP_PASS;
    const smtpUser = process.env.SMTP_USER || gmailUser;
    const smtpPass = process.env.SMTP_PASS || gmailPass;
    const smtpHost = process.env.SMTP_HOST || (gmailUser && gmailPass ? 'smtp.gmail.com' : undefined);

    return {
      configured: Boolean(smtpHost && smtpUser && smtpPass),
      provider: smtpHost === 'smtp.gmail.com' ? 'gmail' : smtpHost ? 'smtp' : 'logs',
      host: smtpHost || null,
      user: smtpUser ? smtpUser.replace(/(^.).*(@.*$)/, '$1***$2') : null,
      from: process.env.EMAIL_FROM || smtpUser || 'sipar20@sistema.com',
    };
  }

  static async verifyConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const transporter = this.getTransporter();
      if (!transporter) return { ok: false, error: 'SMTP/Gmail nao configurado' };
      await transporter.verify();
      return { ok: true };
    } catch (error: any) {
      logger.error('[EmailService] Falha ao verificar SMTP:', error);
      return { ok: false, error: error?.message || 'Falha ao verificar SMTP' };
    }
  }
}

export const emailService = EmailService;
