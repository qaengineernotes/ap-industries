/**
 * Cloudflare Pages Function: /api/send-email
 * Integrates Resend.com API to send email notifications for form submissions.
 */

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    try {
        const env = context.env || {};
        const apiKey = env.RESEND_API_KEY || env.resend_api_key || env.RESEND_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'RESEND_API_KEY environment variable is missing in Cloudflare Pages dashboard. Please go to Cloudflare Dashboard > Workers & Pages > Settings > Environment Variables, add RESEND_API_KEY with your Resend API Key, and redeploy.',
                }),
                { status: 200, headers: corsHeaders }
            );
        }

        const data = await context.request.json();
        const {
            name = 'Valued Customer',
            company = 'N/A',
            email = '',
            phone = 'N/A',
            subject = 'General Inquiry',
            message = '',
            page = 'Website Contact Form'
        } = data;

        // Basic Validation
        if (!message && !subject) {
            return new Response(
                JSON.stringify({ success: false, error: 'Please provide inquiry details or a message.' }),
                { status: 400, headers: corsHeaders }
            );
        }

        const adminEmail = env.ADMIN_EMAIL || 'info.apindustries14@gmail.com';
        const senderEmail = env.SENDER_EMAIL || 'A.P. Industries <onboarding@resend.dev>';
        const formattedDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
        const logoUrl = 'https://ap-industries.pages.dev/images/logo.png';

        // 1. Send Notification Email to Admin (info.apindustries14@gmail.com)
        const adminEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #212121; }
                    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-top: 5px solid #D32F2F; }
                    .header-logo { background: #212121; padding: 25px 30px; text-align: center; }
                    .header-logo img { max-height: 48px; width: auto; vertical-align: middle; }
                    .header-title { background: #1a1a1a; color: #ffffff; padding: 15px 30px; border-bottom: 1px solid #333; text-align: center; }
                    .header-title h2 { margin: 0; font-size: 20px; color: #ffffff; letter-spacing: 0.5px; }
                    .header-title p { margin: 4px 0 0 0; font-size: 13px; color: #9e9e9e; }
                    .content { padding: 30px; }
                    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    .table-data td { padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-size: 14px; }
                    .table-data td.label { font-weight: 600; color: #616161; width: 35%; background: #fafafa; }
                    .table-data td.value { color: #212121; word-break: break-word; }
                    .message-box { background: #f8fafc; border-left: 4px solid #D32F2F; padding: 18px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #212121; white-space: pre-wrap; margin-top: 8px; }
                    .footer { background: #212121; color: #9e9e9e; padding: 20px 30px; text-align: center; font-size: 12px; border-top: 1px solid #333; }
                    .footer a { color: #ffffff; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header-logo">
                        <img src="${logoUrl}" alt="A.P. Industries Logo" />
                    </div>
                    <div class="header-title">
                        <h2>New Inquiry Received</h2>
                        <p>Source Page: ${escapeHtml(page)}</p>
                    </div>
                    <div class="content">
                        <table class="table-data">
                            <tr>
                                <td class="label">Contact Name</td>
                                <td class="value"><strong>${escapeHtml(name)}</strong></td>
                            </tr>
                            <tr>
                                <td class="label">Company Name</td>
                                <td class="value">${escapeHtml(company)}</td>
                            </tr>
                            <tr>
                                <td class="label">Email Address</td>
                                <td class="value">${email ? `<a href="mailto:${escapeHtml(email)}" style="color: #D32F2F; font-weight: 500;">${escapeHtml(email)}</a>` : 'Not provided'}</td>
                            </tr>
                            <tr>
                                <td class="label">Phone / Mobile</td>
                                <td class="value">${phone ? `<a href="tel:${escapeHtml(phone)}" style="color: #212121; font-weight: 500;">${escapeHtml(phone)}</a>` : 'Not provided'}</td>
                            </tr>
                            <tr>
                                <td class="label">Subject / Product</td>
                                <td class="value">${escapeHtml(subject)}</td>
                            </tr>
                            <tr>
                                <td class="label">Submission Date</td>
                                <td class="value">${formattedDate}</td>
                            </tr>
                        </table>
                        <div style="font-weight:600; margin-bottom: 6px; color: #616161; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message / Specifications:</div>
                        <div class="message-box">${escapeHtml(message)}</div>
                    </div>
                    <div class="footer">
                        A.P. Industries Automated Notification System<br>
                        Phase-IV, Pushkar Industrial Hub, Ahmedabad, Gujarat, India
                    </div>
                </div>
            </body>
            </html>
        `;

        const adminPayload = {
            from: senderEmail,
            to: [adminEmail],
            subject: `New Inquiry: ${subject} - ${name}`,
            html: adminEmailHtml,
            ...(email ? { reply_to: email } : {})
        };

        const adminResendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminPayload)
        });

        const adminResData = await adminResendRes.json();

        if (!adminResendRes.ok) {
            console.error('Resend Admin Email Error:', adminResData);
            let errorMsg = adminResData.message || 'Failed to send admin notification email.';
            if (errorMsg.includes('testing emails') || errorMsg.includes('own email address') || errorMsg.includes('verify')) {
                errorMsg += ' Note: With Resend free tier (onboarding@resend.dev), emails can only be sent to the email address registered with your Resend account. Please add & verify your custom domain in Resend dashboard to send to info.apindustries14@gmail.com.';
            }
            return new Response(
                JSON.stringify({
                    success: false,
                    error: errorMsg
                }),
                { status: 200, headers: corsHeaders }
            );
        }

        // 2. Send Customer Confirmation Email (ONLY IF user submitted an Email address)
        let clientEmailSent = false;
        if (email && email.includes('@')) {
            const customerEmailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #212121; }
                        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-top: 5px solid #D32F2F; }
                        .header { background: #212121; padding: 25px 30px; text-align: center; border-bottom: 3px solid #D32F2F; }
                        .header img { max-height: 50px; width: auto; vertical-align: middle; }
                        .header-subtext { color: #bdbdbd; font-size: 12px; margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase; }
                        .content { padding: 35px 30px; line-height: 1.6; color: #333333; }
                        .greeting { font-size: 18px; font-weight: 600; color: #212121; margin-bottom: 15px; }
                        .body-text { font-size: 15px; color: #424242; margin-bottom: 20px; line-height: 1.6; }
                        .contact-box { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 25px 0; border-left: 4px solid #D32F2F; }
                        .contact-box h4 { margin: 0 0 12px 0; font-size: 14px; color: #212121; text-transform: uppercase; letter-spacing: 0.5px; }
                        .contact-item { margin: 8px 0; font-size: 14px; color: #424242; display: flex; align-items: center; }
                        .contact-item strong { min-width: 80px; color: #212121; }
                        .contact-item a { color: #D32F2F; text-decoration: none; font-weight: 500; }
                        .contact-item a:hover { text-decoration: underline; }
                        .signature { margin-top: 25px; font-size: 14px; color: #424242; }
                        .signature strong { color: #212121; }
                        .footer { background: #212121; color: #9e9e9e; padding: 25px 30px; text-align: center; font-size: 12px; border-top: 1px solid #333; }
                        .footer-address { margin-bottom: 15px; line-height: 1.5; color: #bdbdbd; }
                        .social-links { margin: 18px 0 12px 0; text-align: center; }
                        .social-btn { display: inline-block; margin: 0 8px; background: #333333; color: #ffffff !important; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500; transition: background 0.3s; }
                        .social-btn.fb { background: #1877F2; }
                        .social-btn.li { background: #0A66C2; }
                        .social-btn.yt { background: #FF0000; }
                        .copyright { margin-top: 15px; font-size: 11px; color: #757575; border-top: 1px solid #333; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="header">
                            <img src="${logoUrl}" alt="A.P. Industries Logo" />
                            <div class="header-subtext">Industrial Packaging Machinery & Heating Solutions</div>
                        </div>

                        <div class="content">
                            <div class="greeting">Dear ${escapeHtml(name)},</div>

                            <div class="body-text">
                                Thank you for reaching out to A.P. Industries.
                            </div>

                            <div class="body-text">
                                We have received your inquiry and assigned it to our technical sales team. A representative will contact you shortly to assist with your requirements.
                            </div>

                            <div class="contact-box">
                                <h4>Need Immediate Assistance?</h4>
                                <div class="contact-item">
                                    <strong>Phone:</strong> <a href="tel:+919726686181">+91 97266 86181</a>
                                </div>
                                <div class="contact-item">
                                    <strong>Email:</strong> <a href="mailto:info.apindustries14@gmail.com">info.apindustries14@gmail.com</a>
                                </div>
                                <div class="contact-item">
                                    <strong>Website:</strong> <a href="http://www.apindustriesindia.com" target="_blank">www.apindustriesindia.com</a>
                                </div>
                            </div>

                            <div class="signature">
                                Best regards,<br>
                                <strong>A.P. Industries Team</strong>
                            </div>
                        </div>

                        <div class="footer">
                            <div class="footer-address">
                                Phase-IV, Pushkar Industrial Hub, Ahmedabad, Gujarat, India
                            </div>

                            <div class="social-links">
                                <a href="https://facebook.com" class="social-btn fb" target="_blank">Facebook</a>
                                <a href="https://linkedin.com" class="social-btn li" target="_blank">LinkedIn</a>
                                <a href="https://youtube.com" class="social-btn yt" target="_blank">YouTube</a>
                            </div>

                            <div class="copyright">
                                &copy; ${new Date().getFullYear()} A.P. Industries. All rights reserved.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const customerPayload = {
                from: senderEmail,
                to: [email],
                subject: `Thank you for reaching out to A.P. Industries`,
                html: customerEmailHtml,
                reply_to: adminEmail
            };

            try {
                const customerResendRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(customerPayload)
                });
                clientEmailSent = customerResendRes.ok;
                if (!customerResendRes.ok) {
                    const custData = await customerResendRes.json();
                    console.warn('Customer Email Warning:', custData);
                }
            } catch (err) {
                console.error('Failed to send customer confirmation:', err);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Inquiry submitted successfully! Our team will get back to you shortly.',
                clientEmailSent: clientEmailSent
            }),
            { status: 200, headers: corsHeaders }
        );

    } catch (err) {
        console.error('Server error processing form:', err);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'An internal server error occurred while processing your inquiry.'
            }),
            { status: 500, headers: corsHeaders }
        );
    }
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
