import { renderHeader } from './Header.js';

export const renderMainLayout = (content: string): string => `
<div class="cv-shell">
  ${renderHeader()}
  <main class="cv-main">${content}</main>
</div>`;
