import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useQuotations } from "@/hooks/useQuotations";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";

const defaultBomItems = [
  { material: "Solar Module", make: "", description: "", quantity: 0, unit: "Nos", cost: 0 },
  { material: "Inverter", make: "", description: "", quantity: 1, unit: "Nos", cost: 0 },
  { material: "Monitoring System", make: "", description: "Data Monitoring", quantity: 1, unit: "Nos", cost: 0 },
  { material: "Module Mounting Structure", make: "", description: "", quantity: 0, unit: "Kw", cost: 0 },
  { material: "DCDB", make: "", description: "", quantity: 1, unit: "Nos", cost: 0 },
  { material: "AC Combiner Box", make: "", description: "", quantity: 1, unit: "Nos", cost: 0 },
  { material: "DC Cable", make: "Polycab", description: "4 SQ.MM -FRLS,1000vdc-", quantity: 0, unit: "Mtr", cost: 0 },
  { material: "AC Cable", make: "Orbit/Polycab", description: "", quantity: 0, unit: "Mtr", cost: 0 },
  { material: "Copper Flexible Cable", make: "Polycab/Unistar", description: "", quantity: 0, unit: "Mtr", cost: 0 },
  { material: "Earth Rod", make: "", description: "1m Copper bonded with chemical bag", quantity: 2, unit: "Nos", cost: 0 },
  { material: "Earth PIT Cover", make: "", description: "Concrete Earth Pit chamber", quantity: 2, unit: "Nos", cost: 0 },
  { material: "Lighting Arrester", make: "", description: "Conventional", quantity: 1, unit: "Nos", cost: 0 },
  { material: "Earthing Cables", make: "Polycab", description: "1C Copper 4sq.mm", quantity: 0, unit: "Mtr", cost: 0 },
  { material: "Installation Materials", make: "Finolex/Ashirvad", description: "Upvc pipes,lug,gland,tie,clamps", quantity: 0, unit: "kw", cost: 0 },
  { material: "Installation Cost", make: "", description: "", quantity: 0, unit: "Kw", cost: 0 },
  { material: "Transport", make: "", description: "", quantity: 0, unit: "kw", cost: 0 },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export function CreateQuotationDialog({ open, onOpenChange, selectedLead }) {
  const { createQuotation } = useQuotations();
  const { updateLead } = useLeads();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    system_kw: "",
    validity_days: "15",
    margin_percent: "10",
    terms_conditions: `1. Quotation valid for 15 days from the date of issue.
2. 60% advance payment with Purchase Order.
3. 30% upon material delivery.
4. 10% on completion of installation after commissioning.
5. GST @9% applicable on supply and installation.
6. Net metering application charges extra (if applicable).
7. Civil work included as per site requirements.`,
  });

  const [bomItems, setBomItems] = useState(
    defaultBomItems.map((item, index) => ({
      ...item,
      id: generateId(),
      sno: index + 1,
    }))
  );

  const addBomItem = () => {
    setBomItems([
      ...bomItems,
      {
        id: generateId(),
        sno: bomItems.length + 1,
        material: "",
        make: "",
        description: "",
        quantity: 0,
        unit: "Nos",
        cost: 0,
      },
    ]);
  };

  const removeBomItem = (id) => {
    setBomItems(bomItems.filter((item) => item.id !== id).map((item, index) => ({
      ...item,
      sno: index + 1,
    })));
  };

  const updateBomItem = (id, field, value) => {
    setBomItems(
      bomItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const subtotal = bomItems.reduce((sum, item) => sum + (item.cost || 0), 0);
  const marginPercent = parseFloat(formData.margin_percent) || 0;
  const marginAmount = (subtotal * marginPercent) / 100;
  const totalBeforeGst = subtotal + marginAmount;
  const gstAmount = totalBeforeGst * 0.09;
  const grandTotal = totalBeforeGst + gstAmount;
  const perWatt = formData.system_kw ? totalBeforeGst / (parseFloat(formData.system_kw) * 1000) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    
    setIsSubmitting(true);
    
    try {
      await createQuotation.mutateAsync({
        lead_id: selectedLead.id,
        system_kw: parseFloat(formData.system_kw) || null,
        bom: bomItems.map(({ id, ...rest }) => rest),
        subtotal: subtotal,
        gst_amount: gstAmount,
        total_amount: grandTotal,
        validity_days: parseInt(formData.validity_days) || 15,
        terms_conditions: formData.terms_conditions,
        prepared_by: user?.id,
        status: 'draft',
      });
      
      await updateLead.mutateAsync({
        id: selectedLead.id,
        status: 'quotation_prepared',
      });
      
      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      system_kw: "",
      validity_days: "15",
      margin_percent: "10",
      terms_conditions: formData.terms_conditions,
    });
    setBomItems(
      defaultBomItems.map((item, index) => ({
        ...item,
        id: generateId(),
        sno: index + 1,
      }))
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quotation</DialogTitle>
          {selectedLead && (
            <p className="text-sm text-muted-foreground">
              For: {selectedLead.customer_name} - {selectedLead.address}
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="system_kw">System Size (kW) *</Label>
              <Input
                id="system_kw"
                type="number"
                step="0.1"
                value={formData.system_kw}
                onChange={(e) => setFormData({ ...formData, system_kw: e.target.value })}
                placeholder="e.g., 5.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity_days">Validity (Days)</Label>
              <Input
                id="validity_days"
                type="number"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin_percent">Margin (%)</Label>
              <Input
                id="margin_percent"
                type="number"
                step="0.1"
                value={formData.margin_percent}
                onChange={(e) => setFormData({ ...formData, margin_percent: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Per Watt</Label>
              <Input
                value={perWatt ? `₹${perWatt.toFixed(2)}` : "₹0.00"}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* BOM Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Bill of Materials (BOM)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addBomItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">S.No</th>
                      <th className="px-3 py-2 text-left min-w-[150px]">Material</th>
                      <th className="px-3 py-2 text-left min-w-[120px]">Make</th>
                      <th className="px-3 py-2 text-left min-w-[180px]">Description</th>
                      <th className="px-3 py-2 text-left w-20">Qty</th>
                      <th className="px-3 py-2 text-left w-20">Unit</th>
                      <th className="px-3 py-2 text-left w-28">Cost (₹)</th>
                      <th className="px-3 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{item.sno}</td>
                        <td className="px-3 py-1">
                          <Input
                            value={item.material}
                            onChange={(e) => updateBomItem(item.id, 'material', e.target.value)}
                            className="h-8"
                            placeholder="Material name"
                          />
                        </td>
                        <td className="px-3 py-1">
                          <Input
                            value={item.make}
                            onChange={(e) => updateBomItem(item.id, 'make', e.target.value)}
                            className="h-8"
                            placeholder="Brand"
                          />
                        </td>
                        <td className="px-3 py-1">
                          <Input
                            value={item.description}
                            onChange={(e) => updateBomItem(item.id, 'description', e.target.value)}
                            className="h-8"
                            placeholder="Specifications"
                          />
                        </td>
                        <td className="px-3 py-1">
                          <Input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) => updateBomItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </td>
                        <td className="px-3 py-1">
                          <Select
                            value={item.unit}
                            onValueChange={(value) => updateBomItem(item.id, 'unit', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nos">Nos</SelectItem>
                              <SelectItem value="Mtr">Mtr</SelectItem>
                              <SelectItem value="Kw">Kw</SelectItem>
                              <SelectItem value="kw">kw</SelectItem>
                              <SelectItem value="Set">Set</SelectItem>
                              <SelectItem value="Kgs">Kgs</SelectItem>
                              <SelectItem value="Qty">Qty</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-1">
                          <Input
                            type="number"
                            value={item.cost || ""}
                            onChange={(e) => updateBomItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </td>
                        <td className="px-3 py-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeBomItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sub Total:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margin ({marginPercent}%):</span>
                <span className="font-medium">{formatCurrency(marginAmount)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">{formatCurrency(totalBeforeGst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST (9%):</span>
                <span className="font-medium">{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-base border-t pt-2">
                <span className="font-semibold">Grand Total:</span>
                <span className="font-bold text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              rows={4}
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Quotation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
