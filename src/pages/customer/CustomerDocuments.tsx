import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  FileText, 
  Loader2, 
  Download,
  FileCheck,
  FileBarChart,
  Receipt,
  Shield,
  FolderOpen
} from "lucide-react";

const DOCUMENT_TYPE_INFO: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  quotation: { label: "Quotation", icon: FileBarChart, description: "Project cost estimate and BOM" },
  work_order: { label: "Work Order", icon: FileCheck, description: "Approved work order document" },
  gst_invoice: { label: "GST Invoice", icon: Receipt, description: "Tax invoice for the project" },
  completion_report: { label: "Completion Report", icon: FileText, description: "Project completion certificate" },
  ceg_approval: { label: "CEG Approval", icon: Shield, description: "Chief Electrical Inspector approval" },
  panel_details: { label: "Panel Details", icon: FileText, description: "Solar panel specifications" },
  inverter_details: { label: "Inverter Details", icon: FileText, description: "Inverter specifications" },
  battery_details: { label: "Battery Details", icon: FileText, description: "Battery specifications" },
  other: { label: "Other", icon: FolderOpen, description: "Additional documents" },
};

export default function CustomerDocuments() {
  const { projects, isLoading: projectsLoading } = useCustomerProjects();
  const projectIds = projects?.map(p => p.id) || [];
  const leadIds = projects?.map(p => p.lead_id).filter(Boolean) || [];

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['customer-documents', projectIds, leadIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      
      // Get documents for both project and lead
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`project_id.in.(${projectIds.join(',')}),lead_id.in.(${leadIds.join(',')})`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: projectIds.length > 0,
  });

  const isLoading = projectsLoading || docsLoading;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentInfo = (type: string) => {
    return DOCUMENT_TYPE_INFO[type] || DOCUMENT_TYPE_INFO.other;
  };

  // Available document types for customer (predefined list)
  const customerDocTypes = [
    'quotation',
    'gst_invoice',
    'completion_report',
    'ceg_approval',
    'panel_details',
    'inverter_details'
  ];

  if (isLoading) {
    return (
      <AppLayout title="Documents">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Group documents by type
  const documentsByType = documents?.reduce((acc, doc) => {
    const type = doc.document_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  return (
    <AppLayout title="Documents">
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary-foreground/10">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Project Documents</h2>
                <p className="text-primary-foreground/80">
                  Access and download your project-related documents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Categories */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customerDocTypes.map((type) => {
            const info = getDocumentInfo(type);
            const Icon = info.icon;
            const typeDocs = documentsByType?.[type] || [];
            const hasDocuments = typeDocs.length > 0;

            return (
              <Card key={type} className={!hasDocuments ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{info.label}</CardTitle>
                        <CardDescription className="text-xs">{info.description}</CardDescription>
                      </div>
                    </div>
                    {hasDocuments && (
                      <Badge variant="secondary">{typeDocs.length}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {hasDocuments ? (
                    <div className="space-y-2">
                      {typeDocs.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(doc.created_at)} • {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Not available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* All Documents List */}
        {documents && documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Documents
              </CardTitle>
              <CardDescription>
                Complete list of all project documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.map((doc) => {
                  const info = getDocumentInfo(doc.document_type);
                  const Icon = info.icon;
                  
                  return (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{info.label}</Badge>
                            <span>{formatDate(doc.created_at)}</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!documents || documents.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">No documents yet</h3>
              <p className="text-sm text-muted-foreground">
                Project documents will appear here as they are uploaded
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
