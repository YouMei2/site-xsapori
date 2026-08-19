-- =====================================================================
--  X-Sapori Savona — схема БД для формы бронирования столиков
--  MySQL 5.7+ / MariaDB 10.2+
--
--  ВНИМАНИЕ: этот файл НЕ должен попадать в public_html.
--  Он нужен один раз при развёртывании (импорт через phpMyAdmin
--  или mysql CLI) и после этого на хостинге не нужен вообще.
--  Подробности — в README.md, раздел «Развёртывание».
-- =====================================================================

-- Кодировка utf8mb4: итальянские диакритики (à, è, ò), эмодзи в примечаниях,
-- китайские иероглифы в именах — всё влезает без потерь.
-- utf8mb4_unicode_ci выбрана сознательно: она есть и в MySQL 5.7, и в MariaDB,
-- то есть на любом шаред-хостинге. Более свежая utf8mb4_0900_ai_ci требует
-- MySQL 8.0 и на дешёвом хостинге может просто отсутствовать.

CREATE TABLE IF NOT EXISTS `bookings` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- ---------- когда ----------
  `booking_date`   DATE NOT NULL COMMENT 'дата брони',
  `booking_time`   TIME NOT NULL COMMENT 'время брони, в рабочих окнах ресторана',
  `guests`         TINYINT UNSIGNED NOT NULL COMMENT 'количество гостей, 1-40',

  -- ---------- что ----------
  -- Значения совпадают с <option value> в prenota.html и с массивами
  -- допустимых значений в config.php. Менять надо во всех трёх местах.
  -- Цена зависит и от времени суток, и от дня недели, поэтому четыре
  -- значения, а не два. Будни (пн–пт): обед 14,90 / ужин 22,90.
  -- Выходные и праздники: обед 18,90 / ужин 24,90.
  `formula`        ENUM('pranzo_feriale','cena_feriale','pranzo_weekend','cena_weekend')
                   NOT NULL DEFAULT 'cena_feriale'
                   COMMENT 'тариф: обед/ужин × будни/выходные',
  `occasion`       ENUM('nessuna','compleanno','gruppo','famiglia','altro') NOT NULL DEFAULT 'nessuna'
                   COMMENT 'повод: обычный визит / день рождения / группа-корпоратив / семья с детьми / другое',

  -- ---------- кто ----------
  `first_name`     VARCHAR(60)  NOT NULL COMMENT 'имя, 2-60 символов',
  `last_name`      VARCHAR(60)  NOT NULL COMMENT 'фамилия, 2-60 символов',
  -- Телефон хранится нормализованным: только цифры и ведущий +.
  -- 24 символа с запасом на международные номера (E.164 максимум 15 цифр).
  `phone`          VARCHAR(24)  NOT NULL COMMENT 'нормализованный телефон',
  -- Email необязателен: подтверждение брони идёт звонком.
  -- 190 символов, а не 255 — чтобы при необходимости на поле можно было
  -- повесить индекс в utf8mb4 без упора в лимит 767 байт на старых InnoDB.
  `email`          VARCHAR(190) DEFAULT NULL COMMENT 'email, необязательный',

  -- ---------- детали ----------
  -- 1000 символов = до 4000 байт в utf8mb4. Серверная валидация режет
  -- по символам (mb_substr), а не по байтам, поэтому в поле всегда влезет.
  `notes`          VARCHAR(1000) DEFAULT NULL COMMENT 'аллергии, пожелания',

  -- ---------- GDPR ----------
  -- Запись физически не создаётся без согласия, поэтому поле всегда 1.
  -- Хранится всё равно: при проверке Garante Privacy нужно уметь показать
  -- сам факт согласия, а created_at служит доказательством момента.
  `privacy_consent` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0
                   COMMENT 'согласие на обработку персональных данных',

  -- ---------- служебное ----------
  -- SHA-256 от (IP + соль из config.php) в hex = ровно 64 символа.
  -- Сам IP не хранится: для анти-спама достаточно сравнивать хеши,
  -- а без соли хеш IPv4 подбирается перебором за секунды.
  `ip_hash`        CHAR(64) NOT NULL COMMENT 'хеш IP с солью, для rate limit',
  `status`         ENUM('new','confirmed','cancelled') NOT NULL DEFAULT 'new'
                   COMMENT 'статус обработки персоналом',
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Не в вашем списке, но нужен: показывает, когда персонал сменил статус.
  -- Без него нельзя ответить на вопрос «когда эту бронь подтвердили».
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  -- Основной рабочий индекс: «покажи брони на завтрашний вечер».
  KEY `idx_slot`        (`booking_date`, `booking_time`),
  -- «Покажи все необработанные заявки».
  KEY `idx_status`      (`status`),
  -- Лента последних заявок в админке / выгрузка за период.
  KEY `idx_created`     (`created_at`),
  -- Rate limit: WHERE ip_hash = ? AND created_at > ?
  -- Составной, а не только по ip_hash: иначе MySQL отберёт все заявки
  -- этого IP за всю историю и отфильтрует по времени уже в памяти.
  KEY `idx_ratelimit`   (`ip_hash`, `created_at`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Заявки на бронирование столиков с сайта';


-- =====================================================================
--  Пользователь БД для сайта — выполнить ОДИН РАЗ вручную,
--  под root или под пользователем с правом GRANT.
--
--  Многие шаред-хостинги (Aruba, Register.it, Netsons) не дают консоль
--  MySQL и создают пользователя только через панель управления.
--  В этом случае создайте пользователя в панели и там же снимите все
--  галочки прав, кроме SELECT, INSERT, UPDATE — результат тот же.
--
--  Раскомментируйте, подставьте своё имя БД и НАСТОЯЩИЙ пароль
--  (сгенерируйте случайный, 24+ символа), затем выполните.
-- =====================================================================

-- CREATE USER 'xsapori_web'@'localhost'
--   IDENTIFIED BY 'ЗАМЕНИТЕ_НА_СЛУЧАЙНЫЙ_ПАРОЛЬ';
--
-- -- Права выданы на одну таблицу, а не на всю базу.
-- -- DELETE и DROP сознательно не выдаются: даже при полной компрометации
-- -- config.php атакующий не сможет стереть накопленные брони.
-- -- UPDATE нужен только для смены status персоналом.
-- GRANT SELECT, INSERT, UPDATE
--   ON `ИМЯ_БАЗЫ`.`bookings`
--   TO 'xsapori_web'@'localhost';
--
-- FLUSH PRIVILEGES;

-- Проверка выданных прав:
-- SHOW GRANTS FOR 'xsapori_web'@'localhost';


-- =====================================================================
--  МИГРАЦИЯ: старые значения formula -> новые (август 2026)
--
--  Нужна ТОЛЬКО если таблица уже создана со старым набором
--  ('pranzo','cena','weekend'). Для новой установки пропустить.
--
--  Порядок важен: сначала расширяем ENUM обоими наборами значений,
--  потом переносим данные, и только затем убираем старые значения.
--  Если сразу заменить список, MySQL обнулит все несовпадающие строки.
-- =====================================================================

-- ALTER TABLE `bookings` MODIFY `formula`
--   ENUM('pranzo','cena','weekend',
--        'pranzo_feriale','cena_feriale','pranzo_weekend','cena_weekend')
--   NOT NULL DEFAULT 'cena_feriale';
--
-- -- Старое 'weekend' не различало обед и ужин. Считаем по времени:
-- -- до 16:00 это обед, позже — ужин.
-- UPDATE `bookings` SET `formula` = 'pranzo_weekend'
--  WHERE `formula` = 'weekend' AND `booking_time` < '16:00:00';
-- UPDATE `bookings` SET `formula` = 'cena_weekend'
--  WHERE `formula` = 'weekend';
--
-- -- Старые 'pranzo' и 'cena' действовали в будни.
-- UPDATE `bookings` SET `formula` = 'pranzo_feriale' WHERE `formula` = 'pranzo';
-- UPDATE `bookings` SET `formula` = 'cena_feriale'   WHERE `formula` = 'cena';
--
-- -- Проверить, что старых значений не осталось:
-- SELECT `formula`, COUNT(*) FROM `bookings` GROUP BY `formula`;
--
-- -- И только теперь сузить список:
-- ALTER TABLE `bookings` MODIFY `formula`
--   ENUM('pranzo_feriale','cena_feriale','pranzo_weekend','cena_weekend')
--   NOT NULL DEFAULT 'cena_feriale';


-- =====================================================================
--  Очистка старых записей (GDPR, принцип минимизации хранения)
--
--  Данные брони не нужны вечно. Разумный срок — 24 месяца.
--  Запускать НЕ надо: пользователю сайта права DELETE не выданы.
--  Выполняйте раз в год вручную под административным пользователем.
-- =====================================================================

-- DELETE FROM `bookings`
--  WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 24 MONTH);
