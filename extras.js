/* ==========================================================
   EXTRAS FLUXO
   - Modo escuro (botão no cabeçalho)
   - Favoritos (coração nos cards)
   - Selo de estoque baixo nos cards
   Usa estoque.js (carregado antes deste arquivo).
========================================================== */

(function () {
    "use strict";


    const CHAVE_TEMA = "fluxoTema";
    const CHAVE_FAVORITOS = "fluxoFavoritos";

    const ICONE_LUA =
        '<svg class="icone-lua" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>';
    const ICONE_SOL =
        '<svg class="icone-sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    const ICONE_CORACAO =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S3.5 15.3 3.5 9.2A4.7 4.7 0 0112 6.6a4.7 4.7 0 018.5 2.6c0 6.1-8.5 11.3-8.5 11.3z"/></svg>';

    /* ---------- utilitários ---------- */

    function lerJSON(chave, padrao) {
        try {
            const bruto = localStorage.getItem(chave);
            return bruto ? JSON.parse(bruto) : padrao;
        } catch (e) {
            return padrao;
        }
    }

    function gravar(chave, valor) {
        try {
            localStorage.setItem(chave, valor);
        } catch (e) {
            // Sem armazenamento: o recurso funciona só nesta visita.
        }
    }

    function idDoCard(card) {
        const link = card.querySelector('a[href*="item="]');

        if (!link) {
            return null;
        }

        return new URL(link.getAttribute("href"), window.location.href)
            .searchParams.get("item");
    }

    /* ---------- favoritos ---------- */

    // Os favoritos ficam salvos por conta: só quem está logado pode favoritar.
    function emailLogado() {
        const sessao = window.FluxoAuth && window.FluxoAuth.sessaoAtual();
        return sessao && sessao.email ? String(sessao.email).toLowerCase() : null;
    }

    function lerFavoritos() {
        const email = emailLogado();

        if (!email) {
            return [];
        }

        const lista = lerJSON(CHAVE_FAVORITOS + ":" + email, []);
        return Array.isArray(lista)
            ? lista.filter(function (x) { return typeof x === "string"; })
            : [];
    }

    function notificarFavoritos() {
        document.dispatchEvent(new CustomEvent("fluxo:favoritos"));
    }

    /* ---------- aviso: "entre na sua conta" ---------- */

    let aviso = null;
    let focoAnterior = null;

    function paginaDeVolta() {
        const arquivo = window.location.pathname.split("/").pop() || "index.html";

        if (arquivo === "produto.html") {
            return "produtos.html";
        }

        return arquivo === "produtos.html" || arquivo === "index.html" ? arquivo : "";
    }

    function fecharAviso() {
        if (!aviso) {
            return;
        }

        aviso.hidden = true;
        document.removeEventListener("keydown", teclaNoAviso);

        if (focoAnterior && focoAnterior.focus) {
            focoAnterior.focus();
        }
    }

    function teclaNoAviso(evento) {
        if (evento.key === "Escape") {
            fecharAviso();
        }
    }

    // Aviso "entre na sua conta". Serve para favoritos e para alugar.
    // opcoes: { titulo, texto, volta (página para onde voltar depois de entrar), icone }
    const ICONE_CADEADO =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';

    function mostrarAvisoLogin(opcoes) {
        opcoes = opcoes || {};

        const volta = opcoes.volta !== undefined ? opcoes.volta : paginaDeVolta();
        const sufixo = volta ? "?redirect=" + encodeURIComponent(volta) : "";
        const titulo = opcoes.titulo || "Entre para salvar favoritos";
        const texto = opcoes.texto ||
            "Faça login ou crie sua conta para guardar os equipamentos que você mais gostou e encontrá-los depois.";
        const icone = opcoes.icone === "cadeado" ? ICONE_CADEADO : ICONE_CORACAO;

        if (!aviso) {
            aviso = document.createElement("div");
            aviso.className = "fav-aviso";
            aviso.hidden = true;
            aviso.innerHTML =
                '<div class="fav-aviso-caixa" role="dialog" aria-modal="true" aria-labelledby="fav-aviso-titulo">' +
                '<button type="button" class="fav-aviso-fechar" aria-label="Fechar">&times;</button>' +
                '<div class="fav-aviso-icone"></div>' +
                '<h2 id="fav-aviso-titulo"></h2>' +
                '<p class="fav-aviso-texto"></p>' +
                '<div class="fav-aviso-acoes">' +
                '<a class="fav-aviso-entrar" data-destino="login.html">Entrar</a>' +
                '<a class="fav-aviso-criar" data-destino="cadastro.html">Criar conta</a>' +
                '</div></div>';

            aviso.addEventListener("click", function (evento) {
                if (evento.target === aviso || evento.target.closest(".fav-aviso-fechar")) {
                    fecharAviso();
                }
            });

            document.body.appendChild(aviso);
        }

        aviso.querySelector(".fav-aviso-icone").innerHTML = icone;
        aviso.querySelector("#fav-aviso-titulo").textContent = titulo;
        aviso.querySelector(".fav-aviso-texto").textContent = texto;

        aviso.querySelectorAll("a[data-destino]").forEach(function (link) {
            link.href = link.dataset.destino + sufixo;
        });

        focoAnterior = document.activeElement;
        aviso.hidden = false;
        document.addEventListener("keydown", teclaNoAviso);
        aviso.querySelector(".fav-aviso-entrar").focus();
    }

    // Quem não está logado vê o aviso e não segue. Devolve true se pode seguir.
    function exigirLogin(opcoes) {
        if (emailLogado()) {
            return true;
        }

        mostrarAvisoLogin(Object.assign({
            titulo: "Entre para alugar",
            texto: "Para alugar equipamentos você precisa estar logado. Entre ou crie sua conta em poucos segundos e continue de onde parou.",
            icone: "cadeado"
        }, opcoes || {}));

        return false;
    }

    const api = {
        favoritos: {
            lista: lerFavoritos,
            tem: function (id) { return lerFavoritos().indexOf(id) !== -1; },
            total: function () { return lerFavoritos().length; },
            alternar: function (id) {
                const email = emailLogado();

                if (!email) {
                    mostrarAvisoLogin();
                    return false;
                }

                let lista = lerFavoritos();

                lista = lista.indexOf(id) !== -1
                    ? lista.filter(function (x) { return x !== id; })
                    : lista.concat(id);

                gravar(CHAVE_FAVORITOS + ":" + email, JSON.stringify(lista));
                notificarFavoritos();
                return lista.indexOf(id) !== -1;
            }
        },
        exigirLogin: exigirLogin,
        criarBotaoFavorito: criarBotaoFavorito,
        iconeCoracao: ICONE_CORACAO
    };

    window.FluxoExtras = api;

    function criarBotaoFavorito(id, nome, comTexto) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "fav-btn" + (comTexto ? " fav-grande" : "");
        botao.innerHTML = ICONE_CORACAO + (comTexto ? "<span></span>" : "");

        function desenhar() {
            const ativo = api.favoritos.tem(id);
            botao.setAttribute("aria-pressed", String(ativo));
            botao.setAttribute(
                "aria-label",
                (ativo ? "Remover dos favoritos: " : "Salvar nos favoritos: ") + nome
            );
            botao.title = ativo ? "Remover dos favoritos" : "Salvar nos favoritos";

            if (comTexto) {
                botao.querySelector("span").textContent = ativo
                    ? "Salvo nos favoritos"
                    : "Salvar nos favoritos";
            }
        }

        botao.addEventListener("click", function (evento) {
            evento.preventDefault();
            evento.stopPropagation();
            api.favoritos.alternar(id);
        });

        document.addEventListener("fluxo:favoritos", desenhar);
        desenhar();

        return botao;
    }

    /* ---------- tema ---------- */

    function temaEscuro() {
        return document.documentElement.getAttribute("data-tema") === "dark";
    }

    function iniciarTema() {
        const navbar = document.querySelector(".navbar");

        if (!navbar) {
            return;
        }

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "tema-botao";
        botao.innerHTML = ICONE_LUA + ICONE_SOL;

        function atualizar() {
            const escuro = temaEscuro();
            botao.setAttribute("aria-pressed", String(escuro));
            botao.setAttribute(
                "aria-label",
                escuro ? "Ativar modo claro" : "Ativar modo escuro"
            );
            botao.title = escuro ? "Modo claro" : "Modo escuro";
        }

        botao.addEventListener("click", function () {
            if (temaEscuro()) {
                document.documentElement.removeAttribute("data-tema");
                gravar(CHAVE_TEMA, "light");
            } else {
                document.documentElement.setAttribute("data-tema", "dark");
                gravar(CHAVE_TEMA, "dark");
            }

            atualizar();
        });

        atualizar();
        navbar.appendChild(botao);
        criarAtalhoFavoritos(navbar);
    }

    // Coração ao lado do botão de tema: leva à lista de favoritos.
    // Só aparece para quem está logado (favoritos são salvos por conta).
    function criarAtalhoFavoritos(navbar) {
        if (!emailLogado()) {
            return;
        }

        const link = document.createElement("a");
        link.href = "produtos.html?favoritos=1";
        link.className = "tema-botao nav-fav";
        link.setAttribute("aria-label", "Meus favoritos");
        link.title = "Meus favoritos";
        link.innerHTML = ICONE_CORACAO;

        if (new URLSearchParams(window.location.search).get("favoritos") === "1") {
            link.setAttribute("aria-current", "page");
        }

        navbar.appendChild(link);
    }

    /* ---------- cards: coração e estoque ---------- */

    function enfeitarCards() {
        document.querySelectorAll(".catalogo-card, .produto-card").forEach(function (card) {
            const id = idDoCard(card);

            if (!id || card.querySelector(".fav-btn")) {
                return;
            }

            const titulo = card.querySelector("h2, h3");
            const nome = titulo ? titulo.textContent.trim() : "produto";

            card.appendChild(criarBotaoFavorito(id, nome, false));

            const Estoque = window.FluxoEstoque;
            const aviso = Estoque && Estoque.avisoDeEstoque(id);

            if (aviso) {
                const selo = document.createElement("span");
                selo.className = "estoque-selo " + (aviso.nivel === "zero" ? "zero" : "");
                selo.textContent = aviso.curto;

                // O aviso fica no bloco de informações (abaixo do preço),
                // nunca por cima da foto do produto.
                const preco = card.querySelector(".catalogo-preco, .produto-preco");

                if (preco) {
                    preco.insertAdjacentElement("afterend", selo);
                } else {
                    card.appendChild(selo);
                }
            }
        });
    }

    // Página de reserva: o selo "Disponível" avisa quando o estoque está baixo.
    function ajustarSelosDaReserva() {
        const Estoque = window.FluxoEstoque;

        if (!Estoque) {
            return;
        }

        document.querySelectorAll(".reserva-item[data-id]").forEach(function (item) {
            const aviso = Estoque.avisoDeEstoque(item.dataset.id);
            const selo = item.querySelector(".reserva-selo");

            if (!aviso || !selo) {
                return;
            }

            selo.classList.add(aviso.nivel === "zero" ? "selo-zero" : "selo-baixo");
            selo.lastChild.textContent = aviso.curto;
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        iniciarTema();
        enfeitarCards();
        ajustarSelosDaReserva();
    });
})();
