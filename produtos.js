
document.addEventListener("DOMContentLoaded", function () {
    const imagens = document.querySelectorAll(".catalogo-imagem img");

    imagens.forEach(function (imagem) {
        imagem.addEventListener("error", function () {
            if (imagem.dataset.fallbackAplicado === "true") {
                return;
            }

            imagem.dataset.fallbackAplicado = "true";
            imagem.alt = "Imagem do equipamento indisponível";
            imagem.style.display = "none";

            const areaImagem = imagem.closest(".catalogo-imagem");

            if (areaImagem) {
                areaImagem.classList.add("imagem-indisponivel");

                const aviso = document.createElement("span");
                aviso.textContent = "Imagem indisponível";
                aviso.style.cssText =
                    "font-size:10px;color:#777;text-align:center;padding:8px;";

                areaImagem.appendChild(aviso);
            }
        });
    });
});
