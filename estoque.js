/* ==========================================================
   ESTOQUE E DISPONIBILIDADE POR DATA
   ----------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa editar para mudar
   quantas unidades existem de cada equipamento.

   IMPORTANTE: o site ainda não tem servidor, então as reservas
   "de outras pessoas" abaixo são DE EXEMPLO (RESERVAS_EXEMPLO),
   só para mostrar o recurso funcionando. Quando você tiver um
   banco de dados, troque por reservas reais ou coloque
   USAR_RESERVAS_EXEMPLO = false.

   Além delas, o site já conta as reservas feitas neste mesmo
   navegador (as que aparecem em "Meu perfil"), e ignora as
   canceladas.
========================================================== */

window.FluxoEstoque = (function () {
    "use strict";

    // Mostra o aviso "Só N unidades disponíveis" quando restarem N ou menos.
    const AVISAR_QUANDO_RESTAR = 3;

    // Quantas unidades de cada equipamento a FLUXO tem no total.
    const UNIDADES = {
        bicicleta: 4,
        patins: 6,
        sup: 3,
        bola: 10,
        raquete: 8,
        caiaque: 3,
        barraca: 5,
        badminton: 6,
        prancha: 3,
        "roupa-surf": 4,
        natacao: 6,
        seguranca: 8,
        "rede-volei": 2,
        pingpong: 2,
        pickleball: 5,
        slackline: 4
    };

    // Valor usado se um equipamento novo ainda não estiver na lista acima.
    const UNIDADES_PADRAO = 5;

    const USAR_RESERVAS_EXEMPLO = true;

    // Reservas de exemplo, contadas a partir de HOJE:
    // [começa daqui a N dias, dura N dias, quantidade de unidades]
    const RESERVAS_EXEMPLO = {
        sup:          [[0, 3, 1], [5, 4, 2]],
        caiaque:      [[1, 4, 2], [8, 3, 3]],
        prancha:      [[0, 6, 2]],
        "rede-volei": [[0, 2, 1], [5, 4, 2]],
        pingpong:     [[3, 3, 2]],
        bicicleta:    [[3, 4, 2], [10, 5, 4]],
        patins:       [[2, 3, 3]],
        bola:         [[1, 2, 4]],
        raquete:      [[0, 3, 3]],
        "roupa-surf": [[2, 5, 3]],
        slackline:    [[4, 3, 2]]
    };

    const CHAVE_RESERVAS = "fluxoReservas"; // mesma chave usada em conta.js

    /* ---------- datas (sempre no formato AAAA-MM-DD) ---------- */

    function paraISO(data) {
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");
        return data.getFullYear() + "-" + mes + "-" + dia;
    }

    function somarDias(iso, dias) {
        const data = new Date(iso + "T12:00:00");
        data.setDate(data.getDate() + dias);
        return paraISO(data);
    }

    function hoje() {
        return paraISO(new Date());
    }

    /* ---------- reservas conhecidas ---------- */

    function reservasExemplo(id) {
        if (!USAR_RESERVAS_EXEMPLO || !RESERVAS_EXEMPLO[id]) {
            return [];
        }

        const base = hoje();

        return RESERVAS_EXEMPLO[id].map(function (r) {
            return {
                inicio: somarDias(base, r[0]),
                fim: somarDias(base, r[0] + r[1] - 1),
                qtd: r[2]
            };
        });
    }

    function reservasDoNavegador(id) {
        const achadas = [];

        try {
            const todas = JSON.parse(localStorage.getItem(CHAVE_RESERVAS) || "{}");

            Object.keys(todas).forEach(function (email) {
                (Array.isArray(todas[email]) ? todas[email] : []).forEach(function (r) {
                    if (!r || r.cancelada || !r.retirada || !r.devolucao) {
                        return;
                    }

                    (r.itens || []).forEach(function (item) {
                        if (item.id !== id) {
                            return;
                        }

                        // O nome vem como "Bicicleta MTB (2x)" quando são várias unidades.
                        const m = /\((\d+)x\)/.exec(item.nome || "");

                        achadas.push({
                            inicio: r.retirada,
                            fim: r.devolucao,
                            qtd: m ? Number(m[1]) : 1
                        });
                    });
                });
            });
        } catch (e) {
            // Dados ilegíveis: ignora.
        }

        return achadas;
    }

    function reservas(id) {
        return reservasExemplo(id).concat(reservasDoNavegador(id));
    }

    /* ---------- consultas ---------- */

    function total(id) {
        return Object.prototype.hasOwnProperty.call(UNIDADES, id)
            ? UNIDADES[id]
            : UNIDADES_PADRAO;
    }

    // Unidades livres em um dia. Retirada e devolução contam como dia ocupado.
    function disponivel(id, iso) {
        const usadas = reservas(id).reduce(function (soma, r) {
            return soma + (iso >= r.inicio && iso <= r.fim ? r.qtd : 0);
        }, 0);

        return Math.max(0, total(id) - usadas);
    }

    function estoqueHoje(id) {
        return disponivel(id, hoje());
    }

    // Primeiro dia (a partir de "desde") em que NÃO há "qtd" unidades livres.
    function primeiroDiaIndisponivel(id, qtd, desde, ate) {
        const lista = reservas(id);
        const limite = ate || somarDias(desde, 180);
        const tot = total(id);

        for (let dia = desde; dia <= limite; dia = somarDias(dia, 1)) {
            const usadas = lista.reduce(function (soma, r) {
                return soma + (dia >= r.inicio && dia <= r.fim ? r.qtd : 0);
            }, 0);

            if (tot - usadas < qtd) {
                return dia;
            }
        }

        return null;
    }

    // Próximo dia em que há "qtd" unidades livres (para avisar quando volta).
    function proximaDataLivre(id, qtd, desde) {
        const inicio = desde || hoje();
        const lista = reservas(id);
        const tot = total(id);

        for (let i = 0; i <= 180; i++) {
            const dia = somarDias(inicio, i);
            const usadas = lista.reduce(function (soma, r) {
                return soma + (dia >= r.inicio && dia <= r.fim ? r.qtd : 0);
            }, 0);

            if (tot - usadas >= qtd) {
                return dia;
            }
        }

        return null;
    }

    // Texto curto para selos e avisos. Devolve null quando o estoque está folgado.
    function avisoDeEstoque(id) {
        const livres = estoqueHoje(id);

        if (livres === 0) {
            const volta = proximaDataLivre(id, 1);
            return {
                nivel: "zero",
                livres: 0,
                curto: "Sem estoque hoje",
                longo: volta
                    ? "Sem estoque hoje. Volta a ficar disponível em " +
                      volta.slice(8, 10) + "/" + volta.slice(5, 7) + "."
                    : "Sem estoque no momento."
            };
        }

        if (livres <= AVISAR_QUANDO_RESTAR) {
            const texto = "Só " + livres +
                (livres === 1 ? " unidade disponível" : " unidades disponíveis");

            return { nivel: "baixo", livres: livres, curto: texto, longo: texto };
        }

        return null;
    }

    // Quantas unidades a pessoa pode pedir de uma vez: é o mesmo número do
    // aviso "Só N unidades disponíveis". Se hoje não há nenhuma, vale o que
    // volta a ficar livre na próxima data disponível.
    function limiteParaAlugar(id) {
        const hojeLivres = estoqueHoje(id);

        if (hojeLivres > 0) {
            return hojeLivres;
        }

        const volta = proximaDataLivre(id, 1);
        return volta ? disponivel(id, volta) : 0;
    }

    return {
        hoje: hoje,
        somarDias: somarDias,
        total: total,
        disponivel: disponivel,
        estoqueHoje: estoqueHoje,
        primeiroDiaIndisponivel: primeiroDiaIndisponivel,
        proximaDataLivre: proximaDataLivre,
        avisoDeEstoque: avisoDeEstoque,
        limiteParaAlugar: limiteParaAlugar
    };
})();
