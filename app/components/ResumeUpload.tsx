"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

interface ResumeUploadProps {
  onUploadComplete: (text: string, fileName: string) => void;
}

export default function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse resume");
      }

      const data = await response.json();
      onUploadComplete(data.text, file.name);
    } catch (err) {
      console.error(err);
      setError("Failed to parse resume. Please try again or paste text manually.");
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetUpload = () => {
    setFileName(null);
    setError(null);
    onUploadComplete("", "");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer",
          isDragging
            ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
            : "border-gray-300 hover:border-gray-400 bg-white",
          fileName && "border-green-500 bg-green-50/30"
        )}
      >
        <input
          type="file"
          id="resume-upload"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          disabled={isUploading || !!fileName}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Parsing document...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{fileName}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" /> Upload complete
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <label htmlFor="resume-upload" className="cursor-pointer block">
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Upload your resume
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop or click to browse (PDF, DOCX, TXT)
                </p>
              </div>
            </div>
          </label>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
          <X className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
