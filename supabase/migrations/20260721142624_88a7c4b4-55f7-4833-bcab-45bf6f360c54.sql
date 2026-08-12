
UPDATE public.site_content
SET data = jsonb_set(
             jsonb_set(
               jsonb_set(
                 jsonb_set(
                   COALESCE(data, '{}'::jsonb),
                   '{brand,logoLight}', to_jsonb('/__l5e/assets-v1/cc2eb405-05fe-46dc-a8b2-16162b39f2e0/tcv-bazaar-logo.png'::text), true),
                 '{brand,logoDark}',  to_jsonb('/__l5e/assets-v1/cc2eb405-05fe-46dc-a8b2-16162b39f2e0/tcv-bazaar-logo.png'::text), true),
               '{brand,logoMobile}', to_jsonb('/__l5e/assets-v1/cc2eb405-05fe-46dc-a8b2-16162b39f2e0/tcv-bazaar-logo.png'::text), true),
             '{brand,favicon}',      to_jsonb('/__l5e/assets-v1/cc2eb405-05fe-46dc-a8b2-16162b39f2e0/tcv-bazaar-logo.png'::text), true),
    updated_at = now()
WHERE id = 'main';
