import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { GoogleLogin } from "@react-oauth/google";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // Sync Google Button theme with Tailwind Dark Mode
  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark");
    setIsDark(checkDark());

    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    let formattedPhone = formData.phone;

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone_number: formattedPhone,
        },
      },
    });

    if (data?.user) {
      await supabase
        .from("users")
        .update({ is_phone_verified: true })
        .eq("id", data.user.id);
    }

    setLoading(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(
        "Account created! Check your email to verify your account.",
        "success"
      );
      setTimeout(() => {
        navigate(`/login`);
      }, 3000);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credentialResponse.credential,
    });

    setLoading(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Account securely connected via Google!", "success");
      setTimeout(() => navigate(`/login`), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen flex bg-mainBg font-sans relative selection:bg-[#5B4EE4] selection:text-white">
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

      {/* LEFT COLUMN: Premium Form */}
      <div className="w-full lg:w-[55%] xl:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Form Container */}
        <div className="w-full max-w-[400px] flex flex-col my-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col mb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-primaryText tracking-tight mb-2">
              Create Account
            </h1>
            <p className="text-sm font-medium text-secondaryText">
              Join the ecosystem to save properties and find flatmates.
            </p>
          </div>

          {/* Official Google Login Component - Safe Auto Width */}
          <div className="flex justify-center mb-6">
            <div className="rounded-md transition-shadow hover:shadow-md bg-white dark:bg-[#131314]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => showToast("Google Registration Failed", "error")}
                theme={isDark ? "filled_black" : "outline"}
                size="large"
                shape="rectangular"
                text="signup_with"
              />
            </div>
          </div>

          <div className="flex items-center mb-6 opacity-60">
            <div className="flex-grow border-t border-cardBorder"></div>
            <span className="px-4 text-[10px] uppercase tracking-widest font-black text-secondaryText">
              Or register with email
            </span>
            <div className="flex-grow border-t border-cardBorder"></div>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="group flex items-center bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 focus-within:border-[#5B4EE4] focus-within:ring-4 focus-within:ring-[#5B4EE4]/10 transition-all shadow-sm">
                <User
                  size={18}
                  className="text-tertiaryText mr-3 shrink-0 group-focus-within:text-[#5B4EE4] transition-colors"
                />
                <input
                  type="text"
                  required
                  placeholder="Shubham Amlani"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-bold placeholder-tertiaryText [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="group flex items-center bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 focus-within:border-[#5B4EE4] focus-within:ring-4 focus-within:ring-[#5B4EE4]/10 transition-all shadow-sm">
                  <Mail
                    size={18}
                    className="text-tertiaryText mr-3 shrink-0 group-focus-within:text-[#5B4EE4] transition-colors"
                  />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-bold placeholder-tertiaryText [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <div className="group flex items-center bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 focus-within:border-[#5B4EE4] focus-within:ring-4 focus-within:ring-[#5B4EE4]/10 transition-all shadow-sm">
                  <Phone
                    size={18}
                    className="text-tertiaryText mr-3 shrink-0 group-focus-within:text-[#5B4EE4] transition-colors"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-bold placeholder-tertiaryText [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest ml-1">
                Create a Password
              </label>
              <div className="group flex items-center bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 focus-within:border-[#5B4EE4] focus-within:ring-4 focus-within:ring-[#5B4EE4]/10 transition-all shadow-sm">
                <Lock
                  size={18}
                  className="text-tertiaryText mr-3 shrink-0 group-focus-within:text-[#5B4EE4] transition-colors"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-bold placeholder-tertiaryText [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-tertiaryText hover:text-primaryText transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-4 w-full bg-gradient-to-r from-[#5B4EE4] to-[#7E73ED] text-white font-black py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm shadow-[0_8px_25px_-8px_rgba(91,78,228,0.5)] hover:shadow-[0_12px_30px_-8px_rgba(91,78,228,0.7)] disabled:opacity-70 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Create Account"
              )}
              {!loading && (
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-secondaryText mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-black text-primaryText hover:text-[#5B4EE4] transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Immersive Branding (Reversed for Register) */}
      <div className="hidden lg:flex w-[45%] xl:w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-center p-12 xl:p-20">
        <img
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
          alt="Premium Living Space"
          className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-[30s] hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-[#09090b]/90 to-transparent"></div>

        <div className="relative z-10 flex flex-col gap-6 max-w-lg my-auto ml-auto text-right">
          <div className="w-12 h-1.5 bg-[#5B4EE4] rounded-full mb-2 ml-auto"></div>
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight">
            Elevate your living experience today.
          </h2>
          <p className="text-zinc-300 font-medium text-base md:text-lg mt-2 leading-relaxed">
            Create an account to securely save favorite properties, review
            flatmate matches, and access verified listings instantly.
          </p>

          <div className="flex items-center justify-end gap-6 mt-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold tracking-wide">
                Privacy Protected
              </span>
              <ShieldCheck className="text-[#5B4EE4]" size={24} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold tracking-wide">
                Instant Access
              </span>
              <CheckCircle2 className="text-[#5B4EE4]" size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
