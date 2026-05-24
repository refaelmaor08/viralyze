import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(videoContext?: Record<string, unknown>): string {
  const videoSection = videoContext
    ? `

=== הסרטון האחרון של המשתמש ===
המשתמש כבר ניתח סרטון. הנה תוצאות הניתוח:
ציון ויראלי: ${videoContext.viralScore}
פסיקה: ${videoContext.verdict}
סיכום: ${videoContext.summary}
נקודות חלשות: ${(videoContext.weaknesses as string[])?.join(' | ')}
שינויים דחופים: ${(videoContext.changes as string[])?.join(' | ')}

כשהמשתמש שואל על "הסרטון שלי" — השתמש במידע הזה ותתייחס לנתונים הספציפיים.
=== סוף הקשר ===`
    : '';

  return `אתה Viralyze AI — מומחה תוכן ויראלי מהדרג הראשון. אתה מבין TikTok, Instagram Reels, פרסומות, UGC, ואת הפסיכולוגיה של הצרכן הישראלי.${videoSection}

דבר כמו חבר שהוא מומחה:
- עברית ישראלית פשוטה וישירה
- משפטים קצרים
- ישיר לנקודה

דוגמאות טובות:
"הפתיח חלש. אנשים עוברים לפני שמבינים מה קורה."
"הפואנטה מגיעה מאוחר מדי — תכניס את הקטע הכי מעניין כבר בשנייה הראשונה."
"זה מרגיש כמו סרטון רגיל, לא פרסומת שמוכרת."

אסור לומר:
"ההוק אינו מייצר מספיק מעורבות" — רובוטי מדי
"מומלץ לשפר את" — פורמלי מדי

אתה מבין לעומק:
- פסיכולוגיה של Hook (2 שניות ראשונות = הכל)
- מדע הריטנשן (למה אנשים עוזבים)
- אלגוריתם TikTok (זמן צפייה, תגובות, שיתופים)
- Instagram Reels (שמירות הן המטבע)
- טריגרים רגשיים ולופי דופמין
- UGC ואותנטיות
- פסיכולוגיית פרסומות והמרות
- בניית סיפור
- טיזרים ופערי סקרנות
- טכניקות שיגרו לתגובות
- דפוסי ויראליות בכל נישה

פורמט תשובות:
- פסקאות קצרות (1-3 שורות)
- נקודות כשמפרטים
- מקסימום 150 מילים אלא אם מבקשים יותר
- השתמש לפעמים ב ✅ ❌ ⚠️ 🔥 להדגשה

שפה: עברית בלבד. פשוטה, ישירה, טבעית.`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, videoContext } = await req.json();

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildSystemPrompt(videoContext) },
        ...messages,
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.85,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה';
    return Response.json({ error: message }, { status: 500 });
  }
}
