import * as turf from '@turf/turf';
import type { DistrictWeather } from './weatherService';

// Types from database schema
export type SOSPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DuplicateStatus = 'UNIQUE' | 'PROBABLE_DUPLICATE' | 'CONFIRMED_DUPLICATE' | 'RELATED_INCIDENT';

export interface SOSEvent {
  id: string; // from sos_events sosId or real UUID
  lat: number;
  lng: number;
  timestamp: string;
  deviceIdentifier?: string;
  message?: string;
  duplicateStatus?: DuplicateStatus;
  clusterId?: string;
  clientIncidentId?: string;
  isCancellation?: boolean;
}

export interface ClusterInfo {
  clusterId: string;
  center: [number, number];
  radiusKm: number;
  sosList: SOSEvent[];
  uniqueCount: number;
  duplicateCount: number;
  velocityLast15Min: number;
  priority: SOSPriority;
  thresholdReached: boolean;
}

// ---------------------------------------------------------
// PHASE 6 & 7: Duplicate SOS Detection Engine (Deterministic)
// ---------------------------------------------------------
export const DUPLICATE_RADIUS_KM = 0.5; // 500 meters
export const DUPLICATE_TIME_MINUTES = 30; // 30 minutes

export function detectDuplicateSOS(newSos: SOSEvent, existingSosList: SOSEvent[]): { status: DuplicateStatus, explanation: string } {
  const newPoint = turf.point([newSos.lng, newSos.lat]);
  const newTime = new Date(newSos.timestamp).getTime();

  for (const existing of existingSosList) {
    if (existing.id === newSos.id) continue;

    // 1. Session ID Match = RELATED INCIDENT (or duplicate if rapid)
    if (newSos.clientIncidentId && existing.clientIncidentId === newSos.clientIncidentId) {
      if (newSos.isCancellation) {
         return { status: 'UNIQUE', explanation: 'User cancelled the distress signal.' };
      }
      return { status: 'CONFIRMED_DUPLICATE', explanation: `Multiple rapid SOS button taps linked to session ${newSos.clientIncidentId}` };
    }

    // 2. Same Device within time window = CONFIRMED DUPLICATE
    if (newSos.deviceIdentifier && existing.deviceIdentifier === newSos.deviceIdentifier) {
      const existingTime = new Date(existing.timestamp).getTime();
      const diffMinutes = Math.abs(newTime - existingTime) / (1000 * 60);
      if (diffMinutes <= DUPLICATE_TIME_MINUTES) {
        return { status: 'CONFIRMED_DUPLICATE', explanation: `Same device transmitted within ${DUPLICATE_TIME_MINUTES} mins` };
      }
    }

    // 2. Spatial & Temporal Proximity = PROBABLE DUPLICATE
    const existingPoint = turf.point([existing.lng, existing.lat]);
    const distanceKm = turf.distance(newPoint, existingPoint, { units: 'kilometers' });
    
    const existingTime = new Date(existing.timestamp).getTime();
    const diffMinutes = Math.abs(newTime - existingTime) / (1000 * 60);

    if (distanceKm <= DUPLICATE_RADIUS_KM && diffMinutes <= DUPLICATE_TIME_MINUTES) {
      // Very close in both space and time -> Probable Duplicate
      return { status: 'PROBABLE_DUPLICATE', explanation: `SOS generated within ${distanceKm.toFixed(2)}km and ${diffMinutes.toFixed(1)} mins of incident #${existing.id.slice(0, 8)}` };
    }
    
    // 3. Same location cluster, slightly longer time -> RELATED INCIDENT
    if (distanceKm <= DUPLICATE_RADIUS_KM * 2 && diffMinutes <= DUPLICATE_TIME_MINUTES * 4) {
      return { status: 'RELATED_INCIDENT', explanation: `Related to nearby incident #${existing.id.slice(0, 8)}` };
    }
  }

  return { status: 'UNIQUE', explanation: 'First SOS recorded at this location/time.' };
}


// ---------------------------------------------------------
// PHASE 11, 31, 32: Emergency Priority Engine
// ---------------------------------------------------------
export function calculateEmergencyPriority(
  sosStatus: DuplicateStatus, 
  weather: DistrictWeather | null | 'UNAVAILABLE', 
  clusterUniqueCount: number,
  hasMedicalEmergency: boolean = false,
  aiUnavailable: boolean = false
): { priority: SOSPriority | 'WEATHER VERIFICATION PENDING', reasons: string[], aiFallbackActive: boolean } {
  let score = 0;
  const reasons: string[] = [];

  if (aiUnavailable) {
    reasons.push('⚠️ AI ANALYSIS UNAVAILABLE. FALLBACK RULE ENGINE ACTIVE.');
  }

  // 1. Validity / Duplicate Status
  if (sosStatus === 'CONFIRMED_DUPLICATE') {
    return { priority: 'LOW', reasons: ['Confirmed Duplicate - Auto-demoted'], aiFallbackActive: aiUnavailable };
  } else if (sosStatus === 'PROBABLE_DUPLICATE') {
    score += 1;
    reasons.push('Probable duplicate of existing incident (+1)');
  } else {
    score += 3;
    reasons.push('Verified Unique Incident (+3)');
  }

  // 2. Weather & Disaster Alerts
  if (weather === 'UNAVAILABLE') {
    reasons.push('⚠️ WEATHER STATUS: UNAVAILABLE');
    return { priority: 'WEATHER VERIFICATION PENDING', reasons, aiFallbackActive: aiUnavailable };
  } else if (weather) {
    if (weather.cycloneRiskLevel === 'EMERGENCY_RED' || weather.cycloneRiskLevel === 'WARNING') {
      score += 4;
      reasons.push(`Severe Weather Alert: ${weather.cycloneRiskLevel} (+4)`);
    } else if (weather.cycloneRiskLevel === 'WATCH') {
      score += 2;
      reasons.push(`Weather Watch Active (+2)`);
    }
    
    // Normal weather doesn't subtract points. It just adds 0.
    if (weather.temp > 45 || weather.temp < 5) {
      score += 2;
      reasons.push('Extreme Temperature Danger (+2)');
    }
  }

  // 3. Cluster Density
  if (clusterUniqueCount >= 50) {
    score += 10; // Instantly critical
    reasons.push(`50-SOS Area Threshold Reached: ${clusterUniqueCount} unique SOS (+10)`);
  } else if (clusterUniqueCount >= 20) {
    score += 5;
    reasons.push(`High concentration area (${clusterUniqueCount} unique SOS) (+5)`);
  } else if (clusterUniqueCount >= 5) {
    score += 2;
    reasons.push(`Growing hotspot (${clusterUniqueCount} unique SOS) (+2)`);
  }

  // 4. Medical
  if (hasMedicalEmergency) {
    score += 3;
    reasons.push('Medical Emergency Flagged (+3)');
  }

  // Final Classification
  let priority: SOSPriority = 'LOW';
  if (score >= 10) priority = 'CRITICAL';
  else if (score >= 6) priority = 'HIGH';
  else if (score >= 3) priority = 'MEDIUM';

  return { priority, reasons, aiFallbackActive: aiUnavailable };
}

// ---------------------------------------------------------
// PHASE 5, 12, 13, 14: Cluster Hotspots & Threshold Analysis
// ---------------------------------------------------------
export const THRESHOLD_COUNT = 50;

export function analyzeClusters(sosList: SOSEvent[], existingIncidents: any[] = []): ClusterInfo[] {
  const clusters: ClusterInfo[] = [];
  const processed = new Set<string>();

  const now = Date.now();

  for (let i = 0; i < sosList.length; i++) {
    const current = sosList[i];
    if (processed.has(current.id)) continue;

    const cluster: ClusterInfo = {
      clusterId: `CLUSTER-${current.id}`,
      center: [current.lng, current.lat],
      radiusKm: 5.0, // 5km cluster radius for hotspot area
      sosList: [current],
      uniqueCount: (current.duplicateStatus === 'UNIQUE' || !current.duplicateStatus) ? 1 : 0,
      duplicateCount: (current.duplicateStatus === 'CONFIRMED_DUPLICATE' || current.duplicateStatus === 'PROBABLE_DUPLICATE') ? 1 : 0,
      velocityLast15Min: 0,
      priority: 'LOW',
      thresholdReached: false
    };

    processed.add(current.id);
    const centerPoint = turf.point(cluster.center);

    // Check velocity for the first SOS
    const timeDiffMins = (now - new Date(current.timestamp).getTime()) / (1000 * 60);
    if (timeDiffMins <= 15) cluster.velocityLast15Min++;

    // Find all nearby SOS to form cluster
    for (let j = i + 1; j < sosList.length; j++) {
      const neighbor = sosList[j];
      if (processed.has(neighbor.id)) continue;

      const neighborPoint = turf.point([neighbor.lng, neighbor.lat]);
      const distance = turf.distance(centerPoint, neighborPoint, { units: 'kilometers' });

      if (distance <= cluster.radiusKm) {
        cluster.sosList.push(neighbor);
        processed.add(neighbor.id);

        if (neighbor.duplicateStatus === 'UNIQUE' || !neighbor.duplicateStatus) {
          cluster.uniqueCount++;
        } else if (neighbor.duplicateStatus === 'CONFIRMED_DUPLICATE' || neighbor.duplicateStatus === 'PROBABLE_DUPLICATE') {
          cluster.duplicateCount++;
        }

        const nTimeDiffMins = (now - new Date(neighbor.timestamp).getTime()) / (1000 * 60);
        if (nTimeDiffMins <= 15) cluster.velocityLast15Min++;
      }
    }

    const existingMatch = existingIncidents.find(inc => inc.id === cluster.clusterId);
    if (existingMatch && existingMatch.threshold_reached) {
      cluster.thresholdReached = true;
    } else {
      cluster.thresholdReached = cluster.uniqueCount >= THRESHOLD_COUNT;
    }
    clusters.push(cluster);
  }

  // Calculate highest priority per cluster
  clusters.forEach(c => {
    // simplified for the array
    if (c.uniqueCount >= THRESHOLD_COUNT) c.priority = 'CRITICAL';
    else if (c.uniqueCount >= 20) c.priority = 'HIGH';
    else if (c.uniqueCount >= 5) c.priority = 'MEDIUM';
    else c.priority = 'LOW';
  });

  // Sort descending by uniqueCount
  return clusters.sort((a, b) => b.uniqueCount - a.uniqueCount);
}
