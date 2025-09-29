"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MessageCircle,
  Users,
  Calendar,
  Zap,
  Heart,
  Smile,
  Brain,
  Sparkles,
  Puzzle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useChatStore, type AIInsights } from "@/lib/store";
import { formatName } from "@/lib/helper";

export default function ResultsPage() {
  const router = useRouter();

  // ✅ Correctly select from store
  const stats = useChatStore((s) => s.current?.stats);
  const fileName = useChatStore((s) => s.current?.fileName);
  const aiInsights = useChatStore((s) => s.current?.aiInsights);
  const setAIInsights = useChatStore((s) => s.setAIInsights);

  // Redirect if no stats available
  useEffect(() => {
    if (!stats) router.push("/");
  }, [stats, router]);

  // Fetch AI insights - always call hook, control execution with `enabled`
  const { data: fetchedAI, isLoading } = useQuery<AIInsights>({
    queryKey: ["aiInsights", fileName],
    queryFn: async (): Promise<AIInsights> => {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allText: stats?.allText ?? "",
          participants: stats?.participants ?? [],
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch AI insights");
      return (await res.json()) as AIInsights;
    },
    enabled: !!stats && !aiInsights, // 🚀 only fetch if no cached insights
  });

  // React to data change using useEffect
  useEffect(() => {
    if (fetchedAI) setAIInsights(fetchedAI);
  }, [fetchedAI, setAIInsights]);

  const displayAI = aiInsights ?? fetchedAI;

  // Handle initial render when stats not ready
  if (!stats || !fileName) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Analyzing your chat...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background min-h-screen p-4">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="hover:bg-muted/50 cursor-pointer gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-balance">Chat Analysis</h1>
          <p className="text-muted-foreground text-xl text-pretty">
            {formatName(fileName)}
          </p>
        </div>

        {/* Non-AI Stats */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Chat Statistics</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Messages */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Messages
                </CardTitle>
                <MessageCircle className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalMessages.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* Conversation Start */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversation Started
                </CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.startDate}</div>
              </CardContent>
            </Card>

            {/* Total Emojis */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Emojis
                </CardTitle>
                <Smile className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalEmojis.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* Who Talks More */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Who Talks More
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.participants.map((p, idx) => (
                  <div key={p.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">
                        {p.count} messages ({p.percentage}%)
                      </span>
                    </div>
                    <div className="bg-muted h-2 w-full rounded-full">
                      <div
                        className={`h-2 rounded-full ${idx === 0 ? "bg-primary" : "bg-secondary"}`}
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Most Used Emojis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Most Used Emojis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topEmojis.map((emoji, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <span className="text-2xl">{emoji.emoji}</span>
                      <span className="text-muted-foreground text-sm">
                        {emoji.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Word Cloud */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Most Common Words</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.wordCloud.map((word, idx) => (
                    <span
                      key={word}
                      className="bg-muted rounded-full px-3 py-1 text-sm"
                      style={{
                        fontSize: `${Math.max(0.75, 1.2 - idx * 0.05)}rem`,
                        opacity: Math.max(0.6, 1 - idx * 0.03),
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">AI Insights</h2>

          {/* ✅ If not loading and no insights */}
          {!isLoading && !displayAI ? (
            <div className="flex flex-col items-center justify-center rounded-md border p-6 text-center">
              <h3 className="text-lg font-semibold">AI Insights Unavailable</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                We couldn’t load insights for this chat. Try refreshing the
                page.
              </p>
              <Button onClick={() => router.refresh()} className="mt-4 gap-2">
                Refresh Page
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Connection Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Connection Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {displayAI?.connectionAnalysis}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Personality Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4" /> Personality Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <>
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {displayAI?.personalityInsights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Fun Facts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Fun Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-4 w-1/2" />
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {displayAI?.funFacts.map((fact, idx) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Other Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Puzzle className="h-4 w-4" /> Other Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <>
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {displayAI?.otherPatterns.map((pattern, idx) => (
                        <li key={idx}>{pattern}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
