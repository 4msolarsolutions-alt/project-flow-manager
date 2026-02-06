import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useExpenses } from "@/hooks/useExpenses";
import { Check, X, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface ExpenseVerificationDialogProps {
  expense: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseVerificationDialog({ 
  expense, 
  open, 
  onOpenChange 
}: ExpenseVerificationDialogProps) {
  const { updateExpense, approveExpense } = useExpenses();
  const [verifiedAmount, setVerifiedAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [billUrl, setBillUrl] = useState<string | null>(null);
  const [isLoadingBill, setIsLoadingBill] = useState(false);

  useEffect(() => {
    if (expense?.bill_image_url && open) {
      setIsLoadingBill(true);
      // Get signed URL for bill image
      supabase.storage
        .from('expense-bills')
        .createSignedUrl(expense.bill_image_url, 3600)
        .then(({ data, error }) => {
          if (data) {
            setBillUrl(data.signedUrl);
          }
          setIsLoadingBill(false);
        });
    }
    // Reset form when opening
    if (open && expense) {
      setVerifiedAmount(expense.amount?.toString() || "");
      setRejectionReason("");
    }
  }, [expense, open]);

  const handleVerifyAndApprove = async () => {
    if (!verifiedAmount) return;

    const verified = parseFloat(verifiedAmount);
    const submitted = parseFloat(expense.amount);

    if (verified === submitted) {
      // Amounts match - approve
      await updateExpense.mutateAsync({
        id: expense.id,
        verified_amount: verified,
        verification_status: 'verified',
        status: 'approved',
      });
    } else {
      // Amounts don't match - reject
      if (!rejectionReason) {
        return; // Need rejection reason
      }
      await updateExpense.mutateAsync({
        id: expense.id,
        verified_amount: verified,
        verification_status: 'rejected',
        status: 'rejected',
        rejection_reason: `Amount mismatch: Submitted ₹${submitted}, Verified ₹${verified}. ${rejectionReason}`,
      });
    }
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!rejectionReason) return;

    await updateExpense.mutateAsync({
      id: expense.id,
      verification_status: 'rejected',
      status: 'rejected',
      rejection_reason: rejectionReason,
    });
    onOpenChange(false);
  };

  const amountMismatch = verifiedAmount && parseFloat(verifiedAmount) !== expense?.amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verify Expense</DialogTitle>
          <DialogDescription>
            Review the bill image and verify the expense amount.
          </DialogDescription>
        </DialogHeader>
        
        {expense && (
          <div className="space-y-4 py-4">
            {/* Expense Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{expense.expense_type}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <p className="font-medium">
                  {expense.expense_date 
                    ? format(new Date(expense.expense_date), 'dd MMM yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Project</Label>
                <p className="font-medium">
                  {expense.projects?.project_name || 'Company Expense'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Submitted Amount</Label>
                <p className="font-medium text-lg">
                  ₹{expense.amount?.toLocaleString('en-IN')}
                </p>
              </div>
              {expense.description && (
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="font-medium">{expense.description}</p>
                </div>
              )}
            </div>

            {/* Bill Image */}
            <div>
              <Label>Bill Image</Label>
              <div className="mt-2 border rounded-lg overflow-hidden bg-muted">
                {isLoadingBill ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : billUrl ? (
                  <div className="relative">
                    <img 
                      src={billUrl} 
                      alt="Expense bill" 
                      className="w-full max-h-64 object-contain"
                    />
                    <a 
                      href={billUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2"
                    >
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open Full Size
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No bill image available
                  </div>
                )}
              </div>
            </div>

            {/* Verification Form */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label>Verified Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="Enter verified amount from bill"
                  value={verifiedAmount}
                  onChange={(e) => setVerifiedAmount(e.target.value)}
                />
                {amountMismatch && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Amount mismatch! Submitted: ₹{expense.amount}, Verified: ₹{verifiedAmount}
                  </div>
                )}
              </div>

              {amountMismatch && (
                <div>
                  <Label>Rejection Reason (Required for mismatch) *</Label>
                  <Textarea
                    placeholder="Explain the discrepancy..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={!rejectionReason || updateExpense.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button 
            onClick={handleVerifyAndApprove}
            disabled={
              !verifiedAmount || 
              (amountMismatch && !rejectionReason) || 
              updateExpense.isPending
            }
          >
            {updateExpense.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {amountMismatch ? "Reject (Mismatch)" : "Verify & Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
