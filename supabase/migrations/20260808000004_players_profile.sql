-- Perfil: grado chileno + avatar (sexo / color de camiseta).
alter table players add column if not exists grade text not null default '2do';
alter table players add column if not exists avatar_sex text not null default 'boy';
alter table players add column if not exists avatar_color text not null default '#2f6fed';
alter table players add column if not exists display_name text not null default '';

update players set grade = '2do' where grade in ('7th', '7mo', '');
update players set display_name = username where display_name = '';

alter table players drop constraint if exists players_grade_check;
alter table players add constraint players_grade_check
  check (grade in ('1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo'));

alter table players drop constraint if exists players_avatar_sex_check;
alter table players add constraint players_avatar_sex_check
  check (avatar_sex in ('boy', 'girl'));
