"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const analyzeImage = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "DensePose processing failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the DensePose backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              DensePose
            </h1>

            <p className="text-xs text-gray-500">
              Human Body Surface Mapper
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-green-400"></span>

            <span className="text-xs text-gray-400">
              API Ready
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-12 pt-16">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-400">
            DensePose · IUV Mapping · Body Part Analysis
          </div>

          <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Map the human body
            <br />
            <span className="text-gray-500">
              onto a canonical surface.
            </span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 text-gray-400">
            Upload an image and use a pretrained DensePose model
            to detect people, map visible body pixels to surface
            coordinates, and identify body regions.
          </p>
        </div>
      </section>

      {/* Main workspace */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          {/* Upload panel */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  Input image
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Upload a clear image containing one or more people.
                </p>
              </div>

              {file && (
                <button
                  onClick={clearAll}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {!preview ? (
              <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex min-h-[430px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed transition ${
                  dragActive
                    ? "border-white/50 bg-white/[0.08]"
                    : "border-white/15 bg-black/30 hover:border-white/30 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 16V4" />
                    <path d="m7 9 5-5 5 5" />
                    <path d="M5 20h14" />
                  </svg>
                </div>

                <p className="text-sm text-gray-300">
                  Drop your image here
                </p>

                <p className="mt-2 text-xs text-gray-600">
                  or click to browse
                </p>

                <p className="mt-5 text-[11px] uppercase tracking-wider text-gray-600">
                  JPG · PNG · WEBP
                </p>
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                <img
                  src={preview}
                  alt="Uploaded person"
                  className="mx-auto max-h-[600px] w-full object-contain"
                />

                <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-xs text-gray-300 backdrop-blur">
                  {file.name}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={analyzeImage}
              disabled={!file || loading}
              className="mt-5 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black"></span>
                  Running DensePose...
                </span>
              ) : (
                "Analyze with DensePose"
              )}
            </button>
          </div>

          {/* Information panel */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-widest text-gray-600">
                How it works
              </p>

              <div className="mt-6 space-y-5">
                <InfoStep
                  number="01"
                  title="Human Detection"
                  description="Detects people present in the input image."
                />

                <InfoStep
                  number="02"
                  title="Surface Mapping"
                  description="Maps visible human pixels onto a canonical body surface."
                />

                <InfoStep
                  number="03"
                  title="IUV Representation"
                  description="Generates body-part index and UV surface coordinates."
                />

                <InfoStep
                  number="04"
                  title="Body Analysis"
                  description="Summarizes detected body regions and confidence."
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-widest text-gray-600">
                IUV
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <Metric
                  letter="I"
                  title="Index"
                  description="Body part"
                />

                <Metric
                  letter="U"
                  title="Horizontal"
                  description="Surface coordinate"
                />

                <Metric
                  letter="V"
                  title="Vertical"
                  description="Surface coordinate"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      {result && (
        <section className="border-t border-white/10 bg-black/40">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-gray-600">
                Analysis complete
              </p>

              <h3 className="mt-2 text-3xl font-semibold">
                DensePose results
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Visualizations generated by the DensePose backend.
              </p>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="People detected"
                value={result.analysis.people_detected}
              />

              <StatCard
                label="Device"
                value={result.analysis.device.toUpperCase()}
              />

              <StatCard
                label="Body parts"
                value={
                  result.analysis.people?.[0]
                    ?.visible_body_parts?.length || 0
                }
              />
            </div>

            {/* Visualization grid */}
            <div className="grid gap-5 md:grid-cols-2">
              <ResultCard
                title="DensePose Overlay"
                description="DensePose surface mapping over the original image."
                src={`${API_URL}${result.results.densepose_overlay}`}
              />

              <ResultCard
                title="IUV Representation"
                description="I = body part, U/V = canonical surface coordinates."
                src={`${API_URL}${result.results.iuv}`}
              />

              <ResultCard
                title="Body Part Map"
                description="Color-coded representation of DensePose body regions."
                src={`${API_URL}${result.results.body_part_map}`}
              />

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="mb-5">
                  <h4 className="font-medium">
                    Detected body regions
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Visible regions identified by DensePose.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {result.analysis.people?.[0]?.visible_body_parts?.map(
                    (part) => (
                      <span
                        key={part}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-300"
                      >
                        {part.replaceAll("_", " ")}
                      </span>
                    )
                  )}
                </div>

                {result.analysis.people?.[0] && (
                  <div className="mt-8 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Detection confidence
                      </span>

                      <span className="text-sm font-medium">
                        {(
                          result.analysis.people[0].confidence * 100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${
                            result.analysis.people[0].confidence *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-gray-600 sm:flex-row">
          <p>
            DensePose Human Body Surface Mapper
          </p>

          <p>
            Detectron2 · DensePose · FastAPI · Next.js
          </p>
        </div>
      </footer>
    </main>
  );
}


/* ---------------- Components ---------------- */

function InfoStep({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[10px] text-gray-500">
        {number}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-200">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-gray-600">
          {description}
        </p>
      </div>
    </div>
  );
}


function Metric({ letter, title, description }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs font-semibold">
        {letter}
      </div>

      <p className="mt-4 text-xs font-medium text-gray-300">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-gray-600">
        {description}
      </p>
    </div>
  );
}


function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-xs text-gray-600">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}


function ResultCard({ title, description, src }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 p-5">
        <h4 className="font-medium">
          {title}
        </h4>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>

      <div className="bg-black p-4">
        <img
          src={src}
          alt={title}
          className="mx-auto max-h-[550px] w-full object-contain"
        />
      </div>
    </div>
  );
}