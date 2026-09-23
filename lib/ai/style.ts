export const RESPONSE_STYLES = ["qisqa", "muvozanatli", "batafsil"] as const;

export type ResponseStyleId = (typeof RESPONSE_STYLES)[number];

const STYLE_ADDONS: Record<ResponseStyleId, string> = {
  qisqa: "Response style: concise. Prefer short answers. Skip filler.",
  muvozanatli: "Response style: balanced. Be clear and complete without padding.",
  batafsil: "Response style: detailed. Explain reasoning and include useful structure.",
};

export function isResponseStyleId(value: string): value is ResponseStyleId {
  return (RESPONSE_STYLES as readonly string[]).includes(value);
}

export function styleAddon(id: string | undefined) {
  if (!id || !isResponseStyleId(id)) return STYLE_ADDONS.muvozanatli;
  return STYLE_ADDONS[id];
}
