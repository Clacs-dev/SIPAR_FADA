/**
 * CATEGORIAS DE DEPARTAMENTOS DO SISTEMA
 *
 * A lista concreta de departamentos vive na base de dados (tabela
 * Department, gerida em admin/departments-admin.tsx e exposta pelo hook
 * useDepartments()) — nunca aqui. Este ficheiro guarda apenas a taxonomia
 * fixa de categorias (que não muda por instalação) e um mapeamento
 * decorativo id -> ícone, usados pelos ecrãs que listam/filtram
 * departamentos reais.
 */

import {
  Briefcase,
  Target,
  Building2,
  Building,
  Landmark,
  FileText,
  DollarSign,
  Users,
  Scale,
  ShoppingCart,
  Laptop,
  FolderOpen,
  FileCheck,
  Megaphone,
  Shield,
  BarChart3,
  CheckCircle,
  ClipboardCheck,
  AlertTriangle,
  UserCircle,
  Globe,
  Cog,
  Truck
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export type DepartmentCategory =
  | 'gabinetes_executivos'      // Gabinetes de Direção Executiva
  | 'gabinetes_governamentais'  // Gabinetes Governamentais
  | 'operacionais'              // Departamentos Operacionais
  | 'apoio'                     // Departamentos de Apoio
  | 'estrategicos';             // Departamentos Estratégicos

export const DEPARTMENT_CATEGORIES: Record<DepartmentCategory, {
  label: string;
  description: string;
  color: string;
}> = {
  gabinetes_executivos: {
    label: 'Gabinetes Executivos',
    description: 'Gabinetes de direção e administração executiva',
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  gabinetes_governamentais: {
    label: 'Gabinetes Governamentais',
    description: 'Gabinetes de entidades governamentais',
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  operacionais: {
    label: 'Departamentos Operacionais',
    description: 'Departamentos de operações e execução',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  apoio: {
    label: 'Departamentos de Apoio',
    description: 'Departamentos de suporte e administrativos',
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  estrategicos: {
    label: 'Departamentos Estratégicos',
    description: 'Departamentos de planeamento e controlo',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  }
};

/**
 * Icones decorativos por slug de departamento. Cobre os slugs originais do
 * sistema; um departamento criado depois pelo admin (slug desconhecido aqui)
 * cai no icone por omissão — isto é só estética, nunca bloqueia nem esconde
 * dados reais.
 */
const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
  gabinete_pca: Briefcase,
  gabinete_pce: Target,
  gabinete_administrador: Building2,
  gabinete_director: Building,
  gabinete_ministro: Landmark,
  gabinete_secretario_estado_1: FileText,
  gabinete_secretario_estado_2: FileText,
  gabinete_vice_governador_1: Landmark,
  gabinete_vice_governador_2: Landmark,
  financeiro: DollarSign,
  recursos_humanos: Users,
  juridico: Scale,
  compras: ShoppingCart,
  tecnologia_informacao: Laptop,
  administracao: FolderOpen,
  administrativo: FileCheck,
  comunicacao_imagem: Megaphone,
  seguranca: Shield,
  planeamento: BarChart3,
  organizacao_qualidade: CheckCircle,
  compliance: ClipboardCheck,
  risco: AlertTriangle,
  secretaria: UserCircle,
  externo: Globe,
  gestao: Cog,
  operacoes: Cog,
  operacional_frota: Truck,
};

const DEFAULT_DEPARTMENT_ICON: LucideIcon = Building2;

export function getDepartmentIcon(slug: string): LucideIcon {
  return DEPARTMENT_ICONS[slug] || DEFAULT_DEPARTMENT_ICON;
}

export function getCategoryInfo(category: DepartmentCategory) {
  return DEPARTMENT_CATEGORIES[category];
}

/**
 * Forma minima que os helpers abaixo esperam de um departamento real (ver
 * useDepartments()). Nota: `slug` (ex.: "financeiro", "gabinete_pca") é o
 * identificador semantico usado em toda a app para cruzar com `user.role` e
 * com `department_slug` das estatisticas — `id` é só a chave primaria da BD
 * (UUID), usada apenas nas operações CRUD do próprio ecrã de administração.
 */
export interface DepartmentLike {
  id: string;
  slug: string;
  nome: string;
  categoria?: string | null;
}

export function getDepartmentsByCategory<T extends DepartmentLike>(departments: T[], category: DepartmentCategory): T[] {
  return departments.filter((dept) => dept.categoria === category);
}

export function getDepartmentName<T extends DepartmentLike>(departments: T[], slugOrName: string): string {
  const found = departments.find((dept) => dept.slug === slugOrName || dept.nome === slugOrName || dept.id === slugOrName);
  return found?.nome || 'Sem Departamento';
}

/**
 * Agrupa departamentos reais por categoria, prontos a alimentar um
 * <SelectGroup> — mesmo formato usado antes pela lista estática, mas agora
 * a partir de dados vivos (ex.: useDepartments() do hook). O `value` de cada
 * opção é o `slug`, não o `id` da BD, para continuar compatível com `role` e
 * com os filtros existentes baseados em `department_slug`.
 */
export function getGroupedDepartmentOptions<T extends DepartmentLike>(departments: T[]) {
  const categories: DepartmentCategory[] = [
    'gabinetes_executivos',
    'gabinetes_governamentais',
    'operacionais',
    'apoio',
    'estrategicos'
  ];

  return categories
    .map((category) => ({
      label: DEPARTMENT_CATEGORIES[category].label,
      options: getDepartmentsByCategory(departments, category).map((dept) => {
        const Icon = getDepartmentIcon(dept.slug);
        return {
          value: dept.slug,
          label: dept.nome,
          icon: <Icon className="h-4 w-4 inline mr-2" />
        };
      })
    }))
    .filter((group) => group.options.length > 0);
}
