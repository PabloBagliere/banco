import { Injectable } from '@nestjs/common';
import { EmailChannel } from './channels/email.channel';
import { buildEmailVerificationHtml } from './templates/email-verification.template';
import { AppConfig } from '../../infrastructure/config/app.config';

// Fachada de notificaciones: el resto de la app dice QUÉ notificar
// (verificación de email, reset de password, etc.) y este servicio decide
// el canal y arma el contenido. Para sumar SMS/WhatsApp: crear el canal en
// channels/ y exponer acá los métodos que lo usen.
@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly config: AppConfig,
  ) {}

  async sendVerificationEmail(recipientEmail: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.config.appDomain}/verify?token=${verificationToken}`;
    await this.emailChannel.send({
      to: recipientEmail,
      subject: 'Verify your email address',
      html: buildEmailVerificationHtml(verificationUrl),
    });
  }
}
