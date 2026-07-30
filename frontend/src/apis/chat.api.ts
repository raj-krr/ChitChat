import {axiosInstance } from "./axios";

export const getChatListApi = () =>
  axiosInstance.get("/message/chats");

export const getMessagesApi = (
  id: string,
  params?: { cursor?: string; skip?: number; limit?: number }
) =>
  axiosInstance.get(`/message/chat/${id}`, {
    params,
  });

export const sendMessageApi = (
  chatId: string,
  form: FormData,
  onProgress?: (p: number) => void
) => {
  return axiosInstance.post(`/message/send/${chatId}`, form, {
    onUploadProgress: (e) => {
      if (!e.total) return;
      const percent = Math.round((e.loaded * 100) / e.total);
      onProgress?.(percent);
    },
  });
};


export const markReadApi = (id: string) =>
  axiosInstance.post(`/message/read/${id}`);

export const deleteMessageForEveryoneApi = (id: string) =>
  axiosInstance.delete(`/message/${id}`);

export const deleteMessageForMeApi = (id: string) =>
  axiosInstance.delete(`/message/me/${id}`);

export const messageReactionApi = (id: string, emoji: string) =>
  axiosInstance.post(`/message/${id}/react`, { emoji });

// 👥 Group API Calls
export const createGroupApi = (payload: { name: string; description?: string; members: string[] }) =>
  axiosInstance.post("/groups", payload);

export const getMyGroupsApi = () =>
  axiosInstance.get("/groups");

export const getGroupMessagesApi = (groupId: string, params?: { cursor?: string; limit?: number }) =>
  axiosInstance.get(`/groups/${groupId}/messages`, { params });

export const sendGroupMessageApi = (
  groupId: string,
  form: FormData,
  onProgress?: (p: number) => void
) => {
  return axiosInstance.post(`/groups/${groupId}/send`, form, {
    onUploadProgress: (e) => {
      if (!e.total) return;
      const percent = Math.round((e.loaded * 100) / e.total);
      onProgress?.(percent);
    },
  });
};

export const addGroupMemberApi = (groupId: string, memberId: string) =>
  axiosInstance.post(`/groups/${groupId}/members`, { memberId });

export const addGroupMember = addGroupMemberApi;

export const joinGroupViaInviteApi = (inviteCode: string) =>
  axiosInstance.post(`/groups/join/${inviteCode}`);

// 🤖 Groq AI Smart Reply API
export const getSmartReplyChipsApi = (payload: { receiverId?: string; groupId?: string; chatId?: string }) =>
  axiosInstance.post("/ai/smart-replies", payload);


