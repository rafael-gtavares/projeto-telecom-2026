const nodemailer = require('nodemailer');

/**
 * Cria e retorna o transporter nodemailer.
 * Criado de forma lazy para garantir que as variáveis de ambiente
 * já foram carregadas pelo dotenv antes de usar.
 */
const createTransporter = () => {
  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT) || 2525;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Configuração de e-mail incompleta. Verifique as variáveis MAIL_HOST, MAIL_USER e MAIL_PASS no arquivo .env'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true apenas para porta 465 (SSL), false para 587 e 2525
    auth: { user, pass },
    // Em produção valida o certificado TLS (evita man-in-the-middle).
    // Em dev, alguns provedores (Mailtrap) usam certificados que falham a validação.
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

/**
 * Envia e-mail de verificação de conta
 */
const sendVerificationEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL}/verificar-email?token=${token}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"CEFET/RJ" <noreply@cefetrj.edu.br>',
    to,
    subject: 'Confirme seu e-mail — CEFET/RJ',
    html: `
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
            <a href="${link}"
               style="background: #1565C0; color: white; text-decoration: none; padding: 14px 32px;
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
    `,
  });
};

/**
 * Envia e-mail de recuperação de senha
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL}/redefinir-senha?token=${token}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"CEFET/RJ" <noreply@cefetrj.edu.br>',
    to,
    subject: 'Redefinição de senha — CEFET/RJ',
    html: `
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
            <a href="${link}"
               style="background: #1565C0; color: white; text-decoration: none; padding: 14px 32px;
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
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
