/* Aplica o modo escuro ANTES da página aparecer (evita o "piscar" branco).
   A escolha fica salva no navegador. O botão de trocar o tema está em extras.js. */
(function () {
    try {
        if (localStorage.getItem("fluxoTema") === "dark") {
            document.documentElement.setAttribute("data-tema", "dark");
        }
    } catch (e) {
        // Sem armazenamento: segue no tema claro.
    }
})();
