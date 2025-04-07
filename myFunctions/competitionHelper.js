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

const transformData = async (inputData) => {
  const result = [];

  inputData.forEach((item) => {
    let genderGroup = result.find((g) => g.gender === item.sex);
    if (!genderGroup) {
      genderGroup = { gender: item.sex, data: [] };
      result.push(genderGroup);
    }

    let ageGroup = genderGroup.data.find((a) => a.age === item.age);
    if (!ageGroup) {
      ageGroup = { age: item.age, data: [] };
      genderGroup.data.push(ageGroup);
    }

    let weightGroup = ageGroup.data.find((w) => w.weight === item.weight);
    if (!weightGroup) {
      weightGroup = { weight: item.weight, data: [] };
      ageGroup.data.push(weightGroup);
    }

    weightGroup.data.push({
      _id: item._id,
      name: item.name,
      height: item.height,
    });
  });

  return result;
};

module.exports = {
  matchCategory,
  transformData,
};
