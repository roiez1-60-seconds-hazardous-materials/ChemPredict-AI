# 🔥 ChemPredict AI — הוראות התקנה

## מה יש ב-ZIP

```
fire-chem-predict/
├── app/
│   ├── api/predict/route.ts   ← API (חיפוש PubChem + חיזוי)
│   ├── globals.css             ← עיצוב
│   ├── layout.tsx              ← Layout + RTL
│   └── page.tsx                ← ממשק ראשי + עיצוב חדש
├── data/
│   ├── chemicals.json          ← 183 חומרים
│   └── compatibility.json      ← 66 כללי תאימות
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
└── .gitignore
```

---

## שלב 1: יצירת Repository חדש ב-GitHub

1. לך ל: https://github.com/new
2. שם: `fire-chem-predict`
3. Public ✓
4. ללא README / .gitignore (ריק לחלוטין)
5. לחץ **Create repository**

---

## שלב 2: העלאת קבצים

### אפשרות א׳ — העלאה דרך Git (מומלץ):

```bash
# פתח את ה-ZIP לתיקייה
unzip fire-chem-predict.zip
cd fire-chem-predict

# Git init
git init
git add .
git commit -m "Initial: ChemPredict AI v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fire-chem-predict.git
git push -u origin main
```

### אפשרות ב׳ — העלאה דרך GitHub Web:

1. ב-GitHub, לחץ **"uploading an existing file"**
2. גרור את **כל הקבצים מתוך** התיקייה `fire-chem-predict/`
3. **חשוב:** לגרור את התוכן, לא את התיקייה עצמה!
4. Commit → **Commit changes**

⚠️ **שים לב:** GitHub Web לא תומך בהעלאת תיקיות ריקות.
צריך להעלות כל קובץ במיקום הנכון:
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/api/predict/route.ts`
- `data/chemicals.json`
- `data/compatibility.json`
- + כל קבצי ה-root

---

## שלב 3: חיבור ל-Vercel

1. לך ל: https://vercel.com
2. **Add New** → **Project**
3. **Import** את `fire-chem-predict`
4. Framework: **Next.js** (אוטומטי)
5. Root Directory: `.` (ברירת מחדל)
6. Environment Variables: **לא צריך**
7. לחץ **Deploy**

---

## שלב 4: בדיקה

1. חכה ל-Build (כ-30 שניות)
2. לחץ על הקישור שנוצר
3. בדוק:
   - ✅ הרשימה נטענת (183 חומרים)
   - ✅ חיפוש חופשי עובד (נסה: "acetone")
   - ✅ חיזוי תגובה עובד

---

## אם יש שגיאה

- **JSON parse error**: הקבצים ב-data/ נשברו — העלה שוב
- **Build failed**: בדוק ב-Vercel → Deployments → Build Logs
- **HF Space error**: ודא שה-Space ב-https://huggingface.co/spaces/roiez/fire-chem-predict במצב Running
