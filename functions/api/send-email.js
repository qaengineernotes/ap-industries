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

        // 1. Send Notification Email to Admin (info.apindustries14@gmail.com)
        const adminEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
                    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-top: 4px solid #1e3a8a; }
                    .header { background: #0f172a; color: #ffffff; padding: 25px 30px; text-align: center; }
                    .header h2 { margin: 0; font-size: 22px; letter-spacing: 0.5px; color: #ffffff; }
                    .header p { margin: 5px 0 0 0; font-size: 13px; color: #94a3b8; }
                    .content { padding: 30px; }
                    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    .table-data td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                    .table-data td.label { font-weight: 600; color: #475569; width: 35%; background: #f8fafc; }
                    .table-data td.value { color: #0f172a; word-break: break-word; }
                    .message-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 18px; border-radius: 4px; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; }
                    .footer { background: #f1f5f9; padding: 15px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <h2>New Inquiry Received</h2>
                        <p>Submitted via A.P. Industries Website (${page})</p>
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
                                <td class="value">${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : 'Not provided'}</td>
                            </tr>
                            <tr>
                                <td class="label">Phone / Mobile</td>
                                <td class="value">${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>` : 'Not provided'}</td>
                            </tr>
                            <tr>
                                <td class="label">Subject / Category</td>
                                <td class="value">${escapeHtml(subject)}</td>
                            </tr>
                            <tr>
                                <td class="label">Submission Date</td>
                                <td class="value">${formattedDate}</td>
                            </tr>
                        </table>
                        <div style="font-weight:600; margin-bottom: 8px; color: #475569;">Inquiry Details / Message:</div>
                        <div class="message-box">${escapeHtml(message)}</div>
                    </div>
                    <div class="footer">
                        A.P. Industries Automated Notification System
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

        // 2. Send Customer Confirmation Email (if user submitted their email address)
        let clientEmailSent = false;
        if (email && email.includes('@')) {
            const customerEmailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
                        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-top: 4px solid #1e3a8a; }
                        .header { background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }
                        .header h1 { margin: 0 0 5px 0; font-size: 24px; color: #ffffff; letter-spacing: 1px; }
                        .header p { margin: 0; font-size: 13px; color: #94a3b8; }
                        .content { padding: 30px; line-height: 1.6; color: #334155; }
                        .content h3 { color: #0f172a; margin-top: 0; }
                        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
                        .summary-box p { margin: 6px 0; font-size: 14px; }
                        .btn { display: inline-block; background: #1e3a8a; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: 600; margin-top: 15px; }
                        .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="header">
                            <h1>A.P. INDUSTRIES</h1>
                            <p>Industrial Packaging Machinery & Heating Solutions</p>
                        </div>
                        <div class="content">
                            <h3>Thank You for Contacting Us, ${escapeHtml(name)}!</h3>
                            <p>We have successfully received your inquiry regarding <strong>${escapeHtml(subject)}</strong>. Our engineering and sales team is currently reviewing your specifications and will respond to you shortly.</p>

                            <div class="summary-box">
                                <strong style="color: #0f172a;">Summary of your submission:</strong>
                                <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
                                <p><strong>Company:</strong> ${escapeHtml(company)}</p>
                                <p><strong>Message / Specifications:</strong> ${escapeHtml(message)}</p>
                            </div>

                            <p>If you have any urgent requirements or need immediate assistance, please feel free to call our sales hotline directly.</p>
                            
                            <p style="margin-top: 25px;">
                                Best Regards,<br>
                                <strong>Sales & Technical Support Team</strong><br>
                                <strong>A.P. Industries</strong><br>
                                Email: <a href="mailto:${adminEmail}">${adminEmail}</a>
                            </p>
                        </div>
                        <div class="footer">
                            Phase-IV, Pushkar Industrial Hub, Ahmedabad, Gujarat, India<br>
                            &copy; ${new Date().getFullYear()} A.P. Industries. All rights reserved.
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
