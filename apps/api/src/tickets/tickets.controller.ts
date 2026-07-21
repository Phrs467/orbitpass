import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Mock endpoint para teste de visualização do QR Code
  // Na vida real, o userId viria do JWT guardado no Headers/Req
  @Get(':id/qr-code/:userId')
  async getQrCode(@Param('id') id: string, @Param('userId') userId: string) {
    return this.ticketsService.generateDynamicQrToken(id, userId);
  }

  // Mock endpoint para validação do QR Code
  @Post('validate')
  async validateTicket(@Body() body: { ticketId: string, token: string, validatorId: string }) {
    return this.ticketsService.validateCheckin(body.ticketId, body.token, body.validatorId);
  }
}
