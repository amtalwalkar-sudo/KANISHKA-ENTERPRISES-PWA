export const SCREEN_METADATA_VERSION = 1;

export const SCREEN_STATES = Object.freeze({
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  READY: 'READY',
  ERROR: 'ERROR',
});

const ACTION_KINDS = new Set(['navigate', 'submit', 'open', 'confirm', 'custom']);
const FIELD_KINDS = new Set(['text', 'number', 'date', 'select', 'textarea', 'readonly']);

export function createScreenMetadata({
  id,
  title,
  subtitle = '',
  state = SCREEN_STATES.READY,
  sections = [],
  actions = [],
  context = {},
} = {}) {
  return Object.freeze({
    version: SCREEN_METADATA_VERSION,
    id: String(id || ''),
    title: String(title || ''),
    subtitle: String(subtitle || ''),
    state,
    sections: Object.freeze(sections.map((section) => Object.freeze({
      id: String(section.id || ''),
      title: String(section.title || ''),
      fields: Object.freeze((section.fields || []).map((field) => Object.freeze({ ...field }))),
    }))),
    actions: Object.freeze(actions.map((action) => Object.freeze({ ...action }))),
    context: Object.freeze({ ...context }),
  });
}

export function validateScreenMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return false;
  if (metadata.version !== SCREEN_METADATA_VERSION) return false;
  if (!metadata.id || !metadata.title) return false;
  if (!Object.values(SCREEN_STATES).includes(metadata.state)) return false;
  if (!Array.isArray(metadata.sections) || !Array.isArray(metadata.actions)) return false;

  for (const section of metadata.sections) {
    if (!section?.id || !Array.isArray(section.fields)) return false;
    for (const field of section.fields) {
      if (!field?.id || !field.label || !FIELD_KINDS.has(field.kind)) return false;
    }
  }

  for (const action of metadata.actions) {
    if (!action?.id || !action.label || !ACTION_KINDS.has(action.kind)) return false;
  }

  return true;
}

export const KFE_SCREEN_METADATA_RULES = Object.freeze({
  presentationOnly: true,
  businessLogicAllowed: false,
  financialCalculationAllowed: false,
  persistenceAccessAllowed: false,
  rendererRequired: false,
});
