import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Loader2, Save, PenTool } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL } from '@/services/api';
import { useAuth } from "../auth/auth-context";

interface MeuPerfilDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Permite a qualquer utilizador editar os seus proprios dados (nome, e-mail,
 * telefone), carregar a sua assinatura (a mesma imagem usada para assinar a
 * Ordem de Pagamento e, futuramente, actas) e trocar a password.
 */
export function MeuPerfilDialog({ open, onOpenChange }: MeuPerfilDialogProps) {
  const { user, accessToken, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  const resetFromUser = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setOrganization(user?.organization || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleOpenChange = (next: boolean) => {
    if (next) resetFromUser();
    onOpenChange(next);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('O nome não pode ficar vazio');
      return;
    }
    setSavingProfile(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, organization }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || 'Erro ao guardar os dados');
      await refreshUser();
      toast.success('Dados actualizados com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar os dados');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Indique a password actual e a nova password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova password deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação não corresponde à nova password');
      return;
    }
    setSavingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || 'Erro ao trocar a password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password alterada com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao trocar a password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUploadSignature = async (file: File) => {
    setUploadingSignature(true);
    try {
      // Upload e associacao ao perfil num unico pedido multipart (evita dois
      // fetch() sequenciais, que ficaram sujeitos a interferencia do browser
      // a meio - o ficheiro chegava a ser guardado no servidor, mas nunca
      // ficava associado ao utilizador).
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/auth/me/signature`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Erro ao carregar a assinatura');

      await refreshUser();
      toast.success('Assinatura carregada com sucesso! Será usada sempre que assinar um documento.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar a assinatura');
    } finally {
      setUploadingSignature(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>
            Edite os seus dados pessoais, a sua assinatura e a sua password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="perfil-nome">Nome</Label>
              <Input id="perfil-nome" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil-email">E-mail</Label>
              <Input id="perfil-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil-telefone">Telefone</Label>
              <Input id="perfil-telefone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+244 9xx xxx xxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil-organizacao">Organização/Departamento</Label>
              <Input id="perfil-organizacao" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
              {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Dados
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Minha Assinatura
            </Label>
            <p className="text-xs text-muted-foreground">
              Esta imagem é usada automaticamente sempre que assinar uma Ordem de Pagamento ou outro documento.
            </p>
            {user?.signatureImage && (
              <div className="border rounded-lg p-2 bg-muted/40">
                <img src={user.signatureImage} alt="Assinatura actual" className="h-16 object-contain" />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              disabled={uploadingSignature}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadSignature(file);
                e.target.value = '';
              }}
            />
            {uploadingSignature && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> A carregar assinatura...
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Trocar Password</Label>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Nova password (mín. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirmar nova password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleChangePassword} disabled={savingPassword} className="w-full">
              {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Trocar Password
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
