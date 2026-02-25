import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_MAPS_API_KEY = "AIzaSyBdAjpPwn-S1QzJ1nQGsiCSbNXelewGPRE";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, requiredQuality } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try quality levels in order: HIGH -> MEDIUM -> LOW
    const qualities = requiredQuality ? [requiredQuality] : ["HIGH", "MEDIUM", "LOW"];
    let data: any = null;
    let lastError: any = null;

    for (const quality of qualities) {
      const buildingUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&requiredQuality=${quality}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(buildingUrl);
      data = await response.json();

      if (response.ok) {
        break;
      }

      console.log(`Solar API ${quality} quality failed:`, data.error?.message);
      lastError = data;
      data = null;
    }

    if (!data) {
      const msg = lastError?.error?.message || "No solar data available for this location. Try a different address with visible rooftops.";
      console.error("Solar API error: all quality levels failed");
      return new Response(
        JSON.stringify({ error: msg, status: 404 }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
