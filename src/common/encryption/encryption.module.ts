import { Module, Global, OnModuleInit } from "@nestjs/common";
import { EncryptionService } from "./encryption.service";
import { EncryptedStringTransformer } from "./transformers/encrypted-string.transformer";
import { EncryptedDecimalTransformer } from "./transformers/encrypted-decimal.transformer";

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule implements OnModuleInit {
  constructor(private readonly encryptionService: EncryptionService) {}

  onModuleInit() {
    EncryptedStringTransformer.setEncryptionService(this.encryptionService);
    EncryptedDecimalTransformer.setEncryptionService(this.encryptionService);
  }
}
