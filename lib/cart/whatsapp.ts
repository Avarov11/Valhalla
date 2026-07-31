import type { ResolvedCartLine } from "@/lib/cart/types";

const WHATSAPP_NUMBER = "201000100115";
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;

/**
 * wa.me click-to-chat links have no officially documented length limit,
 * but very long ones fail silently or get truncated on some Android
 * WebViews and older mobile browsers in practice. 2000 characters for
 * the full URL (prefix plus encoded text) is a conservative safety
 * margin, chosen deliberately rather than discovered the hard way: the
 * fixed header, grand total, and bilingual tax note together run under
 * 250 characters, which leaves comfortable room for a real order before
 * this ever engages.
 *
 * An order whose itemized list would exceed the cap does not fail or
 * get cut off mid-line. It keeps as many full item lines as fit (in cart
 * order), replaces the rest with a single "+N more items, included in
 * the total" line, and always keeps the grand total and tax note intact
 * since that's what's needed to actually complete the order in person or
 * over the call.
 */
const MAX_URL_LENGTH = 2000;

function formatMoney(amount: number): string {
  return `${amount.toFixed(2)} EGP`;
}

function formatLine(line: ResolvedCartLine): string {
  const sizePart = line.sizeLabel ? ` (${line.sizeLabel})` : "";
  const addonsPart = line.addons.length > 0 ? ` + ${line.addons.map((a) => a.name).join(", ")}` : "";
  return `${line.quantity}x ${line.name}${sizePart}${addonsPart} - ${formatMoney(line.lineTotal)}`;
}

function assembleMessage(itemLines: string[], omittedCount: number, grandTotal: number): string {
  const body = [...itemLines];
  if (omittedCount > 0) {
    body.push(`+ ${omittedCount} more item${omittedCount === 1 ? "" : "s"}, included in the total`);
  }

  return [
    "New order from the Valhalla website:",
    "",
    ...body,
    "",
    `Total: ${formatMoney(grandTotal)}`,
    "Prices include taxes",
    "السعر شامل القيمة المضافة",
  ].join("\n");
}

function urlFor(message: string): string {
  return `${WHATSAPP_BASE}${encodeURIComponent(message)}`;
}

export function buildWhatsAppOrder(lines: ResolvedCartLine[]): {
  url: string;
  message: string;
  truncated: boolean;
} {
  const grandTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const fullItemLines = lines.map(formatLine);

  const fullMessage = assembleMessage(fullItemLines, 0, grandTotal);
  const fullUrl = urlFor(fullMessage);

  if (fullUrl.length <= MAX_URL_LENGTH) {
    return { url: fullUrl, message: fullMessage, truncated: false };
  }

  const includedLines: string[] = [];
  for (let i = 0; i < fullItemLines.length; i++) {
    const omittedIfIncluded = lines.length - (includedLines.length + 1);
    const candidateMessage = assembleMessage(
      [...includedLines, fullItemLines[i]],
      omittedIfIncluded,
      grandTotal,
    );
    if (urlFor(candidateMessage).length > MAX_URL_LENGTH) {
      break;
    }
    includedLines.push(fullItemLines[i]);
  }

  const omitted = lines.length - includedLines.length;
  const message = assembleMessage(includedLines, omitted, grandTotal);

  return { url: urlFor(message), message, truncated: omitted > 0 };
}
