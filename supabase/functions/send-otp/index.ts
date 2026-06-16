import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
    if (!FAST2SMS_API_KEY) {
      throw new Error("Fast2SMS API key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone } = await req.json();

    // Validate phone number
    const cleanPhone = phone?.toString().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid 10-digit mobile number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting — max 3 OTPs per phone per 15 minutes
    const { count } = await supabase
      .from("otp_verifications")
      .select("*", { count: "exact", head: true })
      .eq("phone", cleanPhone)
      .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again after 15 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    // Store OTP in DB
    const { error: dbError } = await supabase.from("otp_verifications").insert({
      phone: cleanPhone,
      otp,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to store OTP");
    }

    // Send OTP via Fast2SMS
    const smsPayload = {
      sender_id: "BBTPLE",
      message: "180929",
      variables_values: otp,
      route: "dlt",
      numbers: cleanPhone,
    };

    const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: FAST2SMS_API_KEY,
        accept: "*/*",
        "cache-control": "no-cache",
        "content-type": "application/json",
      },
      body: JSON.stringify(smsPayload),
    });

    const smsData = await smsResponse.json();
    console.log("Fast2SMS response:", smsData);

    if (!smsResponse.ok || smsData.return === false) {
      // Delete the stored OTP if SMS failed
      await supabase.from("otp_verifications").delete().eq("phone", cleanPhone).eq("otp", otp);
      throw new Error("Failed to send OTP via SMS. Please try again.");
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("send-otp error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
