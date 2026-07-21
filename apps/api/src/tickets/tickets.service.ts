import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { authenticator } from 'otplib';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {
    // Configura o otplib para 30 segundos (default)
    authenticator.options = { step: 30, window: 1 };
  }

  // Gera o token dinâmico atual para o ingresso (usado pelo app/PWA do comprador)
  async generateDynamicQrToken(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ingresso não encontrado');
    if (ticket.currentOwnerId !== userId) {
      throw new UnauthorizedException('Apenas o dono pode gerar o QR Code');
    }

    const token = authenticator.generate(ticket.dynamicQrSecret);
    return {
      ticketId: ticket.id,
      token,
      expiresIn: authenticator.timeRemaining(),
    };
  }

  // Valida o QR Code na portaria
  async validateCheckin(ticketId: string, token: string, validatorId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { checkin: true },
    });

    if (!ticket) throw new NotFoundException('Ingresso não encontrado');
    if (ticket.checkin) throw new UnauthorizedException('Ingresso já foi validado (Check-in já realizado)');
    if (ticket.status !== 'SOLD' && ticket.status !== 'RESERVED') {
      throw new UnauthorizedException('Ingresso não está disponível para check-in');
    }

    const isValid = authenticator.check(token, ticket.dynamicQrSecret);
    if (!isValid) {
      throw new UnauthorizedException('QR Code inválido ou expirado');
    }

    // Registra checkin
    await this.prisma.$transaction([
      this.prisma.checkin.create({
        data: {
          ticketId: ticket.id,
          validatorId,
        }
      }),
      this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'CHECKED_IN' }
      })
    ]);

    return { success: true, message: 'Check-in realizado com sucesso!' };
  }
}
