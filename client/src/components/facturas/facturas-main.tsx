import { useState, useEffect, useMemo } from "react";
import { 
  Receipt,
  Plus,
  LayoutGrid,
  List,
  Clock,
  CheckCircle,
  DollarSign,
  FileText,
  Filter,
  FileSignature,
  Paperclip,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { FacturasDashboard } from "./facturas-dashboard";
import { FacturaForm } from "./factura-form";
import { FacturaDetails } from "./factura-details";
import { OrdensPagamentoInterna } from "./ordens-pagamento-interna";
import { MapaActividades } from "../shared/mapa-actividades";
import { MapaImpostos } from "../shared/mapa-impostos";
import { useMyPermissions } from "../../hooks/use-my-permissions";
import { MODULO_DO_SEPARADOR, SEPARADORES_PAGAMENTO } from "../auth/separadores-pagamento";
import { Factura, FacturaFilters, FacturaStats, Fornecedor } from "./types";
import { useAuth } from "../auth/auth-context";
import { DepartmentFilter } from "../common/department-filter";
import { PaginationBar } from "../common/pagination-bar";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from "sonner@2.0.3";
import { useFornecedores } from "../../hooks/use-fornecedores";
import { useClientPagination } from "../../hooks/use-client-pagination";

interface FacturasMainProps {
  /** Id de uma factura a abrir directamente nos detalhes (ex: vindo do Mapa de Impostos). */
  initialFacturaId?: string | null;
  /** Chamado assim que o deep-link acima foi consumido, para o limpar no componente pai. */
  onInitialFacturaHandled?: () => void;
}

export function FacturasMain({ initialFacturaId, onInitialFacturaHandled }: FacturasMainProps = {}) {
  const { user, accessToken } = useAuth();
  const { pode, carregado: permissoesCarregadas } = useMyPermissions();
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  // Cada separador so aparece se o role tiver a permissao correspondente
  // (Roles e Permissoes -> "Gestão de Pagamento — separadores").
  const ver = (tab: string) => pode(MODULO_DO_SEPARADOR[tab] || tab, 'read_all');
  const separadoresVisiveis = SEPARADORES_PAGAMENTO.filter((s) => ver(s.tab));
  useEffect(() => {
    if (!permissoesCarregadas || separadoresVisiveis.length === 0) return;
    if (!ver(activeTab)) setActiveTab(separadoresVisiveis[0].tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissoesCarregadas, activeTab, separadoresVisiveis.length]);
  const [filters, setFilters] = useState<FacturaFilters>({});
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar facturas do backend
  useEffect(() => {
    const fetchFacturas = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/facturas?all=true`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar facturas');
        }

        const data = await response.json();
 console.log('Facturas carregadas:', data);
        
        // A resposta vem como { success: true, facturas: [...] }
        const facturasData = data.facturas || [];
        setFacturas(facturasData);
      } catch (err) {
 console.error('Erro ao buscar facturas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchFacturas();
  }, [accessToken]);

  // Deep-link vindo do Mapa de Impostos (clique numa linha): assim que a
  // factura pedida estiver disponível na lista carregada, abre os seus
  // detalhes directamente (com o estado real: pendente, validado, aprovado,
  // rejeitado, etc.), em vez de ficar na lista.
  useEffect(() => {
    if (!initialFacturaId) return;
    const alvo = facturas.find((f) => f.id === initialFacturaId);
    if (alvo) {
      setSelectedFactura(alvo);
      setView('details');
      onInitialFacturaHandled?.();
    }
  }, [initialFacturaId, facturas, onInitialFacturaHandled]);

  // Fornecedores reais, cadastrados na plataforma via Procurement/Compras
  // (antes era uma lista fixa de exemplo - Sonangol, etc. - que nunca batia
  // com os fornecedores realmente cadastrados).
  const { fornecedores: fornecedoresProcurement, fetchFornecedores } = useFornecedores();
  useEffect(() => { fetchFornecedores(); }, [fetchFornecedores]);
  const fornecedores: Fornecedor[] = fornecedoresProcurement
    .filter((f) => f.situacao !== 'bloqueado')
    .map((f) => ({
      id: f.id,
      nome: f.nome,
      nif: f.nif || '',
      email: f.email || '',
      telefone: f.telefone || '',
      morada: f.endereco || [f.cidade, f.provincia].filter(Boolean).join(', ') || '',
    }));

  // Helper functions
  // Indicador de anexos igual em todos os separadores (o detalhe, aberto a
  // partir de qualquer um, mostra os anexos e o historico completos).
  const renderAnexosBadge = (factura: Factura) => {
    const total = Array.isArray(factura.anexos) ? factura.anexos.length : 0;
    if (total === 0) return null;
    return (
      <Badge variant="outline" className="gap-1">
        <Paperclip className="h-3 w-3" />
        {total} anexo{total === 1 ? '' : 's'}
      </Badge>
    );
  };

  const getFornecedorNome = (factura: Factura) => {
    if (typeof factura.fornecedor === 'string' && factura.fornecedor) {
      return factura.fornecedor;
    }
    if (typeof factura.fornecedor === 'object' && factura.fornecedor?.nome) {
      return factura.fornecedor.nome;
    }
    if (factura.fornecedor_nome) {
      return factura.fornecedor_nome;
    }
    const fornecedor = fornecedores.find(f => f.id === factura.fornecedor_id);
    return fornecedor?.nome || 'Fornecedor não especificado';
  };

  // Estatísticas do dashboard calculadas a partir das facturas reais já
  // carregadas da API (antes eram números fixos de exemplo - Sonangol, etc.
  // - que nunca reflectiam os dados verdadeiros).
  const stats: FacturaStats = useMemo(() => {
    const agora = new Date();
    const limite30Dias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
    const getValor = (f: Factura) => f.valor ?? f.total ?? 0;

    let registadas = 0, em_validacao = 0, aprovadas = 0, rejeitadas = 0, pagas = 0;
    let vencidas = 0, a_vencer_30dias = 0;
    let total_valor = 0, total_pago = 0, total_pendente = 0;
    const porFornecedorMap = new Map<string, { total: number; valor: number }>();

    for (const factura of facturas) {
      const valor = getValor(factura);
      total_valor += valor;

      switch (factura.status) {
        case 'pendente':
        case 'registada':
        case 'rascunho':
          registadas++;
          break;
        case 'validado':
          em_validacao++;
          break;
        case 'aprovado':
        case 'submetido_ao_banco':
          aprovadas++;
          break;
        case 'pago':
          pagas++;
          break;
        case 'rejeitado':
          rejeitadas++;
          break;
      }

      if (factura.status === 'pago') {
        total_pago += valor;
      } else if (factura.status !== 'rejeitado' && factura.status !== 'cancelado') {
        total_pendente += valor;
        const vencimento = factura.data_vencimento ? new Date(factura.data_vencimento) : null;
        if (vencimento && !Number.isNaN(vencimento.getTime())) {
          if (vencimento < agora) vencidas++;
          else if (vencimento <= limite30Dias) a_vencer_30dias++;
        }
      }

      const nomeFornecedor = getFornecedorNome(factura);
      const atual = porFornecedorMap.get(nomeFornecedor) || { total: 0, valor: 0 };
      porFornecedorMap.set(nomeFornecedor, { total: atual.total + 1, valor: atual.valor + valor });
    }

    const por_fornecedor = Array.from(porFornecedorMap.entries())
      .map(([fornecedor_nome, v]) => ({ fornecedor_nome, ...v }))
      .sort((a, b) => b.valor - a.valor);

    return {
      total_facturas: facturas.length,
      total_valor,
      total_pago,
      total_pendente,
      registadas,
      em_validacao,
      aprovadas,
      rejeitadas,
      pagas,
      vencidas,
      a_vencer_30dias,
      por_fornecedor,
    };
  }, [facturas, fornecedores]);

  const getStatusBadge = (status: string) => {
    const badges = {
      rascunho: { label: 'Rascunho', color: 'var(--tone-neutral)' },
      pendente: { label: 'Pendente', color: 'var(--tone-info)' },
      validado: { label: 'Aprovado-DSG', color: 'var(--tone-info)' },
      aprovado: { label: 'Autorização de Despesas', color: 'var(--tone-success)' },
      submetido_ao_banco: { label: 'Submetido ao Banco', color: 'var(--tone-gold)' },
      rejeitado: { label: 'Rejeitado', color: 'var(--tone-danger)' },
      cancelado: { label: 'Cancelado', color: 'var(--tone-neutral)' },
      pago: { label: 'Pago', color: 'var(--tone-success)' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
  };

  const formatCurrency = (value: number, moeda: string = 'AOA') => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: moeda,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-PT');
  };

  const filteredFacturas = facturas.filter(factura => {
    if (filters.status && factura.status !== filters.status) return false;
    if (filters.fornecedor_id && factura.fornecedor_id !== filters.fornecedor_id) return false;
    return true;
  });
  const pendentesFacturas = facturas.filter(f => f.status === 'pendente');
  const validadosFacturas = facturas.filter(f => f.status === 'validado');
  const aprovadasFacturas = facturas.filter(f => f.status === 'aprovado');
  const submetidoBancoFacturas = facturas.filter(f => f.status === 'submetido_ao_banco');
  const pagamentosFacturas = facturas.filter(f => f.status === 'pago');
  const ordensPagamentoFacturas = facturas.filter(f => !!f.numero_ordem_pagamento);

  // Paginação de apresentação (50 por página) para cada separador - a lista
  // completa de facturas já está em memória (ver fetch acima), por isso só
  // a renderização é paginada, com um estado de página independente por
  // separador.
  const todasPag = useClientPagination(filteredFacturas);
  const pendentesPag = useClientPagination(pendentesFacturas);
  const validadosPag = useClientPagination(validadosFacturas);
  const aprovadasPag = useClientPagination(aprovadasFacturas);
  const submetidoBancoPag = useClientPagination(submetidoBancoFacturas);
  const pagamentosPag = useClientPagination(pagamentosFacturas);
  const ordensPagamentoPag = useClientPagination(ordensPagamentoFacturas);

  const handleSaveFactura = async (facturaData: Partial<Factura>) => {
    if (!accessToken) {
 console.error('Token de acesso não disponível');
      setError('Não foi possível autenticar. Por favor, faça login novamente.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

 console.log('Enviando factura para o backend:', facturaData);

      // Editar (factura seleccionada) actualiza-a; caso contrario cria uma nova.
      const aEditar = !!selectedFactura?.id;
      const response = await fetch(
        aEditar ? `${API_BASE_URL}/facturas/${selectedFactura!.id}` : `${API_BASE_URL}/facturas?all=true`,
        {
          method: aEditar ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(facturaData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Erro ao guardar factura');
      }

      const data = await response.json();
 console.log('Factura guardada com sucesso:', data);
 console.log('Estrutura da resposta:', JSON.stringify(data, null, 2));

      // Recarregar a lista de facturas
      const facturasResponse = await fetch(
        `${API_BASE_URL}/facturas?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (facturasResponse.ok) {
        const facturasData = await facturasResponse.json();
 console.log('Facturas após recarregar:', facturasData);
 console.log('Número de facturas:', facturasData.facturas?.length || 0);
        setFacturas(facturasData.facturas || []);
      } else {
 console.error('Erro ao recarregar facturas:', facturasResponse.status);
      }

      // Voltar para a lista
      setView('list');
      setSelectedFactura(null);
    } catch (err) {
 console.error('Erro ao guardar factura:', err);
      setError(err instanceof Error ? err.message : 'Erro ao guardar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (comentario: string) => {
    if (!accessToken || !selectedFactura) {
      setError('Não foi possível autenticar ou factura não selecionada.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

 console.log('Validando factura:', selectedFactura.id, comentario);

      const response = await fetch(
        `${API_BASE_URL}/facturas/${selectedFactura.id}/validate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comentario }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao validar factura');
      }

      const data = await response.json();
 console.log('Factura validada com sucesso:', data);

      // Recarregar facturas
      const facturasResponse = await fetch(
        `${API_BASE_URL}/facturas?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (facturasResponse.ok) {
        const facturasData = await facturasResponse.json();
        setFacturas(facturasData.facturas || []);
      }

      // Voltar para lista
      setView('list');
      setSelectedFactura(null);
      toast.success('Factura validada com sucesso!');
    } catch (err) {
 console.error('Erro ao validar factura:', err);
      setError(err instanceof Error ? err.message : 'Erro ao validar factura');
      toast.error(err instanceof Error ? err.message : 'Erro ao validar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (comentario: string) => {
    if (!accessToken || !selectedFactura) {
      setError('Não foi possível autenticar ou factura não selecionada.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

 console.log('Aprovando factura:', selectedFactura.id, comentario);

      const response = await fetch(
        `${API_BASE_URL}/facturas/${selectedFactura.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comentario }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aprovar factura');
      }

      const data = await response.json();
 console.log('Factura aprovada com sucesso:', data);

      // Recarregar facturas
      const facturasResponse = await fetch(
        `${API_BASE_URL}/facturas?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (facturasResponse.ok) {
        const facturasData = await facturasResponse.json();
        setFacturas(facturasData.facturas || []);
      }

      // Voltar para lista
      setView('list');
      setSelectedFactura(null);
    } catch (err) {
 console.error('Erro ao aprovar factura:', err);
      setError(err instanceof Error ? err.message : 'Erro ao aprovar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (motivo: string) => {
    if (!accessToken || !selectedFactura) {
      setError('Não foi possível autenticar ou factura não selecionada.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

 console.log('Rejeitando factura:', selectedFactura.id, motivo);

      const response = await fetch(
        `${API_BASE_URL}/facturas/${selectedFactura.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: motivo }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao rejeitar factura');
      }

      const data = await response.json();
 console.log('Factura rejeitada com sucesso:', data);

      // Recarregar facturas
      const facturasResponse = await fetch(
        `${API_BASE_URL}/facturas?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (facturasResponse.ok) {
        const facturasData = await facturasResponse.json();
        setFacturas(facturasData.facturas || []);
      }

      // Voltar para lista
      setView('list');
      setSelectedFactura(null);
    } catch (err) {
 console.error('Erro ao rejeitar factura:', err);
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar factura');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (metodo: string, referencia: string, comprovativo?: File) => {
    if (!accessToken || !selectedFactura) {
      setError('Não foi possível autenticar ou factura não selecionada.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let comprovantivoUrl = '';

      // Upload do comprovativo se fornecido
      if (comprovativo) {
 console.log('Fazendo upload do comprovativo...');
        
        const formData = new FormData();
        formData.append('file', comprovativo);

        const uploadResponse = await fetch(
          `${API_BASE_URL}/storage/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error('Erro ao fazer upload do comprovativo');
        }

        const uploadData = await uploadResponse.json();
        comprovantivoUrl = uploadData.file?.url || '';
 console.log('Comprovativo uploaded:', comprovantivoUrl);
      }

 console.log('Registando pagamento:', selectedFactura.id, metodo, referencia);

      const response = await fetch(
        `${API_BASE_URL}/facturas/${selectedFactura.id}/pay`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data_pagamento: new Date().toISOString(),
            metodo_pagamento: metodo,
            referencia_pagamento: referencia,
            comprovativo_url: comprovantivoUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registar pagamento');
      }

      const data = await response.json();
 console.log('Pagamento registado com sucesso:', data);

      toast.success('Pagamento registado com sucesso!');

      // Recarregar facturas
      const facturasResponse = await fetch(
        `${API_BASE_URL}/facturas?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (facturasResponse.ok) {
        const facturasData = await facturasResponse.json();
        setFacturas(facturasData.facturas || []);
      }

      // Voltar para lista
      setView('list');
      setSelectedFactura(null);
    } catch (err) {
 console.error('Erro ao registar pagamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao registar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleGerarOrdemPagamento = async (numeroDespacho: string, contaDebito: string) => {
    if (!accessToken || !selectedFactura) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/facturas/${selectedFactura.id}/ordem-pagamento`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ numero_despacho: numeroDespacho, conta_debito: contaDebito }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Erro ao gerar Ordem de Pagamento');
      }
      const data = await response.json();
      setSelectedFactura(data.factura);
      setFacturas((prev) => prev.map((f) => (f.id === data.factura.id ? data.factura : f)));
      toast.success('Ordem de Pagamento gerada com sucesso!');
    } catch (err) {
 console.error('Erro ao gerar Ordem de Pagamento:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar Ordem de Pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleAssinarOrdemPagamento = async (papel: 'presidente' | 'administrador') => {
    if (!accessToken || !selectedFactura) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/facturas/${selectedFactura.id}/ordem-pagamento/assinar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ papel }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Erro ao assinar Ordem de Pagamento');
      }
      const data = await response.json();
      setSelectedFactura(data.factura);
      setFacturas((prev) => prev.map((f) => (f.id === data.factura.id ? data.factura : f)));
      toast.success('Assinatura registada com sucesso!');
    } catch (err) {
 console.error('Erro ao assinar Ordem de Pagamento:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao assinar Ordem de Pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToBanco = async (banco: string, referencia: string) => {
    if (!accessToken || !selectedFactura) {
      setError('Não foi possível autenticar ou factura não selecionada.');
      toast.error('Não foi possível autenticar ou factura não selecionada.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

 console.log('Submetendo factura ao banco:', selectedFactura.id, banco, referencia);

      const response = await fetch(
        `${API_BASE_URL}/facturas/${selectedFactura.id}/submit-banco`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            banco_destino: banco,
            referencia_submissao: referencia,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao submeter factura ao banco');
      }

      const data = await response.json();
 console.log('Factura submetida ao banco com sucesso:', data);

      // Recarregar facturas
      const facturasResponse = await fetch(
        `${API_BASE_URL}/facturas?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (facturasResponse.ok) {
        const facturasData = await facturasResponse.json();
        setFacturas(facturasData.facturas || []);
      }

      // Voltar para lista
      setView('list');
      setSelectedFactura(null);
      toast.success('Factura submetida ao banco com sucesso!');
    } catch (err) {
 console.error('Erro ao submeter factura ao banco:', err);
      setError(err instanceof Error ? err.message : 'Erro ao submeter factura ao banco');
      toast.error(err instanceof Error ? err.message : 'Erro ao submeter factura ao banco');
    } finally {
      setLoading(false);
    }
  };

  // Permissões baseadas no novo sistema de departamentos
  const userRole = user?.role;
  
  // COMPRAS: Pode validar facturas (pendente → validado)
  const isCompras = userRole === 'compras';
  
  // GABINETES EXECUTIVOS: Podem aprovar facturas (validado → aprovado)
  const isGabineteExecutivo = [
    'gabinete_pca', 
    'gabinete_pce', 
    'gabinete_administrador', 
    'gabinete_director', 
    'gestao'
  ].includes(userRole || '');
  
  // FINANCEIRO: Pode marcar como paga (aprovado → pago) com upload obrigatório
  const isFinanceiro = userRole === 'financeiro';
  
  // EXTERNO: Fornecedores podem submeter e visualizar suas próprias facturas
  const isExterno = userRole === 'externo';

  // DSG Técnico: regista facturas/proformas em nome dos fornecedores; não valida, aprova nem paga.
  const isDsgTecnico = userRole === 'dsg_tecnico';

  // Definir permissões
  // Compras, gabinetes executivos e Financeiro mantêm o fluxo fixo de sempre
  // (validar / autorizar / pagar). Qualquer outro role (ex: DSG Técnico)
  // segue a matriz de Roles e Permissões: "Facturas & Pagamentos -> Aprovar"
  // dá o Aprovar-DSG e a Autorização de Despesas.
  const papelDeFluxoFixo = isCompras || isGabineteExecutivo || isFinanceiro;
  const aprovaPelaMatriz = !papelDeFluxoFixo && pode('invoices', 'approve');
  const canValidate = isCompras || aprovaPelaMatriz;
  const canApprove = isGabineteExecutivo || aprovaPelaMatriz;
  const canPay = isFinanceiro; // Apenas Financeiro marca como pago
  // Ver/criar seguem as permissões do role (Roles e Permissões).
  const canView = isCompras || isFinanceiro || isGabineteExecutivo || isExterno || pode('invoices', ['read_all', 'read_own']);
  const canCreate = isExterno || pode('invoices', 'create'); // inclui o DSG Técnico (em nome do fornecedor)

  // Editar / anular / eliminar: só a própria factura e enquanto ninguém actuou
  // sobre ela (mesma regra do servidor - utils/proprio-sem-accao.ts).
  const facturaSemAccao = (f: Factura) =>
    ['rascunho', 'registada', 'pendente'].includes(f.status)
    && !(f as any).validado_at && !(f as any).aprovado_at && !(f as any).rejeitado_at
    && !f.numero_ordem_pagamento;
  // Com "Editar"/"Eliminar" na matriz: qualquer factura ainda sem acção;
  // com "Editar/Eliminar próprios": só as suas.
  const podeAlterarPropria = (f: Factura | null, accao: 'update' | 'delete') =>
    !!f && !!user && facturaSemAccao(f)
    && (pode('invoices', accao) || (f.created_by_id === user.id && pode('invoices', `${accao}_own`)));

  const handleAnularOuEliminar = async (accao: 'anular' | 'eliminar') => {
    if (!accessToken || !selectedFactura) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        accao === 'anular' ? `${API_BASE_URL}/facturas/${selectedFactura.id}/cancelar` : `${API_BASE_URL}/facturas/${selectedFactura.id}`,
        {
          method: accao === 'anular' ? 'POST' : 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || 'Operação não permitida');
      toast.success(accao === 'anular' ? 'Factura anulada' : 'Factura eliminada');
      const lista = await fetch(`${API_BASE_URL}/facturas?all=true`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (lista.ok) setFacturas((await lista.json()).facturas || []);
      setView('list');
      setSelectedFactura(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operação não permitida');
    } finally {
      setLoading(false);
    }
  };

  // Bloquear acesso para utilizadores sem permissão
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              O módulo de Facturas está disponível apenas para os departamentos de Compras, Financeiro e Gabinetes Executivos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <FacturaForm
        factura={selectedFactura || undefined}
        fornecedores={fornecedores}
        onSave={handleSaveFactura}
        onCancel={() => {
          setView('list');
          setSelectedFactura(null);
        }}
      />
    );
  }

  if (view === 'details' && selectedFactura) {
    return (
      <FacturaDetails
        factura={selectedFactura}
        canValidate={canValidate}
        canApprove={canApprove}
        canPay={canPay}
        userRole={userRole || 'externo'}
        onBack={() => {
          setView('list');
          setSelectedFactura(null);
        }}
        onEdit={() => setView('form')}
        podeEditar={podeAlterarPropria(selectedFactura, 'update')}
        podeEliminar={podeAlterarPropria(selectedFactura, 'delete')}
        onAnular={() => handleAnularOuEliminar('anular')}
        onEliminar={() => handleAnularOuEliminar('eliminar')}
        onValidate={handleValidate}
        onApprove={handleApprove}
        onReject={handleReject}
        onPay={handlePay}
        onSubmitToBanco={handleSubmitToBanco}
        onGerarOrdemPagamento={handleGerarOrdemPagamento}
        onAssinarOrdemPagamento={handleAssinarOrdemPagamento}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
            Financeiro
          </div>
          <h1 className="flex items-center gap-2 font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>
            <Receipt className="h-6 w-6" />
            Facturas &amp; Pagamentos
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
            {isExterno
              ? 'Gerir e acompanhar suas facturas submetidas'
              : 'Gestão financeira de facturas e pagamentos'
            }
          </p>
        </div>
        {(isFinanceiro || canCreate) && (
          <Button onClick={() => setView('form')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Factura
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">A carregar facturas...</p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card style={{ borderColor: 'var(--tone-danger)' }}>
          <CardContent className="py-6 text-center">
            <p className="font-semibold mb-2" style={{ color: 'var(--tone-danger)' }}>Erro ao carregar facturas</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Tabs - Com filtros avançados para Admin, Compras, Financeiro e Gabinetes Executivos */}
          {!isExterno && !permissoesCarregadas ? (
            <p className="text-center py-10 text-muted-foreground">A carregar...</p>
          ) : !isExterno && separadoresVisiveis.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                O seu perfil não tem nenhum separador da Gestão de Pagamento atribuído. Contacte o Administrador do Sistema.
              </CardContent>
            </Card>
          ) : !isExterno ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {ver('dashboard') && (
                  <TabsTrigger value="dashboard">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Dashboard
                  </TabsTrigger>
                )}
                {ver('todas') && (
                  <TabsTrigger value="todas">
                    <List className="mr-2 h-4 w-4" />
                    Todas ({facturas.length})
                  </TabsTrigger>
                )}
                {ver('pendentes') && (
                  <TabsTrigger value="pendentes">
                    <Clock className="mr-2 h-4 w-4" />
                    Pendentes ({facturas.filter(f => f.status === 'pendente').length})
                  </TabsTrigger>
                )}
                {ver('validados') && (
                  <TabsTrigger value="validados">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovados-DSG ({facturas.filter(f => f.status === 'validado').length})
                  </TabsTrigger>
                )}
                {ver('aprovadas') && (
                  <TabsTrigger value="aprovadas">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Autorização de Despesas ({facturas.filter(f => f.status === 'aprovado').length})
                  </TabsTrigger>
                )}
                {ver('ordens_pagamento') && (
                  <TabsTrigger value="ordens_pagamento">
                    <FileSignature className="mr-2 h-4 w-4" />
                    Ordens de Pagamento Fornecedor ({facturas.filter(f => !!f.numero_ordem_pagamento).length})
                  </TabsTrigger>
                )}
                {ver('ordens_pagamento_interna') && (
                  <TabsTrigger value="ordens_pagamento_interna">
                    <FileSignature className="mr-2 h-4 w-4" />
                    Ordens de Pagamento Interna
                  </TabsTrigger>
                )}
                {ver('submetido_banco') && (
                  <TabsTrigger value="submetido_banco">
                    <FileText className="mr-2 h-4 w-4" />
                    Submetido ao Banco ({facturas.filter(f => f.status === 'submetido_ao_banco').length})
                  </TabsTrigger>
                )}
                {ver('pagamentos') && (
                  <TabsTrigger value="pagamentos">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pagos ({facturas.filter(f => f.status === 'pago').length})
                  </TabsTrigger>
                )}
                {ver('mapa_impostos') && (
                  <TabsTrigger value="mapa_impostos">
                    <FileText className="mr-2 h-4 w-4" />
                    Mapa de Impostos
                  </TabsTrigger>
                )}
                {ver('mapa_actividades') && (
                  <TabsTrigger value="mapa_actividades">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Mapa de Actividades
                  </TabsTrigger>
                )}
              </TabsList>

            {/* Mapa de Impostos - clicar numa linha abre a factura */}
            {ver('mapa_impostos') && (
              <TabsContent value="mapa_impostos">
                <MapaImpostos
                  contexto="financeiro"
                  onOpenFactura={(facturaId) => {
                    const alvo = facturas.find((f) => f.id === facturaId);
                    if (alvo) {
                      setSelectedFactura(alvo);
                      setView('details');
                    }
                  }}
                />
              </TabsContent>
            )}

            {/* Mapa de Actividades (DSG) */}
            {ver('mapa_actividades') && (
              <TabsContent value="mapa_actividades">
                <MapaActividades contexto="financeiro" />
              </TabsContent>
            )}

            {/* Dashboard */}
            <TabsContent value="dashboard">
              <FacturasDashboard stats={stats} />
            </TabsContent>

            {/* Todas */}
            <TabsContent value="todas" className="space-y-4">
              {/* Filtros */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <select
                      className="px-3 py-2 border border-input rounded-md bg-background"
                      value={filters.status || ''}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                    >
                      <option value="">Todos os estados</option>
                      <option value="rascunho">Rascunho</option>
                      <option value="pendente">Pendente</option>
                      <option value="validado">Aprovado-DSG</option>
                      <option value="aprovado">Autorização de Despesas</option>
                      <option value="submetido_ao_banco">Submetido ao Banco</option>
                      <option value="rejeitado">Rejeitado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="pago">Pago</option>
                    </select>
                    <select
                      className="px-3 py-2 border border-input rounded-md bg-background"
                      value={filters.fornecedor_id || ''}
                      onChange={(e) => setFilters({ ...filters, fornecedor_id: e.target.value })}
                    >
                      <option value="">Todos os fornecedores</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Lista */}
              <div className="grid gap-4">
                {filteredFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma factura encontrada
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  todasPag.pageItems.map((factura) => (
                    <Card
                      key={factura.id}
                      className="hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedFactura(factura);
                        setView('details');
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{factura.numero}</Badge>
                              {getStatusBadge(factura.status)}
                              {renderAnexosBadge(factura)}
                              <Badge variant="outline">{factura.moeda}</Badge>
                            </div>
                            <p className="text-sm mb-2">
                              <strong className="text-base">{getFornecedorNome(factura)}</strong>
                            </p>
                            <CardTitle className="text-lg mb-3">{factura.descricao}</CardTitle>
                            <div className="mt-2 space-y-1.5">
                              <p className="text-sm text-muted-foreground">
                                <strong>Código do Fornecedor:</strong> {factura.numero_fornecedor}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Data de Registo:</strong> {formatDate(factura.created_at || factura.data_registo)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Data de Emissão:</strong> {formatDate(factura.data_emissao)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Data de Vencimento:</strong> {formatDate(factura.data_vencimento)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(factura.total, factura.moeda)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {factura.itens?.length || 0} item(ns)
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
              <PaginationBar pagination={todasPag.pagination} onPageChange={todasPag.setPage} />
            </TabsContent>

            {/* Pendentes */}
            <TabsContent value="pendentes" className="space-y-4">
              <div className="grid gap-4">
                {pendentesFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma factura pendente</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendentesPag.pageItems.map((factura) => (
                  <Card
                    key={factura.id}
                    className="hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedFactura(factura);
                      setView('details');
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{factura.numero}</Badge>
                            {getStatusBadge(factura.status)}
                            {renderAnexosBadge(factura)}
                          </div>
                          <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {getFornecedorNome(factura)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(factura.total, factura.moeda)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  ))
                )}
              </div>
              <PaginationBar pagination={pendentesPag.pagination} onPageChange={pendentesPag.setPage} />
            </TabsContent>

            {/* Validados */}
            <TabsContent value="validados" className="space-y-4">
              <div className="grid gap-4">
                {validadosFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma factura validada</p>
                    </CardContent>
                  </Card>
                ) : (
                  validadosPag.pageItems.map((factura) => (
                    <Card
                      key={factura.id}
                      className="hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedFactura(factura);
                        setView('details');
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{factura.numero}</Badge>
                              {getStatusBadge(factura.status)}
                              {renderAnexosBadge(factura)}
                            </div>
                            <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                              {getFornecedorNome(factura)} •{' '}
                              Aprovado-DSG por {factura.validado_por_nome || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(factura.total, factura.moeda)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
              <PaginationBar pagination={validadosPag.pagination} onPageChange={validadosPag.setPage} />
            </TabsContent>

            {/* Aprovadas */}
            <TabsContent value="aprovadas" className="space-y-4">
              <div className="grid gap-4">
                {aprovadasFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma factura aprovada</p>
                    </CardContent>
                  </Card>
                ) : (
                  aprovadasPag.pageItems.map((factura) => (
                  <Card
                    key={factura.id}
                    className="hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedFactura(factura);
                      setView('details');
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{factura.numero}</Badge>
                            {getStatusBadge(factura.status)}
                            {renderAnexosBadge(factura)}
                          </div>
                          <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {getFornecedorNome(factura)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(factura.total, factura.moeda)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  ))
                )}
              </div>
              <PaginationBar pagination={aprovadasPag.pagination} onPageChange={aprovadasPag.setPage} />
            </TabsContent>

            {/* Submetido ao Banco */}
            <TabsContent value="submetido_banco" className="space-y-4">
              <div className="grid gap-4">
                {submetidoBancoFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma factura submetida ao banco</p>
                    </CardContent>
                  </Card>
                ) : (
                  submetidoBancoPag.pageItems.map((factura) => (
                    <Card
                      key={factura.id}
                      className="hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedFactura(factura);
                        setView('details');
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{factura.numero}</Badge>
                              {getStatusBadge(factura.status)}
                              {renderAnexosBadge(factura)}
                            </div>
                            <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                              {getFornecedorNome(factura)} •{' '}
                              Submetido ao {factura.banco_destino || 'Banco'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(factura.total, factura.moeda)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
              <PaginationBar pagination={submetidoBancoPag.pagination} onPageChange={submetidoBancoPag.setPage} />
            </TabsContent>

            {/* Pagamentos */}
            <TabsContent value="pagamentos" className="space-y-4">
              <div className="grid gap-4">
                {pagamentosFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma factura paga</p>
                    </CardContent>
                  </Card>
                ) : (
                  pagamentosPag.pageItems.map((factura) => (
                  <Card
                    key={factura.id}
                    className="hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedFactura(factura);
                      setView('details');
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{factura.numero}</Badge>
                            {getStatusBadge(factura.status)}
                            {renderAnexosBadge(factura)}
                          </div>
                          <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            {getFornecedorNome(factura)} •{' '}
                            Pago em {formatDate(factura.pago_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: 'var(--tone-success)' }}>
                            {formatCurrency(factura.total, factura.moeda)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  ))
                )}
              </div>
              <PaginationBar pagination={pagamentosPag.pagination} onPageChange={pagamentosPag.setPage} />
            </TabsContent>

            {/* Ordens de Pagamento Fornecedor */}
            <TabsContent value="ordens_pagamento" className="space-y-4">
              <div className="grid gap-4">
                {ordensPagamentoFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma Ordem de Pagamento Fornecedor gerada ainda. É criada automaticamente quando uma factura é aprovada.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  ordensPagamentoPag.pageItems.map((factura) => {
                    const assinaturas = factura.ordem_pagamento?.assinaturas || [];
                    const totalmenteAssinada = assinaturas.some(a => a.papel === 'presidente') && assinaturas.some(a => a.papel === 'administrador');
                    return (
                      <Card
                        key={factura.id}
                        className="hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedFactura(factura);
                          setView('details');
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="text-white" style={{ backgroundColor: 'var(--tone-info)' }}>{factura.numero_ordem_pagamento}</Badge>
                                {getStatusBadge(factura.status)}
                                {renderAnexosBadge(factura)}
                                <Badge variant={totalmenteAssinada ? 'default' : 'outline'}>
                                  {assinaturas.length}/2 assinaturas
                                </Badge>
                              </div>
                              <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-2">
                                Factura {factura.numero} • {getFornecedorNome(factura)}
                                {factura.ordem_pagamento?.numero_despacho && ` • Despacho ${factura.ordem_pagamento.numero_despacho}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(factura.total ?? factura.valor, factura.moeda)}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })
                )}
              </div>
              <PaginationBar pagination={ordensPagamentoPag.pagination} onPageChange={ordensPagamentoPag.setPage} />
            </TabsContent>

            {/* Ordens de Pagamento Interna */}
            <TabsContent value="ordens_pagamento_interna" className="space-y-4">
              <OrdensPagamentoInterna userRole={userRole || ''} />
            </TabsContent>
          </Tabs>
          ) : (
            // Visualização simplificada para utilizadores externos
            <div className="space-y-4">
              <div className="grid gap-4">
                {filteredFacturas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma factura encontrada
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredFacturas.map((factura) => (
                    <Card
                      key={factura.id}
                      className="hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedFactura(factura);
                        setView('details');
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{factura.numero}</Badge>
                              {getStatusBadge(factura.status)}
                              {renderAnexosBadge(factura)}
                              <Badge variant="outline">{factura.moeda}</Badge>
                            </div>
                            <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-muted-foreground">
                                <strong>Vencimento:</strong> {formatDate(factura.data_vencimento)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(factura.total, factura.moeda)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {factura.itens?.length || 0} item(ns)
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}