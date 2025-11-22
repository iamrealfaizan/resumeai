"use client";

import { useState } from "react";
import { Wand2, RotateCcw, ChevronRight } from "lucide-react";

interface OptimizationEditorProps {
    resumeText: string;
    jdText: string;
    onComplete: (lines: string[]) => void;
}

export default function OptimizationEditor({ resumeText, jdText, onComplete }: OptimizationEditorProps) {
    // Split text into chunks (lines) for granular editing
    const [lines, setLines] = useState<string[]>(
        resumeText.split("\n").filter((line) => line.trim().length > 0)
    );
    const [optimizingIndex, setOptimizingIndex] = useState<number | null>(null);
    const [history, setHistory] = useState<{ index: number; text: string }[]>([]);

    const handleOptimize = async (index: number, text: string) => {
        setOptimizingIndex(index);
        try {
            const response = await fetch("/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    jdText,
                    instruction: "Optimize this bullet point/sentence for impact and JD alignment.",
                }),
            });

            if (!response.ok) throw new Error("Optimization failed");

            const data = await response.json();

            // Save to history before updating
            setHistory((prev) => [...prev, { index, text }]);

            // Update line
            const newLines = [...lines];
            newLines[index] = data.optimizedText;
            setLines(newLines);
        } catch (error) {
            console.error(error);
            alert("Failed to optimize. Please try again.");
        } finally {
            setOptimizingIndex(null);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastChange = history[history.length - 1];
        const newLines = [...lines];
        newLines[lastChange.index] = lastChange.text;
        setLines(newLines);
        setHistory((prev) => prev.slice(0, -1));
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Optimization Editor</h2>
                    <p className="text-sm text-gray-500">Click the magic wand to optimize each line.</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                        title="Undo"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onComplete(lines)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Preview & Download <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm divide-y divide-gray-100">
                {lines.map((line, idx) => (
                    <div key={idx} className="group relative p-4 hover:bg-blue-50/30 transition-colors">
                        <div className="pr-12">
                            <textarea
                                value={line}
                                onChange={(e) => {
                                    const newLines = [...lines];
                                    newLines[idx] = e.target.value;
                                    setLines(newLines);
                                }}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none text-gray-800"
                                rows={Math.max(1, Math.ceil(line.length / 80))}
                            />
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleOptimize(idx, line)}
                                disabled={optimizingIndex !== null}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Optimize with AI"
                            >
                                {optimizingIndex === idx ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                ) : (
                                    <Wand2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
