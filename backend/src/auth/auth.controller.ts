import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { AuthUserDto, LoginResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Sign in with email and password, returning a bearer token for use everywhere else.',
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Email or password is incorrect.' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const session = await this.authService.signIn(dto.email, dto.password);
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      user: session.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Invalidate the caller's current session." })
  @ApiResponse({ status: 204, description: 'Signed out.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async logout(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.authService.signOut(request.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the caller's own profile — id, role, and workstream scope." })
  @ApiResponse({ status: 200, type: AuthUserDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  me(@CurrentUser() user: AuthUserDto): AuthUserDto {
    return user;
  }
}
