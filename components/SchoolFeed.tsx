"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  MessageSquare, 
  ThumbsUp, 
  Flag, 
  Send, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  author_username: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_pfp?: string;
  is_anonymous: boolean;
  content: string;
  upvotes: number;
  has_upvoted?: boolean;
  comments: Comment[];
  created_at: string;
}

export default function SchoolFeed({ profile }: { profile: any }) {
  const supabase = createClientComponentClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [isAnonymousPost, setIsAnonymousPost] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [flaggedPosts, setFlaggedPosts] = useState<{ [postId: string]: boolean }>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (full_name, username, avatar_url),
        post_comments (*),
        post_upvotes (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else if (data) {
      const formattedPosts: Post[] = data.map((item: any) => ({
        id: item.id,
        author_id: item.author_id,
        author_name: item.profiles?.full_name || "Student",
        author_username: item.profiles?.username || "student",
        author_pfp: item.profiles?.avatar_url,
        is_anonymous: item.is_anonymous,
        content: item.content,
        upvotes: item.upvotes_count || item.post_upvotes?.length || 0,
        has_upvoted: item.post_upvotes?.some((u: any) => u.user_id === profile?.id),
        comments: (item.post_comments || []).map((c: any) => ({
          id: c.id,
          author_name: c.author_name || "Student",
          author_username: c.author_username || "student",
          content: c.content,
          created_at: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
        created_at: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      setPosts(formattedPosts);
    }
    setLoading(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !profile) return;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: profile.id,
        content: newPostContent.trim(),
        is_anonymous: isAnonymousPost,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
    } else {
      const newPost: Post = {
        id: data.id,
        author_id: profile.id,
        author_name: profile.full_name || "Student",
        author_username: profile.username || "student",
        author_pfp: profile.avatar_url,
        is_anonymous: isAnonymousPost,
        content: newPostContent.trim(),
        upvotes: 0,
        has_upvoted: false,
        comments: [],
        created_at: "Just now",
      };

      setPosts([newPost, ...posts]);
      setNewPostContent("");
      setIsAnonymousPost(false);
    }
  };

  const handleToggleUpvote = async (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost || !profile) return;

    const newHasUpvoted = !targetPost.has_upvoted;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              has_upvoted: newHasUpvoted,
              upvotes: newHasUpvoted ? p.upvotes + 1 : p.upvotes - 1,
            }
          : p
      )
    );

    if (newHasUpvoted) {
      await supabase.from("post_upvotes").insert({ post_id: postId, user_id: profile.id });
      
      // Award +1 Aura to post author
      if (targetPost.author_id !== profile.id) {
        await supabase.rpc("increment_aura", { target_user_id: targetPost.author_id, amount: 1 });
      }
    } else {
      await supabase.from("post_upvotes").delete().eq("post_id", postId).eq("user_id", profile.id);
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim() || !profile) return;

    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        author_id: profile.id,
        author_name: profile.full_name || "Student",
        author_username: profile.username || "student",
        content: commentText.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding comment:", error);
    } else {
      const newComment: Comment = {
        id: data.id,
        author_name: profile.full_name || "Student",
        author_username: profile.username || "student",
        content: commentText.trim(),
        created_at: "Just now",
      };

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
      );

      setCommentInputs({ ...commentInputs, [postId]: "" });
    }
  };

  const handleFlagPost = (postId: string) => {
    setFlaggedPosts((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <div className="w-full max-w-lg space-y-6">
      
      {/* Post Creation Box */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-extrabold text-white">Share with your school</h3>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's happening on campus today?"
            className="w-full h-24 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymousPost}
                onChange={(e) => setIsAnonymousPost(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-400">🕵️ Post Anonymously</span>
            </label>

            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className="py-2 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold shadow-lg disabled:opacity-40 transition flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="text-center text-xs text-slate-500 animate-pulse py-4">
          Loading Feed Posts...
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isFlagged = flaggedPosts[post.id];
            const isExpanded = expandedPostId === post.id;

            if (isFlagged) {
              return (
                <div key={post.id} className="p-4 rounded-2xl bg-slate-900/40 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-semibold">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
                  This post has been reported and hidden for review.
                </div>
              );
            }

            return (
              <div
                key={post.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {post.is_anonymous ? (
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                        🕵️
                      </div>
                    ) : (
                      <img
                        src={post.author_pfp || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author_username}`}
                        alt="PFP"
                        className="w-10 h-10 rounded-2xl bg-slate-950 object-cover border border-slate-700"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {post.is_anonymous ? "Anonymous Student" : post.author_name}
                        </span>
                        {post.is_anonymous && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Hidden
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {!post.is_anonymous && `@${post.author_username} • `}{post.created_at}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFlagPost(post.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition rounded-xl hover:bg-white/5"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>

                {/* Post Content */}
                <p className="text-sm text-slate-200 font-medium leading-relaxed">
                  {post.content}
                </p>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleUpvote(post.id)}
                      className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition ${
                        post.has_upvoted
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                          : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${post.has_upvoted ? "fill-cyan-300" : ""}`} />
                      <span>{post.upvotes}</span>
                      <span className="text-[10px] font-semibold opacity-70">+1 Aura</span>
                    </button>

                    <button
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comments.length} Comments</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {isExpanded && (
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="space-y-2">
                      {post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <div key={comment.id} className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-indigo-300">{comment.author_name}</span>
                              <span className="text-[10px] text-slate-500">{comment.created_at}</span>
                            </div>
                            <p className="text-xs text-slate-300">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic text-center py-2">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>

                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Write a reply..."
                        className="flex-1 py-2 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-30 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
