import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Phone, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function PhoneVerificationModal({ isOpen, onClose, onSuccess }) {
  // Hardcoded to step 1 since we are bypassing OTP
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  // const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  // const OTP_LENGTH = 6;

  useEffect(() => {
    if (isOpen && step === 2) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  // --- NEW: BYPASS OTP LOGIC ---
  // Simply save the phone number to the user profile and mark as verified
  const handleSavePhone = async (e) => {
    e.preventDefault();
    setError(null);
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit number.");
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith("+") ? phone : `${phone}`;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("User session not found.");

      const { error: dbError } = await supabase
        .from("users")
        .update({
          phone_number: formattedPhone,
          is_phone_verified: true,
        })
        .eq("id", session.user.id);

      if (dbError) throw dbError;

      onSuccess(); // Close modal and execute the original blocked action

      /* 
      // ==========================================
      // RESTORE THIS BLOCK TO RE-ENABLE TWILIO OTP
      // ==========================================
      const { data, error: invokeErr } = await supabase.functions.invoke(
        "whatsapp-otp",
        {
          body: { action: "send", phone: formattedPhone },
        }
      );

      if (invokeErr || data?.error) {
        throw new Error(data?.error || invokeErr?.message || "Failed to send code");
      }

      setStep(2);
      // ==========================================
      */
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* 
  // ==========================================
  // RESTORE THIS BLOCK TO RE-ENABLE TWILIO OTP
  // ==========================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== OTP_LENGTH) return;

    setLoading(true);
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User session not found.");

      const { data, error: invokeErr } = await supabase.functions.invoke(
        "whatsapp-otp",
        {
          body: {
            action: "verify",
            phone: formattedPhone,
            otp: otp,
            userId: session.user.id,
          },
        }
      );

      if (invokeErr || data?.error) {
        throw new Error(
          data?.error || invokeErr?.message || "Invalid or expired code."
        );
      }

      onSuccess(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // ==========================================
  */

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Heavy Blur Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-[420px] bg-[#fbfbfd] dark:bg-[#1d1d1f] rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <X size={18} className="text-gray-600 dark:text-gray-300" />
        </button>

        <div className="p-8 sm:p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#5B4EE4]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#5B4EE4]/20 shadow-sm">
            {step === 1 ? (
              <ShieldCheck size={28} className="text-[#5B4EE4]" />
            ) : (
              <CheckCircle2 size={28} className="text-[#5B4EE4]" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-2">
            {step === 1 ? "Complete your profile" : "Enter secure code"}
          </h2>
          <p className="text-[15px] font-medium text-[#86868b] leading-relaxed mb-8">
            {step === 1
              ? "To connect with property owners safely, please provide your WhatsApp number."
              : `We sent a code to ${phone}`}
          </p>

          {error && (
            <div className="w-full p-3 mb-6 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl text-left">
              {error}
            </div>
          )}

          {step === 1 && (
            <form
              onSubmit={handleSavePhone}
              className="w-full flex flex-col gap-4"
            >
              <div className="flex items-center bg-white dark:bg-black/20 border-2 border-gray-200 dark:border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#5B4EE4] dark:focus-within:border-[#5B4EE4] transition-colors shadow-sm">
                <Phone size={20} className="text-gray-400 mr-3 shrink-0" />
                <span className="text-[#1d1d1f] dark:text-white font-bold mr-2">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="w-full bg-transparent border-none outline-none text-[#1d1d1f] dark:text-white text-[17px] font-bold placeholder-gray-300 dark:placeholder-gray-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="mt-2 w-full bg-[#1d1d1f] dark:bg-white text-white dark:text-black hover:opacity-80 font-semibold py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[15px] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Save & Continue"
                )}
              </button>
            </form>
          )}

          {/* 
          // ==========================================
          // RESTORE THIS BLOCK TO RE-ENABLE TWILIO OTP
          // ==========================================
          {step === 2 && (
            <form
              onSubmit={handleVerifyOTP}
              className="w-full flex flex-col gap-8"
            >
              <div
                className="relative w-full h-14 sm:h-16 flex justify-between cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text"
                />
                {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                  const isActive = otp.length === index;
                  const isFilled = otp.length > index;
                  return (
                    <div
                      key={index}
                      className={`flex-1 mx-1 h-full flex items-center justify-center rounded-xl text-2xl font-bold transition-all duration-200 
                        ${
                          isActive
                            ? "border-2 border-[#5B4EE4] bg-white dark:bg-[#1d1d1f] shadow-[0_0_0_4px_rgba(91,78,228,0.1)]"
                            : isFilled
                            ? "border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-[#1d1d1f] dark:text-white"
                            : "border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20 text-transparent"
                        }`}
                    >
                      {otp[index] || ""}
                      {isActive && (
                        <div className="w-[2px] h-6 bg-[#5B4EE4] animate-pulse rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== OTP_LENGTH}
                className="w-full bg-[#1d1d1f] dark:bg-white text-white dark:text-black hover:opacity-80 font-semibold py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[15px] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Verify & Complete"
                )}
              </button>
            </form>
          )}
          // ==========================================
          */}
        </div>
      </div>
    </div>
  );
}
