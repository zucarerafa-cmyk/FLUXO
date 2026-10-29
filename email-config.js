/* ==========================================
   FLUXO - CONFIGURAÇÃO DO ENVIO DE E-MAILS

   O site não tem servidor, então o e-mail de
   recuperação de senha é enviado pelo EmailJS
   (emailjs.com), que tem plano gratuito.

   PASSO A PASSO
   1. Crie uma conta em emailjs.com.
   2. Em "Email Services", conecte o seu Gmail
      (ou outro) e copie o Service ID.
   3. Em "Email Templates", crie um modelo e use
      estas variáveis no texto e no campo "To Email":
          Para (To Email):  {{to_email}}
          Assunto:          Redefinição de senha - FLUXO
          Mensagem:         Olá, {{to_name}}!
                            Clique no link para criar uma nova senha
                            (vale por {{validade_minutos}} minutos):
                            {{reset_link}}
                            Se não foi você, ignore este e-mail.
      Copie o Template ID.
   4. Em "Account > General", copie a Public Key.
   5. Cole os três valores abaixo.
========================================== */

window.FLUXO_EMAIL = {
    serviceId: "COLE_AQUI_O_SERVICE_ID",
    templateId: "COLE_AQUI_O_TEMPLATE_ID",
    publicKey: "COLE_AQUI_A_PUBLIC_KEY",

    // Quanto tempo o link de recuperação continua valendo.
    validadeMinutos: 30,

    // Intervalo mínimo entre dois pedidos para o mesmo e-mail.
    intervaloSegundos: 60
};