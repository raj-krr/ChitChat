import React, { useState } from "react";
import { Users, X, Plus, Check } from "lucide-react";
import { createGroupApi } from "../../apis/chat.api";

interface Friend {
  _id: string;
  username: string;
  avatar?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onGroupCreated: (group: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  friends,
  onGroupCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    setError(null);
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds((prev) => prev.filter((mId) => mId !== id));
    } else {
      if (selectedMemberIds.length >= 9) {
        setError("Maximum 10 members allowed per group (9 friends + you).");
        return;
      }
      setSelectedMemberIds((prev) => [...prev, id]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError("Select at least 1 friend to create a group");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await createGroupApi({
        name: name.trim(),
        description: description.trim(),
        members: selectedMemberIds,
      });

      if (res.data.success) {
        onGroupCreated(res.data.group);
        onClose();
        setName("");
        setDescription("");
        setSelectedMemberIds([]);
      } else {
        setError(res.data.msg || "Failed to create group");
      }
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Error creating group");
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Create Group Chat</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Max 10 members per group
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs font-medium p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team 🎨"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief topic or goal"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={150}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Select Members ({selectedMemberIds.length + 1} / 10 Max)
              </label>
              <span className="text-[11px] text-indigo-500 font-medium">
                {selectedMemberIds.length} Selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800 p-2">
              {friends.length === 0 ? (
                <p className="text-xs text-center py-4 text-slate-400">
                  No friends available to add.
                </p>
              ) : (
                friends.map((friend) => {
                  const isSelected = selectedMemberIds.includes(friend._id);
                  return (
                    <button
                      type="button"
                      key={friend._id}
                      onClick={() => toggleMember(friend._id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all text-xs ${
                        isSelected
                          ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-medium"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            friend.avatar ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`
                          }
                          alt={friend.username}
                          className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                        />
                        <span>{friend.username}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
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
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
