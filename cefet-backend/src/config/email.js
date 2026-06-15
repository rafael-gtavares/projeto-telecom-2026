const { Brevo } = require('@getbrevo/brevo');

const brevo = new Brevo({
  apiKey: process.env.BREVO_API_KEY,
});

const sendEmail = async (to, name, subject, html) => {
  try {
    const info = await brevo.transactionalEmails.sendTransacEmail({
      to: [{ email: to, name }],
      sender: { email: process.env.MAIL_FROM, name: 'CEFET/RJ' },
      subject,
      htmlContent: html,
    });
    console.log('✅ E-mail enviado:', info.messageId);
  } catch (err) {
    console.error('❌ Erro ao enviar e-mail:', err.message);
    throw err;
  }
};

const sendVerificationEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL}/verificar-email?token=${token}`;
  await sendEmail(to, name, 'Confirme seu e-mail — CEFET/RJ', `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #F5F7FA; padding: 32px 16px;">
      <div style="background: white; border-radius: 12px; padding: 40px; border: 1px solid #DDE3EE;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1565C0; font-size: 22px; font-weight: 700; margin: 0;">CEFET/RJ</h1>
          <p style="color: #5C6880; font-size: 14px; margin: 8px 0 0;">Portal de Cursos e Eventos</p>
        </div>
        <h2 style="color: #1A1A2E; font-size: 20px; font-weight: 600; margin: 0 0 8px;">Olá, ${name}!</h2>
        <p style="color: #5C6880; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Obrigado por se cadastrar no portal CEFET/RJ. Para ativar sua conta e ter acesso
          a todos os cursos e eventos, confirme seu endereço de e-mail clicando no botão abaixo.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #1565C0; color: white; text-decoration: none; padding: 14px 32px;
                    border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Confirmar e-mail
          </a>
        </div>
        <p style="color: #9EA8B8; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
          Este link expira em <strong>24 horas</strong>.
          Se você não criou uma conta no CEFET/RJ, ignore este e-mail com segurança.
        </p>
        <hr style="border: none; border-top: 1px solid #DDE3EE; margin: 24px 0;" />
        <p style="color: #9EA8B8; font-size: 12px; text-align: center; margin: 0;">
          Se o botão não funcionar, copie e cole este link no navegador:<br/>
          <a href="${link}" style="color: #1565C0; word-break: break-all;">${link}</a>
        </p>
      </div>
    </div>
  `);
};

const sendPasswordResetEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL}/redefinir-senha?token=${token}`;
  await sendEmail(to, name, 'Redefinição de senha — CEFET/RJ', `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #F5F7FA; padding: 32px 16px;">
      <div style="background: white; border-radius: 12px; padding: 40px; border: 1px solid #DDE3EE;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1565C0; font-size: 22px; font-weight: 700; margin: 0;">CEFET/RJ</h1>
          <p style="color: #5C6880; font-size: 14px; margin: 8px 0 0;">Portal de Cursos e Eventos</p>
        </div>
        <h2 style="color: #1A1A2E; font-size: 20px; font-weight: 600; margin: 0 0 8px;">Olá, ${name}!</h2>
        <p style="color: #5C6880; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Recebemos uma solicitação para redefinir a senha da sua conta.
          Clique no botão abaixo para criar uma nova senha.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #1565C0; color: white; text-decoration: none; padding: 14px 32px;
                    border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Redefinir senha
          </a>
        </div>
        <p style="color: #9EA8B8; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
          Este link expira em <strong>1 hora</strong>.
          Se você não solicitou a redefinição de senha, ignore este e-mail — sua senha permanece a mesma.
        </p>
        <hr style="border: none; border-top: 1px solid #DDE3EE; margin: 24px 0;" />
        <p style="color: #9EA8B8; font-size: 12px; text-align: center; margin: 0;">
          Se o botão não funcionar, copie e cole este link no navegador:<br/>
          <a href="${link}" style="color: #1565C0; word-break: break-all;">${link}</a>
        </p>
      </div>
    </div>
  `);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };