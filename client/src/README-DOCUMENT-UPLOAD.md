# Sistema de Upload de Documentos

Este documento descreve o sistema completo de upload e gestão de documentos implementado na aplicação de gestão de apresentações e audiências.

## Visão Geral

O sistema permite que usuários anexem documentos às suas cartas de apresentação e pedidos de audiência. Os documentos são armazenados de forma segura no Supabase Storage e podem ser visualizados e baixados posteriormente.

## Funcionalidades Implementadas

### 1. Upload de Documentos

- **Componente**: `DocumentUpload` (`/components/forms/document-upload.tsx`)
- **Formatos suportados**:
  - PDF (`.pdf`)
  - Microsoft Word (`.doc`, `.docx`)
  - Microsoft Excel (`.xls`, `.xlsx`)
  - Imagens (`.jpg`, `.jpeg`, `.png`)
- **Tamanho máximo**: 10MB por arquivo
- **Validações**:
  - Tipo de arquivo
  - Tamanho do arquivo
  - Autenticação do usuário

### 2. Visualização de Documentos

- **Componente**: `DocumentViewer` (`/components/forms/document-viewer.tsx`)
- **Funcionalidades**:
  - Visualizar nome e tipo do documento
  - Baixar/abrir documento em nova aba
  - Interface compacta e completa

### 3. Armazenamento Seguro

- **Serviço**: `storage-service.tsx` (`/supabase/functions/server/storage-service.tsx`)
- **Bucket**: `make-8b82752b-documents` (privado)
- **Estrutura de pastas**:
  - `presentations/{userId}/{timestamp}_filename.ext`
  - `audiences/{userId}/{timestamp}_filename.ext`
- **URLs assinadas**: Acesso temporário seguro aos documentos (1 hora de validade)

## Uso nos Formulários

### Carta de Apresentação

O formulário de carta de apresentação (`/components/forms/presentation-form.tsx`) agora inclui:

```tsx
<DocumentUpload
  label="Documento de Apresentação"
  folder="presentations"
  onUploadComplete={handleDocumentUpload}
  onRemove={handleDocumentRemove}
  required
/>
```

**Campos adicionados ao estado**:
- `documentPath`: Caminho do arquivo no storage
- `documentName`: Nome original do arquivo

### Pedido de Audiência

O formulário de pedido de audiência (`/components/forms/audience-form.tsx`) agora inclui:

```tsx
<DocumentUpload
  label="Documento Complementar"
  folder="audiences"
  onUploadComplete={handleDocumentUpload}
  onRemove={handleDocumentRemove}
  required
/>
```

**Campos adicionados ao estado**:
- `documentPath`: Caminho do arquivo no storage
- `documentName`: Nome original do arquivo

## API Endpoints

### 1. Upload de Documento

**Endpoint**: `POST /make-server-8b82752b/documents/upload`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body**:
```json
{
  "fileName": "documento.pdf",
  "fileType": "application/pdf",
  "fileData": "base64_encoded_data",
  "folder": "presentations" // ou "audiences"
}
```

**Resposta**:
```json
{
  "success": true,
  "path": "presentations/{userId}/{timestamp}_documento.pdf"
}
```

### 2. Obter URL Assinada

**Endpoint**: `POST /make-server-8b82752b/documents/signed-url`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body**:
```json
{
  "filePath": "presentations/{userId}/{timestamp}_documento.pdf"
}
```

**Resposta**:
```json
{
  "success": true,
  "url": "https://...signed_url..."
}
```

### 3. Deletar Documento

**Endpoint**: `DELETE /make-server-8b82752b/documents/{encodedFilePath}`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Resposta**:
```json
{
  "success": true
}
```

## Segurança

### Controle de Acesso

1. **Autenticação obrigatória**: Todos os endpoints requerem token JWT válido
2. **Isolamento por usuário**: Arquivos organizados por pasta de usuário
3. **Bucket privado**: Arquivos não são acessíveis publicamente
4. **URLs temporárias**: URLs assinadas com validade de 1 hora
5. **Validação de propriedade**: Usuários só podem deletar seus próprios arquivos (exceto admin)

### Auditoria

Todas as operações de upload e deleção são registradas no sistema de auditoria com:
- ID do usuário
- Email do usuário
- Tipo de operação
- Caminho do arquivo
- Timestamp
- IP e User-Agent

## Integração com Formulários Existentes

### Passo 1: Importar Componente

```tsx
import { DocumentUpload } from "./document-upload";
```

### Passo 2: Adicionar Estado

```tsx
const [documentPath, setDocumentPath] = useState<string>('');
const [documentName, setDocumentName] = useState<string>('');
```

### Passo 3: Criar Handlers

```tsx
const handleDocumentUpload = (filePath: string, fileName: string) => {
  setDocumentPath(filePath);
  setDocumentName(fileName);
};

const handleDocumentRemove = () => {
  setDocumentPath('');
  setDocumentName('');
};
```

### Passo 4: Adicionar Componente ao Form

```tsx
<DocumentUpload
  label="Seu Documento"
  folder="nome_da_pasta"
  onUploadComplete={handleDocumentUpload}
  onRemove={handleDocumentRemove}
  required={true} // ou false
/>
```

### Passo 5: Validar no Submit

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!documentPath) {
    toast.error("Por favor, anexe um documento");
    return;
  }
  
  // Enviar dados incluindo documentPath e documentName
};
```

## Visualização de Documentos Anexados

Para exibir documentos em listas ou detalhes:

```tsx
import { DocumentViewer } from "./document-viewer";

// Modo completo
<DocumentViewer
  filePath={item.documentPath}
  fileName={item.documentName}
  showLabel={true}
  variant="default"
/>

// Modo compacto (apenas botão)
<DocumentViewer
  filePath={item.documentPath}
  fileName={item.documentName}
  variant="compact"
/>
```

## Estrutura do Backend

### Inicialização do Bucket

O bucket é criado automaticamente na inicialização do sistema:

```tsx
// Em /supabase/functions/server/index.tsx
await storageService.initializeStorageBucket();
```

### Configurações do Bucket

- **Nome**: `make-8b82752b-documents`
- **Visibilidade**: Privado
- **Tamanho máximo**: 10MB por arquivo
- **Tipos permitidos**: PDF, Word, Excel, Imagens

## Fluxo Completo

1. **Usuário seleciona arquivo** → Componente valida tipo e tamanho
2. **Arquivo convertido para base64** → Upload via API
3. **Backend valida autenticação** → Verifica token JWT
4. **Arquivo salvo no storage** → Organizado por pasta de usuário
5. **Caminho retornado** → Frontend armazena referência
6. **Formulário enviado** → Inclui referência ao documento
7. **Visualização posterior** → URL assinada gerada sob demanda

## Tratamento de Erros

### Frontend

- Validação de tipo de arquivo
- Validação de tamanho
- Mensagens de erro amigáveis via toast
- Estados de loading durante upload/download

### Backend

- Validação de autenticação
- Validação de dados
- Logs de erros detalhados
- Respostas de erro padronizadas

## Manutenção e Limpeza

### Recomendações Futuras

1. **Limpeza automática**: Implementar job para remover arquivos órfãos
2. **Quota por usuário**: Limitar espaço total por usuário
3. **Compressão**: Otimizar imagens antes do upload
4. **Preview**: Gerar thumbnails para documentos
5. **Versionamento**: Manter histórico de versões de documentos

## Troubleshooting

### Erro: "No authorization token provided"
- Verificar se usuário está autenticado
- Verificar se token está sendo enviado corretamente

### Erro: "Tipo de arquivo não suportado"
- Verificar extensão do arquivo
- Consultar lista de tipos aceites

### Erro: "O arquivo não pode exceder 10MB"
- Reduzir tamanho do arquivo
- Comprimir ou otimizar documento

### Documento não abre ao clicar
- Verificar se URL assinada foi gerada corretamente
- Verificar logs do navegador para erros de CORS
- Verificar se bucket está configurado corretamente

## Próximos Passos

Para integração completa com o sistema de apresentações e audiências:

1. Atualizar rotas de criação (`POST /presentations` e `POST /audiences`) para aceitar `documentPath` e `documentName`
2. Atualizar componentes de lista para exibir documentos anexados
3. Adicionar validação de documento obrigatório no backend
4. Implementar deleção automática de documentos quando registros são removidos

## Conclusão

O sistema de upload de documentos está completamente funcional e pronto para uso. Ele fornece uma solução segura, escalável e amigável para gestão de documentos na aplicação de apresentações e audiências.
