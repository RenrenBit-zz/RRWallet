import _ from "lodash";

function isMatchedVersion(version, semver = "*") {
  if (!_.isString(version) || !_.isString(semver)) {
    return false;
  }

  semver = semver.split(" ").join("");

  if (semver === "*") {
    return true;
  }

  if (!/^(>=|>|<=|<|=)?\d\.\d\.\d$/.test(semver)) {
    return false;
  }

  const [target, operator = "="] = semver.split(/^(>=|>|<=|<|=)/).reverse();
  const versions = version.split(".").map(el => parseInt(el));
  const targets = target.split(".").map(el => parseInt(el));

  if (operator === "=") {
    return version === target;
  }

  for (let i = 0; i < targets.length; i++) {
    if (compare(versions[i], targets[i], operator)) {
      if (i == targets.length - 1) {
        return true;
      }
      continue;
    }
    return false;
  }

  return false;
}

function compare(a, b, operator) {
  switch (operator) {
    case ">":
      return a - b > 0 ? true : false;
    case ">=":
      return a - b >= +0 ? true : false;
    case "<":
      return a - b < 0 ? true : false;
    case "<=":
      return a - b <= +0 ? true : false;
    case "=":
      return a - b === 0 ? true : false;
  }
}

export default {
  isMatchedVersion,
};
