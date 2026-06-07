const FIRST_NAMES = [
  "Aarav",
  "Ananya",
  "Ishaan",
  "Meera",
  "Kabir",
  "Priya",
  "Rohan",
  "Saanvi",
  "Nikhil",
  "Diya",
];

const LAST_NAMES = [
  "Sharma",
  "Mehta",
  "Rao",
  "Kapoor",
  "Iyer",
  "Singh",
  "Nair",
  "Desai",
  "Gupta",
  "Menon",
];

const CITIES = ["Mumbai", "Bengaluru", "Delhi", "Pune", "Hyderabad", "Chennai"];
const STATUSES = ["New", "Active", "Pending", "Approved", "Archived"];

function pick(values, index) {
  if (!values?.length) return "";
  return values[index % values.length];
}

function nameAt(index) {
  return `${pick(FIRST_NAMES, index)} ${pick(LAST_NAMES, index + 3)}`;
}

function dateAt(index) {
  const month = String((index % 9) + 1).padStart(2, "0");
  const day = String(((index * 4) % 24) + 1).padStart(2, "0");
  return `2026-${month}-${day}`;
}

function keyHints(field) {
  const text = `${field.key || ""} ${field.label || ""}`.toLowerCase();
  return {
    isName: /name|customer|client|person|holder|title/.test(text),
    isEmail: /email/.test(text),
    isPhone: /phone|mobile|contact/.test(text),
    isCity: /city|location|region/.test(text),
    isAmount: /amount|price|fee|premium|salary|cost|total|value/.test(text),
    isStatus: /status|stage|state/.test(text),
  };
}

function valueForField(field, rowIndex, module) {
  const hints = keyHints(field);
  const options = (field.options || []).filter(Boolean);

  if (options.length && ["select", "radio"].includes(field.type)) {
    return pick(options, rowIndex);
  }
  if (options.length && field.type === "multi-select") {
    return [pick(options, rowIndex), pick(options, rowIndex + 1)].filter(Boolean);
  }

  switch (field.type) {
    case "email":
      return `${pick(FIRST_NAMES, rowIndex).toLowerCase()}.${pick(
        LAST_NAMES,
        rowIndex
      ).toLowerCase()}@example.in`;
    case "phone":
      return `+91 9${String(800000000 + rowIndex * 13791).slice(0, 9)}`;
    case "number":
    case "rating":
      return hints.isAmount ? 25000 + rowIndex * 7500 : (rowIndex % 5) + 1;
    case "currency":
    case "percentage":
      return 12500 + rowIndex * 5400;
    case "checkbox":
    case "toggle":
      return rowIndex % 2 === 0;
    case "date":
      return dateAt(rowIndex);
    case "time":
      return `${String(9 + (rowIndex % 8)).padStart(2, "0")}:30`;
    case "datetime":
      return `${dateAt(rowIndex)}T${String(9 + (rowIndex % 8)).padStart(
        2,
        "0"
      )}:30:00+05:30`;
    case "textarea":
      return `${module.singularName || "Record"} note ${rowIndex + 1} for internal review.`;
    case "tags":
    case "checkbox-group":
      return ["Priority", pick(CITIES, rowIndex)].filter(Boolean);
    case "file":
      return `sample-${rowIndex + 1}.pdf`;
    case "image":
    case "avatar":
      return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        nameAt(rowIndex)
      )}`;
    case "address":
      return {
        line1: `${rowIndex + 11} MG Road`,
        city: pick(CITIES, rowIndex),
        country: "India",
      };
    case "json":
      return { source: "sample", index: rowIndex + 1 };
    case "reference":
      return null;
    case "select":
    case "radio":
      return hints.isStatus ? pick(STATUSES, rowIndex) : pick(options, rowIndex);
    case "text":
    default:
      if (hints.isName) return nameAt(rowIndex);
      if (hints.isEmail) {
        return `${pick(FIRST_NAMES, rowIndex).toLowerCase()}@example.in`;
      }
      if (hints.isPhone) return `+91 9${String(700000000 + rowIndex * 9123).slice(0, 9)}`;
      if (hints.isCity) return pick(CITIES, rowIndex);
      if (hints.isStatus) return pick(options.length ? options : STATUSES, rowIndex);
      return `${module.singularName || "Record"} ${rowIndex + 1}`;
  }
}

export function generateSeedData(module, count = 5) {
  return Array.from({ length: count }, (_, rowIndex) => {
    const record = {};
    for (const field of module.fields || []) {
      if (
        !field.key ||
        ["id", "created_at", "updated_at", "created_by"].includes(
          String(field.key).toLowerCase()
        )
      ) {
        continue;
      }
      record[field.key] = valueForField(field, rowIndex, module);
    }
    return record;
  });
}
