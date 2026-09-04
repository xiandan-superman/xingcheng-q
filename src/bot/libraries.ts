/**
 * Deux bibliotheques coexistent volontairement :
 * - `BLOUB_STATES` conserve les animations mesurees sur la reference originale ;
 * - `STATES` porte l'interpretation de marque utilisee par Xingcheng Q.
 *
 * La bibliotheque Bloub reste executable et importable pour comparer les deux
 * versions ou reconstruire les actifs originaux sans revenir dans l'historique Git.
 */
export {
  BLOUB_STATES,
  BLOUB_STATE_BY_ID,
  BLOUB_POSES,
  BLOUB_SEQUENCE
} from './bloub-states'
export { STATES as XINGCHENG_STATES, STATE_BY_ID as XINGCHENG_STATE_BY_ID } from './states'
