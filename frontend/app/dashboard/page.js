"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function chooseFile(selectedFile) {
    if (!selectedFile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) { setError("Please choose a JPG, PNG, or WEBP image."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile); setPreview(URL.createObjectURL(selectedFile)); setResult(null); setError("");
  }

  async function analyzeImage() {
    if (!file) { setError("Choose an image before running DensePose."); return; }
    setLoading(true); setError("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch(`${API_URL}/predict`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "DensePose processing failed.");
      setResult(data);
    } catch (err) { setError(err.message || "Could not connect to the DensePose backend."); } finally { setLoading(false); }
  }

  function clearStudio() { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); setResult(null); setError(""); }

  return (
    <main className="studio-shell">
      <header className="studio-nav"><Link className="brand-mark" href="/"><span className="brand-dot" /> densepose<span className="brand-light">/lab</span></Link><div className="studio-nav-center"><span className="studio-live-dot" /> analysis studio <span className="studio-slash">/</span> image to surface</div><div className="studio-nav-actions"><Link className="back-link" href="/">← field notes</Link><button className="logout-button" type="button" onClick={signOut}>Log out <span>↗</span></button></div></header>
      <section className="studio-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> DensePose workspace</p><h1>Make the invisible<br /><em>legible.</em></h1></div><p className="studio-description">Upload a human image to generate a surface overlay, IUV representation, body-part map, and confidence readout.</p></section>
      <section className="studio-grid">
        <div className="upload-panel"><div className="panel-heading"><div><span className="panel-kicker">Input / 01</span><h2>Source image</h2></div>{file && <button className="quiet-button" onClick={clearStudio}>Clear</button>}</div>
          {!preview ? <label className={`drop-zone ${dragActive ? "drop-active" : ""}`} onDrop={(event) => { event.preventDefault(); setDragActive(false); chooseFile(event.dataTransfer.files[0]); }} onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files[0])} /><span className="upload-symbol">＋</span><strong>Drop an image to begin</strong><span>or browse from your device</span><small>JPG / PNG / WEBP · max clarity recommended</small></label> : <div className="preview-frame"><img src={preview} alt="Selected source" /><div className="file-chip">{file.name}</div></div>}
          {error && <p className="studio-error">{error}</p>}<button className="analyze-button" disabled={!file || loading} onClick={analyzeImage}>{loading ? <><span className="loading-ring" /> Mapping the surface...</> : <>Run DensePose <span>→</span></>}</button>
        </div>
        <aside className="studio-aside"><div className="aside-card"><span className="panel-kicker">Output layers</span><Layer number="01" title="DensePose overlay" copy="Surface mapped over the source." /><Layer number="02" title="IUV representation" copy="Index, U and V coordinates." /><Layer number="03" title="Body-part map" copy="A readable visual of regions." /></div><div className="aside-note"><span className="note-mark">✳</span><p>Best results come from a clear, full-body image with visible limbs.</p></div></aside>
      </section>
      {result ? <Results result={result} /> : <section className="empty-results"><span>Waiting for a subject</span><i>·</i><span>Your outputs will appear here</span></section>}
    </main>
  );
}

function Layer({ number, title, copy }) { return <div className="layer-row"><span className="layer-number">{number}</span><div><strong>{title}</strong><p>{copy}</p></div><span className="layer-arrow">↗</span></div>; }

function Results({ result }) {
  const images = [["DensePose overlay", result.results?.densepose_overlay], ["IUV representation", result.results?.iuv], ["Body-part map", result.results?.body_part_map], ["Body-part heatmap", result.results?.body_part_heatmap]].filter(([, src]) => src);
  return <section className="results-section"><div className="results-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Analysis complete</p><h2>Surface report</h2></div><div className="result-stats"><span><strong>{result.analysis?.people_detected ?? 0}</strong> people</span><span><strong>{result.analysis?.device?.toUpperCase() || "CPU"}</strong> device</span></div></div><div className="result-grid">{images.map(([title, src]) => <article className="result-card" key={title}><div><span>{title}</span><b>↗</b></div><img src={`${API_URL}${src}`} alt={title} /></article>)}</div></section>;
}
