"""
IEEE-IMSIU Tweet Scraper → Markdown
يسحب نص التغريدات وتاريخها عبر gallery-dl ويولّد ملف Markdown
"""

import subprocess
import json
import os
import glob
from datetime import datetime

USERNAME = ""
PASSWORD = ""
EMAIL    = "" 

TWEETS = {
    "الورش واللقاءات": [
        ("لقاء Intro to Cloud Computing",                       "https://x.com/IEEEIMSIU/status/1316376333941968901"),
        ("لقاء How to Break a Cryptographic System?",           "https://x.com/IEEEIMSIU/status/1318064852443738112"),
        ("لقاء High-Performance Computing للباحثين",            "https://x.com/IEEEIMSIU/status/1329726449054593024"),
        ("لقاء — إعلان ترحيبي",                                "https://x.com/IEEEIMSIU/status/1368950214527180813"),
        ("ورشة إدارة أنظمة Linux",                             "https://x.com/IEEEIMSIU/status/1447624756635832328"),
        ("ورشة الطاقة المستدامة",                               "https://x.com/IEEEIMSIU/status/1457336284683415556"),
        ("مسابقة — إعلان",                                      "https://x.com/IEEEIMSIU/status/1527196361405382656"),
        ("مقدمة في تحليل البيانات بالبايثون — البوستر",         "https://x.com/IEEEIMSIU/status/1701913608303546502"),
        ("لقاء ما بعد التخرج — البوستر",                       "https://x.com/IEEEIMSIU/status/1715282084690878900"),
        ("لقاء توسيع آفاق التكنولوجيا والابتكار",              "https://x.com/IEEEIMSIU/status/1741914658171150458"),
        ("كيف تختار مجالك الدراسي والتوافق مع سوق العمل",      "https://x.com/IEEEIMSIU/status/1830251178724381086"),
        ("دورة أساسيات الذكاء الاصطناعي — النسخة الأولى",      "https://x.com/IEEEIMSIU/status/1827087457877422291"),
        ("ورشة أساسيات البلوكتشين",                             "https://x.com/IEEEIMSIU/status/1831377406936150196"),
        ("دورة Introduction to SQL",                            "https://x.com/IEEEIMSIU/status/1832841469587071416"),
        ("لقاء كيف تبني مسارك المهني كمهندس شبكات",            "https://x.com/IEEEIMSIU/status/1837895519919919593"),
        ("دورة الذكاء الاصطناعي — النسخة الثانية",             "https://x.com/IEEEIMSIU/status/1867211812275458182"),
        ("ورشة أساسيات CCNA — إعلان",                          "https://x.com/IEEEIMSIU/status/2054270554467598415"),
        ("ورشة أساسيات CCNA — الختام",                         "https://x.com/IEEEIMSIU/status/2063337961953886667"),
        ("ورشة أساسيات الأردوينو — إعلان",                     "https://x.com/IEEEIMSIU/status/2054271726955991373"),
        ("ورشة أساسيات الأردوينو — الختام",                    "https://x.com/IEEEIMSIU/status/2063338167093084386"),
        ("ورشة علم البيانات — إعلان",                          "https://x.com/IEEEIMSIU/status/2043752540655755720"),
        ("ورشة علم البيانات — الختام",                         "https://x.com/IEEEIMSIU/status/2050219686990581816"),
    ],
    "المعسكرات والأنشطة": [
        ("إعلان معسكر Java 1 & Java 2",                        "https://x.com/IEEEIMSIU/status/1438814338089893894"),
        ("مثال من محتوى معسكر Java",                           "https://x.com/IEEEIMSIU/status/1445049343657058306"),
        ("مشاركة IEEEXtreme لمدة 24 ساعة",                    "https://x.com/IEEEIMSIU/status/1584414543232782337"),
        ("مشاركة النادي في DevFest",                           "https://x.com/IEEEIMSIU/status/1741851357009555866"),
        ("مقتطفات إضافية من DevFest",                          "https://x.com/IEEEIMSIU/status/1746131104757694888"),
        ("إعلان معسكر علم البيانات",                           "https://x.com/IEEEIMSIU/status/1833513974966718846"),
        ("اليوم الأول من معسكر علم البيانات",                  "https://x.com/IEEEIMSIU/status/1835398443323339250"),
        ("اليوم الثاني من معسكر علم البيانات — Pandas",        "https://x.com/IEEEIMSIU/status/1835793208468447585"),
        ("اليوم الثالث — Matplotlib وSeaborn",                 "https://x.com/IEEEIMSIU/status/1836124397389910106"),
        ("اليوم الرابع من معسكر علم البيانات",                 "https://x.com/IEEEIMSIU/status/1836521925771956537"),
        ("الزيارة التطوعية لجمعية الأطفال ذوي الإعاقة",       "https://x.com/IEEEIMSIU/status/1841147684008169916"),
        ("الزيارة التطوعية — صور إضافية",                     "https://x.com/IEEEIMSIU/status/1841148012187328576"),
        ("إعلان معسكر الواقع المعزز",                          "https://x.com/IEEEIMSIU/status/1919156175750205471"),
        ("اليوم الأول من معسكر الواقع المعزز",                 "https://x.com/IEEEIMSIU/status/1920442714346184904"),
        ("اليوم الثاني من معسكر الواقع المعزز",                "https://x.com/IEEEIMSIU/status/1920686648485990569"),
        ("ختام معسكر الواقع المعزز",                           "https://x.com/IEEEIMSIU/status/1921219796063981582"),
    ],
    "التعاون والرعاة": [
        ("إعلان التعاون مع نادي الهندسة الكهربائية",           "https://x.com/IEEEIMSIU/status/1443885998086230016"),
        ("رعاة مشاركة DevFest",                                "https://x.com/IEEEIMSIU/status/1746132394124378341"),
        ("رعاة معسكر علم البيانات — بطاقة الشكر",             "https://x.com/IEEEIMSIU/status/1845473277906407651"),
        ("رعاة معسكر علم البيانات — مقتطفات",                 "https://x.com/IEEEIMSIU/status/1845473494944952535"),
        ("رعاة معسكر علم البيانات — صور إضافية",              "https://x.com/IEEEIMSIU/status/1845475979948425680"),
        ("رعاة حفل تخرج الدفعة 69",                           "https://x.com/IEEEIMSIU/status/1938258332109725924"),
    ],
}

TEMP_DIR = "_tweet_meta_tmp"

def fetch_tweet_meta(url):
    """يسحب metadata التغريدة عبر gallery-dl"""
    os.makedirs(TEMP_DIR, exist_ok=True)

    cmd = [
        "gallery-dl",
        "--cookies-from-browser", "firefox",
        "--write-metadata",
        "--no-download",
        "--destination", TEMP_DIR,
        url
    ]

    subprocess.run(cmd, capture_output=True, timeout=30)

    # ابحث عن ملف json الناتج
    json_files = glob.glob(f"{TEMP_DIR}/**/*.json", recursive=True)
    if not json_files:
        return None, None

    # خذ أحدث ملف
    latest = max(json_files, key=os.path.getmtime)
    with open(latest, encoding="utf-8") as f:
        data = json.load(f)

    # استخرج النص والتاريخ
    text = data.get("content", data.get("full_text", data.get("tweet", {}).get("full_text", "")))
    date_raw = data.get("date", data.get("created_at", ""))

    if date_raw:
        try:
            # gallery-dl يعطي datetime object أو string
            if isinstance(date_raw, str):
                from dateutil import parser as dparser
                dt = dparser.parse(date_raw)
            else:
                dt = date_raw
            date_str = dt.strftime("%Y-%m-%d")
        except:
            date_str = str(date_raw)[:10]
    else:
        date_str = "غير معروف"

    # نظّف الملفات المؤقتة
    for f in json_files:
        try:
            os.remove(f)
        except:
            pass

    return text.strip() if text else "", date_str


def generate_markdown(results):
    lines = []
    lines.append("# IEEE IMSIU — أرشيف التغريدات\n")
    lines.append(f"> آخر تحديث: {datetime.now().strftime('%Y-%m-%d')}\n")
    lines.append("---\n")

    for section, items in results.items():
        lines.append(f"\n## {section}\n")
        for item in items:
            lines.append(f"### {item['label']}")
            lines.append(f"- **التاريخ:** {item['date']}")
            lines.append(f"- **الرابط:** {item['url']}")
            if item['text']:
                clean = item['text'].replace('\n', ' ').strip()
                lines.append(f"- **نص التغريدة:** {clean}")
            lines.append("")

    with open("tweets.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    print("=" * 50)
    print("IEEE-IMSIU Tweet Scraper")
    print("=" * 50)

    results = {}
    total_ok = 0
    total_fail = 0

    for section, items in TWEETS.items():
        print(f"\n📁 {section}")
        results[section] = []

        for label, url in items:
            print(f"  جاري: {label}...", end=" ", flush=True)
            try:
                text, date = fetch_tweet_meta(url)
                results[section].append({
                    "label": label,
                    "date": date or "غير معروف",
                    "text": text or "",
                    "url": url,
                })
                print(f"✓ ({date})")
                total_ok += 1
            except Exception as e:
                results[section].append({
                    "label": label,
                    "date": "غير معروف",
                    "text": "",
                    "url": url,
                })
                print(f"✗ {e}")
                total_fail += 1

    # حفظ JSON احتياطي
    with open("tweets_raw.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    generate_markdown(results)

    # تنظيف المجلد المؤقت
    try:
        import shutil
        shutil.rmtree(TEMP_DIR, ignore_errors=True)
    except:
        pass

    print("\n" + "=" * 50)
    print(f"✅ نجح: {total_ok}   ❌ فشل: {total_fail}")
    print("📄 الملفات: tweets.md  |  tweets_raw.json")
    print("=" * 50)


if __name__ == "__main__":
    main()

