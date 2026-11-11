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
}: {
  label: string;
  options: string[];
}) {
  return (
    <div className="min-w-[9.5rem] flex-1">
      <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Select defaultValue={options[0]!}>
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

export function MapFilters() {
  return (
    <div className="surface-card p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
        <Filter className="size-3.5" /> Filtros
      </p>
      <div className="flex flex-wrap gap-3">
        <FilterSelect label="Período" options={["Últimos 30 dias", "Últimos 7 dias", "3 meses", "12 meses"]} />
        <FilterSelect label="Tipo" options={["Todos os tipos", "Furto", "Roubo", "Violência", "Dano", "Ameaça", "Acidente"]} />
        <FilterSelect label="Horário" options={["Todos", "00h-06h", "06h-12h", "12h-18h", "18h-00h"]} />
        <FilterSelect label="Dia da semana" options={["Todos", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]} />
        <FilterSelect label="Origem" options={["Todas", "População", "Registro policial", "Outras fontes"]} />
        <FilterSelect label="Status" options={["Todos", "Recebida", "Em análise", "Confirmada", "Encaminhada", "Encerrada"]} />
        <FilterSelect label="Confiabilidade" options={["Qualquer", "Acima de 50%", "Acima de 70%", "Acima de 85%"]} />
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
