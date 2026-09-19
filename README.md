# IEEE IMSIU Website

الموقع العام وجهة الإدارة للفرع الطلابي لـ IEEE في جامعة الإمام محمد بن سعود الإسلامية. الواجهة عربية وRTL مع وضع فاتح وداكن، ودعم محتوى إنجليزي، ونظام إدارة كامل للفعاليات والتسجيلات والعضوية والساعات والمقالات والإعلانات والصلاحيات والبريد.

## التقنية

- Astro وTypeScript وTailwind CSS
- Cloudflare Workers وD1 وR2 وAccess وTurnstile
- Resend لإرسال البريد ومتابعة التسليم

## التشغيل محليًا

يتطلب Node.js 22.12 أو أحدث.

```bash
npm ci
npm run db:local
npm run dev
```

يفتح الموقع على `http://127.0.0.1:4321`، وجهة الإدارة على `/admin`. في البيئة المحلية فقط ينشئ النظام مسؤولًا بالبريد `admin@example.test`.

## الفحص

```bash
npm test
npm run check
npm run build
npm run deploy:check
```

لتشغيل اختبار التكامل، شغّل خادم التطوير ثم نفّذ `npm run test:integration`.

## تجهيز Cloudflare

1. أنشئ D1 باسم `ieee-imsiu` وR2 باسم `ieee-imsiu-files`، ثم ضع معرّف D1 الفعلي في `wrangler.jsonc`.
2. طبّق الترحيلات: `npx wrangler d1 migrations apply ieee-imsiu --remote`.
3. اضبط `ACCESS_TEAM_DOMAIN` و`ACCESS_AUD` و`INITIAL_ADMIN_EMAIL` و`EMAIL_FROM` و`TURNSTILE_SITE_KEY` في متغيرات Worker.
4. أضف الأسرار بأوامر `wrangler secret put`: `TURNSTILE_SECRET` و`RESEND_API_KEY` و`RESEND_WEBHOOK_SECRET`.
5. في Cloudflare Access، احمِ `/admin*` واسمح فقط بعناوين فريق الإدارة. يجب أن يكون البريد موجودًا أيضًا في قسم «وصول الفريق» داخل الموقع.
6. في Resend، اربط webhook بالمسار `/api/public/resend-webhook` لأحداث الإرسال والتسليم والفشل.

لا تُرسل المفاتيح أو الأسرار إلى GitHub. يمكن نشر Worker بعد اكتمال القيم السابقة بالأمر `npx wrangler deploy`.

## الصلاحيات

- `super`: جميع الأقسام، وصول الفريق، الإعلانات، والتثبيت في الرئيسية.
- `hr`: الفعاليات والتسجيلات والعضوية والأعضاء واللجان والساعات والبريد.
- `editor`: المقالات فقط.

التحقق من الصلاحيات يتم في الخادم، وليس بإخفاء عناصر الواجهة فقط. المرفقات الخاصة تحفظ في R2 ولا تُعرض إلا للأدوار المخولة.

## وثائق المشروع

- [مواصفات تصميم الإدارة](docs/ADMIN-HIFI-SPEC.md)
- [مواصفات الموقع](docs/WEBSITE-SPEC.md)
- [حدود الجودة](docs/CONSTRAINTS.md)
