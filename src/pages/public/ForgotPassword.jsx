import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();  
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/update-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] bg-mainBg flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-[420px] bg-surface border border-cardBorder rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-[#5B4EE4]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#5B4EE4]/20 shadow-sm">
            <Mail size={24} className="text-[#5B4EE4]" />
          </div>
          <h1 className="text-2xl font-black text-primaryText tracking-tight mb-2">
            Reset Password
          </h1>
          <p className="text-sm font-medium text-secondaryText">
            Enter your email address and we'll send you a secure link to reset
            your password.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold mb-6 text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mb-3" />
            <span className="text-sm font-black text-emerald-800">
              Reset Link Sent!
            </span>
            <span className="text-xs font-medium text-emerald-600 mt-1">
              Check your inbox and spam folder for the secure reset link.
            </span>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest pl-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full bg-mainBg border border-cardBorder rounded-xl p-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Send Reset Link <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-cardBorder pt-6">
          <Link
            to="/login"
            className="text-sm font-bold text-secondaryText hover:text-[#5B4EE4] transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
