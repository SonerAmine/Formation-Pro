const nodemailer = require('nodemailer');
const { getEmailConfig } = require('../config/emailConfig');

// Create transporter Gmail uniquement
async function createTransporter() {
  try {
    const config = getEmailConfig();
    
    // Créer le transporteur Gmail
    const transporter = nodemailer.createTransport(config);
    
    // Vérifier la connexion
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    
    return transporter;
  } catch (error) {
    console.error('❌ Error creating Gmail transporter:', error.message);
    throw error;
  }
}

function getAppBaseUrl() {
  return process.env.FRONTEND_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
}

function buildResetPasswordEmail(to, resetLink) {
  const brand = process.env.APP_NAME || 'FormationPro';
  return {
    subject: `${brand} · Réinitialisation de votre mot de passe`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:12px;overflow:hidden;">
          <div style="padding:24px 24px 12px 24px;border-bottom:1px solid #1f2937;">
            <h1 style="margin:0;font-size:20px;">${brand}</h1>
          </div>
          <div style="padding:24px;">
            <h2 style="margin-top:0;color:#f9fafb;font-size:18px;">Réinitialiser votre mot de passe</h2>
            <p style="line-height:1.6;color:#cbd5e1;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
            <p style="line-height:1.6;color:#94a3b8;">Ce lien expirera dans 10 minutes pour des raisons de sécurité.</p>
            <a href="${resetLink}" style="display:inline-block;margin-top:12px;background:#3b82f6;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;">Choisir un nouveau mot de passe</a>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur:</p>
            <p style="word-break:break-all;color:#60a5fa;font-size:12px;">${resetLink}</p>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
          </div>
        </div>
        <p style="text-align:center;color:#64748b;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} ${brand}. Tous droits réservés.</p>
      </div>
    `
  };
}

async function sendPasswordResetEmail({ to, token }) {
  try {
    const transporter = await createTransporter();
    
    const baseUrl = getAppBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    const { subject, html } = buildResetPasswordEmail(to, resetLink);

    const fromName = process.env.EMAIL_FROM_NAME || (process.env.APP_NAME || 'FormationPro');
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    if (!fromEmail) {
      throw new Error('EMAIL_FROM ou EMAIL_USER non configuré dans le fichier .env');
    }

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html
    });

    console.log('✅ Email envoyé avec succès vers:', to);
    console.log('📧 Message ID:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Échec envoi email:', error.message);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail
};


