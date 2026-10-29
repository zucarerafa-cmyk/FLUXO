document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       CONFIGURAÇÕES (altere aqui se precisar)
    ========================================== */

    // Valor fixo cobrado quando há itens e período escolhidos.
    const TAXA_SERVICO = 10;

    // Página para onde o botão "Continuar" leva.
    const PAGINA_PAGAMENTO = "pagamento.html";

    // Unidades disponíveis para retirada e devolução.
    const UNIDADES = [
        { nome: "Unidade Paulista",   endereco: "Av. Paulista, 1000 - Bela Vista" },
        { nome: "Unidade Pinheiros",  endereco: "R. dos Pinheiros, 500 - Pinheiros" },
        { nome: "Unidade Ibirapuera", endereco: "Av. Pedro Álvares Cabral, 200 - Vila Mariana" },
        { nome: "Unidade Tatuapé",    endereco: "R. Tuiuti, 800 - Tatuapé" }
    ];

    const MESES = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

    /* ==========================================
       ELEMENTOS E ESTADO
    ========================================== */

    const itens = Array.from(document.querySelectorAll(".reserva-item"));
    const erro = document.getElementById("reserva-erro");
    const botaoContinuar = document.getElementById("reserva-continuar");

    const resumo = {
        titulo: document.getElementById("rc-titulo"),
        texto: document.getElementById("rc-texto"),
        itens: document.getElementById("rc-itens"),
        periodo: document.getElementById("rc-periodo"),
        quantidade: document.getElementById("rc-quantidade"),
        subtotal: document.getElementById("rc-subtotal"),
        taxa: document.getElementById("rc-taxa"),
        total: document.getElementById("rc-total")
    };


    const TEXTO_PADRAO =
        "Adicione itens e selecione as datas para ver o resumo da sua reserva.";

    const estado = {
        retirada: null,
        devolucao: null,
        "un-retirada": null,
        "un-devolucao": null
    };

    const dropdowns = [];

    // Escolhas feitas na página do produto (quantidade, período e diária).
    // Fica nulo quando a pessoa chega aqui sem passar por lá.
    let selecaoProduto = null;

    // Tempo máximo (em minutos) em que a escolha do produto é considerada válida.
    const VALIDADE_SELECAO_MIN = 30;

    function lerSelecaoProduto(idEsperado) {
        let bruto = null;

        try {
            bruto = sessionStorage.getItem("fluxoProduto");
        } catch (e) {
            return null;
        }

        if (!bruto) {
            return null;
        }

        try {
            const p = JSON.parse(bruto);
            const quantidade = Number(p.quantidade);
            const dias = Number(p.dias);
            const precoDia = Number(p.precoDia);
            const idade = Date.now() - Number(p.criadoEm);

            if (
                p.id !== idEsperado ||
                !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 10 ||
                !Number.isInteger(dias) || dias < 1 || dias > 60 ||
                !(precoDia > 0) ||
                !(idade >= 0 && idade <= VALIDADE_SELECAO_MIN * 60000)
            ) {
                return null;
            }

            // Mesmo que a escolha seja antiga, nunca passa do estoque disponível.
            const Est = window.FluxoEstoque;
            const limite = Est ? Math.max(1, Est.limiteParaAlugar(p.id)) : quantidade;

            return {
                id: p.id,
                quantidade: Math.min(quantidade, limite),
                dias: dias,
                precoDia: precoDia
            };
        } catch (e) {
            return null;
        }
    }

    /* ==========================================
       FUNÇÕES AUXILIARES
    ========================================== */

    function formatarMoeda(valor) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function paraISO(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");

        return ano + "-" + mes + "-" + dia;
    }

    // Usa meio-dia para evitar problemas de horário de verão.
    function deISO(iso) {
        return new Date(iso + "T12:00:00");
    }

    function somarDias(iso, dias) {
        const data = deISO(iso);
        data.setDate(data.getDate() + dias);
        return paraISO(data);
    }

    function formatarData(iso) {
        const partes = iso.split("-");
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }

    function formatarDataCurta(iso) {
        const partes = iso.split("-");
        return partes[2] + "/" + partes[1];
    }

    function diferencaDias(inicio, fim) {
        return Math.round(
            (deISO(fim).getTime() - deISO(inicio).getTime()) / 86400000
        );
    }

    const HOJE = paraISO(new Date());

    function mostrarErro(mensagem) {
        erro.textContent = mensagem;
    }

    function limparErro() {
        erro.textContent = "";
    }

    function itensSelecionados() {
        return itens
            .filter(function (item) {
                return item.querySelector(".reserva-check").checked;
            })
            .map(function (item) {
                const escolhido = selecaoProduto &&
                    selecaoProduto.id === item.dataset.id;

                if (escolhido) {
                    // Diária do período escolhido x quantidade de unidades.
                    return {
                        id: item.dataset.id,
                        nome: item.dataset.nome +
                            (selecaoProduto.quantidade > 1
                                ? " (" + selecaoProduto.quantidade + "x)"
                                : ""),
                        preco: selecaoProduto.precoDia * selecaoProduto.quantidade,
                        quantidade: selecaoProduto.quantidade
                    };
                }

                return {
                    id: item.dataset.id,
                    nome: item.dataset.nome,
                    preco: Number(item.dataset.preco)
                };
            });
    }

    /* ==========================================
       DISPONIBILIDADE POR DATA (estoque.js)
    ========================================== */

    const Estoque = window.FluxoEstoque;

    // Equipamentos marcados e quantas unidades de cada.
    function demanda() {
        return itens
            .filter(function (item) {
                return item.querySelector(".reserva-check").checked;
            })
            .map(function (item) {
                const escolhido = selecaoProduto && selecaoProduto.id === item.dataset.id;

                return {
                    id: item.dataset.id,
                    nome: item.dataset.nome,
                    qtd: escolhido ? selecaoProduto.quantidade : 1
                };
            });
    }

    // Primeiro equipamento sem unidades suficientes naquele dia (ou null).
    function conflitoNoDia(iso) {
        if (!Estoque) {
            return null;
        }

        const lista = demanda();

        for (let i = 0; i < lista.length; i++) {
            if (Estoque.disponivel(lista[i].id, iso) < lista[i].qtd) {
                return lista[i];
            }
        }

        return null;
    }

    function periodoComConflito(inicio, fim) {
        for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) {
            if (conflitoNoDia(dia)) {
                return true;
            }
        }

        return false;
    }

    // Primeiro dia depois da retirada em que algum item acaba.
    function primeiroBloqueioApos(inicio) {
        for (let i = 1; i <= 180; i++) {
            const dia = somarDias(inicio, i);

            if (conflitoNoDia(dia)) {
                return dia;
            }
        }

        return null;
    }

    function periodoCompleto() {
        return Boolean(
            estado.retirada &&
            estado.devolucao &&
            estado.devolucao > estado.retirada
        );
    }

    function calcular() {
        const lista = itensSelecionados();
        const somaDiarias = lista.reduce(function (soma, item) {
            return soma + item.preco;
        }, 0);

        const dias = periodoCompleto()
            ? diferencaDias(estado.retirada, estado.devolucao)
            : 0;

        const subtotal = somaDiarias * dias;
        const taxa = subtotal > 0 ? TAXA_SERVICO : 0;

        return {
            itens: lista,
            dias: dias,
            subtotal: subtotal,
            taxa: taxa,
            total: subtotal + taxa
        };
    }

    /* ==========================================
       RESUMO (atualiza tudo que está embaixo)
    ========================================== */

    function atualizarResumo() {
        const dados = calcular();
        const qtd = dados.itens.length;

        resumo.itens.textContent = String(qtd);

        if (estado.retirada && estado.devolucao) {
            resumo.periodo.textContent =
                formatarDataCurta(estado.retirada) + " a " +
                formatarDataCurta(estado.devolucao);
        } else if (estado.retirada) {
            resumo.periodo.textContent =
                formatarDataCurta(estado.retirada) + " a ...";
        } else {
            resumo.periodo.textContent = "–";
        }

        resumo.quantidade.textContent = dados.dias > 0
            ? dados.dias + (dados.dias === 1 ? " diária" : " diárias")
            : "–";

        resumo.subtotal.textContent = formatarMoeda(dados.subtotal);
        resumo.taxa.textContent = formatarMoeda(dados.taxa);
        resumo.total.textContent = formatarMoeda(dados.total);

        if (qtd === 0) {
            resumo.texto.textContent = TEXTO_PADRAO;
            return;
        }

        const nomes = dados.itens.map(function (item) {
            return item.nome;
        }).join(", ");

        if (periodoCompleto()) {
            resumo.texto.textContent = nomes;
        } else if (selecaoProduto && selecaoProduto.dias && !estado.retirada) {
            resumo.texto.textContent = nomes +
                ". Escolha a data de retirada para um aluguel de " +
                selecaoProduto.dias +
                (selecaoProduto.dias === 1 ? " dia." : " dias.");
        } else {
            resumo.texto.textContent =
                nomes + ". Selecione as datas de retirada e devolução.";
        }
    }

    /* ==========================================
       EQUIPAMENTOS
    ========================================== */

    // Se trocar os equipamentos e as datas ficarem sem estoque, limpa as datas.
    function revalidarDatas() {
        if (!estado.retirada || !calendarios.retirada) {
            return;
        }

        const fim = estado.devolucao || somarDias(estado.retirada, 1);

        if (periodoComConflito(estado.retirada, fim)) {
            calendarios.retirada.limpar();
            calendarios.devolucao.limpar();
            mostrarErro("Algumas datas ficaram sem estoque para os equipamentos escolhidos. Escolha novas datas.");
        }
    }

    function sincronizarItem(item) {
        const marcado = item.querySelector(".reserva-check").checked;
        item.classList.toggle("selecionado", marcado);
    }

    itens.forEach(function (item) {
        const caixa = item.querySelector(".reserva-check");

        caixa.addEventListener("change", function () {
            sincronizarItem(item);
            limparErro();
            revalidarDatas();
            atualizarResumo();
        });

        // Clicar em qualquer parte do card marca/desmarca o item.
        item.addEventListener("click", function (evento) {
            if (evento.target.closest("a") || evento.target === caixa) {
                return;
            }

            caixa.checked = !caixa.checked;
            caixa.dispatchEvent(new Event("change"));
        });
    });

    /* ==========================================
       DROPDOWNS (comportamento comum)
    ========================================== */

    function registrarDropdown(chave, botao, painel) {
        const dd = document.getElementById("dd-" + chave);

        const controle = {
            dd: dd,
            botao: botao,
            painel: painel,

            abrir: function () {
                dropdowns.forEach(function (outro) {
                    if (outro !== controle) {
                        outro.fechar();
                    }
                });

                painel.hidden = false;
                dd.classList.add("aberto");
                botao.setAttribute("aria-expanded", "true");
            },

            fechar: function () {
                painel.hidden = true;
                dd.classList.remove("aberto");
                botao.setAttribute("aria-expanded", "false");
            },

            estaAberto: function () {
                return !painel.hidden;
            }
        };

        dropdowns.push(controle);
        return controle;
    }

    document.addEventListener("click", function (evento) {
        // O calendário se redesenha ao trocar de mês e o botão clicado sai da
        // página; esse clique não é "fora" do calendário, então não fecha.
        if (!evento.target.isConnected) {
            return;
        }

        dropdowns.forEach(function (controle) {
            if (!controle.dd.contains(evento.target)) {
                controle.fechar();
            }
        });
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key !== "Escape") {
            return;
        }

        dropdowns.forEach(function (controle) {
            if (controle.estaAberto()) {
                controle.fechar();
                controle.botao.focus();
            }
        });
    });

    /* ==========================================
       CALENDÁRIOS (retirada e devolução)
    ========================================== */

    function criarCalendario(chave, dataMinima) {
        const botao = document.getElementById("campo-" + chave);
        const painel = document.getElementById("cal-" + chave);
        const valor = botao.querySelector(".reserva-valor");

        const controle = registrarDropdown(chave, botao, painel);

        let anoVisivel = Number(HOJE.slice(0, 4));
        let mesVisivel = Number(HOJE.slice(5, 7)) - 1;

        function mostrarValor() {
            const iso = estado[chave];

            if (iso) {
                valor.textContent = formatarData(iso);
                valor.classList.add("preenchido");
            } else {
                valor.textContent = valor.dataset.vazio;
                valor.classList.remove("preenchido");
            }
        }

        function irParaMes(delta) {
            const data = new Date(anoVisivel, mesVisivel + delta, 1);
            anoVisivel = data.getFullYear();
            mesVisivel = data.getMonth();
            desenhar();
        }

        function desenhar() {
            const minimo = dataMinima();
            const anoMin = Number(minimo.slice(0, 4));
            const mesMin = Number(minimo.slice(5, 7)) - 1;
            const naoPodeVoltar =
                anoVisivel * 12 + mesVisivel <= anoMin * 12 + mesMin;

            const lista = demanda();
            const bloqueioDev = chave === "devolucao" && estado.retirada && lista.length > 0
                ? primeiroBloqueioApos(estado.retirada)
                : null;

            painel.innerHTML = "";

            // Topo: mês/ano e setas
            const topo = document.createElement("div");
            topo.className = "cal-topo";

            const anterior = document.createElement("button");
            anterior.type = "button";
            anterior.className = "cal-nav";
            anterior.textContent = "‹";
            anterior.setAttribute("aria-label", "Mês anterior");
            anterior.disabled = naoPodeVoltar;
            anterior.addEventListener("click", function () {
                irParaMes(-1);
            });

            const titulo = document.createElement("strong");
            titulo.textContent = MESES[mesVisivel] + " " + anoVisivel;

            const proximo = document.createElement("button");
            proximo.type = "button";
            proximo.className = "cal-nav";
            proximo.textContent = "›";
            proximo.setAttribute("aria-label", "Próximo mês");
            proximo.addEventListener("click", function () {
                irParaMes(1);
            });

            topo.append(anterior, titulo, proximo);
            painel.appendChild(topo);

            // Grade: dias da semana + dias do mês
            const grade = document.createElement("div");
            grade.className = "cal-grade";

            SEMANA.forEach(function (letra) {
                const cab = document.createElement("span");
                cab.className = "cal-semana";
                cab.textContent = letra;
                grade.appendChild(cab);
            });

            const primeiroDia = new Date(anoVisivel, mesVisivel, 1).getDay();
            const totalDias = new Date(anoVisivel, mesVisivel + 1, 0).getDate();

            for (let i = 0; i < primeiroDia; i++) {
                const vazio = document.createElement("span");
                vazio.className = "cal-vazio";
                grade.appendChild(vazio);
            }

            for (let dia = 1; dia <= totalDias; dia++) {
                const iso = paraISO(new Date(anoVisivel, mesVisivel, dia, 12));
                const celula = document.createElement("button");

                celula.type = "button";
                celula.className = "cal-dia";
                celula.textContent = String(dia);
                celula.disabled = iso < minimo;

                // Dias sem estoque para os equipamentos escolhidos.
                if (iso >= minimo && lista.length > 0) {
                    const falta = conflitoNoDia(iso);
                    const semDevolucao =
                        chave === "retirada" && !falta && conflitoNoDia(somarDias(iso, 1));

                    if (falta) {
                        celula.disabled = true;
                        celula.classList.add("indisponivel");
                        celula.title = "Indisponível: " + falta.nome;
                    } else if (semDevolucao) {
                        celula.disabled = true;
                        celula.classList.add("indisponivel");
                        celula.title = "Sem estoque no dia seguinte para devolver";
                    } else if (bloqueioDev && iso > bloqueioDev) {
                        celula.disabled = true;
                        celula.classList.add("alem");
                        celula.title = "Há dias sem estoque no meio do período";
                    }
                }

                if (iso === HOJE) {
                    celula.classList.add("hoje");
                }

                if (iso === estado.retirada || iso === estado.devolucao) {
                    celula.classList.add("escolhido");
                } else if (
                    estado.retirada && estado.devolucao &&
                    iso > estado.retirada && iso < estado.devolucao
                ) {
                    celula.classList.add("no-periodo");
                }

                celula.addEventListener("click", function () {
                    escolher(iso);
                });

                grade.appendChild(celula);
            }

            painel.appendChild(grade);

            // Legenda
            const legenda = document.createElement("p");
            legenda.className = "cal-legenda";

            if (lista.length > 0) {
                const marca = document.createElement("i");
                legenda.append(marca, "Sem estoque para os equipamentos escolhidos");
            } else {
                legenda.append("Escolha os equipamentos para ver quais dias estão disponíveis.");
            }

            painel.appendChild(legenda);
        }

        function escolher(iso) {
            estado[chave] = iso;
            mostrarValor();
            controle.fechar();
            botao.focus();
            limparErro();

            // Se a devolução ficou antes (ou igual) à retirada, limpa.
            if (
                chave === "retirada" &&
                estado.devolucao &&
                estado.devolucao <= iso
            ) {
                calendarios.devolucao.limpar();
            }

            // Veio da página do produto: devolução = retirada + período escolhido.
            if (chave === "retirada" && selecaoProduto && !estado.devolucao) {
                const sugerida = somarDias(iso, selecaoProduto.dias);

                if (periodoComConflito(iso, sugerida)) {
                    mostrarErro("Esse equipamento não está livre por " + selecaoProduto.dias +
                        (selecaoProduto.dias === 1 ? " dia" : " dias") +
                        " a partir dessa data. Escolha outra data de devolução.");
                } else {
                    calendarios.devolucao.definir(sugerida);
                }
            }

            atualizarResumo();
        }

        function limpar() {
            estado[chave] = null;
            mostrarValor();
        }

        function definir(iso) {
            estado[chave] = iso;
            mostrarValor();
        }

        botao.addEventListener("click", function () {
            if (controle.estaAberto()) {
                controle.fechar();
                return;
            }

            // Abre no mês da data escolhida (ou no primeiro mês permitido).
            const referencia = estado[chave] || dataMinima();
            anoVisivel = Number(referencia.slice(0, 4));
            mesVisivel = Number(referencia.slice(5, 7)) - 1;

            desenhar();
            controle.abrir();
        });

        return { limpar: limpar, definir: definir };
    }

    const calendarios = {};

    calendarios.retirada = criarCalendario("retirada", function () {
        return HOJE;
    });

    calendarios.devolucao = criarCalendario("devolucao", function () {
        return somarDias(estado.retirada || HOJE, 1);
    });

    /* ==========================================
       UNIDADES (retirada e devolução)
    ========================================== */

    function criarUnidades(chave) {
        const botao = document.getElementById("campo-" + chave);
        const lista = document.getElementById("op-" + chave);
        const valor = botao.querySelector(".reserva-valor");

        const controle = registrarDropdown(chave, botao, lista);

        UNIDADES.forEach(function (unidade) {
            const opcao = document.createElement("li");
            opcao.setAttribute("role", "option");
            opcao.setAttribute("aria-selected", "false");
            opcao.tabIndex = 0;
            opcao.dataset.nome = unidade.nome;

            const nome = document.createElement("strong");
            nome.textContent = unidade.nome;

            const endereco = document.createElement("span");
            endereco.textContent = unidade.endereco;

            opcao.append(nome, endereco);
            lista.appendChild(opcao);

            function escolher() {
                estado[chave] = unidade.nome;

                valor.textContent = unidade.nome;
                valor.classList.add("preenchido");

                lista.querySelectorAll("li").forEach(function (li) {
                    li.setAttribute(
                        "aria-selected",
                        String(li === opcao)
                    );
                });

                controle.fechar();
                botao.focus();
                limparErro();
            }

            opcao.addEventListener("click", escolher);

            opcao.addEventListener("keydown", function (evento) {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    escolher();
                } else if (evento.key === "ArrowDown") {
                    evento.preventDefault();
                    if (opcao.nextElementSibling) {
                        opcao.nextElementSibling.focus();
                    }
                } else if (evento.key === "ArrowUp") {
                    evento.preventDefault();
                    if (opcao.previousElementSibling) {
                        opcao.previousElementSibling.focus();
                    }
                }
            });
        });

        botao.addEventListener("click", function () {
            if (controle.estaAberto()) {
                controle.fechar();
            } else {
                controle.abrir();
            }
        });

        botao.addEventListener("keydown", function (evento) {
            if (evento.key === "ArrowDown") {
                evento.preventDefault();
                controle.abrir();
                lista.querySelector("li").focus();
            }
        });
    }

    criarUnidades("un-retirada");
    criarUnidades("un-devolucao");

    /* ==========================================
       CONTINUAR → PAGAMENTO
    ========================================== */

    botaoContinuar.addEventListener("click", function () {
        limparErro();

        // Só segue para o pagamento quem está logado.
        const Extras = window.FluxoExtras;
        const arquivo = window.location.pathname.split("/").pop() || "reserva.html";

        if (Extras && !Extras.exigirLogin({ volta: arquivo + window.location.search })) {
            return;
        }

        const dados = calcular();

        if (dados.itens.length === 0) {
            mostrarErro("Selecione pelo menos um equipamento para continuar.");
            document.getElementById("reserva-grade").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
            return;
        }

        if (!estado.retirada) {
            mostrarErro("Escolha a data de retirada.");
            document.getElementById("campo-retirada").focus();
            return;
        }

        if (!estado.devolucao) {
            mostrarErro("Escolha a data de devolução.");
            document.getElementById("campo-devolucao").focus();
            return;
        }

        if (periodoComConflito(estado.retirada, estado.devolucao)) {
            mostrarErro("Esse período está sem estoque para algum equipamento. Escolha outras datas.");
            return;
        }

        if (!estado["un-retirada"]) {
            mostrarErro("Escolha a unidade de retirada.");
            document.getElementById("campo-un-retirada").focus();
            return;
        }

        if (!estado["un-devolucao"]) {
            mostrarErro("Escolha a unidade de devolução.");
            document.getElementById("campo-un-devolucao").focus();
            return;
        }

        const reserva = {
            itens: dados.itens,
            retirada: estado.retirada,
            devolucao: estado.devolucao,
            unidadeRetirada: estado["un-retirada"],
            unidadeDevolucao: estado["un-devolucao"],
            dias: dados.dias,
            subtotal: dados.subtotal,
            taxaServico: dados.taxa,
            total: dados.total
        };

        // A página de pagamento lê esta chave para mostrar o resumo.
        try {
            sessionStorage.setItem("fluxoReserva", JSON.stringify(reserva));
        } catch (e) {
            // Se o navegador bloquear o armazenamento, segue mesmo assim.
        }

        try {
            sessionStorage.removeItem("fluxoProduto");
        } catch (e) {
            // sem problemas
        }

        window.location.href = PAGINA_PAGAMENTO;
    });

    /* ==========================================
       INÍCIO: pré-seleciona item vindo de ?item=
    ========================================== */

    const idInicial = new URLSearchParams(window.location.search).get("item");

    if (idInicial) {
        const alvo = itens.find(function (item) {
            return item.dataset.id === idInicial;
        });

        if (alvo) {
            alvo.querySelector(".reserva-check").checked = true;
            sincronizarItem(alvo);
            selecaoProduto = lerSelecaoProduto(idInicial);
        }
    }

    atualizarResumo();
});