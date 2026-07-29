export const createGroupSchema = {
  body: (data: any) => {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
      return { error: "Group name must be at least 2 characters long" };
    }
    if (data.name.trim().length > 50) {
      return { error: "Group name cannot exceed 50 characters" };
    }
    if (!Array.isArray(data.members)) {
      return { error: "Members must be an array of user IDs" };
    }
    // Creator is added automatically by controller, so payload members must be 1 to 9 additional members (total 2 to 10)
    if (data.members.length > 9) {
      return { error: "A group can have a maximum of 10 members (including the creator)" };
    }
    return {};
  },
};

export const addMemberSchema = {
  body: (data: any) => {
    if (!data.memberId || typeof data.memberId !== "string") {
      return { error: "Valid memberId string is required" };
    }
    return {};
  },
  params: (data: any) => {
    if (!data.groupId || typeof data.groupId !== "string") {
      return { error: "Valid groupId parameter is required" };
    }
    return {};
  },
};
