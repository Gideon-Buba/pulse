import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ description: 'Notification id (uuid).' })
  id!: string;

  @ApiProperty({ description: 'Profile id this notification belongs to — always the caller.' })
  recipient_id!: string;

  @ApiProperty({
    description:
      "Machine-readable kind. Currently only 'account_request' (someone signed up and is waiting for admin approval).",
    example: 'account_request',
  })
  type!: string;

  @ApiProperty({ description: 'Short headline, safe to render as-is.' })
  title!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Longer detail line, e.g. who requested access and from which email.',
  })
  body!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "In-app path the notification links to, e.g. '/users'.",
  })
  link!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'The email address this notification is about, where applicable. Kept even if that account is later deleted.',
  })
  subject_email!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'ISO timestamp the recipient read this. Null = unread.',
  })
  read_at!: string | null;

  @ApiProperty({ description: 'ISO timestamp the notification was created.' })
  created_at!: string;
}
