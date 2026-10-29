document.addEventListener("DOMContentLoaded", function () {
    const imagens = document.querySelectorAll(".catalogo-imagem img");

    imagens.forEach(function (imagem) {
        imagem.addEventListener("error", function () {
            if (imagem.dataset.fallbackAplicado === "true") {
                return;
            }

            imagem.dataset.fallbackAplicado = "true";
            imagem.alt = "Imagem do equipamento indisponível";
            imagem.style.display = "none";

            const areaImagem = imagem.closest(".catalogo-imagem");

            if (areaImagem) {
                areaImagem.classList.add("imagem-indisponivel");

                const aviso = document.createElement("span");
                aviso.textContent = "Imagem indisponível";
                aviso.style.cssText =
                    "font-size:10px;color:#777;text-align:center;padding:8px;";

                areaImagem.appendChild(aviso);
            }
        });
    });
});


/* ==========================================
   BUSCA E FILTROS DO CATÁLOGO
========================================== */

document.addEventListener("DOMContentLoaded", function () {
    const lista = document.querySelector(".catalogo-lista");

    if (!lista) {
        return;
    }

    const cards = Array.from(lista.querySelectorAll(".catalogo-card"));
    const campoBusca = document.getElementById("filtro-busca");
    const botaoLimparBusca = document.getElementById("filtro-busca-limpar");
    const selectPreco = document.getElementById("filtro-preco");
    const selectOrdem = document.getElementById("filtro-ordem");
    const chips = Array.from(document.querySelectorAll(".filtro-chip"));
    const contagem = document.getElementById("filtro-contagem");
    const botaoLimpar = document.getElementById("filtro-limpar");
    const vazio = document.getElementById("catalogo-vazio");

    // Página "Meus favoritos" (link do cabeçalho): produtos.html?favoritos=1
    const modoFavoritos = new URLSearchParams(window.location.search).get("favoritos") === "1";

    let categoria = modoFavoritos ? "favoritos" : "todas";

    if (modoFavoritos) {
        const titulo = document.querySelector(".produtos-banner-conteudo h1");
        const sub = document.querySelector(".produtos-banner-conteudo p");
        const grupoChips = document.getElementById("filtro-categorias");

        document.title = "Meus favoritos | FLUXO";

        if (titulo) { titulo.textContent = "Meus favoritos"; }
        if (sub) { sub.textContent = "Os equipamentos que você salvou para alugar depois."; }
        if (grupoChips) { grupoChips.style.display = "none"; }
    }

    // Guarda a ordem original ("Destaques") e prepara o texto de busca.
    cards.forEach(function (card, indice) {
        card.dataset.ordem = indice;
        card.dataset.texto = normalizar(
            card.dataset.nome + " " + (card.dataset.palavras || "")
        );
    });

    // Favoritos (coração dos cards), guardados em extras.js.
    const Extras = window.FluxoExtras;
    const contagemFav = document.getElementById("fav-chip-contagem");
    const tituloVazio = document.getElementById("catalogo-vazio-titulo");
    const textoVazio = document.getElementById("catalogo-vazio-texto");
    const textosOriginais = {
        titulo: tituloVazio ? tituloVazio.textContent : "",
        texto: textoVazio ? textoVazio.textContent : ""
    };

    function idDoCard(card) {
        const link = card.querySelector('a[href*="item="]');

        return link
            ? new URL(link.getAttribute("href"), window.location.href).searchParams.get("item")
            : null;
    }

    function ehFavorito(card) {
        return Boolean(Extras && Extras.favoritos.tem(idDoCard(card)));
    }

    function atualizarContagemFavoritos() {
        if (contagemFav && Extras) {
            const total = Extras.favoritos.total();
            contagemFav.textContent = total > 0 ? "(" + total + ")" : "";
        }
    }

    if (Extras) {
        document.addEventListener("fluxo:favoritos", function () {
            atualizarContagemFavoritos();

            if (categoria === "favoritos") {
                aplicar();
            }
        });
    }

    atualizarContagemFavoritos();

    // Minúsculas e sem acentos: "pá" encontra "pa".
    function normalizar(texto) {
        return String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function dentroDoPreco(preco, faixa) {
        if (faixa === "ate30") {
            return preco <= 30;
        }

        if (faixa === "30a60") {
            return preco > 30 && preco <= 60;
        }

        if (faixa === "acima60") {
            return preco > 60;
        }

        return true;
    }

    function filtrosAtivos() {
        return (
            campoBusca.value.trim() !== "" ||
            categoria !== "todas" ||
            selectPreco.value !== "todos" ||
            selectOrdem.value !== "padrao"
        );
    }

    function aplicar() {
        const termos = normalizar(campoBusca.value).split(/\s+/).filter(Boolean);
        let visiveis = 0;

        cards.forEach(function (card) {
            const preco = Number(card.dataset.preco);

            const combina =
                termos.every(function (t) {
                    return card.dataset.texto.indexOf(t) !== -1;
                }) &&
                (categoria === "todas" ||
                    (categoria === "favoritos"
                        ? ehFavorito(card)
                        : card.dataset.categoria === categoria)) &&
                dentroDoPreco(preco, selectPreco.value);

            card.hidden = !combina;

            if (combina) {
                visiveis += 1;
            }
        });

        // Reordena os cards no próprio grid.
        const ordem = selectOrdem.value;

        cards.slice().sort(function (a, b) {
            if (ordem === "menor") {
                return a.dataset.preco - b.dataset.preco || a.dataset.ordem - b.dataset.ordem;
            }

            if (ordem === "maior") {
                return b.dataset.preco - a.dataset.preco || a.dataset.ordem - b.dataset.ordem;
            }

            if (ordem === "nome") {
                return a.dataset.nome.localeCompare(b.dataset.nome, "pt-BR");
            }

            return a.dataset.ordem - b.dataset.ordem;
        }).forEach(function (card) {
            lista.appendChild(card);
        });

        // Textos e estados
        contagem.textContent = "";

        const forte = document.createElement("strong");
        forte.textContent = visiveis;
        contagem.append(
            forte,
            visiveis === 1 ? " produto encontrado" : " produtos encontrados"
        );

        botaoLimparBusca.hidden = campoBusca.value === "";
        botaoLimpar.hidden = !filtrosAtivos();
        // Texto do aviso quando não há nada para mostrar.
        if (tituloVazio && textoVazio) {
            const logado = Boolean(window.FluxoAuth && window.FluxoAuth.sessaoAtual());
            const semFavoritos = categoria === "favoritos" && Extras && Extras.favoritos.total() === 0;

            if (semFavoritos && !logado) {
                tituloVazio.textContent = "Entre na sua conta para ver seus favoritos";
                textoVazio.textContent = "Os favoritos ficam salvos na sua conta.";
            } else if (semFavoritos) {
                tituloVazio.textContent = "Você ainda não tem favoritos";
                textoVazio.textContent = "Toque no coração de um equipamento para salvá-lo aqui.";
            } else {
                tituloVazio.textContent = textosOriginais.titulo;
                textoVazio.textContent = textosOriginais.texto;
            }
        }

        vazio.hidden = visiveis !== 0;
        lista.hidden = visiveis === 0;
    }

    function limparTudo() {
        campoBusca.value = "";
        selectPreco.value = "todos";
        selectOrdem.value = "padrao";
        definirCategoria("todas");
        aplicar();
        campoBusca.focus();
    }

    function definirCategoria(nova) {
        categoria = modoFavoritos ? "favoritos" : nova;

        chips.forEach(function (chip) {
            const ativo = chip.dataset.categoria === nova;
            chip.classList.toggle("ativo", ativo);
            chip.setAttribute("aria-pressed", String(ativo));
        });
    }

    /* ---------- eventos ---------- */

    campoBusca.addEventListener("input", aplicar);

    campoBusca.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && campoBusca.value) {
            campoBusca.value = "";
            aplicar();
        }
    });

    document.getElementById("filtro-barra").addEventListener("submit", function (evento) {
        evento.preventDefault();
    });

    botaoLimparBusca.addEventListener("click", function () {
        campoBusca.value = "";
        aplicar();
        campoBusca.focus();
    });

    selectPreco.addEventListener("change", aplicar);
    selectOrdem.addEventListener("change", aplicar);

    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            definirCategoria(chip.dataset.categoria);
            aplicar();
        });
    });

    botaoLimpar.addEventListener("click", limparTudo);
    document.getElementById("catalogo-vazio-limpar").addEventListener("click", limparTudo);

    // Permite chegar de outra página já com busca: produtos.html?busca=bike
    const buscaInicial = new URLSearchParams(window.location.search).get("busca");

    if (buscaInicial) {
        campoBusca.value = buscaInicial.slice(0, 60);
    }

    aplicar();
});
