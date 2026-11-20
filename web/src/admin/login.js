const messages = new Map([
  ['busy', 'Too many sign-ins are in progress. Try again in a few minutes.'],
  [
    'incomplete',
    'The sign-in request expired or was cancelled. Start a new sign-in.',
  ],
  [
    'provider-unavailable',
    'The CMS could not verify your GitHub account. Try again.',
  ],
  [
    'access-denied',
    'Switch to the portfolio owner’s GitHub account and try again.',
  ],
])

const message = messages.get(new URLSearchParams(location.search).get('error'))
if (message) {
  const error = document.getElementById('sign-in-error')
  error.textContent = message
  error.hidden = false
}
