"use client";

import { useState } from "react";
import { Printer, Download, LayoutTemplate } from "lucide-react";
import { clsx } from "clsx";

interface ResumePreviewProps {
    content: string[]; // Array of lines
}

type Template = "classic" | "modern" | "minimalist";

export default function ResumePreview({ content }: ResumePreviewProps) {
    const [template, setTemplate] = useState<Template>("modern");

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Toolbar - Hidden when printing */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl border shadow-sm print:hidden">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                        <LayoutTemplate className="w-4 h-4 mr-2" /> Template:
                    </span>
                    <div className="flex space-x-2">
                        {(["classic", "modern", "minimalist"] as Template[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTemplate(t)}
                                className={clsx(
                                    "px-3 py-1.5 text-sm rounded-lg capitalize transition-colors",
                                    template === t
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handlePrint}
                    className="flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md"
                >
                    <Printer className="w-4 h-4 mr-2" /> Save as PDF
                </button>
            </div>

            {/* Preview Area */}
            <div className="print:w-full print:absolute print:top-0 print:left-0 print:m-0">
                <div
                    className={clsx(
                        "bg-white shadow-2xl print:shadow-none min-h-[1100px] w-full max-w-[210mm] mx-auto p-[20mm] text-left",
                        template === "classic" && "font-serif text-gray-900",
                        template === "modern" && "font-sans text-gray-800",
                        template === "minimalist" && "font-mono text-gray-900"
                    )}
                >
                    {content.map((line, idx) => {
                        // Simple heuristic for formatting
                        const isHeader = line.length < 40 && !line.includes(".") && (line === line.toUpperCase() || /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(line));
                        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");

                        return (
                            <div key={idx} className={clsx("mb-2", isHeader ? "mt-6" : "")}>
                                {isHeader ? (
                                    <h3
                                        className={clsx(
                                            "font-bold border-b mb-3",
                                            template === "classic" && "text-xl border-gray-900 pb-1 uppercase tracking-wider",
                                            template === "modern" && "text-xl text-blue-700 border-blue-200 pb-2",
                                            template === "minimalist" && "text-lg border-black pb-1 lowercase"
                                        )}
                                    >
                                        {line}
                                    </h3>
                                ) : (
                                    <p
                                        className={clsx(
                                            "leading-relaxed text-sm",
                                            isBullet && "pl-4 relative",
                                            template === "classic" && "text-justify",
                                            template === "modern" && "text-left",
                                            template === "minimalist" && "text-left tracking-tight"
                                        )}
                                    >
                                        {isBullet && (
                                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-current rounded-full opacity-60" />
                                        )}
                                        {line.replace(/^[-•]\s*/, "")}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
