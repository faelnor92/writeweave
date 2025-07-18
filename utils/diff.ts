// utils/diff.ts

export type DiffResult = {
  value: string;
  type: 'common' | 'added' | 'removed';
}[];

// A simple line-based diff algorithm (Longest Common Subsequence)
export const lineDiff = (oldText: string, newText: string): DiffResult => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const dp = Array(oldLines.length + 1).fill(null).map(() => Array(newLines.length + 1).fill(0));

  for (let i = oldLines.length - 1; i >= 0; i--) {
    for (let j = newLines.length - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffResult = [];
  let i = 0, j = 0;
  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      result.push({ value: oldLines[i], type: 'common' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ value: oldLines[i], type: 'removed' });
      i++;
    } else {
      result.push({ value: newLines[j], type: 'added' });
      j++;
    }
  }

  while (i < oldLines.length) {
    result.push({ value: oldLines[i], type: 'removed' });
    i++;
  }
  while (j < newLines.length) {
    result.push({ value: newLines[j], type: 'added' });
    j++;
  }
  
  return result;
};
