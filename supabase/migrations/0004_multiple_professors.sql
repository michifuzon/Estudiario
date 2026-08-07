-- Una materia puede tener más de un profesor: professor pasa de texto
-- simple a un arreglo de texto. Convierte los valores existentes (si hay)
-- en un arreglo de un elemento en vez de perderlos.
alter table subjects
  alter column professor type text[]
  using case when professor is null or professor = '' then '{}'::text[] else array[professor] end;

alter table subjects alter column professor set default '{}';
