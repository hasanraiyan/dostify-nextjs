import { cn } from "cn";

const SVG_ROOT_RE = /<svg\b([^>]*)>/i;

/**
 * Strip dangerous attributes and elements from SVG markup so event-handler
 * injection (onload, onclick, …) and <script> tags can't execute.
 */
function sanitizeSvg(raw: string): string {
  return (
    raw
      // Remove <script> blocks entirely
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      // Remove on* event handler attributes (onclick, onload, etc.)
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
      // Remove javascript: hrefs
      .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
      .replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'")
  );
}

function attrValue(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i")
  );
  return match ? (match[1] ?? match[2] ?? null) : null;
}

/** Plain-number pixel sizes only; "100%", "12em" etc. carry no useful ratio. */
function numericSize(value: string | null): number | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(?:px)?$/i);
  return match ? Number(match[1]) : null;
}

/**
 * The SVG arrives with whatever width/height the model wrote — frequently
 * `width="800" height="600"` with no viewBox, which pins its rendered height
 * and breaks scaling in a fluid column. Make it fluid instead: guarantee a
 * viewBox (so the ratio is known), then drop fixed sizes from attributes and
 * inline styles so the wrapper's CSS alone controls the rendered size.
 */
function normalizeSvgRoot(source: string): string {
  const root = source.match(SVG_ROOT_RE);
  if (!root) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${source}</svg>`;
  }

  const [fullTag, attrs] = root;
  const width = numericSize(attrValue(fullTag, "width"));
  const height = numericSize(attrValue(fullTag, "height"));
  const hasViewBox = /\sviewBox\s*=/i.test(fullTag);

  let nextAttrs = attrs
    .replace(/\s(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (_match, dq, sq) => {
      const cleaned = (dq ?? sq ?? "")
        .split(";")
        .map((decl: string) => decl.trim())
        .filter((decl: string) => decl && !/^(width|height)\s*:/i.test(decl))
        .join("; ");
      return cleaned ? ` style="${cleaned}"` : "";
    });

  if (!hasViewBox) {
    nextAttrs = ` viewBox="0 0 ${width ?? 400} ${height ?? 300}"${nextAttrs}`;
  }

  return source.replace(fullTag, `<svg${nextAttrs}>`);
}

/**
 * Renders sanitized, fluidly-sized SVG markup. The wrapper is just a plain
 * <div> we control; callers pass sizing/layout via `className` (the `[&>svg]`
 * rules here keep the SVG scaling instead of using its intrinsic fixed size).
 */
function SvgPreview({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const markup = normalizeSvgRoot(sanitizeSvg(source));

  return (
    <div
      className={cn(
        "[&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-full",
        className
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized above
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export { normalizeSvgRoot, sanitizeSvg, SvgPreview };
