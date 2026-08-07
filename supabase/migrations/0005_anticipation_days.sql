-- Días de anticipación para empezar a estudiar cada materia, según su
-- dificultad (1=fácil .. 4=muy difícil). Se guarda como jsonb: {"1":5,"2":10,"3":15,"4":21}.
alter table availability
  add column if not exists anticipation_days_by_difficulty jsonb not null
  default '{"1":5,"2":10,"3":15,"4":21}';
