/* ==========================================
   FLUXO - AUTENTICAÇÃO (compartilhado)

   Como o site ainda não tem servidor, as contas
   ficam salvas no navegador (localStorage).
   Quando houver um back-end, só as funções
   deste arquivo precisam ser trocadas.
========================================== */

(function () {

    const CHAVE_USUARIOS = "fluxoUsuarios";
    const CHAVE_SESSAO = "fluxoSessao";

    /* ---------- armazenamento seguro ---------- */

    function ler(armazenamento, chave) {
        try {
            return armazenamento.getItem(chave);
        } catch (e) {
            return null;
        }
    }

    function gravar(armazenamento, chave, valor) {
        try {
            armazenamento.setItem(chave, valor);
            return true;
        } catch (e) {
            return false;
        }
    }

    function remover(armazenamento, chave) {
        try {
            armazenamento.removeItem(chave);
        } catch (e) {
            // sem problemas
        }
    }

    /* ---------- usuários ---------- */

    function usuarios() {
        const bruto = ler(localStorage, CHAVE_USUARIOS);

        if (!bruto) {
            return [];
        }

        try {
            const lista = JSON.parse(bruto);
            return Array.isArray(lista) ? lista : [];
        } catch (e) {
            return [];
        }
    }

    function normalizarEmail(email) {
        return String(email).trim().toLowerCase();
    }

    function buscarUsuario(email) {
        const alvo = normalizarEmail(email);

        return usuarios().find(function (u) {
            return u.email === alvo;
        }) || null;
    }

    function salvarUsuario(usuario) {
        const lista = usuarios();
        lista.push(usuario);
        return gravar(localStorage, CHAVE_USUARIOS, JSON.stringify(lista));
    }

    /* ---------- senha (nunca é salva em texto puro) ---------- */

    function hashSimples(texto) {
        // Plano B para navegadores sem crypto.subtle.
        let h1 = 0xdeadbeef;
        let h2 = 0x41c6ce57;

        for (let i = 0; i < texto.length; i++) {
            const c = texto.charCodeAt(i);
            h1 = Math.imul(h1 ^ c, 2654435761);
            h2 = Math.imul(h2 ^ c, 1597334677);
        }

        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
             Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
             Math.imul(h1 ^ (h1 >>> 13), 3266489909);

        return "s-" + (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
    }

    function hashSenha(senha, email) {
        const texto = "fluxo:" + normalizarEmail(email) + ":" + senha;

        if (window.crypto && window.crypto.subtle && window.TextEncoder) {
            return window.crypto.subtle
                .digest("SHA-256", new TextEncoder().encode(texto))
                .then(function (buffer) {
                    return "h-" + Array.from(new Uint8Array(buffer))
                        .map(function (b) {
                            return b.toString(16).padStart(2, "0");
                        })
                        .join("");
                })
                .catch(function () {
                    return hashSimples(texto);
                });
        }

        return Promise.resolve(hashSimples(texto));
    }

    /* ---------- sessão ---------- */

    function sessaoAtual() {
        const bruto = ler(sessionStorage, CHAVE_SESSAO) ||
                      ler(localStorage, CHAVE_SESSAO);

        if (!bruto) {
            return null;
        }

        try {
            const s = JSON.parse(bruto);
            return s && s.email ? s : null;
        } catch (e) {
            return null;
        }
    }

    function entrar(usuario, lembrar) {
        const dados = JSON.stringify({
            nome: usuario.nome,
            email: usuario.email
        });

        sair();

        // "Lembrar-me" mantém o login mesmo depois de fechar o navegador.
        return gravar(lembrar ? localStorage : sessionStorage, CHAVE_SESSAO, dados);
    }

    function sair() {
        remover(sessionStorage, CHAVE_SESSAO);
        remover(localStorage, CHAVE_SESSAO);
    }

    /* ---------- utilidades ---------- */

    function emailValido(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
    }

    // Só aceita voltar para páginas do próprio site (ex.: "reserva.html").
    function destinoSeguro(valor) {
        return /^[a-z0-9\-_]+\.html$/i.test(valor || "") ? valor : "index.html";
    }

    /* ---------- navbar: mostra o nome da pessoa e "Sair" ---------- */

    function atualizarNavbar() {
        const sessao = sessaoAtual();
        const acoes = document.querySelector(".acoes");

        if (!sessao || !acoes) {
            return;
        }

        const primeiroNome = String(sessao.nome || "").trim().split(/\s+/)[0] || "você";

        acoes.textContent = "";

        const saudacao = document.createElement("span");
        saudacao.textContent = "Olá, " + primeiroNome;
        saudacao.style.cssText =
            "color:#004aad;font-size:13px;font-weight:700;white-space:nowrap;";

        const botaoSair = document.createElement("a");
        botaoSair.href = "login.html";
        botaoSair.className = "botao";
        botaoSair.textContent = "Sair";
        botaoSair.addEventListener("click", function () {
            sair();
        });

        acoes.append(saudacao, botaoSair);
    }

    document.addEventListener("DOMContentLoaded", atualizarNavbar);

    window.FluxoAuth = {
        buscarUsuario: buscarUsuario,
        salvarUsuario: salvarUsuario,
        hashSenha: hashSenha,
        sessaoAtual: sessaoAtual,
        entrar: entrar,
        sair: sair,
        emailValido: emailValido,
        normalizarEmail: normalizarEmail,
        destinoSeguro: destinoSeguro,
        ler: ler,
        gravar: gravar,
        remover: remover
    };

})();