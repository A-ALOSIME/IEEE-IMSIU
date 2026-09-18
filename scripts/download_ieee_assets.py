"""
IEEE-IMSIU Twitter Assets Downloader
يحمّل صور التغريدات بأعلى جودة ويرتبها في مجلدات جاهزة للرفع على GitHub
"""

import subprocess
import os
import sys

# ==============================
# قائمة التغريدات مرتبة بالتصنيف
# ==============================

TWEETS = {
    "workshops": [
        ("intro_cloud_computing",                  "https://x.com/IEEEIMSIU/status/1316376333941968901"),
        ("how_to_break_cryptographic_system",      "https://x.com/IEEEIMSIU/status/1318064852443738112"),
        ("hpc_for_researchers",                    "https://x.com/IEEEIMSIU/status/1329726449054593024"),
        ("welcome_meetup",                         "https://x.com/IEEEIMSIU/status/1368950214527180813"),
        ("linux_systems_management",               "https://x.com/IEEEIMSIU/status/1447624756635832328"),
        ("sustainable_energy_workshop",            "https://x.com/IEEEIMSIU/status/1457336284683415556"),
        ("competition_announcement",               "https://x.com/IEEEIMSIU/status/1527196361405382656"),
        ("intro_data_analysis_python_poster",      "https://x.com/IEEEIMSIU/status/1701913608303546502"),
        ("post_graduation_meetup_poster",          "https://x.com/IEEEIMSIU/status/1715282084690878900"),
        ("tech_innovation_horizons_meetup",        "https://x.com/IEEEIMSIU/status/1741914658171150458"),
        ("choose_your_field_job_market",           "https://x.com/IEEEIMSIU/status/1830251178724381086"),
        ("ai_fundamentals_v1",                     "https://x.com/IEEEIMSIU/status/1827087457877422291"),
        ("blockchain_basics_workshop",             "https://x.com/IEEEIMSIU/status/1831377406936150196"),
        ("intro_to_sql",                           "https://x.com/IEEEIMSIU/status/1832841469587071416"),
        ("network_engineer_career_path",           "https://x.com/IEEEIMSIU/status/1837895519919919593"),
        ("ai_fundamentals_v2",                     "https://x.com/IEEEIMSIU/status/1867211812275458182"),
        ("ccna_basics_announcement",               "https://x.com/IEEEIMSIU/status/2054270554467598415"),
        ("ccna_basics_closing",                    "https://x.com/IEEEIMSIU/status/2063337961953886667"),
        ("arduino_basics_announcement",            "https://x.com/IEEEIMSIU/status/2054271726955991373"),
        ("arduino_basics_closing",                 "https://x.com/IEEEIMSIU/status/2063338167093084386"),
        ("data_workshop_announcement",             "https://x.com/IEEEIMSIU/status/2043752540655755720"),
        ("data_workshop_closing",                  "https://x.com/IEEEIMSIU/status/2050219686990581816"),
    ],
    "camps": [
        ("java_camp_1_and_2_announcement",         "https://x.com/IEEEIMSIU/status/1438814338089893894"),
        ("java_camp_content_sample",               "https://x.com/IEEEIMSIU/status/1445049343657058306"),
        ("ieeextreme_24h",                         "https://x.com/IEEEIMSIU/status/1584414543232782337"),
        ("devfest_participation",                  "https://x.com/IEEEIMSIU/status/1741851357009555866"),
        ("devfest_highlights",                     "https://x.com/IEEEIMSIU/status/1746131104757694888"),
        ("data_science_camp_announcement",         "https://x.com/IEEEIMSIU/status/1833513974966718846"),
        ("data_science_camp_day1",                 "https://x.com/IEEEIMSIU/status/1835398443323339250"),
        ("data_science_camp_day2_pandas",          "https://x.com/IEEEIMSIU/status/1835793208468447585"),
        ("data_science_camp_day3_matplotlib",      "https://x.com/IEEEIMSIU/status/1836124397389910106"),
        ("data_science_camp_day4",                 "https://x.com/IEEEIMSIU/status/1836521925771956537"),
        ("data_science_camp_highlights_1",         "https://x.com/IEEEIMSIU/status/1845473494944952535"),
        ("data_science_camp_highlights_2",         "https://x.com/IEEEIMSIU/status/1845475979948425680"),
        ("volunteer_visit_video",                  "https://x.com/IEEEIMSIU/status/1841147684008169916"),
        ("volunteer_visit_photos",                 "https://x.com/IEEEIMSIU/status/1841148012187328576"),
        ("ar_camp_announcement",                   "https://x.com/IEEEIMSIU/status/1919156175750205471"),
        ("ar_camp_day1",                           "https://x.com/IEEEIMSIU/status/1920442714346184904"),
        ("ar_camp_day2",                           "https://x.com/IEEEIMSIU/status/1920686648485990569"),
        ("ar_camp_closing",                        "https://x.com/IEEEIMSIU/status/1921219796063981582"),
    ],
    "collaborations": [
        ("collab_electrical_engineering_club",     "https://x.com/IEEEIMSIU/status/1443885998086230016"),
        ("devfest_sponsors",                       "https://x.com/IEEEIMSIU/status/1746132394124378341"),
        ("data_science_camp_sponsors",             "https://x.com/IEEEIMSIU/status/1845473277906407651"),
        ("graduation_ceremony_sponsors",           "https://x.com/IEEEIMSIU/status/1938258332109725924"),
    ],
}

OUTPUT_BASE = "assets"

# ==============================
# اختيار مصدر الكوكيز
# ==============================

def get_cookies_arg():
    """يكتشف المتصفح المتاح تلقائياً"""
    browsers = ["firefox", "chrome", "edge", "safari"]
    for b in browsers:
        result = subprocess.run(
            ["gallery-dl", f"--cookies-from-browser", b,
             "--get-urls", "https://x.com/IEEEIMSIU/status/1701913608303546502"],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0 and result.stdout.strip():
            print(f"✓ كوكيز {b} شغالة")
            return ["--cookies-from-browser", b]
    return []

# ==============================
# دالة التحميل
# ==============================

def download_tweet(name, url, folder, cookies_arg):
    dest = os.path.join(OUTPUT_BASE, folder)
    os.makedirs(dest, exist_ok=True)

    filename_pattern = f"{dest}/{name}_{{num:02}}"

    cmd = [
        "gallery-dl",
        "--filename", f"{name}_{{num:02}}.{{extension}}",
        "--destination", dest,
        "--write-metadata",
    ] + cookies_arg + [url]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

    if result.returncode == 0:
        downloaded = [f for f in os.listdir(dest) if f.startswith(name)]
        print(f"  ✓ {name} — {len(downloaded)} ملف")
        return True
    else:
        err = result.stderr.strip().splitlines()[-1] if result.stderr.strip() else "خطأ غير معروف"
        print(f"  ✗ {name} — {err}")
        return False

# ==============================
# التشغيل الرئيسي
# ==============================

def main():
    print("=" * 50)
    print("IEEE-IMSIU Assets Downloader")
    print("=" * 50)

    print("\nجاري البحث عن كوكيز المتصفح...")
    cookies_arg = get_cookies_arg()
    if not cookies_arg:
        print("⚠️  ما لقيت كوكيز — بعض الصور ممكن ما تنحمّل")
        print("    شغّل: gallery-dl --cookies-from-browser chrome <رابط>")

    total_ok = 0
    total_fail = 0

    for folder, items in TWEETS.items():
        print(f"\n📁 {folder}/")
        for name, url in items:
            ok = download_tweet(name, url, folder, cookies_arg)
            if ok:
                total_ok += 1
            else:
                total_fail += 1

    print("\n" + "=" * 50)
    print(f"✅ نجح: {total_ok}   ❌ فشل: {total_fail}")
    print(f"📂 الملفات في: {os.path.abspath(OUTPUT_BASE)}/")
    print("=" * 50)
    print("\nالخطوة التالية:")
    print("  git add assets/")
    print('  git commit -m "feat: add IEEE-IMSIU event assets"')
    print("  git push")

if __name__ == "__main__":
    main()
