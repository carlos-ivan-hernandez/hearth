const config = {
  '*.{ts,tsx,js}': ['oxlint --fix', 'oxfmt'],
  '*.{css,json}': ['oxfmt'],
};
export default config;
