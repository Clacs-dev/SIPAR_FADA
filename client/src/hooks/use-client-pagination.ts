import { useEffect, useMemo, useState } from "react";
import type { PaginationMeta } from "../components/common/pagination-bar";

/**
 * Pagina, no browser, uma lista já carregada (50 itens por página por
 * defeito). Usado nos ecrãs que precisam do conjunto completo em memória
 * para outros cálculos (estatísticas, outros separadores por estado) e por
 * isso não podem simplesmente pedir uma página de cada vez ao backend.
 */
export function useClientPagination<T>(items: T[], pageSize = 50) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const pagination: PaginationMeta = { page, limit: pageSize, total: items.length, totalPages };

  return { pageItems, pagination, setPage };
}
