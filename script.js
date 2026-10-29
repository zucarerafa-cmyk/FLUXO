document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    if (!toggle || !menu) {
        return;
    }

    function fecharMenu() {
        menu.classList.remove("ativo");
        toggle.classList.remove("aberto");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menu");
    }

    toggle.addEventListener("click", function () {
        const aberto = menu.classList.toggle("ativo");

        toggle.classList.toggle("aberto", aberto);
        toggle.setAttribute("aria-expanded", String(aberto));
        toggle.setAttribute(
            "aria-label",
            aberto ? "Fechar menu" : "Abrir menu"
        );
    });

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", fecharMenu);
    });

    // Fecha o menu ao pressionar Escape.
    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            fecharMenu();
        }
    });

    // Fecha o menu ao voltar para a versão desktop.
    window.addEventListener("resize", function () {
        if (window.innerWidth > 800) {
            fecharMenu();
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("modal-aluguel");
    const fechar = document.getElementById("modal-fechar");
    const formulario = document.getElementById("form-aluguel");

    const campoProduto = document.getElementById("equipamento-escolhido");
    const retirada = document.getElementById("data-retirada");
    const devolucao = document.getElementById("data-devolucao");

    const valorDiaria = document.getElementById("valor-diaria");
    const quantidadeDias = document.getElementById("quantidade-dias");
    const valorTotal = document.getElementById("valor-total");
    const mensagem = document.getElementById("mensagem-aluguel");

    const botoesAlugar = document.querySelectorAll(".alugar-agora");

    if (
        !modal ||
        !fechar ||
        !formulario ||
        !campoProduto ||
        !retirada ||
        !devolucao
    ) {
        return;
    }

    let produtoAtual = "";
    let precoAtual = 0;
    let ultimoFoco = null;

    function formatarMoeda(valor) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function dataLocalISO(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function limparMensagem() {
        mensagem.textContent = "";
        mensagem.classList.remove("sucesso");
    }

    function calcularTotal() {
        const dataInicio = retirada.value;
        const dataFim = devolucao.value;

        valorDiaria.textContent = formatarMoeda(precoAtual);

        if (!dataInicio || !dataFim) {
            quantidadeDias.textContent = "Selecione as datas";
            valorTotal.textContent = formatarMoeda(0);
            return null;
        }

        const inicio = new Date(dataInicio + "T12:00:00");
        const fim = new Date(dataFim + "T12:00:00");

        const diferenca = Math.round(
            (fim.getTime() - inicio.getTime()) / 86400000
        );

        if (diferenca <= 0) {
            quantidadeDias.textContent = "Período inválido";
            valorTotal.textContent = formatarMoeda(0);
            return null;
        }

        quantidadeDias.textContent =
            diferenca + (diferenca === 1 ? " diária" : " diárias");

        const total = diferenca * precoAtual;
        valorTotal.textContent = formatarMoeda(total);

        return {
            dias: diferenca,
            total: total
        };
    }

    function abrirModal(botao) {
        ultimoFoco = botao;

        produtoAtual = botao.dataset.produto;
        precoAtual = Number(botao.dataset.preco);

        campoProduto.value = produtoAtual;

        const hoje = dataLocalISO(new Date());

        retirada.min = hoje;
        devolucao.min = hoje;

        retirada.value = "";
        devolucao.value = "";

        valorDiaria.textContent = formatarMoeda(precoAtual);
        quantidadeDias.textContent = "Selecione as datas";
        valorTotal.textContent = formatarMoeda(0);

        limparMensagem();

        modal.classList.add("aberto");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        fechar.focus();
    }

    function fecharModal() {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        limparMensagem();

        if (ultimoFoco) {
            ultimoFoco.focus();
        }
    }

    botoesAlugar.forEach(function (botao) {
        botao.addEventListener("click", function () {
            abrirModal(botao);
        });
    });

    fechar.addEventListener("click", fecharModal);

    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && modal.classList.contains("aberto")) {
            fecharModal();
        }
    });

    retirada.addEventListener("change", function () {
        limparMensagem();

        if (retirada.value) {
            devolucao.min = retirada.value;

            if (
                devolucao.value &&
                devolucao.value <= retirada.value
            ) {
                devolucao.value = "";
            }
        }

        calcularTotal();
    });

    devolucao.addEventListener("change", function () {
        limparMensagem();
        calcularTotal();
    });

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        limparMensagem();

        if (!retirada.value || !devolucao.value) {
            mensagem.textContent =
                "Selecione as datas de retirada e devolução.";
            return;
        }

        const hoje = dataLocalISO(new Date());

        if (retirada.value < hoje) {
            mensagem.textContent =
                "A data de retirada não pode ser anterior a hoje.";
            return;
        }

        if (devolucao.value <= retirada.value) {
            mensagem.textContent =
                "A devolução deve ocorrer após a retirada.";
            return;
        }

        const resumo = calcularTotal();

        if (!resumo) {
            mensagem.textContent =
                "Confira o período escolhido para continuar.";
            return;
        }

        mensagem.classList.add("sucesso");
        mensagem.textContent =
            "Seleção registrada nesta página: " +
            produtoAtual + ", " +
            resumo.dias + " diária(s), total estimado de " +
            formatarMoeda(resumo.total) + ".";
    });
});