import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jdText } = await req.json();

    if (!resumeText || !jdText) {
      return NextResponse.json(
        { error: "Missing resume or JD text" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Resume Analyzer and ATS Optimization Specialist.
      Analyze the following Resume against the Job Description (JD).

      JOB DESCRIPTION:
      ${jdText.slice(0, 10000)}

      RESUME:
      ${resumeText.slice(0, 10000)}

      Perform a deep gap analysis and scoring based on these criteria:
      1. Keyword Coverage (0-100): Are critical hard skills and tools present?
      2. Semantic Similarity (0-100): Does the resume convey the same meaning/context?
      3. Seniority Match (0-100): Does the experience level align?

      Return the output STRICTLY in this JSON format (no markdown formatting, just raw JSON):
      {
        "scores": {
          "total": number, // Weighted average: (0.5 * keyword) + (0.3 * semantic) + (0.2 * seniority)
          "keyword_coverage": number,
          "semantic_similarity": number,
          "seniority_match": number
        },
        "gaps": {
          "missing_keywords": ["string", "string"], // High priority missing hard skills
          "weak_matches": [
            { "resume_term": "string", "jd_preference": "string", "reason": "string" }
          ]
        },
        "over_represented": ["string"], // Skills in resume not in JD (irrelevant)
        "seniority_analysis": {
          "jd_level": "string",
          "resume_level": "string",
          "status": "Match" | "Underqualified" | "Overqualified",
          "reason": "string"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if present
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const analysis = JSON.parse(jsonString);
      return NextResponse.json(analysis);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.error("Raw Text:", text);
      return NextResponse.json(
        { error: "Failed to parse analysis result" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error analyzing resume:", error);
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
