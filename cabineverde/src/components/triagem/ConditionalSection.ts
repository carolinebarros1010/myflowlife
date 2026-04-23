export const renderConditionalSection = (id: string, titulo: string, descricao: string): string => `
<section class="cv-card cv-conditional" id="${id}" hidden>
  <h4>${titulo}</h4>
  <p>${descricao}</p>
</section>`;
