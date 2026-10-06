/**
 * Limite de extraccoes de facturas com IA de UM utilizador (Administrador do
 * Sistema). A matriz "Roles e Permissoes" decide se o perfil pode usar a
 * extraccao com IA; aqui define-se quantas vezes este utilizador a pode usar:
 * vazio = sem limite, 0 = nenhuma, N = N por mes ou N no total.
 */

import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { API_BASE_URL } from "@/services/api";
import { useAuth } from "../auth/auth-context";

interface Props {
  utilizador: { id: string; name: string } | null;
  onClose: () => void;
}

type Periodo = 'mensal' | 'total';

export function LimiteExtraccaoIaDialog({ utilizador, onClose }: Props) {
  const { accessToken } = useAuth();
  const [limite, setLimite] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [usadas, setUsadas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const url = utilizador ? `${API_BASE_URL}/users/${utilizador.id}/limite-extraccao-ia` : '';
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!utilizador) return;
    setLoading(true);
    fetch(url, { headers })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message || 'Erro ao carregar o limite');
        setLimite(body.limite === null || body.limite === undefined ? '' : String(body.limite));
        setPeriodo(body.periodo === 'total' ? 'total' : 'mensal');
        setUsadas(Number(body.usadas) || 0);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utilizador?.id]);

  const guardar = async () => {
    const valor = limite.trim();
    if (valor && (!/^\d+$/.test(valor))) {
      toast.error('O limite tem de ser um número inteiro (0 ou mais), ou vazio para sem limite.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ limite: valor === '' ? null : Number(valor), periodo }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Erro ao guardar o limite');
      setUsadas(Number(body.usadas) || 0);
      toast.success(`Limite de extracções com IA de ${utilizador?.name} guardado.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar o limite');
    } finally {
      setSaving(false);
    }
  };

  const n = limite.trim() === '' ? null : Number(limite);
  const resumo = n === null
    ? 'Sem limite — pode usar a extracção com IA sempre que o perfil o permitir.'
    : n === 0
      ? 'Nenhuma — não pode usar a extracção com IA.'
      : periodo === 'total'
        ? `Pode usar a extracção com IA ${n} vez(es) no total.`
        : `Pode usar a extracção com IA ${n} vez(es) por mês.`;

  return (
    <Dialog open={!!utilizador} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Extracções de facturas com IA
          </DialogTitle>
          <DialogDescription>
            {utilizador?.name}. Se pode usar a extracção com IA decide-se no perfil (Roles e Permissões); aqui define-se quantas vezes.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> A carregar...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="limite-ia">Número de extracções</Label>
                <Input
                  id="limite-ia"
                  inputMode="numeric"
                  placeholder="Sem limite"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value.replace(/[^\d]/g, ''))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodo-ia">Período</Label>
                <select
                  id="periodo-ia"
                  className="w-full h-9 px-3 border border-input rounded-md bg-background text-sm"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as Periodo)}
                >
                  <option value="mensal">Por mês</option>
                  <option value="total">No total (para sempre)</option>
                </select>
              </div>
            </div>
            <p className="text-sm">{resumo}</p>
            <p className="text-xs text-muted-foreground">
              Já usadas {periodo === 'total' ? 'no total' : 'este mês'}: <strong>{usadas}</strong>.
              Vazio = sem limite · 0 = nenhuma · 1 = uma única vez.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
