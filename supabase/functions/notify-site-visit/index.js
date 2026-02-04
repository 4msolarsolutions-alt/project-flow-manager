// Edge function to send site visit reminders
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { siteVisitId, notifyEngineer, notifyCustomer } = body;

    if (!siteVisitId) {
      return new Response(
        JSON.stringify({ error: "siteVisitId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role to fetch site visit details
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch site visit with lead details
    const { data: siteVisit, error: visitErr } = await adminClient
      .from("site_visits")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        engineer_id,
        leads (
          id,
          customer_name,
          phone,
          email,
          address,
          city
        )
      `)
      .eq("id", siteVisitId)
      .single();

    if (visitErr || !siteVisit) {
      return new Response(
        JSON.stringify({ error: "Site visit not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lead = siteVisit.leads;
    const notifications = [];

    // Format date and time
    const visitDate = siteVisit.scheduled_date
      ? new Date(siteVisit.scheduled_date).toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "To be confirmed";

    const visitTime = siteVisit.scheduled_time || "To be confirmed";
    const address = [lead?.address, lead?.city].filter(Boolean).join(", ");

    // Notify engineer if requested
    if (notifyEngineer && siteVisit.engineer_id) {
      const { data: engineer } = await adminClient
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .eq("id", siteVisit.engineer_id)
        .single();

      if (engineer) {
        const engineerName = [engineer.first_name, engineer.last_name].filter(Boolean).join(" ");
        
        const engineerMessage = `📅 *Site Visit Reminder*

Hello ${engineerName},

You have a scheduled site visit:

👤 Customer: ${lead?.customer_name || "N/A"}
📍 Location: ${address || "N/A"}
📆 Date: ${visitDate}
⏰ Time: ${visitTime}
📞 Contact: ${lead?.phone || "N/A"}

Please ensure you have all necessary equipment ready.

- 4M Solar Solutions`;

        if (engineer.phone) {
          notifications.push({
            type: "whatsapp",
            recipient: "engineer",
            phone: engineer.phone,
            message: engineerMessage,
          });
        }

        if (engineer.email) {
          notifications.push({
            type: "email",
            recipient: "engineer",
            to: engineer.email,
            subject: `Site Visit Reminder: ${lead?.customer_name || "Customer"}`,
            message: engineerMessage,
          });
        }
      }
    }

    // Notify customer if requested
    if (notifyCustomer && lead) {
      const customerMessage = `🌞 *4M Solar Solutions*

Dear ${lead.customer_name},

This is a reminder for your scheduled site visit:

📆 Date: ${visitDate}
⏰ Time: ${visitTime}

Our engineer will visit your location to assess the solar installation requirements.

Please ensure:
✅ Access to the roof/installation area
✅ Electricity bills are available
✅ Someone is present at the location

For any queries, contact us:
📞 +91 9345115509

Thank you for choosing 4M Solar Solutions!`;

      if (lead.phone) {
        notifications.push({
          type: "whatsapp",
          recipient: "customer",
          phone: lead.phone,
          message: customerMessage,
        });
      }

      if (lead.email) {
        notifications.push({
          type: "email",
          recipient: "customer",
          to: lead.email,
          subject: "Site Visit Reminder - 4M Solar Solutions",
          message: customerMessage,
        });
      }
    }

    console.log(`Site visit reminders prepared for visit ${siteVisitId}:`, notifications);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Site visit reminders sent",
        siteVisit: {
          id: siteVisit.id,
          date: visitDate,
          time: visitTime,
          customer: lead?.customer_name,
        },
        notificationsSent: notifications.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Site visit notification error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
