import React, { useState } from "react";
import { Link as LinkIcon, X } from "lucide-react";
import { joinGroupViaInviteApi } from "../../apis/chat.api";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinedGroup: (group: any) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoinedGroup,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const extractInviteCode = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes("/join/")) {
      const parts = trimmed.split("/join/");
      return parts[parts.length - 1].split("?")[0].split("#")[0];
    }
    return trimmed;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const inviteCode = extractInviteCode(inputVal);

    if (!inviteCode) {
      setError("Please paste a valid group invite link or code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await joinGroupViaInviteApi(inviteCode);
      if (res.data?.success && res.data.group) {
        onJoinedGroup(res.data.group);
        onClose();
        setInputVal("");
      } else {
        setError(res.data?.msg || "Unable to join group");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.msg || "Invalid invite link or group is full (max 10)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Join Group via Link</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste an invite link or code below
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs font-medium p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Group Invite Link or Code *
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. https://chitchatt.tech/join/a1b2c3d4 or a1b2c3d4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              {loading ? "Joining..." : "Join Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal;
