import Common from "./common.model";

export class CommonRepository {
  getContent = async () => {
    return await Common.findOneAndUpdate(
      { key: "singleton" },
      { $setOnInsert: { key: "singleton" } },
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
}
