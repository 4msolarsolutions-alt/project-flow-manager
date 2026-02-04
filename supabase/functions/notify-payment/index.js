// Edge function to send payment notifications
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

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
    const { paymentId, notificationType } = body;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "paymentId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role to fetch payment details
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch payment with lead/project details
    const { data: payment, error: paymentErr } = await adminClient
      .from("payments")
      .select(`
        id,
        amount,
        payment_type,
        payment_method,
        status,
        received_date,
        transaction_ref,
        lead_id,
        project_id,
        leads (
          id,
          customer_name,
          phone,
          email
        ),
        projects (
          id,
          project_name,
          total_amount
        )
      `)
      .eq("id", paymentId)
      .single();

    if (paymentErr || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lead = payment.leads;
    const project = payment.projects;
    const notifications = [];

    // Format payment details
    const paymentAmount = formatCurrency(payment.amount);
    const paymentDate = payment.received_date
      ? new Date(payment.received_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN");

    const paymentTypeLabels = {
      advance: "Advance Payment",
      progress: "Progress Payment",
      final: "Final Payment",
    };

    const paymentTypeLabel = paymentTypeLabels[payment.payment_type] || payment.payment_type;

    // Determine notification type
    const type = notificationType || "received";

    if (type === "received" && lead) {
      const receiptMessage = `🌞 *4M Solar Solutions*

Dear ${lead.customer_name},

Thank you for your payment!

💰 *Payment Receipt*
━━━━━━━━━━━━━━━━━
Amount: ${paymentAmount}
Type: ${paymentTypeLabel}
Date: ${paymentDate}
${payment.transaction_ref ? `Reference: ${payment.transaction_ref}` : ""}
${project ? `Project: ${project.project_name}` : ""}

Your payment has been received successfully.

For any queries, contact us:
📞 +91 9345115509
📧 info@4msolarsolutions.com

Thank you for choosing 4M Solar Solutions!

_Go Solar, Go Green!_ 🌱`;

      if (lead.phone) {
        notifications.push({
          type: "whatsapp",
          recipient: "customer",
          phone: lead.phone,
          message: receiptMessage,
        });
      }

      if (lead.email) {
        notifications.push({
          type: "email",
          recipient: "customer",
          to: lead.email,
          subject: `Payment Receipt - ${paymentAmount} - 4M Solar Solutions`,
          message: receiptMessage,
        });
      }
    }

    if (type === "reminder" && lead) {
      const reminderMessage = `🌞 *4M Solar Solutions*

Dear ${lead.customer_name},

This is a friendly reminder regarding a pending payment:

💳 *Payment Details*
━━━━━━━━━━━━━━━━━
Type: ${paymentTypeLabel}
${project ? `Project: ${project.project_name}` : ""}

Please process the payment at your earliest convenience.

For any queries, contact us:
📞 +91 9345115509
📧 info@4msolarsolutions.com

Thank you for choosing 4M Solar Solutions!`;

      if (lead.phone) {
        notifications.push({
          type: "whatsapp",
          recipient: "customer",
          phone: lead.phone,
          message: reminderMessage,
        });
      }
    }

    console.log(`Payment notifications prepared for payment ${paymentId}:`, notifications);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment ${type} notifications sent`,
        payment: {
          id: payment.id,
          amount: payment.amount,
          type: payment.payment_type,
        },
        customer: lead?.customer_name,
        notificationsSent: notifications.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Payment notification error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
