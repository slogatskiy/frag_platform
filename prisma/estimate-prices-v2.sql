-- Оценка цен v2: реалистичнее.
--  • 5 тиров брендов (ultra / niche / mid / designer / arabic) + разумный ELSE
--  • концентрация (null → как EDP)
--  • дефолтный объём 100 мл, где не задан
--  • детерминированный разброс ±15% по hash(slug) — чтобы цены не были одинаковыми
-- Обновляем ТОЛЬКО оценочные (priceEstimated=true) и NULL — реальные цены не трогаем.
UPDATE "Fragrance" f
SET
  "retailVolume" = COALESCE(f."retailVolume", 100),
  "retailPrice" = GREATEST(15, ROUND((
    (CASE
      -- Ultra-luxury / артизанальный уд
      WHEN b.name = ANY(ARRAY['Roja Parfums','Roja Dove','Clive Christian','Xerjoff','Amouage','Bortnikoff','Areej Le Dore','Ensar Oud','Henry Jacques','Stephane Humbert Lucas','Stéphane Humbert Lucas','SHL 777','Nishane','Boadicea the Victorious','Ford & Fitch']) THEN 400
      -- Высокая ниша
      WHEN b.name = ANY(ARRAY['Creed','Maison Francis Kurkdjian','Parfums de Marly','Initio','Initio Parfums Prives','Frederic Malle','Editions de Parfums Frédéric Malle','Le Labo','Byredo','By Kilian','Kilian','Marc-Antoine Barrois','Ex Nihilo','BDK Parfums','Maison Crivelli','Tiziana Terenzi','Bond No. 9','Bond No 9','Sospiro','Memo Paris','Mancera','Montale','Nishane','Parfum d''Empire','Vilhelm Parfumerie','Amouage']) THEN 250
      -- Средняя ниша / премиум-эксклюзивы
      WHEN b.name = ANY(ARRAY['Tom Ford','Serge Lutens','Diptyque','Guerlain','Hermès','Hermes','Maison Margiela','Penhaligon''s','Penhaligons','Jo Malone','Jo Malone London','Acqua di Parma','Aedes de Venustas','Etat Libre d''Orange','Juliette Has A Gun','Zoologist','Imaginary Authors','Nasomatto','Orto Parisi']) THEN 165
      -- Дизайнерский масс-люкс
      WHEN b.name = ANY(ARRAY['Dior','Christian Dior','Chanel','Yves Saint Laurent','Giorgio Armani','Armani','Versace','Prada','Gucci','Paco Rabanne','Rabanne','Jean Paul Gaultier','Valentino','Givenchy','Dolce&Gabbana','Dolce & Gabbana','Burberry','Viktor&Rolf','Viktor & Rolf','Carolina Herrera','Montblanc','Azzaro','Bvlgari','Bulgari','Marc Jacobs','Calvin Klein','Hugo Boss','Lancôme','Lancome','Thierry Mugler','Mugler','Narciso Rodriguez','Jimmy Choo','Chloé','Chloe','Issey Miyake','Kenzo','Ralph Lauren','Cartier','Tommy Hilfiger','Elie Saab','Lacoste']) THEN 105
      -- Арабский / бюджет / масс-маркет
      WHEN b.name = ANY(ARRAY['Zara','Lattafa','Armaf','Al Haramain','Rasasi','Ajmal','Swiss Arabian','Nautica','Adidas','Avon','The Body Shop','Nabeel','Maison Alhambra','Fragrance World','Nusuk','Bath & Body Works','Yves Rocher','Oriflame','Faberlic','Farmasi','Lomani','Jacques Bogart','Antonio Banderas','Playboy','Brut','Axe','Old Spice']) THEN 38
      ELSE 90
    END)
    *
    (CASE f.concentration
      WHEN 'EXTRAIT' THEN 1.30
      WHEN 'PARFUM' THEN 1.25
      WHEN 'EDP' THEN 1.00
      WHEN 'EDT' THEN 0.82
      WHEN 'EDC' THEN 0.62
      ELSE 1.00  -- null → как EDP (самый частый)
    END)
    *
    -- детерминированный разброс 0.85–1.15
    (0.85 + (abs(hashtext(f.slug)) % 31)::numeric / 100.0)
  ) / 5) * 5),
  "priceEstimated" = true
FROM "Brand" b
WHERE f."brandId" = b.id
  AND (f."priceEstimated" = true OR f."retailPrice" IS NULL);
