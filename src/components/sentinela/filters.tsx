import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="min-w-[9.5rem] flex-1">
      <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Select value={value} defaultValue={options[0]!} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export type MapFilterState = { period: string; type: string; time: string; weekday: string; source: string; status: string; confidence: string };
export const defaultMapFilters: MapFilterState = { period: "Últimos 30 dias", type: "Todos os tipos", time: "Todos", weekday: "Todos", source: "Todas", status: "Todos", confidence: "Qualquer" };
export function MapFilters({ value = defaultMapFilters, onChange }: { value?: MapFilterState; onChange?: (filters: MapFilterState) => void }) {
  const change = (key: keyof MapFilterState) => (next: string) => onChange?.({ ...value, [key]: next });
  return (
    <div className="surface-card p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
        <Filter className="size-3.5" /> Filtros
      </p>
      <div className="flex flex-wrap gap-3">
        <FilterSelect label="Período" value={value.period} onChange={change("period")} options={["Últimos 30 dias", "Últimos 7 dias", "3 meses", "12 meses"]} />
        <FilterSelect label="Tipo" value={value.type} onChange={change("type")} options={["Todos os tipos", "Furto", "Roubo", "Violência", "Dano", "Ameaça", "Acidente"]} />
        <FilterSelect label="Horário" value={value.time} onChange={change("time")} options={["Todos", "00h-06h", "06h-12h", "12h-18h", "18h-00h"]} />
        <FilterSelect label="Dia da semana" value={value.weekday} onChange={change("weekday")} options={["Todos", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]} />
        <FilterSelect label="Origem" value={value.source} onChange={change("source")} options={["Todas", "População", "Registro policial", "Outras fontes"]} />
        <FilterSelect label="Status" value={value.status} onChange={change("status")} options={["Todos", "Recebida", "Em análise", "Validação", "Confirmada", "Encaminhada", "Encerrada"]} />
        <FilterSelect label="Confiabilidade" value={value.confidence} onChange={change("confidence")} options={["Qualquer", "Acima de 50%", "Acima de 70%", "Acima de 85%"]} />
      </div>
    </div>
  );
}

export function TableFilters() {
  return (
    <div className="surface-card p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
        <Filter className="size-3.5" /> Filtros avançados
      </p>
      <div className="flex flex-wrap gap-3">
        <FilterSelect label="Período" options={["Últimos 30 dias", "Últimos 7 dias", "3 meses"]} />
        <FilterSelect label="Região" options={["Todas", "Centro", "Norte", "Sul", "Leste", "Litoral"]} />
        <FilterSelect label="Tipo" options={["Todos", "Furto", "Roubo", "Dano", "Ameaça", "Acidente"]} />
        <FilterSelect label="Origem" options={["Todas", "População", "Registro policial", "Outras fontes"]} />
        <FilterSelect label="Status" options={["Todos", "Recebida", "Em análise", "Confirmada", "Encaminhada", "Encerrada"]} />
      </div>
    </div>
  );
}
