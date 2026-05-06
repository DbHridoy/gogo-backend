import { CommonRepository } from "./common.repository";

export class CommonService {
  constructor(private commonRepo: CommonRepository) {}

  getContent = async () => {
    return await this.commonRepo.getContent();
  };

  updateContent = async (content: {
    about?: string;
    privacyPolicy?: string;
    termsAndConditions?: string;
  }) => {
    return await this.commonRepo.updateContent(content);
  };

  updateDeliverySettings = async (settings: {
    baseDeliveryCharge?: number;
    chargePerMile?: number;
    minimumDistanceMiles?: number;
  }) => {
    return await this.commonRepo.updateDeliverySettings(settings);
  };
}
