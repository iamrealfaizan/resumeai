import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { text, jdText, instruction, type, section, fullResumeContext } = await req.json();

        if (!jdText) {
            return NextResponse.json({ error: "Missing JD" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";

        if (type === "bulk") {
            // Bulk optimization of the entire structured resume
            prompt = `
        You are an expert Resume Editor. Optimize the entire resume to match the Job Description (JD).
        
        JOB DESCRIPTION:
        ${jdText.slice(0, 5000)}

        RESUME STRUCTURE (JSON):
        ${JSON.stringify(fullResumeContext)}

        INSTRUCTION:
        Identify weak areas and optimize the content (Summary, Experience descriptions, Skills) to better align with the JD.
        - Use keywords from the JD where truthful.
        - Quantify achievements.
        - Fix grammar and clarity.
        - Do NOT invent experiences.

        Return the output as a JSON object with the SAME structure as the input, but with optimized content.
        Return ONLY valid JSON.
        `;
        } else {
            // Single section/text optimization
            prompt = `
        You are an expert Resume Editor. Optimize the following ${section || "text"} to match the Job Description (JD).
        
        JOB DESCRIPTION:
        ${jdText.slice(0, 5000)}

        CONTEXT (Full Resume Summary):
        ${JSON.stringify(fullResumeContext).slice(0, 2000)}...

        TARGET CONTENT TO OPTIMIZE:
        "${text}"

        INSTRUCTION: ${instruction || "Optimize for impact and relevance to JD."}

        RULES:
        1. Maintain factual accuracy.
        2. Use active voice and strong verbs.
        3. Integrate JD keywords naturally.
        
        Return ONLY the optimized text string.
        `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let output = response.text().trim();

        // Cleanup JSON if bulk
        if (type === "bulk") {
            output = output.replace(/```json/g, "").replace(/```/g, "").trim();
            try {
                const optimizedData = JSON.parse(output);
                return NextResponse.json({ optimizedData });
            } catch (e) {
                console.error("Bulk optimization parse error:", e);
                return NextResponse.json({ error: "Failed to parse bulk optimization" }, { status: 500 });
            }
        }

        return NextResponse.json({ optimizedText: output });
    } catch (error) {
        console.error("Error optimizing text:", error);
        return NextResponse.json(
            { error: "Failed to optimize text" },
            { status: 500 }
        );
    }
}
