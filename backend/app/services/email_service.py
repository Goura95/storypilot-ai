import os

import resend
from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# RESEND CONFIGURATION
# ============================================================

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

if not RESEND_API_KEY:
    raise RuntimeError(
        "RESEND_API_KEY is not configured."
    )

resend.api_key = RESEND_API_KEY


# ============================================================
# SEND MFA OTP
# ============================================================

def send_mfa_otp(
    recipient_email: str,
    otp: str,
):
    """
    Send MFA (Multi-Factor Authentication) OTP
    through Resend.
    """

    params = {
        "from": "StoryPilot AI <onboarding@resend.dev>",
        "to": [recipient_email],
        "subject": "StoryPilot AI - MFA Verification Code",
        "html": f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 520px;
            margin: 0 auto;
            padding: 32px;
            background: #0f172a;
            color: #ffffff;
            border-radius: 16px;
        ">

            <h2 style="
                margin: 0 0 20px 0;
                color: #ffffff;
            ">
                StoryPilot AI
            </h2>

            <p style="
                color: #cbd5e1;
                font-size: 15px;
            ">
                Your MFA verification code is:
            </p>

            <div style="
                margin: 28px 0;
                padding: 20px;
                background: #1e293b;
                border-radius: 12px;
                text-align: center;
            ">

                <span style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #a78bfa;
                ">
                    {otp}
                </span>

            </div>

            <p style="
                color: #cbd5e1;
                font-size: 14px;
            ">
                This verification code will expire
                in 5 minutes.
            </p>

            <p style="
                margin-top: 24px;
                color: #64748b;
                font-size: 12px;
            ">
                If you did not attempt to sign in to
                StoryPilot AI, you can safely ignore
                this email.
            </p>

        </div>
        """,
    }

    try:

        response = resend.Emails.send(params)

        print(
            f"MFA OTP sent successfully to {recipient_email}"
        )

        return response

    except Exception as error:

        print(
            f"Failed to send MFA OTP: {error}"
        )

        raise