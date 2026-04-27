import React, { useState, useMemo, useRef } from "react";
import { Trophy, Play, Upload, Link as LinkIcon, X, ChevronUp, Flame, Crown, Medal, Plus } from "lucide-react";

// ---------------------------------------------
// SevenBalls — fan site for pool & snooker clips
// Landing + working prototype (single file)
// ---------------------------------------------

const SEED_CLIPS = [
  {
    id: "c1",
    title: "Insane 4-cushion escape",
    author: "@trickshot_tom",
    type: "youtube",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumb: "https://images.unsplash.com/photo-1551892589-865f69869476?w=800&q=80",
    votes: 184,
    tag: "Pool",
  },
  {
    id: "c2",
    title: "147 break attempt — pressure cooker",
    author: "@cuesports_uk",
    type: "youtube",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumb: "https://images.unsplash.com/photo-1626168531731-a7d65f8a8a07?w=800&q=80",
    votes: 142,
    tag: "Snooker",
  },
  {
    id: "c3",
    title: "Double kiss into corner pocket",
    author: "@baizebandit",
    type: "youtube",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumb: "https://images.unsplash.com/photo-1615722440048-da4fd9202b39?w=800&q=80",
    votes: 98,
    tag: "Pool",
  },
  {
    id: "c4",
    title: "Masse shot from hell",
    author: "@chalkdust",
    type: "youtube",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumb: "https://images.unsplash.com/photo-1571078558048-ce30bb38ab4b?w=800&q=80",
    votes: 76,
    tag: "Trick",
  },
  {
    id: "c5",
    title: "Black ball decider — last frame",
    author: "@frame_winner",
    type: "youtube",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumb: "https://images.unsplash.com/photo-1606503479586-1aed5cd13437?w=800&q=80",
    votes: 61,
    tag: "Snooker",
  },
  {
    id: "c6",
    title: "Jump shot over two reds",
    author: "@hopper",
    type: "youtube",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumb: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
    votes: 44,
    tag: "Trick",
  },
];

const TAGS = ["All", "Pool", "Snooker", "Trick"];

// Detects video platform and returns an embeddable URL
function parseVideoUrl(url) {
  if (!url) return { platform: "link", embedSrc: "", videoId: null, handle: null };
  const trimmed = url.trim();

  // YouTube — supports watch?v=, youtu.be/, embed/, shorts/
  const yt = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return { platform: "youtube", embedSrc: `https://www.youtube.com/embed/${yt[1]}`, videoId: yt[1], handle: null };

  // Vimeo
  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { platform: "vimeo", embedSrc: `https://player.vimeo.com/video/${vimeo[1]}`, videoId: vimeo[1], handle: null };

  // TikTok — full URL contains the handle right in the path: /@username/video/ID
  const tiktokFull = trimmed.match(/tiktok\.com\/@([\w.-]+)\/video\/(\d+)/);
  if (tiktokFull) {
    return {
      platform: "tiktok",
      embedSrc: `https://www.tiktok.com/embed/v2/${tiktokFull[2]}`,
      videoId: tiktokFull[2],
      handle: `@${tiktokFull[1]}`,
    };
  }
  // TikTok shortened forms (vm.tiktok.com / v/ / embed/) — no handle in URL, oEmbed will get it
  const tiktokShort = trimmed.match(/tiktok\.com\/(?:v\/|embed\/)(\d+)/);
  if (tiktokShort) return { platform: "tiktok", embedSrc: `https://www.tiktok.com/embed/v2/${tiktokShort[1]}`, videoId: tiktokShort[1], handle: null };

  return { platform: "link", embedSrc: trimmed, videoId: null, handle: null };
}

// Fetches a real thumbnail and metadata for the supported platforms.
// YouTube exposes a public image URL; TikTok and Vimeo need their oEmbed endpoints.
async function fetchVideoMeta(url) {
  const parsed = parseVideoUrl(url);
  const result = { thumb: null, title: null, handle: parsed.handle };
  try {
    if (parsed.platform === "youtube" && parsed.videoId) {
      result.thumb = `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`;
      // Fetch oEmbed for title + channel name as @handle
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url.trim())}&format=json`);
        if (res.ok) {
          const data = await res.json();
          result.title = data.title || null;
          if (data.author_name) result.handle = `@${data.author_name.replace(/\s+/g, "")}`;
        }
      } catch {}
      return result;
    }
    if (parsed.platform === "tiktok") {
      const res = await fetch(`/api/oembed?platform=tiktok&url=${encodeURIComponent(url.trim())}`);
      if (res.ok) {
        const data = await res.json();
        result.thumb = data.thumbnail_url || null;
        result.title = data.title || null;
        // Prefer the unique_id (no spaces) over author_name (display name)
        if (data.author_unique_id) result.handle = `@${data.author_unique_id}`;
        else if (!result.handle && data.author_name) result.handle = `@${data.author_name.replace(/\s+/g, "")}`;
      }
      return result;
    }
    if (parsed.platform === "vimeo") {
      const res = await fetch(`/api/oembed?platform=vimeo&url=${encodeURIComponent(url.trim())}`);
      if (res.ok) {
        const data = await res.json();
        result.thumb = data.thumbnail_url || null;
        result.title = data.title || null;
        if (data.author_name) result.handle = `@${data.author_name.replace(/\s+/g, "")}`;
      }
      return result;
    }
  } catch (err) {
    console.warn("Video metadata fetch failed:", err);
  }
  return result;
}

export default function SevenBalls() {
  const [clips, setClips] = useState(SEED_CLIPS);
  const [voted, setVoted] = useState(new Set());
  const [activeTag, setActiveTag] = useState("All");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [playerClip, setPlayerClip] = useState(null);
  const galleryRef = useRef(null);

  const filtered = useMemo(() => {
    const base = activeTag === "All" ? clips : clips.filter((c) => c.tag === activeTag);
    return [...base].sort((a, b) => b.votes - a.votes);
  }, [clips, activeTag]);

  const leaderboard = useMemo(() => [...clips].sort((a, b) => b.votes - a.votes).slice(0, 5), [clips]);

  const handleVote = (id) => {
    if (voted.has(id)) {
      setVoted((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setClips((prev) => prev.map((c) => (c.id === id ? { ...c, votes: c.votes - 1 } : c)));
    } else {
      setVoted((prev) => new Set(prev).add(id));
      setClips((prev) => prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c)));
    }
  };

  const handleSubmit = (newClip) => {
    setClips((prev) => [{ ...newClip, id: `u${Date.now()}`, votes: 0 }, ...prev]);
    setSubmitOpen(false);
    setTimeout(() => galleryRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const totalVotes = clips.reduce((s, c) => s + c.votes, 0);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-stone-900 text-white">
        <button
          onClick={() => setSubmitOpen(true)}
          className="w-full px-5 py-3 flex items-center justify-center gap-2 text-sm sm:text-base font-bold hover:bg-red-600 transition-colors group"
        >
          <Flame size={16} className="text-yellow-300 group-hover:text-white" />
          <span>Got a clip? Upload it now and climb the leaderboard</span>
          <Upload size={16} />
        </button>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-16 sm:pt-14 sm:pb-20">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Big circular logo */}
            <div className="relative mb-7">
              <div className="absolute -inset-3 bg-yellow-300 rounded-full opacity-30 blur-2xl" />
              <div
                className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-white shadow-2xl"
                style={{ animation: "gentleFloat 4s ease-in-out infinite" }}
              >
                <img src={LOGO_SRC} alt="SevenBalls" className="w-full h-full object-cover" />
              </div>
              <style>{`
                @keyframes gentleFloat {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-8px); }
                }
              `}</style>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-black leading-[0.95] tracking-tight">
              The home of <span className="text-red-600">pool</span> &amp; snooker clips.
            </h1>
            <p className="mt-4 text-lg text-stone-600 max-w-xl">
              Upload your sharpest shots. Vote on the rest. The community decides who tops the leaderboard.
            </p>

            {/* Stats row */}
            <div className="mt-8 flex items-center gap-8 sm:gap-12">
              <Stat label="Clips" value={clips.length} />
              <Divider />
              <Stat label="Votes" value={totalVotes} />
              <Divider />
              <Stat label="Players" value={new Set(clips.map((c) => c.author)).size} />
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSubmitOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                <Upload size={18} /> Submit your clip
              </button>
              <button
                onClick={() => galleryRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-stone-300 text-stone-900 font-semibold hover:border-stone-900 transition-colors"
              >
                Watch the leaderboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* LEADERBOARD */}
      <section className="bg-stone-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-yellow-300 text-xs font-bold tracking-widest uppercase">This week</span>
              <h2 className="text-3xl sm:text-4xl font-black mt-1 flex items-center gap-3">
                <Trophy className="text-yellow-300" /> Leaderboard
              </h2>
            </div>
          </div>

          <ol className="space-y-2">
            {leaderboard.map((c, i) => (
              <li
                key={c.id}
                className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-stone-800/60 hover:bg-stone-800 transition-colors cursor-pointer"
                onClick={() => setPlayerClip(c)}
              >
                <RankBadge rank={i + 1} />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-stone-700 overflow-hidden shrink-0 relative">
                  <img src={c.thumb} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} className="text-white" fill="white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{c.title}</div>
                  <div className="text-sm text-stone-400 truncate">
                    {c.author} · <span className="text-yellow-300">{c.tag}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-yellow-300">{c.votes}</div>
                  <div className="text-[10px] uppercase tracking-widest text-stone-400">votes</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* GALLERY */}
      <section ref={galleryRef} className="py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-3xl sm:text-4xl font-black">All clips</h2>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(t)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeTag === t
                      ? "bg-stone-900 text-white"
                      : "bg-white border border-stone-300 text-stone-700 hover:border-stone-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <ClipCard
                key={c.id}
                clip={c}
                voted={voted.has(c.id)}
                onVote={() => handleVote(c.id)}
                onPlay={() => setPlayerClip(c)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-stone-500">No clips in this category yet. Be the first!</div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-t border-stone-200 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-black mb-10 text-center">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Step n={1} title="Submit" body="Drop a YouTube/Vimeo link or upload a clip from your phone." />
            <Step n={2} title="Vote" body="Tap the red button on any clip you rate. One vote per clip per session." />
            <Step n={3} title="Climb" body="Most votes that week takes the crown — and the top of the leaderboard." />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-900 text-stone-400 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-center justify-between gap-4">
          <Logo light />
          <div className="text-sm">© {new Date().getFullYear()} sevenballs.co.uk · A home for cue sports fans</div>
        </div>
      </footer>

      {/* MODALS */}
      {submitOpen && <SubmitModal onClose={() => setSubmitOpen(false)} onSubmit={handleSubmit} />}
      {playerClip && <PlayerModal clip={playerClip} onClose={() => setPlayerClip(null)} />}
    </div>
  );
}

// ---------- Subcomponents ----------

const LOGO_SRC = "data:image/jpeg;base64,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";

function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-10 h-10 rounded-lg overflow-hidden ${light ? "bg-white" : "bg-stone-100"} flex items-center justify-center`}>
        <img src={LOGO_SRC} alt="SevenBalls logo" className="w-full h-full object-cover" />
      </div>
      <div className={`font-black text-lg tracking-tight ${light ? "text-white" : "text-stone-900"}`}>
        sevenballs<span className="text-red-600">.co.uk</span>
      </div>
    </div>
  );
}


function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black text-stone-900">{value.toLocaleString()}</div>
      <div className="text-xs uppercase tracking-widest text-stone-500">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-stone-300" />;
}

function RankBadge({ rank }) {
  if (rank === 1)
    return (
      <div className="w-10 h-10 rounded-full bg-yellow-300 text-stone-900 flex items-center justify-center font-black shrink-0">
        <Crown size={18} />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-10 h-10 rounded-full bg-stone-300 text-stone-900 flex items-center justify-center font-black shrink-0">
        <Medal size={18} />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-black shrink-0">
        <Medal size={18} />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-stone-700 text-stone-300 flex items-center justify-center font-black shrink-0">
      {rank}
    </div>
  );
}

function ClipCard({ clip, voted, onVote, onPlay }) {
  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-stone-900 transition-all hover:-translate-y-1 hover:shadow-xl">
      <button onClick={onPlay} className="block w-full aspect-video bg-stone-100 relative group">
        <img src={clip.thumb} alt={clip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play size={22} className="text-stone-900 ml-1" fill="currentColor" />
          </div>
        </div>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-yellow-300 text-stone-900 text-[10px] font-black uppercase tracking-wider">
          {clip.tag}
        </span>
        {clip.type && clip.type !== "upload" && clip.type !== "link" && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            {clip.type === "youtube" ? "YouTube" : clip.type === "tiktok" ? "TikTok" : "Vimeo"}
          </span>
        )}
      </button>
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold leading-tight truncate">{clip.title}</h3>
          <div className="text-sm text-stone-500 truncate">{clip.author}</div>
        </div>
        <button
          onClick={onVote}
          className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all ${
            voted
              ? "bg-red-600 border-red-600 text-white"
              : "bg-white border-stone-300 text-stone-700 hover:border-red-600 hover:text-red-600"
          }`}
          aria-label="Vote"
        >
          <ChevronUp size={18} strokeWidth={3} />
          <span className="text-xs font-black leading-none mt-0.5">{clip.votes}</span>
        </button>
      </div>
    </article>
  );
}

function Step({ n, title, body }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xl mb-4 border-4 border-stone-900">
        {n}
      </div>
      <h3 className="text-xl font-black mb-2">{title}</h3>
      <p className="text-stone-600">{body}</p>
    </div>
  );
}

function SubmitModal({ onClose, onSubmit }) {
  const [mode, setMode] = useState("link");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tag, setTag] = useState("Pool");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [cachedMeta, setCachedMeta] = useState(null); // { url, thumb, title, handle }

  const FALLBACK_THUMB = "https://images.unsplash.com/photo-1551892589-865f69869476?w=800&q=80";

  // Triggered on blur of the URL field — auto-fill handle, title, thumbnail
  const handleLinkBlur = async () => {
    if (!link || (cachedMeta && cachedMeta.url === link.trim())) return;
    const parsed = parseVideoUrl(link);
    if (parsed.platform === "link") return; // unrecognised, skip
    setFetchingMeta(true);
    const meta = await fetchVideoMeta(link);
    setCachedMeta({ url: link.trim(), ...meta });
    if (meta.handle && !author) setAuthor(meta.handle);
    if (meta.title && !title) setTitle(meta.title);
    setFetchingMeta(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title || !author || submitting) return;
    setSubmitting(true);

    const parsed = parseVideoUrl(link);
    let thumb = FALLBACK_THUMB;

    if (mode === "link" && link) {
      // Use cached metadata if it matches, otherwise fetch fresh
      const meta = cachedMeta && cachedMeta.url === link.trim() ? cachedMeta : await fetchVideoMeta(link);
      if (meta.thumb) thumb = meta.thumb;
    }

    onSubmit({
      title,
      author: author.startsWith("@") ? author : `@${author}`,
      tag,
      type: mode === "link" ? parsed.platform : "upload",
      src: parsed.embedSrc,
      originalUrl: link,
      thumb,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h3 className="text-xl font-black">Submit your clip</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="flex gap-2 p-1 bg-stone-100 rounded-full">
            <button
              type="button"
              onClick={() => setMode("link")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition ${
                mode === "link" ? "bg-white shadow" : "text-stone-600"
              }`}
            >
              <LinkIcon size={14} /> Paste link
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition ${
                mode === "upload" ? "bg-white shadow" : "text-stone-600"
              }`}
            >
              <Upload size={14} /> Upload
            </button>
          </div>

          {mode === "link" ? (
            <Field label="YouTube, TikTok or Vimeo URL">
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={handleLinkBlur}
                placeholder="https://tiktok.com/@yourname/video/..."
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none"
              />
              {fetchingMeta && (
                <p className="mt-2 text-xs text-stone-500">Fetching video info…</p>
              )}
              {cachedMeta?.thumb && !fetchingMeta && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <img src={cachedMeta.thumb} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="text-xs text-stone-600 truncate">
                    <div className="font-semibold text-stone-900 truncate">{cachedMeta.title || "Video found"}</div>
                    {cachedMeta.handle && <div className="truncate">{cachedMeta.handle}</div>}
                  </div>
                </div>
              )}
            </Field>
          ) : (
            <Field label="Video file">
              <label className="block w-full px-4 py-6 rounded-xl border-2 border-dashed border-stone-300 hover:border-stone-900 cursor-pointer text-center">
                <Upload size={20} className="mx-auto mb-2 text-stone-500" />
                <div className="text-sm text-stone-600">
                  {fileName || "Tap to choose a video from your phone"}
                </div>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                />
              </label>
            </Field>
          )}

          <Field label="Clip title">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Insane long pot down the rail"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Your handle">
              <input
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="@yourname"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none"
              />
            </Field>
            <Field label="Category">
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none bg-white"
              >
                <option>Pool</option>
                <option>Snooker</option>
                <option>Trick</option>
              </select>
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Fetching thumbnail…" : "Submit clip"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function PlayerModal({ clip, onClose }) {
  const isVertical = clip.type === "tiktok";
  const isEmbeddable = ["youtube", "vimeo", "tiktok"].includes(clip.type) && clip.src;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-stone-900 w-full ${isVertical ? "max-w-md" : "max-w-3xl"} rounded-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 text-white">
          <div className="min-w-0">
            <div className="font-bold truncate">{clip.title}</div>
            <div className="text-sm text-stone-400 truncate">
              {clip.author} · {clip.tag} · {clip.votes} votes
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className={`${isVertical ? "aspect-[9/16]" : "aspect-video"} bg-black`}>
          {isEmbeddable ? (
            <iframe
              src={clip.src}
              title={clip.title}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : clip.originalUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 p-6 text-center gap-3">
              <p className="text-sm">Preview not available — open the original:</p>
              <a
                href={clip.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 break-all max-w-full"
              >
                Watch on source
              </a>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
              Video preview unavailable in demo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
