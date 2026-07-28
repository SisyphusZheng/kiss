/**
 * Shared component carrying the ONLY data-open-enhance literal in its tree
 * (#577): routes that render this component contain no enhance attribute in
 * their own source — the scanner must follow the import to ship the layer.
 */
export function SharedEnhancedForm() {
  return (
    <form method='post' action='/form' data-open-enhance>
      <button id='shared-submit' type='submit'>Shared submit</button>
    </form>
  );
}
