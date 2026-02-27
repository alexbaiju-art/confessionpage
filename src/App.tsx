import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Info, MessageCircle, Send, Plus, Home as HomeIcon, Shield, Users, Zap, Music, Volume2, VolumeX, Play, Pause, Trash2, MoreHorizontal, User, AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Using a soft, ambient royalty-free track
  const audioUrl = "https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a7390b.mp3"; // "Ambient Piano"

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play blocked by browser. User interaction required."));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3">
      <audio ref={audioRef} src={audioUrl} loop />
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/90 backdrop-blur-md p-2 rounded-2xl soft-shadow border border-primary/20 flex items-center gap-2"
      >
        <button 
          onClick={togglePlay}
          className="size-10 rounded-xl bg-primary/20 text-accent flex items-center justify-center hover:bg-primary/30 transition-colors"
        >
          {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
        </button>
        
        <div className="flex flex-col pr-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-accent/60">Confession Mood</span>
          <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">Ambient Piano</span>
        </div>

        <button 
          onClick={toggleMute}
          className="size-8 rounded-lg text-slate-400 hover:text-accent transition-colors"
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3 px-1">
            {[0.4, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                className="w-0.5 bg-accent rounded-full"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-white/80 backdrop-blur-md px-4 md:px-10 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-900">
          <div className="size-8 flex items-center justify-center rounded-lg bg-primary text-slate-900">
            <Heart className="size-5 fill-current" />
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight font-display">Blush Box</h2>
        </Link>
        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-accent",
              location.pathname === "/" ? "text-accent font-bold" : "text-slate-500"
            )}
          >
            Home
          </Link>
          <Link 
            to="/confessions" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-accent",
              location.pathname === "/confessions" ? "text-accent font-bold" : "text-slate-500"
            )}
          >
            Confessions
          </Link>
          <Link 
            to="/about" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-accent",
              location.pathname === "/about" ? "text-accent font-bold" : "text-slate-500"
            )}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="mt-auto border-t border-primary/10 py-10 px-4 bg-white">
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">
      <div className="flex items-center gap-2 text-primary opacity-60">
        <Shield className="size-4" />
        <span className="text-sm font-medium uppercase tracking-widest">Fully Anonymous & Encrypted</span>
      </div>
      <p className="text-slate-400 text-xs">© 2024 Blush Box. Stay anonymous, stay safe.</p>
    </div>
  </footer>
);

// --- Pages ---

const Home = () => {
  const navigate = useNavigate();
  const [confession, setConfession] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [useCustomName, setUseCustomName] = useState(false);

  useEffect(() => {
    if (!useCustomName) {
      const names = ["SecretRose", "HiddenHeart", "QuietSoul", "SilentWhisper", "MysticPetal"];
      const randomName = `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 1000)}`;
      setAnonymousName(randomName);
    }
  }, [useCustomName]);

  const [recentWhispers, setRecentWhispers] = useState<any[]>([]);

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    try {
      const res = await fetch("/api/confessions?sort=new");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecentWhispers(data.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (confession.length < 10) {
      setError("Confession must be at least 10 characters.");
      return;
    }
    if (confession.length > 500) {
      setError("Confession must be less than 500 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: confession, name: anonymousName }),
      });

      if (res.ok) {
        const data = await res.json();
        // Store the ID of the confession we just created
        const myConfessions = JSON.parse(localStorage.getItem("blushbox_my_posts") || "[]");
        myConfessions.push(data.id);
        localStorage.setItem("blushbox_my_posts", JSON.stringify(myConfessions));
        
        navigate("/confessions");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit confession.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full px-4 py-12 flex flex-col items-center gap-8"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/20 text-accent text-xs font-bold uppercase tracking-wider">
          <Shield className="size-3" /> 100% Anonymous & Encrypted
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900">
          Share Your <span className="text-accent italic">Secret</span>
        </h1>
        <p className="text-slate-500 text-lg">
          Your confession will be posted as <span className="text-accent font-semibold">{anonymousName || "Anonymous"}</span>
        </p>
      </div>

      <div className="w-full bg-white rounded-3xl p-6 soft-shadow border border-primary/10 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
            <Users className="size-4 text-accent" />
            Nickname (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={anonymousName}
              onChange={(e) => {
                setAnonymousName(e.target.value);
                setUseCustomName(true);
              }}
              placeholder="Enter a nickname..."
              className="flex-1 bg-bg-soft border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-slate-700 placeholder:text-slate-400 px-4 py-3 transition-all"
            />
            <button
              onClick={() => {
                setUseCustomName(false);
                const names = ["SecretRose", "HiddenHeart", "QuietSoul", "SilentWhisper", "MysticPetal"];
                const randomName = `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 1000)}`;
                setAnonymousName(randomName);
              }}
              className="px-4 py-2 text-xs font-bold text-accent hover:bg-primary/10 rounded-xl transition-colors"
            >
              Randomize
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={confession}
            onChange={(e) => setConfession(e.target.value)}
            placeholder="Write your confession here..."
            className="w-full bg-bg-soft border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-700 placeholder:text-slate-400 p-6 resize-none h-48 transition-all text-lg"
          />
          <div className="absolute bottom-4 right-6 flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className={cn(confession.length > 500 ? "text-red-500" : "")}>
              {confession.length} / 500
            </span>
          </div>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm font-medium text-center"
          >
            {error}
          </motion.p>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-slate-400 text-sm italic">
            <Zap className="size-4" /> Randomizing identity...
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || confession.length < 10}
            className="pink-gradient hover:brightness-105 disabled:opacity-50 text-white font-bold px-10 py-4 rounded-full transition-all shadow-lg shadow-primary/30 flex items-center gap-2 group"
          >
            Whisper Anonymously
            <Send className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {recentWhispers.length > 0 && (
        <div className="w-full max-w-2xl space-y-6 mt-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="size-5 text-accent" />
              Recent Whispers
            </h2>
            <Link to="/confessions" className="text-sm font-bold text-accent hover:underline">View All</Link>
          </div>
          <div className="grid gap-4">
            {recentWhispers.map((w, i) => (
              <motion.div 
                key={w.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-primary/10 soft-shadow"
              >
                <p className="text-slate-600 line-clamp-2 text-sm italic">"{w.confession_text}"</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{w.anonymous_name}</span>
                  <div className="flex items-center gap-1 text-accent">
                    <Heart className="size-3 fill-current" />
                    <span className="text-xs font-bold">{w.likes_count}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
        {[
          { icon: Shield, title: "Private", desc: "No tracking, no logs, just your voice in the dark." },
          { icon: Users, title: "Community", desc: "Join thousands sharing their deepest thoughts safely." },
          { icon: Zap, title: "Instant", desc: "Post in seconds and see trending secrets immediately." }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white/50 border border-primary/10">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-accent">
              <item.icon className="size-5" />
            </div>
            <h3 className="font-bold text-slate-900">{item.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const ConfessionsFeed = () => {
  const [confessions, setConfessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"new" | "likes" | "mine">("new");
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [myPostIds, setMyPostIds] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");

  const reportReasons = [
    "Harassment or Hate Speech",
    "Inappropriate Content",
    "Spam or Misleading",
    "Self-harm or Violence",
    "Other"
  ];

  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("blushbox_likes") || "[]");
    const savedMyPosts = JSON.parse(localStorage.getItem("blushbox_my_posts") || "[]");
    setLikedIds(savedLikes);
    setMyPostIds(savedMyPosts);
    fetchConfessions();
  }, [sortBy]);

  const fetchConfessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/confessions?sort=${sortBy === "likes" ? "likes" : "date"}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        let filteredData = data;
        if (sortBy === "mine") {
          filteredData = data.filter((c: any) => myPostIds.includes(c.id));
        }
        setConfessions(filteredData);
      } else {
        console.error("API did not return an array:", data);
        setConfessions([]);
      }
    } catch (err) {
      console.error(err);
      setConfessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: number) => {
    if (likedIds.includes(id)) return;

    try {
      const res = await fetch(`/api/confessions/${id}/like`, { method: "POST" });
      if (res.ok) {
        const newLikes = [...likedIds, id];
        setLikedIds(newLikes);
        localStorage.setItem("blushbox_likes", JSON.stringify(newLikes));
        
        // Optimistic update
        setConfessions(prev => prev.map(c => 
          c.id === id ? { ...c, likes_count: c.likes_count + 1 } : c
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete your whisper? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/confessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Remove from state
        setConfessions(prev => prev.filter(c => c.id !== id));
        // Remove from localStorage
        const newMyPosts = myPostIds.filter(postId => postId !== id);
        setMyPostIds(newMyPosts);
        localStorage.setItem("blushbox_my_posts", JSON.stringify(newMyPosts));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = () => {
    if (!reportReason) return;
    alert(`Thank you. Whisper #${reportingId} has been reported for: ${reportReason}. Our moderators will review it.`);
    setReportingId(null);
    setReportReason("");
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12 space-y-8">
      {/* Report Modal */}
      <AnimatePresence>
        {reportingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportingId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-primary/10"
            >
              <button 
                onClick={() => setReportingId(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="size-5" />
              </button>
              
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div className="size-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <AlertTriangle className="size-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Report Whisper</h2>
                  <p className="text-slate-500 text-sm mt-1">Help us keep Blush Box a safe space.</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700 ml-1">Reason for reporting:</p>
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                      reportReason === reason 
                        ? "border-red-500 bg-red-50 text-red-700" 
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/30"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="w-full mt-8 pink-gradient text-white font-bold py-4 rounded-2xl disabled:opacity-50 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Submit Report
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Confession Feed</h1>
          <p className="text-slate-500 mt-1">Whispered secrets from hearts around the world.</p>
        </div>
        <div className="flex bg-primary/10 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setSortBy("new")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              sortBy === "new" ? "bg-white shadow-sm text-accent" : "text-slate-500"
            )}
          >
            Newest
          </button>
          <button 
            onClick={() => setSortBy("likes")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              sortBy === "likes" ? "bg-white shadow-sm text-accent" : "text-slate-500"
            )}
          >
            Most Liked
          </button>
          <button 
            onClick={() => setSortBy("mine")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
              sortBy === "mine" ? "bg-white shadow-sm text-accent" : "text-slate-500"
            )}
          >
            <User className="size-3.5" />
            My Whispers
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {confessions.map((c) => (
            <motion.article 
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 soft-shadow border border-primary/5 hover:border-primary/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-accent">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{c.anonymous_name}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                    className="p-2 text-slate-400 hover:text-accent hover:bg-primary/10 rounded-lg transition-all"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>

                  <AnimatePresence>
                    {openMenuId === c.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuId(null)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-primary/10 z-20 overflow-hidden"
                        >
                          <div className="p-1">
                            {myPostIds.includes(c.id) ? (
                              <button
                                onClick={() => {
                                  handleDelete(c.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="size-4" />
                                Delete My Whisper
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setReportingId(c.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                <Shield className="size-4" />
                                Report Whisper
                              </button>
                            )}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + "/confessions");
                                alert("Link copied to clipboard!");
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <Send className="size-4" />
                              Share Link
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                  {c.confession_text}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <button 
                  onClick={() => handleLike(c.id)}
                  className={cn(
                    "flex items-center gap-2 group transition-all",
                    likedIds.includes(c.id) ? "text-accent" : "text-slate-400 hover:text-accent"
                  )}
                >
                  <div className={cn(
                    "size-9 rounded-full flex items-center justify-center transition-all",
                    likedIds.includes(c.id) ? "bg-primary text-white" : "bg-primary/10 group-hover:bg-primary/20"
                  )}>
                    <Heart className={cn("size-5", likedIds.includes(c.id) && "fill-current")} />
                  </div>
                  <span className="text-sm font-bold">{c.likes_count} Hearts</span>
                </button>
                <div className="flex items-center gap-2 text-slate-300">
                  <MessageCircle className="size-4" />
                  <span className="text-xs font-medium">Anonymous</span>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
        
        {!loading && confessions.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <MessageCircle className="size-8" />
            </div>
            <p className="text-slate-400 font-medium">No confessions yet. Be the first to whisper!</p>
            <Link to="/" className="inline-block text-accent font-bold hover:underline">Go to Home</Link>
          </div>
        )}

        {loading && confessions.length === 0 && (
          <div className="flex justify-center py-20">
            <div className="flex items-center gap-2 text-primary/40 font-semibold">
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Whispering to the server...
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const About = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="max-w-4xl mx-auto w-full px-4 py-12 space-y-12"
  >
    <div className="flex flex-col gap-4 text-center items-center">
      <span className="px-4 py-1 rounded-full bg-primary/20 text-accent text-xs font-bold uppercase tracking-wider">Our Story</span>
      <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 font-display">
        A Sanctuary for Your Inner Voice
      </h1>
      <p className="text-slate-500 text-lg max-w-2xl">
        Blush Box was born from the need for a digital space that feels like a quiet room at twilight—safe, anonymous, and free from the weight of judgment.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-6 p-8 rounded-3xl bg-white shadow-sm border border-primary/10">
        <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-accent">
          <Shield className="size-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Pure Anonymity</h3>
          <p className="text-slate-500 leading-relaxed">
            Expression shouldn't come with a profile. We've removed the barriers of identity so you can focus entirely on the essence of your message. No usernames, no avatars, just thoughts.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6 p-8 rounded-3xl bg-white shadow-sm border border-primary/10">
        <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-accent">
          <Zap className="size-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Zero Tracking</h3>
          <p className="text-slate-500 leading-relaxed">
            No login required. We don't track your location, your device, or your behavior. Blush Box is designed to be a ghost in the machine, respecting your privacy above all else.
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-3xl font-bold font-display">Confession Mood Music</h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Sometimes words aren't enough. We've curated a selection of ambient sounds to help you find the right headspace for your whispers.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: "Rainy Night", desc: "Soft pitter-patter for deep reflection.", icon: "🌧️" },
          { title: "Midnight Piano", desc: "Melancholic keys for honest secrets.", icon: "🎹" },
          { title: "Ocean Waves", desc: "Steady rhythm for letting go.", icon: "🌊" }
        ].map((mood, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-4 p-6 rounded-3xl border border-primary/10 bg-white hover:border-primary/40 transition-all cursor-pointer group">
            <div className="text-3xl group-hover:scale-110 transition-transform">{mood.icon}</div>
            <h3 className="font-bold text-slate-900">{mood.title}</h3>
            <p className="text-sm text-slate-500">{mood.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-primary/10 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center gap-6">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Ready to share your whisper?</h2>
      <p className="text-slate-600 max-w-lg">
        Join the thousands of others who use Blush Box as their daily journal of anonymous reflection.
      </p>
      <Link 
        to="/" 
        className="flex min-w-[180px] items-center justify-center rounded-full h-12 px-8 bg-accent text-white font-bold hover:brightness-105 transition-all shadow-lg shadow-accent/20"
      >
        <HomeIcon className="size-4 mr-2" />
        Return to Home
      </Link>
    </div>
  </motion.div>
);

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-bg-soft font-sans">
        <Navbar />
        <MusicPlayer />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/confessions" element={<ConfessionsFeed />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
