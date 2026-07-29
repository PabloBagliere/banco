export const buildEmailVerificationHtml = (verificationUrl: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Verify your email</title>
</head>

<body style="
margin:0;
padding:0;
background:#0b0f17;
font-family:Inter,Segoe UI,Arial,sans-serif;
color:#e5e7eb;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:60px 20px;">

<table
width="600"
cellpadding="0"
cellspacing="0"
style="
background:#111827;
border:1px solid #1f2937;
border-radius:12px;
padding:48px;
">

<tr>
<td>

<div style="
font-size:24px;
font-weight:700;
color:#22c55e;
margin-bottom:24px;
">
[bank]
</div>

<h1 style="
margin:0;
font-size:28px;
color:#ffffff;
font-weight:700;
">
Verify your email
</h1>

<p style="
margin-top:20px;
line-height:28px;
font-size:16px;
color:#9ca3af;
">
Welcome.

Before using your account we need to verify that this email
belongs to you.
</p>

<div style="
margin:40px 0;
text-align:center;
">

<a
href="${verificationUrl}"
style="
display:inline-block;
padding:16px 32px;
background:#22c55e;
color:#08110b;
text-decoration:none;
font-weight:700;
border-radius:8px;
font-size:16px;
"
>
Verify email
</a>

</div>

<p style="
font-size:14px;
line-height:24px;
color:#6b7280;
">
If the button doesn't work, copy and paste this link into your browser.
</p>

<p style="
word-break:break-all;
font-size:13px;
color:#60a5fa;
">
${verificationUrl}
</p>

<hr
style="
margin:40px 0;
border:none;
border-top:1px solid #1f2937;
"
/>

<p style="
font-size:13px;
color:#6b7280;
line-height:22px;
margin:0;
">
This verification link expires in 1 hour.
If you didn't create this account, you can safely ignore this email.
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
