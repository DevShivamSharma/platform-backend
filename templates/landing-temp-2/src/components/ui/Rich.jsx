import { Fragment } from 'react';

// Renders config/content "rich text" — an array of inline segments — into the
// exact emphasis markup the design uses, so all copy can live in JSON while the
// look stays identical. A segment is one of:
//   "plain string"                      -> raw text node
//   { "t": "word", "em": "<variant>" }  -> emphasized span/em
//   { "br": true }                      -> line break
//
// Emphasis variants map 1:1 to existing CSS classes:
//   display-italic   -> <em class="display-italic">      (heading italic)
//   signature        -> <em class="signature">           (inline accent italic)
//   signature-plain  -> <em class="signature not-italic"> (upright accent)
//   muted            -> <span class="text-fg-3">         (de-emphasized)
function segment(node, key) {
  if (node == null) return null;
  if (typeof node === 'string') return <Fragment key={key}>{node}</Fragment>;
  if (node.br) return <br key={key} />;
  const t = node.t ?? '';
  switch (node.em) {
    case 'display-italic':
      return <em key={key} className="display-italic">{t}</em>;
    case 'signature':
      return <em key={key} className="signature">{t}</em>;
    case 'signature-plain':
      return <em key={key} className="signature not-italic">{t}</em>;
    case 'muted':
      return <span key={key} className="text-fg-3">{t}</span>;
    default:
      return <Fragment key={key}>{t}</Fragment>;
  }
}

// Render a full rich array (or a single string/segment) inline. Pass a single
// segment as `nodes={[seg]}` where a word needs its own animated wrapper
// (e.g. staggered hero/CTA words).
export function Rich({ nodes }) {
  const arr = Array.isArray(nodes) ? nodes : nodes == null ? [] : [nodes];
  return <>{arr.map((n, i) => segment(n, i))}</>;
}

export default Rich;
