// Turns an Axios error into a message that is safe and useful to show to the user.
export function getErrorMessage(err) {
  if (err?.response?.data?.errors?.length) {
    return err.response.data.errors.map((e) => e.message).join(' ');
  }
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}
