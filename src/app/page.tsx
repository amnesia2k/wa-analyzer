"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, CloudUpload } from "lucide-react";
// import HistorySheet from "@/components/history-sheet";
import { useChatStore } from "@/lib/store";
import { ModeToggle } from "@/components/mode-toggle";
import { formatName } from "@/lib/helper";
import { toast } from "sonner"; // ✅ added
import HistorySheet from "@/components/history-sheet";

export interface ChatStats {
  allText: string;
  totalMessages: number;
  participants: { name: string; count: number; percentage: number }[];
  startDate: string;
  conversationStarters: { name: string; percentage: number }[];
  totalEmojis: number;
  topEmojis: { emoji: string; count: number }[];
  wordCloud: string[];
}

export interface HistoryItem {
  fileName: string;
  stats: ChatStats;
  date: string;
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (
      selectedFile.type === "text/plain" ||
      selectedFile.name.endsWith(".txt")
    ) {
      setFile(selectedFile);
      toast.success("File ready for analysis"); // ✅ added
    } else if (
      selectedFile.type === "application/zip" ||
      selectedFile.name.endsWith(".zip")
    ) {
      const jszip = new JSZip();
      const zipContent = await jszip.loadAsync(selectedFile);

      const txtFileEntry = Object.keys(zipContent.files).find((name) =>
        name.endsWith(".txt"),
      );

      if (txtFileEntry && zipContent.files[txtFileEntry]) {
        const blob = await zipContent.files[txtFileEntry].async("blob");
        const extractedFile = new File([blob], txtFileEntry, {
          type: "text/plain",
        });
        setFile(extractedFile);
        toast.success("Extracted .txt file from zip"); // ✅ added
      } else {
        toast.error("No .txt file found inside the zip"); // ✅ replaced alert
      }
    } else {
      toast.error("Please select a .txt or .zip file"); // ✅ replaced alert
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => void onDrop(acceptedFiles),
    multiple: false,
    accept: {
      "text/plain": [".txt"],
      "application/zip": [".zip"],
    },
  });

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("No file selected"); // ✅ added
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Error analyzing chat"); // ✅ replaced alert
        setIsAnalyzing(false);
        return;
      }

      const chatStore = useChatStore.getState();
      const data = (await res.json()) as ChatStats;

      chatStore.setStats(data, file.name);
      chatStore.addHistoryItem({
        fileName: file.name,
        stats: data,
        date: new Date().toISOString(),
      });

      toast.success("Chat analyzed successfully 🚀"); // ✅ added
      router.push("/results");
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while analyzing"); // ✅ replaced alert
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex gap-x-5">
          <HistorySheet />

          <ModeToggle />
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">WhatsApp Chat Analyzer</h1>
          <p className="text-muted-foreground">
            Upload your exported WhatsApp chat and discover insights
          </p>
        </div>

        {/* File Upload Area */}
        <Card
          {...getRootProps()}
          className={`relative cursor-pointer border-2 border-dashed transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : file
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4 p-12 text-center">
            <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              {file ? (
                <Check className="text-primary h-8 w-8" />
              ) : (
                <CloudUpload className="text-muted-foreground h-8 w-8" />
              )}
            </div>

            {file ? (
              <div>
                <p className="text-primary font-medium">
                  {formatName(file?.name)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {(file.size / 1024).toFixed(1)} KB • Ready to analyze
                </p>

                {/* Remove file button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 cursor-pointer text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    toast.error("File removed");
                  }}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div>
                <p className="font-medium">Drop your WhatsApp chat here</p>
                <p className="text-muted-foreground text-sm">
                  Drag & drop (.txt or .zip) or click to upload
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Help Link */}
        <div className="text-center">
          <a
            href="https://faq.whatsapp.com/1180414079177245/?cms_platform=web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground text-sm underline"
          >
            How to export WhatsApp chats
          </a>
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className={`flex h-12 w-full cursor-pointer items-center justify-center gap-2 text-base font-medium ${isAnalyzing || !file ? "pointer-events-none cursor-not-allowed" : ""}`}
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Now"
          )}
        </Button>
      </div>
    </main>
  );
}
