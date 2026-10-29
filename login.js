document.addEventListener("DOMContentLoaded", function () {

    const Auth = window.FluxoAuth;
    const $ = function (id) {
        return document.getElementById(id);
    };

    const params = new URLSearchParams(window.location.search);
    const destino = Auth.destinoSeguro(params.get("redirect"));

    // Quem já está logado não precisa ver a tela de login.
    if (Auth.sessaoAtual()) {
        window.location.replace(destino);
        return;
    }

    /* ---------- aviso depois de criar a conta ---------- */

    const contaCriada = Auth.ler(sessionStorage, "fluxoContaCriada");

    if (contaCriada) {
        Auth.remover(sessionStorage, "fluxoContaCriada");
        $("aviso-sucesso").textContent =
            "Conta criada com sucesso! Entre com seu e-mail e senha.";
        $("aviso-sucesso").hidden = false;
        $("email").value = contaCriada;
        $("senha").focus();
    }

    /* ---------- aviso depois de redefinir a senha ---------- */

    const senhaRedefinida = Auth.ler(sessionStorage, "fluxoSenhaRedefinida");

    if (senhaRedefinida) {
        Auth.remover(sessionStorage, "fluxoSenhaRedefinida");
        $("aviso-sucesso").textContent =
            "Senha redefinida com sucesso! Entre com a sua nova senha.";
        $("aviso-sucesso").hidden = false;
        $("email").value = senhaRedefinida;
        $("senha").focus();
    }

    /* ---------- validação ---------- */

    function mostrarErro(id, mensagem) {
        const campo = $(id);
        const erro = $("erro-" + id);

        campo.classList.toggle("invalido", Boolean(mensagem));
        campo.setAttribute("aria-invalid", String(Boolean(mensagem)));
        erro.textContent = mensagem || "";
    }

    ["email", "senha", "email-recuperar"].forEach(function (id) {
        $(id).addEventListener("input", function () {
            mostrarErro(id, "");
            $("aviso-erro").hidden = true;
        });
    });

    /* ---------- login ---------- */

    $("form-login").addEventListener("submit", function (evento) {
        evento.preventDefault();

        const email = $("email").value;
        const senha = $("senha").value;
        let primeiroInvalido = null;

        $("aviso-erro").hidden = true;
        $("aviso-sucesso").hidden = true;

        if (!Auth.emailValido(email)) {
            mostrarErro("email", "Informe um e-mail válido.");
            primeiroInvalido = $("email");
        } else {
            mostrarErro("email", "");
        }

        if (!senha) {
            mostrarErro("senha", "Informe sua senha.");
            primeiroInvalido = primeiroInvalido || $("senha");
        } else {
            mostrarErro("senha", "");
        }

        if (primeiroInvalido) {
            primeiroInvalido.focus();
            return;
        }

        const botao = $("botao-entrar");
        botao.disabled = true;
        botao.textContent = "Entrando...";

        const usuario = Auth.buscarUsuario(email);

        Auth.hashSenha(senha, email).then(function (hash) {
            if (!usuario || usuario.senha !== hash) {
                botao.disabled = false;
                botao.textContent = "Entrar";
                $("aviso-erro").textContent = "E-mail ou senha incorretos.";
                $("aviso-erro").hidden = false;
                $("senha").value = "";
                $("senha").focus();
                return;
            }

            Auth.entrar(usuario, $("lembrar").checked);
            window.location.href = destino;
        });
    });

    /* ---------- esqueci minha senha ---------- */

    const modal = $("modal-recuperar");

    function abrirModal() {
        $("aviso-recuperar").hidden = true;
        mostrarErro("email-recuperar", "");
        $("email-recuperar").value = $("email").value;
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        $("email-recuperar").focus();
    }

    function fecharModal() {
        modal.hidden = true;
        document.body.style.overflow = "";
        $("abrir-recuperar").focus();
    }

    $("abrir-recuperar").addEventListener("click", abrirModal);
    $("fechar-recuperar").addEventListener("click", fecharModal);

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

    const TEXTO_ENVIADO =
        "Se este e-mail estiver cadastrado, enviamos um link para você criar " +
        "uma nova senha. Ele vale por alguns minutos. Confira também a caixa de spam.";

    function mostrarRecuperar(tipo, mensagem) {
        $("aviso-recuperar").hidden = tipo !== "sucesso";
        $("aviso-recuperar-erro").hidden = tipo !== "erro";

        if (tipo === "sucesso") {
            $("aviso-recuperar").textContent = mensagem;
        } else if (tipo === "erro") {
            $("aviso-recuperar-erro").textContent = mensagem;
        }
    }

    function terminarEnvio(botao) {
        botao.disabled = false;
        botao.textContent = "Enviar instruções";
    }

    $("email-recuperar").addEventListener("input", function () {
        mostrarRecuperar("nenhum");
    });

    $("form-recuperar").addEventListener("submit", function (evento) {
        evento.preventDefault();

        const email = $("email-recuperar").value;
        const botao = $("botao-recuperar");

        mostrarRecuperar("nenhum");

        if (!Auth.emailValido(email)) {
            mostrarErro("email-recuperar", "Informe um e-mail válido.");
            $("email-recuperar").focus();
            return;
        }

        mostrarErro("email-recuperar", "");

        // Evita pedidos em sequência para o mesmo e-mail.
        const espera = Auth.segundosParaNovoEnvio(email);

        if (espera > 0) {
            mostrarRecuperar(
                "erro",
                "Você já pediu um e-mail há pouco. Aguarde " + espera +
                " segundos para pedir outro."
            );
            return;
        }

        botao.disabled = true;
        botao.textContent = "Enviando...";
        Auth.registrarPedido(email);

        const usuario = Auth.buscarUsuario(email);

        // A resposta é a mesma exista a conta ou não, para não revelar
        // quem está cadastrado. Só enviamos e-mail se a conta existir.
        if (!usuario) {
            setTimeout(function () {
                terminarEnvio(botao);
                mostrarRecuperar("sucesso", TEXTO_ENVIADO);
            }, 700);
            return;
        }

        Auth.criarRecuperacao(usuario.email).then(function (codigo) {
            if (!codigo) {
                throw new Error("armazenamento");
            }

            return Auth.enviarEmailRecuperacao(
                usuario,
                Auth.linkDeRecuperacao(codigo)
            );
        }).then(function () {
            terminarEnvio(botao);
            mostrarRecuperar("sucesso", TEXTO_ENVIADO);
        }).catch(function (erro) {
            terminarEnvio(botao);

            if (erro && erro.message === "nao-configurado") {
                mostrarRecuperar(
                    "erro",
                    "O envio de e-mails ainda não foi configurado neste site. " +
                    "Fale com a FLUXO pelo WhatsApp ou e-mail."
                );
            } else if (erro && erro.message === "armazenamento") {
                mostrarRecuperar(
                    "erro",
                    "Não foi possível gerar o link. Verifique se o navegador permite armazenamento."
                );
            } else {
                mostrarRecuperar(
                    "erro",
                    "Não conseguimos enviar o e-mail agora. Tente novamente em instantes."
                );
            }
        });
    });
});