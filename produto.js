document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       CONFIGURAÇÕES
    ========================================== */

    // Página para onde o botão "Alugar agora" leva.
    const PAGINA_RESERVA = "reserva.html";

    // Períodos oferecidos (em dias).
    const PERIODOS = [1, 3, 7, 15];

    const QUANTIDADE_MAXIMA = 5;

    // Enquadramentos das fotos (zoom e ponto de foco, em %).
    const VISTAS_PADRAO = [
        { rotulo: "Visão geral",      zoom: 1,   x: 50, y: 50 },
        { rotulo: "Detalhe superior", zoom: 1.7, x: 40, y: 28 },
        { rotulo: "Detalhe inferior", zoom: 1.8, x: 55, y: 74 },
        { rotulo: "Detalhe lateral",  zoom: 2,   x: 78, y: 70 }
    ];

    const DESTAQUES_ICONES = [
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.5 3v5.5c0 5-3.3 8.5-7.5 10-4.2-1.5-7.5-5-7.5-10V6z"/></svg>',
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3"/></svg>',
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-5M12 20V9M19 20V4"/></svg>'
    ];

    /* ==========================================
       CATÁLOGO
       (preço = diária base, igual ao da reserva)
    ========================================== */

    const CATALOGO = {
        raquete: {
            nome: "Raquete de Beach Tennis",
            imagem: "raquete.png",
            selo: "Mais alugado",
            nota: 5.0,
            avaliacoes: 134,
            diarias: [45, 40, 38, 35],
            descricao: "Raquete profissional em fibra de carbono, leve e resistente. Ideal para quem busca precisão, potência e controle nas jogadas.",
            destaques: ["Leve e resistente", "Alta performance", "Ideal para todos os níveis"],
            especificacoes: [
                ["Material", "Fibra de carbono"],
                ["Peso", "320g"],
                ["Espessura", "22mm"],
                ["Formato", "redondo"],
                ["Nível", "Iniciante ao avançado"],
                [null, "Acompanha capa protetora"]
            ],
            vistas: [
                { rotulo: "Raquete e bola",    zoom: 1,   x: 50, y: 50 },
                { rotulo: "Cabeça da raquete", zoom: 1.6, x: 46, y: 32 },
                { rotulo: "Cabo da raquete",   zoom: 1.9, x: 51, y: 78 },
                { rotulo: "Bola FLUXO",        zoom: 2.2, x: 73, y: 85 }
            ]
        },
        bicicleta: {
            nome: "Bicicleta MTB",
            imagem: "bicicleta.png",
            selo: "Mais alugado",
            nota: 4.6,
            avaliacoes: 243,
            diarias: [75, 70, 68, 65],
            vistas: [
                { rotulo: "Bicicleta completa", zoom: 1, x: 50, y: 50 },
                { rotulo: "Roda traseira e selim", zoom: 2.1, x: 22, y: 47 },
                { rotulo: "Quadro e pedais", zoom: 2, x: 50, y: 58 },
                { rotulo: "Roda dianteira e suspensão", zoom: 2, x: 80, y: 55 }
            ],
            descricao: "Bicicleta versátil e resistente, ideal para passeios, ciclovias e trilhas leves. Possui quadro de alumínio, suspensão dianteira e freios a disco, garantindo conforto e segurança durante o uso.",
            destaques: ["Seguro e confortável", "Alta performance", "Ideal para intermediários"],
            especificacoes: [
                ["Material", "Alumínio (quadro) + alumínio em componentes"],
                ["Peso", "15 kg"],
                ["Espessura", "2,5mm"],
                ["Formato", "Mountain Bike (MTB), quadro em formato triangular"],
                ["Nível", "Intermediário"],
                [null, "Acompanha capacete"]
            ]
        },
        sup: {
            nome: "Stand up paddle",
            imagem: "stand-up-paddle.png",
            selo: "Mais alugado",
            nota: 5.0,
            avaliacoes: 193,
            diarias: [90, 85, 83, 80],
            vistas: [
                { rotulo: "Prancha e mochila", zoom: 1, x: 50, y: 50 },
                { rotulo: "Prancha", zoom: 1.7, x: 50, y: 45 },
                { rotulo: "Mochila FLUXO", zoom: 2, x: 72, y: 53 },
                { rotulo: "Remo", zoom: 2.3, x: 30, y: 70 }
            ],
            descricao: "Prancha leve e estável, ideal para passeios e atividades recreativas na água. Oferece boa flutuação e equilíbrio, sendo uma ótima opção para iniciantes e praticantes de nível intermediário.",
            destaques: ["Leve e estável", "Alta performance", "Ideal para todos os níveis"],
            especificacoes: [
                ["Material", "PVC reforçado"],
                ["Peso", "10 kg"],
                ["Espessura", "15cm"],
                ["Formato", "Stand Up Paddle"],
                ["Nível", "Iniciante"],
                [null, "Acompanha capa protetora"]
            ]
        },
        patins: {
            nome: "Patins Inline",
            imagem: "patins.png",
            selo: "Mais alugado",
            nota: 4.6,
            avaliacoes: 145,
            diarias: [40, 35, 33, 30],
            vistas: [
                { rotulo: "Patins completo", zoom: 1, x: 50, y: 50 },
                { rotulo: "Cano e fivelas", zoom: 1.9, x: 55, y: 35 },
                { rotulo: "Rodas", zoom: 1.9, x: 50, y: 69 },
                { rotulo: "Roda dianteira", zoom: 2.3, x: 30, y: 71 }
            ],
            descricao: "Patins leve e confortável, ideal para lazer e prática recreativa. Oferece boa estabilidade e controle, sendo uma ótima opção para quem está começando a patinar.",
            destaques: ["Seguro e confortável", "Alta performance", "Ideal para iniciantes"],
            especificacoes: [
                ["Material", "Polipropileno + alumínio"],
                ["Peso", "2,5 kg (par)"],
                ["Espessura", "3mm"],
                ["Formato", "Inline, com rodas alinhadas"],
                ["Nível", "Iniciante"],
                [null, "Acompanha joelheira"]
            ]
        },
        caiaque: {
            nome: "Caiaque Sit-on-Top",
            imagem: "caiaque.png",
            selo: "Mais alugado",
            nota: 4.9,
            avaliacoes: 178,
            diarias: [80, 75, 73, 70],
            vistas: [
                { rotulo: "Caiaque completo", zoom: 1, x: 50, y: 50 },
                { rotulo: "Proa", zoom: 1.9, x: 22, y: 65 },
                { rotulo: "Assento", zoom: 2.1, x: 62, y: 40 },
                { rotulo: "Popa", zoom: 1.9, x: 86, y: 43 }
            ],
            descricao: "Caiaque resistente e confortável, ideal para passeios, lazer e aventuras na água. Seu formato proporciona boa estabilidade e controle, enquanto o assento ajustável e o remo garantem mais conforto durante a prática.",
            destaques: ["Resistente e estável", "Alta performance", "Ideal para passeios"],
            especificacoes: [
                ["Material", "Polietileno de alta densidade (PEAD)"],
                ["Peso", "29kg"],
                ["Espessura", "8mm"],
                ["Formato", "Caiaque sit-on-top"],
                ["Nível", "Iniciante/intermediário"],
                [null, "Acompanha remo"]
            ]
        },
        bola: {
            nome: "Bola de futebol",
            imagem: "bola.png",
            selo: "Recomendado",
            nota: 5.0,
            avaliacoes: 113,
            diarias: [15, 10, 8, 5],
            vistas: [
                { rotulo: "Bola completa", zoom: 1, x: 50, y: 50 },
                { rotulo: "Logo FLUXO", zoom: 1.8, x: 50, y: 45 },
                { rotulo: "Gomos", zoom: 2, x: 72, y: 38 },
                { rotulo: "Detalhe da costura", zoom: 2, x: 27, y: 74 }
            ],
            descricao: "Bola de futebol resistente e versátil, ideal para treinos, partidas recreativas e momentos de lazer. Possui boa durabilidade e controle, sendo adequada para diferentes níveis de jogadores.",
            destaques: ["Resistente e versátil", "Alta performance", "Ideal para todos os níveis"],
            especificacoes: [
                ["Material", "PVC sintético"],
                ["Peso", "430g"],
                ["Circunferência", "69cm"],
                ["Formato", "Esférico"],
                ["Nível", "Iniciante/intermediário"]
            ]
        },
        barraca: {
            nome: "Barraca de camping",
            imagem: "barraca.png",
            selo: "Mais alugado",
            nota: 4.0,
            avaliacoes: 128,
            diarias: [40, 35, 33, 30],
            vistas: [
                { rotulo: "Barraca completa", zoom: 1, x: 50, y: 50 },
                { rotulo: "Entrada", zoom: 1.9, x: 50, y: 58 },
                { rotulo: "Topo", zoom: 1.8, x: 50, y: 33 },
                { rotulo: "Lateral", zoom: 2, x: 78, y: 53 }
            ],
            descricao: "Barraca prática e resistente, ideal para acampamentos, trilhas e atividades ao ar livre. Fácil de montar e transportar, oferece proteção e conforto durante a estadia.",
            destaques: ["Resistente e prático", "Alta performance", "Ideal para todos os níveis"],
            especificacoes: [
                ["Material", "Poliéster + fibra de vidro"],
                ["Peso", "2,5 kg"],
                ["Capacidade", "2 a 3 pessoas"],
                ["Formato", "Iglu"],
                ["Nível", "Iniciante"],
                [null, "Acompanha estacas e bolsa"]
            ]
        },
        badminton: {
            nome: "Kit de Badminton",
            imagem: "kit-badminton.png",
            selo: "Recomendado",
            nota: 5.0,
            avaliacoes: 297,
            diarias: [45, 40, 38, 35],
            vistas: [
                { rotulo: "Kit completo", zoom: 1, x: 50, y: 50 },
                { rotulo: "Bolsa", zoom: 1.9, x: 25, y: 42 },
                { rotulo: "Raquetes", zoom: 1.9, x: 75, y: 37 },
                { rotulo: "Petecas e tubo", zoom: 2, x: 72, y: 66 }
            ],
            descricao: "Kit completo de badminton, ideal para partidas recreativas, treinos e diversão ao ar livre. Conjunto prático com raquetes, petecas e rede, oferecendo fácil montagem, transporte e boa durabilidade para partidas casuais.",
            destaques: ["Resistente e prático", "Alta performance", "Boa durabilidade"],
            especificacoes: [
                ["Material", "Alumínio + nylon"],
                ["Peso", "2,5 kg"],
                ["Espessura", "2mm"],
                ["Formato", "Kit portátil"],
                ["Nível", "Iniciante"],
                [null, "Incluso: 2 raquetes, 4 petecas e 1 mochila"]
            ]
        }
    };

    /* ==========================================
       FUNÇÕES AUXILIARES
    ========================================== */

    const $ = function (id) {
        return document.getElementById(id);
    };

    function criar(tag, classe, texto) {
        const el = document.createElement(tag);

        if (classe) {
            el.className = classe;
        }

        if (texto !== undefined) {
            el.textContent = texto;
        }

        return el;
    }

    const ESTRELA = '<path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.4 1.1 6.3L12 17.2l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9z"/>';

    function renderizarEstrelas(nota) {
        const caixa = document.querySelector(".pd-estrelas");
        const cheias = Math.floor(nota);
        let html = "";

        for (let i = 0; i < 5; i++) {
            html += '<svg viewBox="0 0 24 24" aria-hidden="true"' +
                (i < cheias ? "" : ' class="vazia"') + ">" + ESTRELA + "</svg>";
        }

        caixa.innerHTML = html;
        caixa.setAttribute("aria-label", "Nota " + nota.toFixed(1) + " de 5");
    }

    function moeda(valor) {
        return "R$" + valor.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function textoDias(n) {
        return n + (n === 1 ? " dia" : " dias");
    }

    function textoUnidades(n) {
        return n + (n === 1 ? " unidade" : " unidades");
    }

    /* ==========================================
       PRODUTO DA URL (?item=raquete)
    ========================================== */

    const id = new URLSearchParams(window.location.search).get("item");
    const produto = Object.prototype.hasOwnProperty.call(CATALOGO, id)
        ? CATALOGO[id]
        : null;

    if (!produto) {
        $("pd-conteudo").hidden = true;
        $("pd-vazio").hidden = false;
        document.title = "Produto não encontrado | FLUXO Equipamentos Esportivos";
        return;
    }

    // Preço da diária em cada período (1, 3, 7 e 15 dias), conforme o layout.
    const diarias = produto.diarias;
    const estado = {
        periodo: 0,
        quantidade: 1,
        vista: 0
    };

    /* ==========================================
       TEXTOS FIXOS DO PRODUTO
    ========================================== */

    document.title = produto.nome + " | FLUXO Equipamentos Esportivos";

    $("pd-titulo").textContent = produto.nome;
    $("pd-selo-texto").textContent = produto.selo;
    $("pd-nota-valor").textContent = produto.nota.toFixed(1);
    renderizarEstrelas(produto.nota);
    $("pd-nota-total").textContent = "(" + produto.avaliacoes + " avaliações)";
    $("pd-descricao").textContent = produto.descricao;

    produto.destaques.forEach(function (texto, i) {
        const li = criar("li");
        li.innerHTML = DESTAQUES_ICONES[i % DESTAQUES_ICONES.length];
        li.append(document.createTextNode(texto));
        $("pd-destaques").appendChild(li);
    });

    produto.especificacoes.forEach(function (linha) {
        const li = criar("li");

        if (linha[0]) {
            li.append(criar("strong", "", linha[0] + ":"), " " + linha[1]);
        } else {
            li.textContent = linha[1];
        }

        $("pd-especificacoes").appendChild(li);
    });

    /* ==========================================
       GALERIA
    ========================================== */

    const vistas = produto.vistas || VISTAS_PADRAO;
    const miniaturas = [];

    function enquadrar(img, vista) {
        img.style.transformOrigin = vista.x + "% " + vista.y + "%";
        img.style.transform = vista.zoom === 1
            ? "none"
            : "translate(" + (50 - vista.x) + "%, " + (50 - vista.y) + "%) scale(" + vista.zoom + ")";
    }

    function escolherVista(indice) {
        estado.vista = (indice + vistas.length) % vistas.length;

        const vista = vistas[estado.vista];
        const principal = $("pd-foto-img");

        enquadrar(principal, vista);
        $("pd-foto").setAttribute("aria-label", produto.nome + " - " + vista.rotulo);

        miniaturas.forEach(function (botao, i) {
            botao.setAttribute("aria-current", String(i === estado.vista));
        });
    }

    $("pd-foto-img").src = produto.imagem;
    $("pd-foto-img").alt = "";

    vistas.forEach(function (vista, i) {
        const botao = criar("button", "pd-miniatura");
        const img = document.createElement("img");

        botao.type = "button";
        botao.setAttribute("aria-label", "Ver foto: " + vista.rotulo);

        img.src = produto.imagem;
        img.alt = "";
        img.loading = "lazy";
        enquadrar(img, vista);

        botao.appendChild(img);
        botao.addEventListener("click", function () {
            escolherVista(i);
        });

        miniaturas.push(botao);
        $("pd-miniaturas").appendChild(botao);
    });

    $("pd-anterior").addEventListener("click", function () {
        escolherVista(estado.vista - 1);
    });

    $("pd-proxima").addEventListener("click", function () {
        escolherVista(estado.vista + 1);
    });

    escolherVista(0);

    /* ==========================================
       PERÍODOS DE ALUGUEL
    ========================================== */

    const botoesPeriodo = [];

    PERIODOS.forEach(function (dias, i) {
        const botao = criar("button", "pd-periodo");
        const preco = criar("span", "pd-periodo-preco");
        const small = criar("small", "", " /dia");

        botao.type = "button";
        botao.setAttribute("role", "radio");

        preco.append(moeda(diarias[i]), small);

        botao.append(criar("span", "pd-periodo-dias", textoDias(dias)), preco);

        if (i === 0) {
            botao.append(criar("span", "pd-periodo-nota verde", "Ideal para testes"));
        } else {
            botao.append(criar("span", "pd-periodo-nota", moeda(diarias[i] * dias) + " total"));
        }

        botao.addEventListener("click", function () {
            estado.periodo = i;
            atualizar();
        });

        // Setas do teclado trocam de período (padrão de grupo de opções).
        botao.addEventListener("keydown", function (evento) {
            let destino = null;

            if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
                destino = (i + 1) % PERIODOS.length;
            } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
                destino = (i - 1 + PERIODOS.length) % PERIODOS.length;
            }

            if (destino !== null) {
                evento.preventDefault();
                estado.periodo = destino;
                atualizar();
                botoesPeriodo[destino].focus();
            }
        });

        botoesPeriodo.push(botao);
        $("pd-periodos").appendChild(botao);
    });

    /* ==========================================
       QUANTIDADE
    ========================================== */

    $("pd-menos").addEventListener("click", function () {
        if (estado.quantidade > 1) {
            estado.quantidade -= 1;
            atualizar();
        }
    });

    $("pd-mais").addEventListener("click", function () {
        if (estado.quantidade < QUANTIDADE_MAXIMA) {
            estado.quantidade += 1;
            atualizar();
        }
    });

    /* ==========================================
       ATUALIZA TELA (período, quantidade e subtotal)
    ========================================== */

    function calcular() {
        const dias = PERIODOS[estado.periodo];
        const diaria = diarias[estado.periodo];

        return {
            dias: dias,
            diaria: diaria,
            quantidade: estado.quantidade,
            subtotal: diaria * dias * estado.quantidade
        };
    }

    function atualizar() {
        const dados = calcular();

        botoesPeriodo.forEach(function (botao, i) {
            const marcado = i === estado.periodo;
            botao.setAttribute("aria-checked", String(marcado));
            botao.tabIndex = marcado ? 0 : -1;
        });

        $("pd-qtd").textContent = String(dados.quantidade);
        $("pd-menos").disabled = dados.quantidade <= 1;
        $("pd-mais").disabled = dados.quantidade >= QUANTIDADE_MAXIMA;
        $("pd-qtd-aviso").textContent = dados.quantidade >= QUANTIDADE_MAXIMA
            ? "Máximo de " + QUANTIDADE_MAXIMA + " unidades"
            : "";

        $("pd-subtotal").textContent = moeda(dados.subtotal);

        const base = dados.dias === 1 ? "por dia" : "por " + textoDias(dados.dias);
        $("pd-subtotal-legenda").textContent = dados.quantidade > 1
            ? textoUnidades(dados.quantidade) + " · " + base
            : base;
    }

    /* ==========================================
       ALUGAR AGORA → RESERVA
    ========================================== */

    $("pd-alugar").addEventListener("click", function () {
        const dados = calcular();

        // A página de reserva lê esta chave e já deixa tudo selecionado.
        try {
            sessionStorage.setItem("fluxoProduto", JSON.stringify({
                id: id,
                quantidade: dados.quantidade,
                dias: dados.dias,
                precoDia: dados.diaria,
                criadoEm: Date.now()
            }));
        } catch (e) {
            // Se o navegador bloquear o armazenamento, segue mesmo assim.
        }

        window.location.href = PAGINA_RESERVA + "?item=" + encodeURIComponent(id);
    });

    // "Como funciona?" rola suavemente até a explicação.
    $("pd-como").addEventListener("click", function (evento) {
        const alvo = $("como-funciona");

        if (alvo && alvo.scrollIntoView) {
            evento.preventDefault();
            alvo.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    atualizar();
});