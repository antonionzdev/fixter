-- =============================================================================
-- Fixter: Datos de prueba para desarrollo
-- Genera 5 perfiles y 60 anuncios repartidos entre los 5 vendedores.
--
-- IDEMPOTENTE: se puede re-ejecutar sin errores. El bloque DO limpia primero
-- todos los registros de estos vendedores (listings → conversations/reviews
-- se eliminan en cascada) antes de insertar.
--
-- IMPORTANTE: usa SET session_replication_role = replica para poder insertar
-- en public.profiles sin correspondencia en auth.users (datos de prueba).
-- El SQL Editor de Supabase corre como postgres (superuser) — esto es seguro
-- solo en entornos de desarrollo.
--
-- Ejecución: Supabase Dashboard → SQL Editor → pegar todo → Run
-- =============================================================================

-- Desactivar FK constraint profiles → auth.users para datos de prueba
SET session_replication_role = replica;

DO $$
DECLARE
  -- UUIDs fijos para poder referenciarlos de forma reproducible
  v_madrid     UUID := '11111111-1111-1111-1111-111111111101';
  v_barcelona  UUID := '11111111-1111-1111-1111-111111111102';
  v_valencia   UUID := '11111111-1111-1111-1111-111111111103';
  v_sevilla    UUID := '11111111-1111-1111-1111-111111111104';
  v_bilbao     UUID := '11111111-1111-1111-1111-111111111105';
BEGIN

  -- ---------------------------------------------------------------------------
  -- LIMPIEZA (permite re-ejecución sin duplicados)
  -- Las FKs con ON DELETE CASCADE se encargan de conversations, messages y reviews.
  -- ---------------------------------------------------------------------------
  DELETE FROM public.listings
    WHERE seller_id IN (v_madrid, v_barcelona, v_valencia, v_sevilla, v_bilbao);

  DELETE FROM public.profiles
    WHERE id IN (v_madrid, v_barcelona, v_valencia, v_sevilla, v_bilbao);

  -- ---------------------------------------------------------------------------
  -- PERFILES (5 vendedores de prueba)
  -- avatar_url y phone son opcionales (NULL)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.profiles (id, username, full_name, location, bio, created_at)
  VALUES
    (
      v_madrid,
      'vendedor_madrid',
      'Carlos García López',
      'Madrid',
      'Técnico de reparación de smartphones con 8 años de experiencia. Especializado en iPhone. Envío a toda España en 24h.',
      NOW() - INTERVAL '180 days'
    ),
    (
      v_barcelona,
      'vendedor_barcelona',
      'Laura Martínez Ros',
      'Barcelona',
      'Taller de reparación en el centro de Barcelona. Stock permanente de piezas iPhone originales y compatibles de alta calidad.',
      NOW() - INTERVAL '120 days'
    ),
    (
      v_valencia,
      'vendedor_valencia',
      'Miguel Ángel Sánchez',
      'Valencia',
      'Distribuidor mayorista de piezas de reparación. Más de 1000 referencias. Envío en 24h a toda España. Factura disponible.',
      NOW() - INTERVAL '90 days'
    ),
    (
      v_sevilla,
      'vendedor_sevilla',
      'Ana Belén Fernández',
      'Sevilla',
      'Especialista en reparación de pantallas iPhone. 5 años de servicio en Andalucía. Garantía de 6 meses en todas las piezas.',
      NOW() - INTERVAL '60 days'
    ),
    (
      v_bilbao,
      'vendedor_bilbao',
      'Iñaki Etxebarria Goñi',
      'Bilbao',
      'Importador directo de piezas iPhone desde Europa. Garantía de 3 meses. Certificadas CE. Factura incluida en todos los pedidos.',
      NOW() - INTERVAL '45 days'
    );

  -- ===========================================================================
  -- ANUNCIOS — vendedor_madrid (12 anuncios)
  -- ===========================================================================
  INSERT INTO public.listings
    (seller_id, title, description, price, category, model, condition, location, images, specs, status, created_at)
  VALUES

  -- 1 · pantallas · iPhone 15 Pro · como_nuevo
  (
    v_madrid,
    'Pantalla iPhone 15 Pro OLED original con marco',
    'Pantalla completa para iPhone 15 Pro. Panel OLED original Apple desmontada de equipo con pantalla rota. Táctil e imagen perfectos. Marco instalado. Sin rayaduras en el cristal.',
    110.00, 'pantallas', 'iPhone 15 Pro', 'como_nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '2 days'
  ),

  -- 2 · baterias · iPhone 14 · bueno
  (
    v_madrid,
    'Batería iPhone 14 original 3279 mAh salud 85%',
    'Batería original Apple para iPhone 14. Salud comprobada al 85% con iPhone Battery. Sin hinchazón, almacenada correctamente. Ideal para cambio preventivo o reparación.',
    28.00, 'baterias', 'iPhone 14', 'bueno', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Original","salud_bateria":"89-80%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '5 days'
  ),

  -- 3 · camaras · iPhone 13 Pro · como_nuevo
  (
    v_madrid,
    'Módulo cámara trasera iPhone 13 Pro triple lente',
    'Módulo de cámara trasera completo para iPhone 13 Pro. Tres objetivos: gran angular, ultraangular y teleobjetivo. Autofocus y OIS funcionando perfectamente. Flash incluido. Extraída de equipo roto.',
    75.00, 'camaras', 'iPhone 13 Pro', 'como_nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400'
    ],
    '{"posicion":"Módulo completo trasero","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"Funciona","flash_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '7 days'
  ),

  -- 4 · conectores · iPhone 12 · bueno
  (
    v_madrid,
    'Conector Lightning iPhone 12 con flex carga inalámbrica',
    'Puerto de carga Lightning para iPhone 12. Incluye el flex con la bobina de carga inalámbrica MagSafe. Original, en buen estado de funcionamiento.',
    18.00, 'conectores', 'iPhone 12', 'bueno', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_conector":"Lightning","tipo_pieza":"Original","estado":"Usado sin daños","carga_inalambrica":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '10 days'
  ),

  -- 5 · carcasas · iPhone 11 · bueno
  (
    v_madrid,
    'Carcasa trasera iPhone 11 negra original completa',
    'Carcasa trasera completa para iPhone 11 en color negro. Incluye todos los botones laterales y el cristal trasero. Algunos arañazos leves por uso normal. Sin golpes ni deformaciones.',
    22.00, 'carcasas', 'iPhone 11', 'bueno', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"estado":"Arañazos leves","color":"Negro","botones_incluidos":"Sí","cristal_trasero_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '12 days'
  ),

  -- 6 · moviles_despiece · iPhone 12 · aceptable
  (
    v_madrid,
    'iPhone 12 azul 64GB para despiece — IMEI limpio',
    'iPhone 12 de 64GB en azul para despiece. La pantalla está rota pero el táctil responde. Batería funcionando, chasis con golpe en esquina inferior. Face ID operativo. IMEI limpio, sin iCloud.',
    120.00, 'moviles_despiece', 'iPhone 12', 'aceptable', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
    ],
    '{"pantalla":"Funciona con defectos","bateria":"Funciona","chasis":"Golpes","tactil":"Funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '14 days'
  ),

  -- 7 · otros_componentes · iPhone 13 · como_nuevo
  (
    v_madrid,
    'Altavoz auricular iPhone 13 original',
    'Altavoz auricular (earpiece) original para iPhone 13. Desmontado de equipo con pantalla rota. Sonido claro, sin distorsión. Compatible también con iPhone 13 Mini.',
    12.00, 'otros_componentes', 'iPhone 13', 'como_nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_componente":"Altavoz","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '16 days'
  ),

  -- 8 · pantallas · iPhone 14 Pro · como_nuevo
  (
    v_madrid,
    'Pantalla iPhone 14 Pro OLED 120Hz original sin marco',
    'Pantalla para iPhone 14 Pro con panel OLED ProMotion 120Hz. Original Apple, sin marco. Imagen sin defectos, táctil perfecto. La vendo sin marco porque aproveché el del equipo receptor.',
    95.00, 'pantallas', 'iPhone 14 Pro', 'como_nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '18 days'
  ),

  -- 9 · baterias · iPhone 15 · nuevo
  (
    v_madrid,
    'Batería iPhone 15 100% salud nueva de stock',
    'Batería nueva de stock para iPhone 15. Sin uso, salud al 100%. Compatible con MagSafe. Incluye adhesivos de instalación. Calidad compatible premium certificada CE.',
    35.00, 'baterias', 'iPhone 15', 'nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
    ],
    '{"tipo_pieza":"Compatible","salud_bateria":"100-90%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '1 days'
  ),

  -- 10 · camaras · iPhone 15 · como_nuevo
  (
    v_madrid,
    'Cámara frontal TrueDepth iPhone 15 con Face ID',
    'Módulo de cámara frontal TrueDepth para iPhone 15. Incluye sensor de Face ID. Funcionando perfectamente, probada antes de venta. Original Apple. Sin rayaduras en el cristal.',
    40.00, 'camaras', 'iPhone 15', 'como_nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400'
    ],
    '{"posicion":"Frontal","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"No aplica","flash_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '20 days'
  ),

  -- 11 · conectores · iPhone 15 · nuevo
  (
    v_madrid,
    'Conector USB-C iPhone 15 con flex antena nuevo',
    'Puerto de carga USB-C para iPhone 15. Nuevo de stock compatible. Incluye el flex de antena. La bobina MagSafe no está incluida en este modelo de pieza.',
    16.00, 'conectores', 'iPhone 15', 'nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_conector":"USB-C","tipo_pieza":"Compatible","estado":"Nuevo","carga_inalambrica":"No"}'::jsonb,
    'active', NOW() - INTERVAL '3 days'
  ),

  -- 12 · pantallas · iPhone 13 · nuevo
  (
    v_madrid,
    'Pantalla iPhone 13 LCD compatible calidad alta con marco',
    'Pantalla para iPhone 13 con panel LCD de alta calidad. Compatible calidad superior, colores muy similares al original. Ideal para reparaciones de bajo coste. Táctil perfecto. Marco negro incluido.',
    45.00, 'pantallas', 'iPhone 13', 'nuevo', 'Madrid',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    ],
    '{"tipo_panel":"LCD","tipo_pieza":"Compatible calidad alta","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '25 days'
  );

  -- ===========================================================================
  -- ANUNCIOS — vendedor_barcelona (12 anuncios)
  -- ===========================================================================
  INSERT INTO public.listings
    (seller_id, title, description, price, category, model, condition, location, images, specs, status, created_at)
  VALUES

  -- 13 · baterias · iPhone 13 Pro · bueno
  (
    v_barcelona,
    'Batería iPhone 13 Pro original 3095 mAh salud 92%',
    'Batería original Apple para iPhone 13 Pro. Salud comprobada al 92% con iPhone Battery. Sin hinchazón, almacenada en frío. Desmontada de equipo con cámara rota.',
    30.00, 'baterias', 'iPhone 13 Pro', 'bueno', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Original","salud_bateria":"89-80%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '3 days'
  ),

  -- 14 · camaras · iPhone 14 Pro · como_nuevo
  (
    v_barcelona,
    'Módulo cámara trasera iPhone 14 Pro 48MP original',
    'Módulo de cámara trasera completo para iPhone 14 Pro. Cámara principal 48MP + ultraangular + teleobjetivo. OIS funcionando, autofocus perfecto. Flash incluido. Original extraída de terminal con pantalla rota.',
    72.00, 'camaras', 'iPhone 14 Pro', 'como_nuevo', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400'
    ],
    '{"posicion":"Módulo completo trasero","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"Funciona","flash_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '4 days'
  ),

  -- 15 · carcasas · iPhone 15 Pro · bueno
  (
    v_barcelona,
    'Carcasa chasis iPhone 15 Pro titanio azul original',
    'Carcasa de titanio original para iPhone 15 Pro en color Titanio Azul. Sin golpes, algunos microarañazos de uso normal. No incluye botones ni cristal trasero.',
    45.00, 'carcasas', 'iPhone 15 Pro', 'bueno', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"estado":"Arañazos leves","color":"Azul","botones_incluidos":"No","cristal_trasero_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '6 days'
  ),

  -- 16 · moviles_despiece · iPhone 14 · aceptable
  (
    v_barcelona,
    'iPhone 14 negro 128GB para despiece — sin iCloud',
    'iPhone 14 de 128GB en negro para despiece. Pantalla rota (cristal), táctil y Face ID operativos. Batería al 79%. Chasis con arañazos. IMEI limpio, libre de iCloud. Cámara trasera perfecta.',
    145.00, 'moviles_despiece', 'iPhone 14', 'aceptable', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400'
    ],
    '{"pantalla":"Funciona con defectos","bateria":"Funciona","chasis":"Arañazos","tactil":"Funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '8 days'
  ),

  -- 17 · pantallas · iPhone 12 Pro · como_nuevo
  (
    v_barcelona,
    'Pantalla iPhone 12 Pro OLED original con marco negro',
    'Pantalla completa con marco para iPhone 12 Pro. Panel OLED original Apple, funcionando perfectamente. Marco negro. Sin rayaduras ni manchas. Lista para instalar.',
    75.00, 'pantallas', 'iPhone 12 Pro', 'como_nuevo', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '9 days'
  ),

  -- 18 · conectores · iPhone X · bueno
  (
    v_barcelona,
    'Conector Lightning iPhone X con flex completo',
    'Módulo de conector Lightning para iPhone X con el flex completo (incluye micrófono principal y antena). Original, con desgaste leve por uso. Funcionando correctamente.',
    14.00, 'conectores', 'iPhone X', 'bueno', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_conector":"Lightning","tipo_pieza":"Original","estado":"Desgaste visible","carga_inalambrica":"No"}'::jsonb,
    'active', NOW() - INTERVAL '11 days'
  ),

  -- 19 · otros_componentes · iPhone 12 · bueno
  (
    v_barcelona,
    'Micrófono inferior iPhone 12 original',
    'Micrófono inferior para iPhone 12. Pieza original desmontada. Funcionando perfectamente, sin ruidos ni distorsión. Compatible con iPhone 12 y 12 Mini.',
    8.00, 'otros_componentes', 'iPhone 12', 'bueno', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1583394293716-0cd294ac2313?w=400'
    ],
    '{"tipo_componente":"Micrófono","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '13 days'
  ),

  -- 20 · baterias · iPhone 12 Mini · nuevo
  (
    v_barcelona,
    'Batería iPhone 12 Mini 2227 mAh compatible nueva',
    'Batería nueva compatible para iPhone 12 Mini. Sin uso, máxima capacidad. Calidad A+, certificada CE. Incluye herramientas adhesivas para instalación.',
    15.00, 'baterias', 'iPhone 12 Mini', 'nuevo', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Compatible","salud_bateria":"100-90%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '15 days'
  ),

  -- 21 · carcasas · iPhone 14 · bueno
  (
    v_barcelona,
    'Carcasa trasera iPhone 14 color Natural original',
    'Carcasa trasera de cristal para iPhone 14 en color Natural. Incluye cristal trasero y marco de aluminio. Algunos golpes leves en el borde. Botones no incluidos.',
    32.00, 'carcasas', 'iPhone 14', 'bueno', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"estado":"Golpes visibles","color":"Natural","botones_incluidos":"No","cristal_trasero_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '17 days'
  ),

  -- 22 · pantallas · iPhone 11 · nuevo
  (
    v_barcelona,
    'Pantalla iPhone 11 Liquid Retina LCD compatible alta calidad',
    'Pantalla para iPhone 11 con panel LCD compatible de alta calidad. Colores fieles, brillo adecuado. Sin rayaduras. Marco negro incluido. Stock de varias unidades disponibles.',
    38.00, 'pantallas', 'iPhone 11', 'nuevo', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400'
    ],
    '{"tipo_panel":"LCD","tipo_pieza":"Compatible calidad alta","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '20 days'
  ),

  -- 23 · moviles_despiece · iPhone 13 · aceptable
  (
    v_barcelona,
    'iPhone 13 verde 256GB para despiece — Face ID OK',
    'iPhone 13 de 256GB en verde para despiece. Pantalla con manchas (imagen defectuosa), táctil funciona. Batería al 82%. Chasis sin daños graves. Face ID operativo. IMEI limpio.',
    160.00, 'moviles_despiece', 'iPhone 13', 'aceptable', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
    ],
    '{"pantalla":"Funciona con defectos","bateria":"Funciona","chasis":"Arañazos","tactil":"Funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '22 days'
  ),

  -- 24 · otros_componentes · iPhone 13 · como_nuevo
  (
    v_barcelona,
    'Flex sensor Face ID Dot Projector iPhone 13',
    'Cable flex del Dot Projector para Face ID en iPhone 13. Original Apple. Nota: la sustitución requiere emparejamiento con Apple Service Toolkit. Para técnicos con acceso al sistema.',
    35.00, 'otros_componentes', 'iPhone 13', 'como_nuevo', 'Barcelona',
    ARRAY[
      'https://images.unsplash.com/photo-1583394293716-0cd294ac2313?w=400'
    ],
    '{"tipo_componente":"Cable flex","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '27 days'
  );

  -- ===========================================================================
  -- ANUNCIOS — vendedor_valencia (12 anuncios)
  -- ===========================================================================
  INSERT INTO public.listings
    (seller_id, title, description, price, category, model, condition, location, images, specs, status, created_at)
  VALUES

  -- 25 · pantallas · iPhone 16 Pro · como_nuevo
  (
    v_valencia,
    'Pantalla iPhone 16 Pro OLED ProMotion 120Hz original',
    'Pantalla completa para iPhone 16 Pro. Panel OLED con ProMotion adaptativo 120Hz. Original Apple, sin marco. Imagen y táctil perfectos. Disponible inmediatamente.',
    115.00, 'pantallas', 'iPhone 16 Pro', 'como_nuevo', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '1 days'
  ),

  -- 26 · baterias · iPhone 16 · nuevo
  (
    v_valencia,
    'Batería iPhone 16 nueva 3561 mAh stock importación',
    'Batería nueva para iPhone 16 de stock de importación. Sin uso, 100% de salud. Calidad compatible A+. Sin hinchazón. Incluye adhesivos de instalación.',
    32.00, 'baterias', 'iPhone 16', 'nuevo', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Compatible","salud_bateria":"100-90%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '2 days'
  ),

  -- 27 · camaras · iPhone 16 Pro Max · como_nuevo
  (
    v_valencia,
    'Módulo cámara trasera iPhone 16 Pro Max Tetra Prism 5x',
    'Módulo de cámara trasera para iPhone 16 Pro Max. Sistema de 5 lentes con Tetra Prism 5x. Autofocus y OIS perfectos. Flash incluido. Original extraída de terminal con display roto.',
    78.00, 'camaras', 'iPhone 16 Pro Max', 'como_nuevo', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400'
    ],
    '{"posicion":"Módulo completo trasero","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"Funciona","flash_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '3 days'
  ),

  -- 28 · carcasas · iPhone 13 · bueno
  (
    v_valencia,
    'Carcasa iPhone 13 Blanco Estrella original completa',
    'Carcasa trasera para iPhone 13 en Blanco Estrella. Cristal trasero y marco de aluminio. Botones laterales incluidos. Sin golpes, algunos arañazos imperceptibles.',
    28.00, 'carcasas', 'iPhone 13', 'bueno', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"estado":"Arañazos leves","color":"Blanco","botones_incluidos":"Sí","cristal_trasero_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '5 days'
  ),

  -- 29 · moviles_despiece · iPhone 15 · bueno
  (
    v_valencia,
    'iPhone 15 rosa 512GB despiece — pantalla perfecta',
    'iPhone 15 de 512GB en rosa para despiece. Pantalla OLED perfecta, sin defectos. Batería al 88%. Chasis con pequeños golpes en marco. Face ID OK. IMEI limpio, libre de iCloud.',
    220.00, 'moviles_despiece', 'iPhone 15', 'bueno', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    ],
    '{"pantalla":"Funciona perfecta","bateria":"Funciona","chasis":"Golpes","tactil":"Funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '7 days'
  ),

  -- 30 · conectores · iPhone 16 · nuevo
  (
    v_valencia,
    'Conector USB-C 3.0 iPhone 16 con flex MagSafe nuevo',
    'Conector USB-C (USB 3.0) para iPhone 16. Nuevo de stock. Incluye flex completo con bobina MagSafe y antena. Compatible con carga rápida 45W.',
    20.00, 'conectores', 'iPhone 16', 'nuevo', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_conector":"USB-C","tipo_pieza":"Compatible","estado":"Nuevo","carga_inalambrica":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '4 days'
  ),

  -- 31 · otros_componentes · iPhone 14 Plus · como_nuevo
  (
    v_valencia,
    'Altavoz auricular iPhone 14 Plus original',
    'Altavoz auricular para iPhone 14 Plus. Original Apple, desmontado de equipo con pantalla rota. Sin distorsión, sonido claro. Fácil instalación.',
    14.00, 'otros_componentes', 'iPhone 14 Plus', 'como_nuevo', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1583394293716-0cd294ac2313?w=400'
    ],
    '{"tipo_componente":"Altavoz","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '9 days'
  ),

  -- 32 · pantallas · iPhone 14 · bueno
  (
    v_valencia,
    'Pantalla iPhone 14 Super Retina XDR OLED con marco',
    'Pantalla completa con marco para iPhone 14. Panel OLED Super Retina XDR. Original Apple, marco negro. Rayaduras muy leves en cristal (casi imperceptibles). Táctil e imagen perfectos.',
    82.00, 'pantallas', 'iPhone 14', 'bueno', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Rayaduras leves","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '11 days'
  ),

  -- 33 · baterias · iPhone 11 · nuevo
  (
    v_valencia,
    'Batería iPhone 11 compatible calidad A+ 3110 mAh',
    'Batería compatible calidad A+ para iPhone 11. Nueva, sin uso. Capacidad original 3110 mAh. Certificada CE, sin memoria de ciclos. Ideal para renovar teléfonos con batería degradada.',
    14.00, 'baterias', 'iPhone 11', 'nuevo', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Compatible","salud_bateria":"100-90%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '13 days'
  ),

  -- 34 · camaras · iPhone 12 · como_nuevo
  (
    v_valencia,
    'Cámara frontal TrueDepth iPhone 12 con Face ID',
    'Módulo de cámara frontal para iPhone 12. Incluye sensor TrueDepth con Face ID. Original Apple. Sin rayaduras, autofocus funcionando. Extraída de equipo con pantalla rota.',
    32.00, 'camaras', 'iPhone 12', 'como_nuevo', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400'
    ],
    '{"posicion":"Frontal","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"No aplica","flash_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '15 days'
  ),

  -- 35 · otros_componentes · iPhone 12 Pro · bueno
  (
    v_valencia,
    'Placa base iPhone 12 Pro 256GB funcionando — sin Face ID',
    'Placa base para iPhone 12 Pro de 256GB. Arranca sin problemas. Face ID no operativo (sensor desvinculado). Para recuperación de datos o reemplazo de placa. Sin iCloud.',
    38.00, 'otros_componentes', 'iPhone 12 Pro', 'bueno', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      'https://images.unsplash.com/photo-1583394293716-0cd294ac2313?w=400'
    ],
    '{"tipo_componente":"Placa base","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '19 days'
  ),

  -- 36 · carcasas · iPhone 12 · bueno
  (
    v_valencia,
    'Marco aluminio iPhone 12 negro sin cristal ni botones',
    'Marco de aluminio para iPhone 12 en negro. Sin cristal trasero. Sin botones. Algunos arañazos en el marco. Para reparadores que ya tienen la parte delantera y trasera.',
    18.00, 'carcasas', 'iPhone 12', 'bueno', 'Valencia',
    ARRAY[
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"estado":"Arañazos leves","color":"Negro","botones_incluidos":"No","cristal_trasero_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '23 days'
  );

  -- ===========================================================================
  -- ANUNCIOS — vendedor_sevilla (12 anuncios)
  -- ===========================================================================
  INSERT INTO public.listings
    (seller_id, title, description, price, category, model, condition, location, images, specs, status, created_at)
  VALUES

  -- 37 · pantallas · iPhone 12 Mini · bueno
  (
    v_sevilla,
    'Pantalla iPhone 12 Mini Super Retina XDR OLED original',
    'Pantalla OLED original para iPhone 12 Mini. Sin marco. Imagen perfecta, táctil respondiendo correctamente. Rayaduras imperceptibles en el cristal. Lista para instalar.',
    55.00, 'pantallas', 'iPhone 12 Mini', 'bueno', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Rayaduras leves","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '2 days'
  ),

  -- 38 · baterias · iPhone 13 Mini · como_nuevo
  (
    v_sevilla,
    'Batería iPhone 13 Mini original 2406 mAh salud 95%',
    'Batería original Apple para iPhone 13 Mini. Salud al 95%, prácticamente nueva. Sin hinchazón. Desmontada por cliente que cambió de teléfono. Ciclos muy bajos.',
    22.00, 'baterias', 'iPhone 13 Mini', 'como_nuevo', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Original","salud_bateria":"100-90%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '4 days'
  ),

  -- 39 · moviles_despiece · iPhone 11 · aceptable
  (
    v_sevilla,
    'iPhone 11 amarillo 64GB despiece — cámara perfecta',
    'iPhone 11 de 64GB en amarillo para despiece. Pantalla sin imagen (táctil muerto). Batería funcionando. Cámara trasera perfecta. Touch ID OK. IMEI limpio, sin iCloud.',
    95.00, 'moviles_despiece', 'iPhone 11', 'aceptable', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400'
    ],
    '{"pantalla":"Funciona con defectos","bateria":"Funciona","chasis":"Sin daños","tactil":"No funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '6 days'
  ),

  -- 40 · conectores · iPhone 8 · nuevo
  (
    v_sevilla,
    'Conector Lightning iPhone 8 compatible nuevo con flex',
    'Puerto de carga Lightning nuevo compatible para iPhone 8. Calidad A+. Incluye micrófono y altavoz en el flex. Instalación sencilla. Stock de varias unidades.',
    10.00, 'conectores', 'iPhone 8', 'nuevo', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_conector":"Lightning","tipo_pieza":"Compatible","estado":"Nuevo","carga_inalambrica":"No"}'::jsonb,
    'active', NOW() - INTERVAL '8 days'
  ),

  -- 41 · camaras · iPhone 12 Pro Max · como_nuevo
  (
    v_sevilla,
    'Módulo cámara trasera iPhone 12 Pro Max triple lente',
    'Módulo completo de cámara trasera para iPhone 12 Pro Max. Triple lente (12MP x3). OIS en gran angular y teleobjetivo. Sin rayaduras en los objetivos. Funciona perfectamente.',
    65.00, 'camaras', 'iPhone 12 Pro Max', 'como_nuevo', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400'
    ],
    '{"posicion":"Módulo completo trasero","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"Funciona","flash_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '10 days'
  ),

  -- 42 · carcasas · iPhone 15 Plus · como_nuevo
  (
    v_sevilla,
    'Carcasa trasera iPhone 15 Plus azul original completa',
    'Carcasa trasera para iPhone 15 Plus en color Azul. Cristal trasero intacto, sin rayaduras. Marco de aluminio sin golpes. Botones incluidos. Perfecto estado general.',
    35.00, 'carcasas', 'iPhone 15 Plus', 'como_nuevo', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"estado":"Sin daños","color":"Azul","botones_incluidos":"Sí","cristal_trasero_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '12 days'
  ),

  -- 43 · otros_componentes · iPhone 13 Pro · como_nuevo
  (
    v_sevilla,
    'Motor vibrador Taptic Engine iPhone 13 Pro original',
    'Motor vibrador (Taptic Engine) para iPhone 13 Pro. Original Apple. Vibración háptica perfecta, sin ruidos extraños. Desmontado de equipo liquidado.',
    18.00, 'otros_componentes', 'iPhone 13 Pro', 'como_nuevo', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1583394293716-0cd294ac2313?w=400'
    ],
    '{"tipo_componente":"Vibrador","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '14 days'
  ),

  -- 44 · pantallas · iPhone 13 Mini · como_nuevo
  (
    v_sevilla,
    'Pantalla iPhone 13 Mini OLED original sin marco',
    'Pantalla OLED original para iPhone 13 Mini. Sin marco. Sin rayaduras en el cristal. Táctil e imagen en perfectas condiciones. Probada antes de vender.',
    58.00, 'pantallas', 'iPhone 13 Mini', 'como_nuevo', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '16 days'
  ),

  -- 45 · baterias · iPhone 14 Pro · como_nuevo
  (
    v_sevilla,
    'Batería iPhone 14 Pro original 3200 mAh salud 100%',
    'Batería original Apple para iPhone 14 Pro. Salud al 100% (equipo era de exposición, muy poco uso). Sin hinchazón. Excelente oportunidad para reparación de alta gama.',
    38.00, 'baterias', 'iPhone 14 Pro', 'como_nuevo', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
    ],
    '{"tipo_pieza":"Original","salud_bateria":"100-90%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '18 days'
  ),

  -- 46 · camaras · iPhone 14 · bueno
  (
    v_sevilla,
    'Cámara frontal TrueDepth 12MP iPhone 14 con Face ID',
    'Cámara frontal completa para iPhone 14 con módulo TrueDepth y Face ID. Original. Autofocus funcionando. Rayaduras muy leves en el cristal. Compatible con iPhone 14 Plus.',
    35.00, 'camaras', 'iPhone 14', 'bueno', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400'
    ],
    '{"posicion":"Frontal","tipo_pieza":"Original","estado_optico":"Rayaduras leves","autofocus":"Funciona","ois":"No aplica","flash_incluido":"No"}'::jsonb,
    'active', NOW() - INTERVAL '21 days'
  ),

  -- 47 · moviles_despiece · iPhone 12 Pro · aceptable
  (
    v_sevilla,
    'iPhone 12 Pro grafito 512GB despiece — placa base OK',
    'iPhone 12 Pro de 512GB en grafito. Pantalla completamente rota. Placa base funcionando al 100%. Batería al 76%. Face ID operativo. IMEI limpio, sin iCloud bloqueado.',
    175.00, 'moviles_despiece', 'iPhone 12 Pro', 'aceptable', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
    ],
    '{"pantalla":"No funciona","bateria":"Funciona","chasis":"Sin daños","tactil":"No funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '24 days'
  ),

  -- 48 · otros_componentes · iPhone 12 · bueno
  (
    v_sevilla,
    'Flex sensor Face ID Dot Projector iPhone 12',
    'Flex del Dot Projector para Face ID en iPhone 12. Original Apple. Requiere emparejamiento con Apple Service Toolkit. Para técnicos certificados o con acceso al sistema de diagnóstico.',
    28.00, 'otros_componentes', 'iPhone 12', 'bueno', 'Sevilla',
    ARRAY[
      'https://images.unsplash.com/photo-1583394293716-0cd294ac2313?w=400'
    ],
    '{"tipo_componente":"Sensor","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '29 days'
  );

  -- ===========================================================================
  -- ANUNCIOS — vendedor_bilbao (12 anuncios)
  -- ===========================================================================
  INSERT INTO public.listings
    (seller_id, title, description, price, category, model, condition, location, images, specs, status, created_at)
  VALUES

  -- 49 · pantallas · iPhone 15 · como_nuevo
  (
    v_bilbao,
    'Pantalla iPhone 15 Super Retina XDR OLED con marco',
    'Pantalla completa con marco para iPhone 15. Panel OLED original Apple. Sin rayaduras, táctil perfecto, sin manchas ni píxeles muertos. Marco negro. Lista para instalar.',
    85.00, 'pantallas', 'iPhone 15', 'como_nuevo', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Original","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '1 days'
  ),

  -- 50 · baterias · iPhone 12 · nuevo
  (
    v_bilbao,
    'Batería iPhone 12 compatible 2815 mAh calidad A++',
    'Batería compatible A++ para iPhone 12. Capacidad original. Nueva de fábrica, ciclos en cero. Certificada para uso en Europa. Incluye adhesivos de instalación.',
    16.00, 'baterias', 'iPhone 12', 'nuevo', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Compatible","salud_bateria":"100-90%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '3 days'
  ),

  -- 51 · camaras · iPhone 15 Plus · como_nuevo
  (
    v_bilbao,
    'Módulo cámara trasera iPhone 15 Plus 48MP original',
    'Módulo de cámara trasera doble para iPhone 15 Plus. Gran angular 48MP + ultraangular. OIS en ambas lentes. Autofocus funcionando. Original Apple. Extraída de equipo accidentado.',
    55.00, 'camaras', 'iPhone 15 Plus', 'como_nuevo', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400'
    ],
    '{"posicion":"Módulo completo trasero","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"Funciona","flash_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '5 days'
  ),

  -- 52 · conectores · iPhone 15 Pro · bueno
  (
    v_bilbao,
    'Conector USB-C Thunderbolt iPhone 15 Pro original',
    'Conector USB-C con soporte Thunderbolt/USB 3.0 para iPhone 15 Pro. Original Apple. Incluye bobina MagSafe. En buen estado, sin daños visibles en los pines.',
    22.00, 'conectores', 'iPhone 15 Pro', 'bueno', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_conector":"USB-C","tipo_pieza":"Original","estado":"Usado sin daños","carga_inalambrica":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '6 days'
  ),

  -- 53 · moviles_despiece · iPhone 16 · bueno
  (
    v_bilbao,
    'iPhone 16 negro 256GB despiece — pantalla perfecta',
    'iPhone 16 de 256GB en negro mate. Pantalla perfecta sin ningún defecto. Batería al 91%. Chasis impecable. Face ID funcionando. IMEI limpio. Libre de iCloud.',
    270.00, 'moviles_despiece', 'iPhone 16', 'bueno', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    ],
    '{"pantalla":"Funciona perfecta","bateria":"Funciona","chasis":"Sin daños","tactil":"Funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '2 days'
  ),

  -- 54 · carcasas · iPhone 11 · bueno
  (
    v_bilbao,
    'Carcasa trasera iPhone 11 PRODUCT RED original',
    'Carcasa completa en rojo (PRODUCT RED) para iPhone 11. Cristal trasero incluido. Botones laterales incluidos. Golpes leves en esquina superior. Muy buen estado general.',
    20.00, 'carcasas', 'iPhone 11', 'bueno', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ],
    '{"estado":"Golpes visibles","color":"Rojo","botones_incluidos":"Sí","cristal_trasero_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '10 days'
  ),

  -- 55 · otros_componentes · iPhone 14 · como_nuevo
  (
    v_bilbao,
    'Flex botones volumen y silencio iPhone 14 original',
    'Cable flex de botones de volumen (subir/bajar) y selector de silencio para iPhone 14. Original Apple. Funcionando perfectamente. Sin daños en el conector.',
    12.00, 'otros_componentes', 'iPhone 14', 'como_nuevo', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1583394293716-0cd294ac2313?w=400'
    ],
    '{"tipo_componente":"Cable flex","tipo_pieza":"Original","estado":"Usado funcional"}'::jsonb,
    'active', NOW() - INTERVAL '12 days'
  ),

  -- 56 · pantallas · iPhone 16 · nuevo
  (
    v_bilbao,
    'Pantalla iPhone 16 OLED compatible calidad alta con marco',
    'Pantalla para iPhone 16 con panel OLED compatible de alta calidad. Nueva. Brillo y colores similares al original. Táctil muy sensible. Marco negro incluido.',
    65.00, 'pantallas', 'iPhone 16', 'nuevo', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    ],
    '{"tipo_panel":"OLED","tipo_pieza":"Compatible calidad alta","estado_cristal":"Sin rayaduras","tactil":"Funciona perfecto","imagen":"Sin defectos","marco_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '8 days'
  ),

  -- 57 · baterias · iPhone 13 · bueno
  (
    v_bilbao,
    'Batería iPhone 13 original 3227 mAh salud 86%',
    'Batería original Apple para iPhone 13. Salud comprobada al 86%. Sin hinchazón. Almacenada correctamente. Ideal para alargar la vida del teléfono sin pagar precio de original al 100%.',
    24.00, 'baterias', 'iPhone 13', 'bueno', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'
    ],
    '{"tipo_pieza":"Original","salud_bateria":"89-80%","estado_fisico":"Sin hinchazón"}'::jsonb,
    'active', NOW() - INTERVAL '14 days'
  ),

  -- 58 · camaras · iPhone 15 Pro Max · como_nuevo
  (
    v_bilbao,
    'Módulo cámara trasera iPhone 15 Pro Max Tetra Prism 5x',
    'Módulo completo de cámara trasera para iPhone 15 Pro Max. Sistema de cuatro lentes con Tetra Prism 5x. OIS y autofocus perfectos. Flash incluido. Original extraída de terminal con daño en cámara frontal.',
    76.00, 'camaras', 'iPhone 15 Pro Max', 'como_nuevo', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    ],
    '{"posicion":"Módulo completo trasero","tipo_pieza":"Original","estado_optico":"Sin rayaduras","autofocus":"Funciona","ois":"Funciona","flash_incluido":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '16 days'
  ),

  -- 59 · moviles_despiece · iPhone 13 Pro Max · aceptable
  (
    v_bilbao,
    'iPhone 13 Pro Max plateado 1TB despiece — cámara intacta',
    'iPhone 13 Pro Max de 1TB en plata. Pantalla completamente rota. Cámara trasera perfecta (tres objetivos). Batería al 80%. Chasis con golpes. Face ID OK. IMEI limpio, sin iCloud bloqueado.',
    200.00, 'moviles_despiece', 'iPhone 13 Pro Max', 'aceptable', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
    ],
    '{"pantalla":"No funciona","bateria":"Funciona","chasis":"Golpes","tactil":"No funciona","camara_trasera":"Funciona","face_id_touch_id":"Funciona","bloqueado_por_cuenta":"Libre","imei":"Limpio"}'::jsonb,
    'active', NOW() - INTERVAL '20 days'
  ),

  -- 60 · conectores · iPhone 11 · bueno
  (
    v_bilbao,
    'Conector Lightning iPhone 11 con bobina carga inalámbrica Qi',
    'Puerto de carga Lightning para iPhone 11. Original Apple. Incluye bobina de carga inalámbrica Qi. En buen estado, funciona correctamente. Desmontado de equipo con pantalla rota.',
    15.00, 'conectores', 'iPhone 11', 'bueno', 'Bilbao',
    ARRAY[
      'https://images.unsplash.com/photo-1556438064-2ff21d01eb23?w=400'
    ],
    '{"tipo_conector":"Lightning","tipo_pieza":"Original","estado":"Usado sin daños","carga_inalambrica":"Sí"}'::jsonb,
    'active', NOW() - INTERVAL '26 days'
  );

END;
$$;

-- Restaurar comportamiento normal de FK constraints
SET session_replication_role = DEFAULT;

-- =============================================================================
-- RESUMEN DE DATOS GENERADOS
-- =============================================================================
--
-- PERFILES (5):
--   11111111-1111-1111-1111-111111111101  vendedor_madrid    Carlos García López
--   11111111-1111-1111-1111-111111111102  vendedor_barcelona Laura Martínez Ros
--   11111111-1111-1111-1111-111111111103  vendedor_valencia  Miguel Ángel Sánchez
--   11111111-1111-1111-1111-111111111104  vendedor_sevilla   Ana Belén Fernández
--   11111111-1111-1111-1111-111111111105  vendedor_bilbao    Iñaki Etxebarria Goñi
--
-- ANUNCIOS (60 total — 12 por vendedor):
--   Categorías:       pantallas (12), baterias (12), camaras (10),
--                     conectores (10), carcasas (9), moviles_despiece (7),
--                     otros_componentes (10) — repartidas entre los 5 vendedores
--   Condiciones:      nuevo, como_nuevo, bueno, aceptable
--   Modelos:          iPhone 8 hasta iPhone 16 Pro Max
--   Precios:          pantallas 38-115€ | baterias 14-38€ | camaras 32-78€
--                     conectores 10-22€  | carcasas 18-45€ | moviles_despiece 95-270€
--                     otros_componentes 8-38€
--   created_at:       distribuidos en los últimos 30 días
--   Images:           URLs fijas de Unsplash (no caducan)
--
-- =============================================================================
-- CÓMO EJECUTAR EN SUPABASE DASHBOARD
-- =============================================================================
--
--   1. Abre https://supabase.com/dashboard y entra en tu proyecto
--   2. En el menú lateral izquierdo → "SQL Editor"
--   3. Clic en "New query" (esquina superior derecha)
--   4. Pega el contenido completo de este archivo
--   5. Clic en "Run" (▶ o Ctrl+Enter)
--   6. Verifica que el mensaje sea "Success. No rows returned"
--   7. Comprueba los datos: Table Editor → profiles → filtra por
--      username LIKE 'vendedor_%' para ver los 5 perfiles creados
--
-- NOTA — session_replication_role:
--   La primera línea (SET session_replication_role = replica) es necesaria
--   para insertar en public.profiles sin registros correspondientes en
--   auth.users. Es seguro en desarrollo. No ejecutar este script en producción
--   con usuarios reales.
--
-- PARA RE-EJECUTAR:
--   El script es idempotente. Simplemente pégalo y ejecuta de nuevo —
--   borrará los datos anteriores de estos 5 vendedores y los recreará.
--   Los listings se borran en cascada junto con sus conversations/messages
--   y reviews asociados.
-- =============================================================================
