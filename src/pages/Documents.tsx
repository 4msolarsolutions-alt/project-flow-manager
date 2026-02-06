import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, MoreHorizontal, FileText, FileImage, File, Download, Eye, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type DocumentType = Database["public"]["Enums"]["document_type"];

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: "site_visit", label: "Site Visit Report" },
  { value: "bom1", label: "BOM 1" },
  { value: "quotation", label: "Quotation" },
  { value: "work_order", label: "Work Order" },
  { value: "bom2", label: "BOM 2" },
  { value: "panel_details", label: "Panel Details" },
  { value: "inverter_details", label: "Inverter Details" },
  { value: "battery_details", label: "Battery Details" },
  { value: "material_list", label: "Material List" },
  { value: "eb_document", label: "EB Document" },
  { value: "completion_report", label: "Completion Report" },
  { value: "gst_invoice", label: "GST Invoice" },
  { value: "ceg_approval", label: "CEG Approval" },
  { value: "other", label: "Other" },
];

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="h-8 w-8 text-destructive" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
    return <FileImage className="h-8 w-8 text-success" />;
  return <File className="h-8 w-8 text-primary" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Documents = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const { projects } = useProjects();
  const { leads } = useLeads();
  
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    document_type: "" as DocumentType | "",
    project_id: "",
    lead_id: "",
    notes: "",
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", projectFilter],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select(`
          *,
          projects (project_name),
          leads (customer_name)
        `)
        .order("created_at", { ascending: false });

      if (projectFilter !== "all") {
        query = query.eq("project_id", projectFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document Deleted",
        description: "Document has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = async () => {
    if (!uploadFile || !uploadData.document_type) {
      toast({
        title: "Missing Information",
        description: "Please select a file and document type.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = uploadFile.name.split(".").pop();
      const fileName = `${Date.now()}_${uploadFile.name}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("site-visits")
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("site-visits")
        .getPublicUrl(filePath);

      // Save document record
      const { error: dbError } = await supabase.from("documents").insert({
        file_name: uploadFile.name,
        file_url: urlData.publicUrl,
        file_size: uploadFile.size,
        document_type: uploadData.document_type as DocumentType,
        project_id: uploadData.project_id || null,
        lead_id: uploadData.lead_id || null,
        notes: uploadData.notes || null,
        uploaded_by: user?.id,
      });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setUploadData({ document_type: "", project_id: "", lead_id: "", notes: "" });
      
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    window.open(url, "_blank");
  };

  return (
    <AppLayout title="Documents">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground">{documents?.length || 0} documents</p>
        </div>
        <Button className="gap-2" onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !documents?.length ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No documents yet.</p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload your first document
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl bg-card border border-border p-4 transition-all hover:shadow-md animate-fade-in"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                  {getFileIcon(doc.file_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate" title={doc.file_name}>
                    {doc.file_name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(doc as any).projects?.project_name || (doc as any).leads?.customer_name || "No project"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{doc.document_type.replace(/_/g, " ")}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => window.open(doc.file_url, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => handleDownload(doc.file_url, doc.file_name)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive"
                      onClick={() => deleteDocument.mutate(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{doc.notes || "No notes"}</span>
                <span>{formatDate(doc.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>File *</Label>
              <Input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select
                value={uploadData.document_type}
                onValueChange={(value) =>
                  setUploadData({ ...uploadData, document_type: value as DocumentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select
                value={uploadData.project_id}
                onValueChange={(value) =>
                  setUploadData({ ...uploadData, project_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lead (Optional)</Label>
              <Select
                value={uploadData.lead_id}
                onValueChange={(value) =>
                  setUploadData({ ...uploadData, lead_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads?.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={uploadData.notes}
                onChange={(e) =>
                  setUploadData({ ...uploadData, notes: e.target.value })
                }
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Documents;
