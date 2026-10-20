
document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    if (!toggle || !menu) {
        return;
    }

    function abrirMenu() {
        menu.classList.add("ativo");
        toggle.classList.add("aberto");

        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Fechar menu");
    }

    function fecharMenu() {
        menu.classList.remove("ativo");
        toggle.classList.remove("aberto");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menu");
    }

    toggle.addEventListener("click", function () {
        const menuAberto = menu.classList.contains("ativo");

        if (menuAberto) {
            fecharMenu();
        } else {
            abrirMenu();
        }
    });

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            fecharMenu();
        });
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            fecharMenu();
        }
    });

    document.addEventListener("click", function (evento) {
        if (
            menu.classList.contains("ativo") &&
            !menu.contains(evento.target) &&
            !toggle.contains(evento.target)
        ) {
            fecharMenu();
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 800) {
            fecharMenu();
        }
    });
});
