import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EmailChannel } from './channels/email.channel';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    // timeout: sin esto axios no tiene límite y una caída de Resend
    // dejaría colgada la request que dispara la notificación.
    HttpModule.register({ timeout: 5000 }),
  ],
  providers: [NotificationsService, EmailChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}
