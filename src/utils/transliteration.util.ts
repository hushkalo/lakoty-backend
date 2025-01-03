interface UrlSlugOptions {
  delimiter?: string;
  limit?: number;
  lowercase?: boolean;
  replacements?: Record<string, string>;
  transliterate?: boolean;
}

const defaults: UrlSlugOptions = {
  delimiter: "-",
  limit: undefined,
  lowercase: true,
  replacements: {},
  transliterate: true,
};

const charMap: Record<string, string> = {
  // Russian
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "Yo",
  Ж: "Zh",
  З: "Z",
  И: "I",
  Й: "J",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "H",
  Ц: "C",
  Ч: "Ch",
  Ш: "Sh",
  Щ: "Sh",
  Ъ: "",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "Yu",
  Я: "Ya",
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // Ukrainian
  Є: "Ye",
  І: "I",
  Ї: "Yi",
  Ґ: "G",
  є: "ye",
  і: "i",
  ї: "yi",
  ґ: "g",
};

export const transliteration = (
  s: string,
  opt: UrlSlugOptions = {},
): string => {
  s = String(s);
  opt = { ...defaults, ...opt };

  for (const k in opt.replacements) {
    s = s.replace(new RegExp(k, "g"), opt.replacements[k]);
  }

  if (opt.transliterate) {
    for (const k in charMap) {
      s = s.replace(new RegExp(k, "g"), charMap[k]);
    }
  }

  s = s.replace(/[^a-z0-9]+/gi, opt.delimiter || "-");
  s = s.replace(new RegExp(`[${opt.delimiter}]{2,}`, "g"), opt.delimiter);
  s = s.substring(0, opt.limit);
  s = s.replace(new RegExp(`(^${opt.delimiter}|${opt.delimiter}$)`, "g"), "");

  return opt.lowercase ? s.toLowerCase() : s;
};
