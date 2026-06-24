export function sanitizeTelegramHTML(text: string): string {
  // Telegram allowed tags including the requested new Rich Message formatting tags
  const allowedTags = [
    'b', 'strong', 'i', 'em', 'code', 's', 'strike', 'del', 'u', 'ins', 'pre',
    'a', 'tg-emoji', 'tg-spoiler', 'span', 'blockquote', 'expandable-blockquote',
    // New Rich Message tags requested
    'table', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'hr', 'tg-thinking'
  ];

  // We want to escape any `<` or `>` that is NOT part of an allowed tag.
  // This is a naive regex approach but works well for LLM outputs.
  
  // First, temporarily replace allowed tags with placeholders
  const placeholders: string[] = [];
  
  // Build a regex that matches any allowed tag (opening, closing, and self-closing, with attributes)
  const tagRegex = new RegExp("<(/)?(" + allowedTags.join('|') + ")(\\\\s+[^>]+)?>", 'gi');
  
  let sanitized = text.replace(tagRegex, (match) => {
    placeholders.push(match);
    return "__TAG_" + (placeholders.length - 1) + "__";
  });

  // Now escape the remaining unsafe characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Restore the placeholders
  placeholders.forEach((tag, index) => {
    sanitized = sanitized.replace("__TAG_" + index + "__", tag);
  });

  return sanitized;
}
