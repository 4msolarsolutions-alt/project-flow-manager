import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Navigation, Building2, Ruler, Cable, Zap, 
  MessageSquare, User, Camera, Loader2, Upload, X, CheckCircle2, ChevronLeft, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast.ts";
import { useAuth } from "@/hooks/useAuth";

export function SiteVisitForm({ 
  isOpen, 
  onClose, 
  leadId, 
  leadName, 
  leadAddress,
  onComplete 
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    eb_service_no: "",
    building_type: null,
    floors: 1,
    panel_loading: null,
    roof_length: 0,
    roof_width: 0,
    inverter_location: "",
    dc_length: 0,
    ac_length: 0,
    earth_length: 0,
    earth_location: "",
    la_point: false,
    la_location: "",
    breaker_location: "",
    structure_material: null,
    structure_height: 0,
    customer_feedback: "",
    supervisor_name: "",
    customer_approval_panel: false,
    customer_approval_inverter: false,
    customer_approval_cable: false,
    customer_approval_breaker: false,
    recommended_capacity: 0,
  });

  const captureGPS = () => {
    setIsCapturingGPS(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
          setIsCapturingGPS(false);
          toast({
            title: "GPS Captured",
            description: "Location coordinates have been recorded.",
          });
        },
        (error) => {
          setIsCapturingGPS(false);
          toast({
            title: "GPS Error",
            description: "Unable to capture location. Please enter manually.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsCapturingGPS(false);
      toast({
        title: "GPS Not Available",
        description: "Your device does not support GPS. Please enter coordinates manually.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 10) {
      toast({
        title: "Too Many Photos",
        description: "Maximum 10 photos allowed.",
        variant: "destructive",
      });
      return;
    }
    
    setPhotos([...photos, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPhotoUrls([...photoUrls, ...newUrls]);
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(photoUrls[index]);
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    const uploadedUrls = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${leadId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('site-visits')
        .upload(fileName, photo);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('site-visits')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
    }
    
    return uploadedUrls;
  };

  const calculateRoofArea = () => {
    return formData.roof_length * formData.roof_width;
  };

  const handleSubmit = async () => {
    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "GPS Required",
        description: "Please capture or enter GPS coordinates.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.building_type) {
      toast({
        title: "Building Type Required",
        description: "Please select the building type.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.roof_length <= 0 || formData.roof_width <= 0) {
      toast({
        title: "Roof Dimensions Required",
        description: "Please enter valid roof dimensions.",
        variant: "destructive",
      });
      return;
    }
    
    if (photos.length < 3) {
      toast({
        title: "Photos Required",
        description: "Please upload at least 3 site photos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const uploadedPhotoUrls = await uploadPhotos();
      const roofArea = calculateRoofArea();
      
      const { error } = await supabase
        .from('site_visits')
        .insert({
          lead_id: leadId,
          engineer_id: user?.id,
          latitude: formData.latitude,
          longitude: formData.longitude,
          eb_service_no: formData.eb_service_no,
          building_type: formData.building_type,
          floors: formData.floors,
          panel_loading: formData.panel_loading,
          roof_length: formData.roof_length,
          roof_width: formData.roof_width,
          roof_area: roofArea,
          inverter_location: formData.inverter_location,
          dc_length: formData.dc_length,
          ac_length: formData.ac_length,
          earth_length: formData.earth_length,
          earth_location: formData.earth_location,
          la_point: formData.la_point,
          la_location: formData.la_location,
          breaker_location: formData.breaker_location,
          structure_material: formData.structure_material,
          structure_height: formData.structure_height,
          customer_feedback: formData.customer_feedback,
          supervisor_name: formData.supervisor_name,
          customer_approval_panel: formData.customer_approval_panel,
          customer_approval_inverter: formData.customer_approval_inverter,
          customer_approval_cable: formData.customer_approval_cable,
          customer_approval_breaker: formData.customer_approval_breaker,
          recommended_capacity: formData.recommended_capacity,
          site_photos: uploadedPhotoUrls,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      await supabase
        .from('leads')
        .update({ status: 'site_visit_completed' })
        .eq('id', leadId);
      
      toast({
        title: "Site Visit Completed",
        description: "The site visit checklist has been submitted successfully.",
      });
      
      onComplete();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit site visit.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: "Basic Info", icon: MapPin },
    { title: "Building", icon: Building2 },
    { title: "Electrical", icon: Cable },
    { title: "Structure", icon: Ruler },
    { title: "Feedback", icon: MessageSquare },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Solar Site Visit Checklist
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {leadName} - {leadAddress}
          </p>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index + 1)}
              className={`flex flex-col items-center gap-1 ${
                currentStep === index + 1 
                  ? 'text-primary' 
                  : currentStep > index + 1 
                    ? 'text-success' 
                    : 'text-muted-foreground'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep === index + 1 
                  ? 'border-primary bg-primary/10' 
                  : currentStep > index + 1 
                    ? 'border-success bg-success/10' 
                    : 'border-muted'
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{step.title}</span>
            </button>
          ))}
        </div>

        <Separator className="mb-6" />

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  GPS Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    onClick={captureGPS}
                    disabled={isCapturingGPS}
                    className="gap-2"
                  >
                    {isCapturingGPS ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    Capture GPS
                  </Button>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Latitude *</Label>
                      <Input
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="e.g., 28.613939"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude *</Label>
                      <Input
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="e.g., 77.209021"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>EB Service Number</Label>
                  <Input
                    value={formData.eb_service_no}
                    onChange={(e) => setFormData({ ...formData, eb_service_no: e.target.value })}
                    placeholder="Enter electricity board service number"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Site Photos (Min. 3 required)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Site photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add Photo</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {photos.length}/10 photos uploaded • At least 3 required
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Building Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Building Type *</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.building_type || ""}
                  onValueChange={(value) => setFormData({ ...formData, building_type: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="rcc_roof" id="rcc" />
                    <Label htmlFor="rcc" className="cursor-pointer flex-1">
                      <span className="font-medium">RCC Roof</span>
                      <p className="text-xs text-muted-foreground">Reinforced Cement Concrete</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="sheet_roof" id="sheet" />
                    <Label htmlFor="sheet" className="cursor-pointer flex-1">
                      <span className="font-medium">Sheet Roof</span>
                      <p className="text-xs text-muted-foreground">Metal / Asbestos Sheet</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Building Height</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Number of Floors</Label>
                  <Select
                    value={formData.floors.toString()}
                    onValueChange={(value) => setFormData({ ...formData, floors: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Floor' : 'Floors'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Panel Loading Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.panel_loading || ""}
                  onValueChange={(value) => setFormData({ ...formData, panel_loading: value })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="lift_available" id="lift" />
                    <Label htmlFor="lift" className="cursor-pointer">Lift Available</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="staircase_carry" id="stairs" />
                    <Label htmlFor="stairs" className="cursor-pointer">Staircase Carry</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="rope_handling" id="rope" />
                    <Label htmlFor="rope" className="cursor-pointer">Rope Handling</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Roof Dimensions (in meters) *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Length (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.roof_length || ""}
                      onChange={(e) => setFormData({ ...formData, roof_length: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 10.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Width (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.roof_width || ""}
                      onChange={(e) => setFormData({ ...formData, roof_width: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 8.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Area (sq.m)</Label>
                    <Input
                      value={calculateRoofArea().toFixed(2)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Electrical Layout */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Inverter Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.inverter_location}
                  onChange={(e) => setFormData({ ...formData, inverter_location: e.target.value })}
                  placeholder="Describe the proposed inverter location (e.g., Ground floor utility room, near main DB)"
                  rows={2}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cable className="h-4 w-4" />
                  Cable Route Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>DC Cable Length (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.dc_length || ""}
                      onChange={(e) => setFormData({ ...formData, dc_length: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>AC Cable Length (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.ac_length || ""}
                      onChange={(e) => setFormData({ ...formData, ac_length: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Earth Cable Length (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.earth_length || ""}
                      onChange={(e) => setFormData({ ...formData, earth_length: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Earthing & Lightning Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Earth Location</Label>
                  <Input
                    value={formData.earth_location}
                    onChange={(e) => setFormData({ ...formData, earth_location: e.target.value })}
                    placeholder="Describe earthing pit location"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="la_point"
                    checked={formData.la_point}
                    onCheckedChange={(checked) => setFormData({ ...formData, la_point: checked })}
                  />
                  <Label htmlFor="la_point">Lightning Arrester (LA) Point Required</Label>
                </div>
                
                {formData.la_point && (
                  <div className="space-y-2 ml-6">
                    <Label>LA Point Location</Label>
                    <Input
                      value={formData.la_location}
                      onChange={(e) => setFormData({ ...formData, la_location: e.target.value })}
                      placeholder="Describe LA point location"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Termination Breaker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Breaker Location</Label>
                  <Input
                    value={formData.breaker_location}
                    onChange={(e) => setFormData({ ...formData, breaker_location: e.target.value })}
                    placeholder="Describe breaker termination location"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Structure Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Structure Material</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.structure_material || ""}
                  onValueChange={(value) => setFormData({ ...formData, structure_material: value })}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="ms" id="ms" />
                    <Label htmlFor="ms" className="cursor-pointer">
                      <span className="font-medium">MS</span>
                      <p className="text-xs text-muted-foreground">Mild Steel</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="aluminium" id="aluminium" />
                    <Label htmlFor="aluminium" className="cursor-pointer">
                      <span className="font-medium">Aluminium</span>
                      <p className="text-xs text-muted-foreground">Lightweight</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="gi" id="gi" />
                    <Label htmlFor="gi" className="cursor-pointer">
                      <span className="font-medium">GI</span>
                      <p className="text-xs text-muted-foreground">Galvanized Iron</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Structure Height</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={formData.structure_height || ""}
                    onChange={(e) => setFormData({ ...formData, structure_height: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Standard heights: 500mm, 1000mm, 1500mm, 2000mm
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended System Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Capacity (KW)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.recommended_capacity || ""}
                    onChange={(e) => setFormData({ ...formData, recommended_capacity: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Based on roof area of {calculateRoofArea().toFixed(2)} sq.m
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Feedback & Approval */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Customer Feedback / Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.customer_feedback}
                  onChange={(e) => setFormData({ ...formData, customer_feedback: e.target.value })}
                  placeholder="Enter customer feedback, special requirements, or any remarks..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Approval (Settings Confirmation)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id="approval_panel"
                      checked={formData.customer_approval_panel}
                      onCheckedChange={(checked) => setFormData({ ...formData, customer_approval_panel: checked })}
                    />
                    <Label htmlFor="approval_panel">Panel Location - OK</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id="approval_inverter"
                      checked={formData.customer_approval_inverter}
                      onCheckedChange={(checked) => setFormData({ ...formData, customer_approval_inverter: checked })}
                    />
                    <Label htmlFor="approval_inverter">Inverter Location - OK</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id="approval_cable"
                      checked={formData.customer_approval_cable}
                      onCheckedChange={(checked) => setFormData({ ...formData, customer_approval_cable: checked })}
                    />
                    <Label htmlFor="approval_cable">Cable Route - OK</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id="approval_breaker"
                      checked={formData.customer_approval_breaker}
                      onCheckedChange={(checked) => setFormData({ ...formData, customer_approval_breaker: checked })}
                    />
                    <Label htmlFor="approval_breaker">Breaker Location - OK</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Site Supervisor Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Supervisor Name</Label>
                  <Input
                    value={formData.supervisor_name}
                    onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                    placeholder="Enter supervisor name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">GPS:</span>{" "}
                    <span className="font-medium">{formData.latitude}, {formData.longitude}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Building:</span>{" "}
                    <span className="font-medium capitalize">{formData.building_type?.replace('_', ' ')} - {formData.floors} floors</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Roof Area:</span>{" "}
                    <span className="font-medium">{calculateRoofArea().toFixed(2)} sq.m</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recommended:</span>{" "}
                    <span className="font-medium">{formData.recommended_capacity} KW</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Photos:</span>{" "}
                    <span className="font-medium">{photos.length} uploaded</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Structure:</span>{" "}
                    <span className="font-medium uppercase">{formData.structure_material}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {currentStep > 1 && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentStep < 5 ? (
              <Button 
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Site Visit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
