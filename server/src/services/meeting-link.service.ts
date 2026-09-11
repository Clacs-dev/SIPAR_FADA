import logger from '../config/logger';
import { SettingsService } from './settings.service';

export type MeetingPlatform = 'googlemeet' | 'google_meet' | 'meet' | 'zoom' | 'teams' | 'microsoft_teams' | 'skype' | 'whatsapp' | string;

export interface MeetingLinkInput {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  endTime?: string;
  duration?: string;
  platform?: MeetingPlatform;
  organizerEmail?: string;
  attendees?: string[];
}

function normalizePlatform(platform?: string) {
  const value = (platform || 'googlemeet').toLowerCase().trim();
  if (['googlemeet', 'google_meet', 'google-meet', 'google meet', 'meet'].includes(value)) return 'googlemeet';
  if (['microsoft_teams', 'microsoft-teams', 'microsoft teams', 'teams', 'ms-teams'].includes(value)) return 'teams';
  if (['zoom'].includes(value)) return 'zoom';
  if (['skype'].includes(value)) return 'skype';
  if (['whatsapp', 'whatsapp_video'].includes(value)) return 'whatsapp';
  return value;
}

function platformFallbackLink(platform: string) {
  const envKey = `MEETING_${platform.toUpperCase()}_DEFAULT_LINK`;
  return SettingsService.get(`meeting_${platform}_default_link`, envKey);
}

function generalFallbackLink() {
  return SettingsService.get('meeting_default_link', 'MEETING_DEFAULT_LINK');
}

function configuredLink(platform: string) {
  return platformFallbackLink(platform) || generalFallbackLink();
}

function parseDurationMinutes(duration?: string) {
  if (!duration) return 60;
  if (/^\d+$/.test(duration)) return Number(duration);
  const hourMatch = duration.match(/(\d+)h/);
  const minuteMatch = duration.match(/(\d+)\s?min/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return hours * 60 + minutes || 60;
}

function buildDateRange(input: MeetingLinkInput) {
  const date = input.date || new Date().toISOString().slice(0, 10);
  const time = input.time || '09:00';
  const start = new Date(`${date}T${time}:00`);
  const end = input.endTime
    ? new Date(`${date}T${input.endTime}:00`)
    : new Date(start.getTime() + parseDurationMinutes(input.duration) * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    timeZone: SettingsService.get('meeting_timezone', 'MEETING_TIMEZONE') || 'Africa/Luanda',
  };
}

async function postForm(url: string, body: Record<string, string>, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(body).toString(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return response.json() as Promise<any>;
}

async function createGoogleMeet(input: MeetingLinkInput) {
  const clientId = SettingsService.get('google_client_id', 'GOOGLE_CLIENT_ID');
  const clientSecret = SettingsService.get('google_client_secret', 'GOOGLE_CLIENT_SECRET');
  const refreshToken = SettingsService.get('google_refresh_token', 'GOOGLE_REFRESH_TOKEN');
  if (!clientId || !clientSecret || !refreshToken) return null;

  const token = await postForm('https://oauth2.googleapis.com/token', {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const range = buildDateRange(input);
  const calendarId = encodeURIComponent(SettingsService.get('google_calendar_id', 'GOOGLE_CALENDAR_ID') || 'primary');
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: input.title || 'Reuniao SIPAR20',
      description: input.description || '',
      start: { dateTime: range.start, timeZone: range.timeZone },
      end: { dateTime: range.end, timeZone: range.timeZone },
      attendees: (input.attendees || []).filter(Boolean).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `sipar20-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        }
      }
    }),
  });

  if (!response.ok) throw new Error(`Google Calendar HTTP ${response.status}: ${await response.text()}`);
  const event = await response.json() as any;
  return event.hangoutLink || event.conferenceData?.entryPoints?.find((entry: any) => entry.entryPointType === 'video')?.uri || null;
}

async function createZoomMeeting(input: MeetingLinkInput) {
  const accountId = SettingsService.get('zoom_account_id', 'ZOOM_ACCOUNT_ID');
  const clientId = SettingsService.get('zoom_client_id', 'ZOOM_CLIENT_ID');
  const clientSecret = SettingsService.get('zoom_client_secret', 'ZOOM_CLIENT_SECRET');
  if (!accountId || !clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const token = await postForm('https://zoom.us/oauth/token', {
    grant_type: 'account_credentials',
    account_id: accountId,
  }, { Authorization: `Basic ${auth}` });

  const range = buildDateRange(input);
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: input.title || 'Reuniao SIPAR20',
      type: 2,
      start_time: range.start,
      duration: parseDurationMinutes(input.duration),
      timezone: range.timeZone,
      agenda: input.description || '',
      settings: {
        join_before_host: false,
        waiting_room: true,
      }
    }),
  });

  if (!response.ok) throw new Error(`Zoom HTTP ${response.status}: ${await response.text()}`);
  const meeting = await response.json() as any;
  return meeting.join_url || null;
}

async function createTeamsMeeting(input: MeetingLinkInput) {
  const tenantId = SettingsService.get('teams_tenant_id', 'MICROSOFT_TENANT_ID');
  const clientId = SettingsService.get('teams_client_id', 'MICROSOFT_CLIENT_ID');
  const clientSecret = SettingsService.get('teams_client_secret', 'MICROSOFT_CLIENT_SECRET');
  const userId = SettingsService.get('teams_user_id', 'MICROSOFT_USER_ID') || process.env.MICROSOFT_ORGANIZER_ID;
  if (!tenantId || !clientId || !clientSecret || !userId) return null;

  const token = await postForm(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const range = buildDateRange(input);
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/onlineMeetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: input.title || 'Reuniao SIPAR20',
      startDateTime: range.start,
      endDateTime: range.end,
      participants: {
        attendees: (input.attendees || []).filter(Boolean).map((email) => ({
          identity: { user: { id: email } },
          role: 'attendee',
        })),
      },
    }),
  });

  if (!response.ok) throw new Error(`Microsoft Graph HTTP ${response.status}: ${await response.text()}`);
  const meeting = await response.json() as any;
  return meeting.joinWebUrl || null;
}

const PLATFORM_LABELS: Record<string, string> = {
  googlemeet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
};

export class MeetingLinkService {
  /**
   * Resolve um link a partir do que estiver de facto configurado pelo admin
   * (fallback especifico da plataforma, depois o geral). NUNCA inventa um
   * link placeholder - se nada estiver configurado devolve null, e quem
   * chamar deve tratar isso como "plataforma nao configurada", nao criar
   * uma reuniao com um link falso que ninguem consegue usar.
   */
  static generate(input: MeetingLinkInput): string | null {
    const platform = normalizePlatform(input.platform);
    return configuredLink(platform) || null;
  }

  static async create(input: MeetingLinkInput): Promise<string | null> {
    const platform = normalizePlatform(input.platform);
    try {
      const realLink = platform === 'zoom'
        ? await createZoomMeeting(input)
        : platform === 'teams'
          ? await createTeamsMeeting(input)
          : platform === 'googlemeet'
            ? await createGoogleMeet(input)
            : null;

      if (realLink) {
        logger.info(`[MeetingLinkService] Link real criado para ${platform}`);
        return realLink;
      }
    } catch (error) {
      logger.error(`[MeetingLinkService] Falha ao criar reuniao real em ${platform}. Tentando fallback configurado.`, error);
    }

    const fallback = this.generate(input);
    if (!fallback) {
      logger.warn(`[MeetingLinkService] Nenhuma API real nem link de fallback configurado para ${platform}.`);
    }
    return fallback;
  }

  static getConfigStatus() {
    return {
      googlemeet: {
        configured: Boolean(
          SettingsService.get('google_client_id', 'GOOGLE_CLIENT_ID')
          && SettingsService.get('google_client_secret', 'GOOGLE_CLIENT_SECRET')
          && SettingsService.get('google_refresh_token', 'GOOGLE_REFRESH_TOKEN')
        ),
        fallbackLink: Boolean(platformFallbackLink('googlemeet')),
      },
      zoom: {
        configured: Boolean(
          SettingsService.get('zoom_account_id', 'ZOOM_ACCOUNT_ID')
          && SettingsService.get('zoom_client_id', 'ZOOM_CLIENT_ID')
          && SettingsService.get('zoom_client_secret', 'ZOOM_CLIENT_SECRET')
        ),
        fallbackLink: Boolean(platformFallbackLink('zoom')),
      },
      teams: {
        configured: Boolean(
          SettingsService.get('teams_tenant_id', 'MICROSOFT_TENANT_ID')
          && SettingsService.get('teams_client_id', 'MICROSOFT_CLIENT_ID')
          && SettingsService.get('teams_client_secret', 'MICROSOFT_CLIENT_SECRET')
        ),
        fallbackLink: Boolean(platformFallbackLink('teams')),
      },
      generalFallbackLink: Boolean(generalFallbackLink()),
    };
  }

  /**
   * Lista, para consumo de qualquer utilizador autenticado (nao so
   * admin_sistema), quais plataformas produzem de facto um link ao agendar
   * uma reuniao - para o seletor de plataforma no frontend so mostrar as
   * que funcionam, e nunca deixar escolher uma que vai falhar.
   */
  static listAvailablePlatforms() {
    const status = this.getConfigStatus();
    return (['googlemeet', 'zoom', 'teams'] as const).map((key) => ({
      key,
      label: PLATFORM_LABELS[key],
      usable: status[key].configured || status[key].fallbackLink || status.generalFallbackLink,
    }));
  }
}
