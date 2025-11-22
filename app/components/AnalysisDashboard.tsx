"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, TrendingUp, Target, Award, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface AnalysisResult {
    scores: {
        total: number;
        keyword_coverage: number;
        semantic_similarity: number;
        seniority_match: number;
    };
    gaps: {
        missing_keywords: string[];
        weak_matches: Array<{
            resume_term: string;
            jd_preference: string;
            reason: string;
        }>;
    };
    over_represented: string[];
    seniority_analysis: {
        jd_level: string;
        resume_level: string;
        status: "Match" | "Underqualified" | "Overqualified";
        reason: string;
    };
}

interface AnalysisDashboardProps {
    analysis: AnalysisResult;
}

export default function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 85) return "Excellent Match";
        if (score >= 70) return "Good Match";
        if (score >= 50) return "Moderate Gaps";
        return "Poor Match";
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                        "col-span-1 md:col-span-4 p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center",
                        getScoreColor(analysis.scores.total)
                    )}
                >
                    <h2 className="text-lg font-semibold uppercase tracking-wide opacity-80">Overall Match Score</h2>
                    <div className="text-6xl font-bold my-2">{Math.round(analysis.scores.total)}%</div>
                    <p className="font-medium text-lg">{getScoreLabel(analysis.scores.total)}</p>
                </motion.div>

                <ScoreCard
                    title="Keyword Coverage"
                    score={analysis.scores.keyword_coverage}
                    icon={<Target className="w-5 h-5" />}
                    delay={0.1}
                />
                <ScoreCard
                    title="Semantic Match"
                    score={analysis.scores.semantic_similarity}
                    icon={<TrendingUp className="w-5 h-5" />}
                    delay={0.2}
                />
                <ScoreCard
                    title="Seniority Match"
                    score={analysis.scores.seniority_match}
                    icon={<Award className="w-5 h-5" />}
                    delay={0.3}
                />
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Missing Keywords */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        Missing Critical Keywords
                    </h3>
                    {analysis.gaps.missing_keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {analysis.gaps.missing_keywords.map((keyword, idx) => (
                                <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" /> No critical keywords missing!
                        </p>
                    )}
                </motion.div>

                {/* Seniority Analysis */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Award className="w-5 h-5 text-blue-500 mr-2" />
                        Experience Level Assessment
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">JD Requirement</span>
                            <span className="font-medium text-gray-900">{analysis.seniority_analysis.jd_level}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">Your Profile</span>
                            <span className="font-medium text-gray-900">{analysis.seniority_analysis.resume_level}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-600">Assessment</span>
                            <span className={clsx(
                                "font-bold px-2 py-1 rounded text-sm",
                                analysis.seniority_analysis.status === "Match" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            )}>
                                {analysis.seniority_analysis.status}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Weak Matches */}
            {analysis.gaps.weak_matches.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                        Weak Terminology Matches
                    </h3>
                    <div className="space-y-4">
                        {analysis.gaps.weak_matches.map((match, idx) => (
                            <div key={idx} className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Your Resume</p>
                                        <p className="text-gray-800 font-medium">&quot;{match.resume_term}&quot;</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">JD Preference</p>
                                        <p className="text-green-700 font-medium">&quot;{match.jd_preference}&quot;</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-gray-600 italic border-t border-yellow-200 pt-2">
                                    Suggestion: {match.reason}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function ScoreCard({ title, score, icon, delay }: { title: string, score: number, icon: React.ReactNode, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center md:col-span-1" // Added md:col-span-1 explicitly, though grid handles it
        >
            <div className="p-2 bg-gray-100 rounded-full mb-2 text-gray-600">
                {icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(score)}%</div>
            <div className="text-sm text-gray-500">{title}</div>
        </motion.div>
    );
}
