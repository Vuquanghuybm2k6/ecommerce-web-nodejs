const ProductCategory = require("../models/product-category.model");

module.exports.getSubCategory = async (parentId) => {
  const getCategory = async (parentId) => {
    const subs = await ProductCategory.find({
      parent_id: parentId,
      deleted: false,
      status: "active",
    })
      .select("_id title slug parent_id")
      .lean();

    const childResults = await Promise.all(
      subs.map((sub) => getCategory(sub._id))
    );

    return [...subs, ...childResults.flat()];
  };

  return await getCategory(parentId);
};