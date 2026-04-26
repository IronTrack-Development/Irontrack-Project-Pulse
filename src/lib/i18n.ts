export type Language = 'en' | 'es';

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem('pulse_language') as Language) || 'en';
}

export function setLanguage(lang: Language) {
  localStorage.setItem('pulse_language', lang);
}

// Translation dictionary — start with common UI strings
// Components call t('key') to get the translated string
const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.schedule': { en: 'Schedule', es: 'Cronograma' },
  'nav.fieldOps': { en: 'Field Ops', es: 'Ops de Campo' },
  'nav.coordination': { en: 'Coordination', es: 'Coordinación' },
  'nav.documents': { en: 'Documents', es: 'Documentos' },
  'nav.money': { en: 'Money', es: 'Dinero' },
  'nav.safety': { en: 'Safety', es: 'Seguridad' },
  'nav.project': { en: 'Project', es: 'Proyecto' },
  'nav.subOps': { en: 'Sub Ops', es: 'Ops de Sub' },
  
  // Common actions
  'action.save': { en: 'Save', es: 'Guardar' },
  'action.cancel': { en: 'Cancel', es: 'Cancelar' },
  'action.delete': { en: 'Delete', es: 'Eliminar' },
  'action.edit': { en: 'Edit', es: 'Editar' },
  'action.add': { en: 'Add', es: 'Agregar' },
  'action.back': { en: 'Back', es: 'Atrás' },
  'action.refresh': { en: 'Refresh', es: 'Actualizar' },
  'action.search': { en: 'Search', es: 'Buscar' },
  'action.filter': { en: 'Filter', es: 'Filtrar' },
  'action.export': { en: 'Export', es: 'Exportar' },
  'action.print': { en: 'Print', es: 'Imprimir' },
  
  // Statuses
  'status.open': { en: 'Open', es: 'Abierto' },
  'status.resolved': { en: 'Resolved', es: 'Resuelto' },
  'status.pending': { en: 'Pending', es: 'Pendiente' },
  'status.completed': { en: 'Completed', es: 'Completado' },
  'status.inProgress': { en: 'In Progress', es: 'En Progreso' },
  'status.draft': { en: 'Draft', es: 'Borrador' },
  'status.cancelled': { en: 'Cancelled', es: 'Cancelado' },
  'status.active': { en: 'Active', es: 'Activo' },
  'status.inactive': { en: 'Inactive', es: 'Inactivo' },
  
  // Sub Ops — Dispatch
  'dispatch.title': { en: 'Morning Dispatch', es: 'Despacho Matutino' },
  'dispatch.scopeOfWork': { en: 'Scope of Work', es: 'Alcance del Trabajo' },
  'dispatch.priorityNotes': { en: 'Priority Notes', es: 'Notas de Prioridad' },
  'dispatch.safetyFocus': { en: 'Safety Focus', es: 'Enfoque de Seguridad' },
  'dispatch.materialNotes': { en: 'Material Notes', es: 'Notas de Material' },
  'dispatch.crewSize': { en: 'Crew Size', es: 'Tamaño de Cuadrilla' },
  'dispatch.acknowledged': { en: 'Acknowledged', es: 'Recibido' },
  'dispatch.sendDispatch': { en: 'Send Dispatch', es: 'Enviar Despacho' },
  
  // Sub Ops — Check-in
  'checkin.title': { en: 'Daily Check-In', es: 'Registro Diario' },
  'checkin.crewCount': { en: 'Crew Count', es: 'Cantidad de Personal' },
  'checkin.hoursWorked': { en: 'Hours Worked', es: 'Horas Trabajadas' },
  'checkin.sitePhoto': { en: 'Site Photo', es: 'Foto del Sitio' },
  'checkin.checkIn': { en: 'Check In', es: 'Registrarse' },
  
  // Sub Ops — Production
  'production.title': { en: 'Production Log', es: 'Registro de Producción' },
  'production.whatCompleted': { en: 'What did you complete?', es: '¿Qué completaste?' },
  'production.quantity': { en: 'Quantity', es: 'Cantidad' },
  'production.unit': { en: 'Unit', es: 'Unidad' },
  
  // Sub Ops — Blockers
  'blocker.title': { en: 'Report Blocker', es: 'Reportar Bloqueo' },
  'blocker.description': { en: 'Description', es: 'Descripción' },
  'blocker.impact': { en: 'Impact', es: 'Impacto' },
  'blocker.category': { en: 'Category', es: 'Categoría' },
  
  // Safety
  'safety.toolboxTalks': { en: 'Toolbox Talks', es: 'Charlas de Seguridad' },
  'safety.newTalk': { en: 'New Talk', es: 'Nueva Charla' },
  'safety.attendance': { en: 'Attendance', es: 'Asistencia' },
  'safety.presenter': { en: 'Presenter', es: 'Presentador' },
  'safety.talkingPoints': { en: 'Talking Points', es: 'Puntos de Discusión' },
  
  // Settings
  'settings.title': { en: 'Settings', es: 'Configuración' },
  'settings.theme': { en: 'Theme', es: 'Tema' },
  'settings.dark': { en: 'Dark', es: 'Oscuro' },
  'settings.light': { en: 'Light', es: 'Claro' },
  'settings.language': { en: 'Language', es: 'Idioma' },
  'settings.english': { en: 'English', es: 'Inglés' },
  'settings.spanish': { en: 'Spanish', es: 'Español' },
  'settings.appearance': { en: 'Appearance', es: 'Apariencia' },
  'settings.about': { en: 'About', es: 'Acerca de' },
  'settings.company': { en: 'Company', es: 'Empresa' },
  'settings.fieldNote': { en: 'Field-facing features will display in selected language', es: 'Las funciones de campo se mostrarán en el idioma seleccionado' },
  
  // Handoffs
  'handoff.title': { en: 'Handoff Tracker', es: 'Seguimiento de Entregas' },
  'handoff.readyForHandoff': { en: 'Ready for Handoff', es: 'Listo para Entrega' },
  'handoff.accepted': { en: 'Accepted', es: 'Aceptado' },
  'handoff.issueFlagged': { en: 'Issue Flagged', es: 'Problema Señalado' },
  'handoff.department': { en: 'Department', es: 'Departamento' },
  'handoff.area': { en: 'Area', es: 'Área' },
  'handoff.checklist': { en: 'Checklist', es: 'Lista de Verificación' },
};

export function t(key: string, lang?: Language): string {
  const l = lang || getLanguage();
  return translations[key]?.[l] || translations[key]?.['en'] || key;
}

// Hook for React components
export function useTranslation() {
  const lang = getLanguage();
  return {
    t: (key: string) => t(key, lang),
    lang,
  };
}
