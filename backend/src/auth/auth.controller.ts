import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { AuthUserDto, LoginResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { PENDING_APPROVAL_MESSAGE } from './supabase-auth.service';

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
  @ApiResponse({
    status: 403,
    description:
      'Credentials are valid but the account has not been approved by an admin yet (or was rejected). The response message is written to be shown to the user as-is.',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const session = await this.authService.signIn(dto.email, dto.password);
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      user: session.user,
    };
  }

  @Post('signup')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Request a Pulse account with an NRS work email. Creates the account in a pending state ' +
      'and notifies every admin — no session is returned, and the person cannot sign in until ' +
      'an admin approves them in the Users section.',
  })
  @ApiResponse({ status: 202, type: SignupResponseDto })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed — most commonly a non-NRS email address (only @nrs.gov.ng is accepted) or a password under 8 characters.',
  })
  @ApiResponse({
    status: 409,
    description: 'An account or a pending request already exists for this email address.',
  })
  async signup(@Body() dto: SignupDto): Promise<SignupResponseDto> {
    const result = await this.authService.signUp(dto.fullName, dto.email, dto.password);
    return { ...result, message: PENDING_APPROVAL_MESSAGE };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Email a password reset link. Only works for an email that already has an approved Pulse ' +
      'account — an unknown address gets a 404 rather than a silent success, so nobody waits on ' +
      'an email that was never going to arrive.',
  })
  @ApiResponse({ status: 200, type: ForgotPasswordResponseDto })
  @ApiResponse({ status: 400, description: 'Not a valid @nrs.gov.ng email address.' })
  @ApiResponse({
    status: 403,
    description: 'The account exists but is still pending approval, or was rejected.',
  })
  @ApiResponse({
    status: 404,
    description: 'No Pulse account exists for this email address.',
  })
  @ApiResponse({
    status: 503,
    description:
      'Supabase could not send the email (e.g. SMTP is not configured on the project). The admin can issue a reset link manually from the Users section instead.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    await this.authService.requestPasswordReset(dto.email);
    return { message: `A password reset link has been sent to ${dto.email}.` };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Set a new password using the recovery token from a reset link (emailed, or issued by an admin).',
  })
  @ApiResponse({ status: 204, description: 'Password updated — the user can now sign in.' })
  @ApiResponse({ status: 400, description: 'The new password is shorter than 8 characters.' })
  @ApiResponse({ status: 401, description: 'The reset link is invalid or has expired.' })
  @ApiResponse({
    status: 403,
    description: 'The account is still pending approval, or was rejected.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.password);
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
  @ApiResponse({
    status: 403,
    description: 'The account was rejected or un-approved after this token was issued.',
  })
  me(@CurrentUser() user: AuthUserDto): AuthUserDto {
    return user;
  }
}
