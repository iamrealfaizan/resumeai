export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import path from "path";

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
        }

        else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        }

        else if (file.type === "text/plain") {
            text = buffer.toString("utf-8");
        }

        else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        return NextResponse.json({ text: text.trim() });
    } catch (error) {
        console.error("Error parsing file:", error);
        return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
    }
}
