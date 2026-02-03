import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Calendar, User, Zap } from "lucide-react";

const projectsData = [
  {
    id: 1,
    name: "Green Valley Apartments",
    customer: "Green Valley Housing Society",
    type: "Commercial",
    capacity: "50 KW",
    status: "In Progress",
    progress: 75,
    pm: "Vikram Singh",
    startDate: "Dec 15, 2024",
    endDate: "Feb 15, 2025",
    team: 8,
  },
  {
    id: 2,
    name: "Tech Park Phase 2",
    customer: "TechPark Infra Pvt Ltd",
    type: "Commercial",
    capacity: "200 KW",
    status: "In Progress",
    progress: 45,
    pm: "Ananya Gupta",
    startDate: "Jan 1, 2025",
    endDate: "Mar 30, 2025",
    team: 15,
  },
  {
    id: 3,
    name: "Sharma Residence",
    customer: "Mr. Suresh Sharma",
    type: "Residential",
    capacity: "8 KW",
    status: "In Progress",
    progress: 90,
    pm: "Rohit Mehta",
    startDate: "Jan 20, 2025",
    endDate: "Feb 10, 2025",
    team: 4,
  },
  {
    id: 4,
    name: "Industrial Complex B",
    customer: "Kiran Industries",
    type: "Industrial",
    capacity: "500 KW",
    status: "Planning",
    progress: 20,
    pm: "Priya Sharma",
    startDate: "Feb 1, 2025",
    endDate: "Jun 15, 2025",
    team: 25,
  },
  {
    id: 5,
    name: "City Mall Rooftop",
    customer: "City Mall Management",
    type: "Commercial",
    capacity: "150 KW",
    status: "Completed",
    progress: 100,
    pm: "Vikram Singh",
    startDate: "Oct 1, 2024",
    endDate: "Jan 15, 2025",
    team: 12,
  },
  {
    id: 6,
    name: "Metro Station - Line 4",
    customer: "Metro Rail Corporation",
    type: "Government",
    capacity: "300 KW",
    status: "On Hold",
    progress: 35,
    pm: "Ananya Gupta",
    startDate: "Nov 15, 2024",
    endDate: "Apr 30, 2025",
    team: 20,
  },
];

const getStatusClass = (status: string) => {
  switch (status) {
    case "Planning":
      return "status-new";
    case "In Progress":
      return "status-in-progress";
    case "Completed":
      return "status-completed";
    case "On Hold":
      return "status-cancelled";
    default:
      return "status-new";
  }
};

const Projects = () => {
  return (
    <Layout title="Projects">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          {projectsData.length} projects total
        </p>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projectsData.map((project) => (
          <div
            key={project.id}
            className="rounded-xl bg-card border border-border p-6 transition-all duration-200 hover:shadow-md animate-fade-in"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{project.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{project.customer}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Edit Project</DropdownMenuItem>
                  <DropdownMenuItem>View Tasks</DropdownMenuItem>
                  <DropdownMenuItem>Daily Reports</DropdownMenuItem>
                  <DropdownMenuItem>Documents</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <span className={`status-badge ${getStatusClass(project.status)}`}>
                {project.status}
              </span>
              <span className="text-sm text-muted-foreground">{project.type}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>{project.capacity}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{project.team} members</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="mt-2 h-2" />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{project.startDate}</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{project.endDate}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {project.pm.charAt(0)}
              </div>
              <span className="text-sm text-muted-foreground">{project.pm}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Projects;
