import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function ensureProviderProfile(
  adminClient: any,
  userId: string,
  phone: string,
  email: string,
  fallbackCompany: string,
  fallbackOwner: string,
  fallbackAddress: string,
  fallbackCityId: string | null
) {
  try {
    const { data: existingUserIdProfile } = await adminClient
      .from("providers")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingUserIdProfile) {
      return existingUserIdProfile;
    }

    const { data: existingPhoneOrEmailProfile } = await adminClient
      .from("providers")
      .select("id, status, user_id")
      .or(`phone.eq.${phone},email.eq.${email}`)
      .maybeSingle();

    if (existingPhoneOrEmailProfile) {
      if (existingPhoneOrEmailProfile.user_id !== userId) {
        const { data: updatedProfile, error: updateErr } = await adminClient
          .from("providers")
          .update({ user_id: userId })
          .eq("id", existingPhoneOrEmailProfile.id)
          .select("id, status")
          .single();
        if (!updateErr) {
          return updatedProfile;
        }
      } else {
        return existingPhoneOrEmailProfile;
      }
    }

    if (fallbackCompany) {
      const { data: newProfile, error: insertErr } = await adminClient
        .from("providers")
        .insert({
          user_id: userId,
          company_name: fallbackCompany,
          owner_name: fallbackOwner,
          email: email,
          phone: phone,
          address: fallbackAddress,
          city_id: fallbackCityId,
          status: "pending",
        })
        .select("id, status")
        .single();
      if (!insertErr) {
        return newProfile;
      }
    }
  } catch (e) {
    console.error("ensureProviderProfile error:", e);
  }
  return null;
}

async function ensureServicemanProfile(
  adminClient: any,
  userId: string,
  phone: string,
  email: string
) {
  try {
    const { data: existingUserIdProfile } = await adminClient
      .from("servicemen")
      .select("id, provider_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingUserIdProfile) {
      return existingUserIdProfile;
    }

    const { data: existingPhoneOrEmailProfile } = await adminClient
      .from("servicemen")
      .select("id, provider_id, user_id")
      .or(`phone.eq.${phone},email.eq.${email}`)
      .maybeSingle();

    if (existingPhoneOrEmailProfile) {
      if (existingPhoneOrEmailProfile.user_id !== userId) {
        const { data: updatedProfile, error: updateErr } = await adminClient
          .from("servicemen")
          .update({ user_id: userId })
          .eq("id", existingPhoneOrEmailProfile.id)
          .select("id, provider_id")
          .single();
        if (!updateErr) {
          const { data: roleData } = await adminClient
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "serviceman")
            .maybeSingle();
          if (!roleData) {
            await adminClient.from("user_roles").insert({
              user_id: userId,
              role: "serviceman",
            });
          }
          return updatedProfile;
        }
      } else {
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "serviceman")
          .maybeSingle();
        if (!roleData) {
          await adminClient.from("user_roles").insert({
            user_id: userId,
            role: "serviceman",
          });
        }
        return existingPhoneOrEmailProfile;
      }
    }
  } catch (e) {
    console.error("ensureServicemanProfile error:", e);
  }
  return null;
}

const MAX_VERIFY_ATTEMPTS = 5;
// Roles a user may pick for themselves at signup; admin/serviceman are granted elsewhere
const SELF_ASSIGNABLE_ROLES = ["customer", "provider"];

async function findUser(adminClient: any, email: string, phone: string) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    const users = data?.users ?? [];
    const match = users.find(
      (u: any) => u.email === email || u.user_metadata?.phone === phone
    );
    if (match) return match;
    if (users.length < 1000) break;
  }
  return undefined;
}

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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!otp || otp.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only the latest unexpired OTP for this phone is valid
    const { data: otpRecord, error: otpError } = await adminClient
      .from("otp_verifications")
      .select("*")
      .eq("phone", cleanPhone)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP. Please request a new one." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const attempts = otpRecord.attempts ?? 0;
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await adminClient
        .from("otp_verifications")
        .update({ expires_at: new Date().toISOString() })
        .eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "Too many wrong attempts. Please request a new OTP." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (otpRecord.otp !== otp.toString()) {
      await adminClient
        .from("otp_verifications")
        .update({ attempts: attempts + 1 })
        .eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "Incorrect OTP. Please check and try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    let existingUser = await findUser(adminClient, fakeEmail, cleanPhone);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      if (full_name) {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingUser.user_metadata,
            full_name: full_name,
          },
        });
      }

      if (role === "provider") {
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "provider")
          .maybeSingle();

        if (!roleData) {
          await adminClient.from("user_roles").insert({
            user_id: userId,
            role: "provider",
          });
        }

        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "customer");

        await ensureProviderProfile(
          adminClient,
          userId,
          cleanPhone,
          fakeEmail,
          company_name || "",
          full_name || existingUser.user_metadata?.full_name || "",
          address || "",
          city_id || null
        );
      } else {
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "provider")
          .maybeSingle();

        if (roleData) {
          await ensureProviderProfile(
            adminClient,
            userId,
            cleanPhone,
            fakeEmail,
            "",
            existingUser.user_metadata?.full_name || "",
            "",
            null
          );
        }
      }

      await ensureServicemanProfile(adminClient, userId, cleanPhone, fakeEmail);
    } else {
      // Create new user (DO NOT pass phone param to avoid phone provider validation issues)
      const assignedRole = SELF_ASSIGNABLE_ROLES.includes(role) ? role : "customer";
      const { data: newUserData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: fakeEmail,
          email_confirm: true,
          user_metadata: {
            phone: cleanPhone,
            full_name: full_name || "",
            role: assignedRole,
          },
        });

      if (createError) {
        console.warn("Create user failed, attempting lookup:", createError.message);
        // Retry listing users to find by email
        const fallbackUser = await findUser(adminClient, fakeEmail, cleanPhone);
        if (fallbackUser) {
          userId = fallbackUser.id;
        } else {
          return new Response(
            JSON.stringify({ error: createError.message || "Failed to create user account" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (newUserData?.user) {
        userId = newUserData.user.id;
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Assign role in user_roles table
      await adminClient.from("user_roles").insert({
        user_id: userId,
        role: assignedRole,
      });

      if (assignedRole === "provider") {
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "customer");

        await ensureProviderProfile(
          adminClient,
          userId,
          cleanPhone,
          fakeEmail,
          company_name || "",
          full_name || "",
          address || "",
          city_id || null
        );
      }

      await ensureServicemanProfile(adminClient, userId, cleanPhone, fakeEmail);
    }

    // Older accounts may use a different email than fakeEmail — sign in with the account's own email
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
    const loginEmail = authUser?.user?.email || fakeEmail;

    // Generate magic link token hash
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: loginEmail,
        options: {
          redirectTo: `${req.headers.get("origin") || supabaseUrl}`,
        },
      });

    if (linkError || !linkData?.properties) {
      console.error("Generate link error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError?.message || "Failed to generate authentication token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        token_hash: linkData.properties.hashed_token,
        type: "email",
        is_new_user: !existingUser,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("verify-otp error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
