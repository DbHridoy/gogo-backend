import Common from "./common.model";

export class CommonRepository {
  private ensureSingletonDocument = async () => {
    await Common.findOneAndUpdate(
      { key: "singleton" },
      {
        $setOnInsert: {
          key: "singleton",
          deliverySettings: {
            baseDeliveryCharge: 0,
            chargePerMile: 0,
            minimumDistanceMiles: 0,
          },
        },
      },
      { upsert: true, new: true }
    );
  };

  getContent = async () => {
    await this.ensureSingletonDocument();
    return await Common.findOne({ key: "singleton" });
  };

  updateContent = async (content: {
    about?: string;
    privacyPolicy?: string;
    termsAndConditions?: string;
  }) => {
    return await Common.findOneAndUpdate(
      { key: "singleton" },
      {
        $setOnInsert: { key: "singleton" },
        $set: content,
      },
      { upsert: true, new: true }
    );
  };

  updateDeliverySettings = async (settings: {
    baseDeliveryCharge?: number;
    chargePerMile?: number;
    minimumDistanceMiles?: number;
  }) => {
    await this.ensureSingletonDocument();

    const updatePayload = Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [`deliverySettings.${key}`, value])
    );

    return await Common.findOneAndUpdate(
      { key: "singleton" },
      {
        $set: updatePayload,
      },
      { new: true }
    );
  };
}
