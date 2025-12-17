import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_SENDER, SMTP_USER } from '$env/static/private';

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

export const sendOneTimePassEmail = async (email: string, oneTimePass: string) => {
    await transporter.sendMail({
        from: SMTP_SENDER,
        to: email,
        subject: 'NAS: One Time Pass',
        text: `Your one time pass is: ${oneTimePass}\n\nWill expire in 2 minutes.\n\nUnder no circumstances should you share this code with anyone.`,
    });
}