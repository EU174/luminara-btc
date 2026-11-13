# Luminara BTC privacy notice

Owner-approved RU/EN text of 13 November 2026, published on the hosted BTC site
in release v2.15. This file reproduces that approved notice; its reference to the
v2.14 implementation is retained verbatim. Automatic retention cleanup and backup
schedules are not enabled by this source publication.

## EN

Luminara BTC is operated by Eugene Nasyrov. Contact for personal-data questions: luminara.edtech@gmail.com. This version describes the BTC v2.14 implementation and separately identifies retention targets approved on 13 November 2026.

Anonymous preview does not require a Telegram account. A personal reviewer link grants reading access and does not create a learner profile, progress, quiz answers or permission to post. Protect the link as an access credential.

If you sign in with Telegram, the service uses your Telegram identifier and available display name or username to find or create a BTC account. The account also stores language, roles and account status. Telegram authentication does not require your phone number, seed phrase or private key. If you provide another display name or a date of birth in your account, those values are also stored in the profile. The service stores data-consent records and their expiry; that expiry does not itself establish erasure of all data.

With an account, we store lesson visits/progress, quiz responses and insights you choose to submit. Approved insights can be visible to other readers. Do not submit sensitive personal details in an insight.

Sessions use a device identifier, hashed refresh credentials and rotation records. Access tokens last 15 minutes; refresh sessions are renewed for 30 days. Expiry does not mean the database row is immediately erased. BTC session rows do not store raw client IPs, but application/infrastructure request logs may contain IP/network metadata.

Application data is held in the separate BTC PostgreSQL database on Railway, isolated from the main Luminara account database. Authorised administrators handle support/moderation; hosting providers process infrastructure data. The educational CMS is Directus and does not receive your learning profile through content reads.

The service uses session cookies and browser storage for session coordination and reading/language/theme preferences. External fonts, scripts, Telegram and embedded media may receive your IP and request metadata when loaded; their own policies apply.

Learning records are currently retained while an account exists; there is no automatic 30-day erasure. Deletion can be requested through the account interface or the operator. A successful server operation removes the account and dependent learning rows; some constraints, including reviewer links created by an administrator, may require operator handling. Historical identifiers may remain in audit records. Automatic age-based purging of audit and ended-session rows is not yet enabled.

A read-only check on 13 November 2026 confirmed that the BTC Railway volume has no automatic backup schedule and three existing manual backups have no expiry. They may persist until the operator deletes them; deleting an account does not automatically erase its earlier backups. Hosting logs have separate rules: Railway documents a 30-day log-history window for Pro, which does not establish physical erasure of every copy after 30 days.

For access, correction, export or erasure requests, email the operator above. There is no complete self-service data export; requests are handled manually after account-ownership verification. Do not send a password, seed phrase or private key. External providers may change their terms; this notice does not promise anonymity when signing in through Telegram.

Approved retention targets, not yet enabled as automatic deletion: an inactive account — 12 months with 30 days of advance notice; ended sessions — 30 days after termination, preserving related records required for session security; audit records and metadata of ended reviewer links — 180 days. Inactivity must be measured using verified human activity: background requests do not count as continued learning.

The encrypted reviewer token is already cleared when its link is revoked. The target for an expired token is clearance within 24 hours of expiry; manual backups are targeted for removal within 7 days of creation. For email data requests, the target is correspondence until closure and a minimal completion record for up to 12 months. These targets do not establish deletion of existing copies: cleanup and backup operations require separate verification. Until that is completed, the limitations above apply; contact the operator about erasure.

## RU

Оператор Luminara BTC: Eugene Nasyrov. Контакт по вопросам персональных данных: luminara.edtech@gmail.com. Эта версия описывает реализацию BTC v2.14 и отдельно — целевые сроки, согласованные 13 ноября 2026 года.

Анонимный preview не требует Telegram-аккаунта. Персональная ссылка ревьюера даёт доступ на чтение без создания учебного профиля, прогресса, ответов на квизы и права публикации. Берегите ссылку как ключ доступа.

При входе через Telegram сервис использует Telegram ID и доступное отображаемое имя или username для поиска либо создания BTC-аккаунта. Также хранятся язык, роли и статус аккаунта. Для входа не требуются номер телефона, сид-фраза или приватный ключ. Если вы укажете в кабинете другое имя или дату рождения, они также сохраняются в профиле. Сервис хранит записи согласия на обработку данных и срок их действия; этот срок сам по себе не подтверждает удаление всех данных.

В аккаунте сохраняются посещения и прогресс уроков, ответы на квизы и отправленные вами инсайты. Одобренные инсайты могут быть видны другим читателям. Не публикуйте в них чувствительные личные сведения.

Для сессий используются идентификатор устройства, хеши refresh-ключей и записи ротации. Access-токен действует 15 минут; refresh-сессия продлевается на 30 дней. Истечение срока не означает немедленного удаления строки из БД. Сессионные строки BTC не хранят исходный IP, но журналы приложения и инфраструктуры могут содержать IP и сетевые метаданные.

Данные приложения хранятся в отдельной PostgreSQL БД BTC в Railway, изолированной от аккаунтов основной Luminara. Уполномоченные администраторы занимаются поддержкой и модерацией; хостинг обрабатывает инфраструктурные данные. Учебная CMS — Directus; чтение контента не передаёт туда учебный профиль.

Сервис использует сессионные cookie и хранилище браузера для координации сессии, языка, темы и уровня чтения. Внешние шрифты, скрипты, Telegram и встроенные медиа при загрузке могут получать IP и метаданные запроса; применяются их собственные политики.

Учебные данные сейчас сохраняются, пока существует аккаунт; автоматического удаления через 30 дней нет. Удаление можно запросить через кабинет или оператора. Успешная серверная операция удаляет аккаунт и связанные учебные строки; некоторые ограничения, включая созданные администратором reviewer-ссылки, могут потребовать обработки оператором. В аудите могут остаться исторические идентификаторы. Автоматическая очистка аудита и завершённых сессий по сроку пока не включена.

Read-only сверка 13 ноября 2026 года подтвердила: у BTC-тома Railway нет расписания автоматических резервных копий; три существующие ручные копии не имеют срока истечения. Они могут сохраняться до удаления оператором; удаление аккаунта не удаляет автоматически его прежние копии. Журналы хостинга имеют отдельные правила: Railway указывает 30-дневное окно истории для тарифа Pro; это не подтверждение физического удаления всех копий через 30 дней.

Для запроса доступа, исправления, выгрузки или удаления данных напишите оператору по указанному email. Автоматической выгрузки всех данных в интерфейсе нет; такие запросы рассматриваются вручную с проверкой принадлежности аккаунта. Не отправляйте пароль, сид-фразу или приватный ключ. Условия внешних провайдеров могут меняться; эта страница не обещает анонимности входа через Telegram.

Согласованные целевые сроки, ещё не включённые как автоматическое удаление: неактивный аккаунт — 12 месяцев с предупреждением за 30 дней; завершённые сессии — 30 дней после завершения с сохранением связанных записей, необходимых для защиты сессии; аудит и метаданные завершённых reviewer-ссылок — 180 дней. Для неактивности требуется подтверждённая активность человека: фоновый запрос не считается продолжением обучения.

Зашифрованный токен reviewer-ссылки уже очищается при её отзыве. Цель для истёкшего токена — очистка не позже 24 часов после истечения; для ручных резервных копий — 7 дней с создания. Цель для обращений по email — переписка до закрытия запроса и минимальная запись исполнения до 12 месяцев. Эти целевые сроки не подтверждают удаление существующих копий: применение очистки и резервирования требует отдельной проверки. До её завершения действуют описанные выше ограничения; по вопросам удаления обращайтесь к оператору.

## Sources and language coverage

[Railway logs](https://docs.railway.com/observability/logs),[Railway backups](https://docs.railway.com/volumes/backups).
The hosted informational pages provide complete RU/EN copy and label English fallback explicitly in six other interface locales. This is not a claim of legal compliance.
