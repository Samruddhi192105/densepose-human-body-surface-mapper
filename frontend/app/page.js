"use client";

import Link from "next/link";

const heroVideo =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/24f3c998-86fb-4f1d-9906-07c7fa740f8a.mp4";

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="site-nav">
        <Link className="brand-mark" href="/"><span className="brand-dot" />densepose<span className="brand-light">/lab</span></Link>
        <div className="nav-links"><a href="#method">Method</a><Link className="nav-cta" href="/dashboard">Open studio <span>↗</span></Link></div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> Computer vision / 01</p>
          <h1>See the body<br /><em>as a surface.</em></h1>
          <p className="hero-lede">DensePose turns a photograph into a living map of the human form. Detect people, locate every visible region, and read the body in IUV space.</p>
          <div className="hero-actions"><Link className="primary-action" href="/dashboard">Start mapping <span>→</span></Link><a className="text-action" href="#method">Explore the method <span>↓</span></a></div>
        </div>
        <div className="hero-figure" aria-label="Interactive DensePose human figure">
          <div className="figure-orbit orbit-one" /><div className="figure-orbit orbit-two" />
          <video className="hero-video" muted playsInline loop autoPlay preload="auto" src={heroVideo} />
          <div className="figure-label label-top"><span>00</span> Surface / 3D</div><div className="figure-label label-bottom"><span className="signal-dot" /> Live reference<br /><strong>human / 01</strong></div><div className="figure-crosshair crosshair-one" /><div className="figure-crosshair crosshair-two" />
        </div>
        <div className="hero-index">01 <span>/</span> 04</div><div className="scroll-cue"><span /> Scroll to investigate</div>
      </section>

      <section className="method-section" id="method"><div className="section-intro"><p className="eyebrow"><span className="eyebrow-line" /> The method</p><h2>A new coordinate<br /><em>system for people.</em></h2></div><div className="method-grid"><MethodCard number="01" title="Detect" copy="Find every person in the frame and isolate the visual evidence that matters." accent="orange" /><MethodCard number="02" title="Map" copy="Project visible pixels onto a canonical human surface with DensePose IUV coordinates." accent="blue" /><MethodCard number="03" title="Understand" copy="Read body regions, confidence, and heatmaps from a single image." accent="green" /></div></section>
      <footer className="site-footer"><span>DensePose / Human body surface mapper</span><span>Detectron2 · FastAPI · Next.js</span></footer>
    </main>
  );
}

function MethodCard({ number, title, copy, accent }) {
  return <article className={`method-card method-${accent}`}><div className="method-card-top"><span>{number}</span><span>↗</span></div><div className="method-glyph" aria-hidden="true"><i /><i /><i /><i /></div><h3>{title}</h3><p>{copy}</p></article>;
}
