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

      // const weightA = a.weight.includes("+")
      //   ? parseInt(a.weight, 10)
      //   : a.weight
      //   ? parseInt(a.weight, 10)
      //   : Infinity;
      // const weightB = b.weight.includes("+")
      //   ? parseInt(b.weight, 10)
      //   : b.weight
      //   ? parseInt(b.weight, 10)
      //   : Infinity;
      // const heightA = a.height ? parseInt(a.height, 10) : Infinity;
      // const heightB = b.height ? parseInt(b.height, 10) : Infinity;

      // // prioritize weight first, then height
      // return weightB - weightA || heightB - heightA;
    })
    .sort((a, b) => a.weightDifference - b.weightDifference);

  // find up to 3 best matches
  let bestMatches = matchedCategories.slice(0, 3).map((cat) => {
    const { weightDifference, ...rest } = cat;
    return rest;
  });

  // // find up to 3 best matches
  // let bestMatches = matchedCategories
  //   .filter((cat) => {
  //     const catWeight = cat.weight.includes("+")
  //       ? parseInt(cat.weight, 10)
  //       : cat.weight
  //       ? parseInt(cat.weight, 10)
  //       : Infinity;
  //     const catHeight = cat.height ? parseInt(cat.height, 10) : Infinity;

  //     // allow empty weight & height categories
  //     if (!cat.weight || cat.weight === "") return true;
  //     if (!cat.height || cat.height === "") return true;

  //     // if weight is "+40", user must be more than 40kg
  //     if (cat.weight.includes("+") && user.userWeight > catWeight) return true;

  //     // keep closest lower weight too
  //     if (!cat.weight.includes("+") && user.userWeight <= catWeight)
  //       return true;
  //     if (!cat.weight.includes("+") && user.userWeight > catWeight) return true;

  //     // normal height matching
  //     if (userHeight <= catHeight) return true;

  //     return false;
  //   })
  //   .slice(0, 3);

  return bestMatches.length === 0 ? false : bestMatches;
};

module.exports = {
  matchCategory,
};
