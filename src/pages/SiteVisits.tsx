import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Building, CheckCircle2, Clock } from "lucide-react";

const siteVisitsData = [
  {
    id: 1,
    lead: "Rajesh Kumar",
    address: "Sector 15, Noida, UP",
    engineer: "Rahul Kumar",
    scheduledDate: "Feb 3, 2025",
    scheduledTime: "10:00 AM",
    status: "Scheduled",
    buildingType: "Residential",
    floors: 2,
  },
  {
    id: 2,
    lead: "Priya Sharma",
    address: "DLF Phase 3, Gurugram, HR",
    engineer: "Vikram Singh",
    scheduledDate: "Feb 3, 2025",
    scheduledTime: "2:00 PM",
    status: "Scheduled",
    buildingType: "Commercial",
    floors: 4,
  },
  {
    id: 3,
    lead: "Amit Patel",
    address: "Vashi, Navi Mumbai, MH",
    engineer: "Ananya Gupta",
    completedDate: "Jan 28, 2025",
    status: "Completed",
    buildingType: "Industrial",
    floors: 1,
    roofArea: "5000 sqft",
    panelCapacity: "100 KW",
  },
  {
    id: 4,
    lead: "Sunita Verma",
    address: "Whitefield, Bangalore, KA",
    engineer: "Rohit Mehta",
    completedDate: "Jan 25, 2025",
    status: "Completed",
    buildingType: "Residential",
    floors: 3,
    roofArea: "1200 sqft",
    panelCapacity: "10 KW",
  },
  {
    id: 5,
    lead: "Kiran Industries",
    address: "MIDC, Pune, MH",
    engineer: "Vikram Singh",
    completedDate: "Jan 22, 2025",
    status: "Completed",
    buildingType: "Industrial",
    floors: 2,
    roofArea: "25000 sqft",
    panelCapacity: "250 KW",
  },
];

const SiteVisits = () => {
  const scheduled = siteVisitsData.filter((v) => v.status === "Scheduled");
  const completed = siteVisitsData.filter((v) => v.status === "Completed");

  return (
    <Layout title="Site Visits">
      {/* Scheduled Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Scheduled Visits</h2>
          <Button className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Visit
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {scheduled.map((visit) => (
            <div
              key={visit.id}
              className="rounded-xl bg-card border border-border p-6 animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{visit.lead}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {visit.address}
                  </p>
                </div>
                <span className="status-badge status-in-progress">
                  <Clock className="mr-1 h-3 w-3" />
                  Scheduled
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{visit.scheduledDate}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{visit.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{visit.engineer}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{visit.buildingType}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Reschedule
                </Button>
                <Button size="sm" className="flex-1">
                  Start Visit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Completed Visits</h2>
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Location</th>
                <th>Engineer</th>
                <th>Building Type</th>
                <th>Roof Area</th>
                <th>Recommended</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((visit) => (
                <tr key={visit.id}>
                  <td className="font-medium text-foreground">{visit.lead}</td>
                  <td className="text-muted-foreground">{visit.address}</td>
                  <td className="text-muted-foreground">{visit.engineer}</td>
                  <td>{visit.buildingType}</td>
                  <td>{visit.roofArea}</td>
                  <td className="font-medium">{visit.panelCapacity}</td>
                  <td>
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      {visit.completedDate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default SiteVisits;
