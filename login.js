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

    $("form-recuperar").addEventListener("submit", function (evento) {
        evento.preventDefault();

        const email = $("email-recuperar").value;

        if (!Auth.emailValido(email)) {
            mostrarErro("email-recuperar", "Informe um e-mail válido.");
            $("email-recuperar").focus();
            return;
        }

        mostrarErro("email-recuperar", "");

        // Sem servidor não há envio real de e-mail. A resposta é a mesma
        // exista a conta ou não, para não revelar quem está cadastrado.
        $("aviso-recuperar").textContent =
            "Se este e-mail estiver cadastrado, você receberá as instruções " +
            "para criar uma nova senha em instantes.";
        $("aviso-recuperar").hidden = false;
    });
});