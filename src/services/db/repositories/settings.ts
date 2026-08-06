import { db } from '../client'
import { newBaseRecord, touch } from '../../../lib/record'
import { queueChange } from '../../sync/outbox'
import type { AIProviderSettings, StudyProfile } from '../../../types/domain'

const AI_SETTINGS_ID = 'default'
const STUDY_PROFILE_ID = 'default'

function defaultAISettings(): AIProviderSettings {
  return { ...newBaseRecord(), id: AI_SETTINGS_ID, provider: 'ninguno', hasKeyConfigured: false, model: '' }
}

function defaultStudyProfile(): StudyProfile {
  return {
    ...newBaseRecord(),
    id: STUDY_PROFILE_ID,
    onboardingCompleted: false,
    preferredSessionMinutes: 50,
    anticipationDays: 7,
    studyMethod: '',
  }
}

export const aiSettingsRepo = {
  /** Solo lectura: no escribe nada, seguro de usar dentro de useLiveQuery. */
  async get(): Promise<AIProviderSettings> {
    return (await db.aiProviderSettings.get(AI_SETTINGS_ID)) ?? defaultAISettings()
  },
  async ensure(): Promise<AIProviderSettings> {
    const existing = await db.aiProviderSettings.get(AI_SETTINGS_ID)
    if (existing) return existing
    const record = defaultAISettings()
    await db.aiProviderSettings.put(record)
    return record
  },
  async update(patch: Partial<AIProviderSettings>): Promise<AIProviderSettings> {
    const current = await aiSettingsRepo.ensure()
    const updated = touch({ ...current, ...patch })
    await db.aiProviderSettings.put(updated)
    queueChange('aiProviderSettings', AI_SETTINGS_ID, 'upsert')
    return updated
  },
}

export const studyProfileRepo = {
  async get(): Promise<StudyProfile> {
    return (await db.studyProfile.get(STUDY_PROFILE_ID)) ?? defaultStudyProfile()
  },
  async ensure(): Promise<StudyProfile> {
    const existing = await db.studyProfile.get(STUDY_PROFILE_ID)
    if (existing) return existing
    const record = defaultStudyProfile()
    await db.studyProfile.put(record)
    return record
  },
  async update(patch: Partial<StudyProfile>): Promise<StudyProfile> {
    const current = await studyProfileRepo.ensure()
    const updated = touch({ ...current, ...patch })
    await db.studyProfile.put(updated)
    queueChange('studyProfile', STUDY_PROFILE_ID, 'upsert')
    return updated
  },
}
