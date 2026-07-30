import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Info,
  Star,
  ShieldCheck,
  Home,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      // Intercept unverified email attempt and resend the confirmation link automatically
      if (error.message.includes("Email not confirmed")) {
        await supabase.auth.resend({ type: "signup", email });
        showToast(
          "Email not verified. A new verification link has been sent to your inbox.",
          "error"
        );
      } else {
        showToast(error.message, "error");
      }
      return;
    }

    // Check the public.users table to see if they have completed phone verification
    const { data: profile } = await supabase
      .from("users")
      .select("is_phone_verified")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    const hasVerifiedPhone = profile?.is_phone_verified || !!data.user?.phone;

    if (!hasVerifiedPhone) {
      showToast(
        "Login successful! Note: Phone verification required for premium features.",
        "success"
      );
    } else {
      showToast("Login successful!", "success");
    }

    // Delay slightly so user can read the toast before redirecting
    setTimeout(() => {
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo");
      navigate(returnTo, { replace: true });
    }, 2500);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) showToast(error.message, "error");
  };

  return (
    <div className="w-full min-h-screen flex bg-mainBg font-sans relative">
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

      {/* ========================================= */}
      {/* LEFT COLUMN: Immersive Branding (Desktop) */}
      {/* ========================================= */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-center p-12">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
          alt="Premium Living"
          className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-[20s] hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>

        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Find your perfect space, without the broker hassle.
            </h2>
            <p className="text-gray-300 font-medium text-lg mt-2 leading-relaxed">
              Join a community of bachelors connecting directly with verified
              property owners across the city. Safe, secure, and entirely
              transparent.
            </p>
          </div>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#5B4EE4]" size={20} />
              <span className="text-white text-sm font-bold">
                100% Verified
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="text-[#5B4EE4]" size={20} />
              <span className="text-white text-sm font-bold">
                Zero Brokerage
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* RIGHT COLUMN: Minimalist Login Form       */}
      {/* ========================================= */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="lg:hidden absolute top-6 left-6">
          <Link
            to="/"
            className="text-primaryText font-black text-xl tracking-tight"
          >
            BachelorBase.
          </Link>
        </div>

        <div className="w-full max-w-[400px] flex flex-col mt-12 lg:mt-0">
          <div className="flex flex-col mb-8">
            <h1 className="text-3xl font-black text-primaryText tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm font-medium text-secondaryText">
              Enter your credentials to securely access your account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-surface border-2 border-cardBorder hover:border-gray-300 dark:hover:border-gray-600 text-primaryText font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm mb-6"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            Continue with Google
          </button>

          <div className="flex items-center mb-6 opacity-60">
            <div className="flex-grow border-t border-cardBorder"></div>
            <span className="px-4 text-[10px] uppercase tracking-widest font-black text-secondaryText">
              Or sign in with email
            </span>
            <div className="flex-grow border-t border-cardBorder"></div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="flex items-center bg-surface border-2 border-cardBorder rounded-xl px-4 py-3.5 focus-within:border-[#5B4EE4] transition-colors shadow-sm">
                <Mail size={18} className="text-tertiaryText mr-3 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-bold placeholder-tertiaryText"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] font-black text-[#5B4EE4] hover:underline uppercase tracking-widest"
                >
                  Forgot?
                </button>
              </div>
              <div className="flex items-center bg-surface border-2 border-cardBorder rounded-xl px-4 py-3.5 focus-within:border-[#5B4EE4] transition-colors shadow-sm">
                <Lock size={18} className="text-tertiaryText mr-3 shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-primaryText text-sm font-bold placeholder-tertiaryText"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white font-black py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Sign In"
              )}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-secondaryText mt-8">
            Don't have an account yet?{" "}
            <Link
              to="/register"
              className="font-black text-primaryText hover:text-[#5B4EE4] transition-colors border-b-2 border-transparent hover:border-[#5B4EE4] pb-0.5"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
