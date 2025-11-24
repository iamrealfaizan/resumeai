// app/resume/page.tsx
"use client";

import { FormEvent, useState } from "react";

type ScoreBreakdown = {
    keywordCoverage: number;
    structure: number;
    length: number;
    overallSimilarity: number;
    total: number;
};

type AnalysisReport = {
    matchedKeywords: string[];
    missingKeywords: string[];
    structureFlags: string[];
    lengthNote: string | null;
    wordCount: number;
};

type ScoreResponse = {
    score: number;
    breakdown: ScoreBreakdown;
    suggestions: string[];
    analysis: AnalysisReport;
};

type OptimizeResponse = {
    optimizedResume: string;
    changesSummary: string[];
    expectedScoreBoost: number;
};

export default function ResumeScorerPage() {
    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [result, setResult] = useState<ScoreResponse | null>(null);

    const [optimized, setOptimized] = useState<OptimizeResponse | null>(null);

    // ------------------------------
    // SCORE HANDLER
    // ------------------------------
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setOptimized(null);

        const trimmedResume = resumeText.trim();
        const trimmedJD = jobDescription.trim();

        if (trimmedResume.length < 50 || trimmedJD.length < 50) {
            setError("Please provide at least a few sentences for both resume and job description.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "score",
                    resumeText: trimmedResume,
                    jobDescription: trimmedJD,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || `Request failed with status ${res.status}`);
            }

            const data: ScoreResponse = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Error scoring resume.");
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------
    // OPTIMIZER HANDLER
    // ------------------------------
    const handleOptimize = async () => {
        if (!result) return;

        setLoading(true);
        setOptimized(null);

        try {
            const res = await fetch("/api/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "optimize",
                    resumeText,
                    jobDescription,
                }),
            });

            const data: OptimizeResponse = await res.json();
            setOptimized(data);

        } catch (err: any) {
            setError(err.message || "Failed to optimize resume.");
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------
    const formatPoints = (points: number) => `${points.toFixed(1)}/100`;

    // ------------------------------

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-4xl px-4 py-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight">Resume Match Scorer</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Paste your resume and a job description. The system will analyze match quality,
                        generate a detailed report, and can automatically optimize your resume.
                    </p>
                </header>

                {/* INPUT FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="grid gap-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
                >
                    <div className="grid gap-2">
                        <label htmlFor="resume" className="text-sm font-medium text-slate-100">
                            Resume Text
                        </label>
                        <textarea
                            id="resume"
                            className="h-52 resize-vertical rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                            placeholder="Paste your resume text here..."
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                        />
                        <p className="text-xs text-slate-400">
                            (Prototype uses plain text. Production will support PDF/DOCX.)
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="jobDescription" className="text-sm font-medium text-slate-100">
                            Job Description
                        </label>
                        <textarea
                            id="jobDescription"
                            className="h-52 resize-vertical rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                            placeholder="Paste the job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-400 disabled:bg-indigo-700/50"
                        >
                            {loading ? "Scoring..." : "Score Resume"}
                        </button>

                        {result && (
                            <div className="text-sm text-slate-300">
                                Last score:{" "}
                                <span className="font-semibold text-indigo-400">
                                    {result.score.toFixed(1)} / 100
                                </span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-2 rounded-md border border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-100">
                            {error}
                        </div>
                    )}
                </form>

                {/* RESULTS */}
                {result && (
                    <>
                        {/* SCORE + SUGGESTIONS SECTION */}
                        <section className="mt-8 grid gap-6 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                                    Match Score
                                </h2>

                                <div className="mt-4">
                                    <div className="text-4xl font-semibold text-indigo-400">
                                        {result.score.toFixed(1)}
                                        <span className="text-lg text-slate-400"> / 100</span>
                                    </div>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Deterministic scoring — same resume + JD = same score.
                                    </p>
                                </div>

                                <div className="mt-4 space-y-1 text-xs text-slate-300">
                                    <div className="flex justify-between">
                                        <span>Keyword Coverage</span>
                                        <span>{formatPoints(result.breakdown.keywordCoverage)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Structure</span>
                                        <span>{formatPoints(result.breakdown.structure)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Length</span>
                                        <span>{formatPoints(result.breakdown.length)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Overall Similarity</span>
                                        <span>{formatPoints(result.breakdown.overallSimilarity)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleOptimize}
                                    disabled={loading}
                                    className="mt-5 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500 disabled:bg-emerald-800/40"
                                >
                                    {loading ? "Optimizing..." : "Optimize Resume"}
                                </button>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                                    Suggested Improvements
                                </h2>

                                {result.suggestions.length === 0 ? (
                                    <p className="mt-3 text-sm text-emerald-300">
                                        This resume is already strong.
                                    </p>
                                ) : (
                                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-100">
                                        {result.suggestions.map((s, idx) => (
                                            <li key={idx}>{s}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>

                        {/* DETAILED ANALYSIS */}
                        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                            <h2 className="text-lg font-semibold text-slate-200 mb-3">
                                Detailed Analysis Report
                            </h2>

                            <p className="text-sm text-slate-300">
                                <strong>Word Count:</strong> {result.analysis.wordCount}
                            </p>

                            <h3 className="mt-4 text-sm font-semibold text-slate-300">Matched Keywords</h3>
                            <p className="text-xs text-slate-400">
                                {result.analysis.matchedKeywords.join(", ") || "None"}
                            </p>

                            <h3 className="mt-4 text-sm font-semibold text-slate-300">Missing Keywords</h3>
                            <p className="text-xs text-red-300">
                                {result.analysis.missingKeywords.join(", ") || "None"}
                            </p>

                            <h3 className="mt-4 text-sm font-semibold text-slate-300">Structural Issues</h3>
                            <ul className="list-disc ml-5 text-sm text-amber-300">
                                {result.analysis.structureFlags.length === 0 ? (
                                    <li>No structural issues detected.</li>
                                ) : (
                                    result.analysis.structureFlags.map((f, i) => <li key={i}>{f}</li>)
                                )}
                            </ul>

                            {result.analysis.lengthNote && (
                                <>
                                    <h3 className="mt-4 text-sm font-semibold text-slate-300">Length Notes</h3>
                                    <p className="text-xs text-slate-400">{result.analysis.lengthNote}</p>
                                </>
                            )}
                        </section>

                        {/* OPTIMIZED RESUME OUTPUT */}
                        {optimized && (
                            <section className="mt-8 rounded-xl border border-emerald-600 bg-emerald-950/20 p-5">
                                <h2 className="text-lg font-semibold text-emerald-300">
                                    Optimized Resume (AI-Generated)
                                </h2>

                                <p className="text-sm text-emerald-200 mt-1">
                                    Expected Score Boost: +{optimized.expectedScoreBoost}
                                </p>

                                <h3 className="mt-4 font-semibold text-emerald-300">Summary of Changes</h3>
                                <ul className="list-disc ml-5 text-sm text-emerald-200">
                                    {optimized.changesSummary.map((c, i) => (
                                        <li key={i}>{c}</li>
                                    ))}
                                </ul>

                                <h3 className="mt-4 font-semibold text-emerald-300">Updated Resume</h3>
                                <pre className="mt-2 whitespace-pre-wrap text-sm text-emerald-100 bg-emerald-950/40 p-4 rounded-md">
                                    {optimized.optimizedResume}
                                </pre>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
