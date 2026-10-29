document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       CONFIGURAÇÕES (altere aqui se precisar)
    ========================================== */

    // Valores usados caso a reserva não traga o dado.
    const TAXA_PADRAO = 10;
    const DESCONTO = 0;

    // Horário de funcionamento exibido na revisão.
    const HORARIO = "09h-19h";

    // Pix: troque pela chave real da loja quando houver.
    const PIX_CHAVE = "8f3a8b6a-7d8e-4f1b-b123-a5e879bdacef";
    const PIX_NOME = "FLUXO LOCACOES ESPORTIVAS"; // até 25 caracteres
    const PIX_CIDADE = "CACAPAVA";                // até 15 caracteres
    const PIX_MINUTOS = 15;

    // Boleto: prazo de vencimento em dias.
    const BOLETO_DIAS = 3;

    // Imagem e descrição de cada equipamento (usadas no resumo).
    const PRODUTOS = {
        bicicleta: { imagem: "bicicleta.png",         descricao: "Acompanha capacete" },
        patins:    { imagem: "patins.png",            descricao: "Acompanha joelheira" },
        sup:       { imagem: "stand-up-paddle.png",   descricao: "Acompanha capa protetora" },
        bola:      { imagem: "bola.png",              descricao: "Bola de futebol FLUXO" },
        raquete:   { imagem: "raquete.png",           descricao: "Acompanha capa protetora" },
        caiaque:   { imagem: "caiaque.png",           descricao: "Acompanha remo" },
        barraca:   { imagem: "barraca.png",           descricao: "Acompanha estacas e bolsa" },
        badminton: { imagem: "kit-badminton.png",     descricao: "Incluso: 2 raquetes, 4 petecas e 1 mochila" },
        prancha: { imagem: "prancha-de-surf.png", descricao: "Acompanha leash" },
        "roupa-surf": { imagem: "roupa-de-surf.png", descricao: "Tamanhos P ao GG sob consulta" },
        natacao: { imagem: "kit-natacao.png", descricao: "Incluso: máscara, snorkel, nadadeiras e touca" },
        seguranca: { imagem: "kit-seguranca.png", descricao: "Incluso: colete, capacete, bolsa estanque, cordão e 2 pulseiras" },
        "rede-volei": { imagem: "rede-volei.png", descricao: "Acompanha cordas de fixação e bolsa" },
        pingpong: { imagem: "mesa-de-pingpong.png", descricao: "Incluso: rede, 2 raquetes e 1 bola" },
        pickleball: { imagem: "kit-pickleball.png", descricao: "Incluso: 2 raquetes, 4 bolinhas, mochila, sacola e 2 fitas" },
        slackline: { imagem: "kit-slackline.png", descricao: "Incluso: fita, catraca, 2 protetores de árvore e bolsa" }
    };

    /* ==========================================
       ELEMENTOS
    ========================================== */

    const $ = function (id) {
        return document.getElementById(id);
    };

    /* ==========================================
       FUNÇÕES AUXILIARES
    ========================================== */

    function formatarMoeda(valor) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function deISO(iso) {
        return new Date(iso + "T12:00:00");
    }

    function paraISO(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");

        return ano + "-" + mes + "-" + dia;
    }

    function dataCurta(iso) {
        const p = iso.split("-");
        return p[2] + "/" + p[1];
    }

    function dataCompleta(iso) {
        const p = iso.split("-");
        return p[2] + "/" + p[1] + "/" + p[0];
    }

    function somenteDigitos(texto) {
        return texto.replace(/\D/g, "");
    }

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

    /* ==========================================
       LEITURA DA RESERVA (vem da página anterior)
    ========================================== */

    function lerReserva() {
        let bruto = null;

        try {
            bruto = sessionStorage.getItem("fluxoReserva");
        } catch (e) {
            return null;
        }

        if (!bruto) {
            return null;
        }

        try {
            const r = JSON.parse(bruto);

            if (
                !r ||
                !Array.isArray(r.itens) || r.itens.length === 0 ||
                !r.retirada || !r.devolucao
            ) {
                return null;
            }

            const dias = Math.round(
                (deISO(r.devolucao) - deISO(r.retirada)) / 86400000
            );

            if (dias <= 0) {
                return null;
            }

            const itens = r.itens.map(function (item) {
                return {
                    id: item.id,
                    nome: item.nome,
                    preco: Number(item.preco),
                    total: Number(item.preco) * dias
                };
            });

            const subtotal = itens.reduce(function (soma, item) {
                return soma + item.total;
            }, 0);

            const taxa = typeof r.taxaServico === "number"
                ? r.taxaServico
                : TAXA_PADRAO;

            return {
                itens: itens,
                dias: dias,
                retirada: r.retirada,
                devolucao: r.devolucao,
                unidadeRetirada: r.unidadeRetirada || "",
                unidadeDevolucao: r.unidadeDevolucao || "",
                enderecoRetirada: r.enderecoRetirada || "",
                enderecoDevolucao: r.enderecoDevolucao || "",
                subtotal: subtotal,
                desconto: DESCONTO,
                taxa: taxa,
                total: subtotal - DESCONTO + taxa
            };
        } catch (e) {
            return null;
        }
    }

    const reserva = lerReserva();

    if (!reserva) {
        $("pg-layout").hidden = true;
        $("pg-vazio").hidden = false;
        return;
    }

    /* ==========================================
       PREENCHE A PÁGINA COM A RESERVA
    ========================================== */

    function textoDias(n) {
        return n + (n === 1 ? " dia" : " dias");
    }

    function infoProduto(id) {
        return PRODUTOS[id] || { imagem: "", descricao: "" };
    }

    function preencherRevisao() {
        const corpo = $("revisao-itens");

        reserva.itens.forEach(function (item) {
            const info = infoProduto(item.id);
            const linha = document.createElement("tr");

            // Produto
            const tdProduto = document.createElement("td");
            const produto = criar("div", "pg-produto");
            const img = document.createElement("img");
            img.src = info.imagem;
            img.alt = item.nome;

            const texto = document.createElement("div");
            texto.append(
                criar("strong", "", item.nome),
                criar("span", "pg-dias", textoDias(reserva.dias))
            );

            produto.append(img, texto);
            tdProduto.appendChild(produto);

            // Retirada e devolução
            function celulaData(iso) {
                const td = document.createElement("td");
                const bloco = criar("div", "pg-data");
                bloco.append(
                    criar("span", "", dataCurta(iso)),
                    criar("span", "", HORARIO)
                );
                td.appendChild(bloco);
                return td;
            }

            // Total
            const tdTotal = criar("td", "pg-preco", formatarMoeda(item.total));

            linha.append(
                tdProduto,
                celulaData(reserva.retirada),
                celulaData(reserva.devolucao),
                tdTotal
            );

            corpo.appendChild(linha);
        });
    }

    function preencherResumo() {
        const lista = $("resumo-itens");

        reserva.itens.forEach(function (item) {
            const info = infoProduto(item.id);
            const li = document.createElement("li");

            const img = document.createElement("img");
            img.src = info.imagem;
            img.alt = item.nome;

            const textos = criar("div", "pg-resumo-info");
            textos.append(criar("strong", "", item.nome));

            if (info.descricao) {
                textos.append(criar("span", "", info.descricao));
            }

            textos.append(criar("span", "", textoDias(reserva.dias)));

            li.append(
                img,
                textos,
                criar("span", "pg-resumo-preco", formatarMoeda(item.total))
            );

            lista.appendChild(li);
        });

        $("valor-subtotal").textContent = formatarMoeda(reserva.subtotal);
        $("valor-desconto").textContent = formatarMoeda(reserva.desconto);
        $("valor-taxa").textContent = formatarMoeda(reserva.taxa);
        $("valor-total").textContent = formatarMoeda(reserva.total);
    }

    function blocoLocal(rotulo, nome, endereco) {
        const bloco = criar("div", "pg-local-bloco");

        if (rotulo) {
            bloco.appendChild(criar("small", "", rotulo));
        }

        bloco.appendChild(criar("strong", "", nome));

        if (endereco) {
            bloco.appendChild(criar("span", "", endereco));
        }

        return bloco;
    }

    function preencherLocal() {
        const conteudo = $("local-conteudo");
        const mesmaUnidade =
            reserva.unidadeRetirada === reserva.unidadeDevolucao;

        if (mesmaUnidade) {
            conteudo.appendChild(
                blocoLocal("", reserva.unidadeRetirada, reserva.enderecoRetirada)
            );
            return;
        }

        $("titulo-local").textContent = "Locais de retirada e devolução";
        conteudo.appendChild(
            blocoLocal("Retirada", reserva.unidadeRetirada, reserva.enderecoRetirada)
        );
        conteudo.appendChild(
            blocoLocal("Devolução", reserva.unidadeDevolucao, reserva.enderecoDevolucao)
        );
    }

    preencherRevisao();
    preencherResumo();
    preencherLocal();

    /* ==========================================
       MÁSCARAS DOS CAMPOS
    ========================================== */

    function mascaraTelefone(valor) {
        const d = somenteDigitos(valor).slice(0, 11);

        if (d.length <= 2) {
            return d.length ? "(" + d : "";
        }

        if (d.length <= 6) {
            return "(" + d.slice(0, 2) + ") " + d.slice(2);
        }

        if (d.length <= 10) {
            return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
        }

        return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    }

    function mascaraCPF(valor) {
        const d = somenteDigitos(valor).slice(0, 11);

        return d
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    function mascaraCartao(valor) {
        return somenteDigitos(valor)
            .slice(0, 19)
            .replace(/(\d{4})(?=\d)/g, "$1 ");
    }

    function mascaraValidade(valor) {
        const d = somenteDigitos(valor).slice(0, 4);

        return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    }

    function mascaraCVV(valor) {
        return somenteDigitos(valor).slice(0, 4);
    }

    function aplicarMascara(id, funcao) {
        const campo = $(id);

        campo.addEventListener("input", function () {
            campo.value = funcao(campo.value);
        });
    }

    aplicarMascara("telefone", mascaraTelefone);
    aplicarMascara("cpf", mascaraCPF);
    aplicarMascara("cartao-numero", mascaraCartao);
    aplicarMascara("cartao-validade", mascaraValidade);
    aplicarMascara("cartao-cvv", mascaraCVV);

    /* ==========================================
       CONTA: só finaliza quem está logado
       e os dados do titular vêm da conta
    ========================================== */

    const Auth = window.FluxoAuth;

    // Confere a sessão na hora (ela pode ter acabado em outra aba).
    function usuarioLogado() {
        const sessao = Auth ? Auth.sessaoAtual() : null;
        return sessao ? Auth.buscarUsuario(sessao.email) : null;
    }

    const contaAtual = usuarioLogado();

    function avisarLogin() {
        const aviso = $("pg-aviso-login");

        aviso.hidden = false;
        aviso.classList.remove("destacar");
        void aviso.offsetWidth; // reinicia a animação
        aviso.classList.add("destacar");
        aviso.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (contaAtual) {
        // Preenche os dados do titular (a pessoa ainda pode ajustar).
        $("nome").value = contaAtual.nome || "";
        $("email").value = contaAtual.email || "";
        $("telefone").value = mascaraTelefone(contaAtual.telefone || "");
        $("cpf").value = mascaraCPF(contaAtual.cpf || "");
    } else {
        $("pg-aviso-login").hidden = false;
        $("pg-confirmar").disabled = true;
        $("pg-confirmar").textContent = "Entre na sua conta para finalizar";
    }

    /* ==========================================
       VALIDAÇÕES
    ========================================== */

    function cpfValido(valor) {
        const d = somenteDigitos(valor);

        if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) {
            return false;
        }

        function digito(base) {
            let soma = 0;

            for (let i = 0; i < base; i++) {
                soma += Number(d[i]) * (base + 1 - i);
            }

            const resto = (soma * 10) % 11;
            return resto === 10 ? 0 : resto;
        }

        return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
    }

    function validadeValida(valor) {
        const m = /^(\d{2})\/(\d{2})$/.exec(valor);

        if (!m) {
            return false;
        }

        const mes = Number(m[1]);
        const ano = 2000 + Number(m[2]);

        if (mes < 1 || mes > 12) {
            return false;
        }

        // O cartão vale até o último dia do mês informado.
        const fimDoMes = new Date(ano, mes, 0, 23, 59, 59);
        return fimDoMes >= new Date();
    }

    const REGRAS = [
        {
            id: "nome",
            msg: "Informe seu nome completo.",
            ok: function (v) {
                return v.trim().length >= 5 && v.trim().split(/\s+/).length >= 2;
            }
        },
        {
            id: "telefone",
            msg: "Informe um telefone válido com DDD.",
            ok: function (v) {
                const n = somenteDigitos(v).length;
                return n === 10 || n === 11;
            }
        },
        {
            id: "email",
            msg: "Informe um e-mail válido.",
            ok: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
            }
        },
        {
            id: "cpf",
            msg: "Informe um CPF válido.",
            ok: cpfValido
        }
    ];

    const REGRAS_CARTAO = [
        {
            id: "cartao-numero",
            msg: "Informe o número do cartão.",
            ok: function (v) {
                const n = somenteDigitos(v).length;
                return n >= 13 && n <= 19;
            }
        },
        {
            id: "cartao-nome",
            msg: "Informe o nome impresso no cartão.",
            ok: function (v) {
                return v.trim().length >= 3;
            }
        },
        {
            id: "cartao-validade",
            msg: "Informe uma validade válida (MM/AA).",
            ok: validadeValida
        },
        {
            id: "cartao-cvv",
            msg: "Informe o CVV (3 ou 4 dígitos).",
            ok: function (v) {
                return v.length === 3 || v.length === 4;
            }
        }
    ];

    function marcarCampo(regra) {
        const campo = $(regra.id);
        const erro = $("erro-" + regra.id);
        const valido = regra.ok(campo.value);

        campo.classList.toggle("invalido", !valido);
        campo.setAttribute("aria-invalid", String(!valido));
        erro.textContent = valido ? "" : regra.msg;

        return valido;
    }

    // Remove o aviso de erro assim que a pessoa volta a digitar.
    REGRAS.concat(REGRAS_CARTAO).forEach(function (regra) {
        $(regra.id).addEventListener("input", function () {
            if ($(regra.id).classList.contains("invalido")) {
                $(regra.id).classList.remove("invalido");
                $(regra.id).setAttribute("aria-invalid", "false");
                $("erro-" + regra.id).textContent = "";
            }
        });
    });

    /* ==========================================
       FORMAS DE PAGAMENTO (dropdowns)
    ========================================== */

    const metodos = Array.from(document.querySelectorAll(".pg-metodo"));
    let metodoEscolhido = null;

    function painelDe(metodo) {
        return metodo.querySelector(".pg-painel");
    }

    function topoDe(metodo) {
        return metodo.querySelector(".pg-metodo-topo");
    }

    function abrirPainel(metodo, abrir) {
        painelDe(metodo).hidden = !abrir;
        topoDe(metodo).setAttribute("aria-expanded", String(abrir));
    }

    function escolherMetodo(metodo) {
        const nome = metodo.dataset.metodo;

        metodoEscolhido = nome;
        $("erro-metodo").textContent = "";

        metodos.forEach(function (outro) {
            const ativo = outro === metodo;

            outro.classList.toggle("ativo", ativo);
            topoDe(outro).setAttribute("aria-checked", String(ativo));
            abrirPainel(outro, ativo);
        });

        if (nome === "pix") {
            iniciarTemporizadorPix();
        }
    }

    metodos.forEach(function (metodo) {
        topoDe(metodo).addEventListener("click", function () {
            // Clicar no que já está aberto apenas recolhe/expande o painel.
            if (metodoEscolhido === metodo.dataset.metodo) {
                abrirPainel(metodo, painelDe(metodo).hidden);
                return;
            }

            escolherMetodo(metodo);
        });
    });

    /* ==========================================
       PIX: código copia e cola + QR Code
    ========================================== */

    function tlv(id, valor) {
        return id + String(valor.length).padStart(2, "0") + valor;
    }

    function crc16(texto) {
        let crc = 0xFFFF;

        for (let i = 0; i < texto.length; i++) {
            crc ^= texto.charCodeAt(i) << 8;

            for (let b = 0; b < 8; b++) {
                crc = (crc & 0x8000)
                    ? ((crc << 1) ^ 0x1021) & 0xFFFF
                    : (crc << 1) & 0xFFFF;
            }
        }

        return crc.toString(16).toUpperCase().padStart(4, "0");
    }

    function montarPix(valor) {
        const base =
            tlv("00", "01") +
            tlv("26", tlv("00", "BR.GOV.BCB.PIX") + tlv("01", PIX_CHAVE)) +
            tlv("52", "0000") +
            tlv("53", "986") +
            tlv("54", valor.toFixed(2)) +
            tlv("58", "BR") +
            tlv("59", PIX_NOME) +
            tlv("60", PIX_CIDADE) +
            tlv("62", tlv("05", "***")) +
            "6304";

        return base + crc16(base);
    }

    /* ---------- Gerador de QR Code (nível L, versões 1 a 10) ---------- */

    function gerarQR(texto) {
        const bytes = Array.from(new TextEncoder().encode(texto));

        const ECC_POR_BLOCO = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18];
        const NUM_BLOCOS = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4];

        function modulosBrutos(v) {
            let r = (16 * v + 128) * v + 64;

            if (v >= 2) {
                const na = Math.floor(v / 7) + 2;
                r -= (25 * na - 10) * na - 55;

                if (v >= 7) {
                    r -= 36;
                }
            }

            return r;
        }

        function capacidadeDados(v) {
            return Math.floor(modulosBrutos(v) / 8) -
                ECC_POR_BLOCO[v] * NUM_BLOCOS[v];
        }

        // Escolhe a menor versão em que os dados cabem.
        let versao = 0;

        for (let v = 1; v <= 10; v++) {
            const bitsNecessarios = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;

            if (bitsNecessarios <= capacidadeDados(v) * 8) {
                versao = v;
                break;
            }
        }

        if (!versao) {
            throw new Error("Texto grande demais para o QR Code.");
        }

        const tamanho = versao * 4 + 17;

        /* Corrige erros (Reed-Solomon) */

        function gfMul(x, y) {
            let z = 0;

            for (let i = 7; i >= 0; i--) {
                z = (z << 1) ^ ((z >>> 7) * 0x11D);
                z ^= ((y >>> i) & 1) * x;
            }

            return z;
        }

        function divisor(grau) {
            const r = new Array(grau).fill(0);
            r[grau - 1] = 1;
            let raiz = 1;

            for (let i = 0; i < grau; i++) {
                for (let j = 0; j < r.length; j++) {
                    r[j] = gfMul(r[j], raiz);

                    if (j + 1 < r.length) {
                        r[j] ^= r[j + 1];
                    }
                }

                raiz = gfMul(raiz, 2);
            }

            return r;
        }

        function resto(dados, div) {
            const r = div.map(function () { return 0; });

            dados.forEach(function (b) {
                const fator = b ^ r.shift();
                r.push(0);

                div.forEach(function (coef, i) {
                    r[i] ^= gfMul(coef, fator);
                });
            });

            return r;
        }

        /* Monta os bits de dados */

        const bits = [];

        function adicionar(valor, qtd) {
            for (let i = qtd - 1; i >= 0; i--) {
                bits.push((valor >>> i) & 1);
            }
        }

        adicionar(0x4, 4); // modo byte
        adicionar(bytes.length, versao < 10 ? 8 : 16);
        bytes.forEach(function (b) { adicionar(b, 8); });

        const capacidadeBits = capacidadeDados(versao) * 8;
        adicionar(0, Math.min(4, capacidadeBits - bits.length));
        adicionar(0, (8 - bits.length % 8) % 8);

        for (let pad = 0xEC; bits.length < capacidadeBits; pad ^= 0xEC ^ 0x11) {
            adicionar(pad, 8);
        }

        const dados = [];

        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0;

            for (let j = 0; j < 8; j++) {
                byte = (byte << 1) | bits[i + j];
            }

            dados.push(byte);
        }

        /* Divide em blocos, calcula ECC e intercala */

        const numBlocos = NUM_BLOCOS[versao];
        const eccLen = ECC_POR_BLOCO[versao];
        const brutoCW = Math.floor(modulosBrutos(versao) / 8);
        const blocosCurtos = numBlocos - brutoCW % numBlocos;
        const tamanhoCurto = Math.floor(brutoCW / numBlocos);

        const blocos = [];
        const div = divisor(eccLen);

        for (let i = 0, k = 0; i < numBlocos; i++) {
            const parte = dados.slice(
                k,
                k + tamanhoCurto - eccLen + (i < blocosCurtos ? 0 : 1)
            );

            k += parte.length;
            const ecc = resto(parte, div);

            if (i < blocosCurtos) {
                parte.push(0);
            }

            blocos.push(parte.concat(ecc));
        }

        const palavras = [];

        for (let i = 0; i < blocos[0].length; i++) {
            blocos.forEach(function (bloco, j) {
                if (i !== tamanhoCurto - eccLen || j >= blocosCurtos) {
                    palavras.push(bloco[i]);
                }
            });
        }

        /* Desenha a matriz */

        const modulos = [];
        const funcao = [];

        for (let y = 0; y < tamanho; y++) {
            modulos.push(new Array(tamanho).fill(false));
            funcao.push(new Array(tamanho).fill(false));
        }

        function definir(x, y, cor) {
            modulos[y][x] = cor;
            funcao[y][x] = true;
        }

        function bit(valor, i) {
            return ((valor >>> i) & 1) !== 0;
        }

        function localizador(cx, cy) {
            for (let dy = -4; dy <= 4; dy++) {
                for (let dx = -4; dx <= 4; dx++) {
                    const dist = Math.max(Math.abs(dx), Math.abs(dy));
                    const x = cx + dx;
                    const y = cy + dy;

                    if (x >= 0 && x < tamanho && y >= 0 && y < tamanho) {
                        definir(x, y, dist !== 2 && dist !== 4);
                    }
                }
            }
        }

        function alinhamento(cx, cy) {
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    definir(
                        cx + dx,
                        cy + dy,
                        Math.max(Math.abs(dx), Math.abs(dy)) !== 1
                    );
                }
            }
        }

        function posicoesAlinhamento() {
            if (versao === 1) {
                return [];
            }

            const n = Math.floor(versao / 7) + 2;
            const passo = versao === 32
                ? 26
                : Math.ceil((versao * 4 + 4) / (n * 2 - 2)) * 2;
            const r = [6];

            for (let pos = tamanho - 7; r.length < n; pos -= passo) {
                r.splice(1, 0, pos);
            }

            return r;
        }

        function formato(mascara) {
            const d = (1 << 3) | mascara; // nível de correção L = 01
            let rem = d;

            for (let i = 0; i < 10; i++) {
                rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
            }

            const b = ((d << 10) | rem) ^ 0x5412;

            for (let i = 0; i <= 5; i++) {
                definir(8, i, bit(b, i));
            }

            definir(8, 7, bit(b, 6));
            definir(8, 8, bit(b, 7));
            definir(7, 8, bit(b, 8));

            for (let i = 9; i < 15; i++) {
                definir(14 - i, 8, bit(b, i));
            }

            for (let i = 0; i < 8; i++) {
                definir(tamanho - 1 - i, 8, bit(b, i));
            }

            for (let i = 8; i < 15; i++) {
                definir(8, tamanho - 15 + i, bit(b, i));
            }

            definir(8, tamanho - 8, true);
        }

        function informacaoVersao() {
            if (versao < 7) {
                return;
            }

            let rem = versao;

            for (let i = 0; i < 12; i++) {
                rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
            }

            const b = (versao << 12) | rem;

            for (let i = 0; i < 18; i++) {
                const cor = bit(b, i);
                const a = tamanho - 11 + i % 3;
                const c = Math.floor(i / 3);

                definir(a, c, cor);
                definir(c, a, cor);
            }
        }

        for (let i = 0; i < tamanho; i++) {
            definir(6, i, i % 2 === 0);
            definir(i, 6, i % 2 === 0);
        }

        localizador(3, 3);
        localizador(tamanho - 4, 3);
        localizador(3, tamanho - 4);

        const pos = posicoesAlinhamento();

        for (let i = 0; i < pos.length; i++) {
            for (let j = 0; j < pos.length; j++) {
                const canto =
                    (i === 0 && j === 0) ||
                    (i === 0 && j === pos.length - 1) ||
                    (i === pos.length - 1 && j === 0);

                if (!canto) {
                    alinhamento(pos[i], pos[j]);
                }
            }
        }

        formato(0);
        informacaoVersao();

        // Posiciona os dados em zigue-zague.
        let idx = 0;

        for (let direita = tamanho - 1; direita >= 1; direita -= 2) {
            if (direita === 6) {
                direita = 5;
            }

            for (let vert = 0; vert < tamanho; vert++) {
                for (let j = 0; j < 2; j++) {
                    const x = direita - j;
                    const subindo = ((direita + 1) & 2) === 0;
                    const y = subindo ? tamanho - 1 - vert : vert;

                    if (!funcao[y][x] && idx < palavras.length * 8) {
                        modulos[y][x] = bit(palavras[idx >>> 3], 7 - (idx & 7));
                        idx++;
                    }
                }
            }
        }

        function aplicarMascara(m) {
            for (let y = 0; y < tamanho; y++) {
                for (let x = 0; x < tamanho; x++) {
                    let inverte;

                    switch (m) {
                        case 0: inverte = (x + y) % 2 === 0; break;
                        case 1: inverte = y % 2 === 0; break;
                        case 2: inverte = x % 3 === 0; break;
                        case 3: inverte = (x + y) % 3 === 0; break;
                        case 4: inverte = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
                        case 5: inverte = x * y % 2 + x * y % 3 === 0; break;
                        case 6: inverte = (x * y % 2 + x * y % 3) % 2 === 0; break;
                        default: inverte = ((x + y) % 2 + x * y % 3) % 2 === 0;
                    }

                    if (!funcao[y][x] && inverte) {
                        modulos[y][x] = !modulos[y][x];
                    }
                }
            }
        }

        function penalidade() {
            let total = 0;

            function sequencias(linha) {
                let score = 0;
                let corAtual = linha[0];
                let corrida = 1;

                for (let i = 1; i < linha.length; i++) {
                    if (linha[i] === corAtual) {
                        corrida++;

                        if (corrida === 5) {
                            score += 3;
                        } else if (corrida > 5) {
                            score++;
                        }
                    } else {
                        corAtual = linha[i];
                        corrida = 1;
                    }
                }

                // Padrões parecidos com o localizador (1011101).
                const padrao = [true, false, true, true, true, false, true];

                for (let i = 0; i + 7 <= linha.length; i++) {
                    let igual = true;

                    for (let k = 0; k < 7; k++) {
                        if (linha[i + k] !== padrao[k]) {
                            igual = false;
                            break;
                        }
                    }

                    if (!igual) {
                        continue;
                    }

                    function claro(a, b) {
                        for (let k = a; k < b; k++) {
                            if (k >= 0 && k < linha.length && linha[k]) {
                                return false;
                            }
                        }

                        return true;
                    }

                    if (claro(i - 4, i)) {
                        score += 40;
                    }

                    if (claro(i + 7, i + 11)) {
                        score += 40;
                    }
                }

                return score;
            }

            for (let y = 0; y < tamanho; y++) {
                total += sequencias(modulos[y]);
            }

            for (let x = 0; x < tamanho; x++) {
                total += sequencias(modulos.map(function (linha) {
                    return linha[x];
                }));
            }

            for (let y = 0; y < tamanho - 1; y++) {
                for (let x = 0; x < tamanho - 1; x++) {
                    const c = modulos[y][x];

                    if (
                        c === modulos[y][x + 1] &&
                        c === modulos[y + 1][x] &&
                        c === modulos[y + 1][x + 1]
                    ) {
                        total += 3;
                    }
                }
            }

            let escuros = 0;

            modulos.forEach(function (linha) {
                linha.forEach(function (c) {
                    if (c) {
                        escuros++;
                    }
                });
            });

            const k = Math.ceil(
                Math.abs(escuros * 20 - tamanho * tamanho * 10) /
                (tamanho * tamanho)
            ) - 1;

            return total + Math.max(k, 0) * 10;
        }

        // Testa as 8 máscaras e usa a de menor penalidade.
        let melhor = 0;
        let menor = Infinity;

        for (let m = 0; m < 8; m++) {
            aplicarMascara(m);
            formato(m);
            const p = penalidade();

            if (p < menor) {
                menor = p;
                melhor = m;
            }

            aplicarMascara(m);
        }

        aplicarMascara(melhor);
        formato(melhor);

        return modulos;
    }

    function qrParaSVG(matriz) {
        const borda = 3;
        const total = matriz.length + borda * 2;
        let caminho = "";

        matriz.forEach(function (linha, y) {
            linha.forEach(function (cor, x) {
                if (cor) {
                    caminho += "M" + (x + borda) + " " + (y + borda) + "h1v1h-1z";
                }
            });
        });

        return (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total +
            '" shape-rendering="crispEdges">' +
            '<rect width="' + total + '" height="' + total + '" fill="#ffffff"/>' +
            '<path d="' + caminho + '" fill="#000000"/></svg>'
        );
    }

    const codigoPix = montarPix(reserva.total);
    $("pix-codigo").textContent = codigoPix;
    $("pix-qr").innerHTML = qrParaSVG(gerarQR(codigoPix));

    /* ---------- Contagem regressiva do Pix ---------- */

    let fimPix = 0;
    let relogioPix = null;

    function atualizarTempoPix() {
        const rotulo = $("pix-tempo");
        const restante = Math.max(0, Math.round((fimPix - Date.now()) / 1000));

        if (restante === 0) {
            clearInterval(relogioPix);
            relogioPix = null;
            rotulo.classList.add("expirado");
            rotulo.textContent = "Tempo esgotado. Escolha o Pix novamente para gerar outro prazo.";
            fimPix = 0;
            return;
        }

        const min = String(Math.floor(restante / 60)).padStart(2, "0");
        const seg = String(restante % 60).padStart(2, "0");

        rotulo.classList.remove("expirado");
        rotulo.textContent = "Tempo restante: " + min + ":" + seg;
    }

    function iniciarTemporizadorPix() {
        if (relogioPix) {
            return;
        }

        fimPix = Date.now() + PIX_MINUTOS * 60 * 1000;
        atualizarTempoPix();
        relogioPix = setInterval(atualizarTempoPix, 1000);
    }

    /* ==========================================
       BOLETO: linha digitável + código de barras
    ========================================== */

    function mod10(numero) {
        let soma = 0;
        let peso = 2;

        for (let i = numero.length - 1; i >= 0; i--) {
            let produto = Number(numero[i]) * peso;

            if (produto > 9) {
                produto = Math.floor(produto / 10) + (produto % 10);
            }

            soma += produto;
            peso = peso === 2 ? 1 : 2;
        }

        return String((10 - soma % 10) % 10);
    }

    function mod11(numero) {
        let soma = 0;
        let peso = 2;

        for (let i = numero.length - 1; i >= 0; i--) {
            soma += Number(numero[i]) * peso;
            peso = peso === 9 ? 2 : peso + 1;
        }

        const dv = 11 - (soma % 11);
        return String(dv === 0 || dv === 10 || dv === 11 ? 1 : dv);
    }

    function aleatorio(qtd) {
        let r = "";

        for (let i = 0; i < qtd; i++) {
            r += Math.floor(Math.random() * 10);
        }

        return r;
    }

    function montarBoleto(valor, vencimento) {
        // Fator de vencimento: contagem recomeçada em 22/02/2025 (= 1000).
        const base = new Date("2025-02-22T12:00:00");
        const fator = 1000 + Math.round((vencimento - base) / 86400000);

        const banco = "001";
        const moeda = "9";
        const valorCentavos = String(Math.round(valor * 100)).padStart(10, "0");
        const livre = aleatorio(25);

        const semDV = banco + moeda + String(fator) + valorCentavos + livre;
        const dv = mod11(semDV);
        const barras = banco + moeda + dv + String(fator) + valorCentavos + livre;

        const c1 = banco + moeda + livre.slice(0, 5);
        const c2 = livre.slice(5, 15);
        const c3 = livre.slice(15, 25);

        const campo1 = c1.slice(0, 5) + "." + c1.slice(5) + mod10(c1);
        const campo2 = c2.slice(0, 5) + "." + c2.slice(5) + mod10(c2);
        const campo3 = c3.slice(0, 5) + "." + c3.slice(5) + mod10(c3);

        return {
            barras: barras,
            linha: [
                campo1, campo2, campo3,
                dv,
                String(fator) + valorCentavos
            ].join(" ")
        };
    }

    // Código de barras no padrão Intercalado 2 de 5 (usado em boletos).
    function barrasParaSVG(numero) {
        const PADROES = [
            "nnwwn", "wnnnw", "nwnnw", "wwnnn", "nnwnw",
            "wnwnn", "nwwnn", "nnnww", "wnnwn", "nwnwn"
        ];

        const largura = function (letra) {
            return letra === "w" ? 3 : 1;
        };

        let x = 0;
        let retangulos = "";

        function barra(w) {
            retangulos += '<rect x="' + x + '" y="0" width="' + w + '" height="60"/>';
            x += w;
        }

        // Início: barra, espaço, barra, espaço (estreitos)
        barra(1);
        x += 1;
        barra(1);
        x += 1;

        for (let i = 0; i < numero.length; i += 2) {
            const a = PADROES[Number(numero[i])];
            const b = PADROES[Number(numero[i + 1])];

            for (let k = 0; k < 5; k++) {
                barra(largura(a[k]));
                x += largura(b[k]);
            }
        }

        // Fim: barra larga, espaço, barra estreita
        barra(3);
        x += 1;
        barra(1);

        return (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + x +
            ' 60" preserveAspectRatio="none" shape-rendering="crispEdges">' +
            retangulos + "</svg>"
        );
    }

    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + BOLETO_DIAS);

    const boleto = montarBoleto(reserva.total, vencimento);

    $("boleto-linha").textContent = boleto.linha;
    $("boleto-barras").innerHTML = barrasParaSVG(boleto.barras);
    $("boleto-venc").textContent = dataCompleta(paraISO(vencimento));

    /* ==========================================
       BOTÕES "COPIAR CÓDIGO"
    ========================================== */

    function copiarTexto(texto) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(texto);
        }

        return new Promise(function (resolve, reject) {
            const area = document.createElement("textarea");
            area.value = texto;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();

            try {
                document.execCommand("copy") ? resolve() : reject();
            } catch (e) {
                reject(e);
            } finally {
                document.body.removeChild(area);
            }
        });
    }

    document.querySelectorAll(".pg-copiar").forEach(function (botao) {
        const textoOriginal = botao.textContent;

        botao.addEventListener("click", function () {
            const alvo = $(botao.dataset.copiar);

            copiarTexto(alvo.textContent).then(function () {
                botao.textContent = "Copiado!";
                botao.classList.add("copiado");
            }).catch(function () {
                botao.textContent = "Copie manualmente";
            }).finally(function () {
                setTimeout(function () {
                    botao.textContent = textoOriginal;
                    botao.classList.remove("copiado");
                }, 2000);
            });
        });
    });

    /* ==========================================
       TERMOS
    ========================================== */

    $("termos").addEventListener("change", function () {
        if ($("termos").checked) {
            $("erro-termos").textContent = "";
        }
    });

    /* ==========================================
       CONFIRMAR RESERVA E PAGAR
    ========================================== */

    // Código da reserva no formato FLX-AAMMDD-0000 (ex.: FLX-240612-4587).
    function gerarCodigoReserva() {
        const hoje = new Date();
        const aa = String(hoje.getFullYear()).slice(2);
        const mm = String(hoje.getMonth() + 1).padStart(2, "0");
        const dd = String(hoje.getDate()).padStart(2, "0");

        return "FLX-" + aa + mm + dd + "-" + aleatorio(4);
    }

    function concluirReserva() {
        // Sem conta logada a reserva não é finalizada.
        const conta = usuarioLogado();

        if (!conta) {
            $("pg-confirmar").disabled = true;
            avisarLogin();
            return;
        }

        // Guarda telefone e CPF na conta para preencher da próxima vez.
        Auth.atualizarUsuario(conta.email, {
            telefone: $("telefone").value.trim(),
            cpf: $("cpf").value.trim()
        });

        // Dados que a página "reserva-concluida.html" vai exibir.
        const confirmacao = {
            codigo: gerarCodigoReserva(),
            metodo: metodoEscolhido,
            email: $("email").value.trim(),
            dias: reserva.dias,
            retirada: reserva.retirada,
            devolucao: reserva.devolucao,
            unidadeRetirada: reserva.unidadeRetirada,
            unidadeDevolucao: reserva.unidadeDevolucao,
            total: reserva.total,
            itens: reserva.itens.map(function (item) {
                return {
                    id: item.id,
                    nome: item.nome,
                    total: item.total
                };
            })
        };

        try {
            sessionStorage.setItem("fluxoConfirmacao", JSON.stringify(confirmacao));

            // A reserva foi concluída: não deve ser paga duas vezes.
            sessionStorage.removeItem("fluxoReserva");
        } catch (e) {
            // Sem armazenamento a página seguinte mostrará o aviso de "nenhuma reserva".
        }

        if (relogioPix) {
            clearInterval(relogioPix);
            relogioPix = null;
        }

        $("pg-confirmar").disabled = true;
        window.location.href = "reserva-concluida.html";
    }

    $("form-pagamento").addEventListener("submit", function (evento) {
        evento.preventDefault();

        if (!usuarioLogado()) {
            avisarLogin();
            return;
        }

        let primeiroInvalido = null;

        function registrar(elemento) {
            if (!primeiroInvalido) {
                primeiroInvalido = elemento;
            }
        }

        // 1. Dados do titular
        REGRAS.forEach(function (regra) {
            if (!marcarCampo(regra)) {
                registrar($(regra.id));
            }
        });

        // 2. Forma de pagamento
        if (!metodoEscolhido) {
            $("erro-metodo").textContent = "Escolha uma forma de pagamento.";
            registrar(topoDe(metodos[0]));
        } else if (metodoEscolhido === "cartao") {
            REGRAS_CARTAO.forEach(function (regra) {
                if (!marcarCampo(regra)) {
                    registrar($(regra.id));
                }
            });
        }

        // 3. Termos
        if (!$("termos").checked) {
            $("erro-termos").textContent =
                "Para continuar, aceite os Termos de uso e a política de locação.";
            registrar($("termos"));
        }

        if (primeiroInvalido) {
            primeiroInvalido.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
            primeiroInvalido.focus({ preventScroll: true });
            return;
        }

        concluirReserva();
    });
});