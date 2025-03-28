const matchCategory = async (categories, user) => {
  let matchedCategories = categories.filter((cat) => {
    if (cat.sex && cat.sex !== user.userSex) return false;

    if (cat.age) {
      const [minAge, maxAge] = cat.age.split("-").map(Number);
      if (!(user.userAge >= minAge && user.userAge <= maxAge)) return false;
    }

    return true;
  });

  // sort by weight first, then by height
  matchedCategories = matchedCategories
    .map((cat) => {
      let catWeight;
      if (cat.weight.includes("+")) {
        catWeight = parseInt(cat.weight, 10);
      } else if (cat.weight) {
        catWeight = parseInt(cat.weight, 10);
      } else {
        catWeight = Infinity;
      }

      const weightDifference = Math.abs(user.userWeight - catWeight);
      return { ...cat, weightDifference };
    })
    .sort((a, b) => a.weightDifference - b.weightDifference);

  // find up to 3 best matches
  let bestMatches = matchedCategories.slice(0, 3).map((cat) => {
    const { weightDifference, ...rest } = cat;
    return rest;
  });

  return bestMatches.length === 0 ? false : bestMatches;
};

module.exports = {
  matchCategory,
};
