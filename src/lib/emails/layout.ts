export function emailLayout(body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#141414;border:1px solid rgba(200,169,107,0.25);">
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;border-bottom:1px solid rgba(200,169,107,0.2);">
              <span style="font-size:11px;letter-spacing:0.35em;color:#C8A96B;text-transform:uppercase;">AFRESH</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#F5F5F5;font-size:15px;line-height:1.65;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;border-top:1px solid rgba(191,192,192,0.15);">
              <p style="margin:0;font-size:10px;letter-spacing:0.12em;color:#BFC0C0;text-transform:uppercase;">
                Global Fashion Movement — Born From Africa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ctaButton(label: string, href: string) {
  return `<p style="text-align:center;margin:28px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#C8A96B;color:#0A0A0A;text-decoration:none;
      font-size:11px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 28px;font-weight:600;">
      ${label}
    </a>
  </p>`;
}
