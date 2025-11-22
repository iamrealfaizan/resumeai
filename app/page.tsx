"use client";

import { useState } from "react";
import ResumeUpload from "./components/ResumeUpload";
import JobDescriptionInput from "./components/JobDescriptionInput";
import AnalysisDashboard from "./components/AnalysisDashboard";
import OptimizationEditor from "./components/OptimizationEditor";
import ResumePreview from "./components/ResumePreview";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { clsx } from "clsx";

export default function Home() {
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [jdText, setJdText] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizedLines, setOptimizedLines] = useState<string[]>([]);

  const handleResumeUpload = (text: string, name: string) => {
    setResumeText(text);
    setResumeName(name);
    if (text) setTimeout(() => setStep(2), 500);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setAnalysisResult(data);
      setStep(3);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight">
            Resume<span className="text-blue-600">AI</span> Optimizer
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Align your resume with any job description using advanced AI analysis.
            Get higher ATS scores and more interviews.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-200",
                  step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                )}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={clsx(
                    "w-12 h-1 mx-2 rounded transition-colors duration-200",
                    step > s ? "bg-blue-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-12 text-xs font-medium text-gray-500">
            <span className={step >= 1 ? "text-blue-600" : ""}>Upload Resume</span>
            <span className={step >= 2 ? "text-blue-600" : ""}>Job Description</span>
            <span className={step >= 3 ? "text-blue-600" : ""}>Analysis & Optimize</span>
          </div>
        </div>

        {/* Wizard Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900">Upload Your Resume</h2>
              <p className="text-gray-500">We support PDF, DOCX, and TXT formats.</p>
              <ResumeUpload onUploadComplete={handleResumeUpload} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Paste Job Description</h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
              </div>
              <JobDescriptionInput value={jdText} onChange={setJdText} />

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!jdText || jdText.length < 50 || isAnalyzing}
                  className={clsx(
                    "flex items-center px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl",
                    !jdText || jdText.length < 50 || isAnalyzing
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Match <Sparkles className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && analysisResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                  <p className="text-gray-500 text-sm mt-1">Comparing <strong>{resumeName}</strong> vs. Job Description</p>
                </div>
                <button
                  onClick={() => {
                    setStep(2);
                    setAnalysisResult(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> New Analysis
                </button>
              </div>

              <AnalysisDashboard analysis={analysisResult} />

              <div className="flex justify-center pt-8">
                <button
                  className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg flex items-center"
                  onClick={() => setStep(4)}
                >
                  Start Optimization <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Optimize Resume</h2>
                <button
                  onClick={() => setStep(3)}
                  className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to Analysis
                </button>
              </div>
              <OptimizationEditor
                resumeText={resumeText}
                jdText={jdText}
                onComplete={(lines) => {
                  setOptimizedLines(lines);
                  setStep(5);
                }}
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between print:hidden">
                <h2 className="text-2xl font-bold text-gray-900">Final Preview</h2>
                <button
                  onClick={() => setStep(4)}
                  className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to Editor
                </button>
              </div>
              <ResumePreview content={optimizedLines} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
