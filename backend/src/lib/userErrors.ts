/**
 * User-facing error messages only. Never expose env names, API keys, stack
 * traces, upstream provider text, or internal codes in these strings.
 */
export const UserErrors = {
  signInRequired: 'Please sign in to continue.',
  notFound: 'We could not find what you asked for.',
  invalidRequest: 'That request could not be processed. Please try again.',
  invalidImage: 'That image could not be sent for scanning. Please try another file.',
  imageTooLarge: 'That image is too large. Try a smaller file.',
  noImage: 'No image was provided.',
  invalidModel: 'That scanning option is not available.',
  profileNotFound: 'We could not find your account. Try signing out and back in.',
  creditsRequired: 'You need credits to use this feature. Add credits to continue.',
  scanUnavailable: 'Scanning is temporarily unavailable. Please try again in a few minutes.',
  scanFailed: 'The scan could not be completed. Please try again.',
  scanCostFailed: 'Something went wrong while processing your scan. Please try again.',
  historyFailed: 'Could not load your scan history. Please try again.',
  checkoutFailed: 'Could not start checkout. Please try again.',
  serverError: 'Something went wrong on our side. Please try again.',
} as const;
