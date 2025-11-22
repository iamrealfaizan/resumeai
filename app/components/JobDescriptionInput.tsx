"use client";

import { useState, useEffect } from "react";
import { Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

interface JobDescriptionInputProps {
    value: string;
    onChange: (value: string) => void;
}

export default function JobDescriptionInput({ value, onChange }: JobDescriptionInputProps) {
    const [wordCount, setWordCount] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const count = value.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(count);
    }, [value]);

    const isValid = wordCount >= 50; // Minimum 50 words for a decent JD
    const isTooLong = value.length > 10000;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Job Description
                </label>
                <span className={clsx(
                    "text-xs font-medium",
                    isTooLong ? "text-red-500" : "text-gray-500"
                )}>
                    {value.length} / 10,000 chars
                </span>
            </div>

            <div className={clsx(
                "relative rounded-xl border transition-all duration-200 bg-white",
                isFocused ? "border-blue-500 ring-4 ring-blue-50" : "border-gray-300",
                !isValid && value.length > 0 && !isFocused && "border-yellow-400",
                isValid && !isFocused && "border-green-500"
            )}>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Paste the full job description here..."
                    className="w-full h-64 p-4 rounded-xl resize-none focus:outline-none text-gray-800 placeholder:text-gray-400"
                    spellCheck={false}
                />

                {/* Status Indicator */}
                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                    {value.length > 0 && (
                        <>
                            {isValid ? (
                                <div className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Good length ({wordCount} words)
                                </div>
                            ) : (
                                <div className="flex items-center text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Too short ({wordCount} words)
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <p>Paste the complete JD including requirements and responsibilities.</p>
            </div>
        </div>
    );
}
