'use client';

import { motion } from 'framer-motion';
import { Eye, Zap, Clock, Smile, Type, Music, Camera, TrendingDown } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: '3 השניות הראשונות',
    description: 'ה-AI צופה בפתיחה ומסביר אם ה-Hook עוצר גלילה — או מאבד את הצופה מיד.',
  },
  {
    icon: Zap,
    title: 'קצב עריכה ותנועה',
    description: 'מזהה איפה הסרטון נהיה סטטי ומשעמם. מתי אין מספיק שינוי בין פריימים.',
  },
  {
    icon: TrendingDown,
    title: 'נקודות נטישה',
    description: 'מצביע על הרגע המדויק שבו הצופים עלולים לגלול — ומסביר את הסיבה הפסיכולוגית.',
  },
  {
    icon: Camera,
    title: 'תאורה ואיכות ויזואלית',
    description: '"האיכות קצת חשוכה" — אנחנו אומרים את זה. ומסבירים איך זה פוגע בביצועים.',
  },
  {
    icon: Smile,
    title: 'ביטויי פנים ואנרגיה',
    description: 'האנרגיה שלך בסרטון קריטית לריטנשן. ה-AI מעריך את רמת הנוכחות שלך.',
  },
  {
    icon: Type,
    title: 'כתוביות ותוכן טקסטואלי',
    description: 'האם הכתוביות קריאות? בולטות? בגובה הנכון? בגדול? מתי להוסיף אותן.',
  },
  {
    icon: Music,
    title: 'התאמת אודיו ומוזיקה',
    description: 'האם המוזיקה יוצרת את ההקשר הרגשי הנכון? או שהיא פשוט רועשת ברקע?',
  },
  {
    icon: Clock,
    title: 'CTA ומבנה הסיום',
    description: 'האם הסרטון מסתיים בצורה שגורמת לאנשים לפעול — או שהוא פשוט נגמר?',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 relative" style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-4">
            מה ה-AI מנתח בפועל
          </p>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-5">
            <span className="text-white">ה-AI רואה את הסרטון.</span>
            <br />
            <span className="gold-text">לא רק שומע עליו.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            אנחנו מחלצים פריימים מהסרטון שלך ומנתחים מה שאנשים יראו בפועל — לא מה שאתה מספר עליו.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="glass rounded-2xl p-5 text-right group hover:border-[rgba(212,168,67,0.3)] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,67,0.1)] flex items-center justify-center mb-4 mr-auto group-hover:bg-[rgba(212,168,67,0.18)] transition-colors">
                <f.icon className="w-5 h-5 text-[#D4A843]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
