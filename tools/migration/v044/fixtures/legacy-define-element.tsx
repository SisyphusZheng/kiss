import { defineElement } from '@openelement/element';

const styles = new StyleSheet();

export const MigrationCard = defineElement('oe-migration-card', {
  styles,
  render() {
    return <article>legacy definition</article>;
  },
});
