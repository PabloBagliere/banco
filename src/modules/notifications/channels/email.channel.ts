import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../../../infrastructure/config/app.config';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

// Canal de email sobre la API de Resend. Es el ÚNICO lugar que conoce
// al proveedor: para cambiar de servicio de email solo se toca acá.
@Injectable()
export class EmailChannel {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfig,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    await firstValueFrom(
      this.httpService.post(
        'https://api.resend.com/emails',
        {
          from: `Pablo Bank <${this.config.emailFrom}>`,
          to: message.to,
          subject: message.subject,
          html: message.html,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }
}
