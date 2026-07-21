/**
 * Sun-sign quick reference (no DOB) — ruling graha, element, modality, compatible signs.
 */

import type { ZodiacSignEnum } from '@/app/lib/crm.types';

export type ZodiacModality = 'CARDINAL' | 'FIXED' | 'MUTABLE';

export type PlanetCode = 'SU' | 'MO' | 'MA' | 'ME' | 'JU' | 'VE' | 'SA';

export interface SunSignMeta {
  sign: ZodiacSignEnum;
  element: 'FIRE' | 'EARTH' | 'AIR' | 'WATER';
  modality: ZodiacModality;
  rulingPlanet: PlanetCode;
  compatibleWith: ZodiacSignEnum[];
  beneficNoteEn: string;
  beneficNoteNe: string;
  beneficNoteHi: string;
}

const PLANET_LABELS: Record<PlanetCode, { en: string; ne: string; hi: string }> = {
  SU: { en: 'Sun', ne: 'सूर्य', hi: 'सूर्य' },
  MO: { en: 'Moon', ne: 'चन्द्र', hi: 'चंद्र' },
  MA: { en: 'Mars', ne: 'मंगल', hi: 'मंगल' },
  ME: { en: 'Mercury', ne: 'बुध', hi: 'बुध' },
  JU: { en: 'Jupiter', ne: 'बृहस्पति', hi: 'बृहस्पति' },
  VE: { en: 'Venus', ne: 'शुक्र', hi: 'शुक्र' },
  SA: { en: 'Saturn', ne: 'शनि', hi: 'शनि' },
};

const ELEMENT_LABELS = {
  FIRE: { en: 'Fire', ne: 'अग्नि', hi: 'अग्नि' },
  EARTH: { en: 'Earth', ne: 'पृथ्वी', hi: 'पृथ्वी' },
  AIR: { en: 'Air', ne: 'वायु', hi: 'वायु' },
  WATER: { en: 'Water', ne: 'जल', hi: 'जल' },
} as const;

const MODALITY_LABELS = {
  CARDINAL: { en: 'Cardinal', ne: 'चर', hi: 'चर' },
  FIXED: { en: 'Fixed', ne: 'स्थिर', hi: 'स्थिर' },
  MUTABLE: { en: 'Mutable', ne: 'द्विस्वभाव', hi: 'द्विस्वभाव' },
} as const;

export const ZODIAC_SIGN_ORDER: ZodiacSignEnum[] = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

export const SUN_SIGN_META: Record<ZodiacSignEnum, SunSignMeta> = {
  ARIES: {
    sign: 'ARIES', element: 'FIRE', modality: 'CARDINAL', rulingPlanet: 'MA',
    compatibleWith: ['LEO', 'SAGITTARIUS', 'GEMINI'],
    beneficNoteEn: 'Mars (your ruling graha) supports courage, drive, and decisive action. Jupiter and Sun often act as supportive influences for Aries.',
    beneficNoteNe: 'मंगल (तपाईंको स्वामी ग्रह) साहस, उत्साह र निर्णायक कदमलाई बल दिन्छ। बृहस्पति र सूर्य प्रायः मेषका लागि सहयोगी प्रभाव हुन्छन्।',
    beneficNoteHi: 'मंगल (आपका स्वामी ग्रह) साहस, उत्साह और निर्णायक कदमों को बल देता है। बृहस्पति और सूर्य अक्सर मेष के लिए सहायक प्रभाव रखते हैं।',
  },
  TAURUS: {
    sign: 'TAURUS', element: 'EARTH', modality: 'FIXED', rulingPlanet: 'VE',
    compatibleWith: ['VIRGO', 'CAPRICORN', 'CANCER'],
    beneficNoteEn: 'Venus (ruling graha) favours stability, comfort, and harmony. Mercury and Saturn can support practical growth for Taurus.',
    beneficNoteNe: 'शुक्र (स्वामी ग्रह) स्थिरता, सुख र सामञ्जस्यलाई अनुकूल बनाउँछ। बुध र शनि वृषका लागि व्यावहारिक वृद्धिमा सहयोगी हुन सक्छन्।',
    beneficNoteHi: 'शुक्र (स्वामी ग्रह) स्थिरता, सुख और सामंजस्य को अनुकूल बनाता है। बुध और शनि वृषभ के लिए व्यावहारिक विकास में सहायक हो सकते हैं।',
  },
  GEMINI: {
    sign: 'GEMINI', element: 'AIR', modality: 'MUTABLE', rulingPlanet: 'ME',
    compatibleWith: ['LIBRA', 'AQUARIUS', 'ARIES'],
    beneficNoteEn: 'Mercury (ruling graha) strengthens communication and adaptability. Venus and Jupiter often bring balance to Gemini.',
    beneficNoteNe: 'बुध (स्वामी ग्रह) संवाद र अनुकूलनशीलतालाई बल दिन्छ। शुक्र र बृहस्पति प्रायः मिथुनमा सन्तुलन ल्याउँछन्।',
    beneficNoteHi: 'बुध (स्वामी ग्रह) संवाद और अनुकूलनशीलता को मजबूत करता है। शुक्र और बृहस्पति अक्सर मिथुन में संतुलन लाते हैं।',
  },
  CANCER: {
    sign: 'CANCER', element: 'WATER', modality: 'CARDINAL', rulingPlanet: 'MO',
    compatibleWith: ['SCORPIO', 'PISCES', 'TAURUS'],
    beneficNoteEn: 'Moon (ruling graha) governs emotions, intuition, and nurturing. Jupiter and Mars can support protective strength for Cancer.',
    beneficNoteNe: 'चन्द्र (स्वामी ग्रह) भावना, अन्तर्ज्ञान र हेरचाहलाई नियन्त्रण गर्छ। बृहस्पति र मंगल कर्कटका लागि सुरक्षात्मक शक्तिमा सहयोगी हुन सक्छन्।',
    beneficNoteHi: 'चंद्र (स्वामी ग्रह) भावनाओं, अंतर्ज्ञान और देखभाल को नियंत्रित करता है। बृहस्पति और मंगल कर्क के लिए सुरक्षात्मक शक्ति में सहायक हो सकते हैं।',
  },
  LEO: {
    sign: 'LEO', element: 'FIRE', modality: 'FIXED', rulingPlanet: 'SU',
    compatibleWith: ['ARIES', 'SAGITTARIUS', 'GEMINI'],
    beneficNoteEn: 'Sun (ruling graha) brings vitality, leadership, and confidence. Mars and Jupiter often amplify Leo’s positive expression.',
    beneficNoteNe: 'सूर्य (स्वामी ग्रह) जीवनशक्ति, नेतृत्व र आत्मविश्वास ल्याउँछ। मंगल र बृहस्पति प्रायः सिंहको सकारात्मक अभिव्यक्ति बढाउँछन्।',
    beneficNoteHi: 'सूर्य (स्वामी ग्रह) जीवन शक्ति, नेतृत्व और आत्मविश्वास लाता है। मंगल और बृहस्पति अक्सर सिंह की सकारात्मक अभिव्यक्ति को बढ़ाते हैं।',
  },
  VIRGO: {
    sign: 'VIRGO', element: 'EARTH', modality: 'MUTABLE', rulingPlanet: 'ME',
    compatibleWith: ['TAURUS', 'CAPRICORN', 'CANCER'],
    beneficNoteEn: 'Mercury (ruling graha) supports analysis, service, and precision. Venus and Saturn help ground Virgo’s talents.',
    beneficNoteNe: 'बुध (स्वामी ग्रह) विश्लेषण, सेवा र शुद्धतालाई सहयोग गर्छ। शुक्र र शनि कन्याको प्रतिभालाई स्थिर बनाउँछन्।',
    beneficNoteHi: 'बुध (स्वामी ग्रह) विश्लेषण, सेवा और शुद्धता का समर्थन करता है। शुक्र और शनि कन्या की प्रतिभा को स्थिर करते हैं।',
  },
  LIBRA: {
    sign: 'LIBRA', element: 'AIR', modality: 'CARDINAL', rulingPlanet: 'VE',
    compatibleWith: ['GEMINI', 'AQUARIUS', 'LEO'],
    beneficNoteEn: 'Venus (ruling graha) favours partnership, beauty, and fairness. Mercury and Saturn support balanced judgment for Libra.',
    beneficNoteNe: 'शुक्र (स्वामी ग्रह) साझेदारी, सौन्दर्य र न्यायलाई अनुकूल बनाउँछ। बुध र शनि तुलाको सन्तुलित निर्णयमा सहयोग गर्छन्।',
    beneficNoteHi: 'शुक्र (स्वामी ग्रह) साझेदारी, सौंदर्य और न्याय को अनुकूल बनाता है। बुध और शनि तुला के संतुलित निर्णय में सहायता करते हैं।',
  },
  SCORPIO: {
    sign: 'SCORPIO', element: 'WATER', modality: 'FIXED', rulingPlanet: 'MA',
    compatibleWith: ['CANCER', 'PISCES', 'CAPRICORN'],
    beneficNoteEn: 'Mars (ruling graha) gives intensity, focus, and resilience. Moon and Jupiter can soften and deepen Scorpio’s wisdom.',
    beneficNoteNe: 'मंगल (स्वामी ग्रह) तीव्रता, एकाग्रता र सहनशीलता दिन्छ। चन्द्र र बृहस्पति वृश्चिकको ज्ञानलाई गहन बनाउन सक्छन्।',
    beneficNoteHi: 'मंगल (स्वामी ग्रह) तीव्रता, एकाग्रता और सहनशीलता देता है। चंद्र और बृहस्पति वृश्चिक की बुद्धि को गहरा बना सकते हैं।',
  },
  SAGITTARIUS: {
    sign: 'SAGITTARIUS', element: 'FIRE', modality: 'MUTABLE', rulingPlanet: 'JU',
    compatibleWith: ['ARIES', 'LEO', 'AQUARIUS'],
    beneficNoteEn: 'Jupiter (ruling graha) expands wisdom, optimism, and purpose. Sun and Mars energise Sagittarius pursuits.',
    beneficNoteNe: 'बृहस्पति (स्वामी ग्रह) ज्ञान, आशावाद र उद्देश्य विस्तार गर्छ। सूर्य र मंगल धनुका प्रयासहरूलाई ऊर्जा दिन्छन्।',
    beneficNoteHi: 'बृहस्पति (स्वामी ग्रह) ज्ञान, आशावाद और उद्देश्य का विस्तार करता है। सूर्य और मंगल धनु के प्रयासों को ऊर्जा देते हैं।',
  },
  CAPRICORN: {
    sign: 'CAPRICORN', element: 'EARTH', modality: 'CARDINAL', rulingPlanet: 'SA',
    compatibleWith: ['TAURUS', 'VIRGO', 'PISCES'],
    beneficNoteEn: 'Saturn (ruling graha) builds discipline, responsibility, and long-term success. Venus and Mercury support Capricorn’s practical aims.',
    beneficNoteNe: 'शनि (स्वामी ग्रह) अनुशासन, जिम्मेवारी र दीर्घकालीन सफलता बनाउँछ। शुक्र र बुध मकरका व्यावहारिक लक्ष्यमा सहयोग गर्छन्।',
    beneficNoteHi: 'शनि (स्वामी ग्रह) अनुशासन, जिम्मेदारी और दीर्घकालिक सफलता बनाता है। शुक्र और बुध मकर के व्यावहारिक लक्ष्यों में सहायता करते हैं।',
  },
  AQUARIUS: {
    sign: 'AQUARIUS', element: 'AIR', modality: 'FIXED', rulingPlanet: 'SA',
    compatibleWith: ['GEMINI', 'LIBRA', 'SAGITTARIUS'],
    beneficNoteEn: 'Saturn (ruling graha) brings structure to innovation and ideals. Mercury and Venus support Aquarius communication.',
    beneficNoteNe: 'शनि (स्वामी ग्रह) नवीनता र आदर्शहरूलाई संरचना दिन्छ। बुध र शुक्र कुम्भको संवादमा सहयोग गर्छन्।',
    beneficNoteHi: 'शनि (स्वामी ग्रह) नवीनता और आदर्शों को संरचना देता है। बुध और शुक्र कुम्भ के संवाद में सहायता करते हैं।',
  },
  PISCES: {
    sign: 'PISCES', element: 'WATER', modality: 'MUTABLE', rulingPlanet: 'JU',
    compatibleWith: ['CANCER', 'SCORPIO', 'CAPRICORN'],
    beneficNoteEn: 'Jupiter (ruling graha) inspires compassion, spirituality, and imagination. Moon and Venus deepen Pisces sensitivity.',
    beneficNoteNe: 'बृहस्पति (स्वामी ग्रह) करुणा, आध्यात्मिकता र कल्पनालाई प्रेरित गर्छ। चन्द्र र शुक्र मीनको संवेदनशीलता बढाउँछन्।',
    beneficNoteHi: 'बृहस्पति (स्वामी ग्रह) करुणा, आध्यात्मिकता और कल्पना को प्रेरित करता है। चंद्र और शुक्र मीन की संवेदनशीलता को गहरा करते हैं।',
  },
};

function langKey(code: string): 'en' | 'ne' | 'hi' {
  const c = code.toLowerCase();
  if (c.startsWith('ne') || c.startsWith('np')) return 'ne';
  if (c.startsWith('hi')) return 'hi';
  return 'en';
}

export function planetLabel(code: PlanetCode, language: string): string {
  return PLANET_LABELS[code][langKey(language)];
}

export function elementLabel(element: SunSignMeta['element'], language: string): string {
  return ELEMENT_LABELS[element][langKey(language)];
}

export function modalityLabel(modality: ZodiacModality, language: string): string {
  return MODALITY_LABELS[modality][langKey(language)];
}

export function beneficNote(meta: SunSignMeta, language: string): string {
  const key = langKey(language);
  if (key === 'ne') return meta.beneficNoteNe;
  if (key === 'hi') return meta.beneficNoteHi;
  return meta.beneficNoteEn;
}

export function quickSummaryLine(
  signLabel: string,
  planet: string,
  element: string,
  compatibleLabels: string[],
  language: string
): string {
  const key = langKey(language);
  const compat = compatibleLabels.join(', ');
  if (key === 'ne') {
    return `तपाईं ${signLabel} → ${planet} द्वारा शासित, ${element} राशि। प्रायः ${compat} सँग मिल्दोजुल्दो।`;
  }
  if (key === 'hi') {
    return `आप ${signLabel} → ${planet} द्वारा शासित, ${element} राशि। अक्सर ${compat} के साथ अनुकूल।`;
  }
  return `You're ${signLabel} → ruled by ${planet}, ${element} sign. Often compatible with ${compat}.`;
}

export interface ZodiacCompatibilityResult {
  signA: ZodiacSignEnum;
  signB: ZodiacSignEnum;
  signALabel?: string;
  signBLabel?: string;
  score: number;
  level?: string;
  levelLabel?: string;
  summary?: string;
  loveAdvice?: string;
}
