"use client";

import { useState } from "react";
import { Wand2, ChevronRight, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface ResumeStructure {
    header: { name: string; contact: string; links: string[] };
    summary: string;
    experience: Array<{ company: string; role: string; duration: string; description: string[] }>;
    education: Array<{ institution: string; degree: string; year: string }>;
    skills: string[];
    projects: Array<{ name: string; description: string }>;
}

interface OptimizationEditorProps {
    resumeData: ResumeStructure;
    jdText: string;
    onComplete: (data: ResumeStructure) => void;
}

export default function OptimizationEditor({ resumeData, jdText, onComplete }: OptimizationEditorProps) {
    const [data, setData] = useState<ResumeStructure>(resumeData);
    const [optimizingSection, setOptimizingSection] = useState<string | null>(null);
    const [isBulkOptimizing, setIsBulkOptimizing] = useState(false);

    const handleOptimizeSection = async (section: string, content: any, path: string[]) => {
        setOptimizingSection(path.join("."));
        try {
            const response = await fetch("/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: JSON.stringify(content),
                    jdText,
                    section,
                    fullResumeContext: data,
                    type: "single"
                }),
            });

            if (!response.ok) throw new Error("Optimization failed");
            const res = await response.json();

            // Update state deeply
            // Note: This is a simplified update logic. For complex nested updates, deep cloning or immer is better.
            // Here we assume we are updating strings or simple arrays.
            const newData = JSON.parse(JSON.stringify(data));

            // Helper to set value at path
            let current = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = res.optimizedText.replace(/^"|"$/g, ''); // Remove extra quotes if any

            setData(newData);
        } catch (error) {
            console.error(error);
            alert("Failed to optimize section.");
        } finally {
            setOptimizingSection(null);
        }
    };

    const handleBulkOptimize = async () => {
        setIsBulkOptimizing(true);
        try {
            const response = await fetch("/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jdText,
                    fullResumeContext: data,
                    type: "bulk"
                }),
            });

            if (!response.ok) throw new Error("Bulk optimization failed");
            const res = await response.json();
            setData(res.optimizedData);
        } catch (error) {
            console.error(error);
            alert("Failed to optimize all.");
        } finally {
            setIsBulkOptimizing(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* Toolbar */}
            <div className="sticky top-4 z-10 flex items-center justify-between bg-white p-4 rounded-xl border shadow-lg">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Smart Editor</h2>
                    <p className="text-sm text-gray-500">AI-powered structured editing</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleBulkOptimize}
                        disabled={isBulkOptimizing}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                    >
                        {isBulkOptimizing ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Optimize All
                    </button>
                    <button
                        onClick={() => onComplete(data)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Preview Final <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="space-y-6">
                {/* Header */}
                <SectionCard title="Header" onOptimize={() => handleOptimizeSection("header", data.header, ["header"])} isOptimizing={optimizingSection === "header"}>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            value={data.header?.name || ""}
                            onChange={(e) => setData({ ...data, header: { ...data.header, name: e.target.value } })}
                            className="p-2 border rounded font-bold text-lg" placeholder="Name"
                        />
                        <input
                            value={data.header?.contact || ""}
                            onChange={(e) => setData({ ...data, header: { ...data.header, contact: e.target.value } })}
                            className="p-2 border rounded" placeholder="Contact Info"
                        />
                    </div>
                </SectionCard>

                {/* Summary */}
                <SectionCard title="Professional Summary" onOptimize={() => handleOptimizeSection("summary", data.summary, ["summary"])} isOptimizing={optimizingSection === "summary"}>
                    <textarea
                        value={data.summary || ""}
                        onChange={(e) => setData({ ...data, summary: e.target.value })}
                        className="w-full p-3 border rounded-lg h-32"
                    />
                </SectionCard>

                {/* Experience */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Experience</h3>
                    {data.experience?.map((exp, idx) => (
                        <SectionCard
                            key={idx}
                            title={`${exp.role} at ${exp.company}`}
                            onOptimize={() => handleOptimizeSection("experience", exp, ["experience", idx.toString()])}
                            isOptimizing={optimizingSection === `experience.${idx}`}
                        >
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input value={exp.role} onChange={(e) => {
                                        const newExp = [...data.experience];
                                        newExp[idx].role = e.target.value;
                                        setData({ ...data, experience: newExp });
                                    }} className="flex-1 p-2 border rounded font-medium" placeholder="Role" />
                                    <input value={exp.company} onChange={(e) => {
                                        const newExp = [...data.experience];
                                        newExp[idx].company = e.target.value;
                                        setData({ ...data, experience: newExp });
                                    }} className="flex-1 p-2 border rounded" placeholder="Company" />
                                </div>
                                <textarea
                                    value={Array.isArray(exp.description) ? exp.description.join("\n") : exp.description}
                                    onChange={(e) => {
                                        const newExp = [...data.experience];
                                        newExp[idx].description = e.target.value.split("\n");
                                        setData({ ...data, experience: newExp });
                                    }}
                                    className="w-full p-3 border rounded-lg h-40 text-sm"
                                    placeholder="Bullet points (one per line)"
                                />
                            </div>
                        </SectionCard>
                    ))}
                </div>

                {/* Skills */}
                <SectionCard title="Skills" onOptimize={() => handleOptimizeSection("skills", data.skills, ["skills"])} isOptimizing={optimizingSection === "skills"}>
                    <textarea
                        value={data.skills?.join(", ") || ""}
                        onChange={(e) => setData({ ...data, skills: e.target.value.split(", ") })}
                        className="w-full p-3 border rounded-lg h-20"
                        placeholder="Skills (comma separated)"
                    />
                </SectionCard>
            </div>
        </div>
    );
}

function SectionCard({ title, children, onOptimize, isOptimizing }: { title: string, children: React.ReactNode, onOptimize: () => void, isOptimizing: boolean }) {
    return (
        <div className="bg-white rounded-xl border shadow-sm p-6 relative group">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">{title}</h3>
                <button
                    onClick={onOptimize}
                    disabled={isOptimizing}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Optimize this section"
                >
                    {isOptimizing ? <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" /> : <Wand2 className="w-4 h-4" />}
                </button>
            </div>
            {children}
        </div>
    );
}
