import { IsNotEmpty, IsString } from 'class-validator';

export class AppendContextDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
