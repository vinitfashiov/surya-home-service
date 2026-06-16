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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { phone, otp, full_name, role, company_name, city_id, address } = body;

    // Validate inputs
    const cleanPhone = phone?.toString().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!otp || otp.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the latest unverified OTP for this phone
    const { data: otpRecord, error: otpError } = await adminClient
      .from("otp_verifications")
      .select("*")
      .eq("phone", cleanPhone)
      .eq("otp", otp)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await adminClient
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Use phone as a fake email for Supabase Auth
    const fakeEmail = `${cleanPhone}@phone.surya.app`;

    // Check if user already exists
    const { data: listData } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    const existingUser = listData?.users?.find(
      (u) =>
        u.email === fakeEmail ||
        u.user_metadata?.phone === cleanPhone
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const assignedRole = role || "customer";
      const { data: newUserData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: fakeEmail,
          email_confirm: true,
          phone: `+91${cleanPhone}`,
          phone_confirm: true,
          user_metadata: {
            phone: cleanPhone,
            full_name: full_name || "",
            role: assignedRole,
          },
        });

      if (createError || !newUserData?.user) {
        console.error("Create user error:", createError);
        throw new Error("Failed to create user account");
      }

      userId = newUserData.user.id;

      // Assign role in user_roles table
      await adminClient.from("user_roles").insert({
        user_id: userId,
        role: assignedRole,
      });

      // If provider, create provider record
      if (assignedRole === "provider" && company_name) {
        await adminClient.from("providers").insert({
          user_id: userId,
          company_name,
          owner_name: full_name || "",
          email: fakeEmail,
          phone: cleanPhone,
          address: address || "",
          city_id: city_id || null,
          status: "pending",
        });
      }
    }

    // Generate a magic link to get a session token
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: fakeEmail,
        options: {
          redirectTo: `${req.headers.get("origin") || supabaseUrl}`,
        },
      });

    if (linkError || !linkData?.properties) {
      console.error("Generate link error:", linkError);
      throw new Error("Failed to generate authentication token");
    }

    return new Response(
      JSON.stringify({
        success: true,
        token_hash: linkData.properties.hashed_token,
        type: "email",
        is_new_user: !existingUser,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("verify-otp error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
