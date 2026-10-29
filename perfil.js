document.addEventListener("DOMContentLoaded", function () {

    const Auth = window.FluxoAuth;
    const $ = function (id) {
        return document.getElementById(id);
    };

    /* ==========================================
       ACESSO: só entra quem está logado
    ========================================== */

    const sessao = Auth.sessaoAtual();

    if (!sessao) {
        window.location.replace("login.html?redirect=perfil.html");
        return;
    }

    let usuario = Auth.buscarUsuario(sessao.email);

    // Sessão sem conta correspondente (ex.: conta excluída em outra aba).
    if (!usuario) {
        Auth.sair();
        window.location.replace("login.html?redirect=perfil.html");
        return;
    }

    $("pf-pagina").hidden = false;

    /* ==========================================
       CONFIGURAÇÕES
    ========================================== */

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

    const METODOS = {
        cartao: "Cartão de crédito",
        pix: "Pix",
        boleto: "Boleto bancário"
    };

    const STATUS = {
        agendada:  "Agendada",
        andamento: "Em andamento",
        concluida: "Concluída",
        cancelada: "Cancelada"
    };

    const MESES = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

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
        return (Number(valor) || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // "2026-09-01" -> "01/09/26"
    function dataCurta(iso) {
        const p = String(iso || "").split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0].slice(2) : "—";
    }

    function textoDias(n) {
        return n + (n === 1 ? " dia" : " dias");
    }

    function hojeISO() {
        const d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function iniciais(nome) {
        const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);

        if (partes.length === 0) {
            return "F";
        }

        if (partes.length === 1) {
            return partes[0].charAt(0);
        }

        return partes[0].charAt(0) + partes[partes.length - 1].charAt(0);
    }

    function mascararTelefone(valor) {
        const n = String(valor).replace(/\D/g, "").slice(0, 11);

        if (n.length === 0) {
            return "";
        }

        if (n.length <= 2) {
            return "(" + n;
        }

        if (n.length <= 6) {
            return "(" + n.slice(0, 2) + ") " + n.slice(2);
        }

        if (n.length <= 10) {
            return "(" + n.slice(0, 2) + ") " + n.slice(2, 6) + "-" + n.slice(6);
        }

        return "(" + n.slice(0, 2) + ") " + n.slice(2, 7) + "-" + n.slice(7);
    }

    let temporizadorAviso = null;

    function avisoRapido(mensagem) {
        const toast = $("pf-toast");

        toast.textContent = mensagem;
        toast.hidden = false;

        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(function () {
            toast.hidden = true;
        }, 3200);
    }

    function mostrarErro(id, mensagem) {
        const campo = $(id);
        const erro = $("erro-" + id);

        campo.classList.toggle("invalido", Boolean(mensagem));
        campo.setAttribute("aria-invalid", String(Boolean(mensagem)));

        if (erro) {
            erro.textContent = mensagem || "";
        }
    }

    function mostrarAviso(id, mensagem) {
        const aviso = $(id);

        aviso.textContent = mensagem || "";
        aviso.hidden = !mensagem;
    }

    function senhaForte(senha) {
        return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
    }

    /* ==========================================
       MODAL DE CONFIRMAÇÃO
    ========================================== */

    const modal = $("pf-modal");
    let aoConfirmar = null;
    let focoAnterior = null;

    function abrirModal(opcoes) {
        focoAnterior = document.activeElement;
        aoConfirmar = opcoes.aoConfirmar;

        $("pf-modal-titulo").textContent = opcoes.titulo;
        $("pf-modal-texto").textContent = opcoes.texto;

        const botao = $("pf-modal-confirmar");
        botao.textContent = opcoes.botao || "Confirmar";
        botao.classList.toggle("perigo", Boolean(opcoes.perigo));
        botao.disabled = false;

        $("pf-modal-campo").hidden = !opcoes.pedirSenha;
        $("pf-modal-senha").value = "";
        $("pf-modal-erro").textContent = "";
        $("pf-modal-senha").classList.remove("invalido");

        modal.hidden = false;
        document.body.style.overflow = "hidden";

        (opcoes.pedirSenha ? $("pf-modal-senha") : $("pf-modal-voltar")).focus();
    }

    function fecharModal() {
        modal.hidden = true;
        document.body.style.overflow = "";
        aoConfirmar = null;

        if (focoAnterior && document.contains(focoAnterior)) {
            focoAnterior.focus();
        }
    }

    $("pf-modal-voltar").addEventListener("click", fecharModal);

    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && !modal.hidden) {
            fecharModal();
        }
    });

    $("pf-modal-senha").addEventListener("input", function () {
        $("pf-modal-erro").textContent = "";
        $("pf-modal-senha").classList.remove("invalido");
    });

    $("pf-modal-senha").addEventListener("keydown", function (evento) {
        if (evento.key === "Enter") {
            evento.preventDefault();
            $("pf-modal-confirmar").click();
        }
    });

    $("pf-modal-confirmar").addEventListener("click", function () {
        if (aoConfirmar) {
            aoConfirmar();
        }
    });

    /* ==========================================
       TOPO E NÚMEROS
    ========================================== */

    function primeiroNome() {
        return String(usuario.nome || "").trim().split(/\s+/)[0] || "você";
    }

    function preencherTopo() {
        $("pf-avatar").textContent = iniciais(usuario.nome);

        const titulo = $("pf-nome-topo");
        titulo.textContent = "";
        titulo.append("Olá, ", criar("span", "", primeiroNome()), "!");

        $("pf-email-topo").textContent = usuario.email;

        if (usuario.criadoEm) {
            const d = new Date(usuario.criadoEm);

            if (!isNaN(d.getTime())) {
                $("pf-desde").textContent =
                    "Membro desde " + MESES[d.getMonth()] + " de " + d.getFullYear();
            }
        }
    }

    function atualizarNumeros(reservas) {
        const validas = reservas.filter(function (r) {
            return !r.cancelada;
        });

        let itens = 0;
        let total = 0;

        validas.forEach(function (r) {
            itens += r.itens.length;
            total += Number(r.total) || 0;
        });

        $("pf-n-reservas").textContent = validas.length;
        $("pf-n-itens").textContent = itens;
        $("pf-n-total").textContent = formatarMoeda(total);
    }

    /* ==========================================
       INFORMAÇÕES GERAIS (visualizar / editar)
    ========================================== */

    const campos = {
        nome: $("nome"),
        email: $("email"),
        telefone: $("telefone"),
        cidade: $("cidade")
    };

    function preencherCampos() {
        campos.nome.value = usuario.nome || "";
        campos.email.value = usuario.email || "";
        campos.telefone.value = usuario.telefone || "";
        campos.cidade.value = usuario.cidade || "";
    }

    function modoEdicao(ativo) {
        campos.nome.disabled = !ativo;
        campos.telefone.disabled = !ativo;
        campos.cidade.disabled = !ativo;

        $("pf-acoes-dados").hidden = !ativo;
        $("pf-editar").hidden = ativo;

        mostrarErro("nome", "");
        mostrarErro("telefone", "");

        if (ativo) {
            mostrarAviso("pf-aviso-dados", "");
            campos.nome.focus();
        } else {
            preencherCampos();
        }
    }

    $("pf-editar").addEventListener("click", function () {
        modoEdicao(true);
    });

    $("pf-cancelar-edicao").addEventListener("click", function () {
        modoEdicao(false);
        $("pf-editar").focus();
    });

    campos.telefone.addEventListener("input", function () {
        campos.telefone.value = mascararTelefone(campos.telefone.value);
        mostrarErro("telefone", "");
    });

    campos.nome.addEventListener("input", function () {
        mostrarErro("nome", "");
    });

    $("form-dados").addEventListener("submit", function (evento) {
        evento.preventDefault();

        const nome = campos.nome.value.trim().replace(/\s+/g, " ");
        const telefone = campos.telefone.value.trim();
        const digitos = telefone.replace(/\D/g, "");
        let primeiroInvalido = null;

        if (nome.length < 5 || nome.split(" ").length < 2) {
            mostrarErro("nome", "Informe seu nome completo.");
            primeiroInvalido = campos.nome;
        } else {
            mostrarErro("nome", "");
        }

        if (digitos && digitos.length < 10) {
            mostrarErro("telefone", "Informe um telefone com DDD.");
            primeiroInvalido = primeiroInvalido || campos.telefone;
        } else {
            mostrarErro("telefone", "");
        }

        if (primeiroInvalido) {
            primeiroInvalido.focus();
            return;
        }

        const novos = {
            nome: nome,
            telefone: telefone,
            cidade: campos.cidade.value.trim()
        };

        if (!Auth.atualizarUsuario(usuario.email, novos)) {
            mostrarAviso("pf-aviso-dados", "");
            avisoRapido("Não foi possível salvar. Verifique o armazenamento do navegador.");
            return;
        }

        Auth.atualizarSessao({ nome: nome });
        usuario = Auth.buscarUsuario(usuario.email);

        // Mantém a saudação da navbar em dia.
        const saudacao = document.querySelector(".acoes a[href='perfil.html']");

        if (saudacao) {
            saudacao.textContent = "Olá, " + primeiroNome();
        }

        preencherTopo();
        modoEdicao(false);
        $("pf-editar").focus();
        avisoRapido("Dados atualizados com sucesso!");
    });

    /* ==========================================
       ALTERAR SENHA
    ========================================== */

    const formSenha = $("form-senha");

    function abrirSenha(abrir) {
        formSenha.hidden = !abrir;
        $("pf-texto-senha").hidden = abrir;
        $("pf-abrir-senha").hidden = abrir;
        $("pf-abrir-senha").setAttribute("aria-expanded", String(abrir));

        ["senha-atual", "senha-nova", "senha-confirmar"].forEach(function (id) {
            $(id).value = "";
            mostrarErro(id, "");
        });

        if (abrir) {
            mostrarAviso("pf-aviso-senha", "");
            $("senha-atual").focus();
        }
    }

    $("pf-abrir-senha").addEventListener("click", function () {
        abrirSenha(true);
    });

    $("pf-cancelar-senha").addEventListener("click", function () {
        abrirSenha(false);
        $("pf-abrir-senha").focus();
    });

    ["senha-atual", "senha-nova", "senha-confirmar"].forEach(function (id) {
        $(id).addEventListener("input", function () {
            mostrarErro(id, "");
        });
    });

    formSenha.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const atual = $("senha-atual").value;
        const nova = $("senha-nova").value;
        const confirmar = $("senha-confirmar").value;
        let primeiroInvalido = null;

        if (!atual) {
            mostrarErro("senha-atual", "Informe sua senha atual.");
            primeiroInvalido = $("senha-atual");
        }

        if (!senhaForte(nova)) {
            mostrarErro("senha-nova", "A senha deve ter 8 caracteres ou mais, com letras e números.");
            primeiroInvalido = primeiroInvalido || $("senha-nova");
        } else if (nova === atual) {
            mostrarErro("senha-nova", "A nova senha precisa ser diferente da atual.");
            primeiroInvalido = primeiroInvalido || $("senha-nova");
        }

        if (nova !== confirmar || !confirmar) {
            mostrarErro("senha-confirmar", "As senhas não são iguais.");
            primeiroInvalido = primeiroInvalido || $("senha-confirmar");
        }

        if (primeiroInvalido) {
            primeiroInvalido.focus();
            return;
        }

        Auth.hashSenha(atual, usuario.email).then(function (hashAtual) {
            if (hashAtual !== usuario.senha) {
                mostrarErro("senha-atual", "Senha atual incorreta.");
                $("senha-atual").focus();
                return null;
            }

            return Auth.hashSenha(nova, usuario.email).then(function (hashNovo) {
                if (!Auth.atualizarUsuario(usuario.email, { senha: hashNovo })) {
                    avisoRapido("Não foi possível salvar. Verifique o armazenamento do navegador.");
                    return;
                }

                usuario = Auth.buscarUsuario(usuario.email);
                abrirSenha(false);
                mostrarAviso("pf-aviso-senha", "Senha atualizada com sucesso!");
                avisoRapido("Senha atualizada!");
            });
        });
    });

    /* ==========================================
       SAIR E EXCLUIR CONTA
    ========================================== */

    $("pf-sair").addEventListener("click", function () {
        Auth.sair();
        window.location.href = "login.html";
    });

    $("pf-excluir").addEventListener("click", function () {
        abrirModal({
            titulo: "Excluir minha conta?",
            texto: "Sua conta e todo o histórico de reservas serão apagados deste navegador. " +
                   "Essa ação não pode ser desfeita.",
            botao: "Excluir conta",
            perigo: true,
            pedirSenha: true,
            aoConfirmar: function () {
                const senha = $("pf-modal-senha").value;

                if (!senha) {
                    $("pf-modal-erro").textContent = "Informe sua senha.";
                    $("pf-modal-senha").classList.add("invalido");
                    $("pf-modal-senha").focus();
                    return;
                }

                $("pf-modal-confirmar").disabled = true;

                Auth.hashSenha(senha, usuario.email).then(function (hash) {
                    if (hash !== usuario.senha) {
                        $("pf-modal-confirmar").disabled = false;
                        $("pf-modal-erro").textContent = "Senha incorreta.";
                        $("pf-modal-senha").classList.add("invalido");
                        $("pf-modal-senha").focus();
                        return;
                    }

                    Auth.excluirReservas(usuario.email);
                    Auth.excluirUsuario(usuario.email);
                    Auth.sair();
                    window.location.href = "index.html";
                });
            }
        });
    });

    /* ==========================================
       HISTÓRICO DE RESERVAS
    ========================================== */

    let filtroAtual = "todas";

    // Reservas válidas, da mais recente para a mais antiga.
    function carregarReservas() {
        return Auth.reservasDe(usuario.email)
            .filter(function (r) {
                return r && r.codigo && Array.isArray(r.itens) && r.retirada && r.devolucao;
            })
            .sort(function (a, b) {
                return String(b.criadoEm || b.retirada).localeCompare(
                    String(a.criadoEm || a.retirada)
                );
            });
    }

    function statusDe(reserva) {
        if (reserva.cancelada) {
            return "cancelada";
        }

        const hoje = hojeISO();

        if (hoje < reserva.retirada) {
            return "agendada";
        }

        return hoje <= reserva.devolucao ? "andamento" : "concluida";
    }

    function blocoData(rotulo, valor) {
        const bloco = criar("div", "pf-data");
        bloco.append(criar("span", "", rotulo), criar("span", "", valor));
        return bloco;
    }

    function blocoDetalhe(rotulo, valor) {
        const bloco = document.createElement("div");
        bloco.append(criar("span", "", rotulo), criar("strong", "", valor));
        return bloco;
    }

    function criarReserva(reserva) {
        const status = statusDe(reserva);
        const li = criar("li", "pf-reserva " + status);

        // Topo: código e status
        const topo = criar("div", "pf-reserva-topo");
        const codigo = criar("div", "pf-reserva-codigo");
        codigo.append(
            criar("span", "", "Código da reserva"),
            criar("strong", "", reserva.codigo)
        );
        topo.append(codigo, criar("span", "pf-status " + status, STATUS[status]));

        // Produtos
        const corpo = criar("div", "pf-reserva-corpo");

        reserva.itens.forEach(function (item) {
            const info = PRODUTOS[item.id] || { imagem: "", descricao: "" };
            const linha = criar("div", "pf-item");
            const produto = criar("div", "pf-item-produto");
            const textos = document.createElement("div");

            if (info.imagem) {
                const img = document.createElement("img");
                img.src = info.imagem;
                img.alt = item.nome;
                produto.append(img);
            }

            textos.append(criar("strong", "", item.nome));

            if (info.descricao) {
                textos.append(criar("span", "", info.descricao));
            }

            produto.append(textos);
            linha.append(produto, criar("span", "pf-item-preco", formatarMoeda(item.total)));
            corpo.append(linha);
        });

        // Datas
        const datas = criar("div", "pf-reserva-datas");
        datas.append(
            blocoData("Retirada", dataCurta(reserva.retirada)),
            blocoData("Devolução", dataCurta(reserva.devolucao)),
            blocoData("Duração", textoDias(Number(reserva.dias) || 1))
        );

        // Detalhes (abrem ao clicar)
        const detalhes = criar("div", "pf-detalhes");
        detalhes.hidden = true;
        detalhes.id = "detalhes-" + reserva.codigo;
        detalhes.append(
            blocoDetalhe("Local de retirada", reserva.unidadeRetirada || "—"),
            blocoDetalhe("Local de devolução", reserva.unidadeDevolucao || "—"),
            blocoDetalhe("Forma de pagamento", METODOS[reserva.metodo] || "—"),
            blocoDetalhe("Reservado em", reserva.criadoEm
                ? new Date(reserva.criadoEm).toLocaleDateString("pt-BR")
                : "—")
        );

        if (reserva.cancelada && reserva.canceladaEm) {
            detalhes.append(blocoDetalhe(
                "Cancelada em",
                new Date(reserva.canceladaEm).toLocaleDateString("pt-BR")
            ));
        }

        // Rodapé: total e ações
        const rodape = criar("div", "pf-reserva-rodape");
        const total = criar("div", "pf-reserva-total");
        total.append(
            criar("span", "", reserva.cancelada ? "Total" : "Total pago"),
            criar("strong", "", formatarMoeda(reserva.total))
        );

        const botoes = criar("div", "pf-reserva-botoes");

        const verDetalhes = criar("button", "pf-detalhes-botao", "Ver detalhes");
        verDetalhes.type = "button";
        verDetalhes.setAttribute("aria-expanded", "false");
        verDetalhes.setAttribute("aria-controls", detalhes.id);
        verDetalhes.addEventListener("click", function () {
            const abrir = detalhes.hidden;

            detalhes.hidden = !abrir;
            verDetalhes.textContent = abrir ? "Ocultar detalhes" : "Ver detalhes";
            verDetalhes.setAttribute("aria-expanded", String(abrir));
        });
        botoes.append(verDetalhes);

        if (status === "agendada") {
            const cancelar = criar("button", "pf-detalhes-botao perigo", "Cancelar reserva");
            cancelar.type = "button";
            cancelar.addEventListener("click", function () {
                pedirCancelamento(reserva);
            });
            botoes.append(cancelar);
        }

        rodape.append(total, botoes);
        li.append(topo, corpo, datas, detalhes, rodape);

        return li;
    }

    function pedirCancelamento(reserva) {
        abrirModal({
            titulo: "Cancelar esta reserva?",
            texto: "A reserva " + reserva.codigo + " será cancelada e os equipamentos " +
                   "voltarão a ficar disponíveis. Confira a política de locação para " +
                   "saber sobre reembolso.",
            botao: "Cancelar reserva",
            perigo: true,
            aoConfirmar: function () {
                Auth.atualizarReserva(usuario.email, reserva.codigo, {
                    cancelada: true,
                    canceladaEm: new Date().toISOString()
                });

                fecharModal();
                renderizarHistorico();
    renderizarFavoritos();
                avisoRapido("Reserva cancelada.");
            }
        });
    }

    function renderizarHistorico() {
        const reservas = carregarReservas();
        const lista = $("pf-reservas");

        // Contagem de cada filtro
        const contagem = { todas: reservas.length, agendada: 0, andamento: 0, concluida: 0, cancelada: 0 };

        reservas.forEach(function (r) {
            contagem[statusDe(r)] += 1;
        });

        document.querySelectorAll(".pf-filtro").forEach(function (botao) {
            botao.querySelector("span").textContent = contagem[botao.dataset.filtro];
        });

        atualizarNumeros(reservas);

        const visiveis = reservas.filter(function (r) {
            return filtroAtual === "todas" || statusDe(r) === filtroAtual;
        });

        lista.textContent = "";
        visiveis.forEach(function (r) {
            lista.append(criarReserva(r));
        });

        // Estado vazio: sem nenhuma reserva ou sem resultado no filtro
        const vazio = visiveis.length === 0;
        $("pf-vazio").hidden = !vazio;
        $("pf-filtros").hidden = reservas.length === 0;

        if (vazio) {
            const semNenhuma = reservas.length === 0;

            $("pf-vazio-titulo").textContent = semNenhuma
                ? "Você ainda não fez nenhuma reserva"
                : "Nenhuma reserva nesta categoria";
            $("pf-vazio-texto").textContent = semNenhuma
                ? "Escolha seus equipamentos e comece a se movimentar. Suas reservas aparecem aqui."
                : "Troque o filtro para ver suas outras reservas.";
            $("pf-vazio-botao").hidden = !semNenhuma;
        }
    }

    document.querySelectorAll(".pf-filtro").forEach(function (botao) {
        botao.addEventListener("click", function () {
            filtroAtual = botao.dataset.filtro;

            document.querySelectorAll(".pf-filtro").forEach(function (outro) {
                const ativo = outro === botao;
                outro.classList.toggle("ativo", ativo);
                outro.setAttribute("aria-selected", String(ativo));
            });

            renderizarHistorico();
    renderizarFavoritos();
        });
    });

    /* ==========================================
       FAVORITOS
    ========================================== */

    const INFO_FAVORITOS = {
        raquete:      { nome: "Raquete de Beach Tennis", preco: 45, imagem: "raquete.png" },
        bicicleta:    { nome: "Bicicleta MTB",           preco: 75, imagem: "bicicleta.png" },
        sup:          { nome: "Stand Up Paddle",         preco: 90, imagem: "stand-up-paddle.png" },
        patins:       { nome: "Patins Inline",           preco: 40, imagem: "patins.png" },
        caiaque:      { nome: "Caiaque Sit-on-Top",      preco: 80, imagem: "caiaque.png" },
        bola:         { nome: "Bola de Futebol",         preco: 15, imagem: "bola.png" },
        barraca:      { nome: "Barraca de Camping",      preco: 40, imagem: "barraca.png" },
        badminton:    { nome: "Kit de Badminton",        preco: 45, imagem: "kit-badminton.png" },
        prancha:      { nome: "Prancha de Surf",         preco: 85, imagem: "prancha-de-surf.png" },
        "roupa-surf": { nome: "Roupa de Surf",           preco: 35, imagem: "roupa-de-surf.png" },
        natacao:      { nome: "Kit de Natação",          preco: 30, imagem: "kit-natacao.png" },
        seguranca:    { nome: "Kit de Segurança",        preco: 25, imagem: "kit-seguranca.png" },
        "rede-volei": { nome: "Rede de Vôlei",           preco: 50, imagem: "rede-volei.png" },
        pingpong:     { nome: "Mesa de Ping-Pong",       preco: 70, imagem: "mesa-de-pingpong.png" },
        pickleball:   { nome: "Kit de Pickleball",       preco: 50, imagem: "kit-pickleball.png" },
        slackline:    { nome: "Kit de Slackline",        preco: 40, imagem: "kit-slackline.png" }
    };

    function renderizarFavoritos() {
        const Extras = window.FluxoExtras;
        const lista = $("pf-fav-lista");

        const ids = (Extras ? Extras.favoritos.lista() : []).filter(function (id) {
            return INFO_FAVORITOS[id];
        });

        $("pf-n-favoritos").textContent = ids.length;
        $("pf-fav-vazio").hidden = ids.length > 0;
        $("pf-fav-todos").hidden = ids.length === 0;
        lista.hidden = ids.length === 0;
        lista.textContent = "";

        ids.forEach(function (id) {
            const info = INFO_FAVORITOS[id];
            const url = "produto.html?item=" + encodeURIComponent(id);

            const item = document.createElement("li");
            item.className = "pf-fav-item";

            const foto = document.createElement("a");
            foto.className = "pf-fav-foto";
            foto.href = url;
            foto.setAttribute("aria-label", "Ver detalhes: " + info.nome);

            const img = document.createElement("img");
            img.src = info.imagem;
            img.alt = info.nome;
            img.loading = "lazy";
            foto.append(img);

            const texto = document.createElement("div");
            texto.className = "pf-fav-info";

            const nome = document.createElement("a");
            nome.className = "pf-fav-nome";
            nome.href = url;
            nome.textContent = info.nome;

            const preco = document.createElement("span");
            preco.className = "pf-fav-preco";
            preco.textContent = "R$ " + info.preco.toFixed(2).replace(".", ",") + " /dia";

            texto.append(nome, preco);

            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "fav-btn";
            remover.setAttribute("aria-pressed", "true");
            remover.setAttribute("aria-label", "Remover dos favoritos: " + info.nome);
            remover.title = "Remover dos favoritos";
            remover.innerHTML = Extras.iconeCoracao;
            remover.addEventListener("click", function () {
                Extras.favoritos.alternar(id);
                avisoRapido("Removido dos favoritos.");
            });

            item.append(foto, texto, remover);
            lista.append(item);
        });
    }

    // Atualiza quando um favorito muda (nesta ou em outra aba).
    document.addEventListener("fluxo:favoritos", renderizarFavoritos);
    window.addEventListener("storage", renderizarFavoritos);

    /* ==========================================
       INÍCIO
    ========================================== */

    preencherTopo();
    preencherCampos();
    renderizarHistorico();
    renderizarFavoritos();
});