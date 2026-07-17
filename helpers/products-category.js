const ProductCategory = require("../models/product-category.model");
const redis = require("../config/redis");

module.exports.getSubCategory = async (parentId) => {
  const cacheKey = `category:subs:${parentId.toString()}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

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

  const result = await getCategory(parentId)
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600)
  return result
};