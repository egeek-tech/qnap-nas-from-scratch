export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Themed CSS re-declares selectors for light/dark overrides; source order is intentional.
    'no-descending-specificity': null,
  },
};
