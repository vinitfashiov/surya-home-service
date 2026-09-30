import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Errors are returned with status 200 + { error } so supabase.functions.invoke
// surfaces the message to the UI instead of a generic non-2xx error.
const json = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const OTP_TTL_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_OTPS_PER_WINDOW = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
    if (!FAST2SMS_API_KEY) {
      console.error("FAST2SMS_API_KEY secret is not set");
      return json({ error: "OTP service is temporarily unavailable. Please try again later." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone } = await req.json();

    const cleanPhone = phone?.toString().replace(/\D/g, "");
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return json({ error: "Please enter a valid 10-digit mobile number" });
    }

    // Rate limiting per phone
    const { data: recent } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("phone", cleanPhone)
      .gte("created_at", new Date(Date.now() - RATE_WINDOW_MS).toISOString())
      .order("created_at", { ascending: false });

    if ((recent?.length ?? 0) >= MAX_OTPS_PER_WINDOW) {
      return json({ error: "Too many OTP requests. Please try again after 15 minutes." });
    }
    if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < RESEND_COOLDOWN_MS) {
      return json({ error: "Please wait 30 seconds before requesting another OTP." });
    }

    const otp = (100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)).toString();

    const { data: inserted, error: dbError } = await supabase
      .from("otp_verifications")
      .insert({
        phone: cleanPhone,
        otp,
        expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
        verified: false,
      })
      .select("id")
      .single();

    if (dbError || !inserted) {
      console.error("DB error:", dbError);
      return json({ error: "Could not generate OTP. Please try again." });
    }

    // Send OTP via Fast2SMS (DLT route)
    let smsOk = false;
    try {
      const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: FAST2SMS_API_KEY,
          accept: "*/*",
          "cache-control": "no-cache",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender_id: "BBTPLE",
          message: "180929",
          variables_values: otp,
          route: "dlt",
          numbers: cleanPhone,
        }),
      });

      const smsData = await smsResponse.json().catch(() => null);
      console.log("Fast2SMS response:", smsResponse.status, smsData);
      smsOk = smsResponse.ok && smsData?.return !== false;
    } catch (fetchErr) {
      console.error("Fast2SMS request failed:", fetchErr);
    }

    if (!smsOk) {
      // Don't leave a usable OTP behind that the user never received
      await supabase.from("otp_verifications").delete().eq("id", inserted.id);
      return json({ error: "Could not send OTP SMS right now. Please try again in a minute." });
    }

    return json({ success: true, message: "OTP sent successfully" });
  } catch (error: unknown) {
    console.error("send-otp error:", error);
    return json({ error: "Something went wrong. Please try again." });
  }
});
