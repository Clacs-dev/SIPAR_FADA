import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { Trash2, RotateCcw, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useTrash, TrashItem } from '../../hooks/use-trash';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-PT');
}

export function TrashScreen() {
  const { items, loading, error, reload, restore, permanentlyDelete } = useTrash();
  const [moduleFilter, setModuleFilter] = useState('all');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TrashItem | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const modules = Array.from(new Map(items.map((i) => [i.module, i.moduleDisplayName])).entries());
  const filteredItems = moduleFilter === 'all' ? items : items.filter((i) => i.module === moduleFilter);

  const handleRestore = async (item: TrashItem) => {
    setRestoringId(`${item.module}:${item.id}`);
    try {
      await restore(item.module, item.id);
      toast.success(`${item.moduleDisplayName} restaurado com sucesso`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao restaurar');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmTarget || confirmText !== 'ELIMINAR') return;
    setDeleting(true);
    try {
      await permanentlyDelete(confirmTarget.module, confirmTarget.id);
      toast.success(`${confirmTarget.moduleDisplayName} eliminado definitivamente`);
      setConfirmTarget(null);
      setConfirmText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao eliminar definitivamente');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
            Administração
          </div>
          <h1 className="font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>Lixeira</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
            Registos eliminados em qualquer módulo do sistema — restaure ou elimine definitivamente
          </p>
        </div>
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Filtrar por módulo</Label>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos ({items.length})</SelectItem>
            {modules.map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5" /> Itens na Lixeira</CardTitle>
          <CardDescription>Dados reais — nada aparece aqui a menos que tenha sido eliminado de facto</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Não foi possível carregar a lixeira: {error}.{' '}
                <button type="button" onClick={reload} className="underline">Tentar novamente</button>
              </AlertDescription>
            </Alert>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Lixeira vazia</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div key={`${item.module}:${item.id}`} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{item.moduleDisplayName}</Badge>
                      <span className="font-medium truncate">{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Eliminado em {formatDate(item.deletedAt)} por {item.deletedByName || 'desconhecido'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item)}
                      disabled={restoringId === `${item.module}:${item.id}`}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { setConfirmTarget(item); setConfirmText(''); }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar Definitivamente
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) { setConfirmTarget(null); setConfirmText(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar Definitivamente
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong>. "{confirmTarget?.label}" ({confirmTarget?.moduleDisplayName}) será apagado permanentemente da base de dados.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Não há forma de recuperar este registo depois desta ação.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete-text">
              Digite <strong>"ELIMINAR"</strong> para confirmar:
            </Label>
            <input
              id="confirm-delete-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmTarget(null); setConfirmText(''); }} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handlePermanentDelete} disabled={confirmText !== 'ELIMINAR' || deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Confirmar Eliminação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
