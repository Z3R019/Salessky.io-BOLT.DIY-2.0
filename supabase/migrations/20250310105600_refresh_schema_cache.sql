-- Force a full schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');
