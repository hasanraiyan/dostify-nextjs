/** An entry is stored as one string: first line = title, the rest = body. */
export function splitText(text: string) {
  const lines = text.trim().split("\n");
  return { title: lines[0] ?? "", body: lines.slice(1).join("\n").trim() };
}

export function joinText(title: string, body: string) {
  return body ? `${title}\n${body}` : title;
}
