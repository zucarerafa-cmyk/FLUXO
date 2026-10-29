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
    const CHAVE_RESERVAS = "fluxoReservas";
    const CHAVE_RECUPERACAO = "fluxoRecuperacao";

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

    // Atualiza só os campos informados (nome, telefone, senha etc.).
    function atualizarUsuario(email, campos) {
        const alvo = normalizarEmail(email);
        const lista = usuarios();
        const indice = lista.findIndex(function (u) {
            return u.email === alvo;
        });

        if (indice === -1) {
            return false;
        }

        lista[indice] = Object.assign({}, lista[indice], campos);
        return gravar(localStorage, CHAVE_USUARIOS, JSON.stringify(lista));
    }

    function excluirUsuario(email) {
        const alvo = normalizarEmail(email);
        const restantes = usuarios().filter(function (u) {
            return u.email !== alvo;
        });

        return gravar(localStorage, CHAVE_USUARIOS, JSON.stringify(restantes));
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

    // Mantém o nome da sessão em dia quando a pessoa edita o perfil.
    function atualizarSessao(campos) {
        [sessionStorage, localStorage].forEach(function (armazenamento) {
            const bruto = ler(armazenamento, CHAVE_SESSAO);

            if (!bruto) {
                return;
            }

            try {
                const atual = JSON.parse(bruto);
                gravar(
                    armazenamento,
                    CHAVE_SESSAO,
                    JSON.stringify(Object.assign({}, atual, campos))
                );
            } catch (e) {
                // sessão inválida: ignora
            }
        });
    }

    /* ---------- histórico de reservas (por conta) ---------- */

    function todasReservas() {
        const bruto = ler(localStorage, CHAVE_RESERVAS);

        if (!bruto) {
            return {};
        }

        try {
            const dados = JSON.parse(bruto);
            return dados && typeof dados === "object" && !Array.isArray(dados)
                ? dados
                : {};
        } catch (e) {
            return {};
        }
    }

    function reservasDe(email) {
        const lista = todasReservas()[normalizarEmail(email)];
        return Array.isArray(lista) ? lista : [];
    }

    function gravarReservas(email, lista) {
        const dados = todasReservas();
        dados[normalizarEmail(email)] = lista;
        return gravar(localStorage, CHAVE_RESERVAS, JSON.stringify(dados));
    }

    function salvarReserva(email, reserva) {
        const lista = reservasDe(email).filter(function (r) {
            return r.codigo !== reserva.codigo;
        });

        lista.push(reserva);
        return gravarReservas(email, lista);
    }

    function atualizarReserva(email, codigo, campos) {
        const lista = reservasDe(email).map(function (r) {
            return r.codigo === codigo ? Object.assign({}, r, campos) : r;
        });

        return gravarReservas(email, lista);
    }

    function excluirReservas(email) {
        const dados = todasReservas();
        delete dados[normalizarEmail(email)];
        return gravar(localStorage, CHAVE_RESERVAS, JSON.stringify(dados));
    }

    /* ---------- recuperação de senha ---------- */

    // Guarda só o "hash" do código enviado por e-mail, nunca o código em si.
    // Estrutura: { codigos: { hash: { email, expira } }, envios: { email: horario } }

    function configEmail() {
        return window.FLUXO_EMAIL || {};
    }

    function lerRecuperacao() {
        const vazio = { codigos: {}, envios: {} };
        const bruto = ler(localStorage, CHAVE_RECUPERACAO);

        if (!bruto) {
            return vazio;
        }

        try {
            const dados = JSON.parse(bruto);

            return {
                codigos: dados && dados.codigos ? dados.codigos : {},
                envios: dados && dados.envios ? dados.envios : {}
            };
        } catch (e) {
            return vazio;
        }
    }

    function gravarRecuperacao(dados) {
        const agora = Date.now();

        // Limpa o que já venceu para não acumular lixo.
        Object.keys(dados.codigos).forEach(function (hash) {
            if (dados.codigos[hash].expira < agora) {
                delete dados.codigos[hash];
            }
        });

        return gravar(localStorage, CHAVE_RECUPERACAO, JSON.stringify(dados));
    }

    function gerarCodigo() {
        const bytes = new Uint8Array(24);

        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }

        return Array.from(bytes).map(function (b) {
            return b.toString(16).padStart(2, "0");
        }).join("");
    }

    function hashCodigo(codigo) {
        return hashSenha(codigo, "recuperacao");
    }

    // Segundos que faltam para a pessoa poder pedir outro e-mail.
    // Vale para qualquer e-mail digitado, exista a conta ou não.
    function segundosParaNovoEnvio(email) {
        const intervalo = Number(configEmail().intervaloSegundos) || 60;
        const ultimo = lerRecuperacao().envios[normalizarEmail(email)] || 0;
        const falta = Math.ceil((ultimo + intervalo * 1000 - Date.now()) / 1000);

        return falta > 0 ? falta : 0;
    }

    function registrarPedido(email) {
        const dados = lerRecuperacao();
        dados.envios[normalizarEmail(email)] = Date.now();
        gravarRecuperacao(dados);
    }

    // Cria um código novo (e apaga os antigos dessa conta).
    function criarRecuperacao(email) {
        const alvo = normalizarEmail(email);
        const codigo = gerarCodigo();
        const minutos = Number(configEmail().validadeMinutos) || 30;

        return hashCodigo(codigo).then(function (hash) {
            const dados = lerRecuperacao();

            Object.keys(dados.codigos).forEach(function (h) {
                if (dados.codigos[h].email === alvo) {
                    delete dados.codigos[h];
                }
            });

            dados.codigos[hash] = {
                email: alvo,
                expira: Date.now() + minutos * 60000
            };

            return gravarRecuperacao(dados) ? codigo : null;
        });
    }

    // Devolve o e-mail da conta se o código existir e ainda estiver valendo.
    function validarRecuperacao(codigo) {
        if (!/^[0-9a-f]{48}$/.test(String(codigo || ""))) {
            return Promise.resolve(null);
        }

        return hashCodigo(codigo).then(function (hash) {
            const registro = lerRecuperacao().codigos[hash];

            return registro && registro.expira >= Date.now() ? registro.email : null;
        });
    }

    // Troca a senha e invalida todos os códigos dessa conta.
    function redefinirSenha(codigo, novaSenha) {
        return validarRecuperacao(codigo).then(function (email) {
            if (!email || !buscarUsuario(email)) {
                return false;
            }

            return hashSenha(novaSenha, email).then(function (hash) {
                if (!atualizarUsuario(email, { senha: hash })) {
                    return false;
                }

                const dados = lerRecuperacao();

                Object.keys(dados.codigos).forEach(function (h) {
                    if (dados.codigos[h].email === email) {
                        delete dados.codigos[h];
                    }
                });

                gravarRecuperacao(dados);
                return true;
            });
        });
    }

    function linkDeRecuperacao(codigo) {
        const url = new URL("redefinir-senha.html", window.location.href);

        url.search = "";
        url.hash = "";
        url.searchParams.set("codigo", codigo);

        return url.href;
    }

    // Envia o e-mail pelo EmailJS (configurado em email-config.js).
    function enviarEmailRecuperacao(usuario, link) {
        const cfg = configEmail();
        const ok = function (valor) {
            return valor && !/^COLE_AQUI/.test(valor);
        };

        if (!ok(cfg.serviceId) || !ok(cfg.templateId) || !ok(cfg.publicKey)) {
            return Promise.reject(new Error("nao-configurado"));
        }

        return fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                service_id: cfg.serviceId,
                template_id: cfg.templateId,
                user_id: cfg.publicKey,
                template_params: {
                    to_email: usuario.email,
                    to_name: String(usuario.nome || "").trim().split(/\s+/)[0] || "",
                    reset_link: link,
                    validade_minutos: Number(cfg.validadeMinutos) || 30
                }
            })
        }).then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("falha-envio");
            }
        });
    }

    /* ---------- utilidades ---------- */

    function emailValido(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
    }

    // Só aceita voltar para páginas do próprio site (ex.: "reserva.html").
    function destinoSeguro(valor) {
        // Aceita "pagina.html" ou "pagina.html?item=sup" (nunca endereço externo).
        return /^[a-z0-9\-_]+\.html(\?[a-z0-9\-_=&%.]*)?$/i.test(valor || "") ? valor : "index.html";
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

        // A saudação leva para a página de perfil da pessoa.
        const saudacao = document.createElement("a");
        saudacao.href = "perfil.html";
        saudacao.textContent = "Olá, " + primeiroNome;
        saudacao.title = "Ver meu perfil";
        saudacao.style.cssText =
            "color:#004aad;font-size:13px;font-weight:700;white-space:nowrap;" +
            "text-decoration:none;";

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
        atualizarUsuario: atualizarUsuario,
        excluirUsuario: excluirUsuario,
        atualizarSessao: atualizarSessao,
        reservasDe: reservasDe,
        salvarReserva: salvarReserva,
        atualizarReserva: atualizarReserva,
        excluirReservas: excluirReservas,
        hashSenha: hashSenha,
        segundosParaNovoEnvio: segundosParaNovoEnvio,
        registrarPedido: registrarPedido,
        criarRecuperacao: criarRecuperacao,
        validarRecuperacao: validarRecuperacao,
        redefinirSenha: redefinirSenha,
        linkDeRecuperacao: linkDeRecuperacao,
        enviarEmailRecuperacao: enviarEmailRecuperacao,
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