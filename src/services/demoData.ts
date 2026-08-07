import { addDays, formatISO } from 'date-fns'
import {
  semestersRepo,
  subjectsRepo,
  eventsRepo,
  gradesRepo,
  chatRepo,
  sessionsRepo,
} from './db/repositories'

const DEMO_SEMESTER_NAME = 'Semestre demo'

function iso(daysFromNow: number) {
  return formatISO(addDays(new Date(), daysFromNow), { representation: 'date' })
}

export async function seedDemoData(): Promise<void> {
  const semester = await semestersRepo.create({
    name: DEMO_SEMESTER_NAME,
    startDate: null,
    endDate: null,
    isArchived: false,
  })

  const fisica = await subjectsRepo.create({
    semesterId: semester.id,
    name: 'Física',
    professors: ['Prof. Álvarez'],
    schedule: 'Lun y Mié 18–20h',
    location: 'Aula 204',
    color: '#a5364a',
    description: 'Cinemática, dinámica y trabajo y energía.',
    difficulty: 4,
    weeklyHoursTarget: 5,
    status: 'cursando',
  })
  const matematica = await subjectsRepo.create({
    semesterId: semester.id,
    name: 'Matemática',
    professors: ['Prof. Gómez'],
    schedule: 'Mar y Jue 8–10h',
    location: 'Aula 108',
    color: '#3c4577',
    description: 'Álgebra lineal y funciones.',
    difficulty: 3,
    weeklyHoursTarget: 4,
    status: 'cursando',
  })
  const diseno = await subjectsRepo.create({
    semesterId: semester.id,
    name: 'Diseño',
    professors: ['Prof. Ibáñez'],
    schedule: 'Vie 14–18h',
    location: 'Taller 3',
    color: '#4c8c6e',
    description: 'Fundamentos de composición visual.',
    difficulty: 1,
    weeklyHoursTarget: 2,
    status: 'cursando',
  })
  const tecnologia = await subjectsRepo.create({
    semesterId: semester.id,
    name: 'Tecnología',
    professors: ['Prof. Duarte'],
    schedule: 'Mié 10–13h',
    location: 'Lab. informático',
    color: '#b8862f',
    description: 'Introducción a sistemas y programación.',
    difficulty: 2,
    weeklyHoursTarget: 3,
    status: 'cursando',
  })

  await eventsRepo.create({
    subjectId: fisica.id,
    type: 'parcial',
    title: 'Parcial de Física',
    date: iso(12),
    time: '18:00',
    topics: 'Cinemática, Dinámica',
    importance: 3,
    notes: '',
    status: 'pendiente',
  })
  await eventsRepo.create({
    subjectId: matematica.id,
    type: 'entrega',
    title: 'Guía 3',
    date: iso(5),
    time: null,
    topics: 'Sistemas de ecuaciones',
    importance: 2,
    notes: '',
    status: 'pendiente',
  })
  await eventsRepo.create({
    subjectId: diseno.id,
    type: 'trabajo_practico',
    title: 'TP composición',
    date: iso(9),
    time: null,
    topics: '',
    importance: 2,
    notes: '',
    status: 'pendiente',
  })

  await gradesRepo.create({
    subjectId: fisica.id,
    name: 'Primer parcial',
    score: 6,
    maxScore: 10,
    weight: 1,
    date: iso(-20),
    observations: '',
    status: 'aprobado',
  })
  await gradesRepo.create({
    subjectId: tecnologia.id,
    name: 'TP1',
    score: 9,
    maxScore: 10,
    weight: 1,
    date: iso(-15),
    observations: '',
    status: 'aprobado',
  })

  await chatRepo.create({
    subjectId: fisica.id,
    type: 'texto',
    text: 'El profesor dijo que el ejercicio 4 seguro lo toma en el parcial.',
    status: 'pendiente_revisar',
    pinned: false,
    tags: [],
    replyToId: null,
    linkedEventId: null,
    linkedSessionId: null,
    unit: '',
  })
  await chatRepo.create({
    subjectId: null,
    type: 'texto',
    text: 'Preguntar si el trabajo práctico se entrega en grupo o individual.',
    status: 'nuevo',
    pinned: false,
    tags: [],
    replyToId: null,
    linkedEventId: null,
    linkedSessionId: null,
    unit: '',
  })
}

export async function isDemoDataPresent(): Promise<boolean> {
  const semesters = await semestersRepo.list()
  return semesters.some((s) => s.name === DEMO_SEMESTER_NAME)
}

/**
 * Borra los datos de ejemplo pasando por cada repositorio (no directo en
 * Dexie): así el borrado también se empuja a Supabase para quien tenga
 * cuenta conectada. Antes se borraba solo local y la próxima sincronización
 * los volvía a traer de la nube como si nunca se hubieran eliminado.
 */
export async function removeDemoData(): Promise<void> {
  const semesters = (await semestersRepo.list()).filter((s) => s.name === DEMO_SEMESTER_NAME)
  if (!semesters.length) return
  const semesterIds = new Set(semesters.map((s) => s.id))

  const subjects = (await subjectsRepo.list()).filter((s) => semesterIds.has(s.semesterId))
  const subjectIds = new Set(subjects.map((s) => s.id))

  const [events, sessions, grades, chats] = await Promise.all([
    eventsRepo.list(),
    sessionsRepo.list(),
    gradesRepo.list(),
    chatRepo.list(),
  ])

  await Promise.all([
    ...events.filter((e) => e.subjectId && subjectIds.has(e.subjectId)).map((e) => eventsRepo.remove(e.id)),
    ...sessions.filter((s) => subjectIds.has(s.subjectId)).map((s) => sessionsRepo.remove(s.id)),
    ...grades.filter((g) => subjectIds.has(g.subjectId)).map((g) => gradesRepo.remove(g.id)),
    ...chats.filter((c) => c.subjectId && subjectIds.has(c.subjectId)).map((c) => chatRepo.remove(c.id)),
  ])

  await Promise.all([...subjectIds].map((id) => subjectsRepo.remove(id)))
  await Promise.all([...semesterIds].map((id) => semestersRepo.remove(id)))
}
