export type FormationKey = '4-4-2' | '4-2-3-1' | '4-3-3' | '3-5-2' | '5-3-2';

export const formationMap: Record<FormationKey, { x: number; y: number; role: 'GK'|'DF'|'MF'|'FW' }[]> = {
  '4-4-2': [
    {x:50,y:94,role:'GK'},
    {x:15,y:75,role:'DF'},{x:35,y:78,role:'DF'},{x:65,y:78,role:'DF'},{x:85,y:75,role:'DF'},
    {x:18,y:55,role:'MF'},{x:38,y:58,role:'MF'},{x:62,y:58,role:'MF'},{x:82,y:55,role:'MF'},
    {x:35,y:35,role:'FW'},{x:65,y:35,role:'FW'},
  ],
  '4-2-3-1': [
    {x:50,y:94,role:'GK'},
    {x:15,y:75,role:'DF'},{x:35,y:78,role:'DF'},{x:65,y:78,role:'DF'},{x:85,y:75,role:'DF'},
    {x:40,y:63,role:'MF'},{x:60,y:63,role:'MF'},
    {x:25,y:45,role:'MF'},{x:50,y:40,role:'MF'},{x:75,y:45,role:'MF'},
    {x:50,y:28,role:'FW'},
  ],
  '4-3-3': [
    {x:50,y:94,role:'GK'},
    {x:15,y:75,role:'DF'},{x:35,y:78,role:'DF'},{x:65,y:78,role:'DF'},{x:85,y:75,role:'DF'},
    {x:30,y:60,role:'MF'},{x:50,y:58,role:'MF'},{x:70,y:60,role:'MF'},
    {x:25,y:35,role:'FW'},{x:50,y:30,role:'FW'},{x:75,y:35,role:'FW'},
  ],
  '3-5-2': [
    {x:50,y:94,role:'GK'},
    {x:25,y:78,role:'DF'},{x:50,y:78,role:'DF'},{x:75,y:78,role:'DF'},
    {x:15,y:60,role:'MF'},{x:35,y:63,role:'MF'},{x:50,y:55,role:'MF'},{x:65,y:63,role:'MF'},{x:85,y:60,role:'MF'},
    {x:40,y:35,role:'FW'},{x:60,y:35,role:'FW'},
  ],
  '5-3-2': [
    {x:50,y:94,role:'GK'},
    {x:10,y:75,role:'DF'},{x:30,y:78,role:'DF'},{x:50,y:80,role:'DF'},{x:70,y:78,role:'DF'},{x:90,y:75,role:'DF'},
    {x:35,y:60,role:'MF'},{x:50,y:55,role:'MF'},{x:65,y:60,role:'MF'},
    {x:40,y:35,role:'FW'},{x:60,y:35,role:'FW'},
  ],
};