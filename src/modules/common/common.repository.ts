import Common from "./common.model";

export class CommonRepository {
  getContent = async () => {
    return await Common.findOneAndUpdate(
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

  updateContent = async (
    field: "about" | "privacyPolicy" | "termsAndConditions",
    content: string
  ) => {
    return await Common.findOneAndUpdate(
      { key: "singleton" },
      {
        $setOnInsert: { key: "singleton" },
        $set: { [field]: content },
      },
      { upsert: true, new: true }
    );
  };

  updateDeliverySettings = async (settings: {
    baseDeliveryCharge?: number;
    chargePerMile?: number;
    minimumDistanceMiles?: number;
  }) => {
    const updatePayload = Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [`deliverySettings.${key}`, value])
    );

    return await Common.findOneAndUpdate(
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
        $set: updatePayload,
      },
      { upsert: true, new: true }
    );
  };
}
