"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, Trash2 } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { toast } from "sonner";
import { formatName } from "@/lib/helper";
import { forwardRef, useImperativeHandle, useState } from "react";

export interface HistorySheetHandle {
  open: () => void;
}

const HistorySheet = forwardRef<HistorySheetHandle>((_, ref) => {
  const { history, loadHistoryItem, deleteHistoryItem } = useChatStore();
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <History size={30} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>

        {Object.keys(history).length === 0 ? (
          <p className="text-muted-foreground px-4">No history found.</p>
        ) : (
          <div className="space-y-2">
            {Object.values(history).map((item) => (
              <div
                key={item.fileName}
                onClick={() => {
                  loadHistoryItem(item.fileName);
                  setOpen(false); // ✅ close after selecting
                }}
                className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-md border-b p-2 pb-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {formatName(item.fileName)}
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {new Date(item.date).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHistoryItem(item.fileName);
                    toast.success(
                      `Deleted "${formatName(item.fileName)}" from history`,
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});

HistorySheet.displayName = "HistorySheet";
export default HistorySheet;
