export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.js"
);

type PDFItem = { str: string };

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        if (file.type === "application/pdf") {
            const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const content = await page.getTextContent();

                const pageText = (content.items as PDFItem[])
                    .map((i) => i.str)
                    .join(" ");

                text += pageText + "\n";
            }
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (file.type === "text/plain") {
            text = buffer.toString("utf-8");
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        // Basic cleanup
        text = text.trim();

        // Structure the text using Gemini
        // Structure the text using Gemini
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are a Resume Parser.Convert the following resume text into a structured JSON object.
        
        RESUME TEXT:
        ${text.slice(0, 20000)}

        Return ONLY valid JSON with the following structure:
        {
            "header": { "name": "", "contact": "", "links": [] },
            "summary": "Professional summary text...",
                "experience": [
                    { "company": "", "role": "", "duration": "", "description": ["bullet point 1", "bullet point 2"] }
                ],
                    "education": [
                        { "institution": "", "degree": "", "year": "" }
                    ],
                        "skills": ["skill1", "skill2"],
                            "projects": [
                                { "name": "", "description": "..." }
                            ],
                                "certifications": []
        }
        If a section is missing, return empty array or string.
        Do not include markdown formatting like \`\`\`json.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, "").replace(/```/g, "").trim();

        let structuredData;
        try {
            structuredData = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse structured data", e);
            // Fallback to raw text if AI fails
            return NextResponse.json({ text, structured: null });
        }

        return NextResponse.json({ text, structured: structuredData });
    } catch (error) {
        console.error("Error parsing file:", error);
        return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
    }
}
