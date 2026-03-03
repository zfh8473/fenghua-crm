import { IsString, IsNotEmpty, MaxLength, IsUUID, IsOptional } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'API Key 名称不能为空' })
  @MaxLength(100, { message: '名称不能超过 100 个字符' })
  name: string;

  @IsUUID('4', { message: '用户 ID 必须是有效的 UUID' })
  @IsOptional()
  userId?: string; // 若不传，默认使用当前登录用户
}
