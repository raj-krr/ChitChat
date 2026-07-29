import mongoose, { Schema, Document, Types } from "mongoose";
import crypto from "crypto";

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  avatar?: string;
  admin: Types.ObjectId;
  members: Types.ObjectId[];
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      maxlength: 250,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      validate: [
        function (val: Types.ObjectId[]) {
          return val.length > 0 && val.length <= 10;
        },
        "A group must have between 1 and 10 members.",
      ],
    },
    inviteCode: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomBytes(6).toString("hex"),
    },
  },
  { timestamps: true }
);

groupSchema.index({ members: 1 });
groupSchema.index({ inviteCode: 1 });

export const GroupModel = mongoose.model<IGroup>("Group", groupSchema);
export default GroupModel;
