// Never log exception messages, request bodies, URLs, cookies or player IDs.
export function reportFailure(operation: string, error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  console.error('[jacklet]', {
    operation,
    category: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'failure',
    ...(/^[0-9A-Z]{5}$/.test(code) ? { databaseCode: code } : {})
  });
}
