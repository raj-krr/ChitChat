import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: { type: String, required: true },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationCode: {
            type: String,
        },
        verificationCodeExpires: { type: Date },
        resetPasswordOtp: { type: String },
        resetPasswordOtpexpires:{type:Date},
        refreshToken: { type: String },
        refreshTokenExpires: { type: Date },
        firstName: { type: String },
        lastName: { type: String },
        gender: { type: String, enum: ["male", "female", "other"] },
        dob: { type: Date },
        bio:{type:String},
        avatar: { type: String },
    },
    { timestamps: true }
);

const UserMOdel = mongoose.model("User", userSchema);
export default UserMOdel;