import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, body}) {
   
  try {
    console.log("trying to send email");
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    const info = await transporter.sendMail({
        from: '"Request Tracker" <no-reply@example.com>',
        to,
        subject,
        text: body,
    });

    console.log(`Message Sent, ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

  } catch(error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
}
