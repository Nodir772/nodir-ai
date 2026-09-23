export function conversationToMarkdown(title: string, date: string, messages: { role: string; content: string }[]) {
  const lines = [`# ${title}`, `Nodir AI · ${date}`, ""];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    lines.push(message.role === "user" ? "## Siz" : "## Nodir AI");
    lines.push(message.content);
    lines.push("");
  }
  return lines.join("\n");
}

export function conversationToText(title: string, date: string, messages: { role: string; content: string }[]) {
  return conversationToMarkdown(title, date, messages)
    .replace(/^#+\s/gm, "")
    .replace(/\*\*/g, "");
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function conversationToJson(title: string, date: string, messages: { role: string; content: string }[]) {
  return JSON.stringify({ title, date, product: "Nodir AI", messages }, null, 2);
}

export function printConversationPdf(title: string, date: string, messages: { role: string; content: string }[]) {
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Georgia,serif;max-width:720px;margin:40px auto;color:#111;line-height:1.5}
    h1{font-size:22px} .meta{color:#555;font-size:13px} .msg{margin:18px 0}
    .role{font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.04em}
  </style></head><body>
  <h1>Nodir AI</h1>
  <p class="meta">${escapeHtml(title)} · ${escapeHtml(date)}</p>
  ${messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map(
      (message) =>
        `<div class="msg"><div class="role">${message.role === "user" ? "Siz" : "Nodir AI"}</div><div>${escapeHtml(message.content).replace(/\n/g, "<br/>")}</div></div>`,
    )
    .join("")}
  </body></html>`;
  const popup = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!popup) return false;
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
