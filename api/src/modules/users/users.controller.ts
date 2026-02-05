import { Controller, Get, Post, Delete, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('organization')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user organization info with limits' })
  async getOrganizationInfo(@Req() req: any) {
    const userId = req.user.id;
    const info = await this.usersService.getUserOrganizationInfo(userId);
    return { data: info };
  }

  @Get('organization/members')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization members' })
  async getOrganizationMembers(@Req() req: any) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('User not part of an organization');
    }
    const members = await this.usersService.getOrganizationUsers(organizationId);
    return { data: members };
  }

  @Get('organization/slots')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get remaining user slots for organization' })
  async getRemainingSlots(@Req() req: any) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { data: { current: 1, limit: 1, remaining: 0 } };
    }
    const slots = await this.usersService.getRemainingUserSlots(organizationId);
    return { data: slots };
  }

  @Post('organization/members/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add user to organization (with limit check)' })
  async addMember(@Req() req: any, @Param('userId') userId: string) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('User not part of an organization');
    }
    await this.usersService.addUserToOrganization(userId, organizationId);
    return { success: true, message: 'User added to organization' };
  }

  @Delete('organization/members/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove user from organization' })
  async removeMember(@Req() req: any, @Param('userId') userId: string) {
    await this.usersService.removeUserFromOrganization(userId);
    return { success: true, message: 'User removed from organization' };
  }
}
