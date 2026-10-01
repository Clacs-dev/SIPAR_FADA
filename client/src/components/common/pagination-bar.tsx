import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../ui/pagination";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginationBarProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

/**
 * Navegação de páginas partilhada por todos os módulos que usam a listagem
 * paginada do backend (ver server/src/utils/module-routes-helper.ts:list -
 * 50 registos por página por defeito). Não aparece quando só há 1 página.
 */
export function PaginationBar({ pagination, onPageChange }: PaginationBarProps) {
  const { page, total, totalPages } = pagination;
  if (totalPages <= 1) return null;

  // Janela de páginas visíveis em torno da actual, com "..." para o resto -
  // evita uma lista enorme de números quando há muitas páginas.
  const paginas: (number | 'ellipsis')[] = [];
  const janela = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= janela) {
      paginas.push(p);
    } else if (paginas[paginas.length - 1] !== 'ellipsis') {
      paginas.push('ellipsis');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); if (page > 1) onPageChange(page - 1); }}
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          {paginas.map((p, idx) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => { e.preventDefault(); onPageChange(p); }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); if (page < totalPages) onPageChange(page + 1); }}
              className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} — {total} registo{total === 1 ? '' : 's'} no total
      </p>
    </div>
  );
}
