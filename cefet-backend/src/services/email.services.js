const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  }
})

const sendVerificationEmail = async (email, token) => {
  const verifyLink = `${process.env.CLIENT_URL}/auth/verify-email/${token}`

  await transporter.sendMail({
    from: '"Projeto Telecom" <rafael.tavares.informatica@gmail.com>',
    to: email,
    subject: 'Verifique seu e-mail',
    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #f9fafb;
          border-radius: 12px;
          text-align: center;
        "
      >
        <h1
          style="
            color: #111827;
            margin-bottom: 16px;
          "
        >
          Confirme seu e-mail
        </h1>

        <p
          style="
            color: #4b5563;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 32px;
          "
        >
          Clique no botão abaixo para verificar sua conta.
        </p>

        <a
          href="${verifyLink}"
          style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
          "
        >
          Verificar e-mail
        </a>

        <p
          style="
            margin-top: 32px;
            font-size: 14px;
            color: #6b7280;
          "
        >
          Se você não criou uma conta, ignore este e-mail.
        </p>
      </div>
    `
  })
}

module.exports = { sendVerificationEmail }

//SOLUÇÃO COM RESEND (precisa de domínio)
/*const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendVerificationEmail = async (email, token) => {
  const verifyLink =
    `${process.env.CLIENT_URL}/auth/verify-email/${token}`

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',

    to: email,

    subject: 'Verifique seu e-mail',

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #f9fafb;
          border-radius: 12px;
          text-align: center;
        "
      >
        <h1
          style="
            color: #111827;
            margin-bottom: 16px;
          "
        >
          Confirme seu e-mail
        </h1>

        <p
          style="
            color: #4b5563;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 32px;
          "
        >
          Clique no botão abaixo para verificar sua conta.
        </p>

        <a
          href="${verifyLink}"
          style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
          "
        >
          Verificar e-mail
        </a>

        <p
          style="
            margin-top: 32px;
            font-size: 14px;
            color: #6b7280;
          "
        >
          Se você não criou uma conta, ignore este e-mail.
        </p>
      </div>
    `
  })

  if (error) {
    console.error('Resend error:', error);
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }

  return data
}

module.exports = {
  sendVerificationEmail
}*/