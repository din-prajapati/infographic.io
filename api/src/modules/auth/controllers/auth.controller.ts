import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() registerDto: RegisterDto) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.controller.ts:15',message:'Register endpoint called',data:{hasEmail:!!registerDto?.email,hasPassword:!!registerDto?.password,emailLength:registerDto?.email?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.controller.ts:22',message:'Login endpoint called',data:{hasEmail:!!loginDto?.email,hasPassword:!!loginDto?.password,emailLength:loginDto?.email?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return this.authService.login(loginDto);
  }
}
