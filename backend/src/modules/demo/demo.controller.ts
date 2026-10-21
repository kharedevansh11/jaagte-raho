import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DemoService } from './demo.service.js';
import { DemoCallDto } from './dto/demo-call.dto.js';

@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Post('call')
  call(@Body() dto: DemoCallDto) {
    return this.demo.call(dto);
  }

  @Get('calls/:id')
  result(@Param('id') id: string) {
    return this.demo.result(id);
  }
}
