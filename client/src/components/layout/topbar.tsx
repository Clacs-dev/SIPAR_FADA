import { useEffect, useRef, useState } from "react";
import { Search, FileText, Users, MessageSquare, Receipt, BookText, ShoppingCart, Building2, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverAnchor } from "../ui/popover";
import { NotificationBell } from "./notification-bell";
import { API_BASE_URL, getAuthHeaders } from "@/services/api";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  tab: string;
  icon: typeof FileText;
  tone: string;
}

interface RawLists {
  presentations: any[];
  audiences: any[];
  comunicacoes: any[];
  facturas: any[];
  actas: any[];
  pedidos: any[];
  fornecedores: any[];
}

const EMPTY_LISTS: RawLists = {
  presentations: [],
  audiences: [],
  comunicacoes: [],
  facturas: [],
  actas: [],
  pedidos: [],
  fornecedores: [],
};

export function TopBar({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<RawLists | null>(null);
  const fetchedRef = useRef(false);

  const ensureLoaded = async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const [pRes, aRes, cRes, fRes, actRes, pedRes, fornRes] = await Promise.all([
        fetch(`${API_BASE_URL}/presentations?all=true`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/audiences?all=true`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/comunicacoes?all=true`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/facturas?all=true`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/actas?all=true`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/procurement/pedidos`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/procurement/fornecedores`, { headers: getAuthHeaders() }),
      ]);
      const [pJson, aJson, cJson, fJson, actJson, pedJson, fornJson] = await Promise.all([
        pRes.ok ? pRes.json() : { data: [] },
        aRes.ok ? aRes.json() : { data: [] },
        cRes.ok ? cRes.json() : { data: [] },
        fRes.ok ? fRes.json() : { data: [] },
        actRes.ok ? actRes.json() : { data: [] },
        pedRes.ok ? pedRes.json() : { pedidos: [] },
        fornRes.ok ? fornRes.json() : { fornecedores: [] },
      ]);
      setLists({
        presentations: pJson.data || [],
        audiences: aJson.data || [],
        comunicacoes: cJson.data || [],
        facturas: fJson.data || [],
        actas: actJson.data || [],
        pedidos: pedJson.pedidos || [],
        fornecedores: fornJson.fornecedores || [],
      });
    } catch {
      setLists(EMPTY_LISTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim().length >= 2) {
      setOpen(true);
      ensureLoaded();
    } else {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const term = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  if (lists && term.length >= 2) {
    for (const p of lists.presentations) {
      const haystack = `${p.company || ""} ${p.contactName || p.contact || ""}`.toLowerCase();
      if (haystack.includes(term)) {
        results.push({ id: `p-${p.id}`, title: p.company || "Carta de Apresentação", subtitle: p.contactName || p.contact || "", tab: "history", icon: FileText, tone: "accent" });
      }
    }
    for (const a of lists.audiences) {
      const haystack = `${a.organization || a.company || ""} ${a.requestorName || a.contact || ""}`.toLowerCase();
      if (haystack.includes(term)) {
        results.push({ id: `a-${a.id}`, title: a.organization || a.company || "Pedido de Audiência", subtitle: a.requestorName || a.contact || "", tab: "history", icon: Users, tone: "info" });
      }
    }
    for (const c of lists.comunicacoes) {
      const haystack = `${c.assunto || ""} ${c.numero || ""}`.toLowerCase();
      if (haystack.includes(term)) {
        results.push({ id: `c-${c.id}`, title: c.assunto || c.numero || "Comunicação", subtitle: c.numero || "", tab: "comunicacoes", icon: MessageSquare, tone: "gold" });
      }
    }
    for (const f of lists.facturas) {
      const haystack = `${f.numero || ""} ${f.descricao || ""} ${f.fornecedor_nome || ""}`.toLowerCase();
      if (haystack.includes(term)) {
        results.push({ id: `f-${f.id}`, title: f.numero || "Factura", subtitle: f.descricao || f.fornecedor_nome || "", tab: "facturas", icon: Receipt, tone: "danger" });
      }
    }
    for (const act of lists.actas) {
      const haystack = `${act.titulo || ""} ${act.numero || ""} ${act.organizador_nome || ""}`.toLowerCase();
      if (haystack.includes(term)) {
        results.push({ id: `act-${act.id}`, title: act.titulo || act.numero || "Acta", subtitle: act.numero || "", tab: "actas", icon: BookText, tone: "info" });
      }
    }
    for (const ped of lists.pedidos) {
      const haystack = `${ped.titulo || ""} ${ped.numero || ""} ${ped.departamento_solicitante || ""}`.toLowerCase();
      if (haystack.includes(term)) {
        results.push({ id: `ped-${ped.id}`, title: ped.titulo || ped.numero || "Pedido de Compra", subtitle: ped.numero || "", tab: "compras", icon: ShoppingCart, tone: "accent" });
      }
    }
    for (const forn of lists.fornecedores) {
      const haystack = `${forn.nome || ""} ${forn.nif || ""}`.toLowerCase();
      if (haystack.includes(term)) {
        results.push({ id: `forn-${forn.id}`, title: forn.nome || "Fornecedor", subtitle: forn.nif || "", tab: "compras", icon: Building2, tone: "gold" });
      }
    }
  }

  const limited = results.slice(0, 10);

  const handleSelect = (result: SearchResult) => {
    onTabChange(result.tab);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      className="grid items-center gap-4 px-8 py-3.5 shrink-0"
      style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)", gridTemplateColumns: "1fr auto 1fr" }}
    >
      <div />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-[420px] max-w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim().length >= 2 && setOpen(true)}
              placeholder="Pesquisar em todo o sistema…"
              className="w-full h-10 pl-10 pr-4 outline-none"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "100px",
                fontSize: "13.5px",
                color: "var(--foreground)",
              }}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent align="center" className="w-[420px] p-0" style={{ borderRadius: "12px" }} onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span style={{ fontSize: "13px" }}>A pesquisar…</span>
              </div>
            ) : limited.length === 0 ? (
              <div className="py-8 text-center" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                Sem resultados para "{query}"
              </div>
            ) : (
              limited.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--muted)] border-b last:border-b-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `var(--tone-${r.tone}-soft)` }}>
                      <Icon className="h-4 w-4" style={{ color: `var(--tone-${r.tone})` }} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>{r.title}</p>
                      {r.subtitle && <p className="truncate" style={{ fontSize: "11.5px", color: "var(--muted-foreground)" }}>{r.subtitle}</p>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center justify-end gap-2">
        <NotificationBell onNavigate={onTabChange} />
      </div>
    </div>
  );
}
