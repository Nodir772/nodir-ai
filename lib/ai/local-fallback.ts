import type { AIMessage } from "@/lib/ai/types";
import type { SearchHit } from "@/lib/search/types";

function lastUserText(history: AIMessage[]) {
  return [...history].reverse().find((message) => message.role === "user")?.content.trim() ?? "";
}

function isUzbek(text: string) {
  return /[o‘ogʻg‘ʼʻ]|salom|nima|qanday|qil|yordam|kod|tarjima|yoz/i.test(text);
}

function withSources(body: string, sources?: SearchHit[]) {
  if (!sources?.length) return body;
  const lines = sources
    .slice(0, 5)
    .map((source, index) => `${index + 1}. ${source.title} — ${source.url}${source.snippet ? `\n   ${source.snippet}` : ""}`)
    .join("\n");
  return `${body}\n\nManbalar:\n${lines}`;
}

function calculatorHtml() {
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kalkulyator</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: sans-serif; background: #0f172a; color: #e2e8f0; }
    .calc { width: min(360px, 92vw); background: #1e293b; border-radius: 24px; padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.35); }
    #display { width: 100%; box-sizing: border-box; margin-bottom: 12px; padding: 16px; font-size: 28px; text-align: right; border: 0; border-radius: 14px; background: #0b1224; color: #fff; }
    .keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    button { height: 56px; border: 0; border-radius: 14px; font-size: 18px; cursor: pointer; background: #334155; color: #fff; }
    button.op { background: #4f7cff; }
    button.eq { background: #22c55e; grid-column: span 2; }
    button.warn { background: #ef4444; }
  </style>
</head>
<body>
  <div class="calc">
    <input id="display" value="0" readonly />
    <div class="keys">
      <button class="warn" data-act="clear">C</button>
      <button data-act="del">⌫</button>
      <button class="op" data-val="/">÷</button>
      <button class="op" data-val="*">×</button>
      <button data-val="7">7</button>
      <button data-val="8">8</button>
      <button data-val="9">9</button>
      <button class="op" data-val="-">−</button>
      <button data-val="4">4</button>
      <button data-val="5">5</button>
      <button data-val="6">6</button>
      <button class="op" data-val="+">+</button>
      <button data-val="1">1</button>
      <button data-val="2">2</button>
      <button data-val="3">3</button>
      <button data-val=".">.</button>
      <button data-val="0">0</button>
      <button class="eq" data-act="eq">=</button>
    </div>
  </div>
  <script>
    const display = document.getElementById("display");
    let expr = "";
    function render() { display.value = expr || "0"; }
    function push(v) { if (v === "." && /\\.\\d*$/.test(expr)) return; expr += v; render(); }
    document.querySelector(".keys").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.val) return push(btn.dataset.val);
      if (btn.dataset.act === "clear") { expr = ""; return render(); }
      if (btn.dataset.act === "del") { expr = expr.slice(0, -1); return render(); }
      if (btn.dataset.act === "eq") {
        try { expr = String(Function('"use strict"; return (' + expr.replace(/[^0-9.+\\-*/()]/g, "") + ")")()); }
        catch { expr = ""; }
        render();
      }
    });
  </script>
</body>
</html>`;
}

function pythonHello() {
  return `print("Hello, World")`;
}

function todoHtml() {
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <title>Todo</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; display: grid; place-items: start center; padding: 40px 16px; }
    form, ul { width: min(420px, 92vw); }
    input { width: 70%; padding: 10px; border-radius: 10px; border: 0; }
    button { padding: 10px 14px; border: 0; border-radius: 10px; background: #4f7cff; color: #fff; }
    li { display: flex; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid #334155; }
  </style>
</head>
<body>
  <form id="f"><input id="t" placeholder="Vazifa..." /><button>Qo‘shish</button></form>
  <ul id="list"></ul>
  <script>
    const list = document.getElementById("list");
    document.getElementById("f").onsubmit = (e) => {
      e.preventDefault();
      const v = document.getElementById("t").value.trim();
      if (!v) return;
      const li = document.createElement("li");
      li.innerHTML = "<span></span><button type='button'>O‘chirish</button>";
      li.querySelector("span").textContent = v;
      li.querySelector("button").onclick = () => li.remove();
      list.append(li);
      document.getElementById("t").value = "";
    };
  </script>
</body>
</html>`;
}

function genericHtml(prompt: string) {
  const title = prompt.replace(/[<>]/g, "").slice(0, 80);
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f172a; color: #e2e8f0; }
    main { width: min(520px, 92vw); background: #1e293b; padding: 24px; border-radius: 20px; }
    input, textarea, button { width: 100%; box-sizing: border-box; margin-top: 8px; padding: 10px 12px; border-radius: 12px; border: 0; font: inherit; }
    button { background: #4f7cff; color: #fff; cursor: pointer; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <textarea id="in" rows="4" placeholder="Matn..."></textarea>
    <button id="go">Bajarish</button>
    <pre id="out"></pre>
  </main>
  <script>
    document.getElementById("go").onclick = () => {
      const v = document.getElementById("in").value.trim();
      document.getElementById("out").textContent = v || "Tayyor.";
    };
  </script>
</body>
</html>`;
}

function wantsCode(text: string) {
  return /kod|code|function|python|javascript|typescript|html|css|react|kalkul|calculator|yozib ber|yozber|yozamiz|dastur|script/i.test(
    text,
  );
}

function directCode(text: string) {
  if (/kalkul|calculator/i.test(text)) {
    return isUzbek(text)
      ? `Tayyor. Bitta HTML faylga saqlang va brauzerda oching:\n\n\`\`\`html\n${calculatorHtml()}\n\`\`\``
      : `Save this as one HTML file and open it in a browser:\n\n\`\`\`html\n${calculatorHtml()}\n\`\`\``;
  }
  if (/todo|vazifa ro.?yxat|to-?do/i.test(text)) {
    return `Tayyor todo. HTML faylga saqlang:\n\n\`\`\`html\n${todoHtml()}\n\`\`\``;
  }
  if (/python/i.test(text) && /hello|salom/i.test(text)) {
    return `\`\`\`python\n${pythonHello()}\n\`\`\``;
  }
  if (/python/i.test(text)) {
    return `\`\`\`python\n# ${text.replace(/\n/g, " ").slice(0, 80)}\ndef main():\n    print("Ishga tushdi")\n\nif __name__ == "__main__":\n    main()\n\`\`\``;
  }
  return isUzbek(text)
    ? `Tayyor. HTML faylga saqlang va oching:\n\n\`\`\`html\n${genericHtml(text)}\n\`\`\``
    : `Save this HTML file and open it:\n\n\`\`\`html\n${genericHtml(text)}\n\`\`\``;
}

function answerFromSources(text: string, sources?: SearchHit[]) {
  if (!sources?.length) return null;
  const top = sources[0];
  const extra = sources
    .slice(0, 3)
    .map((source) => source.snippet)
    .filter(Boolean)
    .join(" ");
  return isUzbek(text)
    ? `${top.title}: ${extra || top.snippet || top.url}`
    : `${top.title}: ${extra || top.snippet || top.url}`;
}

export function buildLocalAssistantReply(history: AIMessage[], sources?: SearchHit[]) {
  const last = lastUserText(history);
  if (!last) {
    return "Salom! Men Nodir AI. Savolingizni yozing — yordam beraman.";
  }

  if (/^(salom+|assalomu alaykum|hello|hi|hey|qalaysan|qalaysiz)[\s!.?]*$/i.test(last)) {
    const greet = isUzbek(last)
      ? "Salom! Men Nodir AI. Nima qilishni yozing — darhol bajaraman."
      : "Hello! I'm Nodir AI. Tell me what to make and I’ll do it.";
    return withSources(greet, sources);
  }

  if (wantsCode(last)) {
    return withSources(directCode(last), sources);
  }

  if (/tarjima|translate/i.test(last)) {
    const quoted = last.replace(/^(.*?(tarjima|translate)\s*(qil|qilib)?\s*)/i, "").trim();
    if (quoted && quoted !== last) {
      return quoted;
    }
  }

  const fromWeb = answerFromSources(last, sources);
  if (fromWeb) return withSources(fromWeb, sources);

  return isUzbek(last)
    ? "Hozir haqiqiy model ulanmagan, shuning uchun bu savolga to'g'ri javob bera olmayman."
    : "The real model is not connected, so I cannot answer this question yet.";
}

export function chunkLocalReply(text: string) {
  const parts = text.split(/(\s+)/).filter((part) => part.length > 0);
  return parts.length ? parts : [text];
}
