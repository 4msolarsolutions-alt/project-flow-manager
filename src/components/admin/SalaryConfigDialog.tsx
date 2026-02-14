import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface SalaryConfigDialogProps {
  user: { id: string; first_name?: string | null; email?: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalaryConfigDialog({ user, open, onOpenChange }: SalaryConfigDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [salaryType, setSalaryType] = useState("monthly");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [dailyWage, setDailyWage] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [foodAllowance, setFoodAllowance] = useState("200");
  const [travelRate, setTravelRate] = useState("10");

  useEffect(() => {
    if (!user || !open) return;
    setFetching(true);
    supabase
      .from("profiles")
      .select("salary_type, monthly_salary, daily_wage, hourly_rate, food_allowance_per_day, travel_rate_per_km")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSalaryType((data as any).salary_type || "monthly");
          setMonthlySalary(String((data as any).monthly_salary || ""));
          setDailyWage(String((data as any).daily_wage || ""));
          setHourlyRate(String(data.hourly_rate || ""));
          setFoodAllowance(String((data as any).food_allowance_per_day ?? 200));
          setTravelRate(String((data as any).travel_rate_per_km ?? 10));
        }
        setFetching(false);
      });
  }, [user, open]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          salary_type: salaryType,
          monthly_salary: Number(monthlySalary) || 0,
          daily_wage: Number(dailyWage) || 0,
          hourly_rate: Number(hourlyRate) || 0,
          food_allowance_per_day: Number(foodAllowance) || 200,
          travel_rate_per_km: Number(travelRate) || 10,
        } as any)
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Salary Updated", description: "Compensation details saved." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-payroll"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Salary Configuration
          </DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {user?.first_name || user?.email || "Employee"}
            </p>

            <div className="space-y-2">
              <Label>Salary Type</Label>
              <Select value={salaryType} onValueChange={setSalaryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {salaryType === "monthly" && (
              <div className="space-y-2">
                <Label>Monthly Salary (₹)</Label>
                <Input
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="25000"
                />
              </div>
            )}

            {salaryType === "daily" && (
              <div className="space-y-2">
                <Label>Daily Wage (₹)</Label>
                <Input
                  type="number"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  placeholder="800"
                />
              </div>
            )}

            {salaryType === "hourly" && (
              <div className="space-y-2">
                <Label>Hourly Rate (₹)</Label>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="150"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Food Allowance/Day (₹)</Label>
                <Input
                  type="number"
                  value={foodAllowance}
                  onChange={(e) => setFoodAllowance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Travel Rate/KM (₹)</Label>
                <Input
                  type="number"
                  value={travelRate}
                  onChange={(e) => setTravelRate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || fetching}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
