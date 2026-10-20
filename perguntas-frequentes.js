document.addEventListener("DOMContentLoaded", function () {

    const perguntas = Array.from(document.querySelectorAll(".faq-pergunta"));

    function respostaDe(botao) {
        return document.getElementById(botao.getAttribute("aria-controls"));
    }

    function alternar(botao, abrir) {
        botao.setAttribute("aria-expanded", String(abrir));
        respostaDe(botao).hidden = !abrir;
    }

    // Clique (ou Enter/Espaço) abre e fecha cada resposta.
    perguntas.forEach(function (botao) {
        botao.addEventListener("click", function () {
            const aberta = botao.getAttribute("aria-expanded") === "true";
            alternar(botao, !aberta);
        });
    });

    // Link direto para uma pergunta (ex.: perguntas-frequentes.html#higienizacao):
    // garante que ela esteja aberta e a destaca rapidamente.
    function abrirPeloLink() {
        const id = window.location.hash.slice(1);

        if (!id) {
            return;
        }

        const item = document.getElementById(id);

        if (!item || !item.classList.contains("faq-item")) {
            return;
        }

        alternar(item.querySelector(".faq-pergunta"), true);
    }

    abrirPeloLink();
    window.addEventListener("hashchange", abrirPeloLink);
});