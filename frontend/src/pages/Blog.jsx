import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { api } from "../lib/api";

export function BlogList() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    api.get("/blog/posts").then(({ data }) => setPosts(data));
    document.title = "PalmMitra Journal — Insights on AI Life Guidance";
  }, []);
  return (
    <div className="min-h-screen bg-black text-white" data-testid="blog-page">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Journal</p>
        <h1 className="hero-headline text-5xl mt-3">Ideas worth carrying.</h1>
        <p className="mt-4 text-white/60 max-w-xl">Craft, science, and quiet wisdom from the PalmMitra team.</p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              data-testid={`blog-card-${p.slug}`}
              className="group rounded-3xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden hover:border-[#D4AF37]/40 transition-colors"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={p.cover} alt={p.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">{p.date}</p>
                <h3 className="font-serif text-xl mt-2 group-hover:text-[#D4AF37] transition-colors">{p.title}</h3>
                <p className="text-sm text-white/60 mt-2 leading-relaxed">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  useEffect(() => {
    api.get(`/blog/posts/${slug}`).then(({ data }) => {
      setPost(data);
      document.title = `${data.title} — PalmMitra Journal`;
      const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
      meta.content = data.excerpt;
    });
  }, [slug]);

  if (!post) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white" data-testid="blog-post-page">
      <Nav />
      <article className="max-w-3xl mx-auto px-6 sm:px-10 py-16">
        <Link to="/blog" className="text-xs text-white/40 hover:text-white/70">← Journal</Link>
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mt-8">{post.date}</p>
        <h1 className="hero-headline text-4xl sm:text-5xl mt-3">{post.title}</h1>
        <p className="mt-4 text-white/60 text-lg">{post.excerpt}</p>
        <div className="mt-10 aspect-[16/9] rounded-3xl overflow-hidden">
          <img src={post.cover} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="mt-12 space-y-6 text-white/80 leading-[1.85]">
          {post.content.split("\n\n").map((para, i) => {
            if (para.startsWith("## ")) return <h2 key={i} className="font-serif text-2xl text-white mt-8">{para.slice(3)}</h2>;
            return <p key={i} className="whitespace-pre-wrap">{para}</p>;
          })}
        </div>
      </article>
      <Footer />
    </div>
  );
}
