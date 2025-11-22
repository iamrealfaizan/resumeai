import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { text, jdText, instruction } = await req.json();

        if (!text || !jdText) {
            return NextResponse.json(
                { error: "Missing text or JD" },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an expert Resume Editor committed to "Ethical Optimization".
      Your task is to rephrase the following resume content to better align with the Job Description (JD),
      while STRICTLY maintaining factual accuracy.

      JOB DESCRIPTION:
      ${jdText.slice(0, 5000)}

      ORIGINAL CONTENT:
      "${text}"

      INSTRUCTION: ${instruction || "Optimize for impact and relevance to JD."}

      RULES:
      1. NEVER invent skills, tools, or experiences.
      2. NEVER exaggerate quantitative results.
      3. ONLY incorporate JD keywords if they accurately describe the work.
      4. Use active voice and strong action verbs.
      5. Front-load achievements (Impact-First Restructuring).

      Return ONLY the optimized text. Do not include explanations or markdown formatting.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const optimizedText = response.text().trim();

        return NextResponse.json({ optimizedText });
    } catch (error) {
        console.error("Error optimizing text:", error);
        return NextResponse.json(
            { error: "Failed to optimize text" },
            { status: 500 }
        );
    }
}
