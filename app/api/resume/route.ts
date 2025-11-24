// app/api/resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ------------------------------
// Gemini Setup
// ------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ------------------------------
type ScoreRequest = {
    action: "score" | "optimize";
    resumeText: string;
    jobDescription: string;
};

// ------------------------------
type AnalysisReport = {
    matchedKeywords: string[];
    missingKeywords: string[];
    structureFlags: string[];
    lengthNote: string | null;
    wordCount: number;
};

// ------------------------------
type ScoreBreakdown = {
    keywordCoverage: number;
    structure: number;
    length: number;
    overallSimilarity: number;
    total: number;
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

// ------------------------------
const STOPWORDS = new Set<string>([
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with", "at",
    "by", "from", "as", "is", "are", "was", "were", "this", "that", "it",
    "be", "will", "can", "your", "you", "we", "our", "they", "their", "but",
    "about",
]);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9+#]+/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

// ------------------------------
// Keyword Extraction
// ------------------------------
function extractKeywordsFromJD(jdText: string): string[] {
    const tokens = tokenize(jdText);
    const keywords = new Set<string>();
    for (const t of tokens) if (t.length >= 4) keywords.add(t);
    return Array.from(keywords);
}

// ------------------------------
// Keyword Match Scoring
// ------------------------------
function computeKeywordCoverageScore(
    jdKeywords: string[],
    resumeTokens: Set<string>
) {
    const matched: string[] = [];
    const missing: string[] = [];

    jdKeywords.forEach((kw) => {
        if (resumeTokens.has(kw)) matched.push(kw);
        else missing.push(kw);
    });

    const coverage = matched.length / (jdKeywords.length || 1);
    const score = Math.round(coverage * 55 * 10) / 10;

    return { score, matched, missing };
}

// ------------------------------
// Structure Scoring
// ------------------------------
function computeStructureScore(resumeText: string) {
    const lower = resumeText.toLowerCase();
    const flags: string[] = [];
    let points = 0;

    const hasExperience = lower.includes("experience") || lower.includes("work history");
    const hasEducation = lower.includes("education");
    const hasSkills = lower.includes("skills");
    const hasSummary = lower.includes("summary") || lower.includes("objective");
    const hasContact = lower.includes("email") || lower.includes("phone") || lower.includes("contact");

    if (hasExperience) points += 4; else flags.push("Missing Work Experience section.");
    if (hasEducation) points += 4; else flags.push("Missing Education section.");
    if (hasSkills) points += 4; else flags.push("Missing Skills section.");
    if (hasSummary) points += 4; else flags.push("Missing Summary/Profile section.");
    if (hasContact) points += 4; else flags.push("Missing contact info.");

    const score = Math.round(points * 10) / 10;
    return { score, flags };
}

// ------------------------------
// Length Scoring
// ------------------------------
function computeLengthScore(tokens: string[]) {
    const wc = tokens.length;
    let score = 0;
    let note: string | null = null;

    if (wc >= 300 && wc <= 900) score = 15;
    else if (wc >= 200 && wc < 300) { score = 9; note = "Resume is short."; }
    else if (wc > 900 && wc <= 1300) { score = 9; note = "Resume is long."; }
    else if (wc < 200) { score = 5; note = "Resume is very short."; }
    else { score = 5; note = "Resume is very long."; }

    return { score, note };
}

function computeOverallSimilarityScore(jdKeywords: string[], resumeTokens: Set<string>) {
    const jdSet = new Set(jdKeywords);
    let intersection = 0;

    jdKeywords.forEach((kw) => {
        if (resumeTokens.has(kw)) intersection++;
    });

    const union = new Set([...jdSet, ...resumeTokens]).size;
    const similarity = intersection / union;

    const score = Math.round(similarity * 10 * 10) / 10;
    return { score };
}

// ------------------------------
// Suggestions Builder
// ------------------------------
function buildSuggestions({
    keywordScore,
    missingKeywords,
    structureFlags,
    lengthNote,
    overallSimilarityScore,
}: any): string[] {
    const suggestions: string[] = [];

    if (keywordScore < 40 && missingKeywords.length)
        suggestions.push(`Missing important keywords: ${missingKeywords.slice(0, 10).join(", ")}`);

    suggestions.push(...structureFlags);

    if (lengthNote) suggestions.push(lengthNote);

    if (overallSimilarityScore < 5)
        suggestions.push("Increase alignment with job responsibilities by reflecting similar terminology.");

    return suggestions.length ? suggestions : ["This resume is strong. Add measurable achievements for extra polish."];
}

// ------------------------------
// Gemini Optimizer
// ------------------------------
async function optimizeResume(resume: string, jd: string, missingKeywords: string[], suggestions: string[]) {
    const prompt = `
You are an ATS resume optimization assistant.

Rewrite the following resume to match the job description **without inventing fake experiences**.

Rules:
- Keep only real experience
- Add missing keywords naturally where appropriate
- Improve phrasing and structure
- Add measurable achievements where possible (but realistic)
- Maintain professional ATS-friendly formatting (plain text)
- Fix structure issues (skills, summary, education, experience)
- DO NOT hallucinate new jobs, dates, or education

Resume:
${resume}

Job Description:
${jd}

Missing Keywords:
${missingKeywords.join(", ")}

Structural + improvement suggestions:
${suggestions.join("\n")}

Return output in this JSON format:
{
  "resume": "...optimized resume text...",
  "changes": ["change1", "change2"]
}
    `;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    try {
        return JSON.parse(text);
    } catch {
        return {
            resume: text,
            changes: ["Optimized using Gemini"]
        };
    }
}

// ------------------------------
// POST Handler
// ------------------------------
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ScoreRequest;
        const { action, resumeText, jobDescription } = body;

        // Shared scoring pipeline
        const jdKeywords = extractKeywordsFromJD(jobDescription);
        const resumeTokens = tokenize(resumeText);
        const resumeTokenSet = new Set(resumeTokens);

        const keywordInfo = computeKeywordCoverageScore(jdKeywords, resumeTokenSet);
        const structureInfo = computeStructureScore(resumeText);
        const lengthInfo = computeLengthScore(resumeTokens);
        const similarityInfo = computeOverallSimilarityScore(jdKeywords, resumeTokenSet);

        const totalScore = Math.min(
            100,
            Math.max(
                0,
                keywordInfo.score +
                structureInfo.score +
                lengthInfo.score +
                similarityInfo.score
            )
        );

        const suggestions = buildSuggestions({
            keywordScore: keywordInfo.score,
            missingKeywords: keywordInfo.missing,
            structureFlags: structureInfo.flags,
            lengthNote: lengthInfo.note,
            overallSimilarityScore: similarityInfo.score,
        });

        // ------------------------------
        // ACTION: SCORE ONLY
        // ------------------------------
        if (action === "score") {
            const response: ScoreResponse = {
                score: totalScore,
                breakdown: {
                    keywordCoverage: keywordInfo.score,
                    structure: structureInfo.score,
                    length: lengthInfo.score,
                    overallSimilarity: similarityInfo.score,
                    total: totalScore,
                },
                suggestions,
                analysis: {
                    matchedKeywords: keywordInfo.matched,
                    missingKeywords: keywordInfo.missing,
                    structureFlags: structureInfo.flags,
                    lengthNote: lengthInfo.note,
                    wordCount: resumeTokens.length,
                },
            };

            return NextResponse.json(response);
        }

        // ------------------------------
        // ACTION: OPTIMIZE RESUME
        // ------------------------------
        if (action === "optimize") {
            const optimized = await optimizeResume(
                resumeText,
                jobDescription,
                keywordInfo.missing,
                suggestions
            );

            const expectedBoost = Math.min(100 - totalScore, Math.floor(Math.random() * 15) + 5);

            const response: OptimizeResponse = {
                optimizedResume: optimized.resume,
                changesSummary: optimized.changes,
                expectedScoreBoost: expectedBoost,
            };

            return NextResponse.json(response);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
