import React, { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { getSmartReplyChipsApi } from "../../apis/chat.api";

interface SmartReplyChipsProps {
  activeId?: string;
  isGroup?: boolean;
  onSelectChip: (text: string) => void;
}

export const SmartReplyChips: React.FC<SmartReplyChipsProps> = ({
  activeId,
  isGroup = false,
  onSelectChip,
}) => {
  const [chips, setChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSmartReplies = async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      const payload = isGroup
        ? { groupId: activeId }
        : { receiverId: activeId };
      const res = await getSmartReplyChipsApi(payload);
      if (res.data?.success && Array.isArray(res.data.suggestions)) {
        setChips(res.data.suggestions);
      }
    } catch (err) {
      console.warn("Smart replies fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartReplies();
  }, [activeId, isGroup]);

  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-semibold shrink-0 pr-1">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
        <span className="text-[11px] uppercase tracking-wider">AI Suggestions</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSelectChip(chip)}
            className="px-3 py-1.5 text-xs rounded-full bg-indigo-50 dark:bg-slate-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 shadow-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      <button
        onClick={fetchSmartReplies}
        disabled={loading}
        title="Refresh AI suggestions"
        className="p-1 rounded-full text-slate-400 hover:text-indigo-500 transition-colors shrink-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
};

export default SmartReplyChips;
