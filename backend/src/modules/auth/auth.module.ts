import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { AuthResolver } from './auth.resolver.js';
import { AuthService } from './auth.service.js';
import { OwnersRepository } from './owners.repository.js';

@Global()
@Module({
  providers: [OwnersRepository, AuthService, AuthGuard, AuthResolver],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
