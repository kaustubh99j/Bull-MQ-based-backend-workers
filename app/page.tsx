"use client";

import { useEffect, useState } from "react";

interface Document {
  id: string;
  originalName: string;
  status: string;
  progress: number;
  extractedText: string | null;
  createdAt: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const [documents, setDocuments] = useState<Document[]>(
    []
  );

  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");

  async function loadDocuments() {
    try {
      const response = await fetch("/api/documents", {
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(
          "Failed to load documents:",
          response.status
        );
        return;
      }

      const data = await response.json();

      setDocuments(data.documents || []);
    } catch (error) {
      console.error(
        "Failed to fetch documents:",
        error
      );
    }
  }

  async function uploadDocument() {
    if (!file) {
      setMessage("Please select a PDF");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      console.log("Uploading:", file.name);

      const response = await fetch(
        "/api/documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Upload response:", data);

      if (!response.ok) {
        throw new Error(
          data.error || "Upload failed"
        );
      }

      setMessage(
        `Uploaded successfully. Job ID: ${data.jobId}`
      );

      setFile(null);

      const fileInput =
        document.getElementById(
          "pdf-upload"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();
    } catch (error) {
      console.error("Upload failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    loadDocuments();

    const interval = setInterval(
      loadDocuments,
      2000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Background */}

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617 55%)] px-6 py-12">

        <div className="mx-auto max-w-5xl">

          {/* Header */}

          <header className="mb-10">

            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                DocFlow
              </h1>

            </div>

            <p className="max-w-2xl text-lg leading-7 text-slate-300">
              Asynchronous document processing
              powered by{" "}
              <span className="font-semibold text-blue-400">
                BullMQ
              </span>
              , Redis and PostgreSQL.
            </p>

          </header>

          {/* Upload Card */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur">

            <div className="mb-6">

              <h2 className="text-xl font-semibold text-white">
                Upload Document
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Upload a PDF and DocFlow will process it
                asynchronously.
              </p>

            </div>

            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-8">

              <div className="flex flex-col items-center justify-center text-center">

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">

                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>

                </div>

                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:border-blue-500 hover:bg-slate-700"
                >
                  Choose PDF

                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      setFile(
                        event.target.files?.[0] ||
                          null
                      );
                    }}
                    className="hidden"
                  />
                </label>

                <p className="mt-3 text-xs text-slate-500">
                  PDF files only
                </p>

                {file && (
                  <div className="mt-5 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">

                    <div className="rounded-md bg-red-500/10 p-2 text-red-400">

                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>

                    </div>

                    <div className="text-left">

                      <p className="max-w-xs truncate text-sm font-medium text-white">
                        {file.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(
                          2
                        )}{" "}
                        MB
                      </p>

                    </div>

                  </div>
                )}

                <button
                  onClick={uploadDocument}
                  disabled={uploading || !file}
                  className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload PDF"}
                </button>

                {message && (
                  <div className="mt-5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200">
                    {message}
                  </div>
                )}

              </div>

            </div>

          </section>

          {/* Documents */}

          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur">

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-semibold text-white">
                  Documents
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Track document processing in real time.
                </p>

              </div>

              <div className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                {documents.length}{" "}
                {documents.length === 1
                  ? "document"
                  : "documents"}
              </div>

            </div>

            {documents.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-6 py-12 text-center">

                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">

                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>

                </div>

                <p className="font-medium text-slate-300">
                  No documents yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Upload your first PDF to get started.
                </p>

              </div>
            )}

            <div className="space-y-4">

              {documents.map((document) => {

                const statusColor =
                  document.status === "COMPLETED"
                    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                    : document.status === "FAILED"
                    ? "text-red-400 bg-red-400/10 border-red-400/20"
                    : document.status === "PROCESSING"
                    ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                    : "text-amber-400 bg-amber-400/10 border-amber-400/20";

                return (
                  <div
                    key={document.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-slate-700"
                  >

                    {/* Document header */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">

                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>

                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-white">
                            {document.originalName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Document ID: {document.id}
                          </p>

                        </div>

                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}
                      >
                        {document.status}
                      </span>

                    </div>

                    {/* Progress */}

                    <div className="mt-6">

                      <div className="mb-2 flex items-center justify-between text-xs">

                        <span className="font-medium text-slate-400">
                          Processing progress
                        </span>

                        <span className="font-semibold text-white">
                          {document.progress}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            document.status ===
                            "COMPLETED"
                              ? "bg-emerald-500"
                              : document.status ===
                                "FAILED"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${document.progress}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* Extracted text */}

                    {document.extractedText && (
                      <details className="mt-5">

                        <summary className="cursor-pointer text-sm font-semibold text-blue-400 transition hover:text-blue-300">
                          View extracted text
                        </summary>

                        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
                          {document.extractedText}
                        </pre>

                      </details>
                    )}

                  </div>
                );
              })}

            </div>

          </section>

          {/* Footer */}

          <footer className="py-8 text-center text-xs text-slate-600">
            DocFlow · Next.js · BullMQ · Redis · PostgreSQL
          </footer>

        </div>

      </div>

    </main>
  );
}
