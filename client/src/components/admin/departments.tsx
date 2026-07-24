/**
 * ESTRUTURA DE DEPARTAMENTOS DO SISTEMA
 * 
 * Organização hierárquica dos departamentos da instituição
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

export interface Department {
  id: string;
  name: string;
  category: DepartmentCategory;
  description?: string;
  icon?: LucideIcon;
  color?: string;
}

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
 * LISTA COMPLETA DE DEPARTAMENTOS
 */
export const DEPARTMENTS: Department[] = [
  // =====================================================
  // GABINETES EXECUTIVOS
  // =====================================================
  {
    id: 'gabinete_pca',
    name: 'Gabinete do PCA',
    category: 'gabinetes_executivos',
    description: 'Gabinete do Presidente do Conselho de Administração',
    icon: Briefcase,
    color: 'bg-purple-500'
  },
  {
    id: 'gabinete_pce',
    name: 'Gabinete do PCE',
    category: 'gabinetes_executivos',
    description: 'Gabinete do Presidente do Conselho Executivo',
    icon: Target,
    color: 'bg-purple-600'
  },
  {
    id: 'gabinete_administrador',
    name: 'Gabinete do Administrador',
    category: 'gabinetes_executivos',
    description: 'Gabinete do Administrador Executivo',
    icon: Building2,
    color: 'bg-purple-700'
  },
  {
    id: 'gabinete_director',
    name: 'Gabinete do Director',
    category: 'gabinetes_executivos',
    description: 'Gabinete da Direcção Geral',
    icon: Building,
    color: 'bg-purple-800'
  },

  // =====================================================
  // GABINETES GOVERNAMENTAIS
  // =====================================================
  {
    id: 'gabinete_ministro',
    name: 'Gabinete do Ministro',
    category: 'gabinetes_governamentais',
    description: 'Gabinete Ministerial',
    icon: Landmark,
    color: 'bg-blue-600'
  },
  {
    id: 'gabinete_secretario_estado_1',
    name: 'Gabinete do Secretário de Estado 1',
    category: 'gabinetes_governamentais',
    description: 'Primeiro Gabinete da Secretaria de Estado',
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    id: 'gabinete_secretario_estado_2',
    name: 'Gabinete do Secretário de Estado 2',
    category: 'gabinetes_governamentais',
    description: 'Segundo Gabinete da Secretaria de Estado',
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    id: 'gabinete_vice_governador_1',
    name: 'Gabinete do Vice-Governador 1',
    category: 'gabinetes_governamentais',
    description: 'Primeiro Gabinete do Vice-Governador',
    icon: Landmark,
    color: 'bg-blue-400'
  },
  {
    id: 'gabinete_vice_governador_2',
    name: 'Gabinete do Vice-Governador 2',
    category: 'gabinetes_governamentais',
    description: 'Segundo Gabinete do Vice-Governador',
    icon: Landmark,
    color: 'bg-blue-400'
  },

  // =====================================================
  // DEPARTAMENTOS OPERACIONAIS
  // =====================================================
  {
    id: 'financeiro',
    name: 'Financeiro',
    category: 'operacionais',
    description: 'Departamento Financeiro e Contabilístico',
    icon: DollarSign,
    color: 'bg-green-600'
  },
  {
    id: 'recursos_humanos',
    name: 'Recursos Humanos',
    category: 'operacionais',
    description: 'Departamento de Gestão de Recursos Humanos',
    icon: Users,
    color: 'bg-green-500'
  },
  {
    id: 'juridico',
    name: 'Jurídico',
    category: 'operacionais',
    description: 'Departamento Jurídico e Contencioso',
    icon: Scale,
    color: 'bg-green-700'
  },
  {
    id: 'compras',
    name: 'Compras',
    category: 'operacionais',
    description: 'Departamento de Compras e Procurement',
    icon: ShoppingCart,
    color: 'bg-green-600'
  },
  {
    id: 'tecnologia_informacao',
    name: 'Tecnologia e Informação',
    category: 'operacionais',
    description: 'Departamento de TI e Sistemas de Informação',
    icon: Laptop,
    color: 'bg-green-500'
  },

  // =====================================================
  // DEPARTAMENTOS DE APOIO
  // =====================================================
  {
    id: 'administracao',
    name: 'Administração',
    category: 'apoio',
    description: 'Departamento de Administração Geral',
    icon: FolderOpen,
    color: 'bg-orange-500'
  },
  {
    id: 'administrativo',
    name: 'Administrativo',
    category: 'apoio',
    description: 'Serviços Administrativos',
    icon: FileCheck,
    color: 'bg-orange-500'
  },
  {
    id: 'comunicacao_imagem',
    name: 'Comunicação e Imagem',
    category: 'apoio',
    description: 'Departamento de Comunicação e Relações Públicas',
    icon: Megaphone,
    color: 'bg-orange-600'
  },
  {
    id: 'seguranca',
    name: 'Segurança',
    category: 'apoio',
    description: 'Departamento de Segurança e Vigilância',
    icon: Shield,
    color: 'bg-orange-700'
  },

  // =====================================================
  // DEPARTAMENTOS ESTRATÉGICOS
  // =====================================================
  {
    id: 'planeamento',
    name: 'Planeamento',
    category: 'estrategicos',
    description: 'Departamento de Planeamento Estratégico',
    icon: BarChart3,
    color: 'bg-indigo-600'
  },
  {
    id: 'organizacao_qualidade',
    name: 'Organização e Qualidade',
    category: 'estrategicos',
    description: 'Departamento de Organização e Gestão da Qualidade',
    icon: CheckCircle,
    color: 'bg-indigo-500'
  },
  {
    id: 'compliance',
    name: 'Compliance',
    category: 'estrategicos',
    description: 'Departamento de Compliance e Conformidade',
    icon: ClipboardCheck,
    color: 'bg-indigo-600'
  },
  {
    id: 'risco',
    name: 'Risco',
    category: 'estrategicos',
    description: 'Departamento de Gestão de Riscos',
    icon: AlertTriangle,
    color: 'bg-indigo-700'
  },

  // =====================================================
  // NOVOS DEPARTAMENTOS (5 adicionados)
  // =====================================================
  {
    id: 'secretaria',
    name: 'Secretaria',
    category: 'apoio',
    description: 'Secretaria e Atendimento',
    icon: UserCircle,
    color: 'bg-orange-600'
  },
  {
    id: 'externo',
    name: 'Externo',
    category: 'apoio',
    description: 'Utilizadores Externos',
    icon: Globe,
    color: 'bg-orange-400'
  },
  {
    id: 'gestao',
    name: 'Gestão',
    category: 'gabinetes_executivos',
    description: 'Departamento de Gestão Geral',
    icon: Cog,
    color: 'bg-purple-500'
  },
  {
    id: 'operacoes',
    name: 'Operações',
    category: 'operacionais',
    description: 'Departamento de Operações Gerais',
    icon: Cog,
    color: 'bg-green-600'
  },
  {
    id: 'operacional_frota',
    name: 'Operacional e Frota',
    category: 'operacionais',
    description: 'Departamento Operacional e Gestão de Frota',
    icon: Truck,
    color: 'bg-green-500'
  },
];

/**
 * Obter departamento por ID
 */
export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find(dept => dept.id === id);
}

/**
 * Obter departamentos por categoria
 */
export function getDepartmentsByCategory(category: DepartmentCategory): Department[] {
  return DEPARTMENTS.filter(dept => dept.category === category);
}

/**
 * Obter todos os departamentos organizados por categoria
 */
export function getDepartmentsGroupedByCategory(): Record<DepartmentCategory, Department[]> {
  const grouped: Record<string, Department[]> = {};
  
  DEPARTMENTS.forEach(dept => {
    if (!grouped[dept.category]) {
      grouped[dept.category] = [];
    }
    grouped[dept.category].push(dept);
  });
  
  return grouped as Record<DepartmentCategory, Department[]>;
}

/**
 * Obter informações da categoria
 */
export function getCategoryInfo(category: DepartmentCategory) {
  return DEPARTMENT_CATEGORIES[category];
}

/**
 * Obter nome do departamento por ID
 */
export function getDepartmentName(id: string): string {
  const dept = getDepartmentById(id);
  return dept?.name || 'Sem Departamento';
}

/**
 * Obter opções agrupadas para Select
 */
export function getGroupedDepartmentOptions() {
  const categories: DepartmentCategory[] = [
    'gabinetes_executivos',
    'gabinetes_governamentais',
    'operacionais',
    'apoio',
    'estrategicos'
  ];

  return categories.map(category => ({
    label: DEPARTMENT_CATEGORIES[category].label,
    options: getDepartmentsByCategory(category).map(dept => {
      const Icon = dept.icon;
      return {
        value: dept.id,
        label: dept.name,
        icon: Icon ? <Icon className="h-4 w-4 inline mr-2" /> : null
      };
    })
  }));
}