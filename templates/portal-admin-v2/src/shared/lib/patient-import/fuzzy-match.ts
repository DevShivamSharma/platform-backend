/**
 * @fileoverview Fuzzy Name Matching — matches insurance payer names using Dice coefficient
 *
 * Strategy:
 * 1. Exact match (case-insensitive, trimmed, collapsed whitespace) — fast path
 * 2. Fuzzy match via Dice coefficient (bigram similarity) — threshold ≥ 0.6
 * 3. No match — returns { matched: false }
 */

// ── Normalization ────────────────────────────────────────────────

/** Lowercase, trim, collapse multiple spaces */
function normalize(s: string): string {
    return s.toLowerCase().trim().replace(/\s+/g, " ")
}

// ── Dice Coefficient ─────────────────────────────────────────────

/** Extract character bigrams from a string */
function bigrams(s: string): Set<string> {
    const result = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) {
        result.add(s.slice(i, i + 2))
    }
    return result
}

/**
 * Compute Dice coefficient (bigram similarity) between two strings.
 * Returns a value between 0 (no overlap) and 1 (identical).
 *
 * Formula: 2 × |intersection| / (|bigrams(a)| + |bigrams(b)|)
 */
export function diceCoefficient(a: string, b: string): number {
    const na = normalize(a)
    const nb = normalize(b)

    if (na.length < 2 || nb.length < 2) return 0
    if (na === nb) return 1.0

    const bigramsA = bigrams(na)
    const bigramsB = bigrams(nb)

    let intersection = 0
    for (const bg of bigramsA) {
        if (bigramsB.has(bg)) intersection++
    }

    return (2 * intersection) / (bigramsA.size + bigramsB.size)
}

// ── Payer Matching ───────────────────────────────────────────────

const FUZZY_THRESHOLD = 0.6

export type PayerMatchResult =
    | { matched: true; payerName: string }
    | { matched: false }

/**
 * Find the best matching payer name for a given input.
 *
 * 1. Exact normalized match → returns canonical name
 * 2. Best Dice coefficient ≥ 0.6 → returns closest canonical name
 * 3. Otherwise → { matched: false }
 */
export function findPayerMatch(
    input: string,
    payerNames: string[]
): PayerMatchResult {
    if (!input.trim() || payerNames.length === 0) {
        return { matched: false }
    }

    const normalizedInput = normalize(input)

    // Fast path: exact normalized match
    for (const name of payerNames) {
        if (normalize(name) === normalizedInput) {
            return { matched: true, payerName: name }
        }
    }

    // Fuzzy match: find best Dice coefficient
    let bestScore = 0
    let bestName = ""

    for (const name of payerNames) {
        const score = diceCoefficient(input, name)
        if (score > bestScore) {
            bestScore = score
            bestName = name
        }
    }

    if (bestScore >= FUZZY_THRESHOLD) {
        return { matched: true, payerName: bestName }
    }

    return { matched: false }
}
