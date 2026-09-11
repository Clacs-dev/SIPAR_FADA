/**
 * COMPONENTE DE FILTRO POR DEPARTAMENTO
 * 
 * Componente reutilizável para filtrar listas por departamento
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "../ui/select";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import {
  getGroupedDepartmentOptions,
  DEPARTMENT_CATEGORIES,
  DepartmentCategory
} from "../admin/departments";
import { useDepartments } from "../../hooks/use-departments";

interface DepartmentFilterProps {
  value: string;
  onChange: (value: string) => void;
  showCategoryBadge?: boolean;
  placeholder?: string;
  allowClear?: boolean;
}

export function DepartmentFilter({
  value,
  onChange,
  showCategoryBadge = true,
  placeholder = "Filtrar por departamento...",
  allowClear = true
}: DepartmentFilterProps) {
  const { departments } = useDepartments();
  const selectedDept = value !== 'all' ? departments.find((d) => d.slug === value) : null;

  const handleClear = () => {
    onChange('all');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="font-medium">📊 Todos os Departamentos</span>
            </SelectItem>
            {getGroupedDepartmentOptions(departments).map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {allowClear && value !== 'all' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            title="Limpar filtro"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showCategoryBadge && selectedDept?.categoria && DEPARTMENT_CATEGORIES[selectedDept.categoria as DepartmentCategory] && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Categoria:</span>
          <Badge className={DEPARTMENT_CATEGORIES[selectedDept.categoria as DepartmentCategory].color}>
            {DEPARTMENT_CATEGORIES[selectedDept.categoria as DepartmentCategory].label}
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Filtro de Categoria de Departamento
 */
interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CategoryFilter({
  value,
  onChange,
  placeholder = "Filtrar por categoria..."
}: CategoryFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="font-medium">Todas as Categorias</span>
        </SelectItem>
        {Object.entries(DEPARTMENT_CATEGORIES).map(([key, cat]) => (
          <SelectItem key={key} value={key}>
            <span className={`inline-flex items-center gap-2 ${cat.color} px-2 py-1 rounded`}>
              {cat.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Filtro Combinado (Categoria + Departamento)
 */
interface CombinedFilterProps {
  categoryValue: string;
  departmentValue: string;
  onCategoryChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
}

export function CombinedDepartmentFilter({
  categoryValue,
  departmentValue,
  onCategoryChange,
  onDepartmentChange
}: CombinedFilterProps) {
  const handleCategoryChange = (newCategory: string) => {
    onCategoryChange(newCategory);
    // Reset department quando categoria muda
    if (newCategory !== 'all') {
      onDepartmentChange('all');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Categoria</label>
        <CategoryFilter
          value={categoryValue}
          onChange={handleCategoryChange}
          placeholder="Selecione a categoria"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Departamento</label>
        <DepartmentFilter
          value={departmentValue}
          onChange={onDepartmentChange}
          showCategoryBadge={false}
          placeholder="Selecione o departamento"
        />
      </div>
    </div>
  );
}
