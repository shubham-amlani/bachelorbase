import React, { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { QrCode, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function Scan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("scanning"); // scanning, loading, success, error
  const [message, setMessage] = useState("");
  const [claimData, setClaimData] = useState(null);

  // Ensure the user is logged in before allowing a scan
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { state: { returnTo: "/scan" } });
      } else {
        setUser(session.user);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleScan = async (result) => {
    if (!result || status !== "scanning") return;
    
    // Grab the actual string value from the scan result
    const qrHash = result[0]?.rawValue || result; 
    
    setStatus("loading");

    try {
      // 1. Verify the QR code hash matches an active listing
      const { data: listing, error: fetchError } = await supabase
        .from("pg_flat_listings")
        .select("id, title, discount_percentage, owner_name")
        .eq("qr_code_hash", qrHash)
        .single();

      if (fetchError || !listing) {
        throw new Error("Invalid or unrecognized QR Code.");
      }

      // 2. Check if the user already claimed a discount for this property
      const { data: existingClaim } = await supabase
        .from("discount_claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .single();

      if (existingClaim) {
        throw new Error("You have already claimed a discount for this property.");
      }

      // 3. Register the claim
      const { error: insertError } = await supabase
        .from("discount_claims")
        .insert({
          user_id: user.id,
          listing_id: listing.id,
          qr_reference: qrHash,
          discount_percentage: listing.discount_percentage,
          status: "pending" // Admin can auto-approve or review later
        });

      if (insertError) throw insertError;

      setClaimData(listing);
      setStatus("success");
      
    } catch (error) {
      setMessage(error.message || "Failed to process QR code.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-mainBg flex flex-col pt-4 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full border border-cardBorder shadow-sm">
          <ArrowLeft size={20} className="text-primaryText" />
        </button>
        <div>
          <h1 className="text-xl font-black text-primaryText leading-tight">Scan & Claim</h1>
          <p className="text-xs font-medium text-secondaryText">Scan the owner's QR code to verify your stay.</p>
        </div>
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        
        {status === "scanning" && (
          <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden border-2 border-[#5B4EE4] shadow-[0_10px_30px_rgba(91,78,228,0.2)] relative bg-black">
            <Scanner
              onScan={handleScan}
              onError={(error) => console.log(error?.message)}
              components={{
                audio: false,
                tracker: true,
              }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { objectFit: "cover" }
              }}
            />
            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 flex items-center justify-center">
              <div className="w-full h-full border-2 border-white/50 rounded-xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white"></div>
              </div>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-[#5B4EE4] animate-spin mb-4" />
            <h3 className="text-lg font-black text-primaryText">Verifying Stay...</h3>
            <p className="text-sm text-secondaryText">Please wait while we check the blockchain (just kidding, the database).</p>
          </div>
        )}

        {status === "success" && claimData && (
          <div className="w-full bg-surface border border-emerald-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-primaryText mb-1">Stay Verified!</h2>
            <p className="text-sm font-medium text-secondaryText mb-6">
              You successfully claimed your discount at <strong className="text-primaryText">{claimData.title}</strong>.
            </p>
            
            <div className="w-full bg-mainBg border border-cardBorder rounded-2xl p-4 mb-6 text-left flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-tertiaryText uppercase tracking-widest mb-1">Discount Applied</p>
                <p className="text-lg font-black text-emerald-600">{claimData.discount_percentage}% OFF</p>
              </div>
              <QrCode className="text-tertiaryText opacity-30" size={32} />
            </div>

            <button 
              onClick={() => navigate("/")}
              className="w-full py-3.5 bg-[#5B4EE4] text-white font-black rounded-xl hover:bg-[#4b40ce] active:scale-95 transition-all shadow-md"
            >
              Back to Home
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="w-full bg-surface border border-red-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-lg shadow-red-500/10 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-primaryText mb-2">Verification Failed</h2>
            <p className="text-sm font-medium text-secondaryText mb-6">{message}</p>
            
            <button 
              onClick={() => setStatus("scanning")}
              className="w-full py-3.5 bg-mainBg border border-cardBorder text-primaryText font-black rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
            >
              Try Scanning Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}