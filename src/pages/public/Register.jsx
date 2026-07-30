import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Format phone to E.164 standard required by Supabase/Twilio
    const formattedPhone = formData.phone.startsWith("+")
      ? formData.phone
      : `+91${formData.phone}`;

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone_number: formattedPhone, // Supabase Trigger puts this in public.users
        },
      },
    });

    setLoading(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      // Architecture Sync: Inform the user of the progressive flow
      showToast(
        "Account created! Check your email to verify. Phone verification will follow.",
        "success"
      );
      setTimeout(() => {
        navigate(`/login`);
      }, 3000);
    }
  };

  const handleGoogleRegister = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) showToast(error.message, "error");
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center bg-mainBg py-12 sm:py-16 relative">
      {/* Funky Animated Pill Toast */}
      {toast && (
        <div
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] border shadow-2xl px-6 py-3.5 rounded-full flex items-center gap-2.5 max-w-[90vw] whitespace-nowrap overflow-hidden text-ellipsis animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out ${
            toast.type === "error"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-600"
          }`}
        >
          <Info size={18} className="shrink-0" />
          <span className="text-sm font-black tracking-wide truncate">
            {toast.msg}
          </span>
        </div>
      )}

      {/* Box Container */}
      <div className="w-full sm:max-w-[480px] bg-surface sm:border border-cardBorder sm:rounded-2xl sm:shadow-sm p-6 sm:p-8 flex flex-col">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-primaryText tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-secondaryText mt-1.5">
            Enter your details below to get started.
          </p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          className="w-full flex items-center justify-center gap-2.5 bg-surface border border-cardBorder hover:bg-mainBg text-primaryText font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm mb-6"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign up with Google
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-grow border-t border-cardBorder"></div>
          <span className="px-3 text-xs uppercase tracking-wider font-bold text-tertiaryText">
            Or register with email
          </span>
          <div className="flex-grow border-t border-cardBorder"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-secondaryText uppercase tracking-wider">
              Full Name
            </label>
            <div className="flex items-center bg-mainBg border border-cardBorder rounded-xl px-3.5 py-2.5 focus-within:border-accentBlue focus-within:ring-1 focus-within:ring-accentBlue/30 transition-all">
              <User size={16} className="text-tertiaryText mr-2.5 shrink-0" />
              <input
                type="text"
                required
                placeholder="Shubham Amlani"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-medium placeholder-tertiaryText"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-secondaryText uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex items-center bg-mainBg border border-cardBorder rounded-xl px-3.5 py-2.5 focus-within:border-accentBlue focus-within:ring-1 focus-within:ring-accentBlue/30 transition-all">
                <Mail size={16} className="text-tertiaryText mr-2.5 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-medium placeholder-tertiaryText"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-secondaryText uppercase tracking-wider">
                Phone Number
              </label>
              <div className="flex items-center bg-mainBg border border-cardBorder rounded-xl px-3.5 py-2.5 focus-within:border-accentBlue focus-within:ring-1 focus-within:ring-accentBlue/30 transition-all">
                <Phone
                  size={16}
                  className="text-tertiaryText mr-2.5 shrink-0"
                />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-medium placeholder-tertiaryText"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-secondaryText uppercase tracking-wider">
              Create a password
            </label>
            <div className="flex items-center bg-mainBg border border-cardBorder rounded-xl px-3.5 py-2.5 focus-within:border-accentBlue focus-within:ring-1 focus-within:ring-accentBlue/30 transition-all">
              <Lock size={16} className="text-tertiaryText mr-2.5 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-medium placeholder-tertiaryText"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-accentBlue text-white font-semibold py-3 rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Create Account"
            )}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-center text-sm text-secondaryText mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primaryText hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
