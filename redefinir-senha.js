document.addEventListener("DOMContentLoaded", function () {

    const Auth = window.FluxoAuth;
    const $ = function (id) {
        return document.getElementById(id);
    };

    const codigo = new URLSearchParams(window.location.search).get("codigo");

    function mostrarErro(id, mensagem) {
        const campo = $(id);
        const erro = $("erro-" + id);

        campo.classList.toggle("invalido", Boolean(mensagem));
        campo.setAttribute("aria-invalid", String(Boolean(mensagem)));
        erro.textContent = mensagem || "";
    }

    function senhaForte(senha) {
        return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
    }

    /* ---------- confere o link ---------- */

    Auth.validarRecuperacao(codigo).then(function (email) {
        if (!email || !Auth.buscarUsuario(email)) {
            $("redefinir-invalido").hidden = false;
            return;
        }

        $("redefinir-email").textContent = email;
        $("redefinir-form-area").hidden = false;
        $("senha").focus();
    });

    /* ---------- nova senha ---------- */

    [ "senha", "confirmar" ].forEach(function (id) {
        $(id).addEventListener("input", function () {
            mostrarErro(id, "");
            $("aviso-erro").hidden = true;
        });
    });

    $("form-redefinir").addEventListener("submit", function (evento) {
        evento.preventDefault();

        const senha = $("senha").value;
        const confirmar = $("confirmar").value;
        let primeiroInvalido = null;

        if (!senhaForte(senha)) {
            mostrarErro("senha", "A senha deve ter 8 caracteres ou mais, com letras e números.");
            primeiroInvalido = $("senha");
        } else {
            mostrarErro("senha", "");
        }

        if (!confirmar || confirmar !== senha) {
            mostrarErro("confirmar", "As senhas não são iguais.");
            primeiroInvalido = primeiroInvalido || $("confirmar");
        } else {
            mostrarErro("confirmar", "");
        }

        if (primeiroInvalido) {
            primeiroInvalido.focus();
            return;
        }

        const botao = $("botao-redefinir");
        botao.disabled = true;
        botao.textContent = "Salvando...";

        const email = $("redefinir-email").textContent;

        Auth.redefinirSenha(codigo, senha).then(function (ok) {
            if (!ok) {
                botao.disabled = false;
                botao.textContent = "Redefinir senha";

                // O link venceu enquanto a página estava aberta.
                $("redefinir-form-area").hidden = true;
                $("redefinir-invalido").hidden = false;
                return;
            }

            // Garante que ninguém continue logado com a senha antiga.
            Auth.sair();
            Auth.gravar(sessionStorage, "fluxoSenhaRedefinida", email);
            window.location.href = "login.html";
        });
    });
});