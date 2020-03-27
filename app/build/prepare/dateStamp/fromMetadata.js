var moment = require("moment");
var formatList = {
  "D/M/YYYY": formats("DMY"),
  "M/D/YYYY": formats("MDY"),
  "YYYY/M/D": formats("YMD")
};

function fromMetadata(dateString, userFormat) {
  const userFormats = formatList[userFormat] || formatList["M/D/YYYY"];

  if (!dateString) return false;

  let created;
  let strict;
  let strictNormalized;
  let lazy;
  let lazyNormalized;

  const normalizedDateString = dateString
    .split(".")
    .join("-")
    .split("/")
    .join("-")
    .split("st")
    .join("")
    .split("nd")
    .join("")
    .split(",")
    .join(" ")
    .split("th")
    .join("")
    .split("rd")
    .join("")
    .split("--")
    .join("-")
    .trim();

  try {
    strictNormalized = moment.utc(normalizedDateString, userFormats, true);
  } catch (e) {}

  try {
    strict = moment.utc(dateString, userFormats, true);
  } catch (e) {}

  try {
    let lazyDate = dateString;
    if (lazyDate.indexOf("UTC") === -1) lazyDate += " UTC";
    lazy = moment.utc(Date.parse(lazyDate));
  } catch (e) {}

  try {
    let lazyDate = normalizedDateString;
    if (lazyDate.indexOf("UTC") === -1) lazyDate += " UTC";
    lazyNormalized = moment.utc(Date.parse(lazyDate));
  } catch (e) {}

  if (strict && strict.isValid()) {
    created = strict.valueOf();
  } else if (strictNormalized && strictNormalized.isValid()) {
    created = strictNormalized.valueOf();
  } else if (lazy && lazy.isValid()) {
    created = lazy.valueOf();
  } else if (lazyNormalized && lazyNormalized.isValid()) {
    created = lazyNormalized.valueOf();
  } else {
    created = false;
  }

  return created;
}

function formats(dateFormat) {
  var M = ["M", "MM", "MMM"];
  var D = ["D", "DD"];
  var Y = ["YY", "YYYY"];

  // Initialize the list with the RFC339 Format
  var list = [];

  for (var a in M) for (var b in D) for (var c in Y) append(M[a], D[b], Y[c]);

  function append(m, d, y) {
    // dateFormat === 'MDY'
    var arr = [m, d, y];

    if (dateFormat === "DMY") arr = [d, m, y];

    if (dateFormat === "YMD") arr = [y, m, d];

    list.push(arr.join("-"));
  }

  list.push("YYYY-MM-DD[T]HH:mm:ssZ")
  list.push("YYYY-MM-DD[T]HH:mm:ss.SSSZ")
  list.push("YYYY-MM-DD[T]HH:mm:ssZ[Z]")

  return list;
}

module.exports = fromMetadata;
