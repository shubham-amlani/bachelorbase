import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("📥 Incoming request body:", body);
    const { action, phone, otp, userId } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- ACTION: SEND OTP ---
    if (action === "send") {
      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      console.log(`🔑 Generated OTP ${generatedOtp} for phone: ${phone}`);

      // 1. Store in DB
      const { error: dbError } = await supabaseAdmin
        .from("otp_requests")
        .upsert({
          phone_number: phone,
          otp_code: generatedOtp,
          created_at: new Date(),
        });

      if (dbError) {
        console.error("❌ Database Upsert Error:", dbError);
        throw new Error("Database error storing OTP: " + dbError.message);
      }
      console.log("💾 OTP successfully stored in database.");

      // 2. Call Twilio
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");

      console.log(
        "🔍 Checking Twilio Secrets -> SID exists:",
        !!twilioSid,
        "| Token exists:",
        !!twilioToken
      );

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

      const params = new URLSearchParams({
        To: `whatsapp:${phone}`,
        From: "whatsapp:+14155238886",
        Body: `Your verification code is ${generatedOtp}`,
      });

      const twilioRes = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${twilioSid}:${twilioToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      const twilioData = await twilioRes.json();
      console.log("📡 Twilio Response Status:", twilioRes.status);
      console.log("📡 Twilio Response Body:", twilioData);

      if (!twilioRes.ok) {
        throw new Error(
          twilioData.message || "Failed to send WhatsApp message via Twilio"
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ACTION: VERIFY OTP ---
    if (action === "verify") {
      console.log(`🔍 Verifying OTP for phone: ${phone}`);
      const { data, error: fetchErr } = await supabaseAdmin
        .from("otp_requests")
        .select("otp_code")
        .eq("phone_number", phone)
        .single();

      if (fetchErr || !data || data.otp_code !== otp) {
        console.error(
          "❌ OTP Mismatch or Not Found. DB Data:",
          data,
          "Error:",
          fetchErr
        );
        throw new Error("Invalid or expired code.");
      }

      const { error: updateErr } = await supabaseAdmin
        .from("users")
        .update({ phone_number: phone, is_phone_verified: true })
        .eq("id", userId);

      if (updateErr) {
        console.error("❌ Failed to update users table:", updateErr);
        throw new Error("Failed to update user record.");
      }

      await supabaseAdmin
        .from("otp_requests")
        .delete()
        .eq("phone_number", phone);
      console.log("✅ Phone verified and user updated successfully.");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action provided.");
  } catch (error) {
    console.error("🚨 EDGE FUNCTION CATCH ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
