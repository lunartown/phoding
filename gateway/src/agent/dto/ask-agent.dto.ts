import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const splitToTrimmedStrings = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const result = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
    return result.length > 0 ? result : undefined;
  }

  if (typeof value === 'string') {
    const result = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return result.length > 0 ? result : undefined;
  }

  return undefined;
};

export class AskAgentDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  instruction!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => splitToTrimmedStrings(value))
  fileHints?: string[];
}
