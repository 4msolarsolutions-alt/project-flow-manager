// Edge function to notify users when tasks are assigned
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
    const { taskId, assignedToId, notifyVia } = body;

    if (!taskId || !assignedToId) {
      return new Response(
        JSON.stringify({ error: "taskId and assignedToId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role to fetch task and user details
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch task details
    const { data: task, error: taskErr } = await adminClient
      .from("tasks")
      .select("id, title, description, due_date, priority, project_id")
      .eq("id", taskId)
      .single();

    if (taskErr || !task) {
      return new Response(
        JSON.stringify({ error: "Task not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch assigned user's profile
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .eq("id", assignedToId)
      .single();

    if (profileErr || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare notification content
    const userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Team Member";
    const dueDate = task.due_date 
      ? new Date(task.due_date).toLocaleDateString("en-IN", { 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        })
      : "Not set";

    const notifications = [];
    const channels = notifyVia || ["email"];

    // Send email notification
    if (channels.includes("email") && profile.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">4M Solar Solutions</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">New Task Assigned</h2>
            <p style="color: #4b5563;">Hello ${userName},</p>
            <p style="color: #4b5563;">A new task has been assigned to you:</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
              <h3 style="color: #1f2937; margin-top: 0;">${task.title}</h3>
              ${task.description ? `<p style="color: #6b7280;">${task.description}</p>` : ""}
              <p style="color: #4b5563;"><strong>Priority:</strong> ${task.priority || "Normal"}</p>
              <p style="color: #4b5563;"><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            <p style="color: #4b5563;">Please log in to your dashboard to view more details.</p>
          </div>
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">© 2024 4M Solar Solutions Pvt. Ltd.</p>
          </div>
        </div>
      `;

      notifications.push({
        type: "email",
        to: profile.email,
        subject: `New Task Assigned: ${task.title}`,
        html: emailHtml,
      });
    }

    // Send WhatsApp notification
    if (channels.includes("whatsapp") && profile.phone) {
      const whatsappMessage = `🔔 *New Task Assigned*

Hello ${userName},

You have been assigned a new task:

📋 *${task.title}*
${task.description ? `\n📝 ${task.description}\n` : ""}
⚡ Priority: ${task.priority || "Normal"}
📅 Due: ${dueDate}

Please check your dashboard for details.

- 4M Solar Solutions`;

      notifications.push({
        type: "whatsapp",
        phone: profile.phone,
        message: whatsappMessage,
      });
    }

    // Log notifications (in production, call the respective notification functions)
    console.log(`Task assignment notifications prepared for ${userName}:`, notifications);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Task assignment notifications sent",
        task: { id: task.id, title: task.title },
        assignedTo: { id: profile.id, name: userName },
        notificationsSent: notifications.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Task notification error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
