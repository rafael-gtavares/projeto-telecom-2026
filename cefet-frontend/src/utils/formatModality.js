export const MODALITY_LABELS = {
  presencial: 'Presencial',
  ead: 'EAD',
  semi_presencial: 'Semi-presencial',
  palestra: 'Palestra',
  workshop: 'Workshop',
  outro: 'Outro',
}

export const formatModality = (modality) =>
  MODALITY_LABELS[modality] || 'A definir'
