const matchCategory = async (categories, user) => {
  let matchedCategories = categories.filter((cat) => {
    if (cat.sex && cat.sex !== user.userSex) return false;

    if (cat.age) {
      const [minAge, maxAge] = cat.age.split("-").map(Number);
      if (!(user.userAge >= minAge && user.userAge <= maxAge)) return false;
    }

    return true;
  });

  // calculate the closest match based on weight and height
  matchedCategories = matchedCategories.map((cat) => {
    // parse weight and height values
    const catWeight = cat.weight.includes("+")
      ? parseInt(cat.weight, 10)
      : cat.weight
      ? parseInt(cat.weight, 10)
      : Infinity;
    const catHeight = cat.height ? parseInt(cat.height, 10) : Infinity;

    // calculate the absolute difference in weight and height
    const weightDifference = Math.abs(user.userWeight - catWeight);
    const heightDifference =
      user.userHeight && catHeight !== Infinity
        ? Math.abs(user.userHeight - catHeight)
        : Infinity;

    // return the category with its calculated
    return {
      ...cat,
      weightDifference,
      heightDifference,
    };
  });

  // sort by the smallest difference in weight, then by height
  matchedCategories.sort((a, b) => {
    const totalDifferenceA = a.weightDifference + a.heightDifference;
    const totalDifferenceB = b.weightDifference + b.heightDifference;
    return totalDifferenceA - totalDifferenceB;
  });

  // return the top 3 closest matches
  let bestMatches = matchedCategories.slice(0, 3);

  return bestMatches.length === 0 ? false : bestMatches;

  // // sort by weight first, then by height
  // matchedCategories = matchedCategories.sort((a, b) => {
  //   const weightA = a.weight.includes("+")
  //     ? parseInt(a.weight, 10)
  //     : a.weight
  //     ? parseInt(a.weight, 10)
  //     : Infinity;
  //   const weightB = b.weight.includes("+")
  //     ? parseInt(b.weight, 10)
  //     : b.weight
  //     ? parseInt(b.weight, 10)
  //     : Infinity;
  //   const heightA = a.height ? parseInt(a.height, 10) : Infinity;
  //   const heightB = b.height ? parseInt(b.height, 10) : Infinity;

  //   // prioritize weight first, then height
  //   return weightA - weightB || heightA - heightB;
  // });

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

  // return bestMatches.length === 0 ? false : bestMatches;
};

module.exports = {
  matchCategory,
};
