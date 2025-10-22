import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, body}) {
   
  try {
    const testAccount = await nodemailer.createTestAccount();

    const transorter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    const info = await transorter.sendMail({
        from: '"Request Tracker" <no-reply@example.com>',
        to,
        subject,
        body,
    });

    console.log('Message Sent', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch(error) {
    console.error('Failed to send email to ${to}:', error.message);
  }
}
