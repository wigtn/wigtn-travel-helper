import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { AnalyzeReceiptDto, BatchAnalyzeReceiptDto } from './dto/analyze-receipt.dto';
import { ChatDto } from './dto/chat.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('receipt/analyze')
  @ApiOperation({ summary: 'Analyze receipt image with AI' })
  async analyzeReceipt(@Req() req: AuthenticatedRequest, @Body() analyzeReceiptDto: AnalyzeReceiptDto) {
    return this.aiService.analyzeReceipt(req.user.id, analyzeReceiptDto);
  }

  @Post('receipt/analyze/batch')
  @ApiOperation({ summary: 'Analyze multiple receipt images with AI (max 10)' })
  async analyzeReceiptBatch(@Req() req: AuthenticatedRequest, @Body() dto: BatchAnalyzeReceiptDto) {
    return this.aiService.analyzeReceiptBatch(req.user.id, dto.receipts);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  async chat(@Req() req: AuthenticatedRequest, @Body() chatDto: ChatDto) {
    return this.aiService.chat(req.user.id, chatDto);
  }

  @Get('chat/history')
  @ApiOperation({ summary: 'Get chat history' })
  async getChatHistory(
    @Req() req: AuthenticatedRequest,
    @Query('tripId') tripId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.aiService.getChatHistory(req.user.id, tripId, limit || 20);
  }

  @Post('chat/stream')
  @ApiOperation({ summary: 'Chat with AI assistant (streaming response)' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream' })
  async chatStream(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Body() chatDto: ChatDto,
  ) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const stream = this.aiService.chatStream(req.user.id, chatDto);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
