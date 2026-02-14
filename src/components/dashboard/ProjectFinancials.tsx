import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/useProjects";
import { BarChart3 } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const typeLabel: Record<string, string> = {
  epc: "EPC",
  i_and_c: "I&C",
  service: "Service",
  oam: "O&M",
};

const catLabel: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
};

export function ProjectFinancials() {
  const { projects, isLoading } = useProjects();

  if (isLoading) return null;

  const rows = (projects || []).map((p) => {
    const proj = p as any;
    const labor = Number(proj.total_labor_cost) || 0;
    const food = Number(proj.total_food_cost) || 0;
    const travel = Number(proj.total_travel_cost) || 0;
    const material = Number(proj.total_material_cost) || 0;
    const other = Number(proj.total_other_cost) || 0;
    const totalExpense = labor + food + travel + material + other;
    const revenue = Number(proj.project_revenue) || Number(proj.total_amount) || 0;
    const profit = revenue - totalExpense;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const hours = Number(proj.total_hours_worked) || 0;

    return {
      id: p.id,
      name: p.project_name,
      type: typeLabel[p.project_type] || p.project_type,
      category: catLabel[proj.project_category] || proj.project_category || "-",
      status: p.status,
      hours,
      labor,
      food,
      travel,
      material,
      other,
      totalExpense,
      revenue,
      profit,
      margin,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <BarChart3 className="h-5 w-5" />
          Project Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 md:p-6 md:pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Project</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Labor</TableHead>
              <TableHead className="text-right">Food</TableHead>
              <TableHead className="text-right">Travel</TableHead>
              <TableHead className="text-right">Material</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{r.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.category}</TableCell>
                  <TableCell className="text-right text-sm">{r.hours.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(r.labor)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(r.food)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(r.travel)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(r.material)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{fmt(r.totalExpense)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-success">{fmt(r.revenue)}</TableCell>
                  <TableCell className={`text-right text-sm font-bold ${r.profit >= 0 ? "text-success" : "text-destructive"}`}>
                    {fmt(r.profit)}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-bold ${r.margin >= 0 ? "text-success" : "text-destructive"}`}>
                    {r.revenue > 0 ? `${r.margin.toFixed(1)}%` : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
