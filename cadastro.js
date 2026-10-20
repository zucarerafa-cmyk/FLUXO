document.addEventListener("DOMContentLoaded", function () {

    const Auth = window.FluxoAuth;
    const $ = function (id) {
        return document.getElementById(id);
    };

    // Quem já está logado não precisa criar outra conta.
    if (Auth.sessaoAtual()) {
        window.location.replace("index.html");
        return;
    }

    /* ---------- validação ---------- */

    function mostrarErro(id, mensagem) {
        const campo = $(id);
        const erro = $("erro-" + id);

        if (campo.type !== "checkbox") {
            campo.classList.toggle("invalido", Boolean(mensagem));
        }

        campo.setAttribute("aria-invalid", String(Boolean(mensagem)));
        erro.textContent = mensagem || "";
    }

    function senhaForte(senha) {
        return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
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
            id: "email",
            msg: "Informe um e-mail válido.",
            ok: function (v) {
                return Auth.emailValido(v);
            }
        },
        {
            id: "senha",
            msg: "A senha deve ter 8 caracteres ou mais, com letras e números.",
            ok: senhaForte
        },
        {
            id: "confirmar",
            msg: "As senhas não são iguais.",
            ok: function (v) {
                return v === $("senha").value && v.length > 0;
            }
        }
    ];

    // Limpa o aviso de cada campo assim que a pessoa volta a digitar.
    REGRAS.forEach(function (regra) {
        $(regra.id).addEventListener("input", function () {
            mostrarErro(regra.id, "");
            $("aviso-erro").hidden = true;
        });
    });

    $("termos").addEventListener("change", function () {
        mostrarErro("termos", "");
    });

    /* ---------- envio ---------- */

    $("form-cadastro").addEventListener("submit", function (evento) {
        evento.preventDefault();

        let primeiroInvalido = null;

        $("aviso-erro").hidden = true;

        REGRAS.forEach(function (regra) {
            const valor = $(regra.id).value;

            if (regra.ok(valor)) {
                mostrarErro(regra.id, "");
            } else {
                mostrarErro(regra.id, regra.msg);
                primeiroInvalido = primeiroInvalido || $(regra.id);
            }
        });

        if (!$("termos").checked) {
            mostrarErro("termos", "Para continuar, aceite os termos de uso e a política de privacidade.");
            primeiroInvalido = primeiroInvalido || $("termos");
        }

        // E-mail repetido só é conferido se o e-mail em si estiver certo.
        if (!primeiroInvalido && Auth.buscarUsuario($("email").value)) {
            mostrarErro("email", "Este e-mail já está cadastrado. Tente entrar na sua conta.");
            primeiroInvalido = $("email");
        }

        if (primeiroInvalido) {
            primeiroInvalido.focus();
            return;
        }

        const botao = $("botao-criar");
        botao.disabled = true;
        botao.textContent = "Criando...";

        const email = Auth.normalizarEmail($("email").value);

        Auth.hashSenha($("senha").value, email).then(function (hash) {
            const salvo = Auth.salvarUsuario({
                nome: $("nome").value.trim().replace(/\s+/g, " "),
                email: email,
                senha: hash,
                criadoEm: new Date().toISOString()
            });

            if (!salvo) {
                botao.disabled = false;
                botao.textContent = "Criar";
                $("aviso-erro").textContent =
                    "Não foi possível salvar sua conta. Verifique se o navegador permite armazenamento.";
                $("aviso-erro").hidden = false;
                return;
            }

            // A tela de login mostra o aviso de sucesso e já preenche o e-mail.
            Auth.gravar(sessionStorage, "fluxoContaCriada", email);
            window.location.href = "login.html";
        });
    });
});