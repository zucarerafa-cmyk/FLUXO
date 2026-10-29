document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       CONFIGURAÇÕES
    ========================================== */

    // Descrição e imagem de cada equipamento.
    const PRODUTOS = {
        bicicleta: { imagem: "bicicleta.png",       descricao: "Acompanha capacete" },
        patins:    { imagem: "patins.png",          descricao: "Acompanha joelheira" },
        sup:       { imagem: "stand-up-paddle.png", descricao: "Acompanha capa protetora" },
        bola:      { imagem: "bola.png",            descricao: "Bola de futebol FLUXO" },
        raquete:   { imagem: "raquete.png",         descricao: "Acompanha capa protetora" },
        caiaque:   { imagem: "caiaque.png",         descricao: "Acompanha remo" },
        barraca:   { imagem: "barraca.png",         descricao: "Acompanha estacas e bolsa" },
        badminton: { imagem: "kit-badminton.png",   descricao: "Incluso: 2 raquetes, 4 petecas e 1 mochila" },
        prancha: { imagem: "prancha-de-surf.png", descricao: "Acompanha leash" },
        "roupa-surf": { imagem: "roupa-de-surf.png", descricao: "Tamanhos P ao GG sob consulta" },
        natacao: { imagem: "kit-natacao.png", descricao: "Incluso: máscara, snorkel, nadadeiras e touca" },
        seguranca: { imagem: "kit-seguranca.png", descricao: "Incluso: colete, capacete, bolsa estanque, cordão e 2 pulseiras" },
        "rede-volei": { imagem: "rede-volei.png", descricao: "Acompanha cordas de fixação e bolsa" },
        pingpong: { imagem: "mesa-de-pingpong.png", descricao: "Incluso: rede, 2 raquetes e 1 bola" },
        pickleball: { imagem: "kit-pickleball.png", descricao: "Incluso: 2 raquetes, 4 bolinhas, mochila, sacola e 2 fitas" },
        slackline: { imagem: "kit-slackline.png", descricao: "Incluso: fita, catraca, 2 protetores de árvore e bolsa" }
    };

    const HORARIO = "09h-19h";

    const $ = function (id) {
        return document.getElementById(id);
    };

    /* ==========================================
       FUNÇÕES AUXILIARES
    ========================================== */

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

    function formatarMoeda(valor) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // "2026-09-01" -> "01/09/26"
    function dataCurta(iso) {
        const p = iso.split("-");
        return p[2] + "/" + p[1] + "/" + p[0].slice(2);
    }

    function textoDias(n) {
        return n + (n === 1 ? " dia" : " dias");
    }

    /* ==========================================
       LEITURA DA RESERVA CONCLUÍDA
       (gravada pela página de pagamento)
    ========================================== */

    function lerConfirmacao() {
        let bruto = null;

        try {
            bruto = sessionStorage.getItem("fluxoConfirmacao");
        } catch (e) {
            return null;
        }

        if (!bruto) {
            return null;
        }

        try {
            const c = JSON.parse(bruto);

            if (
                !c ||
                !c.codigo ||
                !Array.isArray(c.itens) || c.itens.length === 0 ||
                !c.retirada || !c.devolucao
            ) {
                return null;
            }

            return c;
        } catch (e) {
            return null;
        }
    }

    const confirmacao = lerConfirmacao();

    if (!confirmacao) {
        $("rc-conteudo").hidden = true;
        $("rc-vazio").hidden = false;
        return;
    }

    /* ==========================================
       GUARDA NO HISTÓRICO DA CONTA (página de perfil)
       Só salva se houver alguém logado e se esta
       reserva ainda não estiver no histórico.
    ========================================== */

    (function guardarNoHistorico() {
        const Auth = window.FluxoAuth;
        const sessao = Auth && Auth.sessaoAtual();

        if (!sessao) {
            return;
        }

        const jaSalva = Auth.reservasDe(sessao.email).some(function (r) {
            return r.codigo === confirmacao.codigo;
        });

        if (!jaSalva) {
            Auth.salvarReserva(sessao.email, Object.assign({}, confirmacao, {
                criadoEm: new Date().toISOString()
            }));
        }
    })();

    /* ==========================================
       PREENCHE A PÁGINA
    ========================================== */

    $("rc-codigo").textContent = confirmacao.codigo;
    $("rc-total").textContent = formatarMoeda(Number(confirmacao.total));

    function celulaData(rotulo, iso) {
        const bloco = criar("div", "rc-data");
        bloco.append(
            criar("span", "", rotulo),
            criar("span", "", dataCurta(iso))
        );
        return bloco;
    }

    const lista = $("rc-itens");

    confirmacao.itens.forEach(function (item) {
        const info = PRODUTOS[item.id] || { imagem: "", descricao: "" };
        const li = criar("li", "rc-item");

        // Produto
        const produto = criar("div", "rc-produto");
        const img = document.createElement("img");
        img.src = info.imagem;
        img.alt = item.nome;

        const textos = document.createElement("div");
        textos.append(criar("strong", "", item.nome));

        if (info.descricao) {
            textos.append(criar("span", "", info.descricao));
        }

        produto.append(img, textos);

        li.append(
            produto,
            celulaData("Retirada", confirmacao.retirada),
            celulaData("Devolução", confirmacao.devolucao),
            criar("span", "rc-dias", textoDias(confirmacao.dias)),
            criar("span", "rc-preco", formatarMoeda(Number(item.total)))
        );

        lista.appendChild(li);
    });

    /* ==========================================
       CONFETES (verdes e azuis, caindo suavemente)
    ========================================== */

    function lancarConfetes() {
        const area = $("rc-confetes");
        const cores = ["#00bd70", "#00bd70", "#2fd68f", "#004aad", "#1f6fd6"];
        const quantidade = window.innerWidth < 600 ? 34 : 70;
        const altura = area.offsetHeight || 380;
        const reduzido = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        for (let i = 0; i < quantidade; i++) {
            const peca = criar("span", "rc-confete");
            const largura = 5 + Math.random() * 8;
            const formato = Math.random();

            peca.style.left = Math.random() * 100 + "%";
            peca.style.width = largura + "px";
            peca.style.height = (formato < 0.5 ? largura * 0.45 : largura) + "px";
            peca.style.background = cores[Math.floor(Math.random() * cores.length)];
            peca.style.borderRadius = formato > 0.85 ? "50%" : "1px";

            const queda = altura * (0.35 + Math.random() * 0.75);

            peca.style.setProperty("--queda", queda + "px");
            peca.style.setProperty("--deriva", (Math.random() * 60 - 30) + "px");
            peca.style.setProperty("--giro", (Math.random() * 720 - 360) + "deg");
            peca.style.setProperty("--topo-fixo", (Math.random() * 90) + "%");
            peca.style.animationDuration = (3.2 + Math.random() * 3) + "s";
            peca.style.animationDelay = (reduzido ? 0 : Math.random() * 1.6) + "s";

            area.appendChild(peca);
        }
    }

    lancarConfetes();
});