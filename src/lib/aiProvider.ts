/**
 * AI Provider abstraction layer.
 *
 * AI_MODE=demo  → returns realistic fake results instantly (no API key needed)
 * AI_MODE=real  → calls the configured provider:
 *   AI_PROVIDER=openai  → uses OPENAI_API_KEY via openai.ts
 *   AI_PROVIDER=custom  → calls CUSTOM_AI_ENDPOINT with CUSTOM_AI_API_KEY
 *
 * The UI and API routes import ONLY from this file.
 */

import type {
  AnalysisResult,
  AnalysisScores,
  CompetitorAnalysis,
  SimpleVideoContext,
  VideoFrameData,
  VideoUnderstanding,
  PerceptionGap,
  ViewerPsychology,
  TimelineAnalysis,
  AdaptiveAnalysis,
  Recommendations,
  LanguageSafetyAnalysis,
  TranscriptData,
  ViralPotentialAnalysis,
} from '@/types';

// Default to 'real' when OPENAI_API_KEY is present; fall back to 'demo' only when no key configured
const AI_MODE = (process.env.AI_MODE ?? (process.env.OPENAI_API_KEY ? 'real' : 'demo')) as 'demo' | 'real';
const AI_PROVIDER = (process.env.AI_PROVIDER ?? 'openai') as 'openai' | 'custom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jitter(base: number, range = 7): number {
  return Math.max(1, Math.min(100, base + Math.floor(Math.random() * range * 2) - range));
}

function jitterScores(scores: AnalysisScores): AnalysisScores {
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, jitter(v as number)])
  ) as unknown as AnalysisScores;
}

// ─── Demo scenarios ───────────────────────────────────────────────────────────

type DemoScenario = Omit<AnalysisResult, 'id' | 'createdAt' | 'scores'> & {
  scores: AnalysisScores;
};

const DEMO_SCENARIOS_HE: DemoScenario[] = [
  // ── Scenario A: Hook weak, visual quality solid ──
  {
    scores: {
      viralPotential: 61,
      attention: 67,
      curiosity: 56,
      emotionalImpact: 54,
      rewatchPotential: 41,
      shareability: 63,
      commentPotential: 57,
      hookStrength: 37,
      pacing: 62,
      visualStimulation: 71,
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
        'הסיום חלש — לא ברור מה אתה רוצה שהצופה יעשה אחרי שגמר.',
        'בחלק האמצעי יש ירידה מורגשת בתנועה בין פריימים — קצב העריכה נהיה איטי.',
      ],
      attentionDropPoints: [
        'שנייה 0-4: פתיחה סטטית — זה הרגע שרוב הצופים יגללו הלאה.',
        'שנייה 18-25: ירידה בקצב עריכה, פחות שינויים. הצופה מאבד עניין.',
      ],
      pacingIssues: [
        'הקצב יציב מדי — אין שיאים או ירידות שיוצרים מסלול רגשי. הכל באותה עוצמה.',
        'החלק האמצעי ארוך יחסית לתוכן שיש בו — שקול לקצץ 20-25% ממנו.',
      ],
      genericElements: [
        'הפתיחה דומה לאלפי סרטונים אחרים — אין אלמנט שמייד אומר "זה שונה".',
        'ה-CTA בסוף גנרי מדי — "עקוב בשביל עוד תוכן" כבר לא עובד בשנת 2025.',
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
        'הוסף כתובית בולטת בפריים הראשון שמסכמת את הנושא בשלוש מילים.',
        'הוסף CTA ספציפי בסוף: "שמור את זה לשבת" / "שתף עם מי שצריך לשמוע".',
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
    fixMyVideo: [
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
    ],
    executiveSummary:
      'הסרטון מראה פוטנציאל ויזואלי טוב, אבל הבעיה המרכזית היא ה-Hook — הפתיחה לא עוצרת גלילה תוך 2 שניות. הגוף חזק אבל האנרגיה יורדת בחלק האמצעי. הסיום גנרי ולא ממיר. עם שינויים ספציפיים בפתיחה ובסיום, הסרטון הזה יכול להכפיל את שיעור השמירה.',
    overallVerdict:
      'סרטון עם פוטנציאל ויזואלי אמיתי שנפגע מפתיחה איטית וסיום חלש — ההבדל בין 300 ל-30,000 צפיות.',
  },

  // ── Scenario B: Looks too promotional, low authenticity ──
  {
    scores: {
      viralPotential: 47,
      attention: 52,
      curiosity: 44,
      emotionalImpact: 33,
      rewatchPotential: 28,
      shareability: 41,
      commentPotential: 38,
      hookStrength: 51,
      pacing: 58,
      visualStimulation: 64,
    },
    feedback: {
      strengths: [
        'האיכות הטכנית גבוהה — תאורה טובה, צלילה נקייה, ייצור מקצועי.',
        'הקצב מהיר יחסית — לא נגרר ויש מספיק חתכים.',
        'ה-Hook הויזואלי מספיק חזק כדי לתפוס את הפריים הראשון.',
      ],
      weaknesses: [
        'הסרטון מרגיש כמו פרסומת — לא כמו תוכן אורגני. הצופים בפלטפורמות אלו מזהים את זה תוך שניה ומגללים.',
        'אין רגש אמיתי. הכל נראה מעובד מדי — הבעות הפנים, הדיבור, הסביבה. זה מייצר מרחק.',
        'אין סיפור. מוצג מוצר/שירות/רעיון ישירות, בלי בניית הקשר רגשי קודם.',
        'אין נקודת זיהוי לצופה — לא ברור מה הכאב שלו ואיך זה עוזר לו ספציפית.',
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
        'הגרפיקה והסגנון הוויזואלי "מכריזים" שזה פרסומת.',
      ],
      strongElements: [
        'ייצור טכני מקצועי — אם תשנה את האסטרטגיה, הבסיס חזק.',
        'הפריים הראשון ויזואלית מסקרן.',
      ],
      whatToCut: [
        'קצץ כל את רשימת היתרונות — אחד ספציפי וממוקד שווה יותר מחמישה כלליים.',
        'הסר כל אלמנט שמזכיר "פרסומת": לוגו גדול בפתיחה, אנימציות תאגידיות, מוזיקת רקע גנרית.',
      ],
      immediateChanges: [
        'פתח עם סיפור אישי של 10 שניות — בעיה שהיוצר עצמו פתר. אז הצג את הפתרון.',
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
        'ספר לי בתגובות — גם אתה חוויתי את זה?',
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
        'זיהוי: "גם אתה חוויתי את זה?" — יוצר קהילה.',
        'השראה: "אם אני הצלחתי — גם אתה יכול".',
      ],
      thumbnailIdeas: [
        'פנים כנות, לא מאופרות יתר על המידה, עם טקסט אמיתי',
        'Before/After ויזואלי — תוצאה אמיתית עם מספרים',
        'פריים מתוך רגע "גילוי" אמיתי בסרטון',
      ],
    },
    fixMyVideo: [
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
        fix: 'הורד עוצמת מוזיקה ב-50%, או עבור למוזיקה יותר אורגנית ופחות "סינמטית".',
        type: 'music',
      },
      {
        timestamp: '0:40-0:50',
        issue: 'CTA מסחרי ישיר: "לחץ על הקישור בביו" — נשמע כמו פרסומת.',
        fix: 'בקש מהצופים לשתף חוויה בתגובות. מעורבות > קליק.',
        type: 'emotion',
      },
    ],
    executiveSummary:
      'הסרטון ייצורית מקצועי אבל נפגע מתחושת "פרסומת" שהצופים בפלטפורמות אורגניות מזהים תוך שנייה ומגיבים לה בגלילה. הבעיה היא לא הייצור — אלא האסטרטגיה. מעבר מפורמט "הצג → מכור" לפורמט "ספר → ראה → אמן" יכול לשנות את הביצועים של הסרטון הזה לחלוטין.',
    overallVerdict:
      'סרטון מקצועי מבחינה טכנית שהאלגוריתם לא יאהב — כי הצופים ילחצו "גלול" ברגע שיבינו שזו פרסומת.',
  },

  // ── Scenario C: Strong performer, minor refinements ──
  {
    scores: {
      viralPotential: 77,
      attention: 81,
      curiosity: 74,
      emotionalImpact: 72,
      rewatchPotential: 61,
      shareability: 79,
      commentPotential: 76,
      hookStrength: 69,
      pacing: 71,
      visualStimulation: 83,
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
        'אין רגע של "שיא" רגשי ברור — הסרטון חזק אבל לא יש בו רגע שמניע לשתף.',
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
    fixMyVideo: [
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
    ],
    executiveSummary:
      'הסרטון הזה חזק — ה-Hook עובד, האיכות הויזואלית גבוהה, והרגש נוכח. הבעיה הקטנה היא בחלק האמצעי שמאבד קצת קצב, ובסיום שלא נותן לרגע "לנחות" לפני ה-CTA. עם שינויים קלים בחלק האמצעי ורגע שיא חזק לפני הסוף, הסרטון הזה יכול להיות מצוין.',
    overallVerdict:
      'סרטון חזק עם פוטנציאל ויראלי אמיתי — עוד כמה שיפורים קטנים וזה יכול להיות תוכן שמתפשט.',
  },
];

const DEMO_SCENARIOS_EN: DemoScenario[] = [
  {
    scores: {
      viralPotential: 60,
      attention: 65,
      curiosity: 55,
      emotionalImpact: 52,
      rewatchPotential: 40,
      shareability: 62,
      commentPotential: 56,
      hookStrength: 36,
      pacing: 61,
      visualStimulation: 70,
    },
    feedback: {
      strengths: [
        'Strong visual quality — clear resolution, clean colors, and stable framing throughout.',
        'Good on-camera presence — direct eye contact and confident energy.',
        'Enough cuts in the middle section to maintain visual flow.',
      ],
      weaknesses: [
        'The opening is too slow — there are 4 static seconds before anything happens. On TikTok, 65% of viewers have already scrolled.',
        'The hook is not immediate: no question, promise, or emotional trigger in the first 2 seconds.',
        'Weak ending — not clear what you want the viewer to do after watching.',
        'Energy drops in the middle section — editing pace slows down noticeably.',
      ],
      attentionDropPoints: [
        '0-4 seconds: Static opening — this is the moment most viewers will scroll away.',
        '18-25 seconds: Slower edit pace, fewer frame changes. Viewer loses interest.',
      ],
      pacingIssues: [
        'Too consistent a pace — no peaks or valleys to create an emotional arc. Everything at the same intensity.',
        'The middle section is long relative to the content it contains.',
      ],
      genericElements: [
        'The opening looks like thousands of other videos — no element that immediately signals "this is different."',
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
        'Open with a provocative question or surprising statement within 1.5 seconds — not after.',
        'Add a bold subtitle in the first frame summarizing the topic in three words.',
        'Add a specific CTA at the end: "Save this for later" / "Share with someone who needs to hear this."',
      ],
    },
    suggestions: {
      betterHooks: [
        '"The biggest mistake you\'re making with..." — immediately creates disagreement and curiosity.',
        '"Here\'s how I got X in one week without..." — lead with the result they want.',
        '"Why does every video you make get under 500 views?" — instant recognition.',
      ],
      betterCaptions: [
        'The secret no one told you about...',
        '3 things that stopped my growth (and how I fixed it)',
        'Why most creators fail — and how to be different',
      ],
      betterCTAs: [
        'Save this video — you\'ll need it',
        'Share with a creator you know who\'s stuck',
        'Tell me in the comments: what\'s your biggest mistake?',
      ],
      storytellingDirection:
        'Build a "pain → discovery → solution" arc: present a problem in the first 3 seconds, the discovery at second 5-8, and a clear resolution at the end.',
      betterOpeningLines: [
        'If your videos get under 1,000 views — this is the one video you need to watch.',
        'I made this mistake for an entire year before I understood.',
        '90% of creators are doing this wrong.',
      ],
      emotionalTriggers: [
        'Curiosity: "Most people don\'t know this..."',
        'Recognition: "If you feel like the algorithm is working against you..."',
        'FOMO: "While you\'re reading this, your competitors are already..."',
      ],
      thumbnailIdeas: [
        'Surprised facial expression with large text: "❌ Not like this"',
        'Split screen: before and after with real numbers',
        'Direct eye contact, minimal text overlay on dark background',
      ],
    },
    fixMyVideo: [
      {
        timestamp: '0:00-0:04',
        issue: 'Static opening. Nothing is happening. Viewer will scroll at second 2.',
        fix: 'Cut these 4 seconds entirely. Start directly at the moment something happens — movement, speech, or text.',
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
        issue: 'The ending just stops — doesn\'t drive any action.',
        fix: 'Add a visual CTA: short animation, on-screen text, and a direct specific statement.',
        type: 'subtitle',
      },
    ],
    executiveSummary:
      'The video shows strong visual potential, but the core issue is the hook — the opening doesn\'t stop the scroll within 2 seconds. The body is solid but energy drops in the middle section. The ending is generic and doesn\'t convert. With specific changes to the opening and ending, this video can double its retention rate.',
    overallVerdict:
      'A video with real visual potential hurt by a slow opening and a weak ending — the difference between 300 and 30,000 views.',
  },
  {
    scores: {
      viralPotential: 46,
      attention: 51,
      curiosity: 43,
      emotionalImpact: 32,
      rewatchPotential: 27,
      shareability: 40,
      commentPotential: 37,
      hookStrength: 50,
      pacing: 57,
      visualStimulation: 63,
    },
    feedback: {
      strengths: [
        'High technical quality — good lighting, clean audio, professional production.',
        'Fast enough pace — no dragging, sufficient cuts.',
        'The visual hook is strong enough to capture the first frame.',
      ],
      weaknesses: [
        'It feels like an ad — not organic content. Viewers on these platforms spot this in one second and scroll.',
        'No real emotion. Everything looks too polished — expressions, speech, environment. Creates distance.',
        'No story. Product/service/idea presented directly, without first building emotional context.',
        'No viewer recognition point — unclear what their pain is and how this specifically helps.',
      ],
      attentionDropPoints: [
        '3-5 seconds: The moment it reads as "promotional" — most viewers exit.',
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
        'Remove every element that signals "ad": big logo at opening, corporate animations, generic background music.',
      ],
      immediateChanges: [
        'Open with a 10-second personal story — a problem you actually solved. Then present the solution.',
        'Add natural, less designed subtitles — feels more authentic.',
        'Lower the music by 40% — it\'s dominating the experience and reinforcing the ad feeling.',
      ],
    },
    suggestions: {
      betterHooks: [
        '"I tried this X times and failed — until I discovered..." — personal story.',
        '"Most people don\'t know it\'s possible to..." — creates immediate curiosity.',
        '"This changed my life..." — emotional statement before explanation.',
      ],
      betterCaptions: [
        'The story no one told me about...',
        'How I discovered that... (didn\'t know it was possible)',
        'I made this and couldn\'t believe the result',
      ],
      betterCTAs: [
        'Tell me in the comments — did you experience this too?',
        'Share with a friend dealing with the same problem',
        'Save before you forget — you\'ll need this',
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
        'A frame from a genuine "discovery" moment in the video',
      ],
    },
    fixMyVideo: [
      {
        timestamp: '0:00-0:05',
        issue: 'Opening looks like an ad — logo, corporate music, overly polished feel.',
        fix: 'Replace with your face within 0.5 seconds, with a personal and unscripted sentence.',
        type: 'cut',
      },
      {
        timestamp: '0:08-0:20',
        issue: 'Benefits list — stale and boring. Viewer already knows it\'s an "ad."',
        fix: 'Replace with one specific visual moment that shows a result. Don\'t tell — show.',
        type: 'cut',
      },
      {
        timestamp: '0:20-0:35',
        issue: 'Background music too loud — dominates the experience and reinforces "commercial" feel.',
        fix: 'Lower music volume by 50%, or switch to more organic, less "cinematic" music.',
        type: 'music',
      },
    ],
    executiveSummary:
      'The video is technically professional but suffers from an "ad" feel that organic platform viewers recognize in one second and respond to with scrolling. The problem isn\'t production — it\'s strategy. Moving from "show → sell" to "story → see → trust" can completely transform this video\'s performance.',
    overallVerdict:
      'A technically professional video that the algorithm won\'t like — because viewers will hit scroll the moment they realize it\'s an ad.',
  },
  {
    scores: {
      viralPotential: 76,
      attention: 80,
      curiosity: 73,
      emotionalImpact: 71,
      rewatchPotential: 60,
      shareability: 78,
      commentPotential: 75,
      hookStrength: 68,
      pacing: 70,
      visualStimulation: 82,
    },
    feedback: {
      strengths: [
        'Strong hook — the first frame is intriguing and there\'s a clear start within one second.',
        'High visual stimulation — changes, movement, and varied angles maintain interest.',
        'Emotion is clear and working — connection between speaker and viewer is felt in the early frames.',
        'Strong editing pace in the first section — maintains retention at the critical stage.',
        'High visual quality — good lighting, sharp clarity, feels professional and organic simultaneously.',
      ],
      weaknesses: [
        'The middle section loses some pace — about 10 seconds where frame changes slow down.',
        'The CTA at the end moves too fast — doesn\'t let the moment "breathe" before asking the viewer to act.',
        'There\'s no clear emotional peak — the video is strong but lacks a moment that compels sharing.',
      ],
      attentionDropPoints: [
        '22-32 seconds: Editing pace slows, fewer frame changes — small retention dip here.',
      ],
      pacingIssues: [
        'The middle section (seconds 20-35) is slightly long — consider trimming 8-10 seconds.',
      ],
      genericElements: [
        'The CTA at the end sounds like every other CTA — consider making it more specific to this content.',
      ],
      strongElements: [
        'The opening — strong, immediate, visual.',
        'The emotion — genuine and working.',
        'The overall pace — maintains interest.',
      ],
      whatToCut: [
        'Trim seconds 22-30 — they\'re the weakest part of the video.',
        'Shorten the CTA — fewer words, more specificity.',
      ],
      immediateChanges: [
        'Add a clear emotional peak before the CTA — a strong quote, surprising number, or emotional reaction.',
        'Speed up the middle section by 10-15% — it doesn\'t need to be that long.',
        'Make the CTA more specific to this content: "Share this with [specific audience]."',
      ],
    },
    suggestions: {
      betterHooks: [
        'The video already starts well — keep the formula and just trim a second or two.',
        'You can add an intriguing question as text overlay on the opening.',
        '"What would happen if..." — specific to the video\'s topic, creates additional interest.',
      ],
      betterCaptions: [
        'The current caption works — keep this style.',
        'Try a version with a specific number: "3 things that..." / "X% of people..."',
        'Open question in the caption: "What do you think matters most?"',
      ],
      betterCTAs: [
        'Share this with someone who needs to hear it',
        'Comment "✅" if this helped you',
        'Save — come back to this',
      ],
      storytellingDirection:
        'The storytelling arc is already good. Add a clear emotional peak near the end before the CTA.',
      betterOpeningLines: [
        'The current opening is already strong — keep it.',
        'You could sharpen it with: "This wasn\'t what I expected to happen..."',
        '"No one told me this when I started."',
      ],
      emotionalTriggers: [
        'Add a brief moment of vulnerability — increases identification by 30%.',
        'Specificity: real number, date, name — makes it more credible.',
      ],
      thumbnailIdeas: [
        'A frame from the strongest moment in the video — you already have great material.',
        'Facial expression from the video\'s emotional peak.',
        'Text overlay: the most impactful sentence from the video.',
      ],
    },
    fixMyVideo: [
      {
        timestamp: '0:22-0:32',
        issue: 'Editing pace slows — fewer frame changes, energy drops.',
        fix: 'Trim 8-10 seconds from this section. What remains will be much stronger.',
        type: 'cut',
      },
      {
        timestamp: '0:40-0:45',
        issue: 'No emotional peak before the CTA — the video "lands" flat.',
        fix: 'Add a powerful summary moment: quote, surprising number, or short emotional reaction.',
        type: 'emotion',
      },
      {
        timestamp: '0:48-0:52',
        issue: 'CTA moves too fast — doesn\'t allow the moment to breathe.',
        fix: 'Add 1.5 seconds of pause before the CTA, and deliver it slower and with more confidence.',
        type: 'zoom',
      },
    ],
    executiveSummary:
      'This video is strong — the hook works, visual quality is high, and the emotion is present. The small issue is in the middle section that loses some pace, and an ending that doesn\'t let the moment settle before the CTA. With small changes to the middle and a strong emotional peak before the end, this video can be excellent.',
    overallVerdict:
      'A strong video with real viral potential — a few small refinements and this could be content that spreads.',
  },
];

const DEMO_COMPETITOR_HE: CompetitorAnalysis = {
  competitorStrengths: [
    'פתיחה חזקה תוך שנייה אחת — ה-Hook מיידי ומסקרן.',
    'איכות ויזואלית גבוהה עם תאורה ומיקוד מקצועיים.',
    'קצב עריכה מהיר ועקבי שמונע נטישה.',
    'שימוש חכם בכתוביות גדולות ובולטות שמחזיקות גם את מי שצופה בשקט.',
  ],
  psychologicalTriggers: [
    'FOMO: יצירת תחושה ש"כולם כבר יודעים את זה חוץ ממך".',
    'Social proof: הצגת מספרים, תגובות, ותוצאות כדי לחזק אמינות.',
    'Pattern interrupt: שינוי פתאומי בקצב, זווית, או תוכן שמונע גלילה.',
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
    'הוסף רגע אחד לפחות שמתאים לשיתוף עצמאי כ-Reel קצר.',
  ],
  performanceReasons: [
    'הצופה מרגיש שהוא מקבל ערך מהיר — תוך 5 שניות ראשונות.',
    'הפורמט עקבי — הצופים יודעים מה לצפות וחוזרים.',
    'האלגוריתם מגביר פצתו כי שיעור שמירת הצפייה גבוה מ-60%.',
    'השיתוף נוצר כי יש בסרטון "מחץ" — רגע שאנשים רוצים לשלוח לאחרים.',
  ],
};

const DEMO_COMPETITOR_EN: CompetitorAnalysis = {
  competitorStrengths: [
    'Strong opening within one second — hook is immediate and intriguing.',
    'High visual quality with professional lighting and focus.',
    'Fast consistent editing pace that prevents drop-off.',
    'Smart use of large, bold subtitles that hold viewers watching on mute.',
  ],
  psychologicalTriggers: [
    'FOMO: creating a feeling that "everyone already knows this except you."',
    'Social proof: displaying numbers, reactions, and results to reinforce credibility.',
    'Pattern interrupt: sudden change in pace, angle, or content that prevents scrolling.',
    'Cliffhanger: promising information that will be given "only at the end of the video."',
  ],
  repeatingPatterns: [
    'The opening always starts with a rhetorical question or surprising statement.',
    'Consistent use of B-Roll that reinforces what\'s being said in words.',
    'CTA built in 3 steps: request, reason, action.',
    'Almost always has one moment that could be cut as an independent viral clip.',
  ],
  whatUserCanImprove: [
    'Add large, bold subtitles to all key sentences — up to 85% of views are on mute.',
    'Shorten the hook to the first 1.5 seconds — not 4-5.',
    'Build the CTA around engagement and interaction, not just "follow."',
    'Add at least one moment suitable for independent sharing as a short clip.',
  ],
  performanceReasons: [
    'Viewers feel they\'re getting fast value — within the first 5 seconds.',
    'The format is consistent — viewers know what to expect and return.',
    'The algorithm boosts distribution because the retention rate is above 60%.',
    'Sharing is generated because there\'s a "punch" — a moment people want to send to others.',
  ],
};

// ─── Demo mode ────────────────────────────────────────────────────────────────

function pickDemoScenario(language: string): DemoScenario {
  const pool = language === 'english' ? DEMO_SCENARIOS_EN : DEMO_SCENARIOS_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getDemoAnalysis(context: SimpleVideoContext): Promise<AnalysisResult> {
  // Realistic processing delay (2.5 – 4s)
  await new Promise((r) => setTimeout(r, 2500 + Math.random() * 1500));

  const scenario = pickDemoScenario(context.language);
  return {
    id: crypto.randomUUID(),
    scores: jitterScores(scenario.scores),
    feedback: scenario.feedback,
    suggestions: scenario.suggestions,
    fixMyVideo: scenario.fixMyVideo,
    executiveSummary: scenario.executiveSummary,
    overallVerdict: scenario.overallVerdict,
    createdAt: new Date().toISOString(),
  };
}

async function getDemoCompetitor(language: string): Promise<CompetitorAnalysis> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  return language === 'english' ? DEMO_COMPETITOR_EN : DEMO_COMPETITOR_HE;
}

// ─── Custom endpoint mode ─────────────────────────────────────────────────────

async function callCustomEndpoint(
  frameData: VideoFrameData,
  context: SimpleVideoContext
): Promise<AnalysisResult> {
  const endpoint = process.env.CUSTOM_AI_ENDPOINT;
  const apiKey = process.env.CUSTOM_AI_API_KEY;

  if (!endpoint) throw new Error('CUSTOM_AI_ENDPOINT is not set');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ frameData, context }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Custom endpoint returned ${res.status}: ${text}`);
  }

  const raw = await res.json();
  return {
    id: raw.id ?? crypto.randomUUID(),
    scores: raw.scores,
    feedback: raw.feedback,
    suggestions: raw.suggestions,
    fixMyVideo: raw.fixMyVideo ?? [],
    executiveSummary: raw.executiveSummary,
    overallVerdict: raw.overallVerdict,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

async function callCustomCompetitorEndpoint(
  competitorData: string,
  language: string
): Promise<CompetitorAnalysis> {
  const endpoint = process.env.CUSTOM_AI_ENDPOINT;
  const apiKey = process.env.CUSTOM_AI_API_KEY;

  if (!endpoint) throw new Error('CUSTOM_AI_ENDPOINT is not set');

  const res = await fetch(`${endpoint}/competitor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ competitorData, language }),
  });

  if (!res.ok) throw new Error(`Custom endpoint returned ${res.status}`);
  return res.json();
}

// ─── Demo understanding scenarios ─────────────────────────────────────────────

const DEMO_UNDERSTANDING_HE: VideoUnderstanding = {
  primaryType: 'organic-tiktok',
  secondaryType: 'storytelling',
  creatorIntent: 'לשתף חוויה אישית שתייצר זיהוי ומעורבות בקרב הקהל',
  viewerFirstImpression: 'נראה כמו תוכן אותנטי ואישי שעשוי להיות מעניין',
  confidence: 82,
};

const DEMO_UNDERSTANDING_EN: VideoUnderstanding = {
  primaryType: 'organic-tiktok',
  secondaryType: 'storytelling',
  creatorIntent: 'Share a personal experience to create audience recognition and engagement',
  viewerFirstImpression: 'Looks like authentic, personal content that might be interesting',
  confidence: 82,
};

async function getDemoUnderstanding(language: string): Promise<VideoUnderstanding> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  return language === 'english' ? DEMO_UNDERSTANDING_EN : DEMO_UNDERSTANDING_HE;
}

// ─── Public API ───────────────────────────────────────────────────────────────

// ─── Demo perception gap scenarios ────────────────────────────────────────────

const DEMO_PERCEPTION_GAPS_HE: PerceptionGap[] = [
  {
    alignmentScore: 38,
    creatorView: 'UGC אותנטי ואמיתי שנראה ספונטני',
    viewerView: 'פרסומת מאולתרת שמנסה להיראות אמיתית',
    mismatchExplained: 'ניסית לעשות UGC שנראה ספונטני, אבל הצילומים מסודרים מדי, התאורה מקצועית מדי, וכל פריים נראה "מוכן". הצופה מרגיש שמישהו שם מאמץ כדי להיראות כאילו לא שם מאמץ — וזה מה שהורג את האמינות.',
    topMismatches: [
      { aspect: 'אמינות', creatorThought: 'נראה אמיתי וספונטני', viewerFeels: 'נראה מוכן ומבוים', severity: 'high' },
      { aspect: 'טון', creatorThought: 'חבר שממליץ', viewerFeels: 'מוכר שמשכנע', severity: 'high' },
      { aspect: 'סביבה', creatorThought: 'טבעי ויומיומי', viewerFeels: 'סטאגד ומאורגן', severity: 'medium' },
    ],
    recommendation: 'צלם מחדש עם טלפון רגיל, ללא תאורה מיוחדת, ובמקום שבאמת נמצאים בו — לא "סביבה נכונה"',
    isAligned: false,
  },
  {
    alignmentScore: 72,
    creatorView: 'תוכן TikTok אורגני על חיי היומיום',
    viewerView: 'סרטון סיפור אישי עם גישה אמיתית',
    mismatchExplained: 'הסרטון קרוב למה שרצית לעשות, אבל הפתיחה נראית קצת מוכנה ביחס לשאר. הצופה נכנס לסרטון ומרגיש "וואו, סיפור" — אבל לוקח לו 4 שניות להבין שזה אורגני ולא מאורגן.',
    topMismatches: [
      { aspect: 'פתיחה', creatorThought: 'טבעית ומיידית', viewerFeels: 'קצת ממוסגרת', severity: 'medium' },
    ],
    recommendation: 'קצר את הפתיחה ב-2-3 שניות — תתחיל ישירות בתוך הרגע, לא לפניו',
    isAligned: false,
  },
  {
    alignmentScore: 86,
    creatorView: 'פרסומת מוצר ברורה עם CTA חזק',
    viewerView: 'פרסומת איכותית שנראית כמו תוכן אמיתי',
    mismatchExplained: 'הפרסומת עובדת כמו שצריך — הצופה מבין שזה פרסומת אבל לא מרגיש שהיא "דוחפת" אותו. הטון טבעי מספיק שהצופה נשאר, ומספיק ברור שהוא יודע מה אתה רוצה שיעשה.',
    topMismatches: [],
    recommendation: 'הוסף תגובה רגשית ספציפית אחת יותר לפני ה-CTA — "זה שינה לי את..." — ואז בקש',
    isAligned: true,
  },
];

const DEMO_PERCEPTION_GAPS_EN: PerceptionGap[] = [
  {
    alignmentScore: 38,
    creatorView: 'Authentic UGC that looks spontaneous',
    viewerView: 'A forced ad trying to look organic',
    mismatchExplained: "You tried to make UGC that looks spontaneous, but the shots are too composed, the lighting too professional, and every frame looks 'planned'. Viewers can feel someone tried hard to look effortless — and that's exactly what kills authenticity.",
    topMismatches: [
      { aspect: 'authenticity', creatorThought: 'Looks real and spontaneous', viewerFeels: 'Looks staged and prepared', severity: 'high' },
      { aspect: 'tone', creatorThought: 'A friend recommending', viewerFeels: 'A salesperson persuading', severity: 'high' },
      { aspect: 'environment', creatorThought: 'Natural and everyday', viewerFeels: 'Staged and organized', severity: 'medium' },
    ],
    recommendation: 'Reshoot with a regular phone, no special lighting, in a place where you actually are — not a "right environment"',
    isAligned: false,
  },
  {
    alignmentScore: 82,
    creatorView: 'Organic TikTok content about daily life',
    viewerView: 'A personal story with a genuine approach',
    mismatchExplained: "The video is close to what you wanted, but the opening looks a bit planned compared to the rest. Viewers enter and feel 'wow, a story' — but it takes them 4 seconds to understand it's organic and not staged.",
    topMismatches: [
      { aspect: 'opening', creatorThought: 'Natural and immediate', viewerFeels: 'Slightly framed', severity: 'medium' },
    ],
    recommendation: 'Cut the opening by 2-3 seconds — start directly inside the moment, not before it',
    isAligned: true,
  },
];

// ─── Demo adaptive analysis scenarios ─────────────────────────────────────────

const DEMO_ADAPTIVE_HE: AdaptiveAnalysis[] = [
  {
    profileType: 'conversion',
    metrics: [
      { key: 'cta',            label: 'כוח ה-CTA',       score: 43, explanation: 'ה-CTA קיים אבל לא בולט — הצופה לא בטוח מה בדיוק לעשות' },
      { key: 'persuasion',     label: 'כוח שכנוע',       score: 61, explanation: 'יש שכנוע, אבל הוא עובד לאט מדי לפרסומת' },
      { key: 'productClarity', label: 'בהירות המוצר',    score: 72, explanation: 'מבין מה מוכרים, אבל לא ברור מה המחיר או איפה לקנות' },
      { key: 'urgency',        label: 'תחושת דחיפות',    score: 28, explanation: 'אין שום סיבה לפעול עכשיו — אפשר לחזור לזה מחר' },
      { key: 'trustSignals',   label: 'אותות אמינות',    score: 55, explanation: 'נראה סביר, אבל אין הוכחות, ביקורות, או מספרים אמיתיים' },
      { key: 'purchaseIntent', label: 'כוונת רכישה',     score: 35, explanation: 'הצופה לא נדחף מספיק לפעולה' },
    ],
    topStrengths: ['המוצר ברור מבחינה ויזואלית', 'איכות הצילום מוסיפה אמינות', 'הפתיחה עוצרת את הפריים'],
    criticalFixes: [
      'הוסף CTA ספציפי עם דחיפות — "הזמן היום ב-20% הנחה, רק עד חצות"',
      'הוסף הוכחה חברתית: מספר לקוחות, ביקורת אמיתית, או תוצאה ספציפית',
      'קצר את הזמן עד ה-CTA — הוא מגיע מאוחר מדי',
    ],
    verdict: 'פרסומת עם פוטנציאל שחסרות לה דחיפות ו-CTA חזק — הצופה מבין את המוצר אבל לא נדחף לפעול',
  },
  {
    profileType: 'virality',
    metrics: [
      { key: 'scrollStopping', label: 'עצירת גלילה',     score: 71, explanation: 'הפריים הראשון עצר — יש כאן משהו שונה ממה שציפיתי' },
      { key: 'trendAlignment', label: 'התאמה לטרנד',     score: 63, explanation: 'מרגיש עדכני, אבל לא מיושר לטרנד ספציפי שרץ עכשיו' },
      { key: 'replayValue',    label: 'ערך צפייה חוזרת', score: 38, explanation: 'אין שום סיבה לצפות פעמיים — נגמר ועבר' },
      { key: 'addictiveness',  label: 'ממכריות',          score: 52, explanation: 'כמה רגעים מחזיקים, אבל אין "דופמין" אמיתי שמושך קדימה' },
      { key: 'sharingTrigger', label: 'טריגר שיתוף',     score: 41, explanation: 'לא הרגשתי שחייב לשלוח את זה לאף אחד' },
      { key: 'memorability',   label: 'זכירות',           score: 46, explanation: 'שעה אחר כך — לא בטוח שיזכרו שראו את זה' },
    ],
    topStrengths: ['הפתיחה עוצרת גלילה', 'הקצב מתאים לפלטפורמה', 'הוויזואל נקי ומסקרן'],
    criticalFixes: [
      'בנה רגע "גילוי" שמביא לצפייה חוזרת — משהו שמשתנה כשמבינים אותו',
      'הוסף אלמנט שמניע לשיתוף: twist בסוף, ציטוט שמחרה, או רגע מפתיע',
      'חדד לדבר אחד ספציפי — תוכן שמנסה לתפוס הכל לא נזכר',
    ],
    verdict: 'סרטון עם פתיחה טובה שמפסיד ויראליות בגלל חוסר ב-replay value ו-sharing trigger',
  },
];

const DEMO_ADAPTIVE_EN: AdaptiveAnalysis[] = [
  {
    profileType: 'authenticity',
    metrics: [
      { key: 'naturalness',  label: 'Naturalness',     score: 49, explanation: "Feels slightly rehearsed — like they knew exactly what they'd say before filming" },
      { key: 'trustFactor',  label: 'Trust Factor',    score: 61, explanation: "Seems like a real person, but the setup feels a bit too clean" },
      { key: 'realism',      label: 'Realism',         score: 57, explanation: "The environment is a bit too arranged — real life is messier than this" },
      { key: 'relatability', label: 'Relatability',    score: 64, explanation: "The situation is relatable, even if the delivery feels polished" },
      { key: 'credibility',  label: 'Credibility',     score: 53, explanation: "Hard to tell if this is a real user or a paid creator" },
      { key: 'socialProof',  label: 'Social Proof',    score: 40, explanation: "No real-world validation — no numbers, no receipts, no reactions from others" },
    ],
    topStrengths: ['Relatable scenario', 'Decent on-camera presence', 'Clear message'],
    criticalFixes: [
      'Add real social proof — numbers, receipts, or reactions from actual users',
      'Make the environment messier and more natural — the setup looks too staged',
      'Drop the scripted delivery — start mid-sentence, mid-action, mid-life',
    ],
    verdict: 'UGC that tries to feel real but comes across as slightly staged — experienced viewers will notice',
  },
];

async function getDemoAdaptive(language: string): Promise<AdaptiveAnalysis> {
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 800));
  const pool = language === 'english' ? DEMO_ADAPTIVE_EN : DEMO_ADAPTIVE_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Demo timeline scenarios ───────────────────────────────────────────────────

const DEMO_TIMELINES_HE: TimelineAnalysis[] = [
  {
    moments: [
      { startSec: 0, endSec: 2, quality: 'critical', issue: 'hook-weak', title: 'פתיחה ריקה', description: 'שתי שניות עברו ולא קרה כלום — הצופה עוד לא מבין למה הוא צריך להישאר', fix: 'התחל ישירות מהרגע שמשהו קורה — קצץ את ה-0-2 שניות הראשונות' },
      { startSec: 2, endSec: 6, quality: 'neutral', title: 'כניסה לנושא', description: 'הצופה מתחיל להבין על מה הסרטון, אבל עדיין לא מרגיש שיש כאן ערך' },
      { startSec: 6, endSec: 11, quality: 'good', title: 'הסרטון תופס קצב', description: 'יש משהו מסקרן כאן — הצופה נשאר' },
      { startSec: 11, endSec: 17, quality: 'weak', issue: 'pacing-slow', title: 'הקצב נופל', description: 'פחות תנועה בין פריימים, האנרגיה יורדת — כאן חלק מהצופים יגללו', fix: 'האץ את הקצב ב-15% או הוסף חתך נוסף בשנייה 13-14' },
      { startSec: 17, endSec: 23, quality: 'strong', title: 'שיא הסרטון', description: 'הרגע הכי חזק — הצופה מרוכז ומעורב' },
      { startSec: 23, endSec: 28, quality: 'neutral', title: 'ירידה מהשיא', description: 'הרגע הטוב עבר, הסרטון מתחיל להסתכם' },
      { startSec: 28, endSec: 33, quality: 'weak', issue: 'cta-weak', title: 'CTA חלש', description: 'הסרטון נגמר בלי לבקש שום דבר ספציפי — הצופה יגלול הלאה', fix: 'הוסף CTA ברור: "שמור את זה" / "שתף עם מישהו" — מילה אחת, פעולה אחת' },
    ],
    criticalDropSec: 1,
    bestMomentSec: 19,
    retentionEstimate: 34,
    summary: 'הבעיה הגדולה ביותר היא הפתיחה — שתי שניות ריקות שהורגות 40% מהצופים לפני שהסרטון בכלל מתחיל. החלק האמצעי עובד, אבל הירידה בשנייה 11-17 מסוכנת. הסיום חלש ולא ממיר.',
  },
  {
    moments: [
      { startSec: 0, endSec: 2, quality: 'strong', title: 'הוק מיידי', description: 'הפריים הראשון עוצר גלילה — ברור שיש פה משהו' },
      { startSec: 2, endSec: 5, quality: 'good', title: 'בניית עניין', description: 'הסרטון בונה מתח טוב — הצופה רוצה לדעת מה יהיה' },
      { startSec: 5, endSec: 10, quality: 'strong', title: 'שיא הסרטון', description: 'זה הרגע הכי חזק — קצב, אנרגיה, ורגש ביחד' },
      { startSec: 10, endSec: 16, quality: 'good', title: 'ממשיכים חזק', description: 'הסרטון שומר על הקצב — הצופה לא חושב לגלול' },
      { startSec: 16, endSec: 22, quality: 'neutral', issue: 'pacing-slow', title: 'קצב קצת יורד', description: 'יש ירידה קטנה — לא מספיקה לגרום לנטישה, אבל מורגשת', fix: 'קצץ 2-3 שניות מהחלק הזה' },
      { startSec: 22, endSec: 27, quality: 'good', title: 'חזרה לקצב', description: 'הסרטון מסיים חזק יחסית' },
      { startSec: 27, endSec: 30, quality: 'strong', title: 'CTA עובד', description: 'הסיום ברור ומניע לפעולה — הצופה יודע מה לעשות' },
    ],
    criticalDropSec: null,
    bestMomentSec: 7,
    retentionEstimate: 68,
    summary: 'סרטון חזק עם הוק טוב ושיא ברור. הבעיה היחידה היא ירידה קטנה בקצב בשנייה 16-22 שאפשר לתקן בקיצוץ קצר. 68% מהצופים יגיעו לסוף — זה טוב מאוד.',
  },
];

const DEMO_TIMELINES_EN: TimelineAnalysis[] = [
  {
    moments: [
      { startSec: 0, endSec: 3, quality: 'critical', issue: 'hook-weak', title: 'Dead opening', description: 'Three seconds passed and nothing happened — viewer has no reason to stay', fix: 'Start mid-action. Cut everything before the moment something actually happens' },
      { startSec: 3, endSec: 7, quality: 'neutral', title: 'Setting the topic', description: 'Viewer starts understanding the subject but still no clear value signal' },
      { startSec: 7, endSec: 13, quality: 'good', title: 'Video finds its pace', description: 'Something interesting is happening — viewer stays' },
      { startSec: 13, endSec: 19, quality: 'weak', issue: 'pacing-slow', title: 'Pacing drops', description: 'Less movement between frames, energy falls — some viewers will scroll here', fix: 'Speed up 15% or add a cut at second 15 to inject energy' },
      { startSec: 19, endSec: 25, quality: 'strong', title: 'Video peaks', description: 'Strongest moment — viewer is focused and engaged' },
      { startSec: 25, endSec: 30, quality: 'weak', issue: 'cta-weak', title: 'Weak ending', description: 'Video ends without asking for anything specific — viewer scrolls on', fix: 'Add one specific CTA: "Save this" / "Share with someone who needs it"' },
    ],
    criticalDropSec: 2,
    bestMomentSec: 21,
    retentionEstimate: 31,
    summary: 'The opening kills this video before it starts — three dead seconds that lose 40% of viewers. The middle section recovers well but pacing drops at 13-19 seconds. The ending is generic and converts no one.',
  },
];

async function getDemoTimeline(language: string): Promise<TimelineAnalysis> {
  await new Promise((r) => setTimeout(r, 1600 + Math.random() * 900));
  const pool = language === 'english' ? DEMO_TIMELINES_EN : DEMO_TIMELINES_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Demo viewer psychology scenarios ─────────────────────────────────────────

const DEMO_PSYCHOLOGY_HE: ViewerPsychology[] = [
  {
    attention:          { score: 62, explanation: 'הפתיחה תפסה אותי, אבל אחרי 5 שניות התחלתי לחשוב "לאן זה הולך?"' },
    curiosity:          { score: 54, explanation: 'לא ממש חיכיתי בדריכות — ידעתי בערך לאן זה מגיע' },
    trust:              { score: 58, explanation: 'נראה בסדר, אבל לא הרגשתי שאני מכיר את הבן אדם הזה' },
    authenticity:       { score: 45, explanation: 'קצת "מוכן" — כמו שמישהו תרגל את זה לפני הצילום' },
    emotionalConnection:{ score: 41, explanation: 'לא נגע בי — תוכן סבבה, לא יותר מזה' },
    scrollStoppingPower:{ score: 63, explanation: 'הפריים הראשון עצר אותי, אבל בשנייה 4 כבר חשבתי לגלול' },
    boredom:            { score: 48, explanation: 'לא שיעמם אותי, אבל לא הייתי עסוק רגשית' },
    confusion:          { score: 18, explanation: 'הכל ברור — ידעתי מה קורה' },
    whyStay: ['הפריים הראשון נראה שונה ממה שציפיתי', 'הייתי סקרן לראות איך זה נגמר', 'הקצב לא היה איטי מדי'],
    whyLeave: ['לא הרגשתי שיש כאן "כאב" שאני מזדהה איתו', 'לא ברור לי מה אני מקבל מזה', 'תוכן שראיתי בגרסאות אחרות'],
    authenticityExplained: 'הסרטון נראה נכון, אבל משהו בו "נשמע מוכן". כאילו מישהו בנה את זה בכוונה לנראות ספונטני.',
    emotionExplained: 'לא הגעתי לשום רגש אמיתי. מעניין? כן. נוגע? לא.',
  },
  {
    attention:          { score: 84, explanation: 'לא הרפה ממני — כל שנייה הייתה סיבה להישאר' },
    curiosity:          { score: 79, explanation: 'רציתי לדעת מה יהיה — היה שם מתח טבעי' },
    trust:              { score: 77, explanation: 'הרגשתי שזה בן אדם אמיתי שמבין על מה הוא מדבר' },
    authenticity:       { score: 82, explanation: 'נראה ספונטני — לא כמו שצולם עשר פעמים ונבחר הגרסה הטובה' },
    emotionalConnection:{ score: 71, explanation: 'הזדהיתי — הרגשתי שזה מדבר ספציפית אליי' },
    scrollStoppingPower:{ score: 88, explanation: 'עצרתי מיד — הפריים הראשון היה שונה ממה שצפיתי' },
    boredom:            { score: 15, explanation: 'בכלל לא — נגמר מהר מדי בשבילי' },
    confusion:          { score: 10, explanation: 'מסר ברור מהשנייה הראשונה' },
    whyStay: ['הסיפור המשיך להתפתח בצורה שלא ניחשתי', 'הרגשתי שיש פה ערך אמיתי', 'הצד הרגשי תפס אותי לפני שהספקתי לחשוב'],
    whyLeave: ['בחלק האמצעי הייתה ירידה קטנה בקצב', 'ה-CTA היה קצת פתאומי', 'לא הכרתי את האדם הזה מקודם'],
    authenticityExplained: 'זה מרגיש אמיתי — כמו שמישהו שיתף משהו שבאמת קרה לו, לא כמו שהוא מנסה למכור לי.',
    emotionExplained: 'הייתה שם רגש. לא גדולה, אבל כן. הרגשתי שאני לא לבד במה שהוא חווה.',
  },
];

const DEMO_PSYCHOLOGY_EN: ViewerPsychology[] = [
  {
    attention:          { score: 68, explanation: 'Caught my eye at first, but the middle section drifted off' },
    curiosity:          { score: 61, explanation: "There was some pull to keep watching, but nothing urgent" },
    trust:              { score: 63, explanation: 'Seemed credible but I didn\'t feel like I knew them' },
    authenticity:       { score: 55, explanation: 'Felt slightly rehearsed — like they tried hard to look natural' },
    emotionalConnection:{ score: 49, explanation: "Couldn't connect personally — nothing hit home for me" },
    scrollStoppingPower:{ score: 71, explanation: 'Good opening frame, then the grip loosened' },
    boredom:            { score: 42, explanation: 'Not boring exactly, but not gripping either' },
    confusion:          { score: 15, explanation: 'Message stayed clear throughout' },
    whyStay: ['The opening frame was visually unexpected', 'Decent pacing kept things moving', 'Wanted to see how it ended'],
    whyLeave: ['Nothing felt personally relevant to me', 'No emotional hook to hold on to', "Content I've seen in different forms before"],
    authenticityExplained: 'It feels slightly staged — like the person knew the camera was rolling and adjusted accordingly. Hard to pinpoint, but it\'s there.',
    emotionExplained: 'Never reached an emotional beat — informative content, but nothing that touched me.',
  },
];

async function getDemoViewerPsychology(language: string): Promise<ViewerPsychology> {
  await new Promise((r) => setTimeout(r, 1400 + Math.random() * 900));
  const pool = language === 'english' ? DEMO_PSYCHOLOGY_EN : DEMO_PSYCHOLOGY_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getDemoPerception(language: string): Promise<PerceptionGap> {
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
  const pool = language === 'english' ? DEMO_PERCEPTION_GAPS_EN : DEMO_PERCEPTION_GAPS_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function understandVideo(
  frameData: VideoFrameData,
  language: string
): Promise<VideoUnderstanding> {
  if (AI_MODE === 'demo') {
    return getDemoUnderstanding(language);
  }
  const { understandVideo: openaiUnderstand } = await import('./openai');
  return openaiUnderstand(frameData, language);
}

export async function analyzePerceptionGap(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<PerceptionGap> {
  if (AI_MODE === 'demo') {
    return getDemoPerception(context.language);
  }
  const { analyzePerceptionGap: openaiPerception } = await import('./openai');
  return openaiPerception(frameData, context, understanding);
}

export async function analyzeVideo(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  transcriptData?: TranscriptData | null
): Promise<AnalysisResult> {
  if (AI_MODE === 'demo') {
    return getDemoAnalysis(context);
  }

  if (AI_PROVIDER === 'custom') {
    return callCustomEndpoint(frameData, context);
  }

  // Default: OpenAI
  const { analyzeVideo: openaiAnalyze } = await import('./openai');
  return openaiAnalyze(frameData, context, transcriptData);
}

export async function analyzeAdaptive(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<AdaptiveAnalysis> {
  if (AI_MODE === 'demo') {
    return getDemoAdaptive(context.language);
  }
  const { analyzeAdaptive: openaiAdaptive } = await import('./openai');
  return openaiAdaptive(frameData, context, understanding);
}

export async function analyzeTimeline(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<TimelineAnalysis> {
  if (AI_MODE === 'demo') {
    return getDemoTimeline(context.language);
  }
  const { analyzeTimeline: openaiTimeline } = await import('./openai');
  return openaiTimeline(frameData, context, understanding);
}

export async function analyzeViewerPsychology(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<ViewerPsychology> {
  if (AI_MODE === 'demo') {
    return getDemoViewerPsychology(context.language);
  }
  const { analyzeViewerPsychology: openaiPsychology } = await import('./openai');
  return openaiPsychology(frameData, context, understanding);
}

// ─── Demo recommendations scenarios ───────────────────────────────────────────

const DEMO_RECOMMENDATIONS_HE: Recommendations[] = [
  {
    sections: [
      {
        category: 'hook',
        recommendations: [
          {
            priority: 'critical',
            title: 'הפתיחה מאבדת חצי מהצופים',
            problem: 'ציר הזמן מראה שנייה 0-2 בדרגת איכות "critical" עם hook-weak — ה-scrollStoppingPower עמד על 63 בלבד. 40% מהצופים כבר גללו לפני שמשהו קרה.',
            fix: 'גזור את כל שנייה 0-3 ותתחיל ישירות מהרגע שמשהו קורה — תנועה, דיבור, או טקסט גדול על מסך.',
            example: 'במקום "היי, שמי..." — "עשיתי את הטעות הזו שנה שלמה לפני שהבנתי."',
          },
          {
            priority: 'high',
            title: 'אין שאלה או הבטחה בשנייה הראשונה',
            problem: 'ה-curiosity עמד על 54 — הצופה לא הרגיש שיש כאן משהו שחייב לראות. הפתיחה לא יצרה מתח.',
            fix: 'הוסף שאלה מסקרנת או הצהרה מפתיעה בשלוש המילים הראשונות — לפני שאתה מסביר כלום.',
          },
        ],
      },
      {
        category: 'cta',
        recommendations: [
          {
            priority: 'critical',
            title: 'אין שום דחיפות ב-CTA',
            problem: 'ניתוח ה-Adaptive זיהה urgency=28/100 — הצופה לא מרגיש שום סיבה לפעול עכשיו. אפשר לחזור לזה מחר.',
            fix: 'הוסף אלמנט זמן-אמת: "עד סוף השבוע", "100 מקומות ראשונים", או "המחיר עולה ביום ראשון".',
            example: '"הזמן היום ב-20% הנחה — ההצעה תפוג בחצות"',
          },
          {
            priority: 'high',
            title: 'ה-CTA מגיע אחרי שרוב הצופים כבר עזבו',
            problem: 'שיעור השמירה הוערך ב-34% — כשה-CTA הגיע, 66% מהצופים כבר לא היו שם. ה-purchaseIntent עמד על 35.',
            fix: 'הוסף גרסה קצרה של ה-CTA גם בשנייה 8-10 — לא רק בסוף.',
          },
        ],
      },
      {
        category: 'authenticity',
        recommendations: [
          {
            priority: 'high',
            title: 'חסרה הוכחה חברתית אמיתית',
            problem: 'ה-trustSignals עמד על 55/100 — הצופה לא מאמין מספיק. זיהוי הפער: "מוכר שמשכנע" במקום "חבר שממליץ".',
            fix: 'הוסף 3-5 שניות של תגובת לקוח, צילום מסך של ביקורת, או מספר לקוחות ספציפי.',
            example: '"יותר מ-2,000 לקוחות השתמשו בזה החודש — כולל [שם+עיר]"',
          },
        ],
      },
      {
        category: 'fix',
        recommendations: [
          {
            priority: 'medium',
            title: 'קצץ שנייה 11-17',
            problem: 'ציר הזמן מזהה שנייה 11-17 כ"weak" עם pacing-slow — פחות תנועה בין פריימים. שיעור השמירה נחלש.',
            fix: 'גזור 4-5 שניות מהאזור הזה. הוסף חתך נוסף בשנייה 13 כדי לשמור על אנרגיה.',
          },
        ],
      },
    ],
    priorityAction: 'הוסף אלמנט דחיפות ל-CTA — מחיר, כמות מוגבלת, או תאריך — זה הדבר הבודד שישפר הכי הרבה את שיעור ההמרה',
    potentialGain: 27,
  },
  {
    sections: [
      {
        category: 'hook',
        recommendations: [
          {
            priority: 'high',
            title: 'הפתיחה נראית מוכנה מדי',
            problem: 'פער התפיסה: alignment score 38/100, ה-viewer רואה "פרסומת מאולתרת" במקום UGC. ה-authenticity עמד על 45 — "קצת מוכן, כמו שמישהו תרגל לפני הצילום".',
            fix: 'צלם מחדש עם טלפון, ללא תאורה מיוחדת, באמצע פעולה שאתה כבר עושה — לא "מתכונן לצלם".',
            example: 'במקום לשבת ולהסתכל למצלמה — צלם תוך כדי שאתה מוריד מוצר, פותח חבילה, או הולך.',
          },
        ],
      },
      {
        category: 'authenticity',
        recommendations: [
          {
            priority: 'critical',
            title: 'הסרטון מרגיש כמו פרסומת',
            problem: 'פער התפיסה חמור: מה שהצופה מרגיש = "פרסומת מאולתרת שמנסה להיראות אמיתית". Trust=58, authenticity=45.',
            fix: 'הוסף רגע של כישלון אמיתי, הפתעה, או תגובה ספונטנית לפני שאתה מציג את הפתרון.',
          },
          {
            priority: 'high',
            title: 'הסביבה נראית סטייגד',
            problem: 'מתוך ניתוח הפער: "סביבה: יוצר חשב — טבעי ויומיומי | צופה מרגיש — סטאגד ומאורגן" [medium severity].',
            fix: 'צלם במקום שאתה נמצא בו ממילא — לא "הסביבה הנכונה". פחות סדר = יותר אמינות.',
          },
        ],
      },
      {
        category: 'emotion',
        recommendations: [
          {
            priority: 'high',
            title: 'אין רגע של חיבור אישי',
            problem: 'emotionalConnection=41 — "לא נגע בי, תוכן סבבה, לא יותר מזה". הצופה לא מוצא נקודת זיהוי.',
            fix: 'פתח עם 5 שניות של הכאב האישי שלך — לפני שאתה מציג כלום. "הייתי בדיוק במצב שאתה נמצא בו."',
          },
        ],
      },
      {
        category: 'fix',
        recommendations: [
          {
            priority: 'medium',
            title: 'הורד את עוצמת המוזיקה',
            problem: 'הסרטון נשמע כמו פרסומת — חלקית בגלל מוזיקת רקע שולטת. זה מחזק את תחושת ה-"מסחרי" שהצופה מזהה.',
            fix: 'הורד את עוצמת המוזיקה ב-40-50%, או עבור למוזיקה אורגנית יותר כמו lo-fi אקוסטי.',
          },
        ],
      },
    ],
    priorityAction: 'צלם מחדש את הפתיחה — 10 שניות, טלפון, ללא תאורה, ממש תוך כדי שאתה עושה משהו. זה יקפיץ את ה-alignment score מ-38 ל-70+',
    potentialGain: 22,
  },
];

const DEMO_RECOMMENDATIONS_EN: Recommendations[] = [
  {
    sections: [
      {
        category: 'hook',
        recommendations: [
          {
            priority: 'critical',
            title: 'Opening kills half your viewers',
            problem: 'Timeline shows 0-3s as critical quality with hook-weak. scrollStoppingPower is 71 — enough to stop the scroll, but boredom kicks in immediately after.',
            fix: 'Cut everything before the first moment of movement or speech. Start mid-action, mid-sentence, mid-life.',
            example: 'Instead of "Hey guys, today I want to talk about..." → "I spent three years doing it wrong before I figured this out."',
          },
        ],
      },
      {
        category: 'pacing',
        recommendations: [
          {
            priority: 'high',
            title: 'Dead zone at seconds 13-19',
            problem: 'Timeline: seconds 13-19 rated weak with pacing-slow. Fewer frame changes, energy drops. Retention estimate: 31% — most viewers are already gone by here.',
            fix: 'Speed up 15% or add a cut at second 15. Remove 3-4 seconds from this section entirely.',
          },
        ],
      },
      {
        category: 'emotion',
        recommendations: [
          {
            priority: 'high',
            title: 'No emotional hook to hold on to',
            problem: "emotionalConnection=49, emotionExplained: 'Never reached an emotional beat — informative content but nothing that touched me.' Viewers have no personal reason to care.",
            fix: 'Add a 5-second personal moment of vulnerability before delivering your main point. Make it about a failure, not a win.',
          },
        ],
      },
      {
        category: 'authenticity',
        recommendations: [
          {
            priority: 'high',
            title: 'Delivery feels rehearsed',
            problem: "authenticity=55: 'Feels slightly rehearsed — like they tried hard to look natural.' Trust=63. Viewers sense the script.",
            fix: 'Record 5 takes without a script — just talk. Use the most natural one, even if it has a stumble.',
            example: 'Add one unscripted sentence mid-video that references something happening right now, in real time.',
          },
        ],
      },
      {
        category: 'fix',
        recommendations: [
          {
            priority: 'medium',
            title: 'Add a specific CTA at the end',
            problem: "Timeline shows the ending as weak with cta-weak. 'Video ends without asking for anything specific — viewer scrolls on.'",
            fix: 'One action, one sentence: "Save this if it helped" or "Share with someone dealing with [specific problem]."',
          },
        ],
      },
    ],
    priorityAction: 'Cut the dead opening (0-3 seconds) and start mid-action — this single change can lift retention by 15-20 percentage points based on the timeline data',
    potentialGain: 21,
  },
];

async function getDemoRecommendations(language: string): Promise<Recommendations> {
  await new Promise((r) => setTimeout(r, 1700 + Math.random() * 900));
  const pool = language === 'english' ? DEMO_RECOMMENDATIONS_EN : DEMO_RECOMMENDATIONS_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function analyzeRecommendations(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding,
  perceptionGap: PerceptionGap | null,
  viewerPsychology: ViewerPsychology | null,
  timelineAnalysis: TimelineAnalysis | null,
  adaptiveAnalysis: AdaptiveAnalysis | null
): Promise<Recommendations> {
  if (AI_MODE === 'demo') {
    return getDemoRecommendations(context.language);
  }
  const { analyzeRecommendations: openaiRecs } = await import('./openai');
  return openaiRecs(frameData, context, understanding, perceptionGap, viewerPsychology, timelineAnalysis, adaptiveAnalysis);
}

export async function analyzeCompetitor(
  competitorData: string,
  language: string
): Promise<CompetitorAnalysis> {
  if (AI_MODE === 'demo') {
    return getDemoCompetitor(language);
  }

  if (AI_PROVIDER === 'custom') {
    return callCustomCompetitorEndpoint(competitorData, language);
  }

  const { analyzeCompetitor: openaiCompetitor } = await import('./openai');
  return openaiCompetitor(competitorData, language);
}

// ─── Demo language safety scenarios ───────────────────────────────────────────

const DEMO_LANGUAGE_HE: LanguageSafetyAnalysis[] = [
  {
    overallLevel: 'moderate',
    helpsOrHurts: 'helps',
    authenticityScore: 81,
    adFriendly: false,
    signals: [
      {
        category: 'slang',
        detected: 'ביטויי רחוב ושפה יומיומית לא פורמלית',
        effect: 'helps',
        reachImpact: 'לא משפיע על ה-reach האורגני — אלגוריתם TikTok לא מסנן סלנג',
        viewerReaction: 'הצופה מרגיש שמדברים אליו ולא אליו — זה בדיוק מה שגורם לאנשים לשלוח לחברים',
        adFriendly: true,
        platformNote: 'TikTok ו-Instagram תואמים, YouTube עשוי לסנן חלקית',
      },
      {
        category: 'emotional',
        detected: 'שפה רגשית עמוקה — תסכול, ניצחון, הזדהות',
        effect: 'helps',
        reachImpact: 'שפה רגשית מגדילה את זמן הצפייה ב-18-25% לפי נתוני TikTok פנימיים',
        viewerReaction: 'הצופה מרגיש שמישהו מדבר בשמו — מגדיל תגובות ושיתופים',
        adFriendly: true,
      },
      {
        category: 'profanity',
        detected: 'קללה קלה אחת (mild) שאינה מכוונת לאף אחד',
        effect: 'neutral',
        reachImpact: 'קללה בודדת לא חוסמת reach — אבל מונעת ads monetization',
        viewerReaction: 'רוב הצופים יתעלמו — ייתכן שחלק ירגישו שזה "אמיתי יותר"',
        adFriendly: false,
        platformNote: 'YouTube תייתג לסכמה מוגבלת, TikTok בדרך כלל לא יחסום',
      },
    ],
    platformImpacts: [
      { platform: 'tiktok', impact: 'none', note: 'התוכן תואם לגמרי — TikTok מעודד שפה אנושית ואותנטית' },
      { platform: 'instagram', impact: 'none', note: 'ריל תואם — הטון מתאים לפלטפורמה' },
      { platform: 'youtube', impact: 'minor', note: 'הקללה תגרום לסכמה מוגבלת — לא לחסימה. שקול לערוך אם monetization חשוב לך' },
    ],
    summary: 'השפה בסרטון הזה היא נכס — לא בעיה. הסלנג והרגש שאתה משתמש בהם יוצרים חיבור אמיתי עם קהל היעד. הקללה הבודדת לא תחסום reach אבל תמנע monetization ב-YouTube אם זה רלוונטי.',
    recommendation: 'אל תשנה שום דבר מבחינת הטון והשפה — זה עובד. אם YouTube monetization חשוב לך, שקול לערוך רק את הקללה הבודדת.',
  },
  {
    overallLevel: 'strong',
    helpsOrHurts: 'hurts',
    authenticityScore: 52,
    adFriendly: false,
    signals: [
      {
        category: 'aggressive',
        detected: 'השוואה אגרסיבית למתחרים עם שפה פוגעת',
        effect: 'hurts',
        reachImpact: 'TikTok ו-Meta מגבילים תוכן שמזכיר מותגים אחרים בצורה שלילית — reach עלול לרדת 30-40%',
        viewerReaction: 'חלק מהצופים יסכימו, חלק ירגישו אי-נוח — יוצר מחלוקת שמגדילה תגובות אבל גם unfollows',
        adFriendly: false,
        platformNote: 'מפר מדיניות פרסום ב-Meta, TikTok, ו-Google Ads',
      },
      {
        category: 'profanity',
        detected: 'מספר קללות מובהקות לאורך הסרטון',
        effect: 'hurts',
        reachImpact: 'קללות חוזרות מורידות reach ב-TikTok ומובילות לסכמה מוגבלת ב-YouTube',
        viewerReaction: 'אם הקהל הוא מתחת לגיל 25 זה עלול לעבוד — מעל גיל 30 רוב האנשים ירגישו אי-נוח',
        adFriendly: false,
      },
      {
        category: 'sensitive-topic',
        detected: 'הצהרות כספיות/פיננסיות ללא disclaimer',
        effect: 'hurts',
        reachImpact: 'Meta ו-TikTok מגבילים תוכן פיננסי ללא גילויים מתאימים',
        viewerReaction: 'עלול לפגוע באמינות אם הצופה הוא ספקן — "עוד אחד שמבטיח כסף"',
        adFriendly: false,
        platformNote: 'שקול להוסיף "זה לא ייעוץ פיננסי" בתיאור',
      },
    ],
    platformImpacts: [
      { platform: 'tiktok', impact: 'significant', note: 'קללות חוזרות + השוואה אגרסיבית = reach מוגבל. שקול לעדן את השפה' },
      { platform: 'instagram', impact: 'moderate', note: 'Reel יעלה, אבל פרסום ממומן חסום' },
      { platform: 'facebook', impact: 'significant', note: 'מדיניות קפדנית יותר — הגעה אורגנית תיפגע' },
      { platform: 'youtube', impact: 'significant', note: 'סכמה מוגבלת + חסימה פוטנציאלית של monetization' },
    ],
    summary: 'השפה בסרטון הזה עלולה לעלות לך reach. זה לא עניין של "לא מותר" — זה עניין של ביצועים. הקללות החוזרות והשוואה אגרסיבית למתחרים הם בדיוק מה שהאלגוריתמים מחפשים כדי להגביל הפצה.',
    recommendation: 'שקול לרכך את ההשוואה למתחרים — במקום לתקוף ישירות, דבר על מה שאתה עושה אחרת. הקללות — אם חשוב לך reach, הורד אותן. אם הקהל שלך מצפה לזה, השאר אותן עם מודעות לעלות.',
  },
];

const DEMO_LANGUAGE_EN: LanguageSafetyAnalysis[] = [
  {
    overallLevel: 'mild',
    helpsOrHurts: 'helps',
    authenticityScore: 76,
    adFriendly: true,
    signals: [
      {
        category: 'emotional',
        detected: 'Strong emotional language — frustration, breakthrough, relatability',
        effect: 'helps',
        reachImpact: 'Emotional language increases watch time by 18-25% — algorithms reward engagement',
        viewerReaction: "Viewers feel spoken to, not at — increases shares and saves",
        adFriendly: true,
      },
      {
        category: 'authentic-expression',
        detected: 'Informal contractions, conversational filler words',
        effect: 'helps',
        reachImpact: 'No reach impact — casual speech patterns perform well on TikTok and Reels',
        viewerReaction: 'Makes content feel like a conversation, not a broadcast — increases trust',
        adFriendly: true,
      },
    ],
    platformImpacts: [
      { platform: 'tiktok', impact: 'none', note: 'Fully compatible — TikTok rewards authentic, human language' },
      { platform: 'instagram', impact: 'none', note: 'Reels compatible — tone fits the platform perfectly' },
      { platform: 'youtube', impact: 'none', note: 'No restrictions — fully ad-friendly' },
    ],
    summary: "The language in this video is an asset. The emotional depth and conversational tone create genuine connection with your audience — exactly what drives shares and saves.",
    recommendation: 'Keep the language exactly as it is. This is a strong, ad-friendly script that works across all platforms.',
  },
];

async function getDemoLanguageSafety(language: string): Promise<LanguageSafetyAnalysis> {
  await new Promise((r) => setTimeout(r, 1700 + Math.random() * 800));
  const pool = language === 'english' ? DEMO_LANGUAGE_EN : DEMO_LANGUAGE_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function analyzeLanguageSafety(
  transcript: string,
  context: SimpleVideoContext,
  understanding?: VideoUnderstanding
): Promise<LanguageSafetyAnalysis> {
  if (AI_MODE === 'demo') {
    return getDemoLanguageSafety(context.language);
  }
  const { analyzeLanguageSafety: openaiLang } = await import('./openai');
  return openaiLang(transcript, context, understanding);
}

// ─── Viral Potential Analyst — demo data ──────────────────────────────────────

const DEMO_VIRAL_HE: ViralPotentialAnalysis[] = [
  {
    viralScore: 68,
    dimensions: {
      shareability:     { score: 72, insight: 'יש פה רגע שאנשים ישתפו עם חבר אחד ספציפי — לא עם כל הקהל שלהם. שיתוף "שלח לחבר" חזק אבל לא שיתוף פומבי.' },
      emotionalImpact:  { score: 74, insight: 'נוסטלגיה קלה + חיוך — מעלה מצב רוח בלי להשאיר חותם עמוק. מספיק כדי לקבל לייק, לא מספיק כדי לזכור מחר.' },
      relatability:     { score: 81, insight: 'הסיטואציה מוכרת לרוב רחב של אנשים. אין מחסום כניסה — כל אחד שחווה את זה לפחות פעם אחת יבין מיד.' },
      commentPotential: { score: 58, insight: 'אין שאלה פתוחה ואין עמדה שמאתגרת. יקבל תגובות "זה אני" ואמוג\'י אבל לא ויכוח או שרשרת תגובות.' },
      rewatchPotential: { score: 45, insight: 'אין פרט נסתר ואין ציפייה שמתקיימת בסוף. אחרי צפייה אחת אין סיבה לחזור.' },
      memorability:     { score: 61, insight: 'אין משפט אחד שנשאר. אין תמונה שנדבקת. ייזכרו שראו משהו דומה, לא את הסרטון הספציפי הזה.' },
    },
    boosts: [
      'הזדהות מיידית — הצופה מכיר את הסיטואציה תוך 2 שניות, הגדר הפסיכולוגי לשיתוף נמוך',
      'טון רגשי חיובי — תוכן שמשפר מצב רוח מקבל יותר לייקים כי אנשים רוצים להיראות "בטוב"',
      'אורך קצר — לא מבקש הרבה מהצופה, כך שסבירות ההשלמה גבוהה',
    ],
    drags: [
      'אין מתח — אין שאלה שמחכה לתשובה, ולכן אין סיבה פסיכולוגית לראות עד הסוף',
      'אין זווית ייחודית — תוכן דומה כבר קיים, הצופה לא מרגיש שראה משהו חדש',
      'אין קריאה לפעולה רגשית — "תייג מישהו" לא נאמר בפירוש, גם לא רמוז',
    ],
    mostViralElement: 'ההזדהות המיידית היא הנכס הגדול ביותר של הסרטון. הצופה מרגיש "זה בדיוק אני" תוך שתי שניות — זה המנגנון שמניע שיתופים בין חברים. אנשים שולחים תוכן כשהוא "מנסח" חוויה שלא יכלו לנסח לבד.',
    biggestMissedOpportunity: 'הסרטון מגיע לסף הרגש אבל לא עובר אותו. ברגע שהצופה מתחיל להרגיש — הסרטון נגמר. אם הרגע הרגשי המרכזי היה מתרחש 3 שניות לפני הסוף, ולא בסוף, הצופה היה מסיים עם תחושה שלמה יותר וסבירות גבוהה יותר לשתף.',
    topImprovement: 'הוסף שאלה ישירה בסוף — "אתם מרגישים אותו דבר?" — ותייג קהל ספציפי. תוכן שמבקש תיוג מפורשות מקבל פי 2.3 יותר תגובות.',
  },
  {
    viralScore: 82,
    dimensions: {
      shareability:     { score: 88, insight: 'יש פה הפתעה שאנשים ירצו לחשוף לאחרים — "אתה חייב לראות את זה". זהו הטריגר החזק ביותר לשיתוף פומבי.' },
      emotionalImpact:  { score: 85, insight: 'הפתעה + חיוך = שילוב עוצמתי. המוח משחרר דופמין כשציפייה מופרכת לטובה — בדיוק מה שקורה פה.' },
      relatability:     { score: 76, insight: 'לא כולם ייקשרו, אבל מי שייקשר — ייקשר חזק. נישה ברורה עם קהל עמוק עדיפה על נישה רחבה רדודה.' },
      commentPotential: { score: 79, insight: 'הסרטון שואל שאלה שאין לה תשובה אחת — זה מזמין דעות. כל תגובה מסית תגובות נוספות.' },
      rewatchPotential: { score: 71, insight: 'יש פרט שמוחמץ בצפייה ראשונה. מי שישים לב יחזור לוודא. יצירת "מצא את ההבדל" שקט יוצרת לופ צפייה.' },
      memorability:     { score: 83, insight: 'הרגע המרכזי הוא תמונה שנשארת — סצנה שאנשים יזכרו גם שבוע אחרי. לתוכן שנדבק יש בדרך כלל תמונה אחת מרכזית.' },
    },
    boosts: [
      'אלמנט הפתעה — המוח נוירולוגית "מסמן" רגעי הפתעה לזכרון, מה שמגדיל זכירה ושיתוף',
      'פרט נסתר שמחכה לגילוי — יוצר מוטיבציה לצפות שוב ולשלוח "ראית את זה?"',
      'סיום שמשאיר שאלה פתוחה — הדחף לסגור מעגל קוגניטיבי מניע תגובות ותייוגים',
    ],
    drags: [
      'הפתיחה לא מבשרת שמשהו מיוחד מגיע — חלק מהצופים ייצאו לפני ההפתעה',
      'הכותרת/קאפשן לא תואמת את עוצמת הרגע — מורידה ציפיות ולכן גם פחות קליקים',
    ],
    mostViralElement: 'ההפתעה האמיתית באמצע הסרטון. כשציפייה של הצופה מופרכת לטובה — המוח מסמן את הרגע כ"כדאי לשתף". זו הסיבה שרגעי "לא ציפיתי לזה" הם הסרטונים הכי משותפים בכל פלטפורמה.',
    biggestMissedOpportunity: 'הפתיחה לא מעלה הבטחה ספציפית. אם הצופה היה יודע מהשנייה הראשונה שמשהו בלתי צפוי מחכה — אחוז ה-completion היה גבוה יותר ב-30-40%, מה שמגדיל חשיפה אורגנית אוטומטית.',
    topImprovement: 'שנה את 3 השניות הראשונות כך שיכללו הבטחה: "מה שקרה אחר כך לא ציפיתי בחיים" — הסקרנות היא הטריגר הכי חזק לצפייה מלאה.',
  },
];

const DEMO_VIRAL_EN: ViralPotentialAnalysis[] = [
  {
    viralScore: 65,
    dimensions: {
      shareability:     { score: 68, insight: 'There is a "send to one person" moment here — strong for DM sharing but not broad public resharing.' },
      emotionalImpact:  { score: 71, insight: 'Mild nostalgia and warmth — enough for a like, not enough to leave a lasting emotional mark.' },
      relatability:     { score: 78, insight: 'The situation is broadly familiar. Low barrier to connect — most people have experienced something similar.' },
      commentPotential: { score: 52, insight: 'No open question, no challenging take. Will get "that\'s me" comments but not a debate thread.' },
      rewatchPotential: { score: 42, insight: 'Nothing to discover on a second watch. No hidden detail, no payoff that rewards patience.' },
      memorability:     { score: 58, insight: 'No single sticky phrase or image. Viewers will remember watching something like this, not this video specifically.' },
    },
    boosts: [
      'Immediate recognition — viewer identifies the situation within 2 seconds, lowering the psychological barrier to share',
      'Positive emotional tone — mood-boosting content gets more likes because people want to be seen as "positive"',
    ],
    drags: [
      'No tension — no open question means no psychological reason to watch to the end',
      'No unique angle — similar content exists; viewer does not feel they saw something new',
      'No explicit or implied call to tag someone — sharing rate stays low',
    ],
    mostViralElement: 'Immediate relatability is the biggest asset. The viewer feels "that\'s exactly me" within two seconds — this is the mechanism that drives friend-to-friend shares. People share content that articulates an experience they could not articulate themselves.',
    biggestMissedOpportunity: 'The video reaches the emotional threshold but does not cross it. If the central emotional moment happened three seconds before the end rather than at the end, viewers would finish with a more complete feeling and higher share intent.',
    topImprovement: 'Add a direct question at the end — "Does this happen to you too?" — and tag a specific audience. Content that explicitly requests tagging receives 2.3x more comments on average.',
  },
];

async function getDemoViralPotential(language: string): Promise<ViralPotentialAnalysis> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  const pool = language === 'english' ? DEMO_VIRAL_EN : DEMO_VIRAL_HE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function analyzeViralPotential(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  transcriptData?: TranscriptData | null
): Promise<ViralPotentialAnalysis> {
  if (AI_MODE === 'demo') {
    return getDemoViralPotential(context.language);
  }
  const { analyzeViralPotential: openaiViral } = await import('./openai');
  return openaiViral(frameData, context, transcriptData);
}
