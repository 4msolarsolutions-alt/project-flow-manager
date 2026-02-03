import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Send,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useQuotation, useQuotations } from "@/hooks/useQuotations";
import { generateQuotationPdf } from "@/utils/quotationPdf";
import { shareQuotationViaWhatsApp } from "@/utils/whatsappShare";
import { useToast } from "@/hooks/use-toast";

interface BomItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-blue-500/20 text-blue-500";
    case "sent":
      return "bg-yellow-500/20 text-yellow-500";
    case "approved":
      return "bg-green-500/20 text-green-500";
    case "rejected":
      return "bg-red-500/20 text-red-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const QuotationPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: quotation, isLoading } = useQuotation(id);
  const { updateQuotation, sendQuotation } = useQuotations();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<{
    system_kw: number;
    subtotal: number;
    gst_amount: number;
    total_amount: number;
    validity_days: number;
    terms_conditions: string;
    bom: BomItem[];
  } | null>(null);

  // Handle edit mode from query parameter
  useEffect(() => {
    if (searchParams.get("edit") === "true" && quotation && !isEditing) {
      handleStartEdit();
    }
  }, [searchParams, quotation]);

  const parseBom = (bom: any): BomItem[] => {
    if (!bom) return [];
    if (Array.isArray(bom)) return bom as BomItem[];
    return [];
  };

  const handleStartEdit = () => {
    if (!quotation) return;
    setEditData({
      system_kw: quotation.system_kw || 0,
      subtotal: quotation.subtotal || 0,
      gst_amount: quotation.gst_amount || 0,
      total_amount: quotation.total_amount || 0,
      validity_days: quotation.validity_days || 15,
      terms_conditions: quotation.terms_conditions || "",
      bom: parseBom(quotation.bom),
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const calculateTotals = (bom: BomItem[]) => {
    const subtotal = bom.reduce((sum, item) => sum + item.amount, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handleBomItemChange = (index: number, field: keyof BomItem, value: string | number) => {
    if (!editData) return;
    const newBom = [...editData.bom];
    newBom[index] = { ...newBom[index], [field]: value };
    
    if (field === "quantity" || field === "rate") {
      newBom[index].amount = newBom[index].quantity * newBom[index].rate;
    }
    
    const totals = calculateTotals(newBom);
    setEditData({
      ...editData,
      bom: newBom,
      subtotal: totals.subtotal,
      gst_amount: totals.gst,
      total_amount: totals.total,
    });
  };

  const handleAddBomItem = () => {
    if (!editData) return;
    const newBom = [
      ...editData.bom,
      { name: "", description: "", quantity: 1, unit: "Nos", rate: 0, amount: 0 },
    ];
    setEditData({ ...editData, bom: newBom });
  };

  const handleRemoveBomItem = (index: number) => {
    if (!editData) return;
    const newBom = editData.bom.filter((_, i) => i !== index);
    const totals = calculateTotals(newBom);
    setEditData({
      ...editData,
      bom: newBom,
      subtotal: totals.subtotal,
      gst_amount: totals.gst,
      total_amount: totals.total,
    });
  };

  const handleSaveEdit = async () => {
    if (!quotation || !editData) return;
    setIsSaving(true);
    try {
      await updateQuotation.mutateAsync({
        id: quotation.id,
        system_kw: editData.system_kw,
        subtotal: editData.subtotal,
        gst_amount: editData.gst_amount,
        total_amount: editData.total_amount,
        validity_days: editData.validity_days,
        terms_conditions: editData.terms_conditions,
        bom: editData.bom as any,
      });
      setIsEditing(false);
      setEditData(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (quotation) {
      generateQuotationPdf(quotation);
    }
  };

  const handleWhatsAppShare = () => {
    if (!quotation) return;
    if (!(quotation as any).leads?.phone) {
      toast({
        title: "No Phone Number",
        description: "Customer phone number is not available.",
        variant: "destructive",
      });
      return;
    }
    shareQuotationViaWhatsApp(quotation);
  };

  const handleMarkAsSent = async () => {
    if (quotation) {
      await sendQuotation.mutateAsync(quotation.id);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Quotation Details">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!quotation) {
    return (
      <Layout title="Quotation Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Quotation not found.</p>
          <Button variant="link" onClick={() => navigate("/quotations")}>
            Back to Quotations
          </Button>
        </div>
      </Layout>
    );
  }

  const lead = (quotation as any).leads;
  const bom = parseBom(quotation.bom);

  return (
    <Layout title="Quotation Details">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {quotation.quotation_number || `QT-${quotation.id.slice(0, 8).toUpperCase()}`}
            </h1>
            <p className="text-muted-foreground">{lead?.customer_name || "Customer"}</p>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
              quotation.status || "draft"
            )}`}
          >
            {(quotation.status || "draft").charAt(0).toUpperCase() +
              (quotation.status || "draft").slice(1)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" className="gap-2" onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleWhatsAppShare}>
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              {quotation.status === "draft" && (
                <Button className="gap-2" onClick={handleMarkAsSent}>
                  <Send className="h-4 w-4" />
                  Mark as Sent
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" className="gap-2" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button className="gap-2" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Customer Name</Label>
                <p className="font-medium">{lead?.customer_name || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{lead?.phone || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-muted-foreground">Address</Label>
                <p className="font-medium">{lead?.address || "-"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Bill of Materials */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bill of Materials</CardTitle>
              {isEditing && (
                <Button size="sm" variant="outline" className="gap-1" onClick={handleAddBomItem}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing && editData ? (
                <div className="space-y-4">
                  {editData.bom.map((item, index) => (
                    <div key={index} className="grid gap-2 p-4 border rounded-lg relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-destructive"
                        onClick={() => handleRemoveBomItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <Label>Item Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => handleBomItemChange(index, "name", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => handleBomItemChange(index, "description", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-4">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleBomItemChange(index, "quantity", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => handleBomItemChange(index, "unit", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Rate (₹)</Label>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              handleBomItemChange(index, "rate", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div>
                          <Label>Amount</Label>
                          <Input value={formatCurrency(item.amount)} disabled />
                        </div>
                      </div>
                    </div>
                  ))}
                  {editData.bom.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">
                      No items. Click "Add Item" to add materials.
                    </p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bom.length > 0 ? (
                      bom.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No items in quotation
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && editData ? (
                <Textarea
                  value={editData.terms_conditions}
                  onChange={(e) =>
                    setEditData({ ...editData, terms_conditions: e.target.value })
                  }
                  rows={6}
                  placeholder="Enter terms and conditions..."
                />
              ) : (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {quotation.terms_conditions || "No terms and conditions specified."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">System Size</span>
                {isEditing && editData ? (
                  <Input
                    type="number"
                    value={editData.system_kw}
                    onChange={(e) =>
                      setEditData({ ...editData, system_kw: parseFloat(e.target.value) || 0 })
                    }
                    className="w-24 text-right"
                  />
                ) : (
                  <span className="font-medium">{quotation.system_kw || 0} kW</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(isEditing && editData ? editData.subtotal : quotation.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-medium">
                  {formatCurrency(
                    isEditing && editData ? editData.gst_amount : quotation.gst_amount
                  )}
                </span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-primary text-lg">
                  {formatCurrency(
                    isEditing && editData ? editData.total_amount : quotation.total_amount
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Created Date</Label>
                <p className="font-medium">{formatDate(quotation.created_at)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Validity</Label>
                {isEditing && editData ? (
                  <Input
                    type="number"
                    value={editData.validity_days}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        validity_days: parseInt(e.target.value) || 15,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{quotation.validity_days || 15} days</p>
                )}
              </div>
              {quotation.sent_at && (
                <div>
                  <Label className="text-muted-foreground">Sent Date</Label>
                  <p className="font-medium">{formatDate(quotation.sent_at)}</p>
                </div>
              )}
              {quotation.approved_at && (
                <div>
                  <Label className="text-muted-foreground">Approved Date</Label>
                  <p className="font-medium">{formatDate(quotation.approved_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QuotationPreview;
