import { useState } from "react";
import { Car, Upload, X, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Viatura } from "./types";
import { FileUpload } from "../ui/file-upload";
import { useFileUpload } from "../../hooks/use-file-upload";

interface ViaturaFormProps {
  viatura?: Viatura;
  onSave: (viatura: Partial<Viatura>) => void;
  onCancel: () => void;
}

export function ViaturaForm({ viatura, onSave, onCancel }: ViaturaFormProps) {
  const [formData, setFormData] = useState({
    matricula: viatura?.matricula || '',
    marca: viatura?.marca || '',
    modelo: viatura?.modelo || '',
    ano: viatura?.ano || new Date().getFullYear(),
    cor: viatura?.cor || '',
    tipo: viatura?.tipo || '',
    combustivel: viatura?.combustivel || 'gasolina',
    cilindrada: viatura?.cilindrada || '',
    lugares: viatura?.lugares || 5,
    chassis: viatura?.chassis || '',
    km_atual: viatura?.km_atual || 0,
    km_proxima_revisao: viatura?.km_proxima_revisao || 0,
    seguro_validade: viatura?.seguro_validade || '',
    inspecao_validade: viatura?.inspecao_validade || '',
    custo_aquisicao: viatura?.custo_aquisicao || 0,
    observacoes: viatura?.observacoes || '',
    departamento: viatura?.departamento || 'Administração',
    localizacao_atual: viatura?.localizacao_atual || 'Garagem Principal',
  });

  const {
    files,
    uploading,
    uploadFiles,
    removeFile,
    formatFileSize,
  } = useFileUpload('make-8b82752b-frotas');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validar campos obrigatórios
    if (!formData.matricula || !formData.marca || !formData.modelo || !formData.tipo) {
      alert('Por favor, preencha todos os campos obrigatórios: Matrícula, Marca, Modelo e Tipo');
      return;
    }

    // Validar formato de matrícula angolana (aceita 2 ou 3 letras no início)
    const matriculaRegex = /^[A-Z]{2,3}-\d{2}-\d{2}-[A-Z]{2}$/;
    if (!matriculaRegex.test(formData.matricula)) {
      alert('Formato de matrícula inválido.\n\nFormatos aceites:\n- LD-12-34-AB (duas letras)\n- LDA-12-34-AB (três letras)');
      return;
    }

    onSave({
      ...formData,
      documentos: files.map(f => ({ nome: f.name, url: f.url, tamanho: f.size })),
      status: 'disponivel',
      custo_total_manutencao: 0,
      custo_total_combustivel: 0,
    });
  };

  const handleUpload = async (fileList: FileList) => {
    try {
      await uploadFiles(fileList);
    } catch (err) {
 console.error('Erro ao fazer upload:', err);
    }
  };

  const handleRemove = async (fileId: string) => {
    try {
      await removeFile(fileId);
    } catch (err) {
 console.error('Erro ao remover ficheiro:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Car className="h-6 w-6" />
            {viatura ? 'Editar Viatura' : 'Nova Viatura'}
          </h1>
          <p className="text-muted-foreground">
            {viatura ? `Viatura ${viatura.matricula}` : 'Registar nova viatura na frota'}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação da Viatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula *</Label>
              <Input
                id="matricula"
                placeholder="Ex: LD-12-34-AB ou LDA-12-34-AB"
                value={formData.matricula}
                onChange={(e) => handleChange('matricula', e.target.value.toUpperCase())}
              />
              <p className="text-xs text-muted-foreground">
                Formatos aceites: LD-12-34-AB (2 letras) ou LDA-12-34-AB (3 letras)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassis">Nº Chassis</Label>
              <Input
                id="chassis"
                placeholder="Nº do chassis"
                value={formData.chassis}
                onChange={(e) => handleChange('chassis', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                placeholder="Ex: Toyota"
                value={formData.marca}
                onChange={(e) => handleChange('marca', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                placeholder="Ex: Land Cruiser"
                value={formData.modelo}
                onChange={(e) => handleChange('modelo', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.ano}
                onChange={(e) => handleChange('ano', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Características */}
      <Card>
        <CardHeader>
          <CardTitle>Características</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="Ligeiro">Ligeiro</option>
                <option value="SUV">SUV</option>
                <option value="Carrinha">Carrinha</option>
                <option value="Pick-up">Pick-up</option>
                <option value="Autocarro">Autocarro</option>
                <option value="Camião">Camião</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="combustivel">Combustível *</Label>
              <select
                id="combustivel"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.combustivel}
                onChange={(e) => handleChange('combustivel', e.target.value)}
              >
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="electrico">Eléctrico</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                placeholder="Ex: Branco"
                value={formData.cor}
                onChange={(e) => handleChange('cor', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lugares">Lugares *</Label>
              <Input
                id="lugares"
                type="number"
                min="1"
                max="60"
                value={formData.lugares}
                onChange={(e) => handleChange('lugares', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cilindrada">Cilindrada</Label>
              <Input
                id="cilindrada"
                placeholder="Ex: 2.8L"
                value={formData.cilindrada}
                onChange={(e) => handleChange('cilindrada', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custo_aquisicao">Custo de Aquisição (AOA)</Label>
              <Input
                id="custo_aquisicao"
                type="number"
                min="0"
                step="0.01"
                value={formData.custo_aquisicao}
                onChange={(e) => handleChange('custo_aquisicao', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kilometragem */}
      <Card>
        <CardHeader>
          <CardTitle>Kilometragem e Manutenção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="km_atual">Kilometragem Actual *</Label>
              <Input
                id="km_atual"
                type="number"
                min="0"
                value={formData.km_atual}
                onChange={(e) => handleChange('km_atual', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="km_proxima_revisao">KM Próxima Revisão</Label>
              <Input
                id="km_proxima_revisao"
                type="number"
                min="0"
                value={formData.km_proxima_revisao}
                onChange={(e) => handleChange('km_proxima_revisao', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se não aplicável
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seguro_validade">Validade do Seguro</Label>
              <Input
                id="seguro_validade"
                type="date"
                value={formData.seguro_validade}
                onChange={(e) => handleChange('seguro_validade', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspecao_validade">Validade da Inspecção</Label>
              <Input
                id="inspecao_validade"
                type="date"
                value={formData.inspecao_validade}
                onChange={(e) => handleChange('inspecao_validade', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Documentos (Livrete, Seguro, etc.)</Label>
            <FileUpload
              onUpload={handleUpload}
              onRemove={handleRemove}
              files={files}
              uploading={uploading}
              formatFileSize={formatFileSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Observações adicionais sobre a viatura..."
            rows={4}
            value={formData.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {viatura ? 'Actualizar Viatura' : 'Registar Viatura'}
        </Button>
      </div>
    </div>
  );
}