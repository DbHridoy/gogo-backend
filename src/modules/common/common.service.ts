import { CommonRepository } from "./common.repository";

export class CommonService {
  constructor(private commonRepo: CommonRepository) {}

  getContent = async () => {
    return await this.commonRepo.getContent();
  };

  updateAbout = async (content: string) => {
    return await this.commonRepo.updateContent("about", content);
  };

  updatePrivacyPolicy = async (content: string) => {
    return await this.commonRepo.updateContent("privacyPolicy", content);
  };

  updateTermsAndConditions = async (content: string) => {
    return await this.commonRepo.updateContent("termsAndConditions", content);
  };

  updateDeliverySettings = async (settings: {
    baseDeliveryCharge?: number;
    chargePerMile?: number;
    minimumDistanceMiles?: number;
  }) => {
    return await this.commonRepo.updateDeliverySettings(settings);
  };
}
