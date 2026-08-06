import { addDays, formatISO } from 'date-fns'
import { db } from './db/client'
import { semestersRepo, subjectsRepo, eventsRepo, gradesRepo, chatRepo } from './db/repositories'

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
    professor: 'Prof. Álvarez',
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
    professor: 'Prof. Gómez',
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
    professor: 'Prof. Ibáñez',
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
    professor: 'Prof. Duarte',
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
  const semesters = await db.semesters.toArray()
  return semesters.some((s) => s.name === DEMO_SEMESTER_NAME && !s.deletedAt)
}

export async function removeDemoData(): Promise<void> {
  const semesters = await db.semesters.where('name').equals(DEMO_SEMESTER_NAME).toArray()
  const semesterIds = semesters.map((s) => s.id)
  if (!semesterIds.length) return

  const subjects = await db.subjects.where('semesterId').anyOf(semesterIds).toArray()
  const subjectIds = subjects.map((s) => s.id)

  await db.transaction(
    'rw',
    [db.semesters, db.subjects, db.events, db.studySessions, db.grades, db.chatMessages, db.attachments],
    async () => {
      await db.semesters.bulkDelete(semesterIds)
      await db.subjects.bulkDelete(subjectIds)
      await db.events.where('subjectId').anyOf(subjectIds).delete()
      await db.studySessions.where('subjectId').anyOf(subjectIds).delete()
      await db.grades.where('subjectId').anyOf(subjectIds).delete()
      await db.chatMessages.where('subjectId').anyOf(subjectIds).delete()
      await db.attachments.where('subjectId').anyOf(subjectIds).delete()
    },
  )
}
