import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/sentinela/ui-kit";
import { auditLog } from "@/components/sentinela/data";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/org/auditoria/logs")({
  head: () => ({
    meta: [
      { title: "Histórico e log de auditoria — Sentinela" },
      {
        name: "description",
        content: "Registro rastreável de ações, decisões, justificativas e resultados na plataforma Sentinela.",
      },
      { property: "og:title", content: "Log de auditoria — Sentinela" },
      { property: "og:description", content: "Rastreabilidade completa das ações no sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Logs,
});

function Logs() {
  const [q, setQ] = useState("");
  const rows = auditLog.filter((r) =>
    `${r.usuario} ${r.acao} ${r.modulo}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de auditoria"
        description="Todas as ações relevantes são registradas de forma rastreável."
      />

      <Panel>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por usuário, ação ou módulo"
              className="pl-9"
            />
          </div>
          <Select defaultValue="todos">
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os módulos</SelectItem>
              <SelectItem value="prev">Previsões</SelectItem>
              <SelectItem value="aud">Auditoria</SelectItem>
              <SelectItem value="cont">Contestações</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="30">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {["Data", "Horário", "Usuário", "Ação", "Módulo", "Decisão", "Justificativa", "Resultado"].map((h) => (
                <TableHead key={h} className="whitespace-nowrap text-xs">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} className="text-xs">
                <TableCell>{r.data}</TableCell>
                <TableCell>{r.hora}</TableCell>
                <TableCell className="font-mono text-primary">{r.usuario}</TableCell>
                <TableCell className="max-w-[18rem]">{r.acao}</TableCell>
                <TableCell>{r.modulo}</TableCell>
                <TableCell>{r.decisao}</TableCell>
                <TableCell className="text-muted-foreground">{r.justificativa}</TableCell>
                <TableCell>{r.resultado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado para esta busca.
          </p>
        )}
      </Panel>
    </div>
  );
}
