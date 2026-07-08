UPDATE "Fragrance" f
SET "retailPrice" = GREATEST(15, ROUND(
    (CASE
      WHEN b.name = ANY(ARRAY['Creed','Maison Francis Kurkdjian','Xerjoff','Amouage','Roja Parfums','Roja Dove','Clive Christian','Nishane','Initio','Initio Parfums Prives','Parfums de Marly','By Kilian','Kilian','Frederic Malle','Editions de Parfums Frédéric Malle','Le Labo','Byredo','Mancera','Montale','Tiziana Terenzi','Ex Nihilo','BDK Parfums','Maison Crivelli','Marc-Antoine Barrois','Sospiro','Bond No. 9','Bond No 9','Serge Lutens','Diptyque','Memo Paris','Boadicea the Victorious']) THEN 280
      WHEN b.name = ANY(ARRAY['Dior','Christian Dior','Chanel','Yves Saint Laurent','Giorgio Armani','Armani','Versace','Prada','Gucci','Paco Rabanne','Rabanne','Jean Paul Gaultier','Valentino','Givenchy','Dolce&Gabbana','Dolce & Gabbana','Burberry','Hermès','Hermes','Guerlain','Viktor&Rolf','Viktor & Rolf','Carolina Herrera','Montblanc','Azzaro','Bvlgari','Bulgari','Tom Ford','Marc Jacobs','Calvin Klein','Hugo Boss','Lancôme','Lancome','Thierry Mugler','Mugler','Narciso Rodriguez','Jimmy Choo','Chloé','Chloe','Issey Miyake','Kenzo','Ralph Lauren']) THEN 115
      WHEN b.name = ANY(ARRAY['Zara','Lattafa','Armaf','Al Haramain','Rasasi','Ajmal','Swiss Arabian','Nautica','Adidas','Avon','The Body Shop','Nabeel','Maison Alhambra','Fragrance World','Nusuk','Bath & Body Works','Yves Rocher','Oriflame','Faberlic','Farmasi']) THEN 38
      ELSE 75
    END)
    *
    (CASE f.concentration
      WHEN 'EXTRAIT' THEN 1.35
      WHEN 'PARFUM' THEN 1.30
      WHEN 'EDP' THEN 1.00
      WHEN 'EDT' THEN 0.80
      WHEN 'EDC' THEN 0.60
      ELSE 0.90
    END)
    / 5) * 5),
    "priceEstimated" = true
FROM "Brand" b
WHERE f."brandId" = b.id AND f."retailPrice" IS NULL;
