import { useState } from "react";
import { ViaturaDetails } from "./viatura-details";
import { UtilizacaoForm, UtilizacaoFormData } from "./utilizacao-form";
import { ManutencaoForm, ManutencaoFormData } from "./manutencao-form";
import { Viatura, Utilizacao, Manutencao, Motorista } from "./types";
import { useAuth } from "../auth/auth-context";
import { useUtilizacoes } from "../../hooks/use-utilizacoes";
import { useManutencoes } from "../../hooks/use-manutencoes";
import { toast } from "sonner@2.0.3";

interface ViaturaDetailsWrapperProps {
  viatura: Viatura;
  utilizacoes: Utilizacao[];
  manutencoes: Manutencao[];
  motoristas: Motorista[];
  canEdit: boolean;
  onBack: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
}

export function ViaturaDetailsWrapper({
  viatura,
  utilizacoes: initialUtilizacoes,
  manutencoes: initialManutencoes,
  motoristas,
  canEdit,
  onBack,
  onEdit,
  onRefresh
}: ViaturaDetailsWrapperProps) {
  const { accessToken } = useAuth();
  const [showUtilizacaoForm, setShowUtilizacaoForm] = useState(false);
  const [showManutencaoForm, setShowManutencaoForm] = useState(false);

  const { 
    utilizacoes, 
    createUtilizacao, 
    refetch: refetchUtilizacoes 
  } = useUtilizacoes(viatura.id, accessToken);

  const { 
    manutencoes, 
    createManutencao, 
    refetch: refetchManutencoes 
  } = useManutencoes(viatura.id, accessToken);

  const handleNovaUtilizacao = async (data: UtilizacaoFormData) => {
    if (!accessToken) {
      toast.error("Erro de autenticação");
      return;
    }

    try {
      // Buscar nome do motorista
      const motorista = motoristas.find(m => m.id === data.motorista_id);
      
      await createUtilizacao({
        viatura_id: viatura.id,
        motorista_id: data.motorista_id,
        motorista_nome: motorista?.nome || '',
        data_saida: data.data_saida,
        hora_saida: data.hora_saida,
        km_saida: data.km_saida,
        destino: data.destino,
        finalidade: data.finalidade,
        passageiros: data.passageiros,
        observacoes: data.observacoes
      }, accessToken);

      toast.success("Utilização criada com sucesso!");
      setShowUtilizacaoForm(false);
      
      // Refetch data
      refetchUtilizacoes();
      if (onRefresh) onRefresh();
    } catch (error: any) {
 console.error('Erro ao criar utilização:', error);
      toast.error(error.message || "Erro ao criar utilização");
      throw error;
    }
  };

  const handleNovaManutencao = async (data: ManutencaoFormData) => {
    if (!accessToken) {
      toast.error("Erro de autenticação");
      return;
    }

    try {
      await createManutencao({
        viatura_id: viatura.id,
        tipo: data.tipo,
        data_entrada: data.data_entrada,
        data_prevista_saida: data.data_prevista_saida,
        km_manutencao: data.km_manutencao,
        descricao: data.descricao,
        oficina: data.oficina,
        responsavel_oficina: data.responsavel_oficina,
        telefone_oficina: data.telefone_oficina,
        servicos: data.servicos,
        custo_mao_obra: data.custo_mao_obra,
        custo_pecas: data.custo_pecas,
        observacoes: data.observacoes,
        anexos: data.anexos
      }, accessToken);

      toast.success("Manutenção criada com sucesso!");
      setShowManutencaoForm(false);
      
      // Refetch data
      refetchManutencoes();
      if (onRefresh) onRefresh();
    } catch (error: any) {
 console.error('Erro ao criar manutenção:', error);
      toast.error(error.message || "Erro ao criar manutenção");
      throw error;
    }
  };

  // Usar dados dos hooks se disponíveis, caso contrário usar dados iniciais
  const displayUtilizacoes = utilizacoes.length > 0 ? utilizacoes : initialUtilizacoes;
  const displayManutencoes = manutencoes.length > 0 ? manutencoes : initialManutencoes;

  return (
    <>
      <ViaturaDetails
        viatura={viatura}
        utilizacoes={displayUtilizacoes}
        manutencoes={displayManutencoes}
        canEdit={canEdit}
        onBack={onBack}
        onEdit={onEdit}
        onNovaUtilizacao={() => setShowUtilizacaoForm(true)}
        onNovaManutencao={() => setShowManutencaoForm(true)}
      />

      <UtilizacaoForm
        open={showUtilizacaoForm}
        onOpenChange={setShowUtilizacaoForm}
        viatura={viatura}
        motoristas={motoristas}
        onSubmit={handleNovaUtilizacao}
      />

      <ManutencaoForm
        open={showManutencaoForm}
        onOpenChange={setShowManutencaoForm}
        viatura={viatura}
        onSubmit={handleNovaManutencao}
      />
    </>
  );
}
