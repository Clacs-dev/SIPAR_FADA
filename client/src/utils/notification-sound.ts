/**
 * Som curto ("ding-dong") tocado quando chega uma notificacao nova (ex:
 * factura/proforma submetida para validacao do Chefe DSG). Gerado com Web
 * Audio - sem ficheiro de audio para carregar nem servir.
 *
 * Os browsers so deixam tocar audio depois de o utilizador interagir com a
 * pagina; o contexto e criado/retomado no primeiro clique ou tecla.
 */

let contexto: AudioContext | null = null;

function obterContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!contexto) contexto = new Ctor();
  return contexto;
}

// Desbloqueia o audio na primeira interaccao do utilizador.
if (typeof window !== 'undefined') {
  const desbloquear = () => {
    const ctx = obterContexto();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    window.removeEventListener('pointerdown', desbloquear);
    window.removeEventListener('keydown', desbloquear);
  };
  window.addEventListener('pointerdown', desbloquear);
  window.addEventListener('keydown', desbloquear);
}

function tom(ctx: AudioContext, frequencia: number, inicio: number, duracao: number) {
  const osc = ctx.createOscillator();
  const ganho = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequencia;
  ganho.gain.setValueAtTime(0.0001, inicio);
  ganho.gain.exponentialRampToValueAtTime(0.25, inicio + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
  osc.connect(ganho).connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + duracao + 0.05);
}

export function tocarSomNotificacao() {
  try {
    const ctx = obterContexto();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const agora = ctx.currentTime;
    tom(ctx, 880, agora, 0.35);
    tom(ctx, 660, agora + 0.18, 0.45);
  } catch {
    // sem audio disponivel - a notificacao continua visivel no sino
  }
}
