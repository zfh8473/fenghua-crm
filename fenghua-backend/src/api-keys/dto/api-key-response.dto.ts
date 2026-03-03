export class ApiKeyResponseDto {
  id: string;
  name: string;
  keyPrefix: string;          // 如 "fh_live_a1b2c3d4"，用于识别
  plainKey?: string;          // 仅创建时返回一次，之后不再可见
  userId: string;
  userEmail?: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  createdByEmail?: string;
}
