import { transporter } from "../libs/emailConfig";

export const sendVerificationMail = async (email: string, verificationCode: string)=>{
    try {
        const response = await transporter.sendMail({
            from: `ChitChat <process.env.EMAIL>`,
            to: email,
            subject: "OTP verification",
            text: "Verify your email",
            html:
                `<div style="font-family: Arial, sans-serif; max-width: 400px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
  <h2 style="color: #333;">Verify Your Account</h2>

  <p style="font-size: 15px; color: #555;">
    Hello,
    <br><br>
    Your verification code is:
  </p>

  <div style="font-size: 32px; font-weight: bold; color: #2b6cb0; text-align: center; margin: 20px 0;">
    ${verificationCode}
  </div>

  <p style="font-size: 14px; color: #777;">
    This code will expire in 5 minutes.  
    If you didn't request this code, you can safely ignore this email.
  </p>

  <p style="font-size: 14px; color: #555; margin-top: 30px;">
    — The ChitChat Team
  </p>
</div>
`
        });
    } catch (error) {
        console.error("Email error", error);
    };
};

export const welcomeEmail = async (email: string,name:string)=> {
    try {
        const response = transporter.sendMail({
            from: `ChitChat <process.env.EMAIL>`,
            to: email,
            subject: "Welcome to our community",
            text: "Welcome to our community",
            html:`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to ChitChat Community</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background:#4f46e5; padding:25px; color:#ffffff;">
              <h1 style="margin:0; font-size:26px;">Welcome to Our ChitChat 🎉</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#333333;">
              <p style="font-size:16px; margin:0 0 15px;">
                Hi ${name},
              </p>

              <p style="font-size:15px; line-height:1.6;">
                Thank you for joining <strong>Our Application</strong>!  
                We're excited to have you with us.  
                Your account has been successfully created.
              </p>

              <p style="font-size:15px; line-height:1.6;">
                We're committed to giving you the best experience.  
                If you have any questions, feel free to contact our support team anytime.
              </p>

              <br />

              <br /><br />

              <p style="font-size:14px; color:#777;">
                Cheers,<br />
                The Our App Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f0f0f0; padding:15px; font-size:12px; color:#555;">
              © 2025 ChitChat. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
        
        })
    } catch (error) {
        console.error("welcome email sending failed",error)
    }
}

export const forgetPasswordOtpMail = async (email: string, resetPasswordOtp: string) => {
  try {
    const response = transporter.sendMail({
      from: `ChitChat <process.env.EMAIL`,
      to: email,
      subject: "Forget password otp",
      text: "Forget password otp",
      html:` <!DOCTYPE html>
<html>
<body style="font-family:Arial; padding:20px; background:#f2f2f2;">
  <div style="max-width:450px; margin:auto; background:white; padding:25px; border-radius:10px;">
    <h2 style="text-align:center;">Password Reset OTP</h2>
    
    <p>Your One-Time Password (OTP) to reset your password is:</p>

    <h1 style="text-align:center; letter-spacing:5px; color:#4a4a4a;">
      ${resetPasswordOtp}
    </h1>

    <p>This OTP is valid for <b>5 minutes</b>. Do not share it with anyone.</p>

    <p style="margin-top:25px;">Regards,<br><b>Your App Team</b></p>
  </div>
</body>
</html>
`
    })
  } catch (error) {
    return console.error("failed to send email");
  }
}