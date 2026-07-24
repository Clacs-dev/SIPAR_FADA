ail_lookup:administracao@sistema.ao', jsonb_build_object('user_id', 'dept-administracao-015')),
  ('user_email_lookup:administrativo@sistema.ao', jsonb_build_object('user_id', 'dept-administrativo-016')),
  ('user_email_lookup:comunicacao@sistema.ao', jsonb_build_object('user_id', 'dept-comunicacao-017')),
  ('user_email_lookup:seguranca@sistema.ao', jsonb_build_object('user_id', 'dept-seguranca-018')),
  ('user_email_lookup:planeamento@sistema.ao', jsonb_build_object('user_id', 'dept-planeamento-019')),
  ('user_email_lookup:qualidade@sistema.ao', jsonb_build_object('user_id', 'dept-qualidade-020')),
  ('user_email_lookup:compliance@sistema.ao', jsonb_build_object('user_id', 'dept-compliance-021')),
  ('user_email_lookup:risco@sistema.ao', jsonb_build_object('user_id', 'dept-risco-022')),
  ('user_email_lookup:externo@exemplo.ao', jsonb_build_object('user_id', 'dept-externo-023'))
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- =====================================================
-- VERIFICAÇÃO - Listar todos os utilizadores criados
-- =====================================================

SELECT 
  key,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'department' as department,
  value->>'position' as position,
  value->'profiles' as profiles
FROM kv_store 
WHERE key LIKE 'user_profile:dept-%'
ORDER BY key;
