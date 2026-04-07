"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import {
  getPosts, savePosts, getMyTag, getMyStage, saveMyStage,
  createPost, createReply, formatTimeAgo, detectCrisis,
  CARE_STAGES, type ForumPost,
} from "@/lib/forum";

const CRISIS_RESOURCES = (
  <div className="mt-3 p-3 rounded-xl bg-[#1A0D0D] border border-[#8B5A5A]/30 text-xs text-[#D4CEBD] leading-relaxed">
    If you or someone is in immediate danger, please reach out:
    <br />
    <a href="tel:988" className="text-[#B2AC88] hover:underline">988</a> — Suicide & Crisis Lifeline &nbsp;|&nbsp;
    <a href="tel:18552273640" className="text-[#B2AC88] hover:underline">1-855-227-3640</a> — Caregiver Crisis Line
  </div>
);

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [myTag, setMyTag] = useState("");
  const [myStage, setMyStage] = useState(CARE_STAGES[5]);
  const [newPost, setNewPost] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [stagePickerOpen, setStagePickerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [weeklyDigest] = useState(
    "This week, 34 caregivers shared that nighttime restlessness got harder. You are not alone in those 3am moments."
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPosts(getPosts());
    setMyTag(getMyTag());
    setMyStage(getMyStage());
  }, []);

  function submitPost() {
    if (!newPost.trim()) return;
    const post = createPost(newPost.trim(), myStage);
    const updated = [post, ...posts];
    setPosts(updated);
    savePosts(updated);
    setNewPost("");
    setExpandedPost(post.id);
    if (post.hasCrisis) {
      getAIReply(post.id, post.content, updated);
    }
  }

  function submitReply(postId: string) {
    if (!replyText.trim()) return;
    const reply = createReply(replyText.trim());
    const updated = posts.map((p) =>
      p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
    );
    setPosts(updated);
    savePosts(updated);
    setReplyText("");
    setReplyingTo(null);
    if (detectCrisis(replyText)) {
      getAIReply(postId, replyText, updated);
    }
  }

  async function getAIReply(postId: string, triggerText: string, currentPosts: ForumPost[]) {
    setAiLoading(postId);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: triggerText }],
          context: { riskLevel: "crisis", zbiAnswers: [], dominantThemes: [] },
        }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
      }
      const aiReply = createReply(full.trim(), true);
      const updated = currentPosts.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, aiReply] } : p
      );
      setPosts(updated);
      savePosts(updated);
    } finally {
      setAiLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#090d15] pt-20 pb-16 px-4">
      <Navbar />
      <div className="max-w-2xl mx-auto">

        <div className="mb-6" style={{ animation: "fadeUp 0.6s ease-out forwards", opacity: 0 }}>
          <p className="text-xs tracking-[0.2em] text-[#B2AC88] uppercase mb-1">Community</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl text-[#F5F0E8] font-light mb-2">
            The Circle
          </h1>
          <p className="text-[#A09890] text-sm">Anonymous by default. Purpose-built for caregivers. You are not alone.</p>
        </div>

        <div className="bg-[#0D2137]/60 border border-[#B2AC88]/10 rounded-2xl p-4 mb-5 text-xs text-[#A09890] leading-relaxed">
          <span className="text-[#B2AC88] font-medium">This week: </span>{weeklyDigest}
        </div>

        <div className="bg-[#0D2137] border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#B2AC88]/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#B2AC88]/60" />
              </div>
              <span className="text-[#D4CEBD] text-xs">{myTag}</span>
            </div>
            <button
              onClick={() => setStagePickerOpen((p) => !p)}
              className="text-xs text-[#A09890] hover:text-[#B2AC88] transition-colors border border-white/10 rounded-lg px-2 py-1">
              {myStage}
            </button>
          </div>

          {stagePickerOpen && (
            <div className="mb-3 flex flex-col gap-1">
              {CARE_STAGES.map((s) => (
                <button key={s}
                  onClick={() => { saveMyStage(s); setMyStage(s); setStagePickerOpen(false); }}
                  className={`text-left text-xs px-3 py-2 rounded-lg transition-all ${
                    myStage === s
                      ? "bg-[#B2AC88]/20 text-[#F5F0E8]"
                      : "text-[#A09890] hover:bg-white/5 hover:text-[#D4CEBD]"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share what's on your mind. No names, no judgment."
            rows={3}
            className="w-full bg-transparent text-[#D4CEBD] placeholder-[#A09890]/60 text-sm resize-none outline-none leading-relaxed"
          />

          {detectCrisis(newPost) && CRISIS_RESOURCES}

          <div className="flex justify-end mt-3">
            <button
              onClick={submitPost}
              disabled={!newPost.trim()}
              className="px-4 py-2 rounded-xl bg-[#B2AC88]/20 hover:bg-[#B2AC88]/30 disabled:opacity-30 transition-all text-[#F5F0E8] text-xs border border-[#B2AC88]/20">
              Share with the circle
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {posts.map((post) => {
            const isExpanded = expandedPost === post.id;
            const similarStage = post.careStage === myStage && post.authorTag !== myTag;

            return (
              <div key={post.id} className="bg-[#0D2137] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#B2AC88]/15 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#B2AC88]/50" />
                      </div>
                      <span className="text-[#A09890] text-xs">{post.authorTag}</span>
                      <span className="text-[#A09890]/40 text-xs">·</span>
                      <span className="text-[#A09890]/60 text-xs">{formatTimeAgo(post.timestamp)}</span>
                    </div>
                    <span className="text-[10px] text-[#A09890]/50 border border-white/5 rounded-lg px-2 py-0.5 flex-shrink-0">
                      {post.careStage}
                    </span>
                  </div>

                  {similarStage && (
                    <p className="text-[10px] text-[#B2AC88]/60 mb-2 italic">
                      You're both navigating {post.careStage.toLowerCase()}.
                    </p>
                  )}

                  <p className="text-[#D4CEBD] text-sm leading-relaxed">{post.content}</p>

                  {post.hasCrisis && CRISIS_RESOURCES}

                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => { setExpandedPost(isExpanded ? null : post.id); setReplyingTo(null); }}
                      className="text-xs text-[#A09890] hover:text-[#B2AC88] transition-colors">
                      {post.replies.length > 0
                        ? `${post.replies.length} ${post.replies.length === 1 ? "response" : "responses"}`
                        : "Be the first to respond"}
                    </button>
                    <button
                      onClick={() => {
                        setExpandedPost(post.id);
                        setReplyingTo(post.id);
                      }}
                      className="text-xs text-[#A09890] hover:text-[#B2AC88] transition-colors">
                      Respond
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5">
                    {post.replies.map((reply) => (
                      <div key={reply.id}
                        className={`px-4 py-3 border-b border-white/5 last:border-b-0 ${reply.isAI ? "bg-[#B2AC88]/5" : ""}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${reply.isAI ? "bg-[#B2AC88]/20" : "bg-white/5"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${reply.isAI ? "bg-[#B2AC88]" : "bg-white/30"}`} />
                          </div>
                          <span className={`text-xs ${reply.isAI ? "text-[#B2AC88]" : "text-[#A09890]"}`}>
                            {reply.authorTag}
                          </span>
                          <span className="text-[#A09890]/40 text-xs">·</span>
                          <span className="text-[#A09890]/60 text-xs">{formatTimeAgo(reply.timestamp)}</span>
                        </div>
                        <p className="text-[#D4CEBD] text-sm leading-relaxed pl-7">{reply.content}</p>
                      </div>
                    ))}

                    {aiLoading === post.id && (
                      <div className="px-4 py-3 bg-[#B2AC88]/5 flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#B2AC88]/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#B2AC88]" />
                        </div>
                        <span className="inline-flex gap-1">
                          <span className="w-1 h-1 bg-[#B2AC88] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1 h-1 bg-[#B2AC88] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1 h-1 bg-[#B2AC88] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      </div>
                    )}

                    {replyingTo === post.id && (
                      <div className="px-4 py-3 border-t border-white/5">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Share your response..."
                          rows={2}
                          className="w-full bg-transparent text-[#D4CEBD] placeholder-[#A09890]/60 text-sm resize-none outline-none leading-relaxed"
                        />
                        {detectCrisis(replyText) && CRISIS_RESOURCES}
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            className="text-xs text-[#A09890] hover:text-[#D4CEBD] transition-colors px-3 py-1.5">
                            Cancel
                          </button>
                          <button
                            onClick={() => submitReply(post.id)}
                            disabled={!replyText.trim()}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#B2AC88]/20 hover:bg-[#B2AC88]/30 disabled:opacity-30 transition-all text-[#F5F0E8] border border-[#B2AC88]/20">
                            Post response
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}