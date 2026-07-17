import type { Language } from '../../models/language';

/** Textos de interfaz por idioma. Claves planas, interpolación simple con
 * `{{variable}}` (ver `useTranslation`). La pluralización (p. ej. "noche" vs
 * "noches") se resuelve en el llamador eligiendo la clave adecuada. */
export const STRINGS = {
  es: {
    // Onboarding
    onboardingEyebrow: 'Bienvenida a Lumma',
    onboardingTitle: 'Tu ritual nocturno empieza aquí',
    onboardingLede:
      'Solo dos cosas antes de tu primer firmamento: tu signo y a qué hora quieres tu recordatorio.',
    onboardingSignQuestion: '¿Cuál es tu signo?',
    onboardingTimeQuestion: '¿Cuándo quieres tu recordatorio?',
    onboardingNicknameQuestion: '¿Cómo te llamamos?',
    onboardingPrivacy:
      'Esto se guarda solo en tu teléfono. Puedes borrarlo cuando quieras desde Ajustes.',
    onboardingCta: 'Comenzar mi ritual',
    onboardingSaving: 'Guardando…',
    optional: '(opcional)',
    nicknamePlaceholder: 'Tu nombre',
    languageLabel: 'Idioma',
    languageSpanish: 'Español',
    languageEnglish: 'English',

    // Home
    greetingWithName: 'Hola, {{name}}',
    greetingNoName: 'Hola de nuevo',
    noContentFallback:
      'Hoy no encontramos tu guía astrológica. Vuelve a intentarlo mañana.',
    todayPreview: 'Hoy: {{label}}',
    moodButtonEdit: 'Editar mi ánimo de hoy',
    moodButtonNew: 'Registrar mi ánimo de hoy',
    firmamentLink: 'Ver mi firmamento personal',

    // Mood
    moodEyebrowEdit: 'Edita tu día',
    moodEyebrowNew: 'Tu día de hoy',
    moodTitle: '¿Cómo te sientes?',
    moodLede: 'Elige un color. Se sumará a tu firmamento personal.',
    moodNoteLabel: 'Una nota',
    moodNotePlaceholder: '¿Algo que quieras recordar de hoy?',
    save: 'Guardar',
    saving: 'Guardando…',

    // Firmament
    back: '‹ Volver',
    firmamentTitle: 'Tu firmamento',
    loading: 'Cargando…',
    nightsRegisteredOne: '1 noche registrada',
    nightsRegisteredMany: '{{count}} noches registradas',
    chooseYear: 'Elige un año',
    noNoteThatDay: 'Sin nota ese día.',
    close: 'Cerrar',

    // Settings
    settingsTitle: 'Ajustes',
    sectionAccount: 'Mi cuenta',
    sectionSign: 'Tu signo',
    sectionPhraseReminder: 'Recordatorio de tu lectura diaria',
    sectionMoodReminder: 'Recordatorio de ánimo',
    moodReminderSwitchLabel: 'Recibir un recordatorio para registrar mi ánimo',
    saveChanges: 'Guardar cambios',
    sectionPrivacy: 'Privacidad y datos',
    privacyBody:
      'Todo lo que registras (perfil, ánimo, ajustes) se guarda solo en este teléfono. Lumma no tiene cuentas ni servidor: nada de esto sale de tu dispositivo.',
    wipeButton: 'Borrar todos mis datos',
    wipeAlertTitle: 'Borrar todos mis datos',
    wipeAlertMessage:
      'Esto elimina tu perfil, tus registros de ánimo y tus ajustes de este teléfono. No se puede deshacer.',
    wipeAlertCancel: 'Cancelar',
    wipeAlertConfirm: 'Borrar todo',

    // Notifications
    notifPhraseTitle: '{{sign}} · tu lectura de hoy',
    notifPhraseChannelName: 'Frase diaria',
    notifMoodChannelName: 'Recordatorio de ánimo',
    notifMoodTitle: 'Tu ritual diario',
    notifMoodBody: '¿Cómo te sientes hoy? Registra tu ánimo en Lumma.',
  },
  en: {
    // Onboarding
    onboardingEyebrow: 'Welcome to Lumma',
    onboardingTitle: 'Your nightly ritual starts here',
    onboardingLede:
      'Just two things before your first firmament: your sign and what time you want your reminder.',
    onboardingSignQuestion: "What's your sign?",
    onboardingTimeQuestion: 'When do you want your reminder?',
    onboardingNicknameQuestion: 'What should we call you?',
    onboardingPrivacy:
      'This is saved only on your phone. You can delete it anytime from Settings.',
    onboardingCta: 'Begin my ritual',
    onboardingSaving: 'Saving…',
    optional: '(optional)',
    nicknamePlaceholder: 'Your name',
    languageLabel: 'Language',
    languageSpanish: 'Español',
    languageEnglish: 'English',

    // Home
    greetingWithName: 'Hi, {{name}}',
    greetingNoName: 'Hi again',
    noContentFallback:
      "We couldn't find your astrology reading today. Try again tomorrow.",
    todayPreview: 'Today: {{label}}',
    moodButtonEdit: "Edit today's mood",
    moodButtonNew: "Log today's mood",
    firmamentLink: 'View my personal firmament',

    // Mood
    moodEyebrowEdit: 'Edit your day',
    moodEyebrowNew: 'Your day today',
    moodTitle: 'How are you feeling?',
    moodLede: 'Choose a color. It will join your personal firmament.',
    moodNoteLabel: 'A note',
    moodNotePlaceholder: 'Anything you want to remember about today?',
    save: 'Save',
    saving: 'Saving…',

    // Firmament
    back: '‹ Back',
    firmamentTitle: 'Your firmament',
    loading: 'Loading…',
    nightsRegisteredOne: '1 night logged',
    nightsRegisteredMany: '{{count}} nights logged',
    chooseYear: 'Choose a year',
    noNoteThatDay: 'No note that day.',
    close: 'Close',

    // Settings
    settingsTitle: 'Settings',
    sectionAccount: 'My account',
    sectionSign: 'Your sign',
    sectionPhraseReminder: 'Reminder for your daily reading',
    sectionMoodReminder: 'Mood reminder',
    moodReminderSwitchLabel: 'Get a reminder to log my mood',
    saveChanges: 'Save changes',
    sectionPrivacy: 'Privacy and data',
    privacyBody:
      "Everything you log (profile, mood, settings) is saved only on this phone. Lumma has no accounts or server: none of this ever leaves your device.",
    wipeButton: 'Delete all my data',
    wipeAlertTitle: 'Delete all my data',
    wipeAlertMessage:
      'This deletes your profile, mood entries, and settings from this phone. This cannot be undone.',
    wipeAlertCancel: 'Cancel',
    wipeAlertConfirm: 'Delete everything',

    // Notifications
    notifPhraseTitle: "{{sign}} · your reading for today",
    notifPhraseChannelName: 'Daily reading',
    notifMoodChannelName: 'Mood reminder',
    notifMoodTitle: 'Your daily ritual',
    notifMoodBody: 'How do you feel today? Log your mood in Lumma.',
  },
} satisfies Record<Language, Record<string, string>>;

export type StringKey = keyof typeof STRINGS.es;
