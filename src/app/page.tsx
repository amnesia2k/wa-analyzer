"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Plus } from "lucide-react";
import HistorySheet from "@/components/history-sheet";
import { useChatStore } from "@/lib/store";

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
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (
        selectedFile.type === "text/plain" ||
        selectedFile.name.endsWith(".txt")
      ) {
        setFile(selectedFile);
      } else {
        alert("Please select a .txt file");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "text/plain": [".txt"] },
  });

  const handleAnalyze = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/analyze", { method: "POST", body: formData });

    if (!res.ok) {
      alert("Error analyzing chat");
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

    router.push("/results");
  };

  const fileName = file?.name.replace(/\.txt$/, "");

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">WhatsApp Chat Analyzer</h1>
          <p className="text-muted-foreground">
            Upload your exported WhatsApp chat and discover insights
          </p>
        </div>

        <div className="mt-6 flex justify-between">
          <HistorySheet />
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
                <Upload className="text-primary h-8 w-8" />
              ) : (
                <Plus className="text-muted-foreground h-8 w-8" />
              )}
            </div>

            {file ? (
              <div>
                <p className="text-primary font-medium">{fileName}</p>
                <p className="text-muted-foreground text-sm">
                  {(file.size / 1024).toFixed(1)} KB • Ready to analyze
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Drop your WhatsApp chat here</p>
                <p className="text-muted-foreground text-sm">
                  Drag & drop (.txt) or click to upload
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
          disabled={!file}
          className="h-12 w-full cursor-pointer text-base font-medium"
          size="lg"
        >
          Analyze Now
        </Button>
      </div>
    </main>
  );
}
