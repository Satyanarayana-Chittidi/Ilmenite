import dotenv from 'dotenv';

dotenv.config();

export interface SendOtpResult {
    success: boolean;
    delivered: boolean;
    messageId?: string;
    error?: string;
}

export async function testEmailConnection(): Promise<boolean> {
    if (process.env.BREVO_API_KEY) {
        console.log('[EMAIL] ✓ Active Brevo HTTP API (Port 443 HTTPS)');
        return true;
    }
    console.log('[EMAIL] No Brevo credentials provided in .env (operating in console OTP fallback mode).');
    return false;
}

async function sendViaBrevo(
    apiKey: string,
    toEmail: string,
    otp: string,
    htmlContent: string,
    purpose: string
): Promise<SendOtpResult> {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@ilmenite.dev';
    const subject = purpose === 'login'
        ? `${otp} is your Ilmenite login code`
        : `${otp} is your Ilmenite verification code`;

    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'Ilmenite', email: senderEmail },
                to: [{ email: toEmail }],
                subject,
                htmlContent
            })
        });

        const data: any = await res.json();
        if (res.ok) {
            console.log(`[BREVO-API] ✓ Email dispatched via HTTPS to ${toEmail} (MessageId: ${data.messageId})`);
            return { success: true, delivered: true, messageId: data.messageId };
        } else {
            throw new Error(data.message || 'Brevo API returned error');
        }
    } catch (err: any) {
        console.error(`[BREVO-API] Failed to dispatch email to ${toEmail}:`, err.message);
        return { success: false, delivered: false, error: err.message };
    }
}

export async function sendOtpEmail(toEmail: string, otp: string, purpose: string = 'registration'): Promise<SendOtpResult> {
    const actionText = purpose === 'login'
        ? 'sign in to your Ilmenite account'
        : 'verify your account and complete registration';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ilmenite Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border-radius: 20px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 24px 40px; text-align: center; border-bottom: 1px solid #1f2937; background: linear-gradient(180deg, #1e293b 0%, #111827 100%);">
              <div style="display: inline-block; padding: 12px 14px; border-radius: 16px; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); margin-bottom: 12px;">
                <span style="font-size: 26px; line-height: 1;">⚡</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                ILMEN<span style="color: #3b82f6;">ITE</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">
                Codeforces In-Browser IDE & Toolkit
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">
                ${purpose === 'login' ? 'Sign In Verification' : 'Verify Your Account'}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Use the 6-digit one-time verification code below to ${actionText} on the Ilmenite Chrome Extension.
              </p>

              <!-- OTP Code Display Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 36px; background-color: rgba(59, 130, 246, 0.1); border: 2px dashed #3b82f6; border-radius: 16px;">
                      <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #60a5fa; font-family: 'SF Mono', Consolas, 'Courier New', monospace; display: block;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; font-size: 13px; text-align: center; color: #60a5fa; font-weight: 600;">
                ⏱ This verification code is valid for 10 minutes.
              </p>

              <!-- Security Notice Callout -->
              <div style="background-color: #1e293b; border: 1px solid #334155; border-left: 4px solid #3b82f6; border-radius: 10px; padding: 14px 18px; margin: 24px 0 0 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #cbd5e1;">
                  <strong style="color: #ffffff;">Security Tip:</strong> Never share this code with anyone. Ilmenite will never ask for your code or password outside of the official extension.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                If you did not request this verification code, you can safely ignore this email. No changes will be made to your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
                Ilmenite
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © ${new Date().getFullYear()} Ilmenite. Designed for Competitive Programmers.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Try Brevo HTTP API
    if (process.env.BREVO_API_KEY) {
        const brevoResult = await sendViaBrevo(process.env.BREVO_API_KEY, toEmail, otp, htmlContent, purpose);
        if (brevoResult.success) return brevoResult;
    }

    // Console fallback mode
    console.log('----------------------------------------------------');
    console.log(`[AUTH-OTP-FALLBACK] Candidate: ${toEmail} | Verification Code: ${otp} | Purpose: ${purpose}`);
    console.log('----------------------------------------------------');

    return {
        success: true,
        delivered: false,
        messageId: 'console-otp-fallback'
    };
}
