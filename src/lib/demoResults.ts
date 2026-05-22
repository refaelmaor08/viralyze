/**
 * Demo scenario data — pure module, works on both client and server.
 * No Node.js or browser-specific APIs.
 */

import type {
  AnalysisResult,
  AnalysisScores,
  CompetitorAnalysis,
  FixMyVideoSuggestion,
  SimpleVideoContext,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoScenario = Omit<AnalysisResult, 'id' | 'createdAt' | 'scores'> & {
  scores: AnalysisScores;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function jitter(base: number, range = 7): number {
  return Math.max(1, Math.min(100, base + Math.floor(Math.random() * range * 2) - range));
}

function jitterScores(scores: AnalysisScores): AnalysisScores {
  const out = {} as Record<string, number>;
  for (const [k, v] of Object.entries(scores)) out[k] = jitter(v as number);
  return out as unknown as AnalysisScores;
}

// ─── Hebrew scenarios ──────────────────────────────────────────────────────────

const HE_FIXES_A: FixMyVideoSuggestion[] = [
  {
    timestamp: '0:00-0:04',
    issue: 'פתיחה סטטית. לא קורה כלום. הצופה יגלול בשנייה 2.',
    fix: 'גזור את 4 השניות האלה. התחל ישירות ברגע שמשהו קורה — תנועה, דיבור, או טקסט.',
    type: 'cut',
  },
  {
    timestamp: '0:04-0:08',
    issue: 'אין כתובית או טקסט בולט שמסביר מה הנושא.',
    fix: 'הוסף כתובית גדולה שמסכמת את ה-Hook בשלוש מילים בולטות.',
    type: 'subtitle',
  },
  {
    timestamp: '0:18-0:25',
    issue: 'קצב עריכה יורד — פחות תנועה בין פריימים. האנרגיה נחלשת.',
    fix: 'הוסף חתך נוסף, האץ ב-15%, או הוסף B-Roll כדי לשמור על עניין.',
    type: 'speedup',
  },
  {
    timestamp: '0:45-0:50',
    issue: 'הסיום פשוט נגמר — לא מניע לפעולה.',
    fix: 'הוסף CTA ויזואלי: אנימציה קצרה, טקסט על המסך, ואמירה ישירה ומדויקת.',
    type: 'subtitle',
  },
];

const HE_FIXES_B: FixMyVideoSuggestion[] = [
  {
    timestamp: '0:00-0:05',
    issue: 'הפתיחה נראית כמו פרסומת — לוגו, מוזיקה תאגידית, תחושה מעורבת.',
    fix: 'החלף בפריים של הפנים שלך תוך 0.5 שניות, עם משפט אישי ובלתי מעובד.',
    type: 'cut',
  },
  {
    timestamp: '0:08-0:20',
    issue: 'רשימת יתרונות — שחוקה ומשעממת. הצופה כבר יודע שזה "פרסומת".',
    fix: 'החלף ברגע אחד ספציפי, ויזואלי, שמראה תוצאה. לא מספר — מראה.',
    type: 'cut',
  },
  {
    timestamp: '0:20-0:35',
    issue: 'מוזיקת רקע חזקה מדי — שולטת בחוויה ומחזקת תחושת "מסחרי".',
    fix: 'הורד עוצמת מוזיקה ב-50%, או עבור למוזיקה יותר אורגנית.',
    type: 'music',
  },
  {
    timestamp: '0:40-0:50',
    issue: 'CTA מסחרי ישיר: "לחץ על הקישור בביו" — נשמע כמו פרסומת.',
    fix: 'בקש מהצופים לשתף חוויה בתגובות. מעורבות > קליק.',
    type: 'emotion',
  },
];

const HE_FIXES_C: FixMyVideoSuggestion[] = [
  {
    timestamp: '0:22-0:32',
    issue: 'קצב עריכה מואט — פחות שינויי פריים, האנרגיה יורדת.',
    fix: 'קצץ 8-10 שניות מהחלק הזה. מה שנשאר יהיה חזק בהרבה.',
    type: 'cut',
  },
  {
    timestamp: '0:40-0:45',
    issue: 'אין רגע שיא רגשי לפני ה-CTA — הסרטון "נוחת" בצורה שטוחה.',
    fix: 'הוסף רגע מסכם חזק: ציטוט, מספר מפתיע, או תגובה רגשית קצרה.',
    type: 'emotion',
  },
  {
    timestamp: '0:48-0:52',
    issue: 'ה-CTA מהיר מדי ולא מאפשר לרגע "לנשום".',
    fix: 'הוסף 1.5 שניות של pause לפני ה-CTA, ואמור אותו לאט יותר ובביטחון.',
    type: 'zoom',
  },
];

const SCENARIOS_HE: DemoScenario[] = [
  {
    scores: {
      viralPotential: 61, attention: 67, curiosity: 56, emotionalImpact: 54,
      rewatchPotential: 41, shareability: 63, commentPotential: 57,
      hookStrength: 37, pacing: 62, visualStimulation: 71,
    },
    feedback: {
      strengths: [
        'האיכות הויזואלית גבוהה — הגדרה ברורה, צבעים נקיים ותמונה יציבה לאורך הסרטון.',
        'נוכחות טובה בפריים — קשר עין ישיר עם המצלמה ואנרגיה שמשדרת ביטחון.',
        'מספיק שינויי קאט בחלק האמצעי כדי לשמור על זרימה ויזואלית.',
      ],
      weaknesses: [
        'הפתיחה איטית מדי — יש כ-4 שניות של תמונה סטטית לפני שמשהו קורה. בטיקטוק, 65% מהצופים כבר גללו.',
        'ה-Hook לא מיידי: אין שאלה, הבטחה, או טריגר רגשי ב-2 השניות הראשונות.',
        'הסרטון חסר כתוביות — 85% מהצופים צופים בלי קול. בלי טקסט על המסך, מחצית מהמסר אובד.',
        'הסיום חלש — לא ברור מה אתה רוצה שהצופה יעשה אחרי שגמר.',
        'בחלק האמצעי יש ירידה מורגשת בתנועה בין פריימים — קצב העריכה נהיה איטי.',
      ],
      attentionDropPoints: [
        'שנייה 0-4: פתיחה סטטית — זה הרגע שרוב הצופים יגללו הלאה.',
        'שנייה 18-25: ירידה בקצב עריכה, פחות שינויים. הצופה מאבד עניין.',
        'שנייה 35-40: רגע של שתיקה ארוכה — הצופה מרגיש שהסרטון "נתקע".',
      ],
      pacingIssues: [
        'הקצב יציב מדי — אין שיאים או ירידות שיוצרים מסלול רגשי. הכל באותה עוצמה.',
        'החלק האמצעי ארוך יחסית לתוכן שיש בו — שקול לקצץ 20-25% ממנו.',
        'יש 3-4 שניות של שתיקה מוחלטת באמצע — גזור אותן או הוסף מוזיקת רקע עדינה.',
      ],
      genericElements: [
        'הפתיחה דומה לאלפי סרטונים אחרים — אין אלמנט שמייד אומר "זה שונה".',
        'ה-CTA בסוף גנרי מדי — "עקוב בשביל עוד תוכן" כבר לא עובד.',
        'חסר טקסט על המסך — הצופה שצופה ב-Mute לא מקבל את המסר.',
      ],
      strongElements: [
        'צבעוניות עקבית ומקצועית לאורך כל הסרטון.',
        'הבעות הפנים פועלות — יש קשר רגשי ויזואלי שמרגיש אמיתי.',
      ],
      whatToCut: [
        'גזור 3-4 השניות הראשונות — התחל ישירות ברגע שמשהו קורה.',
        'קצץ 20-30% מהחלק האמצעי. מה שנשאר יהיה חזק בהרבה.',
      ],
      immediateChanges: [
        'פתח עם שאלה מסקרנת או הצהרה מפתיעה תוך 1.5 שניות — לא אחרי.',
        'הוסף כתוביות לכל המשפטים המרכזיים — גופן גדול, ניגוד גבוה, נראה גם בשמש.',
        'הוסף CTA ספציפי בסוף: "שמור את זה לשבת" / "שתף עם מי שצריך לשמוע".',
        'גזור את השתיקות הארוכות — כל pause שמעל שנייה שאין בו כוונה דרמטית צריך לצאת.',
      ],
    },
    suggestions: {
      betterHooks: [
        '"הטעות הכי גדולה שאתה עושה ב..." — מיידית מציית אי-הסכמה וסקרנות.',
        '"ככה השגתי X תוך שבוע אחד בלי..." — תוצאה ראשית שהצופה רוצה.',
        '"מדוע כל הסרטונים שלך מקבלים פחות מ-500 צפיות?" — זיהוי מיידי.',
      ],
      betterCaptions: [
        'הסוד שאף אחד לא אומר לך על...',
        '3 דברים שעצרו את הצמיחה שלי (ואיך תיקנתי)',
        'למה רוב היוצרים נכשלים — ואיך להיות שונה',
      ],
      betterCTAs: [
        'שמור את הסרטון הזה — תצטרך אותו',
        'שתף עם יוצר שאתה מכיר שתקוע בצמיחה',
        'כתוב לי בתגובות: מה הטעות הכי גדולה שלך?',
      ],
      storytellingDirection:
        'בנה מסלול "כאב → גילוי → פתרון": הצג בעיה ב-3 שניות הראשונות, גילוי בשנייה 5-8, ופתרון ברור בסוף.',
      betterOpeningLines: [
        'אם הסרטונים שלך מקבלים פחות מאלף צפיות — זה הסרטון שצריך לראות.',
        'עשיתי את הטעות הזו שנה שלמה לפני שהבנתי.',
        '90% מהיוצרים עושים את זה לא נכון.',
      ],
      emotionalTriggers: [
        'סקרנות: "רוב האנשים לא יודעים את זה..."',
        'זיהוי: "אם אתה מרגיש שהאלגוריתם עובד נגדך..."',
        'FOMO: "בזמן שאתה קורא את זה, המתחרים שלך כבר..."',
      ],
      thumbnailIdeas: [
        'פנים בהבעת הפתעה עם טקסט גדול: "❌ לא ככה"',
        'Split screen: לפני ואחרי עם מספרים אמיתיים',
        'מבט ישיר למצלמה, פייטל טקסט מינימליסטי על רקע כהה',
      ],
    },
    fixMyVideo: HE_FIXES_A,
    executiveSummary:
      'הסרטון מראה פוטנציאל ויזואלי טוב, אבל הבעיה המרכזית היא ה-Hook — הפתיחה לא עוצרת גלילה תוך 2 שניות. הגוף חזק אבל האנרגיה יורדת בחלק האמצעי. הסיום גנרי ולא ממיר. עם שינויים ספציפיים בפתיחה ובסיום, הסרטון הזה יכול להכפיל את שיעור השמירה.',
    overallVerdict:
      'סרטון עם פוטנציאל ויזואלי אמיתי שנפגע מפתיחה איטית וסיום חלש — ההבדל בין 300 ל-30,000 צפיות.',
  },
  {
    scores: {
      viralPotential: 47, attention: 52, curiosity: 44, emotionalImpact: 33,
      rewatchPotential: 28, shareability: 41, commentPotential: 38,
      hookStrength: 51, pacing: 58, visualStimulation: 64,
    },
    feedback: {
      strengths: [
        'האיכות הטכנית גבוהה — תאורה טובה, צלילה נקייה, ייצור מקצועי.',
        'הקצב מהיר יחסית — לא נגרר ויש מספיק חתכים.',
        'ה-Hook הויזואלי מספיק חזק כדי לתפוס את הפריים הראשון.',
      ],
      weaknesses: [
        'הסרטון מרגיש כמו פרסומת — לא כמו תוכן אורגני. הצופים מזהים את זה תוך שנייה ומגללים.',
        'אין רגש אמיתי. הכל נראה מעובד מדי — הבעות הפנים, הדיבור, הסביבה.',
        'אין סיפור. מוצג מוצר ישירות, בלי בניית הקשר רגשי קודם.',
        'אין נקודת זיהוי לצופה — לא ברור מה הכאב שלו ואיך זה עוזר לו ספציפית.',
        'התאורה חזקה מדי ומלאכותית — מחזקת את תחושת "הפקה" ורחוקה מהאמינות האורגנית של TikTok.',
        'אנרגיה נמוכה בחלק השני — הדובר נשמע עייף, ניכרת ירידה בקצב הדיבור.',
      ],
      attentionDropPoints: [
        'שנייה 3-5: ברגע שמתברר שזה "מכירתי" — רוב הצופים יוצאים.',
        'שנייה 12: כשהתוכן הופך לרשימת יתרונות, ריטנשן צונח.',
      ],
      pacingIssues: [
        'הקצב טוב טכנית אבל אין ריתמוס רגשי — עליות וירידות שיוצרות מסלול.',
      ],
      genericElements: [
        'פורמט "הסבר → יתרונות → קנה" — שחוק ומזוהה מיידית.',
        'הקריינות נשמעת סקריפטית ולא ספונטנית — זה פוגע באמינות.',
        'חסר ה-CTA של מעורבות — "עקוב" זה לא מספיק. שאל שאלה, בקש תגובה.',
      ],
      strongElements: [
        'ייצור טכני מקצועי — אם תשנה את האסטרטגיה, הבסיס חזק.',
        'הפריים הראשון ויזואלית מסקרן.',
      ],
      whatToCut: [
        'קצץ את כל רשימת היתרונות — אחד ספציפי שווה יותר מחמישה כלליים.',
        'הסר כל אלמנט שמזכיר "פרסומת": לוגו גדול בפתיחה, אנימציות תאגידיות.',
        'קצץ את הקטע עם האנרגיה הנמוכה (שנייה 28-35) — הוא מוריד את כל הסרטון.',
      ],
      immediateChanges: [
        'פתח עם סיפור אישי של 10 שניות — בעיה שהיוצר עצמו פתר. אז הצג את הפתרון.',
        'החלף את התאורה הסטודיו בתאורה טבעית או צד — זה אורגני יותר ומורה פחות "פרסומת".',
        'הוסף כתוביות ויזואליות טבעיות ופחות מעוצבות — זה מרגיש יותר אמיתי.',
        'הורד את המוזיקה ב-40% — היא שולטת יותר מדי ומחזקת את תחושת הפרסומת.',
      ],
    },
    suggestions: {
      betterHooks: [
        '"ניסיתי X פעמים ולא הצלחתי — עד שגיליתי את זה..." — סיפור אישי.',
        '"רוב האנשים לא יודעים שאפשר ל..." — יוצר סקרנות מיידית.',
        '"זה שינה לי את החיים..." — הצהרה רגשית לפני הסבר.',
      ],
      betterCaptions: [
        'הסיפור שאף אחד לא סיפר לי על...',
        'איך גיליתי ש... (לא ידעתי שאפשר)',
        'הכנתי את זה ולא האמנתי לתוצאה',
      ],
      betterCTAs: [
        'ספר לי בתגובות — גם אתה חווית את זה?',
        'שתף עם חבר שמתמודד עם אותה בעיה',
        'שמור לפני שתשכח — תצטרך את זה',
      ],
      storytellingDirection:
        'עבור מ"פרסומת" ל"סיפור": פתח עם הכאב האישי שלך, הצג את המסע, ורק אז הראה את הפתרון כתוצאה טבעית.',
      betterOpeningLines: [
        'שנה שלמה בזבזתי כסף על זה — עד שהבנתי...',
        'זה אחד הדברים שהכי קשה לי להודות בהם.',
        'אף אחד לא אמר לי את זה כשהתחלתי.',
      ],
      emotionalTriggers: [
        'פגיעות: שיתוף כשל אישי לפני הצגת הפתרון.',
        'זיהוי: "גם אתה חווית את זה?" — יוצר קהילה.',
        'השראה: "אם אני הצלחתי — גם אתה יכול".',
      ],
      thumbnailIdeas: [
        'פנים כנות, לא מאופרות יתר על המידה, עם טקסט אמיתי',
        'Before/After ויזואלי — תוצאה אמיתית עם מספרים',
        'פריים מתוך רגע "גילוי" אמיתי בסרטון',
      ],
    },
    fixMyVideo: HE_FIXES_B,
    executiveSummary:
      'הסרטון ייצורית מקצועי אבל נפגע מתחושת "פרסומת" שהצופים מזהים תוך שנייה. הבעיה היא לא הייצור — אלא האסטרטגיה. מעבר מפורמט "הצג → מכור" לפורמט "ספר → ראה → אמן" יכול לשנות את הביצועים של הסרטון הזה לחלוטין.',
    overallVerdict:
      'סרטון מקצועי מבחינה טכנית שהאלגוריתם לא יאהב — כי הצופים ילחצו "גלול" ברגע שיבינו שזו פרסומת.',
  },
  {
    scores: {
      viralPotential: 77, attention: 81, curiosity: 74, emotionalImpact: 72,
      rewatchPotential: 61, shareability: 79, commentPotential: 76,
      hookStrength: 69, pacing: 71, visualStimulation: 83,
    },
    feedback: {
      strengths: [
        'ה-Hook חזק — הפריים הראשון מסקרן ויש התחלה ברורה תוך שנייה אחת.',
        'הגירוי הויזואלי גבוה — יש שינויים, תנועה, ומגוון זוויות שמשמרים עניין.',
        'הרגש ברור ועובד — קשר בין הדובר לצופה מורגש בפריימים הראשונים.',
        'קצב עריכה חזק בחלק הראשון — שומר על ריטנשן בשלב הקריטי.',
        'איכות ויזואלית גבוהה — תאורה טובה, חדות ברורה, תחושה מקצועית ואורגנית יחד.',
      ],
      weaknesses: [
        'החלק האמצעי מאבד קצת מהקצב — יש כ-10 שניות בהן השינוי בפריימים מואט.',
        'ה-CTA בסוף קצת מהיר מדי — לא נותן לרגע "לנשום" לפני שמבקשים מהצופה לפעול.',
        'אין רגע של "שיא" רגשי ברור — הסרטון חזק אבל אין בו רגע שמניע לשתף.',
      ],
      attentionDropPoints: [
        'שנייה 22-32: קצב עריכה יורד, פחות שינויי פריים — כאן יש ירידה קטנה בריטנשן.',
      ],
      pacingIssues: [
        'החלק האמצעי (שנייה 20-35) קצת ארוך — שקול לקצץ 8-10 שניות.',
      ],
      genericElements: [
        'ה-CTA בסוף נשמע כמו כל CTA אחר — שקול להפוך אותו ספציפי יותר לתוכן הזה.',
      ],
      strongElements: [
        'הפתיחה — חזקה, מיידית, ויזואלית.',
        'הרגש — אמיתי ועובד.',
        'קצב הסרטון הכללי — שומר על עניין.',
      ],
      whatToCut: [
        'קצץ שנייה 22-30 — הם הכי פחות חזקים בסרטון.',
        'הקצר את ה-CTA — פחות מילים, יותר ספציפיות.',
      ],
      immediateChanges: [
        'הוסף רגע שיא רגשי ברור לפני ה-CTA — ציטוט חזק, מספר מפתיע, או תגובה רגשית.',
        'האץ את החלק האמצעי ב-10-15% — הוא לא צריך להיות ארוך כל כך.',
        'הפוך את ה-CTA ספציפי יותר לתוכן הזה: "שתף את זה עם [קהל ספציפי]".',
      ],
    },
    suggestions: {
      betterHooks: [
        'הסרטון כבר מתחיל טוב — שמור על הנוסחה ופשוט הקצר בשנייה-שתיים.',
        'אפשר להוסיף שאלה מסקרנת בטקסט על המסך מעל הפתיחה.',
        '"מה היה קורה אם..." — ספציפי לנושא הסרטון, יוצר עניין נוסף.',
      ],
      betterCaptions: [
        'הכיתוב כבר עובד — שמור על הסגנון.',
        'נסה גרסה עם מספר ספציפי בכותרת: "3 דברים ש..." / "X% מהאנשים..."',
        'שאלה פתוחה בכיתוב: "מה לדעתך הכי חשוב?"',
      ],
      betterCTAs: [
        'שתף את זה עם מי שצריך לשמוע את זה',
        'כתוב לי "✅" אם זה עזר לך',
        'שמור — תחזור לזה',
      ],
      storytellingDirection:
        'המסלול הסיפורי כבר טוב. הוסף "רגע שיא" רגשי ברור בסמוך לסוף לפני ה-CTA.',
      betterOpeningLines: [
        'הפתיחה הנוכחית כבר חזקה — שמור עליה.',
        'אפשר לחדד ב-"זה לא מה שחשבתי שיקרה..."',
        '"אף אחד לא אמר לי את זה כשהתחלתי."',
      ],
      emotionalTriggers: [
        'הוסף רגע של פגיעות קצרה — זה מחזק את הזיהוי ב-30%.',
        'ספציפיות: מספר אמיתי, תאריך, שם — הופך את זה לאמיתי יותר.',
      ],
      thumbnailIdeas: [
        'פריים מתוך הרגע החזק ביותר בסרטון — כבר יש לך חומר טוב.',
        'הבעת פנים מהשיא הרגשי של הסרטון.',
        'Text overlay חזק: המשפט המשפיע ביותר מהסרטון.',
      ],
    },
    fixMyVideo: HE_FIXES_C,
    executiveSummary:
      'הסרטון הזה חזק — ה-Hook עובד, האיכות הויזואלית גבוהה, והרגש נוכח. הבעיה הקטנה היא בחלק האמצעי שמאבד קצת קצב, ובסיום שלא נותן לרגע "לנחות" לפני ה-CTA. עם שינויים קלים, הסרטון הזה יכול להיות מצוין.',
    overallVerdict:
      'סרטון חזק עם פוטנציאל ויראלי אמיתי — עוד כמה שיפורים קטנים וזה יכול להיות תוכן שמתפשט.',
  },
  {
    scores: {
      viralPotential: 53, attention: 48, curiosity: 46, emotionalImpact: 31,
      rewatchPotential: 25, shareability: 44, commentPotential: 35,
      hookStrength: 58, pacing: 55, visualStimulation: 42,
    },
    feedback: {
      strengths: [
        'הפתיחה מספיק מהירה — יש תנועה בפריים הראשון וה-Hook הוויזואלי לא רע.',
        'הקצב הטכני סביר — אין אזורים שנמשכים אין-סוף בלי חתך.',
        'הנושא רלוונטי לקהל — הבעיה היא הביצוע, לא הרעיון.',
      ],
      weaknesses: [
        'הסרטון שטוח רגשית — האנרגיה נשארת באותה עוצמה מההתחלה לסוף. אין עלייה, אין רגע שיא.',
        'הויזואל חוזר על עצמו — אותה זווית, אותו רקע, אותה תאורה לאורך כל הסרטון. הצופה מאבד גירוי.',
        'הצופה לא מקבל סיבה להמשיך לצפות — אין הבטחה שמוסר מוקדם ומממשים בסוף.',
        'אין רגע שמניע לשתף — לא נוצר טריגר רגשי שדוחף לפעולה.',
        'הגוף האמצעי ארוך ומונוטוני — מידע מוצג בלי בניית מתח או ציפייה.',
        'המסר מבולבל — לא ברור לצופה מה הוא אמור לקחת מהסרטון הזה.',
        'אין שיא: הסרטון מגיע לסוף בלי שהצופה מרגיש שקרה משהו משמעותי.',
      ],
      attentionDropPoints: [
        'שנייה 8-15: כשמתברר שהפורמט חוזר על עצמו — כאן כ-40% יגללו.',
        'שנייה 25-30: ירידה חדה בריטנשן כשאין שינוי קצב או גירוי חדש.',
      ],
      pacingIssues: [
        'הפורמט מרגיש כמו "שיעור" — מידע רצוף בלי שינויים שמשמרים עניין.',
        'אין עליות וירידות — הסרטון זז בקצב ישר כשמדרגות עולות הן מה שצריך.',
        'שקול לחלק את התוכן ל-3 "רגעים" ברורים: בעיה → הפתעה → פתרון.',
      ],
      genericElements: [
        'הרקע סטטי ואחיד — לא מוסיף ויזואל מעניין לאורך הסרטון.',
        'אין כתוביות, טקסטים על המסך, או אלמנטים גרפיים שמוסיפים שכבת עניין.',
        'הצגה ישירה מדי — נאמר מה, אבל לא יוצר חיבור "למה זה חשוב לי?".',
        'אין מגוון ויזואלי — אם כל פריים נראה אותו דבר, המוח מפסיק לעבד ומחפש גירוי אחר.',
        'תאורת הרקע חלשה — יוצרת תחושה "ביתית" שמקשה על בולטות בפיד.',
      ],
      strongElements: [
        'הרעיון עצמו טוב ורלוונטי לקהל.',
        'איכות הצליל בסדר — ברורה וללא רעשים.',
      ],
      whatToCut: [
        'קצץ 30-40% מהגוף האמצעי — שאר המידע יכול להיכנס לסרטון שני.',
        'הסר הסברים שהצופה כבר יודע — קפוץ ישירות לחלק המפתיע.',
      ],
      immediateChanges: [
        'הוסף B-Roll: שנייה-שתיים של תמונה שמחזקת את מה שנאמר — זה שובר את המונוטוניות.',
        'בנה לקראת "רגע שיא" ברור — שאלה שמשאירה תשובה לסוף, מספר מפתיע, גילוי.',
        'הוסף שינוי זווית אחד לפחות באמצע הסרטון — אפילו זה שובר את הויזואל הקבוע.',
        'הוסף טקסט גדול על המסך בנקודה הכי חשובה — זה מגדיל ריטנשן ב-20-30%.',
      ],
    },
    suggestions: {
      betterHooks: [
        '"הייתי בטוח שזה לא יעבוד — ואז..." — סיפור פתוח שמושך לפנים.',
        '"שאלו אותי את זה 100 פעם. הנה התשובה האמיתית." — מיידי ורלוונטי.',
        '"רוב האנשים מפספסים את הצעד הקריטי הזה..." — יוצר FOMO מיידי.',
      ],
      betterCaptions: [
        'הטעות שעשיתי שנה שלמה (וכיצד תמנע אותה)',
        'מה שאף אחד לא אומר לך על...',
        'ניסיתי את זה 30 יום — הנה מה שקרה',
      ],
      betterCTAs: [
        'שמור את זה לפני שתשכח — תצטרך אותו',
        'שתף עם מי שתקוע באותה נקודה',
        'כתוב לי "✅" אם זה דייק — אני קורא כל תגובה',
      ],
      storytellingDirection:
        'עבור מ"מצגת" ל"מסע": פתח עם בעיה שהצופה מזדהה איתה, בנה מתח לאורך הגוף עם גילויים קטנים, וסיים ברגע שיא שמניע לפעולה.',
      betterOpeningLines: [
        'שנה שלמה עשיתי את זה לא נכון — עד שמישהו הראה לי.',
        'יש דבר אחד שרוב האנשים מדלגים עליו, והוא שינה הכל.',
        'אם אתה מרגיש שאתה עובד קשה ולא מקבל תוצאות — זה בשבילך.',
      ],
      emotionalTriggers: [
        'זיהוי: "גם אתה חווית את זה?" — יוצר קהילה של "אני לא לבד".',
        'הפתעה: מספר או עובדה שלא מצפים לה — מגדיל שמירות.',
        'תקווה: "אחרי שתעשה את זה, הכל ישתנה" — נותן סיבה להמשיך לצפות.',
      ],
      thumbnailIdeas: [
        'הבעת הפנים הכי אמיתית ומפתיעה מהסרטון',
        'Split screen: המצב לפני מול התוצאה אחרי',
        'טקסט בולד + רקע ניגודי שמייחד מהקצב הרגיל',
      ],
    },
    fixMyVideo: [
      {
        timestamp: '0:00-0:06',
        issue: 'הפתיחה בסדר אבל אין הבטחה ברורה — הצופה לא יודע למה לו לחכות.',
        fix: 'הוסף משפט אחד בפריים הראשון: "בסוף הסרטון הזה תבין למה X לא עובד לך — ומה לעשות."',
        type: 'subtitle',
      },
      {
        timestamp: '0:10-0:30',
        issue: 'גוש מידע רצוף בלי הפסקה ויזואלית — המוח מפסיק לעבד ומחפש גירוי אחר.',
        fix: 'חלק לשלושה בלוקים קצרים. בין כל בלוק: חתך מהיר, שינוי זווית, או B-Roll של שנייה.',
        type: 'cut',
      },
      {
        timestamp: '0:30-0:40',
        issue: 'אין בניית מתח לקראת הסוף — הסרטון פשוט ממשיך באותה עוצמה.',
        fix: 'האט קצת, הוסף הפסקה דרמטית קצרה, ואמור: "וזה מביא אותי לנקודה הכי חשובה..."',
        type: 'zoom',
      },
      {
        timestamp: '0:40-0:48',
        issue: 'אין שיא רגשי — הסרטון נוחת שטוח לסוף.',
        fix: 'הוסף רגע שיא: מספר מפתיע, ציטוט חזק, או גילוי שהצופה לא ציפה לו.',
        type: 'emotion',
      },
    ],
    executiveSummary:
      'הסרטון מכיל תוכן טוב אבל הביצוע שטוח — אין עלייה ויורדת, אין רגע שיא, אין גירוי ויזואלי שמשמר עניין. הצופה לא מרגיש מסלול. עם שינויים בבניית המסלול הרגשי, הוספת B-Roll, ורגע שיא ברור — הסרטון הזה יכול לשפר את הריטנשן שלו ב-40% לפחות.',
    overallVerdict:
      'תוכן טוב שנאסר על ידי ויזואל מונוטוני ומסלול רגשי שטוח — הצופה לא מרגיש שמשהו מיוחד קורה כאן.',
  },
];

// ─── English scenarios ─────────────────────────────────────────────────────────

const EN_FIXES_A: FixMyVideoSuggestion[] = [
  {
    timestamp: '0:00-0:04',
    issue: 'Static opening. Nothing happens. Viewer will scroll at second 2.',
    fix: 'Cut these 4 seconds entirely. Start directly at the moment something happens.',
    type: 'cut',
  },
  {
    timestamp: '0:04-0:08',
    issue: 'No subtitle or bold text explaining the topic.',
    fix: 'Add a large subtitle summarizing the hook in three bold words.',
    type: 'subtitle',
  },
  {
    timestamp: '0:18-0:25',
    issue: 'Editing pace drops — fewer frame changes. Energy weakens.',
    fix: 'Add another cut, speed up 15%, or add B-roll to maintain interest.',
    type: 'speedup',
  },
  {
    timestamp: '0:45-0:50',
    issue: 'The ending just stops — no action is driven.',
    fix: 'Add a visual CTA: short animation, on-screen text, and a direct specific statement.',
    type: 'subtitle',
  },
];

const EN_FIXES_B: FixMyVideoSuggestion[] = [
  {
    timestamp: '0:00-0:05',
    issue: 'Opening looks like an ad — logo, corporate music, over-polished feel.',
    fix: 'Replace with your face within 0.5 seconds, with a personal unscripted sentence.',
    type: 'cut',
  },
  {
    timestamp: '0:08-0:20',
    issue: 'Benefits list — stale and boring. Viewer already knows it is an ad.',
    fix: 'Replace with one specific visual moment that shows a result. Show, not tell.',
    type: 'cut',
  },
  {
    timestamp: '0:20-0:35',
    issue: 'Background music too loud — dominates the experience and reinforces the commercial feel.',
    fix: 'Lower music volume by 50%, or switch to more organic, less cinematic music.',
    type: 'music',
  },
];

const EN_FIXES_C: FixMyVideoSuggestion[] = [
  {
    timestamp: '0:22-0:32',
    issue: 'Editing pace slows — fewer frame changes, energy drops.',
    fix: 'Trim 8-10 seconds from this section. What remains will be much stronger.',
    type: 'cut',
  },
  {
    timestamp: '0:40-0:45',
    issue: 'No emotional peak before the CTA — the video lands flat.',
    fix: 'Add a powerful summary moment: strong quote, surprising number, or emotional reaction.',
    type: 'emotion',
  },
  {
    timestamp: '0:48-0:52',
    issue: 'CTA moves too fast — does not allow the moment to breathe.',
    fix: 'Add 1.5 seconds of pause before the CTA and deliver it slower with confidence.',
    type: 'zoom',
  },
];

const SCENARIOS_EN: DemoScenario[] = [
  {
    scores: {
      viralPotential: 60, attention: 65, curiosity: 55, emotionalImpact: 52,
      rewatchPotential: 40, shareability: 62, commentPotential: 56,
      hookStrength: 36, pacing: 61, visualStimulation: 70,
    },
    feedback: {
      strengths: [
        'Strong visual quality — clear resolution, clean colors, and stable framing throughout.',
        'Good on-camera presence — direct eye contact and confident energy.',
        'Enough cuts in the middle section to maintain visual flow.',
      ],
      weaknesses: [
        'The opening is too slow — 4 static seconds before anything happens. On TikTok, 65% of viewers have already scrolled.',
        'The hook is not immediate: no question, promise, or emotional trigger in the first 2 seconds.',
        'Weak ending — not clear what you want the viewer to do after watching.',
        'Energy drops in the middle section — editing pace slows down noticeably.',
      ],
      attentionDropPoints: [
        '0-4 seconds: Static opening — this is the moment most viewers will scroll away.',
        '18-25 seconds: Slower edit pace, fewer frame changes. Viewer loses interest.',
      ],
      pacingIssues: [
        'Too consistent a pace — no peaks or valleys to create an emotional arc.',
        'The middle section is long relative to the content it contains.',
      ],
      genericElements: [
        'The opening looks like thousands of other videos — no element that signals "this is different."',
        'The CTA at the end is too generic — "follow for more content" no longer converts.',
      ],
      strongElements: [
        'Consistent professional color grading throughout.',
        'Facial expressions are engaging — real emotional connection.',
      ],
      whatToCut: [
        'Cut the first 3-4 seconds — start directly at the moment something happens.',
        'Trim 20-30% of the middle section. What remains will be much stronger.',
      ],
      immediateChanges: [
        'Open with a provocative question or surprising statement within 1.5 seconds.',
        'Add a bold subtitle in the first frame summarizing the topic in three words.',
        'Add a specific CTA at the end: "Save this for later" / "Share with someone who needs this."',
      ],
    },
    suggestions: {
      betterHooks: [
        '"The biggest mistake you are making with..." — immediately creates curiosity.',
        '"Here is how I got X in one week without..." — lead with the result they want.',
        '"Why does every video you make get under 500 views?" — instant recognition.',
      ],
      betterCaptions: [
        'The secret no one told you about...',
        '3 things that stopped my growth (and how I fixed it)',
        'Why most creators fail — and how to be different',
      ],
      betterCTAs: [
        'Save this video — you will need it',
        'Share with a creator you know who is stuck',
        'Tell me in the comments: what is your biggest mistake?',
      ],
      storytellingDirection:
        'Build a "pain → discovery → solution" arc: present a problem in the first 3 seconds, discovery at second 5-8, and a clear resolution at the end.',
      betterOpeningLines: [
        'If your videos get under 1,000 views — this is the one video you need to watch.',
        'I made this mistake for an entire year before I understood.',
        '90% of creators are doing this wrong.',
      ],
      emotionalTriggers: [
        'Curiosity: "Most people do not know this..."',
        'Recognition: "If you feel like the algorithm is working against you..."',
        'FOMO: "While you are reading this, your competitors are already..."',
      ],
      thumbnailIdeas: [
        'Surprised facial expression with large text: "Not like this"',
        'Split screen: before and after with real numbers',
        'Direct eye contact, minimal text overlay on dark background',
      ],
    },
    fixMyVideo: EN_FIXES_A,
    executiveSummary:
      'The video shows strong visual potential, but the core issue is the hook — the opening does not stop the scroll within 2 seconds. The body is solid but energy drops in the middle section. The ending is generic and does not convert. With specific changes to the opening and ending, this video can double its retention rate.',
    overallVerdict:
      'A video with real visual potential hurt by a slow opening and weak ending — the difference between 300 and 30,000 views.',
  },
  {
    scores: {
      viralPotential: 46, attention: 51, curiosity: 43, emotionalImpact: 32,
      rewatchPotential: 27, shareability: 40, commentPotential: 37,
      hookStrength: 50, pacing: 57, visualStimulation: 63,
    },
    feedback: {
      strengths: [
        'High technical quality — good lighting, clean audio, professional production.',
        'Fast enough pace — no dragging, sufficient cuts.',
        'The visual hook is strong enough to capture the first frame.',
      ],
      weaknesses: [
        'It feels like an ad — not organic content. Viewers spot this in one second and scroll.',
        'No real emotion. Everything looks too polished — expressions, speech, environment.',
        'No story. Product presented directly, without first building emotional context.',
        'No viewer recognition point — unclear what their pain is and how this specifically helps.',
      ],
      attentionDropPoints: [
        '3-5 seconds: The moment it reads as promotional — most viewers exit.',
        '12 seconds: When content becomes a list of benefits, retention drops sharply.',
      ],
      pacingIssues: [
        'Technically good pace but no emotional rhythm — peaks and valleys that create an arc.',
      ],
      genericElements: [
        '"Explain → Benefits → Buy" format — worn out and immediately recognized.',
        'Voiceover sounds scripted, not spontaneous — damages credibility.',
      ],
      strongElements: [
        'Professional technical production — if you change the strategy, the foundation is strong.',
        'The first frame is visually intriguing.',
      ],
      whatToCut: [
        'Cut the entire benefits list — one specific and focused point is worth more than five general ones.',
        'Remove every element that signals "ad": big logo at opening, corporate animations.',
      ],
      immediateChanges: [
        'Open with a 10-second personal story — a problem you actually solved. Then present the solution.',
        'Add natural, less designed subtitles — feels more authentic.',
        'Lower the music by 40% — it is dominating the experience.',
      ],
    },
    suggestions: {
      betterHooks: [
        '"I tried this many times and failed — until I discovered..." — personal story.',
        '"Most people do not know it is possible to..." — creates immediate curiosity.',
        '"This changed everything for me..." — emotional statement before explanation.',
      ],
      betterCaptions: [
        'The story no one told me about...',
        'How I discovered that... (did not know it was possible)',
        'I made this and could not believe the result',
      ],
      betterCTAs: [
        'Tell me in the comments — did you experience this too?',
        'Share with a friend dealing with the same problem',
        'Save before you forget — you will need this',
      ],
      storytellingDirection:
        'Move from "ad" to "story": open with your personal pain, present the journey, then show the solution as a natural result.',
      betterOpeningLines: [
        'I wasted money on this for a whole year — until I understood...',
        'This is one of the hardest things for me to admit.',
        'No one told me this when I started.',
      ],
      emotionalTriggers: [
        'Vulnerability: share a personal failure before presenting the solution.',
        'Recognition: "Did you experience this too?" — creates community.',
        'Inspiration: "If I could do it — so can you."',
      ],
      thumbnailIdeas: [
        'Genuine face, not over-styled, with honest text',
        'Visual before/after — real result with real numbers',
        'A frame from a genuine discovery moment in the video',
      ],
    },
    fixMyVideo: EN_FIXES_B,
    executiveSummary:
      'The video is technically professional but suffers from an "ad" feel that organic platform viewers recognize in one second. The problem is not the production — it is the strategy. Moving from "show → sell" to "story → see → trust" can completely transform this video performance.',
    overallVerdict:
      'A technically professional video that the algorithm will not like — viewers will scroll the moment they realise it is an ad.',
  },
  {
    scores: {
      viralPotential: 76, attention: 80, curiosity: 73, emotionalImpact: 71,
      rewatchPotential: 60, shareability: 78, commentPotential: 75,
      hookStrength: 68, pacing: 70, visualStimulation: 82,
    },
    feedback: {
      strengths: [
        'Strong hook — the first frame is intriguing and there is a clear start within one second.',
        'High visual stimulation — changes, movement, and varied angles maintain interest.',
        'Emotion is clear and working — connection between speaker and viewer felt in early frames.',
        'Strong editing pace in the first section — maintains retention at the critical stage.',
        'High visual quality — good lighting, sharp clarity, feels professional and organic.',
      ],
      weaknesses: [
        'The middle section loses some pace — about 10 seconds where frame changes slow down.',
        'The CTA at the end moves too fast — does not let the moment breathe before asking the viewer to act.',
        'No clear emotional peak — the video is strong but lacks a moment that compels sharing.',
      ],
      attentionDropPoints: [
        '22-32 seconds: Editing pace slows, fewer frame changes — small retention dip here.',
      ],
      pacingIssues: [
        'The middle section (seconds 20-35) is slightly long — consider trimming 8-10 seconds.',
      ],
      genericElements: [
        'The CTA at the end sounds like every other CTA — consider making it more specific.',
      ],
      strongElements: [
        'The opening — strong, immediate, visual.',
        'The emotion — genuine and working.',
        'The overall pace — maintains interest.',
      ],
      whatToCut: [
        'Trim seconds 22-30 — the weakest part of the video.',
        'Shorten the CTA — fewer words, more specificity.',
      ],
      immediateChanges: [
        'Add a clear emotional peak before the CTA — a strong quote, surprising number, or reaction.',
        'Speed up the middle section by 10-15% — it does not need to be that long.',
        'Make the CTA more specific to this content: "Share this with [specific audience]."',
      ],
    },
    suggestions: {
      betterHooks: [
        'The video already starts well — keep the formula and trim a second or two.',
        'You can add an intriguing question as text overlay on the opening.',
        '"What would happen if..." — specific to the topic, creates additional interest.',
      ],
      betterCaptions: [
        'The current caption works — keep this style.',
        'Try a version with a specific number: "3 things that..." / "X% of people..."',
        'Open question in the caption: "What do you think matters most?"',
      ],
      betterCTAs: [
        'Share this with someone who needs to hear it',
        'Comment if this helped you',
        'Save — come back to this',
      ],
      storytellingDirection:
        'The storytelling arc is already good. Add a clear emotional peak near the end before the CTA.',
      betterOpeningLines: [
        'The current opening is already strong — keep it.',
        'You could sharpen it with: "This was not what I expected to happen..."',
        '"No one told me this when I started."',
      ],
      emotionalTriggers: [
        'Add a brief moment of vulnerability — increases identification significantly.',
        'Specificity: real number, date, name — makes it more credible.',
      ],
      thumbnailIdeas: [
        'A frame from the strongest moment in the video — you already have great material.',
        'Facial expression from the emotional peak.',
        'Text overlay: the most impactful sentence from the video.',
      ],
    },
    fixMyVideo: EN_FIXES_C,
    executiveSummary:
      'This video is strong — the hook works, visual quality is high, and the emotion is present. The small issue is in the middle section that loses some pace, and an ending that does not let the moment settle before the CTA. With small changes to the middle and a strong emotional peak before the end, this video can be excellent.',
    overallVerdict:
      'A strong video with real viral potential — a few small refinements and this could be content that spreads.',
  },
];

// ─── Competitor data ───────────────────────────────────────────────────────────

const COMPETITOR_HE: CompetitorAnalysis = {
  competitorStrengths: [
    'פתיחה חזקה תוך שנייה אחת — ה-Hook מיידי ומסקרן.',
    'איכות ויזואלית גבוהה עם תאורה ומיקוד מקצועיים.',
    'קצב עריכה מהיר ועקבי שמונע נטישה.',
    'שימוש חכם בכתוביות גדולות ובולטות שמחזיקות גם את מי שצופה בשקט.',
  ],
  psychologicalTriggers: [
    'FOMO: יצירת תחושה ש"כולם כבר יודעים את זה חוץ ממך".',
    'Social proof: הצגת מספרים, תגובות, ותוצאות כדי לחזק אמינות.',
    'Pattern interrupt: שינוי פתאומי בקצב שמונע גלילה.',
    'Cliffhanger: הבטחת מידע שיינתן "רק בסוף הסרטון".',
  ],
  repeatingPatterns: [
    'הפתיחה תמיד מתחילה עם שאלה רטורית או הצהרה מפתיעה.',
    'שימוש עקבי ב-B-Roll שמחזק את הנאמר במילים.',
    'CTA בנוי מ-3 שלבים: בקשה, סיבה, פעולה.',
    'כמעט תמיד יש רגע אחד שמסוגל "להיחתך" כ-Clip עצמאי ויראלי.',
  ],
  whatUserCanImprove: [
    'הוסף כתוביות גדולות ובולטות לכל המשפטים המרכזיים — עד 85% מהצפיות הן בשקט.',
    'קצר את ה-Hook ל-1.5 שניות ראשונות — לא 4-5.',
    'בנה את ה-CTA סביב מעורבות ואינטראקציה, לא רק על "עקוב".',
    'הוסף רגע אחד לפחות שמתאים לשיתוף עצמאי כ-Clip קצר.',
  ],
  performanceReasons: [
    'הצופה מרגיש שהוא מקבל ערך מהיר — תוך 5 שניות ראשונות.',
    'הפורמט עקבי — הצופים יודעים מה לצפות וחוזרים.',
    'האלגוריתם מגביר פצתו כי שיעור שמירת הצפייה גבוה מ-60%.',
    'השיתוף נוצר כי יש בסרטון "מחץ" — רגע שאנשים רוצים לשלוח לאחרים.',
  ],
};

const COMPETITOR_EN: CompetitorAnalysis = {
  competitorStrengths: [
    'Strong opening within one second — hook is immediate and intriguing.',
    'High visual quality with professional lighting and focus.',
    'Fast consistent editing pace that prevents drop-off.',
    'Smart use of large bold subtitles that hold viewers watching on mute.',
  ],
  psychologicalTriggers: [
    'FOMO: creating a feeling that everyone already knows this except you.',
    'Social proof: displaying numbers, reactions, and results to reinforce credibility.',
    'Pattern interrupt: sudden change in pace or angle that prevents scrolling.',
    'Cliffhanger: promising information that will be given only at the end.',
  ],
  repeatingPatterns: [
    'The opening always starts with a rhetorical question or surprising statement.',
    'Consistent use of B-Roll that reinforces what is being said in words.',
    'CTA built in 3 steps: request, reason, action.',
    'Almost always has one moment that could be cut as an independent viral clip.',
  ],
  whatUserCanImprove: [
    'Add large bold subtitles to all key sentences — up to 85% of views are on mute.',
    'Shorten the hook to the first 1.5 seconds — not 4-5.',
    'Build the CTA around engagement and interaction, not just "follow."',
    'Add at least one moment suitable for independent sharing as a short clip.',
  ],
  performanceReasons: [
    'Viewers feel they are getting fast value — within the first 5 seconds.',
    'The format is consistent — viewers know what to expect and return.',
    'The algorithm boosts distribution because the retention rate is above 60%.',
    'Sharing is generated because there is a "punch" — a moment people want to send to others.',
  ],
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getDemoResult(
  context: SimpleVideoContext,
  delayMs = 1800
): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, delayMs));
  const pool = context.language === 'english' ? SCENARIOS_EN : SCENARIOS_HE;
  const scenario = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: uid(),
    scores: jitterScores(scenario.scores),
    feedback: scenario.feedback,
    suggestions: scenario.suggestions,
    fixMyVideo: scenario.fixMyVideo,
    executiveSummary: scenario.executiveSummary,
    overallVerdict: scenario.overallVerdict,
    createdAt: new Date().toISOString(),
  };
}

export async function getDemoCompetitorResult(
  language: string,
  delayMs = 900
): Promise<CompetitorAnalysis> {
  await new Promise((r) => setTimeout(r, delayMs));
  return language === 'english' ? COMPETITOR_EN : COMPETITOR_HE;
}
