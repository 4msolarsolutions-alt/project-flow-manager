import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, MoreHorizontal, FileText, FileImage, File, Download, Eye, Trash2 } from "lucide-react";

const documentsData = [
  {
    id: 1,
    name: "Site_Assessment_GreenValley.pdf",
    project: "Green Valley Apartments",
    type: "Site Assessment",
    size: "2.4 MB",
    uploadedBy: "Rahul Kumar",
    uploadedAt: "Jan 28, 2025",
    fileType: "pdf",
  },
  {
    id: 2,
    name: "Quotation_TechPark_v2.pdf",
    project: "Tech Park Phase 2",
    type: "Quotation",
    size: "1.8 MB",
    uploadedBy: "Priya Sharma",
    uploadedAt: "Jan 27, 2025",
    fileType: "pdf",
  },
  {
    id: 3,
    name: "SLD_IndustrialComplex.dwg",
    project: "Industrial Complex B",
    type: "SLD/Drawing",
    size: "5.2 MB",
    uploadedBy: "Vikram Singh",
    uploadedAt: "Jan 25, 2025",
    fileType: "file",
  },
  {
    id: 4,
    name: "Installation_Photos_Day5.zip",
    project: "Sharma Residence",
    type: "Installation Photos",
    size: "45.6 MB",
    uploadedBy: "Rohit Mehta",
    uploadedAt: "Jan 24, 2025",
    fileType: "image",
  },
  {
    id: 5,
    name: "Subsidy_Application_CityMall.pdf",
    project: "City Mall Rooftop",
    type: "Subsidy Documents",
    size: "3.1 MB",
    uploadedBy: "Ananya Gupta",
    uploadedAt: "Jan 20, 2025",
    fileType: "pdf",
  },
  {
    id: 6,
    name: "Completion_Certificate.pdf",
    project: "City Mall Rooftop",
    type: "Completion Certificate",
    size: "856 KB",
    uploadedBy: "Vikram Singh",
    uploadedAt: "Jan 18, 2025",
    fileType: "pdf",
  },
];

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "pdf":
      return <FileText className="h-8 w-8 text-destructive" />;
    case "image":
      return <FileImage className="h-8 w-8 text-success" />;
    default:
      return <File className="h-8 w-8 text-primary" />;
  }
};

const Documents = () => {
  return (
    <Layout title="Documents">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          {documentsData.length} documents
        </p>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documentsData.map((doc) => (
          <div
            key={doc.id}
            className="rounded-xl bg-card border border-border p-4 transition-all hover:shadow-md animate-fade-in"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                {getFileIcon(doc.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate" title={doc.name}>
                  {doc.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{doc.project}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{doc.type}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>By {doc.uploadedBy}</span>
              <span>{doc.uploadedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Documents;
