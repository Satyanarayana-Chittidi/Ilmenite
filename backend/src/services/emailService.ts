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
    htmlContent: string
): Promise<SendOtpResult> {
    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
    const cleanSender = (process.env.BREVO_SENDER_EMAIL || 'no-reply@ilmenite.dev').trim().replace(/^["']|["']$/g, '');
    const cleanTo = toEmail.trim().toLowerCase();

    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': cleanKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'Ilmenite', email: cleanSender },
                to: [{ email: cleanTo }],
                subject: 'Verify your Ilmenite account',
                htmlContent,
                textContent: `Your Ilmenite verification code is: ${otp}. This code is valid for 10 minutes. If you did not request this, please ignore this email.`
            })
        });

        const data: any = await res.json();
        if (res.ok) {
            console.log(`[BREVO-API] ✓ Email successfully queued by Brevo for ${cleanTo} (MessageId: ${data.messageId})`);
            return { success: true, delivered: true, messageId: data.messageId };
        } else {
            console.error(`[BREVO-API ERROR] Status: ${res.status}, Response:`, JSON.stringify(data));
            throw new Error(data.message || 'Brevo API returned error');
        }
    } catch (err: any) {
        console.error(`[BREVO-API] Failed to dispatch email to ${toEmail}:`, err.message);
        return { success: false, delivered: false, error: err.message };
    }
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<SendOtpResult> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ilmenite Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 24px 40px; text-align: center; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <img src="https://ilmenite.vercel.app/assets/ilmenite_icon.png" width="48" height="48" alt="Ilmenite Logo" style="display: block; margin: 0 auto 12px auto; border-radius: 12px;" />
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
                ILMEN<span style="color: #3b82f6;">ITE</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">
                Codeforces In-Browser IDE & Toolkit
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">
                Verify Your Account
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                Thank you for joining Ilmenite. Use the 6-digit one-time verification code below to complete your registration and activate your account.
              </p>

              <!-- OTP Code Display Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 36px; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 16px;">
                      <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace; display: block;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; font-size: 13px; text-align: center; color: #2563eb; font-weight: 600;">
                ⏱ This verification code is valid for 10 minutes.
              </p>

              <!-- Security Notice Callout -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 10px; padding: 14px 18px; margin: 24px 0 0 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #475569;">
                  <strong style="color: #0f172a;">Security Tip:</strong> Never share this verification code with anyone. Ilmenite will never ask for your code or password outside of the official extension.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
                If you did not initiate this request, you can safely ignore this email. No changes will be made to your email or account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #475569;">
                Ilmenite
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Ilmenite. Designed for Competitive Programmers.
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

    if (process.env.BREVO_API_KEY) {
        const brevoResult = await sendViaBrevo(process.env.BREVO_API_KEY, toEmail, otp, htmlContent);
        if (brevoResult.success) {
            return brevoResult;
        }
    }

    console.log('----------------------------------------------------');
    console.log(`[AUTH-OTP-FALLBACK] Candidate: ${toEmail} | Verification Code: ${otp}`);
    console.log('----------------------------------------------------');

    return {
        success: true,
        delivered: false,
        messageId: 'console-otp-fallback'
    };
}
