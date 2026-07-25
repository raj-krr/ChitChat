export const reactMessageSchema = {
  body: (data: any) => {
    if (!data.emoji || typeof data.emoji !== "string") {
      return { error: "Emoji reaction string is required" };
    }
    return {};
  },
  params: (data: any) => {
    if (!data.messageId || typeof data.messageId !== "string") {
      return { error: "Valid messageId parameter is required" };
    }
    return {};
  },
};

export const sendMessageSchema = {
  params: (data: any) => {
    if (!data.id || typeof data.id !== "string") {
      return { error: "Receiver user id parameter is required" };
    }
    return {};
  },
};
