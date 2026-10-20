document.addEventListener("DOMContentLoaded", function () {

    // Link direto para uma política (ex.: politica-de-locacao.html#cancelamento):
    // destaca o item por alguns segundos para a pessoa achar fácil.
    let temporizador = null;

    function destacarPeloLink() {
        const id = window.location.hash.slice(1);

        document.querySelectorAll(".pl-termo.destaque").forEach(function (el) {
            el.classList.remove("destaque");
        });

        if (!id) {
            return;
        }

        const alvo = document.getElementById(id);

        if (!alvo || !alvo.classList.contains("pl-termo")) {
            return;
        }

        alvo.classList.add("destaque");

        clearTimeout(temporizador);
        temporizador = setTimeout(function () {
            alvo.classList.remove("destaque");
        }, 2500);
    }

    destacarPeloLink();
    window.addEventListener("hashchange", destacarPeloLink);
});