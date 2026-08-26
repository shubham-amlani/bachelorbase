import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Loader2,
  Edit3,
  Settings,
  Key,
  Heart,
  ChevronRight,
  Save,
  X,
  CheckCircle2,
  LogIn,
  UserPlus,
  Building2,
  Info,
  MessageSquare,
  LogOut,
  MapPin,
  Star,
  MessageCircle,
  ExternalLink,
  Users,
  Activity,
  Utensils,
  Check,
  UserCheck,
  PhoneCall,
} from "lucide-react";
import PhoneVerificationModal from "../../components/auth/PhoneVerificationModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("overview"); // overview, flatmate, activity, settings

  // --- Dashboard Data States ---
  const [linkedFlatmateListings, setLinkedFlatmateListings] = useState([]);
  const [contactedProperties, setContactedProperties] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [savedFavoritesCount, setSavedFavoritesCount] = useState(0);

  // --- Flatmate Hub States ---
  const [flatmateProfile, setFlatmateProfile] = useState(null);
  const [isEditingFlatmate, setIsEditingFlatmate] = useState(false);
  const [flatmateForm, setFlatmateForm] = useState({
    age: "",
    gender: "Male",
    native_place: "",
    purpose_of_living: "Student",
    institute_or_company: "",
    religion_caste: "",
    dietary_preference: "Vegetarian",
    habits_smoking: false,
    habits_drinking: false,
    bio: "",
  });

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // --- UI States for Editing ---
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    fetchProfileAndDashboardData();
  }, []);

  // Catch redirect action to open Flatmate Hub instantly
  useEffect(() => {
    if (searchParams.get("action") === "create_flatmate") {
      setActiveTab("flatmate");
      setIsEditingFlatmate(true);
      setSearchParams({}, { replace: true }); // Clean URL
    }
  }, [searchParams, setSearchParams]);

  const fetchProfileAndDashboardData = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    setIsGuest(false);
    setSession(session);

    // 1. Fetch User Profile
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (userData) {
      setProfile(userData);
      setEditName(userData.full_name);
    }

    // 2. Fetch Flatmate Profile
    const { data: fmProfile } = await supabase
      .from("flatmate_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (fmProfile) {
      setFlatmateProfile(fmProfile);
      setFlatmateForm(fmProfile);
    }

    // 3. Fetch Linked Listings
    const { data: linkedData } = await supabase
      .from("listing_linked_flatmates")
      .select(
        `listing_id, pg_flat_listings(id, title, locality, city, price_monthly_min, listing_media(url, is_primary))`
      )
      .eq("user_id", session.user.id);
    if (linkedData)
      setLinkedFlatmateListings(linkedData.map((d) => d.pg_flat_listings));

    // 4. Fetch Connection Requests (Double-Blind System)
    const { data: outReq } = await supabase
      .from("flatmate_requests")
      .select(
        `*, pg_flat_listings(title, locality, owner_name, owner_whatsapp)`
      )
      .eq("requester_id", session.user.id)
      .order("created_at", { ascending: false });
    if (outReq) setOutgoingRequests(outReq);

    const { data: incReq } = await supabase
      .from("flatmate_requests")
      .select(
        `*, users!flatmate_requests_requester_id_fkey(full_name, phone_number, avatar_url), pg_flat_listings(title)`
      )
      .eq("target_user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (incReq && incReq.length > 0) {
      // Fetch requester profiles manually to avoid postgREST join errors
      const reqIds = incReq.map((r) => r.requester_id);
      const { data: reqProfiles } = await supabase
        .from("flatmate_profiles")
        .select("*")
        .in("user_id", reqIds);
      const mappedIncReqs = incReq.map((r) => ({
        ...r,
        requester_profile: reqProfiles?.find(
          (p) => p.user_id === r.requester_id
        ),
      }));
      setIncomingRequests(mappedIncReqs);
    } else {
      setIncomingRequests([]);
    }

    // 5. Activity Stats (Favorites, Leads, Reviews)
    const { count } = await supabase
      .from("saved_favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);
    setSavedFavoritesCount(count || 0);

    const { data: leadsData } = await supabase
      .from("whatsapp_leads")
      .select(`created_at, pg_flat_listings(id, title, locality, listing_type)`)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (leadsData) setContactedProperties(leadsData);

    const { data: propReviews } = await supabase
      .from("property_reviews")
      .select(
        `id, rating_overall, review_text, created_at, pg_flat_listings(id, title)`
      )
      .eq("user_id", session.user.id)
      .eq("status", "published");
    const { data: tiffReviews } = await supabase
      .from("tiffin_reviews")
      .select(
        `id, rating_overall, review_text, created_at, tiffin_services(id, provider_name)`
      )
      .eq("user_id", session.user.id)
      .eq("status", "published");

    let consolidatedReviews = [];
    if (propReviews)
      consolidatedReviews = [
        ...consolidatedReviews,
        ...propReviews.map((r) => ({
          ...r,
          target_name: r.pg_flat_listings?.title,
          type: "property",
          target_id: r.pg_flat_listings?.id,
        })),
      ];
    if (tiffReviews)
      consolidatedReviews = [
        ...consolidatedReviews,
        ...tiffReviews.map((r) => ({
          ...r,
          target_name: r.tiffin_services?.provider_name,
          type: "tiffin",
          target_id: r.tiffin_services?.id,
        })),
      ];

    consolidatedReviews.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setUserReviews(consolidatedReviews);

    setLoading(false);
  };

  // --- Actions ---
  const handleSaveFlatmateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const payload = {
        user_id: session.user.id,
        age: parseInt(flatmateForm.age),
        gender: flatmateForm.gender,
        native_place: flatmateForm.native_place,
        purpose_of_living: flatmateForm.purpose_of_living,
        institute_or_company: flatmateForm.institute_or_company,
        religion_caste: flatmateForm.religion_caste || null,
        dietary_preference: flatmateForm.dietary_preference,
        habits_smoking: flatmateForm.habits_smoking,
        habits_drinking: flatmateForm.habits_drinking,
        bio: flatmateForm.bio,
      };

      if (flatmateProfile) {
        await supabase
          .from("flatmate_profiles")
          .update(payload)
          .eq("user_id", session.user.id);
      } else {
        await supabase.from("flatmate_profiles").insert(payload);
      }

      setFlatmateProfile(payload);
      setIsEditingFlatmate(false);
    } catch (err) {
      alert("Failed to save profile.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRequestAction = async (requestId, newStatus) => {
    try {
      await supabase
        .from("flatmate_requests")
        .update({ status: newStatus })
        .eq("id", requestId);
      fetchProfileAndDashboardData(); // Refresh to update UI lists
    } catch (err) {
      alert("Action failed.");
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setUpdateLoading(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: editName })
      .eq("id", session.user.id);
    await supabase.auth.updateUser({ data: { full_name: editName } });
    if (!error) {
      setProfile({ ...profile, full_name: editName });
      setIsEditing(false);
    }
    setUpdateLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: "", message: "" });
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return setPasswordStatus({
        type: "error",
        message: "Passwords do not match.",
      });
    if (passwordForm.newPassword.length < 6)
      return setPasswordStatus({
        type: "error",
        message: "Password must be at least 6 characters.",
      });

    setUpdateLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });
    if (error) {
      setPasswordStatus({ type: "error", message: error.message });
    } else {
      setPasswordStatus({
        type: "success",
        message: "Password updated successfully.",
      });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordStatus({ type: "", message: "" });
      }, 2000);
    }
    setUpdateLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsGuest(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-mainBg">
        <Loader2 size={32} className="animate-spin text-[#5B4EE4]" />
      </div>
    );

  if (isGuest) {
    // ... KEEP EXISTING GUEST STATE UNCHANGED ...
    return (
      <div className="w-full min-h-screen bg-mainBg flex justify-center py-8 px-4 animate-in fade-in pb-24">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          <div className="bg-surface border border-cardBorder rounded-[2rem] p-8 sm:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#5B4EE4]/10 to-transparent rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>
            <div className="w-24 h-24 bg-mainBg border border-cardBorder rounded-full flex items-center justify-center shadow-inner mb-6 relative z-10">
              <User size={40} className="text-[#5B4EE4]/50" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-primaryText tracking-tight relative z-10">
              Your BachelorBase Hub
            </h1>
            <p className="text-sm sm:text-base font-medium text-secondaryText mt-3 max-w-md relative z-10">
              Sign in to securely save properties, track your contact history,
              and manage your personalized directory.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mt-10 relative z-10">
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-mainBg border border-cardBorder text-primaryText font-black py-4 rounded-xl hover:border-[#5B4EE4] hover:text-[#5B4EE4] transition-all shadow-sm active:scale-95"
              >
                <LogIn size={18} /> Sign In
              </Link>
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B4EE4] to-[#7E73ED] text-white font-black py-4 rounded-xl shadow-[0_8px_25px_rgba(91,78,228,0.35)] hover:opacity-90 transition-all active:scale-95"
              >
                <UserPlus size={18} /> Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TAB DEFINITIONS ---
  const TABS = [
    { id: "overview", label: "Overview", icon: User },
    { id: "flatmate", label: "Flatmate Hub", icon: Users },
    { id: "activity", label: "My Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-full min-h-screen bg-mainBg flex flex-col items-center py-6 px-4 animate-in fade-in pb-28">
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={() => {
          setIsPhoneModalOpen(false);
          fetchProfileAndDashboardData();
        }}
      />

      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* HEADER PROFILE CARD */}
        <div className="bg-surface border border-cardBorder rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-[#5B4EE4]/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-mainBg border-2 border-surface rounded-full flex items-center justify-center shadow-md shrink-0 overflow-hidden ring-2 ring-[#5B4EE4]/20 relative z-10">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={36} className="text-[#5B4EE4] opacity-80" />
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 flex-grow relative z-10">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full max-w-xs bg-mainBg border border-[#5B4EE4] rounded-xl px-4 py-2 text-lg font-bold text-primaryText outline-none shadow-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-secondaryText hover:text-primaryText hover:bg-mainBg rounded-xl border border-transparent transition-all"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateLoading}
                    className="bg-[#5B4EE4] text-white px-4 py-2 rounded-xl text-sm font-black transition-all shadow-md active:scale-95"
                  >
                    {updateLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-primaryText truncate">
                  {profile.full_name}
                </h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-secondaryText hover:text-[#5B4EE4] transition-colors"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              <span className="text-xs font-bold text-secondaryText bg-mainBg border border-cardBorder px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Mail size={14} className="text-tertiaryText" /> {profile.email}
              </span>
              {profile.phone_number && (
                <span className="text-xs font-bold text-secondaryText bg-mainBg border border-cardBorder px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Phone size={14} className="text-tertiaryText" />{" "}
                  {profile.phone_number}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-4 border-b border-cardBorder pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-[#5B4EE4] text-[#5B4EE4]"
                  : "border-transparent text-secondaryText hover:text-primaryText hover:bg-surface/50 rounded-t-xl"
              }`}
            >
              <tab.icon size={16} /> {tab.label}
              {tab.id === "flatmate" &&
                incomingRequests.filter((r) => r.status === "pending").length >
                  0 && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                )}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="flex flex-col gap-6">
          {/* --- 1. OVERVIEW TAB --- */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface p-5 rounded-2xl border border-cardBorder shadow-sm flex flex-col items-center text-center gap-1 hover:border-[#5B4EE4]/50 transition-colors">
                <Heart size={24} className="text-pink-500 mb-1" />
                <span className="text-2xl font-black text-primaryText">
                  {savedFavoritesCount}
                </span>
                <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest">
                  Favorites
                </span>
              </div>
              <div className="bg-surface p-5 rounded-2xl border border-cardBorder shadow-sm flex flex-col items-center text-center gap-1 hover:border-[#5B4EE4]/50 transition-colors">
                <PhoneCall size={24} className="text-emerald-500 mb-1" />
                <span className="text-2xl font-black text-primaryText">
                  {contactedProperties.length}
                </span>
                <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest">
                  Contacted
                </span>
              </div>
              <div className="bg-surface p-5 rounded-2xl border border-cardBorder shadow-sm flex flex-col items-center text-center gap-1 hover:border-[#5B4EE4]/50 transition-colors">
                <Star size={24} className="text-amber-500 mb-1" />
                <span className="text-2xl font-black text-primaryText">
                  {userReviews.length}
                </span>
                <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest">
                  Reviews
                </span>
              </div>
              <div className="bg-surface p-5 rounded-2xl border border-cardBorder shadow-sm flex flex-col items-center text-center gap-1 hover:border-[#5B4EE4]/50 transition-colors">
                <Users size={24} className="text-blue-500 mb-1" />
                <span className="text-2xl font-black text-primaryText">
                  {linkedFlatmateListings.length}
                </span>
                <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest">
                  Listings
                </span>
              </div>

              {/* Quick Action Banner */}
              <Link
                to="/accommodations"
                className="col-span-2 md:col-span-4 bg-gradient-to-r from-[#5B4EE4]/10 to-transparent p-5 rounded-2xl border border-[#5B4EE4]/20 flex items-center justify-between group hover:bg-[#5B4EE4]/10 transition-colors mt-2"
              >
                <div>
                  <h3 className="text-sm font-black text-[#5B4EE4] mb-0.5">
                    Find Your Next Stay
                  </h3>
                  <p className="text-xs font-medium text-secondaryText">
                    Browse verified PGs, Flats, and vacant Flatmate Spots.
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-[#5B4EE4] group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          )}

          {/* --- 2. FLATMATE HUB TAB --- */}
          {activeTab === "flatmate" && (
            <div className="flex flex-col gap-6">
              {/* Flatmate Profile Editor / Viewer */}
              <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-black text-primaryText uppercase tracking-wider flex items-center gap-2">
                    <UserCheck size={18} className="text-[#5B4EE4]" /> My Public
                    Flatmate Profile
                  </h2>
                  {flatmateProfile && !isEditingFlatmate && (
                    <button
                      onClick={() => setIsEditingFlatmate(true)}
                      className="text-xs font-bold text-[#5B4EE4] bg-[#5B4EE4]/10 px-3 py-1.5 rounded-lg hover:bg-[#5B4EE4]/20 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {!flatmateProfile && !isEditingFlatmate ? (
                  <div className="text-center py-8">
                    <Users
                      size={40}
                      className="mx-auto text-tertiaryText mb-3"
                    />
                    <p className="text-sm font-bold text-primaryText mb-1">
                      You don't have a Flatmate Profile yet.
                    </p>
                    <p className="text-xs text-secondaryText mb-5 max-w-sm mx-auto">
                      Create a profile to send connection requests to private
                      flat listings and help others vet you securely.
                    </p>
                    <button
                      onClick={() => setIsEditingFlatmate(true)}
                      className="bg-[#5B4EE4] text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-md hover:bg-[#4b40ce] transition-all"
                    >
                      Create Profile Now
                    </button>
                  </div>
                ) : isEditingFlatmate ? (
                  <form
                    onSubmit={handleSaveFlatmateProfile}
                    className="flex flex-col gap-4 animate-in fade-in"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-secondaryText uppercase">
                          Age
                        </label>
                        <input
                          type="number"
                          required
                          min="16"
                          max="99"
                          value={flatmateForm.age}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              age: e.target.value,
                            })
                          }
                          className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-secondaryText uppercase">
                          Gender
                        </label>
                        <select
                          value={flatmateForm.gender}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              gender: e.target.value,
                            })
                          }
                          className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4]"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-secondaryText uppercase">
                          Native Place (City/State)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajkot, Gujarat"
                          value={flatmateForm.native_place}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              native_place: e.target.value,
                            })
                          }
                          className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-secondaryText uppercase">
                          Living Purpose
                        </label>
                        <select
                          value={flatmateForm.purpose_of_living}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              purpose_of_living: e.target.value,
                            })
                          }
                          className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4]"
                        >
                          <option value="Student">Student</option>
                          <option value="Professional">
                            Working Professional
                          </option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold text-secondaryText uppercase">
                          Institute or Company Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Nirma University or TCS"
                          value={flatmateForm.institute_or_company}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              institute_or_company: e.target.value,
                            })
                          }
                          className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-secondaryText uppercase">
                          Religion / Caste (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hindu / Patel"
                          value={flatmateForm.religion_caste}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              religion_caste: e.target.value,
                            })
                          }
                          className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-secondaryText uppercase">
                          Dietary Preference
                        </label>
                        <select
                          value={flatmateForm.dietary_preference}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              dietary_preference: e.target.value,
                            })
                          }
                          className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4]"
                        >
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Non-Vegetarian">Non-Vegetarian</option>
                          <option value="Eggitarian">Eggitarian</option>
                          <option value="Jain">Jain</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-mainBg border border-cardBorder rounded-xl mt-2">
                      <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flatmateForm.habits_smoking}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              habits_smoking: e.target.checked,
                            })
                          }
                          className="accent-[#5B4EE4] w-4 h-4"
                        />{" "}
                        I Smoke
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flatmateForm.habits_drinking}
                          onChange={(e) =>
                            setFlatmateForm({
                              ...flatmateForm,
                              habits_drinking: e.target.checked,
                            })
                          }
                          className="accent-[#5B4EE4] w-4 h-4"
                        />{" "}
                        I Drink
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-secondaryText uppercase">
                        Bio / Description
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Tell potential flatmates about your routine, hobbies, and lifestyle..."
                        value={flatmateForm.bio}
                        onChange={(e) =>
                          setFlatmateForm({
                            ...flatmateForm,
                            bio: e.target.value,
                          })
                        }
                        className="bg-mainBg border border-cardBorder rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5B4EE4] resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 mt-2 border-t border-cardBorder pt-4">
                      {flatmateProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingFlatmate(false);
                            setFlatmateForm(flatmateProfile);
                          }}
                          className="px-5 py-2.5 text-xs font-black text-secondaryText hover:text-primaryText hover:bg-surface rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="bg-[#5B4EE4] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md active:scale-95 flex items-center gap-2"
                      >
                        {updateLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Save Profile"
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 animate-in fade-in">
                    <div>
                      <p className="text-[10px] text-secondaryText uppercase font-bold tracking-wider mb-0.5">
                        Bio
                      </p>
                      <p className="text-sm font-bold text-primaryText capitalize">
                        {flatmateProfile.age} • {flatmateProfile.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondaryText uppercase font-bold tracking-wider mb-0.5">
                        Native
                      </p>
                      <p className="text-sm font-bold text-primaryText truncate">
                        {flatmateProfile.native_place}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondaryText uppercase font-bold tracking-wider mb-0.5">
                        Purpose
                      </p>
                      <p className="text-sm font-bold text-primaryText truncate">
                        {flatmateProfile.purpose_of_living}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-secondaryText uppercase font-bold tracking-wider mb-0.5">
                        Institute / Work
                      </p>
                      <p className="text-sm font-bold text-primaryText truncate">
                        {flatmateProfile.institute_or_company ||
                          "Not Specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondaryText uppercase font-bold tracking-wider mb-0.5">
                        Diet
                      </p>
                      <p className="text-sm font-bold text-primaryText truncate">
                        {flatmateProfile.dietary_preference}
                      </p>
                    </div>
                    <div className="col-span-3 pt-2">
                      <div className="flex gap-2">
                        {flatmateProfile.habits_smoking && (
                          <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded uppercase">
                            Smokes
                          </span>
                        )}
                        {flatmateProfile.habits_drinking && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded uppercase">
                            Drinks
                          </span>
                        )}
                        {!flatmateProfile.habits_smoking &&
                          !flatmateProfile.habits_drinking && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded uppercase">
                              No Addictions
                            </span>
                          )}
                      </div>
                    </div>
                    {flatmateProfile.bio && (
                      <div className="col-span-3 pt-2">
                        <p className="text-xs text-secondaryText italic border-l-2 border-[#5B4EE4]/50 pl-3">
                          "{flatmateProfile.bio}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Incoming Requests (I am the owner) */}
              {linkedFlatmateListings.length > 0 && (
                <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                  <h2 className="text-sm font-black text-primaryText uppercase tracking-wider mb-4 flex items-center gap-2">
                    <LogIn size={18} className="text-amber-500" /> Incoming
                    Connection Requests
                  </h2>
                  <div className="flex flex-col gap-3">
                    {incomingRequests.length > 0 ? (
                      incomingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-mainBg border border-cardBorder p-4 rounded-2xl flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-surface border border-cardBorder flex items-center justify-center shrink-0 overflow-hidden">
                                {req.users?.avatar_url ? (
                                  <img
                                    src={req.users.avatar_url}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User
                                    size={18}
                                    className="text-secondaryText"
                                  />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-primaryText truncate">
                                  {req.users?.full_name}
                                </span>
                                <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest mt-0.5">
                                  For {req.pg_flat_listings?.title}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                                req.status === "pending"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : req.status === "accepted"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : "bg-red-50 text-red-600 border border-red-200"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          {req.intro_message && (
                            <p className="text-xs text-secondaryText italic border-l-2 border-cardBorder pl-3">
                              "{req.intro_message}"
                            </p>
                          )}

                          {req.requester_profile && (
                            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-primaryText bg-surface p-2 rounded-lg border border-cardBorder">
                              <span>
                                {req.requester_profile.age}yo{" "}
                                {req.requester_profile.gender}
                              </span>
                              <span className="text-tertiaryText">•</span>
                              <span>
                                {req.requester_profile.purpose_of_living}
                              </span>
                              <span className="text-tertiaryText">•</span>
                              <span className="truncate max-w-[120px]">
                                {req.requester_profile.native_place}
                              </span>
                            </div>
                          )}

                          {req.status === "pending" ? (
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() =>
                                  handleRequestAction(req.id, "accepted")
                                }
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                              >
                                Accept & Reveal Number
                              </button>
                              <button
                                onClick={() =>
                                  handleRequestAction(req.id, "declined")
                                }
                                className="flex-1 bg-surface border border-cardBorder text-red-500 hover:bg-red-50 text-xs font-bold py-2 rounded-lg transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            req.status === "accepted" && (
                              <div className="flex items-center justify-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-xs font-bold mt-1">
                                <PhoneCall size={14} />{" "}
                                {req.users?.phone_number || "No Number"}
                              </div>
                            )
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-tertiaryText italic text-center py-4">
                        No incoming requests yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Outgoing Requests (I am the applicant) */}
              <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                <h2 className="text-sm font-black text-primaryText uppercase tracking-wider mb-4 flex items-center gap-2">
                  <LogOut size={18} className="text-emerald-500" /> My Sent
                  Requests
                </h2>
                <div className="flex flex-col gap-3">
                  {outgoingRequests.length > 0 ? (
                    outgoingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-mainBg border border-cardBorder p-4 rounded-2xl flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-sm font-bold text-primaryText truncate">
                              {req.pg_flat_listings?.title}
                            </span>
                            <span className="text-[10px] font-bold text-secondaryText truncate mt-0.5">
                              {req.pg_flat_listings?.locality}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shrink-0 ${
                              req.status === "pending"
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : req.status === "accepted"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        {req.status === "accepted" ? (
                          <div className="flex flex-col mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                              Contact Unlocked
                            </span>
                            <span className="text-sm font-bold text-emerald-700">
                              {req.pg_flat_listings?.owner_name}:{" "}
                              {req.pg_flat_listings?.owner_phone}
                            </span>
                          </div>
                        ) : req.status === "declined" ? (
                          <p className="text-[10px] font-bold text-red-500 mt-1">
                            The owner declined this request.
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold text-amber-600 mt-1">
                            Waiting for the owner to accept to reveal contact
                            info.
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-tertiaryText italic text-center py-4">
                      You haven't sent any requests.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- 3. ACTIVITY TAB --- */}
          {activeTab === "activity" && (
            <div className="flex flex-col gap-6">
              <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-primaryText uppercase tracking-wider flex items-center gap-2">
                    <Heart size={18} className="text-pink-500" /> Saved
                    Favorites
                  </h2>
                  <Link
                    to="/favorites"
                    className="text-xs font-bold text-[#5B4EE4] hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <p className="text-xs font-medium text-secondaryText">
                  You have {savedFavoritesCount} saved items in your directory.
                </p>
              </div>

              <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                <h2 className="text-sm font-black text-primaryText uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone size={18} className="text-emerald-500" /> WhatsApp
                  History
                </h2>
                <div className="flex flex-col gap-3">
                  {contactedProperties.length > 0 ? (
                    contactedProperties.map((lead, idx) => (
                      <Link
                        key={idx}
                        to={`/accommodations/view/${lead.pg_flat_listings?.id}`}
                        className="flex items-start justify-between p-3.5 bg-mainBg border border-cardBorder rounded-xl hover:border-[#5B4EE4]/50 transition-colors group"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-sm font-black text-primaryText truncate group-hover:text-[#5B4EE4] transition-colors">
                            {lead.pg_flat_listings?.title}
                          </span>
                          <span className="text-[10px] font-bold text-secondaryText uppercase tracking-wider mt-1">
                            {lead.pg_flat_listings?.listing_type?.replace(
                              "_",
                              " "
                            )}{" "}
                            • {lead.pg_flat_listings?.locality}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-tertiaryText shrink-0">
                          {formatDate(lead.created_at)}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-tertiaryText italic">
                      No contact history yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                <h2 className="text-sm font-black text-primaryText uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star size={18} className="text-amber-500" /> My Published
                  Reviews
                </h2>
                <div className="flex flex-col gap-3">
                  {userReviews.length > 0 ? (
                    userReviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex flex-col p-4 bg-mainBg border border-cardBorder rounded-xl relative overflow-hidden group"
                      >
                        <div
                          className={`absolute top-0 left-0 w-1 h-full ${
                            review.type === "property"
                              ? "bg-[#5B4EE4]"
                              : "bg-emerald-500"
                          }`}
                        ></div>
                        <div className="flex justify-between items-start mb-2 pl-2">
                          <div className="flex flex-col min-w-0 pr-3">
                            <Link
                              to={
                                review.type === "property"
                                  ? `/accommodations/view/${review.target_id}`
                                  : `/tiffins/view/${review.target_id}`
                              }
                              className="text-sm font-black text-primaryText group-hover:text-[#5B4EE4] truncate"
                            >
                              {review.target_name}
                            </Link>
                            <span className="text-[9px] font-bold text-tertiaryText uppercase tracking-widest mt-0.5">
                              {review.type} • {formatDate(review.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-black shrink-0">
                            <Star size={10} className="fill-amber-500" />{" "}
                            {review.rating_overall}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-secondaryText pl-2 italic">
                          "{review.review_text}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-tertiaryText italic">
                      No reviews published.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- 4. SETTINGS TAB --- */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6 animate-in fade-in">
              <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                <h2 className="text-sm font-black text-primaryText uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#5B4EE4]" />{" "}
                  Verification Status
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3.5 bg-mainBg border border-cardBorder rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-secondaryText" />
                      <span className="text-sm font-bold text-primaryText">
                        Email Verified
                      </span>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-mainBg border border-cardBorder rounded-xl">
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-secondaryText" />
                      <span className="text-sm font-bold text-primaryText">
                        Phone Number
                      </span>
                    </div>
                    {profile.is_phone_verified ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <button
                        onClick={() => setIsPhoneModalOpen(true)}
                        className="text-[10px] font-black text-white bg-amber-500 px-3 py-1.5 rounded shadow-sm hover:bg-amber-600 active:scale-95 transition-all"
                      >
                        VERIFY NOW
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-cardBorder rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-primaryText uppercase tracking-wider flex items-center gap-2">
                    <Key size={18} className="text-amber-500" /> Security
                  </h2>
                  {!isChangingPassword && (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="text-[10px] font-black text-primaryText bg-mainBg border border-cardBorder px-3 py-1.5 rounded hover:border-[#5B4EE4] hover:text-[#5B4EE4] transition-all active:scale-95"
                    >
                      Change Password
                    </button>
                  )}
                </div>

                {isChangingPassword ? (
                  <form
                    onSubmit={handleUpdatePassword}
                    className="mt-4 flex flex-col gap-4 bg-mainBg border border-cardBorder p-5 rounded-xl"
                  >
                    {passwordStatus.message && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          passwordStatus.type === "error"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {passwordStatus.type === "success" && (
                          <CheckCircle2 size={16} />
                        )}{" "}
                        {passwordStatus.message}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-secondaryText uppercase tracking-widest pl-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-cardBorder rounded-xl px-4 py-2.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4]"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-secondaryText uppercase tracking-widest pl-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-cardBorder rounded-xl px-4 py-2.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4]"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-cardBorder">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordStatus({ type: "", message: "" });
                        }}
                        className="px-5 py-2.5 text-xs font-black text-secondaryText hover:text-primaryText hover:bg-surface rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="bg-[#5B4EE4] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md active:scale-95 flex items-center gap-2"
                      >
                        {updateLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Secure Account"
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs font-medium text-secondaryText mb-4">
                    Ensure your account is using a secure password. If you need
                    to switch accounts, sign out below.
                  </p>
                )}

                <button
                  onClick={handleLogout}
                  className="mt-4 flex items-center justify-center w-full sm:w-auto gap-2 bg-red-50 text-red-600 border border-red-100 px-6 py-3.5 rounded-xl text-sm font-black transition-all hover:bg-red-100 shadow-sm active:scale-95"
                >
                  <LogOut size={16} /> Sign Out Safely
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
