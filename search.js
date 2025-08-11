const trigrams = (text) => {
  // use Set to remove duplicate trigrams and speed lookups
  const trigrams = new Set();
  // pad to simplify
  const padded = ` ${text.toLowerCase()}`;
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
};

const trigramScore = (search, text) => {
  const searchTrigrams = trigrams(search);
  const textTrigrams = trigrams(text);
  const intersection = [...searchTrigrams].filter((t) => textTrigrams.has(t));
  return intersection.length / searchTrigrams.size;
};

// search
export const fuzzy = (search, candidates, threshold, read, write) => {
  const results = [];
  candidates.forEach((candidate) => {
    const text = read ? read(candidate) : candidate;
    const score = trigramScore(search, text);
    if (threshold && score < threshold) return;
    results.push({
      result: write ? write(candidate) : candidate,
      score: score,
    });
  });
  return results;
};
